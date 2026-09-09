const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diamond-v2-tests-'));
function compile(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) compile(file);
    else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const target = path.join(dir, path.relative(path.resolve('src'), file).replace(/\.tsx?$/, '.js'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(
        target,
        ts.transpileModule(fs.readFileSync(file, 'utf8'), {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
          },
        }).outputText
      );
    }
  }
}
compile(path.resolve('src'));
fs.symlinkSync(path.resolve('node_modules'), path.join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');

const { EQUIPMENT_CATALOG, getEffectiveStat } = require(path.join(dir, 'types/equipment.js'));
const { normalizePlayer, overallRating } = require(path.join(dir, 'data/playerDevelopment.js'));
const { buildBondProfiles, scoreToStage } = require(path.join(dir, 'types/relationship.js'));
const { getOutdoorLocations } = require(path.join(dir, 'types/outdoorMap.js'));
const { POSITION_LABELS } = require(path.join(dir, 'types/index.js'));

test('Position labels mapping is complete and Koreanized', () => {
  assert.equal(POSITION_LABELS.P, '투수');
  assert.equal(POSITION_LABELS.TwoWay, '투타겸업');
  assert.equal(POSITION_LABELS.C, '포수');
  assert.equal(POSITION_LABELS.SS, '유격수');
});

test('Equipment catalog contains all 7 slots and bonuses affect getEffectiveStat and overallRating', () => {
  const slots = new Set(EQUIPMENT_CATALOG.map(e => e.slot));
  assert.ok(slots.has('bat'));
  assert.ok(slots.has('glove'));
  assert.ok(slots.has('catcherGear'));
  assert.ok(slots.has('spikes'));
  assert.ok(slots.has('trainingGear'));
  assert.ok(slots.has('protectiveGear'));
  assert.ok(slots.has('accessory'));

  // Base player with power 20
  const basePlayer = normalizePlayer({
    name: '테스트',
    gender: 'male',
    age: 16,
    position: '1B',
    status: 'HighSchool',
    uniformNumber: 10,
    highSchool: '덕수고',
    handedness: 'R/R',
    pitchingForm: 'None',
    pitcherRole: 'None',
    battingForm: 'Straight',
    overall: 20,
    potential: 80,
    contact: 20,
    power: 20,
    eye: 20,
    speed: 20,
    defense: 20,
    stuff: 20,
    control: 20,
    stamina: 20,
    condition: 100,
    academics: 50,
    relationshipFamily: 20,
    relationshipFriends: 15,
    relationshipTeam: 10,
    relationshipCoach: 10,
    equippedItems: {},
  });

  const baseOvr = overallRating(basePlayer);
  assert.equal(getEffectiveStat(basePlayer, 'power'), 20);

  // Find a high-tier bat with power bonus
  const proBat = EQUIPMENT_CATALOG.find(e => e.slot === 'bat' && e.tier === '프로' && (e.bonuses.power || 0) > 0);
  assert.ok(proBat);

  const equippedPlayer = {
    ...basePlayer,
    equippedItems: { bat: proBat.id },
  };

  const effectivePower = getEffectiveStat(equippedPlayer, 'power');
  assert.equal(effectivePower, 20 + proBat.bonuses.power);
  assert.ok(overallRating(equippedPlayer) >= baseOvr);
});

test('Relationship system starts at Stage 1 (<35) and branches romance targets by gender', () => {
  const malePlayer = {
    gender: 'male',
    grade: 1,
    relationshipFamily: 20,
    relationshipFriends: 15,
    relationshipTeam: 10,
    relationshipCoach: 10,
  };
  const femalePlayer = {
    gender: 'female',
    grade: 1,
    relationshipFamily: 20,
    relationshipFriends: 15,
    relationshipTeam: 10,
    relationshipCoach: 10,
  };

  const maleBonds = buildBondProfiles(malePlayer);
  const femaleBonds = buildBondProfiles(femalePlayer);

  // Verify all bonds start at Stage 1
  for (const b of maleBonds) {
    assert.equal(scoreToStage(b.score), 1, `Male bond ${b.name} should start at stage 1`);
    assert.equal(b.stageLabels.length, 5, `${b.name} must have 5 custom stage labels`);
  }

  // Male player romance targets: 한서윤 & 윤하린
  const seoyoonMale = maleBonds.find(b => b.id === 'childhood');
  const harinMale = maleBonds.find(b => b.id === 'deskmate');
  const dohyunMale = maleBonds.find(b => b.id === 'peer');
  assert.equal(seoyoonMale.romanceable, true);
  assert.equal(harinMale.romanceable, true);
  assert.equal(dohyunMale.romanceable, false);

  // Female player romance targets: 이도현 & 강민준
  const dohyunFemale = femaleBonds.find(b => b.id === 'peer');
  const minjunFemale = femaleBonds.find(b => b.id === 'senior');
  const seoyoonFemale = femaleBonds.find(b => b.id === 'childhood');
  assert.equal(dohyunFemale.romanceable, true);
  assert.equal(minjunFemale.romanceable, true);
  assert.equal(seoyoonFemale.romanceable, false);
});

test('Outdoor locations provide rich landmarks for regions and fallbacks', () => {
  const seoulLocs = getOutdoorLocations('서울');
  assert.ok(seoulLocs.length >= 7);
  assert.ok(seoulLocs.some(l => l.id === 'jamsil'));
  assert.ok(seoulLocs.some(l => l.id === 'goods'));

  const gyeonggiIncheon = getOutdoorLocations('경기/인천');
  assert.ok(gyeonggiIncheon.length >= 6);

  const fallback = getOutdoorLocations('가상지역');
  assert.ok(fallback.length >= 5);
  assert.ok(fallback.some(l => l.id === 'goods'));
});

process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));

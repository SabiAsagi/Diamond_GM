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

const { EQUIPMENT_CATALOG, getEffectiveStat, getRelevantSlots, getRelevantGloveCategory, isEquipmentRelevant, SHOP_TIERS, EQUIPMENT_STAT_LABELS } = require(path.join(dir, 'types/equipment.js'));
const { normalizePlayer, overallRating } = require(path.join(dir, 'data/playerDevelopment.js'));
const { buildBondProfiles, scoreToStage, getTrainingEfficiencyMultiplier } = require(path.join(dir, 'types/relationship.js'));
const { getOutdoorLocations } = require(path.join(dir, 'types/outdoorMap.js'));
const { INITIAL_RELATIONSHIPS } = require(path.join(dir, 'types/bondScores.js'));
const { POSITION_LABELS } = require(path.join(dir, 'types/index.js'));

test('주요 포지션 이름을 한글로 표시한다', () => {
  assert.equal(POSITION_LABELS.P, '투수');
  assert.equal(POSITION_LABELS.TwoWay, '투타겸업');
  assert.equal(POSITION_LABELS.C, '포수');
  assert.equal(POSITION_LABELS.SS, '유격수');
});

test('장비 8개 슬롯이 존재하고 장착 보너스가 능력치와 종합에 반영된다', () => {
  const slots = new Set(EQUIPMENT_CATALOG.map(e => e.slot));
  assert.ok(slots.has('bat'));
  assert.ok(slots.has('glove'));
  assert.ok(slots.has('catcherGear'));
  assert.ok(slots.has('spikes'));
  assert.ok(slots.has('trainingGear'));
  assert.ok(slots.has('protectiveGear'));
  assert.ok(slots.has('accessory'));
  assert.ok(slots.has('baseRunningGloves'));
  assert.equal(slots.size, 8);

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
    relationships: { ...INITIAL_RELATIONSHIPS },
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
  assert.ok(overallRating(equippedPlayer) > baseOvr);
});

test('상점 등급·장비 한글명·포지션별 슬롯과 글러브 제한을 유지한다', () => {
  assert.deepEqual(SHOP_TIERS.map(s => s.id), ['basic', 'premium']);
  assert.equal(EQUIPMENT_STAT_LABELS.contact, '컨택');
  assert.equal(EQUIPMENT_STAT_LABELS.control, '제구');
  assert.ok(getRelevantSlots('P').includes('glove'));
  assert.ok(!getRelevantSlots('P').includes('bat'));
  assert.ok(getRelevantSlots('C').includes('catcherGear'));
  assert.ok(getRelevantSlots('SS').includes('baseRunningGloves'));
  assert.equal(getRelevantGloveCategory('1B'), 'firstBase');
  assert.equal(getRelevantGloveCategory('CF'), 'outfield');
  const pitcherGlove = EQUIPMENT_CATALOG.find(e => e.slot === 'glove' && e.gloveCategory === 'pitcher');
  assert.ok(pitcherGlove);
  assert.ok(isEquipmentRelevant({ position: 'P' }, pitcherGlove));
  assert.ok(!isEquipmentRelevant({ position: 'SS' }, pitcherGlove));
});

test('개별 감독·동기 인연 단계에 따라 훈련 배율이 합산된다', () => {
  const multiplier = (coach, peer, other = 10) => getTrainingEfficiencyMultiplier({
    relationships: { ...INITIAL_RELATIONSHIPS, coach, peer, senior: other, coach2: other },
  });
  assert.equal(multiplier(10, 10), 1);
  assert.equal(multiplier(34, 89), 1);
  assert.equal(multiplier(35, 89), 1.03);
  assert.equal(multiplier(89, 89), 1.03);
  assert.equal(multiplier(90, 10), 1.08);
  assert.equal(multiplier(10, 90), 1.10);
  assert.equal(multiplier(90, 90), 1.18);
  assert.equal(multiplier(10, 10, 100), 1, '선배·기술 코치 점수는 감독·동기 배율에 섞이지 않는다');
});

test('초기 인연은 1단계이고 네 로맨스 대상은 선수 성별과 무관하다', () => {
  const expectedRomance = ['childhood', 'deskmate', 'peer', 'senior'];
  for (const gender of ['male', 'female']) {
    const bonds = buildBondProfiles({ gender, grade: 1, relationships: { ...INITIAL_RELATIONSHIPS } });
    for (const bond of bonds) {
      assert.equal(bond.score, INITIAL_RELATIONSHIPS[bond.id], `${gender}: ${bond.id} 개별 초기 점수`);
      assert.equal(scoreToStage(bond.score), 1, `${gender}: ${bond.id} 초기 단계`);
      assert.equal(bond.stageLabels.length, 5);
    }
    assert.deepEqual(bonds.filter(b => b.romanceable).map(b => b.id).sort(), expectedRomance);
    assert.ok(!bonds.some(b => b.id === 'junior'), '1학년에게는 후배가 노출되지 않는다');
    const laterBonds = buildBondProfiles({ gender, grade: 2, relationships: { ...INITIAL_RELATIONSHIPS } });
    assert.equal(laterBonds.length, 13);
    assert.ok(laterBonds.some(b => b.id === 'junior'));
  }
});

test('지역별 외출 명소와 미등록 지역 대체 장소를 제공한다', () => {
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

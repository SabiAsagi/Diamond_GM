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

const { generateCast, getBondName, personalizeText, DEFAULT_CAST, CAST_IDS } = require(path.join(dir, 'data/cast.js'));
const { formatBondChanges, BOND_NAMES } = require(path.join(dir, 'types/bondScores.js'));
const { HIGH_SCHOOLS_DATA } = require(path.join(dir, 'data/highSchools.js'));
const { SUB_ACTIVITY_POOL } = require(path.join(dir, 'types/activity.js'));
const { CUTSCENE_EVENTS_POOL } = require(path.join(dir, 'data/cutsceneEvents.js'));
const REGIONS = [...new Set(HIGH_SCHOOLS_DATA.map(s => s.region))];

function seeded(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
const castPlayer = { name: '김선수', gender: 'male', appearance: { hairStyleId: 'male_spiky' }, highSchool: HIGH_SCHOOLS_DATA[0].name };

test('회차별 인물: 이름·성별·외모가 무작위로 정해지고 서로·선수와 겹치지 않는다', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const cast = generateCast(castPlayer, HIGH_SCHOOLS_DATA, seeded(seed));
    assert.deepEqual(Object.keys(cast).sort(), [...CAST_IDS].sort());
    const names = CAST_IDS.map(id => cast[id].name);
    assert.equal(new Set(names).size, 7, `이름 중복 (seed ${seed})`);
    assert.equal(new Set(names.map(n => n.slice(1))).size, 7, `성을 뺀 이름 중복 (seed ${seed})`);
    assert.ok(!names.includes(castPlayer.name), '선수 이름과 중복');
    const team = ['senior', 'peer', 'rival', 'junior'].map(id => cast[id]);
    for (const member of team) {
      assert.equal(member.portrait.kind, 'preset');
      assert.ok(member.portrait.appearance.hairStyleId.startsWith(`${member.gender}_`), '성별과 얼굴 불일치');
    }
    const faces = team.map(m => m.portrait.appearance.hairStyleId);
    assert.equal(new Set(faces).size, 4, '야구부 인물 얼굴 중복');
    assert.ok(!faces.includes('male_spiky'), '선수와 같은 얼굴');
    assert.equal(cast.senior.portrait.schoolName, castPlayer.highSchool);
    assert.notEqual(cast.rival.portrait.schoolName, castPlayer.highSchool, '라이벌은 다른 학교 유니폼');
    assert.equal(HIGH_SCHOOLS_DATA.find(s => s.name === cast.rival.portrait.schoolName)?.region, HIGH_SCHOOLS_DATA[0].region, '라이벌은 같은 시·도 학교·팀 소속');
    const friends = ['childhood', 'neighbor', 'deskmate'].map(id => cast[id]);
    assert.ok(friends.every(m => m.portrait.kind === 'image'));
    assert.equal(new Set(friends.map(m => m.portrait.src)).size, 3, '친구 일러스트 중복');
  }
  const casts = [1, 2, 3, 4, 5].map(seed => generateCast(castPlayer, HIGH_SCHOOLS_DATA, seeded(seed)));
  assert.ok(new Set(casts.map(c => c.peer.name)).size > 1, '회차마다 같은 동기 이름');
  assert.ok(new Set(casts.map(c => c.peer.gender + c.senior.gender + c.rival.gender + c.junior.gender)).size > 1, '회차마다 같은 성별 구성');
  assert.ok(new Set(casts.map(c => c.childhood.portrait.src)).size > 1, '회차마다 같은 소꿉친구 외모');
});

test('회차별 인물: 이전 저장본은 기존 인물을 유지하고, 새 회차는 이번 이름으로 표시된다', () => {
  const legacy = normalizePlayer({ id: 1, name: '예전선수', gender: 'male', position: 'P', relationships: { ...INITIAL_RELATIONSHIPS } });
  assert.equal(legacy.cast, undefined);
  assert.equal(getBondName(legacy, 'peer'), '이도현');
  assert.equal(getBondName(legacy, 'coach'), '야구부 감독');
  assert.ok(buildBondProfiles(legacy).some(p => p.name === '입학 동기 이도현'));
  assert.equal(DEFAULT_CAST.childhood.gender, 'female');

  const cast = generateCast(castPlayer, HIGH_SCHOOLS_DATA, seeded(7));
  const current = normalizePlayer({ ...legacy, cast });
  assert.ok(buildBondProfiles(current).some(p => p.name === `입학 동기 ${cast.peer.name}`));
  const rivalProfile = buildBondProfiles(current).find(p => p.id === 'rival');
  assert.equal(rivalProfile.name, `지역 라이벌 ${cast.rival.name}`);
  assert.equal(rivalProfile.role, `라이벌 · ${cast.rival.portrait.schoolName}`, '라이벌 소속 표시');
  assert.equal(buildBondProfiles(legacy).find(p => p.id === 'rival').role, '라이벌');
  assert.equal(formatBondChanges({ peer: 3, coach: 2 }), '{peer} 인연 +3 · 야구부 감독 인연 +2');
  assert.equal(personalizeText(formatBondChanges({ peer: 3 }), current), `${cast.peer.name} 인연 +3`);
});

test('회차별 인물: 이름 뒤 조사는 받침에 맞춰 고른다', () => {
  const withName = (peer, rival) => ({ cast: { ...DEFAULT_CAST, peer: { ...DEFAULT_CAST.peer, name: peer }, rival: { ...DEFAULT_CAST.rival, name: rival } } });
  const p = withName('김하준', '박수아');
  assert.equal(personalizeText('{peer|과} {rival|과}', p), '김하준과 박수아와');
  assert.equal(personalizeText('{peer|이} {rival|이}', p), '김하준이 박수아가');
  assert.equal(personalizeText('{peer|은} {rival|은}', p), '김하준은 박수아는');
  assert.equal(personalizeText('{peer|를} {rival|를}', p), '김하준을 박수아를');
  assert.equal(personalizeText('{peer}의 {rival}도', p), '김하준의 박수아도');
  assert.equal(personalizeText('{rival|과} 대결', null), '박태성과 대결', '플레이어가 없으면 기본 인물');
});

test('회차별 인물: 활동·이벤트·외출 문구에 기본 인물 이름이 직접 적혀 있지 않다', () => {
  const defaults = CAST_IDS.map(id => BOND_NAMES[id]);
  const texts = [
    ...Object.values(SUB_ACTIVITY_POOL).flat().flatMap(o => [o.label, o.description]),
    ...CUTSCENE_EVENTS_POOL.flatMap(e => [e.title, e.subtitle, e.speakerName, e.dialogue, ...(e.dialogueLines ?? []).map(l => l.text), ...(e.choices ?? []).flatMap(c => [c.label, c.response])]),
    ...REGIONS.flatMap(region => getOutdoorLocations(region).map(l => l.description)),
  ];
  for (const name of defaults) {
    const hit = texts.find(t => typeof t === 'string' && t.includes(name));
    assert.equal(hit, undefined, `기본 이름 "${name}"이 문구에 남아 있음: ${hit}`);
  }
  const cast = generateCast(castPlayer, HIGH_SCHOOLS_DATA, seeded(3));
  const arcade = SUB_ACTIVITY_POOL.relationship.find(o => o.id === 'rel_friends_arcade');
  assert.ok(personalizeText(arcade.label, { cast }).startsWith(`${cast.peer.name}·${cast.neighbor.name}`));
  const juniorScene = CUTSCENE_EVENTS_POOL.find(e => e.id === 'junior_advice');
  assert.equal(juniorScene.speakerId, 'junior');
  assert.equal(personalizeText(juniorScene.speakerName, { cast }), `후배 ${cast.junior.name}`);
});

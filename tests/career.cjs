const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diamond-tests-'));
function compile(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) compile(file);
    else if (file.endsWith('.ts')) {
      const target = path.join(
        dir,
        path.relative(path.resolve('src'), file).replace(/\.ts$/, '.js'),
      );
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(
        target,
        ts.transpileModule(fs.readFileSync(file, 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      );
    }
  }
}
compile(path.resolve('src'));
fs.copyFileSync('src/data/kbo2026.json', path.join(dir, 'data/kbo2026.json'));
fs.symlinkSync(
  path.resolve('node_modules'),
  path.join(dir, 'node_modules'),
  process.platform === 'win32' ? 'junction' : 'dir',
);
let saved;
require.cache[path.join(dir, 'db.js')] = {
  id: path.join(dir, 'db.js'),
  filename: path.join(dir, 'db.js'),
  loaded: true,
  exports: {
    db: {
      players: {
        put: async (p) => {
          saved = structuredClone(p);
        },
      },
    },
  },
};
const { HIGH_SCHOOLS_DATA } = require(path.join(dir, 'data/highSchools.js'));
const { generateSeasonMatches, progressTournament, advanceOtherTournamentMatches } = require(
  path.join(dir, 'types/tournament.js'),
);
const { normalizePlayer, trainPitch, overallRating } = require(
  path.join(dir, 'data/playerDevelopment.js'),
);
const { sampleSubActivities } = require(path.join(dir, 'types/activity.js'));
const { useGameClockStore } = require(path.join(dir, 'store/gameClockStore.js'));
const school = HIGH_SCHOOLS_DATA[0];
function player() {
  return normalizePlayer({
    id: 1,
    name: '검증선수',
    gender: 'male',
    age: 16,
    position: 'TwoWay',
    status: 'HighSchool',
    uniformNumber: 17,
    highSchool: school.name,
    handedness: 'R/R',
    pitchingForm: 'Overhand',
    pitcherRole: 'Starter',
    battingForm: 'Straight',
    overall: 20,
    potential: 80,
    stuff: 20,
    control: 20,
    stamina: 20,
    contact: 20,
    power: 20,
    eye: 20,
    speed: 20,
    defense: 20,
    condition: 100,
    academics: 50,
    relationshipFamily: 50,
    relationshipFriends: 50,
    relationshipTeam: 50,
    relationshipCoach: 50,
    gameDate: { year: 2026, month: 3, day: 3, weekday: 2, grade: 1 },
    currentSlot: 'afternoon',
  });
}
test('new pitch learns at 100 XP; remaining XP and ceiling are preserved', () => {
  let p = player();
  p.pitches = trainPitch(p, 'curve', 240);
  const c = p.pitches.find((x) => x.type === 'curve');
  assert.deepEqual(c, { type: 'curve', rating: 4, potential: 80, xp: 40 });
  p.pitches = [{ type: 'curve', rating: 79, potential: 80, xp: 90 }];
  assert.deepEqual(trainPitch(p, 'curve', 40)[0], {
    type: 'curve',
    rating: 80,
    potential: 80,
    xp: 0,
  });
});
test('64 teams progress through qualifiers to a unique champion, with no duplicate opponents', () => {
  let matches = generateSeasonMatches(2028, school, HIGH_SCHOOLS_DATA);
  let played = [];
  for (let i = 0; i < 8; i++) {
    const m = matches.find(
      (m) => m.tournamentId === 'emart_spring' && m.isPlayerTeamMatch && !m.result,
    );
    if (!m) break;
    played.push(m);
    const before = matches;
    matches = progressTournament(
      matches,
      { matchId: m.id, tournamentId: m.tournamentId, won: true },
      school,
      HIGH_SCHOOLS_DATA,
    );
    assert.deepEqual(
      progressTournament(
        matches,
        { matchId: m.id, tournamentId: m.tournamentId, won: true },
        school,
        [],
      ),
      matches,
    );
    assert.notDeepEqual(matches, before);
  }
  assert.deepEqual(
    played.map((m) => m.round),
    ['조 예선 1차전', '조 예선 결정전', '16강전', '8강전', '4강 준결승', '결승전'],
  );
  assert.equal(
    new Set(played.map((m) => (m.homeSchoolId === school.id ? m.awaySchoolId : m.homeSchoolId)))
      .size,
    6,
  );
  const final = played.at(-1);
  const result = matches.find((m) => m.id === final.id);
  assert.equal(result.result, final.homeSchoolId === school.id ? 'home' : 'away');
  assert.ok(matches.every((m) => m.year === undefined || m.year === 2028));
});
test('elimination prevents reentry; other schools finish only on scheduled dates', () => {
  let matches = generateSeasonMatches(2026, school, HIGH_SCHOOLS_DATA);
  const m = matches.find((m) => m.tournamentId === 'emart_spring' && m.isPlayerTeamMatch);
  matches = progressTournament(
    matches,
    { matchId: m.id, tournamentId: m.tournamentId, won: false },
    school,
    [],
  );
  assert.equal(
    matches.filter((x) => x.tournamentId === m.tournamentId && x.isPlayerTeamMatch).length,
    1,
  );
  assert.ok(!matches.some((x) => x.round === '결승전'));
  matches = advanceOtherTournamentMatches(
    matches,
    { year: 2026, month: 4, day: 30, weekday: 4, grade: 1 },
    school,
  );
  assert.equal(
    matches.filter((x) => x.tournamentId === m.tournamentId && x.round === '결승전' && x.result)
      .length,
    1,
  );
});
test('night training never includes scrimmages or new pitches', () => {
  for (let i = 0; i < 100; i++)
    assert.ok(
      sampleSubActivities('training', 100, 'TwoWay', 'night').every(
        (o) => o.id !== 'train_team_scrimmage' && !o.pitchTraining,
      ),
    );
});
test('store saves pitch growth, rejects wrong slots, resumes draws and pending event exactly once', async () => {
  const store = useGameClockStore;
  await store.getState().initClock(player());
  const original = structuredClone(store.getState().seasonMatches);
  await store.getState().selectActivity('night', 'training', 'pitch_curve');
  assert.equal(
    store.getState().player.pitches.some((x) => x.type === 'curve'),
    false,
  );
  await store.getState().selectActivity('afternoon', 'training', 'pitch_curve');
  assert.equal(saved.pitches.find((x) => x.type === 'curve').xp, 40);
  assert.equal(saved.currentSlot, 'night');
  if (store.getState().activeCutscene) await store.getState().resolveCutscene('learn');
  const p = structuredClone(saved);
  await store.getState().initClock(p);
  assert.deepEqual(store.getState().seasonMatches, original);
  await store.getState().revealTournament('emart_spring');
  assert.ok(
    saved.savedMatches.filter((m) => m.tournamentId === 'emart_spring').every((m) => m.drawn),
  );
  await store.getState().initClock({ ...saved, pendingEventId: 'pitch_grip_discovery' });
  const movement = store.getState().player.movement;
  await store.getState().resolveCutscene('learn');
  assert.equal(saved.movement, movement + 2);
  assert.equal(saved.pendingEventId, undefined);
  await store.getState().resolveCutscene('learn');
  assert.equal(saved.movement, movement + 2);
  assert.equal(saved.overall, overallRating(saved));
});
process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));

test('인연 단계 경계에서 기존 훈련 배율과 경기 보정이 유지된다', () => {
  const { scoreToStage, getTrainingEfficiencyMultiplier, getCoachWinProbabilityBonus } = require(
    path.join(dir, 'types/relationship.js'),
  );
  const p = player();
  p.relationships = Object.fromEntries(Object.keys(p.relationships).map((id) => [id, 0]));
  for (const [score, stage, multiplier, winBonus] of [
    [0, 1, 1, 0],
    [34, 1, 1, 0],
    [35, 2, 1.03, 0],
    [54, 2, 1.03, 0],
    [55, 3, 1.03, 0],
    [74, 3, 1.03, 0],
    [75, 4, 1.03, 0.04],
    [89, 4, 1.03, 0.04],
    [90, 5, 1.08, 0.04],
    [100, 5, 1.08, 0.04],
  ]) {
    p.relationships.coach = score;
    assert.equal(scoreToStage(score), stage);
    assert.equal(getTrainingEfficiencyMultiplier(p), multiplier);
    assert.equal(getCoachWinProbabilityBonus(p), winBonus);
  }
  p.relationships.coach = 90;
  p.relationships.peer = 89;
  assert.equal(getTrainingEfficiencyMultiplier(p), 1.08);
  p.relationships.peer = 90;
  assert.equal(getTrainingEfficiencyMultiplier(p), 1.18);
});

test('개별 점수·5단계 효과·성별 무관 로맨스와 졸업 인연이 일치한다', () => {
  const { buildBondProfiles, getTrainingEfficiencyMultiplier } = require(
    path.join(dir, 'types/relationship.js'),
  );
  const p = player();
  p.grade = 2;
  p.relationships = { ...p.relationships, coach: 90, peer: 90, rival: 12 };
  const profiles = buildBondProfiles(p);
  assert.equal(profiles.length, 13);
  for (const b of profiles) {
    assert.deepEqual(
      b.stageEffects.map((e) => e.stage),
      [1, 2, 3, 4, 5],
    );
    assert.equal(b.score, p.relationships[b.id]);
  }
  assert.deepEqual(
    profiles.find((b) => b.id === 'coach').stageEffects.map((e) => e.description),
    [
      '효과 없음',
      '훈련 효율 +3%',
      '효과 없음',
      '경기 승리 확률 보정 +4%p',
      '훈련 효율 추가 +5% (누적 +8%)',
    ],
  );
  for (const id of [
    'coach2',
    'teacher',
    'pe',
    'senior',
    'rival',
    'junior',
    'childhood',
    'neighbor',
    'deskmate',
    'mother',
    'father',
  ])
    assert.ok(
      profiles
        .find((b) => b.id === id)
        .stageEffects.every((e) => !e.hasEffect && e.description === '효과 없음'),
    );
  assert.equal(getTrainingEfficiencyMultiplier(p), 1.18);
  p.relationships.rival = 100;
  p.relationships.senior = 100;
  assert.equal(getTrainingEfficiencyMultiplier(p), 1.18);
  p.relationships.peer = 89;
  assert.equal(getTrainingEfficiencyMultiplier(p), 1.08);
  for (const gender of ['male', 'female'])
    for (const grade of [1, 2, 3]) {
      const bonds = buildBondProfiles({ ...p, gender, grade });
      assert.deepEqual(
        bonds
          .filter((b) => b.romanceable)
          .map((b) => b.id)
          .sort(),
        ['childhood', 'deskmate', 'peer', 'senior'],
      );
      assert.equal(
        bonds.some((b) => b.id === 'junior'),
        grade > 1,
      );
      assert.equal(bonds.find((b) => b.id === 'senior').score, 100);
    }
});

test('실제 경기 판정은 감독 인연 75점부터 표시된 4%p 보정을 사용한다', () => {
  const { resolveMatchPlaceholder } = require(path.join(dir, 'store/matchResolver.js'));
  const p = { ...player(), position: 'SS', condition: 20 };
  p.relationships.coach = 74;
  const match = generateSeasonMatches(2026, school, HIGH_SCHOOLS_DATA).find(
    (m) => m.isPlayerTeamMatch,
  );
  const sample = 0.5 + (20 + school.prestige * 0.3 - 40) * 0.004 + 0.02;
  const originalRandom = Math.random;
  try {
    Math.random = () => sample;
    assert.equal(resolveMatchPlaceholder(match, p, school).matchOutcome.won, false);
    const result = resolveMatchPlaceholder(
      match,
      { ...p, relationships: { ...p.relationships, coach: 75 } },
      school,
    );
    assert.equal(result.matchOutcome.won, true);
    assert.match(result.logMessage, /승리 확률 보정 \+4%p/);
  } finally {
    Math.random = originalRandom;
  }
});

test('v4 awards use real records and stages, and remain earned after reload or season rollover', async () => {
  const { buildAchievements, buildTournamentTrophies, captureAchievements } = require(
    path.join(dir, 'data/achievements.js'),
  );
  let p = player();
  p.fame = 100;
  p.relationships.coach = 89;
  p.pitches = [{ type: 'curve', rating: 79, potential: 80, xp: 0 }];
  let awards = buildAchievements(p);
  assert.equal(awards.find((a) => a.id === 'ach_first_match').unlocked, false);
  assert.equal(awards.find((a) => a.id === 'ach_coach_trust').unlocked, false);
  assert.equal(awards.find((a) => a.id === 'ach_pitch_master').unlocked, false);
  p.relationships.coach = 90;
  p.pitches = trainPitch(p, 'curve', 100);
  p.academics = 90;
  assert.equal(buildAchievements(p).find((a) => a.id === 'ach_pitch_master').unlocked, true);
  let matches = generateSeasonMatches(2026, school, HIGH_SCHOOLS_DATA);
  p.savedMatches = matches;
  assert.ok(buildTournamentTrophies(p).every((t) => !t.unlocked));
  for (let i = 0; i < 6; i++) {
    const m = matches.find(
      (m) => m.tournamentId === 'emart_spring' && m.isPlayerTeamMatch && !m.result,
    );
    matches = progressTournament(
      matches,
      { matchId: m.id, tournamentId: m.tournamentId, won: true },
      school,
      HIGH_SCHOOLS_DATA,
    );
  }
  p.savedMatches = matches;
  p.savedSeasonYear = 2026;
  assert.equal(buildTournamentTrophies(p).filter((t) => t.unlocked).length, 3);
  captureAchievements(p);
  p.academics = 10;
  p.savedMatches = [];
  assert.equal(buildAchievements(p).find((a) => a.id === 'ach_academic_excellence').unlocked, true);
  assert.equal(buildTournamentTrophies(p).filter((t) => t.unlocked).length, 3);
  await useGameClockStore.getState().initClock(p);
  assert.equal(saved.earnedTrophyIds.length, 3);
  assert.ok(saved.earnedAchievementIds.includes('ach_academic_excellence'));
});

test('v4 activities cover each category, enforce positions and slots in sampling and execution', async () => {
  const { SUB_ACTIVITY_POOL, isActivityAvailable } = require(path.join(dir, 'types/activity.js'));
  const all = Object.values(SUB_ACTIVITY_POOL).flat();
  assert.equal(new Set(all.map((a) => a.id)).size, all.length);
  for (const category of ['study', 'rest', 'relationship', 'special', 'training'])
    assert.ok(SUB_ACTIVITY_POOL[category].length >= 10, category);
  const block = all.find((a) => a.id === 'train_catcher_block');
  assert.equal(isActivityAvailable(block, 'C', 'afternoon'), true);
  for (const position of ['P', 'SS', 'TwoWay'])
    assert.equal(isActivityAvailable(block, position, 'afternoon'), false);
  assert.equal(isActivityAvailable(block, 'C', 'night'), false);
  for (const position of ['P', 'C', 'SS', 'TwoWay']) {
    const choices = sampleSubActivities('training', 1000, position, 'afternoon');
    assert.equal(
      choices.some((a) => a.id === block.id),
      position === 'C',
    );
  }
  const store = useGameClockStore;
  await store.getState().initClock(player());
  const before = structuredClone(store.getState().player);
  await store.getState().selectActivity('afternoon', 'training', block.id);
  assert.deepEqual(store.getState().player, before);
  await store.getState().initClock({ ...player(), position: 'C' });
  await store.getState().selectActivity('afternoon', 'training', block.id);
  assert.equal(saved.defense, player().defense + 2);
  assert.equal(saved.currentSlot, 'night');
});

test('구 저장 변환은 표시 점수를 보존하며 0점·부분 저장·재접속·학년 전환에 멱등이다', async () => {
  const { getBondScores, applyBondChanges } = require(path.join(dir, 'types/bondScores.js'));
  const legacy = {
    ...player(),
    relationships: undefined,
    relationshipCoach: 40,
    relationshipTeam: 60,
    relationshipFriends: 75,
    relationshipFamily: 28,
  };
  const original = structuredClone(legacy);
  const migrated = normalizePlayer(legacy);
  assert.equal(migrated.relationships.coach2, 40);
  assert.equal(migrated.relationships.rival, 60);
  assert.equal(migrated.relationships.childhood, 75);
  assert.equal(migrated.relationships.father, 28);
  assert.deepEqual(legacy, original);
  for (const key of [
    'relationshipCoach',
    'relationshipTeam',
    'relationshipFriends',
    'relationshipFamily',
  ])
    assert.equal(key in migrated, false);
  let updated = applyBondChanges(migrated, { peer: 5, mother: -99 });
  assert.equal(updated.relationships.peer, 65);
  assert.equal(updated.relationships.rival, 60);
  assert.equal(updated.relationships.mother, 0);
  assert.equal(updated.relationships.father, 28);
  assert.deepEqual(normalizePlayer(updated), updated);
  assert.equal(getBondScores({ ...legacy, relationships: { childhood: 0 } }).childhood, 0);
  await useGameClockStore.getState().initClock(updated);
  assert.deepEqual(saved.relationships, updated.relationships);
  await useGameClockStore.getState().initClock({ ...saved, grade: 3 });
  assert.deepEqual(saved.relationships, updated.relationships);
});

test('모든 인물별 활동은 그 인물만 변경하고 밤 저장·상한·하한이 안전하다', async () => {
  const { SUB_ACTIVITY_POOL, evaluateActivityWithGating, isActivityAvailable } = require(
    path.join(dir, 'types/activity.js'),
  );
  const { applyBondChanges } = require(path.join(dir, 'types/bondScores.js'));
  const all = Object.values(SUB_ACTIVITY_POOL).flat();
  for (const option of all)
    assert.ok(
      Object.keys(option.statChanges).every((k) => !k.startsWith('relationship')),
      option.id,
    );
  const talks = all.filter((o) => o.id.startsWith('bond_talk_'));
  assert.equal(talks.length, 13);
  for (const option of talks) {
    const p = { ...player(), grade: 2 };
    const before = structuredClone(p.relationships);
    const result = evaluateActivityWithGating(option, 100, 100);
    const next = applyBondChanges(p, result.relationshipTargets);
    const target = Object.keys(option.relationshipTargets)[0];
    for (const id of Object.keys(before))
      assert.equal(next.relationships[id], before[id] + (id === target ? 6 : 0));
    assert.deepEqual(p.relationships, before);
  }
  const junior = talks.find((o) => o.id === 'bond_talk_junior');
  assert.equal(isActivityAvailable(junior, 'SS', 'afternoon', 1), false);
  assert.equal(isActivityAvailable(junior, 'SS', 'afternoon', 2), true);
  for (const slot of ['afternoon', 'night']) {
    const p = player();
    p.currentSlot = slot;
    p.relationships[slot === 'night' ? 'mother' : 'rival'] = 98;
    await useGameClockStore.getState().initClock(p);
    const target = slot === 'night' ? 'mother' : 'rival';
    await useGameClockStore.getState().selectActivity(slot, 'relationship', 'bond_talk_' + target);
    assert.equal(saved.relationships[target], 100);
    for (const id of Object.keys(p.relationships))
      if (id !== target) assert.equal(saved.relationships[id], p.relationships[id]);
    assert.deepEqual(useGameClockStore.getState().lastActionResult.relationshipTargets, {
      [target]: 2,
    });
    assert.equal(saved.currentSlot, slot === 'night' ? 'morning' : 'night');
  }
  const low = applyBondChanges(player(), { rival: -1000 });
  assert.equal(low.relationships.rival, 0);
});

test('컷신 대상·데이트 조건·단체 행사·외출 모두 공유 점수에 의존하지 않는다', async () => {
  const { CUTSCENE_EVENTS_POOL } = require(path.join(dir, 'data/cutsceneEvents.js'));
  const { resolveAcademicEvent } = require(path.join(dir, 'store/eventResolver.js'));
  const { getOutdoorLocations } = require(path.join(dir, 'types/outdoorMap.js'));
  const date = CUTSCENE_EVENTS_POOL.find((e) => e.id === 'childhood_date');
  for (const gender of ['male', 'female']) {
    const p = { ...player(), gender, relationshipFriends: 100 };
    p.relationships.childhood = 74;
    p.relationships.deskmate = 100;
    assert.equal(date.conditions(p), false);
    p.relationships.childhood = 75;
    assert.equal(date.conditions(p), true);
  }
  const targets = {
    homeroom_checkin: 'teacher',
    childhood_date: 'childhood',
    junior_advice: 'junior',
    coach_one_point_lesson: 'coach',
    senior_secret_pep_talk: 'senior',
    graduated_senior_call: 'senior',
    pitch_grip_discovery: 'coach2',
  };
  for (const [eventId, target] of Object.entries(targets)) {
    const p = { ...player(), grade: 2, pendingEventId: eventId };
    await useGameClockStore.getState().initClock(p);
    await useGameClockStore.getState().resolveCutscene('learn');
    assert.ok(saved.relationships[target] > p.relationships[target], eventId);
    for (const id of Object.keys(p.relationships))
      if (id !== target)
        assert.equal(saved.relationships[id], p.relationships[id], eventId + ' ' + id);
    const once = structuredClone(saved.relationships);
    await useGameClockStore.getState().resolveCutscene('learn');
    assert.deepEqual(saved.relationships, once);
  }
  const result = resolveAcademicEvent({ type: 'field_trip', label: '수학여행' }, player());
  assert.deepEqual(result.relationshipTargets, { deskmate: 10, peer: 6 });
  const p = { ...player(), currentSlot: 'night', money: 50000 };
  await useGameClockStore.getState().initClock(p);
  await useGameClockStore
    .getState()
    .visitOutdoorLocation(getOutdoorLocations('서울').find((l) => l.id === 'karaoke'));
  assert.equal(saved.relationships.neighbor, p.relationships.neighbor + 3);
  for (const id of Object.keys(p.relationships))
    if (id !== 'neighbor') assert.equal(saved.relationships[id], p.relationships[id]);
});

test('전국 추정 퍼센타일은 평균에서 50%, 높은 OVR일수록 작아지고 학년별로 재계산된다', () => {
  const { getNationalPercentile, normalCdf } = require(path.join(dir, 'data/nationalRanking.js'));
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 0.000001);
  assert.ok(Math.abs(normalCdf(1) - 0.8413447) < 0.000001);
  for (const [grade, mean] of [
    [1, 24],
    [2, 38],
    [3, 52],
  ]) {
    let prev = 100;
    for (let overall = 0; overall <= 100; overall++) {
      const rank = getNationalPercentile({ ...player(), grade, overall }).percentile;
      assert.ok(rank >= 1 && rank <= 99 && rank <= prev);
      prev = rank;
    }
    assert.equal(getNationalPercentile({ ...player(), grade, overall: mean }).percentile, 50);
  }
  assert.ok(
    getNationalPercentile({ ...player(), grade: 1, overall: 40 }).percentile <
      getNationalPercentile({ ...player(), grade: 3, overall: 40 }).percentile,
  );
});

test('라이벌은 연도·월당 한 번 성장하고 잠재력을 넘지 않으며 같은 달 재진입은 멱등이다', () => {
  const { initializeRival, growRivalIfNeeded } = require(path.join(dir, 'data/rival.js'));
  const p = player();
  p.rivalProgress = initializeRival(p, { year: 2026, month: 12 }, () => 0.5);
  assert.equal(p.rivalProgress.overall, p.overall);
  let calls = 0;
  const random = () => {
    calls++;
    return 0.5;
  };
  assert.deepEqual(growRivalIfNeeded(p, 12, 2026, random), p.rivalProgress);
  assert.equal(calls, 0);
  p.rivalProgress = growRivalIfNeeded(p, 1, 2027, random);
  assert.equal(calls, 1);
  assert.ok(p.rivalProgress.overall > 20);
  assert.deepEqual(growRivalIfNeeded(p, 1, 2027, random), p.rivalProgress);
  assert.equal(calls, 1);
  p.rivalProgress = growRivalIfNeeded(p, 1, 2028, random);
  assert.equal(calls, 13);
  p.rivalProgress = { ...p.rivalProgress, overall: 76, potential: 76 };
  assert.equal(growRivalIfNeeded(p, 2, 2028, () => 1).overall, 76);
});

test('월말 어떤 활동에도 리포트를 저장하고 한 달 전체 성장량·재접속·닫힘을 유지한다', async () => {
  const store = useGameClockStore;
  for (const category of [undefined, 'rest', 'study', 'training', 'relationship']) {
    const p = player();
    p.currentSlot = 'night';
    p.gameDate = { year: 2026, month: 12, day: 31, weekday: 4, grade: 1 };
    p.rivalProgress = {
      overall: 30,
      potential: 80,
      lastUpdatedYear: 2026,
      lastUpdatedMonth: 12,
      playerMonthStartOverall: 12,
    };
    await store.getState().initClock(p);
    await store
      .getState()
      .advanceSlot({
        statChanges: {},
        staminaDelta: 0,
        logMessage: '월말 검증',
        activityCategory: category,
      });
    assert.equal(saved.rivalProgress.lastUpdatedYear, 2027);
    assert.equal(saved.rivalProgress.lastUpdatedMonth, 1);
    assert.ok(saved.rivalProgress.overall > 30);
    assert.equal(saved.pendingRivalReport.playerDelta, overallRating(saved) - 12);
    const report = structuredClone(saved.pendingRivalReport),
      rival = structuredClone(saved.rivalProgress);
    await store.getState().initClock(saved);
    assert.deepEqual(saved.pendingRivalReport, report);
    assert.deepEqual(saved.rivalProgress, rival);
    await store.getState().dismissRivalReport();
    assert.equal(saved.pendingRivalReport, undefined);
    await store.getState().initClock(saved);
    assert.equal(saved.pendingRivalReport, undefined);
    assert.deepEqual(saved.rivalProgress, rival);
  }
});

test('공식 홈경기·취소·시간대·월요일 예외가 관람 가능 여부에 반영된다', async () => {
  const { getBallparkVisit } = require(path.join(dir, 'data/proSchedule.js'));
  const at = (month, day) => ({
    year: 2026,
    month,
    day,
    weekday: new Date(2026, month - 1, day).getDay(),
    grade: 1,
  });
  assert.equal(getBallparkVisit('jamsil', at(3, 28), 'afternoon').available, true);
  assert.equal(getBallparkVisit('jamsil', at(3, 28), 'morning').available, false);
  assert.equal(getBallparkVisit('jamsil', at(3, 30), 'night').available, false);
  assert.equal(getBallparkVisit('changwon', at(9, 3), 'night').available, false);
  assert.equal(getBallparkVisit('jamsil', at(10, 5), 'afternoon').available, true);
  const { getOutdoorLocations } = require(path.join(dir, 'types/outdoorMap.js'));
  const p = { ...player(), currentSlot: 'night', money: 50000 };
  await useGameClockStore.getState().initClock(p);
  assert.equal(
    await useGameClockStore
      .getState()
      .visitOutdoorLocation(getOutdoorLocations('서울').find((l) => l.id === 'jamsil')),
    false,
  );
  assert.equal(useGameClockStore.getState().player.money, 50000);
});
test('미발표 연도 가상 시즌은 팀별 144경기·홈 72경기이고 잠실 중복과 월요일 경기가 없다', () => {
  const { simulatedProSeason, PRO_TEAMS } = require(path.join(dir, 'data/proSchedule.js'));
  for (const year of [2027, 2028]) {
    const games = simulatedProSeason(year);
    assert.equal(games.length, 720);
    for (const team of PRO_TEAMS) {
      assert.equal(games.filter((g) => g.home === team).length, 72);
      assert.equal(games.filter((g) => g.home === team || g.away === team).length, 144);
    }
    const slots = new Set();
    for (const g of games) {
      assert.notEqual(new Date(g.date + 'T12:00:00Z').getUTCDay(), 1);
      const key = g.date + g.venue;
      assert.ok(!slots.has(key));
      slots.add(key);
    }
  }
});
test('이벤트마다 고유 분기와 선형 대화가 있으며 잘못된 선택은 보상을 지급하지 않는다', async () => {
  const { CUTSCENE_EVENTS_POOL: events } = require(path.join(dir, 'data/cutsceneEvents.js'));
  assert.ok(events.some((e) => !e.choices));
  for (const e of events) {
    assert.ok(e.dialogueLines.some((l) => l.speaker === 'player'));
    assert.ok(e.portrait);
    if (e.choices) {
      assert.equal(new Set(e.choices.map((c) => c.label)).size, e.choices.length);
      const rewards = e.choices.map((c) => JSON.stringify(c.effect(player())));
      assert.equal(new Set(rewards).size, rewards.length);
    }
  }
  const p = { ...player(), condition: 20, pendingEventId: 'homeroom_checkin' };
  await useGameClockStore.getState().initClock(p);
  await assert.rejects(() => useGameClockStore.getState().resolveCutscene('invalid'));
  assert.equal(useGameClockStore.getState().player.academics, p.academics);
  await useGameClockStore.getState().resolveCutscene('notes');
  assert.equal(saved.academics, p.academics + 1);
  assert.equal(saved.condition, 26);
  const once = structuredClone(saved);
  await useGameClockStore.getState().resolveCutscene('notes');
  assert.deepEqual(saved, once);
});

test('인연 전원과 대화 화자는 존재하는 전용 초상화를 사용한다', () => {
  const { BOND_NAMES } = require(path.join(dir, 'types/bondScores.js'));
  const { CHARACTER_PORTRAITS } = require(path.join(dir, 'data/characterPortraits.js'));
  const { CUTSCENE_EVENTS_POOL } = require(path.join(dir, 'data/cutsceneEvents.js'));
  const portraits = Object.keys(BOND_NAMES).map((id) => CHARACTER_PORTRAITS[id]);
  assert.equal(new Set(portraits).size, 13, '인연끼리 초상화를 돌려쓰지 않는다');
  for (const src of Object.values(CHARACTER_PORTRAITS))
    assert.ok(fs.existsSync(path.join('public', src)), src);
  for (const event of CUTSCENE_EVENTS_POOL)
    assert.ok(fs.existsSync(path.join('public', event.portrait)), event.id);
  const expected = {
    pe_recovery: 'pe',
    pitch_grip_discovery: 'coach2',
    two_strike_lesson: 'coach2',
    scout_secret_visit: 'scout',
    homeroom_checkin: 'teacher',
    childhood_date: 'childhood',
    junior_advice: 'junior',
    graduated_senior_call: 'senior',
    senior_secret_pep_talk: 'senior',
    rival_school_provocation: 'rival',
    coach_one_point_lesson: 'coach',
  };
  for (const [eventId, character] of Object.entries(expected))
    assert.equal(
      CUTSCENE_EVENTS_POOL.find((e) => e.id === eventId).portrait,
      CHARACTER_PORTRAITS[character],
      eventId,
    );
  const { getPortraitPresets } = require(path.join(dir, 'data/playerDevelopment.js'));
  for (const preset of [...getPortraitPresets('male'), ...getPortraitPresets('female')])
    assert.ok(fs.existsSync(path.join('public', preset.src)), preset.id);
});

const competition = require(path.join(dir, 'data/teamCompetition.js'));
const { getMatchKind, addClubMatches } = require(path.join(dir, 'types/tournament.js'));
const { resolveMatchPlaceholder } = require(path.join(dir, 'store/matchResolver.js'));
const { buildAchievements } = require(path.join(dir, 'data/achievements.js'));
function teamPlayer(overrides = {}) {
  const p = { ...player(), position: 'SS', grade: 1, ...overrides };
  return competition.ensureTeamCompetition(p, school, p.gameDate);
}
function fixtureMatch(kind = 'weekend', id = 'team-match') {
  return {
    id,
    year: 2026,
    kind,
    date: { month: 3, day: 3 },
    tournamentId:
      kind === 'national'
        ? 'test-national'
        : kind === 'weekend'
          ? 'weekend_league'
          : `${kind}_test`,
    tournamentName: '검증 경기',
    round: '평가전',
    homeSchoolId: school.id,
    homeSchoolName: school.name,
    awaySchoolId: 'opponent',
    awaySchoolName: '상대고',
    drawn: true,
    isPlayerTeamMatch: true,
  };
}
function withRandom(n, run) {
  const old = Math.random;
  try {
    Math.random = () => n;
    return run();
  } finally {
    Math.random = old;
  }
}
function performance(role = 'starter', rating = 20) {
  return {
    role,
    rating,
    atBats: role === 'starter' ? 4 : 0,
    hits: 0,
    homeRuns: 0,
    rbi: 0,
    innings: 0,
    strikeouts: 0,
    runsAllowed: 0,
    stolenBases: 0,
    errors: 0,
  };
}

test('주전 경쟁: 구 저장에 결정적 로스터를 추가하고 재접속·포지션 변경에도 경쟁자를 유지한다', () => {
  const p = teamPlayer();
  const again = competition.ensureTeamCompetition(structuredClone(p), school, p.gameDate);
  assert.deepEqual(again, p);
  assert.equal(
    new Set(p.teamCompetition.roster.map((n) => n.id)).size,
    p.teamCompetition.roster.length,
  );
  assert.equal(p.teamCompetition.roster.length, Math.max(18, Math.min(60, school.rosterSize)) - 1);
  for (const pos of competition.FIELD_POSITIONS)
    assert.ok(p.teamCompetition.roster.some((n) => n.position === pos));
  assert.ok(competition.getStanding(p).rank > 1, '신입은 무조건 주전이 아니다');
  assert.equal(p.teamCompetition.roster.find((n) => n.id === 'peer').position, 'SS');
  const changed = competition.ensureTeamCompetition({ ...p, position: 'CF' }, school, p.gameDate);
  assert.deepEqual(changed.teamCompetition.roster, p.teamCompetition.roster);
  assert.equal(changed.teamCompetition.roster.find((n) => n.id === 'peer').position, 'SS');
});

test('학교 경쟁도·훈련 성과·경기 실적·컨디션·감독 신뢰가 실제 서열에 반영된다', () => {
  const p = teamPlayer();
  const base = competition.coachScore(p);
  for (const key of ['training', 'recentForm'])
    assert.ok(
      competition.coachScore({ ...p, teamCompetition: { ...p.teamCompetition, [key]: 90 } }) > base,
    );
  assert.ok(competition.coachScore({ ...p, condition: 5 }) < base);
  assert.ok(
    competition.coachScore({ ...p, relationships: { ...p.relationships, coach: 100 } }) >
      competition.coachScore({ ...p, relationships: { ...p.relationships, coach: 0 } }),
  );
  const weak = { ...school, competition: { pitcher: 1, catcher: 1, infielder: 1, outfielder: 1 } };
  const strong = {
    ...school,
    competition: { pitcher: 10, catcher: 10, infielder: 10, outfielder: 10 },
  };
  const low = competition.ensureTeamCompetition(
    { ...p, teamCompetition: undefined },
    weak,
    p.gameDate,
  );
  const high = competition.ensureTeamCompetition(
    { ...p, teamCompetition: undefined },
    strong,
    p.gameDate,
  );
  assert.ok(high.teamCompetition.roster[0].ability > low.teamCompetition.roster[0].ability);
  const trained = competition.updateCompetitionAfterAction(
    p,
    p,
    {
      activityCategory: 'training',
      statChanges: { contact: 3 },
      staminaDelta: 0,
      logMessage: '훈련',
    },
    p.gameDate,
  );
  assert.ok(trained.teamCompetition.training > p.teamCompetition.training);
  assert.equal(p.teamCompetition.training, 25, '이전 저장 상태를 직접 수정하지 않는다');
});

test('대회 엔트리는 개막 3일 전 고정되고 재접속·이후 성장으로 뒤집히지 않는다', () => {
  const m = { ...fixtureMatch('national'), date: { month: 3, day: 7 } };
  const p = teamPlayer();
  let prepared = competition.prepareTeamContext(p, school, p.gameDate, 'morning', [m]);
  assert.equal(prepared.teamCompetition.entries.length, 0);
  prepared = competition.prepareTeamContext(
    prepared,
    school,
    { ...p.gameDate, day: 4 },
    'morning',
    [m],
  );
  const entry = structuredClone(prepared.teamCompetition.entries[0]);
  assert.equal(entry.memberIds.length, new Set(entry.memberIds).size);
  assert.ok(entry.memberIds.length <= 21);
  const grown = {
    ...prepared,
    contact: 100,
    power: 100,
    teamCompetition: { ...prepared.teamCompetition, training: 100, recentForm: 100 },
  };
  const again = competition.prepareTeamContext(
    grown,
    school,
    { ...p.gameDate, day: 7 },
    'afternoon',
    [m],
  );
  assert.deepEqual(again.teamCompetition.entries, [entry]);
  const selection = again.teamCompetition.selection;
  assert.equal(selection.role === 'outside', !entry.included);
  assert.deepEqual(
    competition.prepareTeamContext(
      structuredClone(again),
      school,
      { ...p.gameDate, day: 7 },
      'afternoon',
      [m],
    ).teamCompetition.selection,
    selection,
  );
  assert.equal(new Set(selection.lineup.map((n) => n.id)).size, 9);
});

test('감독 신뢰는 기존 주전에게 두 경기 유예를 주지만 부진·피로·엔트리 제외를 무한히 덮지 않는다', () => {
  const p = teamPlayer({ relationships: { ...player().relationships, coach: 100 } });
  const t = p.teamCompetition;
  const score = competition.coachScore(p);
  t.roster = t.roster.map((n) => ({ ...n, ability: 0, form: 0, condition: 0, grade: 1 }));
  const rival = t.roster.find((n) => n.position === 'SS');
  rival.ability = (score + 3) / 0.7;
  assert.equal(competition.getStanding(p).rank, 2);
  t.role = 'starter';
  t.poorStarts = 1;
  assert.equal(competition.selectMatch(p, fixtureMatch(), p.gameDate).protected, true);
  t.poorStarts = 2;
  assert.equal(competition.selectMatch(p, fixtureMatch(), p.gameDate).role, 'starter');
  t.poorStarts = 3;
  assert.equal(competition.selectMatch(p, fixtureMatch(), p.gameDate).role, 'bench');
  t.poorStarts = 1;
  assert.equal(
    competition.selectMatch({ ...p, condition: 10 }, fixtureMatch(), p.gameDate).role,
    'bench',
  );
  assert.equal(
    competition.selectMatch(
      { ...p, relationships: { ...p.relationships, coach: 10 } },
      fixtureMatch(),
      p.gameDate,
    ).protected,
    false,
  );
  t.entries = [
    {
      tournamentId: 'test-national',
      year: 2026,
      included: false,
      memberIds: t.roster.map((n) => n.id),
    },
  ];
  assert.equal(competition.selectMatch(p, fixtureMatch('national'), p.gameDate).role, 'outside');
});

test('미출전·대타·대주자·수비교체·구원·투타겸업의 개인 기록과 보상을 구분한다', () => {
  for (const [role, pos] of [
    ['bench', 'SS'],
    ['outside', 'SS'],
    ['pinchHit', 'SS'],
    ['pinchRun', 'CF'],
    ['defense', 'SS'],
    ['relief', 'P'],
    ['starter', 'TwoWay'],
  ]) {
    const p = teamPlayer({ position: pos });
    const m = fixtureMatch();
    p.teamCompetition.selection = {
      matchId: m.id,
      year: 2026,
      role,
      reason: '검증',
      lineup: [],
      protected: false,
    };
    const result = withRandom(0.99, () => resolveMatchPlaceholder(m, p, school));
    const r = result.matchPerformance;
    assert.equal(r.role, role);
    if (['bench', 'outside'].includes(role)) {
      assert.equal(r.atBats, 0);
      assert.equal(r.innings, 0);
      assert.deepEqual(result.statChanges, {});
      assert.equal(r.rating, undefined);
      assert.equal(result.relationshipTargets.coach, undefined);
    }
    if (role === 'pinchHit') {
      assert.equal(r.atBats, 1);
      assert.equal(r.innings, 0);
    }
    if (role === 'pinchRun') {
      assert.equal(r.atBats, 0);
      assert.equal(result.statChanges.speed, 0.3);
    }
    if (role === 'defense') {
      assert.equal(r.atBats, 0);
      assert.equal(result.statChanges.defense, 0.3);
    }
    if (role === 'relief') {
      assert.ok(r.innings <= 2);
      assert.equal(r.atBats, 0);
    }
    if (pos === 'TwoWay') {
      assert.equal(r.atBats, 4);
      assert.ok(r.innings >= 4);
    }
  }
});

test('감독 신뢰와 기회 요청은 벤치 교체 가능성을 높이고 낮은 컨디션은 차단한다', () => {
  const m = fixtureMatch();
  const low = teamPlayer({ relationships: { ...player().relationships, coach: 0 } });
  low.teamCompetition.selection = {
    matchId: m.id,
    year: 2026,
    role: 'bench',
    reason: '검증',
    lineup: [],
    protected: false,
  };
  const high = { ...low, relationships: { ...low.relationships, coach: 100 } };
  assert.equal(
    withRandom(0.4, () => resolveMatchPlaceholder(m, low, school)).matchPerformance.role,
    'bench',
  );
  assert.equal(
    withRandom(0.4, () => resolveMatchPlaceholder(m, high, school)).matchPerformance.role,
    'pinchHit',
  );
  assert.equal(
    withRandom(0.4, () =>
      resolveMatchPlaceholder(
        m,
        { ...low, teamCompetition: { ...low.teamCompetition, opportunityGames: 2 } },
        school,
      ),
    ).matchPerformance.role,
    'pinchHit',
  );
  assert.equal(
    withRandom(0.1, () => resolveMatchPlaceholder(m, { ...high, condition: 20 }, school))
      .matchPerformance.role,
    'bench',
  );
});

test('경기 평가가 다음 서열·훈련 조언·인연·멘탈에 돌아오며 벤치는 최근 실적을 잃지 않는다', () => {
  const p = teamPlayer();
  const good = {
    activityCategory: 'match',
    statChanges: {},
    staminaDelta: 0,
    logMessage: '활약',
    matchPerformance: performance('starter', 90),
    matchOutcome: { matchId: 'x', tournamentId: 'weekend_league', won: true },
  };
  const updated = competition.updateCompetitionAfterAction(p, p, good, p.gameDate);
  assert.ok(updated.teamCompetition.recentForm > p.teamCompetition.recentForm);
  assert.ok(updated.teamCompetition.lastFeedback.coachDelta > 0);
  assert.match(updated.teamCompetition.lastFeedback.recommendation, /훈련/);
  const bench = competition.updateCompetitionAfterAction(
    p,
    p,
    { ...good, matchPerformance: performance('bench', undefined) },
    p.gameDate,
  );
  assert.equal(bench.teamCompetition.recentForm, p.teamCompetition.recentForm);
  assert.match(competition.trainingRecommendation({ ...p, condition: 20 }), /휴식/);
  const m = fixtureMatch();
  p.teamCompetition.selection = {
    matchId: m.id,
    year: 2026,
    role: 'starter',
    lineup: [],
    reason: '검증',
    protected: false,
    advice: '강민준의 조언',
  };
  p.relationships.peer = 60;
  const result = withRandom(0.1, () => resolveMatchPlaceholder(m, p, school));
  assert.equal(result.relationshipTargets.senior, 1);
  assert.equal(result.relationshipTargets.peer, 1);
  assert.ok(result.mentalDelta > 0);
  assert.ok(result.relationshipTargets.coach > 0);
});

test('진급 시 졸업생을 신입생으로 교체하고 포지션·동기 정체성과 저장의 멱등성을 유지한다', () => {
  let p = teamPlayer();
  const peerPosition = p.teamCompetition.roster.find((n) => n.id === 'peer').position;
  for (const grade of [2, 3]) {
    const date = { ...p.gameDate, year: 2025 + grade, grade };
    p = competition.ensureTeamCompetition({ ...p, grade, gameDate: date }, school, date);
    for (const pos of competition.FIELD_POSITIONS)
      assert.ok(p.teamCompetition.roster.some((n) => n.position === pos));
    assert.ok(p.teamCompetition.roster.every((n) => n.grade <= 3));
    assert.equal(p.teamCompetition.roster.find((n) => n.id === 'peer').grade, grade);
    assert.equal(p.teamCompetition.roster.find((n) => n.id === 'peer').position, peerPosition);
    assert.equal(
      new Set(p.teamCompetition.roster.map((n) => n.id)).size,
      p.teamCompetition.roster.length,
    );
    assert.deepEqual(competition.ensureTeamCompetition(structuredClone(p), school, date), p);
  }
  assert.ok(!p.teamCompetition.roster.some((n) => n.id === 'senior'));
});

test('청백전·연습경기는 단판이며 주말리그·전국대회와 충돌하거나 재접속 때 중복되지 않는다', () => {
  let matches = generateSeasonMatches(2026, school, HIGH_SCHOOLS_DATA);
  assert.equal(matches.filter((m) => getMatchKind(m) === 'scrimmage').length, 4);
  assert.equal(matches.filter((m) => getMatchKind(m) === 'practice').length, 4);
  assert.deepEqual(addClubMatches(matches, 2026, school, HIGH_SCHOOLS_DATA), matches);
  const own = matches.filter((m) => m.isPlayerTeamMatch);
  assert.equal(new Set(own.map((m) => `${m.date.month}-${m.date.day}`)).size, own.length);
  for (const kind of ['scrimmage', 'practice']) {
    const m = matches.find((m) => getMatchKind(m) === kind);
    const count = matches.length;
    matches = progressTournament(
      matches,
      { matchId: m.id, tournamentId: m.tournamentId, won: true },
      school,
      [],
    );
    assert.equal(matches.length, count);
    assert.ok(matches.find((n) => n.id === m.id).result);
  }
});

test('면담은 자유 오후를 소비하며 7일 제한·포지션 재경쟁·재접속을 보존한다', async () => {
  const store = useGameClockStore;
  await store.getState().initClock(teamPlayer());
  await store.getState().coachMeeting('chance');
  assert.equal(saved.currentSlot, 'night');
  assert.equal(saved.teamCompetition.opportunityGames, 2);
  const interviewDay = saved.teamCompetition.lastInterviewDay;
  await store.getState().initClock({ ...saved, currentSlot: 'afternoon' });
  await store.getState().coachMeeting('position', 'CF');
  assert.equal(saved.position, 'SS');
  assert.equal(saved.currentSlot, 'afternoon');
  const next = {
    ...saved,
    currentSlot: 'afternoon',
    gameDate: { ...saved.gameDate, day: 11 },
    pendingEventId: undefined,
  };
  await store.getState().initClock(next);
  await store.getState().coachMeeting('position', 'CF');
  assert.equal(saved.position, 'CF');
  assert.equal(saved.teamCompetition.opportunityGames, 0);
  assert.ok(saved.teamCompetition.lastInterviewDay > interviewDay);
  assert.equal(saved.teamCompetition.roster.find((n) => n.id === 'peer').position, 'SS');
  await store.getState().initClock(structuredClone(saved));
  assert.equal(store.getState().player.position, 'CF');
  await store.getState().coachMeeting('accept');
  assert.equal(saved.currentSlot, 'night');
});

test('당일 명단→미출전→평가→밤 훈련→재접속이 저장되고 중복 경기를 차단한다', async () => {
  const store = useGameClockStore;
  const m = fixtureMatch();
  const p = teamPlayer({ condition: 20, savedMatches: [m], savedSeasonYear: 2026 });
  await store.getState().initClock(p);
  assert.equal(store.getState().player.teamCompetition.selection.role, 'bench');
  await store.getState().executeForcedSlot('afternoon');
  assert.equal(saved.currentSlot, 'night');
  assert.equal(saved.matchRecords.at(-1).performance.role, 'bench');
  assert.equal(
    saved.savedMatches.find((n) => n.id === m.id).result,
    store.getState().seasonMatches.find((n) => n.id === m.id).result,
  );
  assert.match(saved.matchRecords.at(-1).log, /감독 평가/);
  assert.equal(saved.teamCompetition.recentForm, p.teamCompetition.recentForm);
  const record = structuredClone(saved.matchRecords);
  const last = store.getState().lastActionResult;
  await store.getState().advanceSlot(last);
  assert.deepEqual(saved.matchRecords, record);
  assert.equal(saved.currentSlot, 'night');
  await store.getState().initClock(structuredClone(saved));
  assert.deepEqual(store.getState().player.matchRecords, record);
  await store
    .getState()
    .advanceSlot({
      activityCategory: 'training',
      statChanges: { contact: 2 },
      staminaDelta: 0,
      logMessage: '야간 보완 훈련',
    });
  assert.ok(saved.teamCompetition.training > p.teamCompetition.training);
  assert.equal(saved.gameDate.day, 4);
});

test('경기 저장 실패 시 대진·평가·슬롯을 먼저 확정하지 않는다', async () => {
  const store = useGameClockStore;
  await store
    .getState()
    .initClock(teamPlayer({ savedMatches: [fixtureMatch()], savedSeasonYear: 2026 }));
  const before = structuredClone(store.getState().player);
  const matches = structuredClone(store.getState().seasonMatches);
  const table = require(path.join(dir, 'db.js')).db.players;
  const put = table.put;
  try {
    table.put = async () => {
      throw Error('저장 실패');
    };
    await assert.rejects(store.getState().executeForcedSlot('afternoon'), /저장 실패/);
  } finally {
    table.put = put;
  }
  assert.deepEqual(store.getState().player, before);
  assert.deepEqual(store.getState().seasonMatches, matches);
  assert.equal(store.getState().isLoading, false);
});

test('공식 출전 업적은 청백전과 벤치·엔트리 제외를 출전으로 세지 않는다', () => {
  const p = teamPlayer();
  p.matchRecords = [
    { matchId: 'a', year: 2026, log: '벤치', kind: 'national', performance: performance('bench') },
    {
      matchId: 'b',
      year: 2026,
      log: '청백전',
      kind: 'scrimmage',
      performance: performance('starter'),
    },
  ];
  assert.equal(buildAchievements(p).find((a) => a.id === 'ach_first_match').unlocked, false);
  p.matchRecords.push({
    matchId: 'c',
    year: 2026,
    log: '대타',
    kind: 'weekend',
    performance: performance('pinchHit'),
  });
  assert.equal(buildAchievements(p).find((a) => a.id === 'ach_first_match').unlocked, true);
});

test('성장에 따라 벤치→백업→주전→핵심 선수로 오르고 부진하면 다시 밀린다', () => {
  const p = teamPlayer();
  const result = { statChanges: {}, staminaDelta: 0, logMessage: '평가' };
  const rivals = p.teamCompetition.roster.filter((n) => n.position === 'SS');
  assert.ok(rivals.length >= 2);
  p.teamCompetition.roster = p.teamCompetition.roster.map((n) => ({
    ...n,
    ability: 65,
    form: 50,
    condition: 80,
    grade: 1,
  }));
  assert.equal(competition.getStanding(p).role, 'bench');
  p.teamCompetition.roster.find((n) => n.id === rivals[0].id).ability = 0;
  if (rivals.length > 2)
    for (const n of p.teamCompetition.roster.filter((n) => n.position === 'SS').slice(2))
      n.ability = 0;
  assert.equal(competition.getStanding(p).role, 'backup');
  p.teamCompetition.roster.find((n) => n.id === rivals[1].id).ability = 0;
  assert.equal(competition.getStanding(p).role, 'starter');
  for (const key of [
    'contact',
    'power',
    'eye',
    'speed',
    'defense',
    ...Object.keys(require(path.join(dir, 'data/playerDevelopment.js')).EXTRA_RATINGS),
  ])
    p[key] = 90;
  p.teamCompetition.training = 90;
  p.teamCompetition.recentForm = 90;
  const core = competition.updateCompetitionAfterAction(p, p, result, p.gameDate);
  assert.equal(core.teamCompetition.role, 'core');
  const fallen = {
    ...core,
    condition: 10,
    relationships: { ...core.relationships, coach: 0 },
    teamCompetition: {
      ...core.teamCompetition,
      training: 0,
      recentForm: 0,
      roster: core.teamCompetition.roster.map((n) => ({ ...n, ability: 95, form: 95 })),
    },
  };
  assert.equal(competition.refreshTeamEvaluation(fallen).teamCompetition.role, 'bench');
});

test('경기 날 감독 면담으로 강제 경기를 건너뛸 수 없고 활동 일지가 재접속 후에도 슬롯에 맞는다', async () => {
  const store = useGameClockStore;
  const p = teamPlayer({
    currentSlot: 'morning',
    savedMatches: [fixtureMatch()],
    savedSeasonYear: 2026,
  });
  await store.getState().initClock(p);
  await store.getState().advanceSlot({ statChanges: {}, staminaDelta: 0, logMessage: '오전 수업' });
  await store.getState().coachMeeting('chance');
  assert.equal(saved.currentSlot, 'afternoon');
  assert.equal(saved.teamCompetition.opportunityGames, 0);
  await store.getState().executeForcedSlot('afternoon');
  const gameLog = saved.matchRecords.at(-1).log;
  await store.getState().initClock(structuredClone(saved));
  await store.getState().advanceSlot({ statChanges: {}, staminaDelta: 0, logMessage: '야간 휴식' });
  const day = store.getState().historyLogs[0];
  assert.equal(day.morningLog, '오전 수업');
  assert.equal(day.afternoonLog, gameLog);
  assert.equal(day.nightLog, '야간 휴식');
});

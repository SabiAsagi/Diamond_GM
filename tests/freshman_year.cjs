// 브라우저/IndexedDB 대신 저장 경계만 대체한 실제 스토어 통합 완주 테스트.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diamond-freshman-'));
function compile(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) compile(file);
    else if (file.endsWith('.ts')) {
      const target = path.join(dir, path.relative(path.resolve('src'), file).replace(/\.ts$/, '.js'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText);
    }
  }
}
compile(path.resolve('src'));
fs.copyFileSync('src/data/kbo2026.json', path.join(dir, 'data/kbo2026.json'));
fs.symlinkSync(path.resolve('node_modules'), path.join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
let saved;
let failNextSave = false;
let holdNextSave;
require.cache[path.join(dir, 'db.js')] = { id: path.join(dir, 'db.js'), filename: path.join(dir, 'db.js'), loaded: true,
  exports: { db: { players: { put: async p => { if (holdNextSave) { const hold = holdNextSave; holdNextSave = undefined; await hold; } if (failNextSave) { failNextSave = false; throw new Error('save failed'); } saved = structuredClone(p); return p.id; } } } } };
after(() => fs.rmSync(dir, { recursive: true, force: true }));
const { useGameClockStore: store } = require(path.join(dir, 'store/gameClockStore.js'));
const { HIGH_SCHOOLS_DATA } = require(path.join(dir, 'data/highSchools.js'));
const { normalizePlayer } = require(path.join(dir, 'data/playerDevelopment.js'));
const { INITIAL_RELATIONSHIPS } = require(path.join(dir, 'types/bondScores.js'));
const { SUB_ACTIVITY_POOL, getActivityCategories, isActivityAvailable, sampleSubActivities } = require(path.join(dir, 'types/activity.js'));
const { isSchoolDay, isVacationPeriod, isWinterVacation } = require(path.join(dir, 'types/academicCalendar.js'));
const { MAJOR_TOURNAMENT_TEMPLATES, generateSeasonMatches, addMissingNationals, getPlayerMatchForDate, progressTournament, advanceOtherTournamentMatches } = require(path.join(dir, 'types/tournament.js'));
const openNationals = ['emart_spring', 'golden_lion', 'blue_dragon', 'president_cup', 'phoenix_autumn'];
const { generateWeekendMatches, migrateWeekendMatches, getWeekendGroup } = require(path.join(dir, 'data/weekendLeague.js'));
const { collectPlayerNews, getUnreadNews } = require(path.join(dir, 'data/news.js'));
const { createCareerJourney, canDoSocialActivity, hasMet, eligibleRoutes, updateCareerProgress, schoolTrainingCulture, chemistry } = require(path.join(dir, 'data/careerJourney.js'));
const { matchDecisions } = require(path.join(dir, 'data/matchDecisions.js'));
function seededRandom(seed) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
/** 11월 1일 기준: 선발전과 전국체전이 결승까지 끝나고, 선발전 우승 시에만 플레이어 학교가 전국체전에 출전했는지 확인한다. */
function checkFestival(state, school, coverage) {
  const matches = state.seasonMatches;
  const regionSchools = HIGH_SCHOOLS_DATA.filter(s => s.region === school.region).length;
  const winnerOf = m => m.result === 'home' ? m.homeSchoolId : m.awaySchoolId;
  const qualifierFinal = matches.find(m => m.tournamentId === 'festival_qualifier' && m.round === '결승전');
  if (regionSchools > 1) {
    assert.ok(qualifierFinal?.result, '시·도 대표 선발전 미종료');
    assert.ok(coverage.get('festival_qualifier') >= 1, '선발전 경기 미진행');
  }
  const representative = regionSchools > 1 ? winnerOf(qualifierFinal) : school.id;
  const festival = matches.filter(m => m.tournamentId === 'national_sports_festival');
  assert.equal(festival.length, 15, '전국체전 15경기 미편성');
  assert.ok(festival.every(m => m.result), '전국체전 미종료 경기');
  const qualified = representative === school.id;
  assert.equal(festival.some(m => m.homeSchoolId === school.id || m.awaySchoolId === school.id), qualified);
  if (qualified) assert.ok(coverage.get('national_sports_festival') >= 1, '대표로 뽑혔는데 전국체전 경기 미진행');
  return { qualified, games: coverage.get('national_sports_festival') ?? 0 };
}
function key(clock) { const d = clock.date; return `${d.year}-${d.month}-${d.day}/${clock.currentSlot}/G${d.grade}`; }
function starter(school, position, gender) {
  return normalizePlayer({ id: 1, name: '완주검증', highSchool: school.name, gender, position, age: 16,
    status: 'HighSchool', uniformNumber: 17, handedness: 'R/R', pitchingForm: position === 'SS' ? 'None' : 'Overhand',
    pitcherRole: position === 'SS' ? 'None' : 'Starter', battingForm: 'Straight', overall: 20, potential: 80,
    contact: 20, power: 20, eye: 20, speed: 20, defense: 20, stuff: 20, control: 20, stamina: 20,
    condition: 100, academics: 50, grade: 1, relationships: { ...INITIAL_RELATIONSHIPS }, interviewCompleted: true,
    gameDate: { year: 2026, month: 3, day: 2, weekday: 1, grade: 1 }, currentSlot: 'morning' });
}
async function dismissInterruptions(stats) {
  for (let guard = 0; guard < 10; guard++) {
    const state = store.getState();
    if (state.lastActionResult) { state.clearLastActionResult(); continue; }
    if (state.activeCutscene) {
      const event = state.activeCutscene;
      await state.resolveCutscene(event.choices?.[stats.events % event.choices.length]?.id ?? 'learn');
      stats.events++;
      continue;
    }
    if (state.player.pendingGradeReportId) { await state.dismissGradeReport(); continue; }
    if (state.player.pendingRivalReport) { await state.dismissRivalReport(); stats.reports++; continue; }
    const d = state.clock.date;
    const draw = state.seasonMatches.find(m => m.isPlayerTeamMatch && m.drawn === false && m.date.month === d.month && m.date.day === d.day);
    if (draw) { await state.revealTournament(draw.tournamentId); stats.draws++; continue; }
    return;
  }
  assert.fail(`이벤트 처리 정체: ${key(store.getState().clock)}`);
}

for (const scenario of [
  { seed: 19, position: 'SS', gender: 'male', tier: 'S' },
  { seed: 110, position: 'P', gender: 'female', tier: 'D' },
  { seed: 2026, position: 'TwoWay', gender: 'male', tier: 'B' },
  // 학교가 1개뿐인 시·도는 선발전 없이 대표가 되므로 전국체전 실제 출전 흐름을 완주 중에 검증한다.
  { seed: 107, position: 'SS', gender: 'female', region: '제주' },
  { seed: 777, position: 'P', gender: 'male', tier: 'S', rating: 85 },
  { seed: 321, position: 'C', gender: 'female', tier: 'A' },
  { seed: 42, position: 'CF', gender: 'male', tier: 'C' },
  { seed: 2028, position: 'TwoWay', gender: 'female', region: '울산' },
]) {
  test(`1학년 완주: ${scenario.position}/${scenario.region ?? `${scenario.tier}학교`}/seed=${scenario.seed}`, { timeout: 60000 }, async t => {
    const originalRandom = Math.random;
    Math.random = seededRandom(scenario.seed);
    const stats = { events: 0, reports: 0, draws: 0, reloads: 0, slots: 0, summer: 0, winter: 0, winterTraining: 0 };
    const coverage = new Map();
    const seenSlots = new Set();
    const seenMatches = new Set();
    const days = new Set();
    const recent = [];
    const months = new Set();
    let result;
    let festival;
    try {
      const school = HIGH_SCHOOLS_DATA.find(s => scenario.region ? s.region === scenario.region : s.tier === scenario.tier);
      assert.ok(school, `시나리오 학교 누락: ${scenario.region ?? scenario.tier}`);
      const initialPlayer = starter(school, scenario.position, scenario.gender);
      if (scenario.seed === 19) initialPlayer.careerJourney = { ...createCareerJourney(), met: ['mother','father','coach'] };
      if (scenario.rating) {
        for (const key of ['contact','power','eye','speed','defense','stuff','control','stamina',...Object.keys(require(path.join(dir, 'data/playerDevelopment.js')).EXTRA_RATINGS)]) initialPlayer[key] = scenario.rating;
        initialPlayer.pitches = initialPlayer.pitches?.map(p => ({ ...p, rating: scenario.rating }));
      }
      await store.getState().initClock(initialPlayer);
      while (store.getState().clock.date.grade === 1 && stats.slots < 370 * 3) {
        await dismissInterruptions(stats);
        if (!require(path.join(dir, 'data/monthlyGoals.js')).isGoalForMonth(store.getState().player.monthlyGoal, store.getState().clock.date)) {
          await store.getState().declareMonthlyGoal(['technique', 'recovery', 'teamwork'][store.getState().clock.date.month % 3]);
        }
        const before = store.getState();
        const clock = structuredClone(before.clock);
        const slotKey = key(clock);
        assert.ok(!seenSlots.has(slotKey), `동일 슬롯 재진입: ${slotKey}`);
        seenSlots.add(slotKey);
        days.add(slotKey.split('/')[0]);
        months.add(`${clock.date.year}-${clock.date.month}`);
        if (clock.date.month === 11 && clock.date.day === 1 && clock.currentSlot === 'morning') festival = checkFestival(before, school, coverage);
        const assignment = before.dailyPlan.slots[clock.currentSlot];
        recent.push(`${slotKey}: ${assignment.label}`); if (recent.length > 8) recent.shift();
        if (assignment.forced) {
          const match = before.seasonMatches.find(m => m.id === assignment.sourceEventId);
          await before.executeForcedSlot(clock.currentSlot);
          result = store.getState().lastActionResult;
          if (assignment.category === 'match') {
            assert.ok(match, '강제 경기와 편성표 불일치');
            assert.equal(result?.matchOutcome?.matchId, match.id);
            const matchKey = `${clock.date.year}:${match.id}`;
            assert.ok(!seenMatches.has(matchKey), `경기 중복: ${matchKey}`);
            seenMatches.add(matchKey);
            coverage.set(match.tournamentId, (coverage.get(match.tournamentId) ?? 0) + 1);
            assert.ok(saved.matchRecords.some(r => r.matchId === match.id && r.year === clock.date.year));
            assert.ok(saved.savedMatches.find(m => m.id === match.id)?.result, '경기 결과 저장 누락');
          }
        } else {
          const categories = getActivityCategories(clock.currentSlot, isSchoolDay(clock.date)).map(c => c.category);
          const preferred = before.player.condition < 65 ? 'rest' : categories[stats.slots % categories.length];
          const candidates = SUB_ACTIVITY_POOL[preferred].filter(o => isActivityAvailable(o, before.player.position, clock.currentSlot, 1, clock.date) && canDoSocialActivity(before.player,o));
          assert.ok(candidates.length, `선택 가능한 활동 없음: ${slotKey}/${preferred}`);
          const option = candidates[stats.slots % candidates.length];
          await before.selectActivity(clock.currentSlot, preferred, option.id);
          if (option.season === 'winter') {
            assert.ok(isWinterVacation(clock.date.month, clock.date.day), `겨울방학 밖 겨울 활동: ${slotKey}/${option.id}`);
            assert.notEqual(key(store.getState().clock), slotKey, `겨울 활동 실행 실패: ${option.id}`);
            stats.winterTraining++;
          }
          if (clock.currentSlot === 'morning' && isVacationPeriod(clock.date.month, clock.date.day)) {
            if ([7, 8].includes(clock.date.month)) stats.summer++;
            if ([12, 1, 2].includes(clock.date.month)) stats.winter++;
          }
        }
        if (clock.currentSlot === 'night') {
          const overdue = before.seasonMatches.filter(m => m.isPlayerTeamMatch && !m.result && m.date.month * 32 + m.date.day <= clock.date.month * 32 + clock.date.day);
          assert.deepEqual(overdue.map(m => m.id), [], '일정 충돌 등으로 경기일을 지나친 미진행 경기');
        }
        stats.slots++;
        const afterState = store.getState();
        assert.notEqual(key(afterState.clock), slotKey, `슬롯 전진 실패: ${slotKey}`);
        assert.equal(afterState.isLoading, false);
        assert.equal(afterState.isCareerEnded, false, '1학년에서 커리어 종료');
        const ordinal = d => Date.UTC(d.year, d.month - 1, d.day);
        assert.equal(ordinal(afterState.clock.date) - ordinal(clock.date), clock.currentSlot === 'night' ? 86400000 : 0);
        assert.equal(afterState.clock.currentSlot, { morning: 'afternoon', afternoon: 'night', night: 'morning' }[clock.currentSlot]);
        assert.equal(afterState.clock.date.weekday, new Date(ordinal(afterState.clock.date)).getUTCDay());
        assert.deepEqual(saved.gameDate, afterState.clock.date);
        assert.equal(saved.currentSlot, afterState.clock.currentSlot);
        for (const stat of ['overall', 'condition', 'academics', 'contact', 'power', 'stuff', 'control']) assert.ok(Number.isFinite(saved[stat]) && saved[stat] >= 0 && saved[stat] <= 100, `비정상 능력치: ${stat}`);
        // 이벤트 대기/월말/연말도 포함해 실제 저장본에서 복원한다. 날짜·결과는 직접 덮어쓰지 않는다.
        if (stats.slots % 47 === 0 || clock.date.month !== afterState.clock.date.month) {
          const snapshot = structuredClone(saved);
          await store.getState().initClock(snapshot);
          assert.deepEqual(store.getState().clock, afterState.clock);
          assert.deepEqual(store.getState().player.monthlyGoal, snapshot.monthlyGoal);
          assert.deepEqual(store.getState().player.monthlyGoalReports, snapshot.monthlyGoalReports);
          assert.deepEqual(store.getState().player.gradeStartSnapshot, snapshot.gradeStartSnapshot);
          assert.deepEqual(store.getState().player.gradeReports, snapshot.gradeReports);
          assert.equal(store.getState().player.pendingGradeReportId, snapshot.pendingGradeReportId);
          assert.deepEqual(store.getState().player.matchRecords, snapshot.matchRecords);
          assert.deepEqual(store.getState().seasonMatches, snapshot.savedMatches);
          assert.deepEqual(store.getState().player.pendingRivalReport, snapshot.pendingRivalReport);
          assert.deepEqual(store.getState().player.teamCompetition, snapshot.teamCompetition);
          assert.equal(store.getState().activeCutscene?.id, snapshot.pendingEventId);
          stats.reloads++;
        }
      }
      const report = saved.gradeReports[0];
      assert.equal(saved.gradeReports.length, 1);
      assert.equal(report.grade, 1);
      assert.equal(saved.monthlyGoalReports.length, 12);
      assert.equal(new Set(saved.monthlyGoalReports.map(r => r.id)).size, 12);
      assert.deepEqual(report.monthlyGoals, { declared: 12, completed: saved.monthlyGoalReports.filter(r => r.completed).length });
      assert.equal(report.start.partial, false);
      assert.equal(saved.pendingGradeReportId, report.id);
      assert.equal(saved.gradeStartSnapshot.date.grade, 2);
      assert.equal(report.end.percentile, require(path.join(dir, 'data/nationalRanking.js')).getNationalPercentile({ ...saved, overall: report.end.overall, grade: 1 }).percentile);
      for (const id of [...openNationals, 'weekend_league']) assert.ok(report.tournaments.some(t => t.id === `2026:${id}`), `학년 리포트 대회 누락: ${id}`);
      assert.equal(report.officialAppearances + report.benchGames + report.unknownGames, saved.matchRecords.filter(r => !['scrimmage', 'practice'].includes(r.kind)).length);
      await dismissInterruptions(stats);
      const confirmed = structuredClone(saved);
      await store.getState().initClock(confirmed);
      assert.equal(saved.pendingGradeReportId, undefined);
      assert.deepEqual(saved.gradeReports, confirmed.gradeReports);
      assert.equal(stats.slots, 364 * 3, '2026-03-02부터 2027-03-01까지 모든 슬롯을 진행해야 한다');
      assert.equal(days.size, 364);
      assert.equal(months.size, 12);
      assert.deepEqual(store.getState().clock, { date: { year: 2027, month: 3, day: 1, weekday: 1, grade: 2 }, currentSlot: 'morning' });
      for (const id of [...openNationals, 'weekend_league']) assert.ok(coverage.get(id) >= 1, `필수 대회 일정 누락: ${id}`);
      assert.ok(festival, '전국체전 진행 확인 누락');
      if (scenario.region) assert.ok(festival.qualified && festival.games >= 1, '단독 시·도 대표의 전국체전 출전 누락');
      for (const kind of ['scrimmage_', 'practice_']) assert.ok([...coverage.keys()].some(id => id.startsWith(kind)), `${kind} 미진행`);
      assert.ok(stats.summer > 0 && stats.winter > 0, '여름·겨울 방학 오전 자유활동 누락');
      assert.ok(stats.winterTraining > 0, '겨울방학 동계 훈련 전용 활동 미선택');
      assert.ok(stats.events > 0 && stats.reports >= 12 && stats.draws >= 4 && stats.reloads >= 20);
      assert.equal(saved.teamCompetition.grade, 2);
      assert.equal(saved.teamCompetition.roster.find(n => n.id === 'peer').grade, 2);
      assert.equal(saved.matchRecords.length, seenMatches.size, '저장된 연간 경기 기록 누락 또는 중복');
      t.diagnostic(JSON.stringify({ ...scenario, ...stats, festival, days: days.size, matches: seenMatches.size, tournaments: Object.fromEntries(coverage) }));
    } catch (error) {
      error.message += `\nseed=${scenario.seed}; slots=${stats.slots}\n최근 진행:\n${recent.join('\n')}`;
      throw error;
    } finally { Math.random = originalRandom; }
  });
}

const FESTIVAL = 'national_sports_festival';
const QUALIFIER = 'festival_qualifier';
/** 전국체전 게임 일정: 경기 id(라운드_순서) → [월, 일, 시작 시간] */
const FESTIVAL_SCHEDULE = {
  '0_0': [10, 16, '09:00'], '0_1': [10, 16, '11:30'], '0_2': [10, 16, '14:00'], '0_3': [10, 17, '09:00'],
  '0_4': [10, 17, '11:30'], '0_5': [10, 17, '14:00'], '0_6': [10, 18, '09:00'], '0_7': [10, 18, '11:30'],
  '1_0': [10, 18, '14:00'], '1_1': [10, 19, '09:00'], '1_2': [10, 19, '11:30'], '1_3': [10, 19, '14:00'],
  '2_0': [10, 21, '10:00'], '2_1': [10, 21, '12:30'], '3_0': [10, 22, '10:00'],
};
function assertFestivalSchedule(m) {
  const [month, day, time] = FESTIVAL_SCHEDULE[m.id.slice(FESTIVAL.length + 1)];
  assert.deepEqual(m.date, { month, day }, m.id);
  assert.ok(m.description.startsWith(`${time} 경기 · `), m.description);
}
const winnerOf = m => m.result === 'home' ? m.homeSchoolId : m.awaySchoolId;
const regionOf = id => HIGH_SCHOOLS_DATA.find(s => s.id === id)?.region;

/** 선발전·전국체전만 날짜순으로 진행한다. 플레이어 경기는 won 결과로, 다른 학교 경기는 경기일 밤에 처리한다. */
function playFestivalSeason(school, won) {
  let matches = generateSeasonMatches(2026, school, HIGH_SCHOOLS_DATA).filter(m => m.tournamentId === FESTIVAL || m.tournamentId === QUALIFIER);
  for (let t = Date.UTC(2026, 5, 1); t <= Date.UTC(2026, 9, 31); t += 86400000) {
    const d = new Date(t);
    const date = { year: 2026, month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay(), grade: 1 };
    const mine = getPlayerMatchForDate(date, matches);
    if (mine) {
      if (mine.drawn === false) matches = matches.map(m => m.tournamentId === mine.tournamentId ? { ...m, drawn: true } : m);
      matches = progressTournament(matches, { matchId: mine.id, tournamentId: mine.tournamentId, won }, school, HIGH_SCHOOLS_DATA);
    }
    matches = advanceOtherTournamentMatches(matches, date, school);
    const early = matches.filter(m => m.result && m.awaySchoolId !== 'bye' && m.date.month * 32 + m.date.day > date.month * 32 + date.day);
    assert.deepEqual(early.map(m => m.id), [], `경기일 전에 결과가 난 경기 (${date.month}/${date.day})`);
  }
  return matches;
}

test('전국체전: 16개 시·도 대표 대진과 게임 일정, 6월 시·도 대표 선발전', () => {
  const tour = MAJOR_TOURNAMENT_TEMPLATES.find(t => t.id === FESTIVAL);
  assert.equal(tour?.entry, 'provincial');
  const seoul = HIGH_SCHOOLS_DATA.find(s => s.region === '서울');
  const season = generateSeasonMatches(2026, seoul, HIGH_SCHOOLS_DATA);
  const first = season.filter(m => m.tournamentId === FESTIVAL);
  assert.equal(first.length, 8, '1회전 8경기');
  first.forEach(assertFestivalSchedule);
  assert.ok(first.every(m => m.round === '16강전' && m.drawn === true));
  const sides = first.flatMap(m => [m.homeSchoolId, m.awaySchoolId]);
  assert.equal(new Set(sides.map(id => id === 'rep_서울' ? '서울' : regionOf(id))).size, 16, '시·도마다 1개교');
  assert.equal(sides.filter(id => id === 'rep_서울').length, 1, '서울 자리는 선발전 우승교 자리 표시');
  assert.ok(first.every(m => !m.isPlayerTeamMatch), '선발전 전에는 서울 대표 미정');
  const qualifier = season.filter(m => m.tournamentId === QUALIFIER);
  assert.equal(HIGH_SCHOOLS_DATA.filter(s => s.region === '서울').length, 22);
  assert.equal(qualifier.length, 16, '22개교 = 1회전 6경기 + 부전승 10개교');
  assert.equal(qualifier.filter(m => m.awaySchoolId === 'bye').length, 10);
  assert.ok(qualifier.every(m => m.round === '1회전' && m.date.month === 6 && m.date.day === 9));
  assert.equal(new Set(qualifier.flatMap(m => [m.homeSchoolId, m.awaySchoolId]).filter(id => id !== 'bye')).size, 22);
});

test('전국체전: 시·도 배치는 매년 새로 정해진다', () => {
  const seoul = HIGH_SCHOOLS_DATA.find(s => s.region === '서울');
  const layout = year => generateSeasonMatches(year, seoul, HIGH_SCHOOLS_DATA).filter(m => m.tournamentId === FESTIVAL)
    .map(m => `${m.homeSchoolId}:${m.awaySchoolId}`).join(',');
  assert.ok(new Set([2026, 2027, 2028, 2029].map(layout)).size > 1, '해마다 같은 대진');
});

test('전국체전: 학교가 1개뿐인 시·도는 선발전 없이 대표로 출전한다', () => {
  const jeju = HIGH_SCHOOLS_DATA.filter(s => s.region === '제주');
  assert.equal(jeju.length, 1);
  const season = generateSeasonMatches(2026, jeju[0], HIGH_SCHOOLS_DATA);
  assert.equal(season.filter(m => m.tournamentId === QUALIFIER).length, 0);
  const opener = season.filter(m => m.tournamentId === FESTIVAL && m.isPlayerTeamMatch);
  assert.equal(opener.length, 1);
  assert.match(opener[0].description, /^\d\d:\d\d 경기 · .*제주 대표 /);
});

test('전국체전: 선발전 우승 시 대표로 출전하고 대진표 순서대로 결승까지 진행한다', () => {
  const school = HIGH_SCHOOLS_DATA.find(s => s.region === '경남');
  const matches = playFestivalSeason(school, true);
  const qualifierFinal = matches.find(m => m.tournamentId === QUALIFIER && m.round === '결승전');
  assert.equal(winnerOf(qualifierFinal), school.id);
  assert.deepEqual(matches.filter(m => m.tournamentId === QUALIFIER && m.isPlayerTeamMatch).map(m => `${m.date.month}/${m.date.day}`), ['6/16', '6/18', '6/23'], '경남 8개교: 8강·4강·결승은 선발전 마지막 3일');
  const festival = matches.filter(m => m.tournamentId === FESTIVAL);
  assert.equal(festival.length, 15, '16강 8 + 8강 4 + 4강 2 + 결승 1');
  assert.ok(festival.every(m => m.result), '모든 경기 종료');
  assert.ok(!festival.some(m => m.homeSchoolId.startsWith('rep_') || m.awaySchoolId.startsWith('rep_')), '대표 자리 표시 남음');
  festival.forEach(assertFestivalSchedule);
  assert.deepEqual(festival.filter(m => m.isPlayerTeamMatch).map(m => m.round), ['16강전', '8강전', '4강 준결승', '결승전']);
  // 8강 이후 경기: 두 선행 경기 승자끼리, 선행 경기가 끝난 뒤의 시간에 편성된다.
  const startsAt = m => `${String(m.date.month * 32 + m.date.day).padStart(3, '0')} ${m.description.slice(0, 5)}`;
  for (const m of festival.filter(x => !x.id.startsWith(`${FESTIVAL}_0_`))) {
    const [stage, k] = m.id.split('_').slice(-2).map(Number);
    const feeders = [2 * k, 2 * k + 1].map(i => festival.find(x => x.id === `${FESTIVAL}_${stage - 1}_${i}`));
    assert.deepEqual([m.homeSchoolId, m.awaySchoolId], feeders.map(winnerOf), `대진표 트리 불일치: ${m.id}`);
    for (const f of feeders) assert.ok(startsAt(m) > startsAt(f), `선행 경기보다 이른 편성: ${m.id}`);
  }
});

test('전국체전: 선발전에서 탈락하면 같은 시·도 우승교가 대표로 나가고 대회는 그대로 진행된다', () => {
  const school = HIGH_SCHOOLS_DATA.find(s => s.region === '경남');
  const matches = playFestivalSeason(school, false);
  const festival = matches.filter(m => m.tournamentId === FESTIVAL);
  assert.ok(!festival.some(m => m.isPlayerTeamMatch || m.homeSchoolId === school.id || m.awaySchoolId === school.id));
  const qualifierFinal = matches.find(m => m.tournamentId === QUALIFIER && m.round === '결승전');
  const representative = HIGH_SCHOOLS_DATA.find(s => s.id === winnerOf(qualifierFinal));
  assert.equal(representative.region, '경남');
  const opener = festival.find(m => m.round === '16강전' && (m.homeSchoolId === representative.id || m.awaySchoolId === representative.id));
  assert.ok(opener, '경남 선발전 우승교가 경남 자리에 출전');
  assert.ok(opener.description.includes(`경남 대표 ${representative.name}`), opener.description);
  assert.equal(festival.length, 15);
  assert.ok(festival.every(m => m.result));
});

test('전국체전: 이전 버전 저장본은 시기에 맞춰 선발전·대진을 보완한다', () => {
  const school = HIGH_SCHOOLS_DATA.find(s => s.region === '경남');
  const legacy = generateSeasonMatches(2026, school, HIGH_SCHOOLS_DATA).filter(m => m.tournamentId !== FESTIVAL && m.tournamentId !== QUALIFIER);
  const at = (month, day) => ({ year: 2026, month, day, weekday: 1, grade: 1 });
  const spring = addMissingNationals(legacy, 2026, school, HIGH_SCHOOLS_DATA, at(5, 1));
  assert.ok(spring.some(m => m.tournamentId === QUALIFIER && m.isPlayerTeamMatch), '선발전 전이면 선발전부터');
  assert.equal(spring.filter(m => m.tournamentId === FESTIVAL).length, 8);
  assert.equal(spring.filter(m => m.tournamentId !== FESTIVAL && m.tournamentId !== QUALIFIER).length, legacy.length, '기존 경기 보존');
  assert.equal(addMissingNationals(spring, 2026, school, HIGH_SCHOOLS_DATA, at(5, 1)), spring, '이미 있으면 변경 없음');
  const summer = addMissingNationals(legacy, 2026, school, HIGH_SCHOOLS_DATA, at(7, 1));
  assert.equal(summer.filter(m => m.tournamentId === QUALIFIER).length, 0, '선발전이 지났으면 선발전 없음');
  assert.ok(summer.some(m => m.tournamentId === FESTIVAL && m.isPlayerTeamMatch), '선발전을 놓친 저장본은 대표로 출전');
  assert.equal(addMissingNationals(legacy, 2026, school, HIGH_SCHOOLS_DATA, at(10, 20)), legacy, '개막 이후에는 소급 추가하지 않음');
});

const WINTER_IDS = Object.values(SUB_ACTIVITY_POOL).flat().filter(o => o.season === 'winter').map(o => o.id);

test('겨울훈련: 겨울 전용 활동은 겨울방학(12/24~2/5)에만 선택지에 나온다', () => {
  assert.equal(WINTER_IDS.length, 8);
  const offered = (month, day, slot = 'afternoon') => ['training', 'rest', 'relationship', 'special']
    .flatMap(c => sampleSubActivities(c, 100, 'TwoWay', slot, 1, { month, day }))
    .filter(o => o.season === 'winter').map(o => o.id);
  for (const [month, day] of [[12, 23], [2, 6], [7, 30], [11, 15], [3, 2]]) assert.deepEqual(offered(month, day), [], `${month}/${day}에 겨울 활동 노출`);
  for (const [month, day] of [[12, 24], [1, 15], [2, 5]]) {
    assert.ok(isWinterVacation(month, day) && isVacationPeriod(month, day), '겨울방학은 기존 방학 구조의 일부');
    assert.ok(offered(month, day).includes('winter_weight'), `${month}/${day}에 겨울 훈련 누락`);
  }
  // 날짜를 모르면 열지 않는다. 시간대·포지션 제한은 기존 규칙대로 적용된다.
  const bullpen = SUB_ACTIVITY_POOL.training.find(o => o.id === 'winter_indoor_bullpen');
  assert.equal(isActivityAvailable(bullpen, 'P', 'afternoon'), false);
  assert.equal(isActivityAvailable(bullpen, 'P', 'afternoon', 1, { month: 1, day: 10 }), true);
  assert.equal(isActivityAvailable(bullpen, 'SS', 'afternoon', 1, { month: 1, day: 10 }), false);
  assert.equal(isActivityAvailable(bullpen, 'P', 'night', 1, { month: 1, day: 10 }), false);
  assert.deepEqual(offered(1, 10, 'morning').sort(), ['winter_circuit', 'winter_goal_setting', 'winter_hill_running', 'winter_sauna'].sort());
});

test('겨울훈련: 방학 중 선택하면 능력치·인연 효과가 적용되고 기간 밖에서는 거부된다', async () => {
  const school = HIGH_SCHOOLS_DATA[0];
  const at = (date, slot) => ({ ...starter(school, 'TwoWay', 'male'), gameDate: date, currentSlot: slot });
  const stats = { events: 0, reports: 0, draws: 0 };

  await store.getState().initClock(at({ year: 2026, month: 12, day: 22, weekday: 2, grade: 1 }, 'afternoon'));
  const beforeWinter = structuredClone(store.getState().clock);
  await store.getState().selectActivity('afternoon', 'training', 'winter_circuit');
  assert.deepEqual(store.getState().clock, beforeWinter, '방학 전 겨울 활동 선택 거부');
  assert.equal(store.getState().lastActionResult, null);

  await store.getState().initClock(at({ year: 2026, month: 12, day: 28, weekday: 1, grade: 1 }, 'afternoon'));
  assert.match(store.getState().dailyPlan.slots.afternoon.label, /동계 훈련/);
  const before = structuredClone(store.getState().player);
  await store.getState().selectActivity('afternoon', 'training', 'winter_circuit');
  const circuit = store.getState().lastActionResult;
  assert.ok(circuit, '방학 중 겨울 훈련 실행');
  assert.ok(circuit.statChanges.stamina > 0 && circuit.statChanges.speed > 0 && circuit.statChanges.power > 0);
  assert.ok(saved.stamina > before.stamina && saved.speed > before.speed && saved.power > before.power, '능력치 반영');
  assert.equal(saved.relationships.peer, before.relationships.peer + 1, '동기 인연 +1');
  assert.ok(saved.condition < before.condition, '동계 훈련 피로 누적');
  assert.equal(store.getState().clock.currentSlot, 'night');

  await dismissInterruptions(stats);
  const beforeNight = structuredClone(saved);
  await store.getState().selectActivity('night', 'relationship', 'winter_camp_snack');
  assert.equal(saved.relationships.peer, beforeNight.relationships.peer + 3);
  assert.equal(saved.relationships.senior, beforeNight.relationships.senior + 1);
});


test('학년 리포트: 진급 저장 실패 재시도, 미확인 유지, 확인 저장 실패와 중복 방지', async () => {
  const school = HIGH_SCHOOLS_DATA[0];
  const p = starter(school, 'SS', 'male');
  p.gameDate = { year: 2027, month: 2, day: 28, weekday: 0, grade: 1 };
  p.currentSlot = 'night';
  await store.getState().initClock(p);
  assert.equal(saved.gradeStartSnapshot.partial, true);
  const result = { statChanges: {}, logMessage: '학년 마지막 휴식' };
  const before = structuredClone(store.getState().clock);
  failNextSave = true;
  await assert.rejects(store.getState().advanceSlot(result), /save failed/);
  assert.deepEqual(store.getState().clock, before);
  assert.equal(store.getState().player.gradeReports, undefined);
  await store.getState().advanceSlot(result);
  assert.equal(saved.gradeReports.length, 1);
  const pending = saved.pendingGradeReportId;
  await store.getState().initClock(structuredClone(saved));
  assert.equal(saved.pendingGradeReportId, pending);
  const heldClock = structuredClone(store.getState().clock);
  await store.getState().advanceSlot(result);
  assert.deepEqual(store.getState().clock, heldClock, '미확인 리포트가 있으면 시간 진행 금지');
  failNextSave = true;
  await assert.rejects(store.getState().dismissGradeReport(), /save failed/);
  assert.equal(store.getState().player.pendingGradeReportId, pending);
  assert.equal(store.getState().isLoading, false);
  await store.getState().dismissGradeReport();
  await store.getState().initClock(structuredClone(saved));
  assert.equal(saved.pendingGradeReportId, undefined);
  await store.getState().advanceSlot(result);
  assert.equal(saved.gradeReports.length, 1);
  assert.equal(store.getState().clock.currentSlot, 'afternoon');
});

test('학년 리포트: 벤치와 훈련경기 제외, 인연 단계와 업적 차이만 집계', () => {
  const { createGradeSnapshot, finishGradeReport, preserveGradeTournaments } = require(path.join(dir, 'data/gradeReport.js'));
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'male');
  p.earnedAchievementIds = ['ach_entrance'];
  p.gradeStartSnapshot = createGradeSnapshot(p, p.gameDate);
  p.relationships.peer = 100;
  p.academics = 95;
  p.matchRecords = [
    { kind: 'national', performance: { role: 'bench' } },
    { kind: 'national', performance: { role: 'pinchRun' } },
    { kind: 'practice', performance: { role: 'starter' } },
    { kind: 'national' },
  ];
  const match = { id: 'final', year: 2026, tournamentId: 'blue_dragon', tournamentName: '청룡기', kind: 'national', date: { month: 7, day: 25 }, isPlayerTeamMatch: true, homeSchoolName: p.highSchool, awaySchoolName: '상대', result: 'away', round: '결승전' };
  const archived = preserveGradeTournaments(p, [match]);
  archived.savedMatches = [];
  const report = finishGradeReport(archived, { year: 2027, month: 2, day: 28, weekday: 0, grade: 1 }).gradeReports[0];
  assert.equal(report.officialAppearances, 1);
  assert.equal(report.benchGames, 1);
  assert.equal(report.unknownGames, 1);
  assert.deepEqual(report.newBonds, ['peer']);
  assert.ok(report.achievements.some(a => a.id === 'ach_academic_excellence'));
  assert.ok(!report.achievements.some(a => a.id === 'ach_entrance'));
  assert.equal(report.tournaments[0].result, '준우승');
});

test('학년 리포트: 2학년 진급과 3학년 졸업도 해당 학년으로 마감', async () => {
  for (const grade of [2, 3]) {
    const p = starter(HIGH_SCHOOLS_DATA[0], 'P', 'female');
    const year = 2026 + grade;
    const lastDay = year === 2028 ? 29 : 28;
    p.grade = grade;
    p.gameDate = { year, month: 2, day: lastDay, weekday: new Date(Date.UTC(year, 1, lastDay)).getUTCDay(), grade };
    p.currentSlot = 'night';
    await store.getState().initClock(p);
    await store.getState().advanceSlot({ statChanges: {}, logMessage: '학년 마지막 날' });
    assert.equal(saved.gradeReports.length, 1);
    assert.equal(saved.gradeReports[0].grade, grade);
    assert.equal(store.getState().clock.date.grade, Math.min(3, grade + 1));
    assert.equal(store.getState().isCareerEnded, grade === 3);
  }
});


test('월간 목표: 선언 저장 실패·변경 금지·월말 보상 한 번·재접속 보존', async () => {
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'male');
  p.gameDate = { year: 2026, month: 5, day: 31, weekday: 0, grade: 1 };
  p.currentSlot = 'night';
  await store.getState().initClock(p);
  const beforeClock = structuredClone(store.getState().clock);
  failNextSave = true;
  await assert.rejects(store.getState().declareMonthlyGoal('recovery'), /save failed/);
  assert.equal(store.getState().player.monthlyGoal, undefined);
  await store.getState().declareMonthlyGoal('recovery');
  assert.equal(saved.monthlyGoal.target, 1);
  assert.deepEqual(store.getState().clock, beforeClock);
  await store.getState().declareMonthlyGoal('teamwork');
  assert.equal(saved.monthlyGoal.kind, 'recovery');
  const beforeBond = saved.relationships.coach;
  const action = { activityCategory: 'rest', statChanges: {}, staminaDelta: 0, logMessage: '휴식 목표 검증' };
  failNextSave = true;
  await assert.rejects(store.getState().advanceSlot(action), /save failed/);
  assert.equal(store.getState().player.monthlyGoal.progress, 0);
  assert.equal(store.getState().player.relationships.coach, beforeBond);
  await store.getState().advanceSlot(action);
  assert.equal(saved.monthlyGoalReports.length, 1);
  assert.equal(saved.monthlyGoalReports[0].completed, true);
  assert.equal(saved.relationships.coach, beforeBond + 2);
  const settled = structuredClone(saved);
  await store.getState().initClock(settled);
  assert.deepEqual(saved.monthlyGoalReports, settled.monthlyGoalReports);
  assert.equal(saved.relationships.coach, beforeBond + 2);
  await store.getState().declareMonthlyGoal('teamwork');
  assert.equal(saved.monthlyGoal.month, 6);
  assert.equal(saved.monthlyGoal.progress, 0);
});

test('월간 목표: 소급·경기·개인 친구 보상 제외, 상한/기간/이월과 표시 기준 일치', () => {
  const { getMonthlyGoalOptions, progressMonthlyGoal, settleMonthlyGoal, optionMatchesMonthlyGoal } = require(path.join(dir, 'data/monthlyGoals.js'));
  const p = starter(HIGH_SCHOOLS_DATA[0], 'P', 'male');
  const date = { year: 2028, month: 2, day: 28, weekday: 1, grade: 2 };
  const goals = getMonthlyGoalOptions(p, date);
  assert.ok(goals.every(g => g.target === 1));
  p.monthlyGoal = goals.find(g => g.kind === 'technique');
  const bullpen = SUB_ACTIVITY_POOL.training.find(o => o.id === 'winter_indoor_bullpen');
  assert.equal(optionMatchesMonthlyGoal(p.monthlyGoal, bullpen), true);
  const result = { activityId: bullpen.id, activityCategory: 'training', statChanges: {}, staminaDelta: 0, logMessage: '저효율·상한 훈련' };
  const progressed = progressMonthlyGoal(p, result, date);
  assert.equal(progressed.monthlyGoal.progress, 1, '실제 성장량 0도 기술 훈련 수행 인정');
  assert.equal(progressMonthlyGoal(progressed, result, date).monthlyGoal.progress, 1);
  assert.equal(progressMonthlyGoal(p, { ...result, activityCategory: 'match' }, date).monthlyGoal.progress, 0);
  assert.equal(progressMonthlyGoal(p, result, { ...date, year: 2029 }).monthlyGoal.progress, 0);
  progressed.relationships.coach2 = 100;
  const settled = settleMonthlyGoal(progressed, date);
  assert.deepEqual(settled.monthlyGoalReports[0].reward, {});
  assert.deepEqual(settleMonthlyGoal(settled, date), settled);
  p.monthlyGoal = goals.find(g => g.kind === 'teamwork');
  const friend = { activityCategory: 'relationship', statChanges: {}, relationshipTargets: { childhood: 3 } };
  assert.equal(progressMonthlyGoal(p, friend, date).monthlyGoal.progress, 0);
  const missed = settleMonthlyGoal(p, date);
  assert.equal(missed.monthlyGoalReports[0].completed, false);
  assert.deepEqual(missed.relationships, p.relationships, '미달성 벌점 없음');
});


test('저장 안정화: 초기화 실패 후 잠금 해제와 졸업 재접속 시 종료 유지', async () => {
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'male');
  failNextSave = true;
  await assert.rejects(store.getState().initClock(p), /save failed/);
  assert.equal(store.getState().isLoading, false);
  p.grade = 3;
  p.gameDate = { year: 2029, month: 2, day: 28, weekday: 3, grade: 3 };
  p.currentSlot = 'night';
  await store.getState().initClock(p);
  await store.getState().advanceSlot({ statChanges: {}, logMessage: '졸업 전 마지막 휴식' });
  assert.equal(saved.careerEndedAt.month, 3);
  const clock = structuredClone(store.getState().clock);
  await store.getState().initClock(structuredClone(saved));
  assert.equal(store.getState().isCareerEnded, true);
  await dismissInterruptions({ events: 0, reports: 0, draws: 0 });
  await store.getState().advanceSlot({ statChanges: {}, logMessage: '졸업 후 진행 금지' });
  assert.deepEqual(store.getState().clock, clock);
  const legacy = structuredClone(saved);
  delete legacy.careerEndedAt;
  await store.getState().initClock(legacy);
  assert.equal(store.getState().isCareerEnded, true, '기존 졸업 리포트 저장본도 종료 유지');
});

test('저장 안정화: 동시 구매·장비·외형 저장은 진행 저장을 덮어쓰지 않는다', async () => {
  const { EQUIPMENT_CATALOG } = require(path.join(dir, 'types/equipment.js'));
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'male');
  p.money = 999999;
  await store.getState().initClock(p);
  const item = EQUIPMENT_CATALOG.find(i => i.slot === 'bat');
  let release;
  holdNextSave = new Promise(resolve => { release = resolve; });
  const purchase = store.getState().purchaseEquipment(item.id);
  assert.equal(store.getState().isLoading, true);
  assert.equal(await store.getState().purchaseEquipment(item.id), false);
  await assert.rejects(store.getState().initClock(p), /다른 저장/);
  assert.equal(store.getState().isLoading, true, '불러오기 충돌이 기존 저장 잠금을 풀지 않음');
  await store.getState().equipItem(item.id, item.slot);
  await store.getState().saveAppearance({ ...store.getState().player.appearance, hairStyleId: 'male_buzz' });
  await store.getState().advanceSlot({ statChanges: {}, logMessage: '동시 진행 방지' });
  assert.equal(store.getState().clock.currentSlot, 'morning');
  release();
  assert.equal(await purchase, true);
  assert.equal(saved.inventory.filter(id => id === item.id).length, 1);
  assert.equal(saved.money, p.money - item.price);
  const before = structuredClone(saved);
  failNextSave = true;
  await assert.rejects(store.getState().equipItem(item.id, item.slot), /save failed/);
  assert.deepEqual(saved, before);
  assert.deepEqual(store.getState().player, before);
  assert.equal(store.getState().isLoading, false);
  await store.getState().equipItem(item.id, item.slot);
  assert.equal(saved.equippedItems[item.slot], item.id);
});


test('3개년 연결: 1학년부터 윤년을 거쳐 졸업·재접속까지 실제 슬롯 진행', { timeout: 60000 }, async t => {
  const random = Math.random;
  Math.random = seededRandom(31415);
  const stats = { events: 0, reports: 0, draws: 0, slots: 0, reloads: 0 };
  try {
    const initial = starter(HIGH_SCHOOLS_DATA.find(s => s.region === '제주'), 'TwoWay', 'female');
    initial.careerJourney = { ...createCareerJourney(), met: ['mother','father','coach'] };
    await store.getState().initClock(initial);
    while (!store.getState().isCareerEnded && stats.slots < 3300) {
      await dismissInterruptions(stats);
      const state = store.getState();
      const { date, currentSlot } = state.clock;
      const { isGoalForMonth } = require(path.join(dir, 'data/monthlyGoals.js'));
      if (!isGoalForMonth(state.player.monthlyGoal, date)) await state.declareMonthlyGoal('recovery');
      const before = key(state.clock);
      if (state.dailyPlan.slots[currentSlot].forced) await state.executeForcedSlot(currentSlot);
      else {
        const categories = getActivityCategories(currentSlot, isSchoolDay(date)).map(c => c.category);
        const category = state.player.condition < 65 ? 'rest' : categories[stats.slots % categories.length];
        const options = SUB_ACTIVITY_POOL[category].filter(o => isActivityAvailable(o, state.player.position, currentSlot, date.grade, date) && canDoSocialActivity(state.player,o));
        assert.ok(options.length);
        await state.selectActivity(currentSlot, category, options[stats.slots % options.length].id);
      }
      assert.notEqual(key(store.getState().clock), before);
      stats.slots++;
      if (stats.slots % 113 === 0) { await store.getState().initClock(structuredClone(saved)); stats.reloads++; }
    }
    assert.equal(stats.slots, 1095 * 3, '364일 + 윤년 366일 + 365일');
    assert.equal(store.getState().isCareerEnded, true);
    assert.equal(saved.careerJourney.ending.route, 'club');
    for (const id of ['deskmate','teacher','coach2','peer','rival','junior']) assert.ok(hasMet(saved,id), id + ' 첫 만남 누락');
    for (const id of ['year1_first_goal','year2_leadership','year2_competition','year3_responsibility','year3_last_summer','year3_future']) assert.ok(saved.careerJourney.completedScenes.includes(id), id + ' 학년 이야기 누락');
    assert.deepEqual(saved.gradeReports.map(r => r.grade), [1, 2, 3]);
    assert.equal(new Set(saved.gradeReports.map(r => r.id)).size, 3);
    assert.equal(saved.monthlyGoalReports.length, 36);
    const records = saved.matchRecords;
    assert.equal(new Set(records.map(r => `${r.year}:${r.matchId}`)).size, records.length);
    await store.getState().initClock(structuredClone(saved));
    assert.equal(store.getState().isCareerEnded, true);
    await dismissInterruptions(stats);
    const clock = structuredClone(store.getState().clock);
    await store.getState().advanceSlot({ statChanges: {}, logMessage: '졸업 이후 슬롯 차단' });
    assert.deepEqual(store.getState().clock, clock);
    assert.deepEqual(saved.gradeReports.map(r => r.monthlyGoals.declared), [12, 12, 12]);
    t.diagnostic(JSON.stringify({ ...stats, gradeReports: saved.gradeReports.length, monthlyReports: saved.monthlyGoalReports.length, matches: records.length }));
  } finally { Math.random = random; }
});


test('91개 학교의 전후반기는 같은 조 상대와 한 번씩 최대 6경기, 토요일에 진행한다', () => {
  for (const year of [2026, 2027, 2028]) for (const school of HIGH_SCHOOLS_DATA) {
    const matches = generateSeasonMatches(year, school, HIGH_SCHOOLS_DATA);
    const own = matches.filter(m => m.isPlayerTeamMatch);
    assert.equal(new Set(own.map(m => `${m.date.month}-${m.date.day}`)).size, own.length, '하루 두 경기 금지');
    for (const half of [1, 2]) {
      const games = matches.filter(m => m.leagueHalf === half);
      const group = getWeekendGroup(school, HIGH_SCHOOLS_DATA, half);
      assert.equal(games.length, group.teams.length - 1);
      assert.ok(games.length >= 4 && games.length <= 6, `${school.name} 반기 ${games.length}경기`);
      const opponents = games.map(m => m.homeSchoolId === school.id ? m.awaySchoolId : m.homeSchoolId);
      assert.equal(new Set(opponents).size, games.length);
      for (const m of games) {
        assert.equal(new Date(year, m.date.month - 1, m.date.day).getDay(), 6);
        assert.ok(group.teams.some(s => s.id === m.awaySchoolId));
        assert.equal(m.year, year);
        assert.ok(m.round.startsWith(half === 1 ? '전반기' : '후반기'));
      }
    }
    for (const id of openNationals) assert.ok(own.some(m => m.tournamentId === id), `${school.name} ${id} 누락`);
  }
});

test('후반기 조는 재편성되며 전국대회 시즌은 이마트→황금→청룡→대통령→봉황 순서다', () => {
  const school = HIGH_SCHOOLS_DATA[0];
  assert.notDeepEqual(getWeekendGroup(school, HIGH_SCHOOLS_DATA, 1).teams.map(s => s.id), getWeekendGroup(school, HIGH_SCHOOLS_DATA, 2).teams.map(s => s.id));
  const dates = openNationals.map(id => MAJOR_TOURNAMENT_TEMPLATES.find(t => t.id === id).startDate);
  assert.ok(dates.every((d, i) => !i || d.month * 32 + d.day > dates[i - 1].month * 32 + dates[i - 1].day));
});

test('기존 저장본은 경기 결과·지난 일정을 보존하고 남은 주말리그만 한 번 바꾼다', () => {
  const school = HIGH_SCHOOLS_DATA[0];
  const planned = generateWeekendMatches(2026, school, HIGH_SCHOOLS_DATA);
  const past = { ...planned[0], id: 'weekend_3_7', scheduleVersion: undefined, result: 'home' };
  const unplayedPast = { ...planned[1], id: 'weekend_3_14', scheduleVersion: undefined };
  const future = { ...planned[2], id: 'weekend_9_12', scheduleVersion: undefined, date: { month: 9, day: 12 } };
  const from = { year: 2026, month: 3, day: 21, grade: 1, weekday: 6 };
  const input = [past, unplayedPast, future];
  const snapshot = structuredClone(input);
  const migrated = migrateWeekendMatches(input, 2026, school, HIGH_SCHOOLS_DATA, from);
  assert.deepEqual(input, snapshot, '원본 저장본 변경 금지');
  assert.equal(migrated.find(m => m.id === past.id).result, 'home');
  assert.deepEqual(migrated.find(m => m.id === past.id).date, past.date);
  assert.ok(migrated.some(m => m.id === unplayedPast.id));
  assert.ok(!migrated.some(m => m.id === future.id));
  assert.ok(migrated.filter(m => m.id !== past.id).every(m => !(m.homeSchoolId === (past.homeSchoolId === school.id ? past.awaySchoolId : past.homeSchoolId) && m.leagueHalf === 1)));
  assert.deepEqual(migrateWeekendMatches(migrated, 2026, school, HIGH_SCHOOLS_DATA, from), migrated);
});

test('여섯 경기 이상 이미 끝난 반기는 새 경기를 추가하지 않는다', () => {
  const school = HIGH_SCHOOLS_DATA[0];
  const base = generateWeekendMatches(2026, school, HIGH_SCHOOLS_DATA)[0];
  const played = Array.from({ length: 7 }, (_, i) => ({ ...base, id: `weekend_3_${i + 1}`, scheduleVersion: undefined, result: 'home' }));
  const migrated = migrateWeekendMatches(played, 2026, school, HIGH_SCHOOLS_DATA, { year: 2026, month: 3, day: 8, grade: 1, weekday: 0 });
  assert.equal(migrated.filter(m => m.leagueHalf === 1).length, 7);
  assert.ok(migrated.filter(m => m.leagueHalf === 1).every(m => m.result));
});

test('새 소식은 선수·세부 메뉴별이고 읽지 않은 다른 메뉴와 새 달의 알림은 유지한다', async () => {
  const p = starter(HIGH_SCHOOLS_DATA[0], 'P', 'male');
  p.inventory = ['notebook-test'];
  p.traits = ['테스트 특성'];
  await store.getState().initClock(p);
  const state = store.getState();
  const news = getUnreadNews(state.player, state.clock.date);
  const ratingIds = news.filter(n => n.tab === 'info' && n.section === 'ratings').map(n => n.id);
  assert.ok(ratingIds.length);
  await store.getState().readNews(ratingIds);
  const snapshot = structuredClone(saved);
  await store.getState().initClock(snapshot);
  const reloaded = store.getState();
  assert.ok(!getUnreadNews(reloaded.player, reloaded.clock.date).some(n => ratingIds.includes(n.id)));
  assert.ok(getUnreadNews(reloaded.player, reloaded.clock.date).some(n => n.section === 'equipment'));
  assert.ok(getUnreadNews(reloaded.player, reloaded.clock.date).some(n => n.tab === 'goals'));
  assert.ok(getUnreadNews({ ...reloaded.player, overall: reloaded.player.overall + 1 }, reloaded.clock.date).some(n => n.section === 'ratings'));
  const plan = collectPlayerNews(reloaded.player, reloaded.clock.date).find(n => n.section === 'monthly');
  await store.getState().readNews([plan.id]);
  assert.ok(getUnreadNews(saved, { ...reloaded.clock.date, month: 4 }).some(n => n.id === 'plan:2026:4'));
  assert.ok(getUnreadNews(starter(HIGH_SCHOOLS_DATA[0], 'P', 'male'), reloaded.clock.date).some(n => ratingIds.includes(n.id)));
});

test('알림 읽음 저장 실패는 알림을 없애거나 선수 데이터를 바꾸지 않는다', async () => {
  await store.getState().initClock(starter(HIGH_SCHOOLS_DATA[0], 'SS', 'female'));
  const snapshot = structuredClone(store.getState().player);
  const news = getUnreadNews(snapshot, store.getState().clock.date);
  failNextSave = true;
  await assert.rejects(store.getState().readNews(news.map(n => n.id)), /save failed/);
  assert.deepEqual(store.getState().player, snapshot);
  assert.equal(store.getState().isLoading, false);
  assert.equal(getUnreadNews(store.getState().player, store.getState().clock.date).length, news.length);
});


test('일부 새 주말리그와 과거 일정이 함께 있는 저장본도 경기 ID를 중복 생성하지 않는다', () => {
  const school = HIGH_SCHOOLS_DATA[0];
  const current = generateWeekendMatches(2026, school, HIGH_SCHOOLS_DATA);
  const legacy = { ...current[0], id: 'weekend_3_7', scheduleVersion: undefined, result: 'home' };
  const migrated = migrateWeekendMatches([legacy, ...current.slice(1)], 2026, school, HIGH_SCHOOLS_DATA, { year: 2026, month: 3, day: 8, weekday: 0, grade: 1 });
  assert.equal(new Set(migrated.map(m => m.id)).size, migrated.length);
  assert.equal(migrated.length, current.length);
});

test('첫 만남: 대화 완료 후 등록, 미지 인물 활동 차단, 저장 실패와 재접속 보존', async () => {
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'male');
  p.careerJourney = { ...createCareerJourney(), met: ['mother','father','coach'] };
  p.relationships.deskmate=76;
  await store.getState().initClock(p);
  assert.equal(store.getState().activeCutscene.id, 'meet_teacher');
  assert.equal(hasMet(saved,'teacher'), false);
  assert.ok(!collectPlayerNews(saved,saved.gameDate).some(n=>n.id.startsWith('bond:deskmate:') || n.id==='met:deskmate'));
  const clock = structuredClone(store.getState().clock);
  failNextSave = true;
  await assert.rejects(store.getState().resolveCutscene('learn'), /save failed/);
  assert.equal(hasMet(store.getState().player,'teacher'), false);
  assert.equal(store.getState().activeCutscene.id, 'meet_teacher');
  await store.getState().initClock(structuredClone(saved));
  await store.getState().resolveCutscene('learn');
  assert.equal(hasMet(saved,'teacher'), true);
  assert.equal(store.getState().lastActionResult.relationshipTargets.teacher,2);
  assert.ok(collectPlayerNews(saved,saved.gameDate).some(n=>n.id==='met:teacher'));
  assert.deepEqual(store.getState().clock, clock, '소개는 시간을 추가 소비하지 않는다');
  await store.getState().initClock(structuredClone(saved));
  assert.equal(store.getState().activeCutscene, null);
  assert.equal(saved.careerJourney.completedScenes.filter(id => id === 'meet_teacher').length, 1);
  const unknown = SUB_ACTIVITY_POOL.relationship.find(o => Object.keys(o.relationshipTargets ?? {}).includes('deskmate'));
  assert.ok(unknown);
  assert.equal(canDoSocialActivity(saved,unknown), false);
  const snapshot = structuredClone(saved);
  await store.getState().selectActivity('morning','relationship',unknown.id);
  assert.deepEqual(saved, snapshot);
  const offered = sampleSubActivities('relationship', 100, 'SS', 'morning', 1, saved.gameDate, saved);
  assert.ok(offered.every(o => canDoSocialActivity(saved,o)));
});

test('기존 저장: 이미 아는 인물·점수·캐스트를 유지하고 첫 만남을 강요하지 않는다', async () => {
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'female');
  p.relationships.deskmate = 76;
  await store.getState().initClock(p);
  assert.equal(hasMet(saved,'deskmate'), true);
  assert.equal(saved.relationships.deskmate, 76);
  assert.equal(store.getState().activeCutscene, null);
});

test('진로: 미출전·연습경기는 제안 요건에서 제외하고 선택·졸업·저장 실패를 보존한다', async () => {
  const p = starter(HIGH_SCHOOLS_DATA[0], 'SS', 'male');
  p.gameDate = {year:2028,month:9,day:2,weekday:6,grade:3}; p.grade=3;
  for (const key of ['contact','power','eye','speed','defense']) p[key]=75;
  for (const key of Object.keys(require(path.join(dir,'data/playerDevelopment.js')).EXTRA_RATINGS)) p[key]=75;
  p.fame=60; p.academics=60;
  p.matchRecords = Array.from({length:12},(_,i)=>({matchId:'official-'+i,year:2028,kind:'weekend',performance:{role:'starter'},log:'출전'}));
  assert.deepEqual(eligibleRoutes(p), ['club','university','professional','overseas']);
  assert.deepEqual(eligibleRoutes({...p,matchRecords:p.matchRecords.map(r=>({...r,kind:'practice'}))}), ['club']);
  assert.deepEqual(eligibleRoutes({...p,matchRecords:p.matchRecords.map(r=>({...r,performance:{role:'bench'}}))}), ['club']);
  await store.getState().initClock(p);
  failNextSave=true;
  await assert.rejects(store.getState().chooseCareerRoute('professional'), /save failed/);
  assert.equal(store.getState().player.careerJourney.chosenRoute, undefined);
  await store.getState().chooseCareerRoute('professional');
  await store.getState().initClock(structuredClone(saved));
  assert.equal(saved.careerJourney.chosenRoute, 'professional');
  const ending=updateCareerProgress({...saved,careerEndedAt:{year:2029,month:3,day:1,weekday:4,grade:3}},true);
  assert.equal(ending.careerJourney.ending.route, 'professional');
  assert.deepEqual(updateCareerProgress(ending,true).careerJourney.ending,ending.careerJourney.ending);
  await store.getState().initClock(ending);
  await store.getState().chooseCareerRoute('club');
  assert.equal(saved.careerJourney.ending.route, 'professional');
});

test('경기 선택: 출전 역할과 능력·피로에 따른 접근, 미출전의 수동 개입 차단', () => {
  const p=starter(HIGH_SCHOOLS_DATA[0],'SS','male');
  const match={id:'decision-match',year:2026,tournamentId:'practice',date:{month:3,day:2},isPlayerTeamMatch:true};
  p.teamCompetition={selection:{matchId:match.id,year:2026,role:'starter'}};
  p.contact=70;p.power=35;p.eye=55;
  const choices=matchDecisions(p,match);
  assert.equal(choices.length,3);
  assert.ok(choices.find(d=>d.id==='contact').bonus>choices.find(d=>d.id==='attack').bonus);
  assert.ok(choices.find(d=>d.id==='attack').homerBonus>0);
  assert.ok(choices.find(d=>d.id==='attack').hitBonus<0);
  assert.ok(matchDecisions({...p,condition:20},match)[0].bonus<choices[0].bonus);
  assert.deepEqual(matchDecisions({...p,teamCompetition:{selection:{matchId:match.id,year:2026,role:'outside'}}},match),[]);
  assert.deepEqual(matchDecisions({...p,position:'P'},match).map(d=>d.id),['challenge','corners','mix']);
});

test('학교 성향·동료 호흡: 학교와 인연에 따라 효과가 달라지고 실제 성장만 기록한다', async () => {
  const p=starter(HIGH_SCHOOLS_DATA[0],'SS','male');
  p.relationships.peer=70;p.relationships.coach2=70;
  assert.equal(chemistry(p).bonus,.05);
  assert.equal(chemistry({...p,careerJourney:createCareerJourney()}).bonus,0);
  assert.ok(new Set(HIGH_SCHOOLS_DATA.map(s=>schoolTrainingCulture({...p,highSchool:s.name}).label)).size===3);
  p.currentSlot='night';
  await store.getState().initClock(p);
  await store.getState().selectActivity('night','training',SUB_ACTIVITY_POOL.training.find(o=>o.id==='night_shadow')?.id ?? SUB_ACTIVITY_POOL.training.find(o=>isActivityAvailable(o,'SS','night',1,p.gameDate)).id);
  assert.ok(Object.values(saved.careerJourney.trainingGrowth).some(v=>v>0));
  const growth=structuredClone(saved.careerJourney.trainingGrowth);
  await store.getState().initClock(structuredClone(saved));
  assert.deepEqual(saved.careerJourney.trainingGrowth,growth);
});

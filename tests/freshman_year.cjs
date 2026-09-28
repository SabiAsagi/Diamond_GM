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
require.cache[path.join(dir, 'db.js')] = { id: path.join(dir, 'db.js'), filename: path.join(dir, 'db.js'), loaded: true,
  exports: { db: { players: { put: async p => { saved = structuredClone(p); return p.id; } } } } };
after(() => fs.rmSync(dir, { recursive: true, force: true }));
const { useGameClockStore: store } = require(path.join(dir, 'store/gameClockStore.js'));
const { HIGH_SCHOOLS_DATA } = require(path.join(dir, 'data/highSchools.js'));
const { normalizePlayer } = require(path.join(dir, 'data/playerDevelopment.js'));
const { INITIAL_RELATIONSHIPS } = require(path.join(dir, 'types/bondScores.js'));
const { SUB_ACTIVITY_POOL, getActivityCategories, isActivityAvailable } = require(path.join(dir, 'types/activity.js'));
const { isSchoolDay, isVacationPeriod } = require(path.join(dir, 'types/academicCalendar.js'));
const { MAJOR_TOURNAMENT_TEMPLATES } = require(path.join(dir, 'types/tournament.js'));
const existingNationals = ['emart_spring', 'golden_lion', 'blue_dragon', 'phoenix_autumn'];
function seededRandom(seed) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
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
]) {
  test(`1학년 완주: ${scenario.position}/${scenario.tier}학교/seed=${scenario.seed}`, { timeout: 60000 }, async t => {
    const originalRandom = Math.random;
    Math.random = seededRandom(scenario.seed);
    const stats = { events: 0, reports: 0, draws: 0, reloads: 0, slots: 0, summer: 0, winter: 0 };
    const coverage = new Map();
    const seenSlots = new Set();
    const seenMatches = new Set();
    const days = new Set();
    const recent = [];
    const months = new Set();
    let result;
    try {
      const school = HIGH_SCHOOLS_DATA.find(s => s.tier === scenario.tier);
      assert.ok(school, `학교 티어 ${scenario.tier} 누락`);
      await store.getState().initClock(starter(school, scenario.position, scenario.gender));
      while (store.getState().clock.date.grade === 1 && stats.slots < 370 * 3) {
        await dismissInterruptions(stats);
        const before = store.getState();
        const clock = structuredClone(before.clock);
        const slotKey = key(clock);
        assert.ok(!seenSlots.has(slotKey), `동일 슬롯 재진입: ${slotKey}`);
        seenSlots.add(slotKey);
        days.add(slotKey.split('/')[0]);
        months.add(`${clock.date.year}-${clock.date.month}`);
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
          const candidates = SUB_ACTIVITY_POOL[preferred].filter(o => isActivityAvailable(o, before.player.position, clock.currentSlot, 1));
          assert.ok(candidates.length, `선택 가능한 활동 없음: ${slotKey}/${preferred}`);
          const option = candidates[stats.slots % candidates.length];
          await before.selectActivity(clock.currentSlot, preferred, option.id);
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
          assert.deepEqual(store.getState().player.matchRecords, snapshot.matchRecords);
          assert.deepEqual(store.getState().seasonMatches, snapshot.savedMatches);
          assert.deepEqual(store.getState().player.pendingRivalReport, snapshot.pendingRivalReport);
          assert.deepEqual(store.getState().player.teamCompetition, snapshot.teamCompetition);
          assert.equal(store.getState().activeCutscene?.id, snapshot.pendingEventId);
          stats.reloads++;
        }
      }
      await dismissInterruptions(stats);
      assert.equal(stats.slots, 364 * 3, '2026-03-02부터 2027-03-01까지 모든 슬롯을 진행해야 한다');
      assert.equal(days.size, 364);
      assert.equal(months.size, 12);
      assert.deepEqual(store.getState().clock, { date: { year: 2027, month: 3, day: 1, weekday: 1, grade: 2 }, currentSlot: 'morning' });
      for (const id of [...existingNationals, 'weekend_league']) assert.ok(coverage.get(id) >= 1, `필수 대회 일정 누락: ${id}`);
      for (const kind of ['scrimmage_', 'practice_']) assert.ok([...coverage.keys()].some(id => id.startsWith(kind)), `${kind} 미진행`);
      assert.ok(stats.summer > 0 && stats.winter > 0, '여름·겨울 방학 오전 자유활동 누락');
      assert.ok(stats.events > 0 && stats.reports >= 12 && stats.draws >= 4 && stats.reloads >= 20);
      assert.equal(saved.teamCompetition.grade, 2);
      assert.equal(saved.teamCompetition.roster.find(n => n.id === 'peer').grade, 2);
      assert.equal(saved.matchRecords.length, seenMatches.size, '저장된 연간 경기 기록 누락 또는 중복');
      t.diagnostic(JSON.stringify({ ...scenario, ...stats, days: days.size, matches: seenMatches.size, tournaments: Object.fromEntries(coverage) }));
    } catch (error) {
      error.message += `\nseed=${scenario.seed}; slots=${stats.slots}\n최근 진행:\n${recent.join('\n')}`;
      throw error;
    } finally { Math.random = originalRandom; }
  });
}

// 구현 전 요구사항을 실행 가능한 TODO로 드러낸다. v1.11에서 TODO를 제거하고 완주 coverage에도 추가한다.
test('v1.11 합격 조건: 전국체전 대회가 존재한다', { todo: '전국체전은 다음 단계에서 추가; 현재 v2.0 완성 판정 불가' }, () => {
  assert.ok(MAJOR_TOURNAMENT_TEMPLATES.some(t => t.id === 'national_sports_festival'), '전국체전 템플릿 미구현');
});

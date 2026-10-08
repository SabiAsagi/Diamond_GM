import { collectPlayerNews } from '../data/news';
import { INTRODUCTION_SCENES, GRADE_STORY_SCENES, nextJourneyScene, migrateCareerJourney, canDoSocialActivity, recordCareerAction, updateCareerProgress, schoolTrainingCulture, type CareerRoute } from '../data/careerJourney';
import type { MatchDecisionId } from '../data/matchDecisions';
import { migrateWeekendMatches } from '../data/weekendLeague';
import { getMonthlyGoalOptions, isGoalForMonth, progressMonthlyGoal, settleMonthlyGoal, type MonthlyGoalKind } from '../data/monthlyGoals';
import { createGradeSnapshot, preserveGradeTournaments, finishGradeReport } from '../data/gradeReport';
import { prepareTeamContext, updateCompetitionAfterAction, TEAM_ROLE_LABELS, dateNumber, refreshTeamEvaluation } from '../data/teamCompetition';
import { getBallparkVisit } from '../data/proSchedule';
import { initializeRival, updateMonthlyRival } from '../data/rival';
import { applyBondChanges, formatBondChanges, actualBondChanges } from '../types/bondScores';
import { personalizeText } from '../data/cast';
import { captureAchievements } from '../data/achievements';
import { normalizePlayer, EXTRA_RATINGS, trainPitch, overallRating } from '../data/playerDevelopment';
import { create } from 'zustand';
import type { Player } from '../types';
import type { GameClock, GameDate, TimeSlot } from '../types/calendar';
import { START_GAME_DATE, advanceGameDate } from '../types/calendar';
import type { DailyPlan, DailyActivityCategory } from '../types/dailySchedule';
import { buildDailyPlan } from '../types/dailySchedule';
import type { AcademicEvent } from '../types/academicCalendar';
import { ACADEMIC_CALENDAR_TEMPLATE, getActiveAcademicEvent, isSchoolDay } from '../types/academicCalendar';
import type { ScheduledMatch } from '../types/tournament';
import { generateSeasonMatches, addClubMatches, addMissingNationals, getPlayerMatchForDate, progressTournament, advanceOtherTournamentMatches } from '../types/tournament';
import type { ActivityResult } from '../types/activity';
import { SUB_ACTIVITY_POOL, evaluateActivityWithGating, isActivityAvailable } from '../types/activity';
import { resolveMatchPlaceholder } from './matchResolver';
import { resolveAcademicEvent } from './eventResolver';
import type { HighSchoolData } from '../types/highSchool';
import { getHighSchoolDataByName, HIGH_SCHOOLS_DATA } from '../data/highSchools';
import type { EventCutscene, CutsceneTriggerHistory } from '../types/randomEvent';
import { shouldTriggerCutscene } from '../types/randomEvent';
import { CUTSCENE_EVENTS_POOL } from '../data/cutsceneEvents';
import { db } from '../db';
import type { EquipmentSlot } from '../types/equipment';
import { EQUIPMENT_CATALOG, isEquipmentRelevant } from '../types/equipment';
import type { OutdoorLocation } from '../types/outdoorMap';
import { getTrainingEfficiencyMultiplier } from '../types/relationship';

const ALL_CUTSCENES = [...INTRODUCTION_SCENES, ...GRADE_STORY_SCENES, ...CUTSCENE_EVENTS_POOL];

export interface DayLogRecord {
  date: GameDate;
  morningLog?: string;
  afternoonLog?: string;
  nightLog?: string;
}

export interface GameClockState {
  player: Player | null;
  school: HighSchoolData | null;
  clock: GameClock;
  dailyPlan: DailyPlan;
  seasonMatches: ScheduledMatch[];
  academicEvents: AcademicEvent[];
  todayLogs: string[];
  historyLogs: DayLogRecord[];
  isCareerEnded: boolean;
  isLoading: boolean;

  // 신규: 결과 즉시 표시 팝업 & 이벤트 컷신
  lastActionResult: ActivityResult | null;
  clearLastActionResult: () => void;
  dismissRivalReport: () => Promise<void>;
  readNews: (ids: string[]) => Promise<void>;
  dismissGradeReport: () => Promise<void>;
  declareMonthlyGoal: (kind: MonthlyGoalKind) => Promise<void>;
  activeCutscene: EventCutscene | null;
  resolveCutscene: (choice: string) => Promise<void>;
  saveAppearance: (appearance: NonNullable<Player['appearance']>) => Promise<void>;
  revealTournament: (id: string) => Promise<void>;
  cutsceneHistory: CutsceneTriggerHistory;

  coachMeeting: (choice: 'chance' | 'position' | 'accept', position?: Player['position']) => Promise<void>;
  // Actions
  initClock: (player: Player) => Promise<void>;
  advanceSlot: (result: ActivityResult) => Promise<void>;
  selectActivity: (slot: TimeSlot, category: DailyActivityCategory, subActivityId: string) => Promise<void>;
  executeForcedSlot: (slot: TimeSlot, decision?: MatchDecisionId) => Promise<void>;
  chooseCareerRoute: (route: CareerRoute) => Promise<void>;
  regenerateDailyPlan: () => void;
  purchaseEquipment: (itemId: string) => Promise<boolean>;
  equipItem: (itemId: string, slot: EquipmentSlot) => Promise<void>;
  visitOutdoorLocation: (location: OutdoorLocation) => Promise<boolean>;
  setOnCareerEnd?: (cb: () => void) => void;
}

export const useGameClockStore = create<GameClockState>((set, get) => ({
  player: null,
  school: null,
  clock: {
    date: { ...START_GAME_DATE },
    currentSlot: 'morning',
  },
  dailyPlan: {
    date: { ...START_GAME_DATE },
    slots: {
      morning: { slot: 'morning', forced: false, category: 'study', label: '정규 수업' },
      afternoon: { slot: 'afternoon', forced: false, category: 'training', label: '팀 훈련' },
      night: { slot: 'night', forced: false, category: 'rest', label: '야간 휴식' },
    },
  },
  seasonMatches: [],
  academicEvents: [...ACADEMIC_CALENDAR_TEMPLATE],
  todayLogs: [],
  historyLogs: [],
  isCareerEnded: false,
  isLoading: false,

  lastActionResult: null,
  clearLastActionResult: () => set({ lastActionResult: null }),
  readNews: async ids => {
    const { player, clock, isLoading } = get();
    if (!player || isLoading) return;
    const valid = new Set(collectPlayerNews(player, clock.date).map(n => n.id));
    const read = new Set(player.readNewsIds ?? []);
    const incoming = ids.filter(id => valid.has(id) && !read.has(id));
    if (!incoming.length) return;
    set({ isLoading: true });
    try {
      const updated = { ...player, readNewsIds: [...read, ...incoming] };
      await db.players.put(updated);
      set({ player: updated });
    } finally { set({ isLoading: false }); }
  },
  dismissRivalReport: async () => {
    const {player,isLoading}=get(); if(!player || isLoading || !player.pendingRivalReport)return;
    set({isLoading:true});
    try { const updated={...player,pendingRivalReport:undefined}; await db.players.put(updated);set({player:updated}); }
    finally {set({isLoading:false});}
  },
  declareMonthlyGoal: async kind => {
    const { player, clock, isLoading, isCareerEnded, activeCutscene } = get();
    if (!player || isLoading || isCareerEnded || activeCutscene || player.pendingGradeReportId || isGoalForMonth(player.monthlyGoal, clock.date)) return;
    const goal = getMonthlyGoalOptions(player, clock.date).find(g => g.kind === kind);
    if (!goal || player.monthlyGoalReports?.some(r => r.id === goal.id)) return;
    set({ isLoading: true });
    try { const updated = { ...player, monthlyGoal: goal }; await db.players.put(updated); set({ player: updated }); }
    finally { set({ isLoading: false }); }
  },
  dismissGradeReport: async () => {
    const { player, isLoading } = get();
    if (!player || isLoading || !player.pendingGradeReportId) return;
    set({ isLoading: true });
    try {
      const updated = { ...player, pendingGradeReportId: undefined };
      await db.players.put(updated);
      set({ player: updated });
    } finally { set({ isLoading: false }); }
  },
  activeCutscene: null,
  cutsceneHistory: {},

  initClock: async (player: Player) => {
    if (get().isLoading) throw new Error('다른 저장이 진행 중입니다. 저장 완료 후 다시 불러오세요.');
    player = updateCareerProgress(normalizePlayer(player), !!player.careerEndedAt || !!player.gradeReports?.some(r => r.grade === 3));
    set({ isLoading: true });
    try {

    const school = getHighSchoolDataByName(player.highSchool) || HIGH_SCHOOLS_DATA[0];

    // 기존 데이터와의 하위 호환성 보장
    const initialDate: GameDate = player.gameDate || {
      year: 2026,
      month: player.month || 3,
      day: player.day || 2,
      weekday: 1, // 3월 2일 월요일
      grade: (player.grade as 1 | 2 | 3) || 1,
    };
    if(!player.rivalProgress) player.rivalProgress=initializeRival(player,initialDate);
    const initialSlot: TimeSlot = player.currentSlot || 'morning';

    // 시즌 대회 대진표 생성
    const seasonMatches = player.savedSeasonYear === initialDate.year && player.savedMatches ? addClubMatches(addMissingNationals(migrateWeekendMatches(player.savedMatches, initialDate.year, school, HIGH_SCHOOLS_DATA, initialDate), initialDate.year, school, HIGH_SCHOOLS_DATA, initialDate), initialDate.year, school, HIGH_SCHOOLS_DATA, initialDate) : generateSeasonMatches(initialDate.year, school, HIGH_SCHOOLS_DATA);
    player=prepareTeamContext(player,school,initialDate,initialSlot,seasonMatches);
    captureAchievements(player);
    if (!player.gradeStartSnapshot) player.gradeStartSnapshot = createGradeSnapshot(player, initialDate);
    player.savedMatches=seasonMatches;
    player.savedSeasonYear=initialDate.year;
    if (!player.pendingEventId && !player.careerEndedAt && !player.pendingGradeReportId) {
      const scene = nextJourneyScene(player, initialDate);
      if (scene?.id.startsWith('meet_')) player.pendingEventId = scene.id;
    }
    captureAchievements(player); await db.players.put(player);
    const academicEvents = [...ACADEMIC_CALENDAR_TEMPLATE];

    // 첫 날 일일 계획 수립
    const dailyPlan = buildDailyPlan(initialDate, {
      matches: seasonMatches,
      academicEvents,
    });

    const initialLog = `🏫 [${initialDate.grade}학년 ${initialDate.month}월 ${initialDate.day}일] ${school.name} 야구부 공식 일정이 시작되었습니다.`;

    set({
      player,
      school,
      clock: {
        date: initialDate,
        currentSlot: initialSlot,
      },
      dailyPlan,
      seasonMatches,
      academicEvents,
      todayLogs: [initialLog],
      historyLogs: [],
      isCareerEnded: !!player.careerEndedAt || !!player.gradeReports?.some(r => r.grade === 3),
      isLoading: false,
      lastActionResult: null,
      activeCutscene: ALL_CUTSCENES.find(e=>e.id===player.pendingEventId) ?? null,
      cutsceneHistory: player.eventHistory ?? {},
    });
    } finally { set({ isLoading: false }); }
  },

  advanceSlot: async (result: ActivityResult) => {
    const state = get();
    const { player, clock, school, seasonMatches: originalMatches, academicEvents, todayLogs, cutsceneHistory } = state;
    if (!player || state.isLoading || state.activeCutscene || state.isCareerEnded || player.pendingGradeReportId) return;
    if (!player.interviewCompleted && player.careerJourney?.onboarding) return;
    if(result.matchOutcome && player.matchRecords?.some(r=>r.matchId===result.matchOutcome!.matchId&&r.year===clock.date.year))return;
    const seasonMatches=result.matchOutcome&&school?progressTournament(originalMatches,result.matchOutcome,school,HIGH_SCHOOLS_DATA):originalMatches;
    const actionDate=`${clock.date.year}-${clock.date.month}-${clock.date.day}`;
    const actionLogs=player.dailyActionLogs?.date===actionDate?player.dailyActionLogs.logs:{};
    set({isLoading:true});
    try {
    const finalizeTeam = (p:Player, date:GameDate, slot:TimeSlot, matches:ScheduledMatch[]) => {
      let updated=updateCompetitionAfterAction(player,p,result,clock.date);
      updated=progressMonthlyGoal(updated,result,clock.date);
      if (date.month !== clock.date.month || date.year !== clock.date.year) updated=settleMonthlyGoal(updated,clock.date);
      updated=refreshTeamEvaluation(updated);
      if(result.matchOutcome && updated.teamCompetition?.lastFeedback){
        const f=updated.teamCompetition.lastFeedback;
        result={...result,logMessage:result.logMessage+`\n감독 평가 ${updated.teamCompetition.coachEvaluation.toFixed(1)} (${f.coachDelta>=0?'+':''}${f.coachDelta}) · 코치 평가 ${updated.teamCompetition.technicalEvaluation.toFixed(1)}\n팀 내 위치: ${TEAM_ROLE_LABELS[f.before]} → ${TEAM_ROLE_LABELS[f.after]}\n${f.summary}\n${f.recommendation}`};
        updated.matchRecords=[...(player.matchRecords??[]),{matchId:result.matchOutcome!.matchId,year:clock.date.year,log:result.logMessage,performance:result.matchPerformance,kind:originalMatches.find(m=>m.id===result.matchOutcome!.matchId)?.kind??(result.matchOutcome!.tournamentId==='weekend_league'?'weekend':'national')}];
      }
      updated.dailyActionLogs={date:actionDate,logs:{...actionLogs,[clock.currentSlot]:result.logMessage}};
      const gradeEnded = date.grade !== clock.date.grade || (clock.date.grade === 3 && clock.date.month === 2 && date.month === 3);
      if (gradeEnded) {
        updated.overall = overallRating(updated);
        captureAchievements(updated);
        updated = finishGradeReport(updated, clock.date);
      }
      if(school)updated=prepareTeamContext(updated,school,date,slot,matches);
      if (gradeEnded && date.grade !== clock.date.grade) updated.gradeStartSnapshot = createGradeSnapshot(updated, date);
      return updated;
    };
    // 1. 스탯 변동 반영
    let newStuff = player.stuff;
    let newControl = player.control;
    let newStaminaRating = player.stamina;
    let newContact = player.contact;
    let newPower = player.power;
    let newEye = player.eye;
    let newSpeed = player.speed;
    let newDefense = player.defense;
    let newCondition = player.condition;
    let newAcademics = player.academics;
    let newFame = player.fame ?? 10;
    const newMoney = Math.max(0, (player.money || 0) + (result.moneyDelta || 0));

    const sc = result.statChanges;
    let extra = applyBondChanges(normalizePlayer(player), result.relationshipTargets);
    const expectedBonds = formatBondChanges(result.relationshipTargets);
    result = {...result, relationshipTargets: actualBondChanges(player,extra)};
    const actualBonds = formatBondChanges(result.relationshipTargets);
    if(expectedBonds && result.logMessage.includes(expectedBonds)) result.logMessage=result.logMessage.replace(expectedBonds,actualBonds || '인연 변화 없음 (상한 도달)');
    else if(actualBonds) result.logMessage += ` · ${actualBonds}`;
    result.logMessage = personalizeText(result.logMessage, player);
    for(const key of Object.keys(EXTRA_RATINGS) as (keyof typeof EXTRA_RATINGS)[]) extra[key]=Math.max(0,Math.min(100,extra[key]!+(sc[key]??0)));
    extra.velocity=Math.round(Math.max(80,Math.min(170,extra.velocity!+(sc.velocity??0)))*10)/10;
    if(result.pitchTraining) extra.pitches=trainPitch(extra,result.pitchTraining,result.pitchXp??0);
    extra.savedMatches=seasonMatches;
    extra.savedSeasonYear=clock.date.year;
    if (sc.stuff) newStuff = Math.max(0, Math.min(100, newStuff + sc.stuff));
    if (sc.control) newControl = Math.max(0, Math.min(100, newControl + sc.control));
    if (sc.stamina) newStaminaRating = Math.max(0, Math.min(100, newStaminaRating + sc.stamina));
    if (sc.contact) newContact = Math.max(0, Math.min(100, newContact + sc.contact));
    if (sc.power) newPower = Math.max(0, Math.min(100, newPower + sc.power));
    if (sc.eye) newEye = Math.max(0, Math.min(100, newEye + sc.eye));
    if (sc.speed) newSpeed = Math.max(0, Math.min(100, newSpeed + sc.speed));
    if (sc.defense) newDefense = Math.max(0, Math.min(100, newDefense + sc.defense));
    if (sc.academics) newAcademics = Math.max(0, Math.min(100, newAcademics + sc.academics));
    if (sc.fame) newFame = Math.max(0, Math.min(100, newFame + sc.fame));

    // 체력 및 컨디션(멘탈) 복합 반영
    const netStaminaDelta = result.staminaDelta ?? 0;
    const netMentalDelta = result.mentalDelta || 0;
    newCondition = Math.max(5, Math.min(100, newCondition + (sc.condition ?? 0) + netStaminaDelta + netMentalDelta));

    // OVR 재계산
    let newOverall = player.overall;
    if (player.position === 'P') {
      newOverall = Math.round((newStuff + newControl + newStaminaRating) / 3);
    } else if (player.position === 'TwoWay') {
      const pAvg = (newStuff + newControl + newStaminaRating) / 3;
      const bAvg = (newContact + newPower + newEye + newSpeed + newDefense) / 5;
      newOverall = Math.round((pAvg + bAvg) / 2);
    } else {
      newOverall = Math.round((newContact + newPower + newEye + newSpeed + newDefense) / 5);
    }


    // 2. 슬롯 전진 또는 일자 롤오버 판정
    const currentSlot = clock.currentSlot;
    let nextSlot: TimeSlot = 'morning';
    let nextDate = clock.date;
    let isCareerEnded: boolean = state.isCareerEnded;
    let historyLogs = state.historyLogs;

    if (currentSlot === 'morning') {
      nextSlot = 'afternoon';
    } else if (currentSlot === 'afternoon') {
      nextSlot = 'night';
    } else {
      // night 슬롯 완료 -> 하루 종료 & 다음 날 롤오버
      const advanceRes = advanceGameDate(clock.date);
      nextDate = advanceRes.nextDate;
      nextSlot = 'morning';

      if (advanceRes.isCareerEnded) {
        isCareerEnded = true;
      }

      let updatedMatches = school ? advanceOtherTournamentMatches(seasonMatches,clock.date,school) : seasonMatches;
      if (advanceRes.nextDate.year !== clock.date.year && school) {
        extra = preserveGradeTournaments(extra, updatedMatches);
        captureAchievements(extra);
        updatedMatches = generateSeasonMatches(advanceRes.nextDate.year, school, HIGH_SCHOOLS_DATA);
      }

      historyLogs = [
        {
          date: clock.date,
          morningLog: actionLogs.morning,
          afternoonLog: actionLogs.afternoon,
          nightLog: result.logMessage,
        },
        ...historyLogs.slice(0, 30),
      ];

      const newPlan = buildDailyPlan(nextDate, {
        matches: updatedMatches,
        academicEvents,
      });

      let updatedPlayer: Player = {
        ...extra,
        savedMatches:updatedMatches,
        savedSeasonYear:nextDate.year,
        stuff: newStuff,
        control: newControl,
        stamina: newStaminaRating,
        contact: newContact,
        power: newPower,
        eye: newEye,
        speed: newSpeed,
        defense: newDefense,
        condition: newCondition,
        academics: newAcademics,
        fame: newFame,
        money: newMoney,
        overall: newOverall,
        grade: nextDate.grade,
        month: nextDate.month,
        day: nextDate.day,
        gameDate: nextDate,
        currentSlot: nextSlot,
      };

      if (isCareerEnded) updatedPlayer.careerEndedAt = { ...nextDate };
      updatedPlayer=finalizeTeam(updatedPlayer,nextDate,nextSlot,updatedMatches);
      updatedPlayer.overall=overallRating(updatedPlayer);
      if(advanceRes.isMonthChanged && !isCareerEnded) updatedPlayer=updateMonthlyRival(updatedPlayer,nextDate);

      // 3. 확률적 컷신 이벤트 체크
      updatedPlayer = recordCareerAction(player, updatedPlayer, result);
      let triggeredCutscene: EventCutscene | null = isCareerEnded ? null : nextJourneyScene(updatedPlayer, nextDate);
      const nextHistory = { ...cutsceneHistory };
      for (const evt of CUTSCENE_EVENTS_POOL.map(evt=>({evt,rank:Math.random()})).sort((a,b)=>a.rank-b.rank).map(x=>x.evt)) {
        if (triggeredCutscene) break;
        if (!result.activityCategory || !['training','relationship','study','special'].includes(result.activityCategory)) continue;
        if (evt.categories && !evt.categories.includes(result.activityCategory)) continue;
        if (isCareerEnded) continue;
        if (shouldTriggerCutscene(evt, updatedPlayer, nextDate, nextHistory)) {
          triggeredCutscene = evt;
          nextHistory[evt.id] = {
            year: nextDate.year,
            month: nextDate.month,
            day: nextDate.day,
          };

          break;
        }
      }

      updatedPlayer.overall=overallRating(updatedPlayer);
      updatedPlayer.eventHistory=nextHistory;
      updatedPlayer.pendingEventId=triggeredCutscene?.id;
      captureAchievements(updatedPlayer); await db.players.put(updatedPlayer);

      set({
        player: updatedPlayer,
        clock: { date: nextDate, currentSlot: nextSlot },
        dailyPlan: newPlan,
        seasonMatches: updatedMatches,
        todayLogs: [`🌅 [${nextDate.grade}학년 ${nextDate.month}월 ${nextDate.day}일] 새로운 하루가 밝았습니다.`],
        historyLogs,
        isCareerEnded,
        lastActionResult: result,
        activeCutscene: triggeredCutscene,
        cutsceneHistory: nextHistory,
      });
      return;
    }

    // 중간 슬롯 진행 (morning -> afternoon 또는 afternoon -> night)
    let updatedPlayer: Player = {
      ...extra,
      stuff: newStuff,
      control: newControl,
      stamina: newStaminaRating,
      contact: newContact,
      power: newPower,
      eye: newEye,
      speed: newSpeed,
      defense: newDefense,
      condition: newCondition,
      academics: newAcademics,
      fame: newFame,
      money: newMoney,
      overall: newOverall,
      gameDate: clock.date,
      currentSlot: nextSlot,
    };

    updatedPlayer=finalizeTeam(updatedPlayer,clock.date,nextSlot,seasonMatches);
    // 중간 슬롯에서도 확률적 컷신 체크
    updatedPlayer = recordCareerAction(player, updatedPlayer, result);
    let triggeredCutscene: EventCutscene | null = nextJourneyScene(updatedPlayer, clock.date);
    const nextHistory = { ...cutsceneHistory };
    for (const evt of CUTSCENE_EVENTS_POOL.map(evt=>({evt,rank:Math.random()})).sort((a,b)=>a.rank-b.rank).map(x=>x.evt)) {
      if (triggeredCutscene) break;
        if (!result.activityCategory || !['training','relationship','study','special'].includes(result.activityCategory)) continue;
        if (evt.categories && !evt.categories.includes(result.activityCategory)) continue;
      if (shouldTriggerCutscene(evt, updatedPlayer, clock.date, nextHistory)) {
        triggeredCutscene = evt;
        nextHistory[evt.id] = {
          year: clock.date.year,
          month: clock.date.month,
          day: clock.date.day,
        };

        break;
      }
    }

    updatedPlayer.overall=overallRating(updatedPlayer);
    updatedPlayer.eventHistory=nextHistory;
    updatedPlayer.pendingEventId=triggeredCutscene?.id;
    captureAchievements(updatedPlayer); await db.players.put(updatedPlayer);

    set({
      player: updatedPlayer,
      clock: { date: clock.date, currentSlot: nextSlot },
      todayLogs: [...todayLogs, result.logMessage],
      seasonMatches,
      lastActionResult: result,
      activeCutscene: triggeredCutscene,
      cutsceneHistory: nextHistory,
    });
    } finally { set({isLoading:false}); }
  },

  coachMeeting: async (choice, position) => {
    const {player,clock,dailyPlan,isLoading,activeCutscene,isCareerEnded}=get();
    if (player?.careerJourney && !player.careerJourney.met.includes('coach')) return;
    if(!player||isLoading||activeCutscene||isCareerEnded||clock.currentSlot!=='afternoon'||dailyPlan.slots.afternoon.forced)return;
    if(dateNumber(clock.date)-(player.teamCompetition?.lastInterviewDay??-Infinity)<7)return;
    if(!['chance','position','accept'].includes(choice))return;
    if(choice==='position'&&(!position||position===player.position||!['P','C','1B','2B','3B','SS','LF','CF','RF','TwoWay'].includes(position)))return;
    await get().advanceSlot({activityCategory:'relationship',competitionInterview:{choice,position},statChanges:{},staminaDelta:0,mentalDelta:choice==='accept'?6:2,relationshipTargets:choice==='accept'?{coach:3,peer:1}:{coach:1},logMessage:choice==='chance'?'감독 면담: “기회를 주세요.” 다음 엔트리 포함 경기 2회에서 교체 기회를 우선 검토하고, 평가전에서는 선발 기회를 줍니다. 컨디션과 엔트리 기준은 충족해야 합니다.':choice==='position'?'감독 면담: 포지션 변경을 승인받았습니다. 새 포지션에서 다시 경쟁합니다. 이미 발표된 대회 엔트리는 유지됩니다.':'감독 면담: 현재 역할을 수용하고 준비를 이어가기로 했습니다. 신뢰와 멘탈을 회복했습니다.'});
  },
  selectActivity: async (_slot: TimeSlot, category: DailyActivityCategory, subActivityId: string) => {
    const { player } = get();
    if (!player || get().isLoading || get().activeCutscene || _slot!==get().clock.currentSlot || get().dailyPlan.slots[_slot].forced) return;

    const pool = SUB_ACTIVITY_POOL[category] || [];
    const option = pool.find(o => o.id === subActivityId);
    if (!option || !isActivityAvailable(option, player.position, _slot, player.grade ?? 1, get().clock.date) || !canDoSocialActivity(player, option)) return;

    // 체력 및 멘탈 게이팅 평가 (체력 20 이하 효율 반감 및 부상 롤)
    const result = evaluateActivityWithGating(
      option,
      player.condition,
      player.condition
    );

    if (option.category === 'training') {
      const multiplier = getTrainingEfficiencyMultiplier(player);
      for (const [key, value] of Object.entries(result.statChanges)) {
        if (typeof value === 'number' && value > 0) (result.statChanges as Record<string, number>)[key] = Math.round(Math.round(value * multiplier) * (schoolTrainingCulture(player).keys.includes(key) ? 1.05 : 1) * 100) / 100;
      }
      if (multiplier > 1) result.logMessage += ` · 인연 훈련 보정 x${multiplier.toFixed(2)}`;
    }

    if(result.pitchTraining) result.logMessage+=` · 구종 경험치 +${result.pitchXp} XP`;
    await get().advanceSlot(result);
  },

  executeForcedSlot: async (slot: TimeSlot, decision?: MatchDecisionId) => {
    const { player, school, clock, dailyPlan, seasonMatches, academicEvents } = get();
    if (!player || !school || get().isLoading || get().activeCutscene || slot!==clock.currentSlot) return;

    const assignment = dailyPlan.slots[slot];
    if (!assignment || !assignment.forced) return;

    let result: ActivityResult;

    if (assignment.category === 'match') {
      const match = getPlayerMatchForDate(clock.date, seasonMatches);
      if (match) {
        result = resolveMatchPlaceholder(match, player, school, decision);

      } else {
        result = {
          statChanges: { fame: 2, condition: -15 },
          staminaDelta: -20,
          logMessage: `🏆 [${assignment.label}] 대회 일정을 완료하였습니다.`,
        };
      }
    } else {
      const event = getActiveAcademicEvent(clock.date, academicEvents);
      if (event) {
        result = resolveAcademicEvent(event, player);
      } else {
        result = {
          statChanges: { condition: 5 },
          staminaDelta: -5,
          logMessage: `📌 [${assignment.label}] 학사 행사에 성실히 참가하였습니다.`,
        };
      }
    }

    if(result.pitchTraining) result.logMessage+=` · 구종 경험치 +${result.pitchXp} XP`;
    await get().advanceSlot(result);
  },

  resolveCutscene: async (choice) => {
    const {player,activeCutscene,isLoading}=get(); if(!player||!activeCutscene||isLoading)return;
    set({isLoading:true});
    try {
      const selected = activeCutscene.choices?.find(option => option.id === choice);
      if (activeCutscene.choices?.length && !selected) throw new Error('유효하지 않은 이벤트 선택');
      if (!activeCutscene.choices?.length && choice !== 'learn') throw new Error('대화를 끝까지 진행해 주세요');
      const effect = (selected?.effect ?? activeCutscene.effect)(player);
      let updated=applyBondChanges({...player,...effect.statChanges,pendingEventId:undefined},effect.relationshipTargets);
      const journey = migrateCareerJourney(updated);
      if (ALL_CUTSCENES.some(e => e.id === activeCutscene.id && (e.id.startsWith('meet_') || e.id.startsWith('year')))) updated.careerJourney = { ...journey, completedScenes: [...new Set([...journey.completedScenes, activeCutscene.id])] };
      updated = updateCareerProgress(updated);
      const relationshipTargets = actualBondChanges(player,updated);
      if(Object.keys(relationshipTargets).length) effect.logMessage += ` · ${formatBondChanges(relationshipTargets)}`;
      effect.logMessage = personalizeText(effect.logMessage, updated);
      for(const key of ['stuff','control','stamina','contact','power','eye','speed','defense','condition','fame','academics',...Object.keys(EXTRA_RATINGS)]){
        const record=updated as unknown as Record<string,unknown>; if(typeof record[key]==='number')record[key]=Math.max(0,Math.min(100,record[key] as number));
      }
      updated=refreshTeamEvaluation(updated);
      updated.overall=overallRating(updated);
      const following = activeCutscene.id === 'meet_orientation_school' ? nextJourneyScene(updated, get().clock.date) : null;
      if (following) updated.pendingEventId = following.id;
      captureAchievements(updated); await db.players.put(updated);
      const changes = Object.fromEntries(Object.keys(effect.statChanges).filter(key=>typeof player[key as keyof Player]==='number' && typeof updated[key as keyof Player]==='number').map(key=>[key,Number(updated[key as keyof Player])-Number(player[key as keyof Player])]));
      set({player:updated,activeCutscene:following,lastActionResult:following ? null : {statChanges:changes,relationshipTargets,staminaDelta:0,logMessage:effect.logMessage},todayLogs:[...get().todayLogs,effect.logMessage]});
    }finally{set({isLoading:false});}
  },
  chooseCareerRoute: async (route) => {
    const { player, isLoading, isCareerEnded, activeCutscene } = get();
    if (!player || isLoading || isCareerEnded || activeCutscene || player.pendingGradeReportId) return;
    const updated = updateCareerProgress(player);
    if (!updated.careerJourney?.offers.includes(route)) return;
    set({ isLoading: true });
    try {
      updated.careerJourney = { ...updated.careerJourney, chosenRoute: route };
      await db.players.put(updated);
      set({ player: updated });
    } finally { set({ isLoading: false }); }
  },
  saveAppearance: async (appearance) => {
    const {player}=get(); if(!player || get().isLoading)return;
    set({isLoading:true});
    try {
    const updated={...player,appearance}; captureAchievements(updated); await db.players.put(updated);set({player:updated});
    } finally {set({isLoading:false});}
  },
  revealTournament: async (id) => {
    const {player,seasonMatches,clock}=get(); if(!player || get().isLoading || get().isCareerEnded)return;
    set({isLoading:true});
    try {
    const matches=seasonMatches.map(m=>m.tournamentId===id?{...m,drawn:true}:m);
    const updated={...player,savedMatches:matches,savedSeasonYear:clock.date.year};
    captureAchievements(updated); await db.players.put(updated);set({player:updated,seasonMatches:matches});get().regenerateDailyPlan();
    } finally {set({isLoading:false});}
  },
  regenerateDailyPlan: () => {
    const { clock, seasonMatches, academicEvents } = get();
    const dailyPlan = buildDailyPlan(clock.date, {
      matches: seasonMatches,
      academicEvents,
    });
    set({ dailyPlan });
  },
  purchaseEquipment: async (itemId) => {
    const { player } = get();
    const item = EQUIPMENT_CATALOG.find(e => e.id === itemId);
    if (get().isLoading || get().isCareerEnded || !player || !item || (player.money || 0) < item.price || player.inventory?.includes(itemId)) return false;
    set({isLoading:true});
    try {
    const updated = { ...player, money: (player.money || 0) - item.price, inventory: [...(player.inventory || []), itemId] };
    captureAchievements(updated); await db.players.put(updated); set({ player: updated }); return true;
    } finally {set({isLoading:false});}
  },
  equipItem: async (itemId, slot) => {
    const { player } = get();
    if (!player || get().isLoading || get().isCareerEnded) return;
    const currentEquipped = player.equippedItems?.[slot];
    const nextEquipped = { ...(player.equippedItems || {}) };
    if (!itemId || currentEquipped === itemId) {
      delete nextEquipped[slot];
    } else {
      if (!player.inventory?.includes(itemId)) return;
      const item = EQUIPMENT_CATALOG.find(candidate => candidate.id === itemId);
      if (!item || item.slot !== slot || !isEquipmentRelevant(player, item)) return;
      nextEquipped[slot] = itemId;
    }
    set({isLoading:true});
    try {
    const updated = refreshTeamEvaluation({ ...player, equippedItems: nextEquipped });
    updated.overall = overallRating(updated);
    captureAchievements(updated); await db.players.put(updated);
    set({ player: updated });
    } finally {set({isLoading:false});}
  },
  visitOutdoorLocation: async (location) => {
    const { player, clock } = get();
    if (get().isLoading || get().activeCutscene || get().isCareerEnded || player?.pendingGradeReportId || !player || (player.money || 0) < location.cost) return false;
    if (!canDoSocialActivity(player, location.effects)) return false;
    const game = getBallparkVisit(location.id,clock.date,clock.currentSlot);
    if (game && !game.available) return false;
    if (isSchoolDay(clock.date) && clock.currentSlot !== 'night') return false;
    const todayDateStr = `${clock.date.year}-${clock.date.month}-${clock.date.day}`;
    if (player.lastOutdoorVisitDate === todayDateStr) return false;

    set({isLoading:true});
    try {
    let updated: Player = {
      ...applyBondChanges(player,location.effects.relationshipTargets),
      money: (player.money || 0) - location.cost + (location.effects.money || 0),
      condition: Math.max(5, Math.min(100, player.condition + location.effects.condition)),
      lastOutdoorVisitDate: todayDateStr,
    };
    for (const [key, value] of Object.entries(location.effects.statChanges)) {
      const stat = key as keyof Player;
      if (typeof updated[stat] === 'number' && typeof value === 'number') (updated as unknown as Record<string, number>)[key] = Math.max(0, Math.min(100, (updated[stat] as number) + value));
    }
    updated=refreshTeamEvaluation(updated);
    updated.overall = overallRating(updated);
    captureAchievements(updated); await db.players.put(updated);
    set({ player: updated });
    return true;
    } finally {set({isLoading:false});}
  },
}));


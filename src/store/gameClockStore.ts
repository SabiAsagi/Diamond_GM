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
import { generateSeasonMatches, getPlayerMatchForDate, progressTournament, advanceOtherTournamentMatches } from '../types/tournament';
import type { ActivityResult } from '../types/activity';
import { SUB_ACTIVITY_POOL, evaluateActivityWithGating } from '../types/activity';
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
  activeCutscene: EventCutscene | null;
  clearActiveCutscene: () => void;
  resolveCutscene: (choice: 'learn' | 'reflect') => Promise<void>;
  saveAppearance: (appearance: NonNullable<Player['appearance']>) => Promise<void>;
  revealTournament: (id: string) => Promise<void>;
  cutsceneHistory: CutsceneTriggerHistory;

  // Actions
  initClock: (player: Player) => Promise<void>;
  advanceSlot: (result: ActivityResult) => Promise<void>;
  selectActivity: (slot: TimeSlot, category: DailyActivityCategory, subActivityId: string) => Promise<void>;
  executeForcedSlot: (slot: TimeSlot) => Promise<void>;
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
  activeCutscene: null,
  clearActiveCutscene: () => { void get().resolveCutscene('reflect'); },
  cutsceneHistory: {},

  initClock: async (player: Player) => {
    player = normalizePlayer(player);
    set({ isLoading: true });

    const school = getHighSchoolDataByName(player.highSchool) || HIGH_SCHOOLS_DATA[0];

    // 기존 데이터와의 하위 호환성 보장
    const initialDate: GameDate = player.gameDate || {
      year: 2026,
      month: player.month || 3,
      day: player.day || 2,
      weekday: 1, // 3월 2일 월요일
      grade: (player.grade as 1 | 2 | 3) || 1,
    };
    const initialSlot: TimeSlot = player.currentSlot || 'morning';

    // 시즌 대회 대진표 생성
    const seasonMatches = player.savedSeasonYear === initialDate.year && player.savedMatches ? player.savedMatches : generateSeasonMatches(initialDate.year, school, HIGH_SCHOOLS_DATA);
    player.savedMatches=seasonMatches;
    player.savedSeasonYear=initialDate.year;
    await db.players.put(player);
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
      isCareerEnded: false,
      isLoading: false,
      lastActionResult: null,
      activeCutscene: CUTSCENE_EVENTS_POOL.find(e=>e.id===player.pendingEventId) ?? null,
      cutsceneHistory: player.eventHistory ?? {},
    });
  },

  advanceSlot: async (result: ActivityResult) => {
    const state = get();
    const { player, clock, school, seasonMatches, academicEvents, todayLogs, cutsceneHistory } = state;
    if (!player || state.isLoading || state.activeCutscene || state.isCareerEnded) return;
    set({isLoading:true});
    try {
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
    let newRelFam = player.relationshipFamily;
    let newRelFri = player.relationshipFriends;
    let newRelTeam = player.relationshipTeam;
    let newRelCoach = player.relationshipCoach;

    const sc = result.statChanges;
    const extra = normalizePlayer(player);
    for(const key of Object.keys(EXTRA_RATINGS) as (keyof typeof EXTRA_RATINGS)[]) extra[key]=Math.max(0,Math.min(100,extra[key]!+(sc[key]??0)));
    extra.velocity=Math.round(Math.max(80,Math.min(170,extra.velocity!+(sc.velocity??0)))*10)/10;
    if(result.pitchTraining) extra.pitches=trainPitch(extra,result.pitchTraining,result.pitchXp??0);
    extra.savedMatches=seasonMatches;
    extra.savedSeasonYear=clock.date.year;
    if(result.matchOutcome) extra.matchRecords=[...(player.matchRecords??[]),{matchId:result.matchOutcome.matchId,year:clock.date.year,log:result.logMessage}];
    if (sc.stuff) newStuff = Math.min(100, newStuff + sc.stuff);
    if (sc.control) newControl = Math.min(100, newControl + sc.control);
    if (sc.stamina) newStaminaRating = Math.min(100, newStaminaRating + sc.stamina);
    if (sc.contact) newContact = Math.min(100, newContact + sc.contact);
    if (sc.power) newPower = Math.min(100, newPower + sc.power);
    if (sc.eye) newEye = Math.min(100, newEye + sc.eye);
    if (sc.speed) newSpeed = Math.min(100, newSpeed + sc.speed);
    if (sc.defense) newDefense = Math.min(100, newDefense + sc.defense);
    if (sc.academics) newAcademics = Math.max(0, Math.min(100, newAcademics + sc.academics));
    if (sc.fame) newFame = Math.max(0, Math.min(100, newFame + sc.fame));
    if (sc.relationshipFamily) newRelFam = Math.max(0, Math.min(100, newRelFam + sc.relationshipFamily));
    if (sc.relationshipFriends) newRelFri = Math.max(0, Math.min(100, newRelFri + sc.relationshipFriends));
    if (sc.relationshipTeam) newRelTeam = Math.max(0, Math.min(100, newRelTeam + sc.relationshipTeam));
    if (sc.relationshipCoach) newRelCoach = Math.max(0, Math.min(100, newRelCoach + sc.relationshipCoach));

    // 체력 및 컨디션(멘탈) 복합 반영
    const netStaminaDelta = result.staminaDelta;
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

    const newLogs = [...todayLogs, result.logMessage];

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
        updatedMatches = generateSeasonMatches(advanceRes.nextDate.year, school, HIGH_SCHOOLS_DATA);
      }

      historyLogs = [
        {
          date: clock.date,
          morningLog: todayLogs[0],
          afternoonLog: todayLogs[1],
          nightLog: todayLogs[2],
        },
        ...historyLogs.slice(0, 30),
      ];

      const newPlan = buildDailyPlan(nextDate, {
        matches: updatedMatches,
        academicEvents,
      });

      const updatedPlayer: Player = {
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
        relationshipFamily: newRelFam,
        relationshipFriends: newRelFri,
        relationshipTeam: newRelTeam,
        relationshipCoach: newRelCoach,
        overall: newOverall,
        grade: nextDate.grade,
        month: nextDate.month,
        day: nextDate.day,
        gameDate: nextDate,
        currentSlot: nextSlot,
      };

      // 3. 확률적 컷신 이벤트 체크
      let triggeredCutscene: EventCutscene | null = null;
      const nextHistory = { ...cutsceneHistory };
      for (const evt of CUTSCENE_EVENTS_POOL.map(evt=>({evt,rank:Math.random()})).sort((a,b)=>a.rank-b.rank).map(x=>x.evt)) {
        if (!result.activityCategory || !['training','relationship','study','special'].includes(result.activityCategory)) continue;
        if (evt.categories && !evt.categories.includes(result.activityCategory)) continue;
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
      await db.players.put(updatedPlayer);

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
    const updatedPlayer: Player = {
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
      relationshipFamily: newRelFam,
      relationshipFriends: newRelFri,
      relationshipTeam: newRelTeam,
      relationshipCoach: newRelCoach,
      overall: newOverall,
      gameDate: clock.date,
      currentSlot: nextSlot,
    };

    // 중간 슬롯에서도 확률적 컷신 체크
    let triggeredCutscene: EventCutscene | null = null;
    const nextHistory = { ...cutsceneHistory };
    for (const evt of CUTSCENE_EVENTS_POOL.map(evt=>({evt,rank:Math.random()})).sort((a,b)=>a.rank-b.rank).map(x=>x.evt)) {
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
    await db.players.put(updatedPlayer);

    set({
      player: updatedPlayer,
      clock: { date: clock.date, currentSlot: nextSlot },
      todayLogs: newLogs,
      lastActionResult: result,
      activeCutscene: triggeredCutscene,
      cutsceneHistory: nextHistory,
    });
    } finally { set({isLoading:false}); }
  },

  selectActivity: async (_slot: TimeSlot, category: DailyActivityCategory, subActivityId: string) => {
    const { player } = get();
    if (!player || get().isLoading || get().activeCutscene || _slot!==get().clock.currentSlot || get().dailyPlan.slots[_slot].forced) return;

    const pool = SUB_ACTIVITY_POOL[category] || [];
    const option = pool.find(o => o.id === subActivityId);
    if(!option || (option.allowedSlots && !option.allowedSlots.includes(_slot)) || (player.position!=='TwoWay' && option.targetPosition && option.targetPosition!=='ALL' && option.targetPosition!==(player.position==='P'?'P':'B'))) return;

    // 체력 및 멘탈 게이팅 평가 (체력 20 이하 효율 반감 및 부상 롤)
    const result = evaluateActivityWithGating(
      option,
      player.condition,
      player.condition
    );

    if (option.category === 'training') {
      const multiplier = getTrainingEfficiencyMultiplier(player);
      for (const [key, value] of Object.entries(result.statChanges)) {
        if (typeof value === 'number' && value > 0) (result.statChanges as Record<string, number>)[key] = Math.round(value * multiplier);
      }
      if (multiplier > 1) result.logMessage += ` · 인연 훈련 보정 x${multiplier.toFixed(2)}`;
    }

    if(result.pitchTraining) result.logMessage+=` · 구종 경험치 +${result.pitchXp} XP`;
    await get().advanceSlot(result);
  },

  executeForcedSlot: async (slot: TimeSlot) => {
    const { player, school, clock, dailyPlan, seasonMatches, academicEvents } = get();
    if (!player || !school || get().isLoading || get().activeCutscene || slot!==clock.currentSlot) return;

    const assignment = dailyPlan.slots[slot];
    if (!assignment || !assignment.forced) return;

    let result: ActivityResult;

    if (assignment.category === 'match') {
      const match = getPlayerMatchForDate(clock.date, seasonMatches);
      if (match) {
        result = resolveMatchPlaceholder(match, player, school);
        if (result.matchOutcome) set({ seasonMatches: progressTournament(seasonMatches, result.matchOutcome, school, HIGH_SCHOOLS_DATA) });
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
      const effect=choice==='learn'?activeCutscene.effect(player):{statChanges:{condition:Math.min(100,player.condition+8)},logMessage:'서두르지 않고 마음을 정리했습니다. 컨디션 +8'};
      const updated={...player,...effect.statChanges,pendingEventId:undefined};
      for(const key of ['stuff','control','stamina','contact','power','eye','speed','defense','condition','fame','academics','relationshipCoach','relationshipTeam','relationshipFriends','relationshipFamily',...Object.keys(EXTRA_RATINGS)]){
        const record=updated as unknown as Record<string,unknown>; if(typeof record[key]==='number')record[key]=Math.max(0,Math.min(100,record[key] as number));
      }
      updated.overall=overallRating(updated);
      await db.players.put(updated);
      set({player:updated,activeCutscene:null,lastActionResult:{statChanges:{},staminaDelta:0,logMessage:effect.logMessage},todayLogs:[...get().todayLogs,effect.logMessage]});
    }finally{set({isLoading:false});}
  },
  saveAppearance: async (appearance) => {
    const {player}=get(); if(!player)return;
    const updated={...player,appearance}; await db.players.put(updated);set({player:updated});
  },
  revealTournament: async (id) => {
    const {player,seasonMatches,clock}=get(); if(!player)return;
    const matches=seasonMatches.map(m=>m.tournamentId===id?{...m,drawn:true}:m);
    const updated={...player,savedMatches:matches,savedSeasonYear:clock.date.year};
    await db.players.put(updated);set({player:updated,seasonMatches:matches});get().regenerateDailyPlan();
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
    if (!player || !item || (player.money || 0) < item.price || player.inventory?.includes(itemId)) return false;
    const updated = { ...player, money: (player.money || 0) - item.price, inventory: [...(player.inventory || []), itemId] };
    await db.players.put(updated); set({ player: updated }); return true;
  },
  equipItem: async (itemId, slot) => {
    const { player } = get();
    if (!player) return;
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
    const updated = { ...player, equippedItems: nextEquipped };
    updated.overall = overallRating(updated);
    await db.players.put(updated);
    set({ player: updated });
  },
  visitOutdoorLocation: async (location) => {
    const { player, clock } = get();
    if (!player || (player.money || 0) < location.cost) return false;
    if (isSchoolDay(clock.date) && clock.currentSlot !== 'night') return false;
    const todayDateStr = `${clock.date.year}-${clock.date.month}-${clock.date.day}`;
    if (player.lastOutdoorVisitDate === todayDateStr) return false;

    const updated: Player = {
      ...player,
      money: (player.money || 0) - location.cost + (location.effects.money || 0),
      condition: Math.max(5, Math.min(100, player.condition + location.effects.condition)),
      lastOutdoorVisitDate: todayDateStr,
    };
    for (const [key, value] of Object.entries(location.effects.statChanges)) {
      const stat = key as keyof Player;
      if (typeof updated[stat] === 'number' && typeof value === 'number') (updated as unknown as Record<string, number>)[key] = Math.max(0, Math.min(100, (updated[stat] as number) + value));
    }
    updated.overall = overallRating(updated);
    await db.players.put(updated);
    set({ player: updated });
    return true;
  },
}));

import type { GameDate, TimeSlot } from './calendar';
import type { AcademicEvent } from './academicCalendar';
import { getActiveAcademicEvent, isSchoolDay } from './academicCalendar';
import type { ScheduledMatch } from './tournament';
import { getPlayerMatchForDate } from './tournament';

export type DailyActivityCategory =
  | 'study'
  | 'training'
  | 'rest'
  | 'relationship'
  | 'special'
  | 'exam'
  | 'match'
  | 'event';

export interface SlotAssignment {
  slot: TimeSlot;
  forced: boolean;               // 학사/대회 일정으로 강제된 일정인지
  category: DailyActivityCategory;
  label: string;                 // "주말리그 vs 경남고" 또는 "정규 수업" 등 표시용 텍스트
  sourceEventId?: string;        // AcademicEvent.id 또는 ScheduledMatch.id
  description?: string;
}

export interface DailyPlan {
  date: GameDate;
  slots: Record<TimeSlot, SlotAssignment>;
}

export interface DailyPlanContext {
  matches: ScheduledMatch[];
  academicEvents?: AcademicEvent[];
}

/**
 * 매일 아침(날짜 롤오버 시점) 당일 3슬롯의 일정을 우선순위에 따라 조립합니다.
 * 우선순위:
 * 1. 대회 경기 (ScheduledMatch) -> 오후 슬롯 강제 'match'
 * 2. 학사 일정 (AcademicEvent) -> 해당 슬롯 강제 'exam' 또는 'event'
 * 3. 자유 일정 (open) -> 등교 여부(주말/방학)에 따른 기본 슬롯 배정
 */
export function buildDailyPlan(date: GameDate, context: DailyPlanContext): DailyPlan {
  const matchToday = getPlayerMatchForDate(date, context.matches);
  const academicEventToday = getActiveAcademicEvent(date, context.academicEvents);
  const schoolDay = isSchoolDay(date);

  // 기본 슬롯 (자유 일정)
  const slots: Record<TimeSlot, SlotAssignment> = {
    morning: {
      slot: 'morning',
      forced: false,
      category: schoolDay ? 'study' : 'rest',
      label: schoolDay ? '정규 수업 & 학교 생활' : '자율 오전 시간 (방학/휴일)',
      description: schoolDay
        ? '교실에서 수업에 참여하거나 학업 및 친구들과의 대화를 선택합니다.'
        : '등교하지 않는 날입니다. 여유로운 휴식이나 자율 운동을 선택할 수 있습니다.',
    },
    afternoon: {
      slot: 'afternoon',
      forced: false,
      category: 'training',
      label: '방과 후 팀 훈련 & 야구 활동',
      description: '그라운드에서 팀 정규 훈련, 연습 경기, 특화 훈련을 진행합니다.',
    },
    night: {
      slot: 'night',
      forced: false,
      category: 'rest',
      label: '야간 자율 시간',
      description: '하루를 마무리하며 개인 훈련, 숙소 휴식, 취미 활동을 즐깁니다.',
    },
  };

  // 우선순위 2: 학사 일정 덮어쓰기 (시험, 행사 등)
  if (academicEventToday) {
    const isExam = academicEventToday.type === 'midterm_exam' || academicEventToday.type === 'final_exam';
    const category: DailyActivityCategory = isExam ? 'exam' : 'event';

    for (const slot of academicEventToday.affectsSlot) {
      slots[slot] = {
        slot,
        forced: true,
        category,
        label: academicEventToday.label,
        sourceEventId: academicEventToday.id,
        description: academicEventToday.description,
      };
    }
  }

  // 우선순위 1: 대회 공식 경기 최우선 적용 (보통 오후 슬롯 강제 전환)
  if (matchToday) {
    slots.afternoon = {
      slot: 'afternoon',
      forced: true,
      category: 'match',
      label: `${matchToday.tournamentName} ${matchToday.round} · ${matchToday.drawn===false?'추첨 예정':`${matchToday.homeSchoolName} vs ${matchToday.awaySchoolName}`}`,
      sourceEventId: matchToday.id,
      description: matchToday.description || `${matchToday.awaySchoolName}와의 공식 대회 경기입니다.`,
    };
  }

  return {
    date,
    slots,
  };
}

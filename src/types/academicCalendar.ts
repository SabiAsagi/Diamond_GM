import type { GameDate, TimeSlot } from './calendar';

export type AcademicEventType =
  | 'entrance_ceremony'   // 입학식
  | 'midterm_exam'        // 중간고사
  | 'final_exam'          // 기말고사
  | 'summer_break_start'  // 여름방학 시작
  | 'summer_break_end'    // 여름방학 종료
  | 'winter_break_start'  // 겨울방학 시작
  | 'winter_break_end'    // 겨울방학 종료
  | 'sports_day'          // 운동회
  | 'field_trip'          // 수학여행
  | 'graduation_ceremony'; // 졸업식

export interface AcademicEvent {
  id: string;
  type: AcademicEventType;
  month: number;
  day: number;
  durationDays: number;        // 방학이나 시험처럼 여러 날 지속되는 경우 (기본 1)
  affectsSlot: TimeSlot[];     // 이 이벤트가 강제로 덮어쓰는 시간대 (예: 시험기간엔 오전=시험)
  label: string;               // UI 표시용 한글 이름
  description?: string;        // 이벤트 부가 설명
  gradeCondition?: 1 | 2 | 3;  // 특정 학년 전용 (입학식=1학년, 졸업식=3학년)
}

/**
 * 매 학년 반복되는 연간 고정 학사 일정 템플릿
 */
export const ACADEMIC_CALENDAR_TEMPLATE: AcademicEvent[] = [
  {
    id: 'entrance_ceremony',
    type: 'entrance_ceremony',
    month: 3,
    day: 2,
    durationDays: 1,
    affectsSlot: ['morning'],
    label: '신입생 입학식',
    description: '고등학교 야구부의 일원으로서 설레는 첫 발을 내딛습니다.',
    gradeCondition: 1,
  },
  {
    id: 'midterm_exam_1',
    type: 'midterm_exam',
    month: 5,
    day: 7,
    durationDays: 4,
    affectsSlot: ['morning'],
    label: '1학기 중간고사',
    description: '선수 활동을 병행하며 학업 성취도를 유지해야 하는 시험 기간입니다.',
  },
  {
    id: 'final_exam_1',
    type: 'final_exam',
    month: 7,
    day: 8,
    durationDays: 4,
    affectsSlot: ['morning'],
    label: '1학기 기말고사',
    description: '1학기 학업 성적을 마무리짓는 기말고사 기간입니다.',
  },
  {
    id: 'sports_day',
    type: 'sports_day',
    month: 10,
    day: 2,
    durationDays: 1,
    affectsSlot: ['morning', 'afternoon'],
    label: '교내 가을 체육대회',
    description: '전교생이 함께하는 축제! 야구부원들도 숨은 운동 신경을 뽐냅니다.',
  },
  {
    id: 'field_trip',
    type: 'field_trip',
    month: 10,
    day: 14,
    durationDays: 2,
    affectsSlot: ['morning', 'afternoon'],
    label: '추억의 가을 수학여행',
    description: '학급 친구들과 특별한 추억을 쌓으며 재충전의 시간을 갖습니다.',
  },
  {
    id: 'final_exam_2',
    type: 'final_exam',
    month: 12,
    day: 16,
    durationDays: 4,
    affectsSlot: ['morning'],
    label: '2학기 기말고사',
    description: '한 해의 학업을 최종 결산하는 2학기 기말고사입니다.',
  },
  {
    id: 'graduation_ceremony',
    type: 'graduation_ceremony',
    month: 2,
    day: 10,
    durationDays: 1,
    affectsSlot: ['morning'],
    label: '영예로운 졸업식',
    description: '3년간의 땀과 열정이 깃든 고교 생활을 마치고 프로/사회로 도약합니다.',
    gradeCondition: 3,
  },
];

/**
 * 방학 기간인지 판별합니다.
 * 여름방학: 7월 21일 ~ 8월 20일
 * 겨울방학: 12월 24일 ~ 다음해 2월 5일
 */
export function isVacationPeriod(month: number, day: number): boolean {
  // 여름방학
  if (month === 7 && day >= 21) return true;
  if (month === 8 && day <= 20) return true;

  // 겨울방학
  if (month === 12 && day >= 24) return true;
  if (month === 1) return true;
  if (month === 2 && day <= 5) return true;

  return false;
}

/**
 * 정규 등교일인지 판별합니다.
 * 주말(토/일)이거나 방학 기간에는 false를 반환하여 오전 시간도 자유 활동으로 개방합니다.
 */
export function isSchoolDay(date: GameDate): boolean {
  // 주말(0: 일, 6: 토) 제외
  if (date.weekday === 0 || date.weekday === 6) {
    return false;
  }
  // 방학 제외
  if (isVacationPeriod(date.month, date.day)) {
    return false;
  }
  return true;
}

/**
 * 특정 날짜에 진행 중인 학사 일정을 조회합니다.
 */
export function getActiveAcademicEvent(date: GameDate, events: AcademicEvent[] = ACADEMIC_CALENDAR_TEMPLATE): AcademicEvent | null {
  for (const ev of events) {
    // 학년 조건 체크
    if (ev.gradeCondition !== undefined && ev.gradeCondition !== date.grade) {
      continue;
    }

    // 동일 월에서 시작일 ~ 시작일 + durationDays - 1 범위에 있는지 확인
    if (ev.month === date.month) {
      if (date.day >= ev.day && date.day < ev.day + ev.durationDays) {
        return ev;
      }
    }
  }
  return null;
}

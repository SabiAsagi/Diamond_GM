export interface GameDate {
  year: number;      // 게임 내 연도 (실제 서기 연도: 2026년 시작)
  month: number;     // 1 ~ 12
  day: number;       // 1 ~ 31
  weekday: number;   // 0(일) ~ 6(토)
  grade: 1 | 2 | 3;  // 학년 (입학 시점 기준 자동 계산)
}

export type TimeSlot = 'morning' | 'afternoon' | 'night';

export interface GameClock {
  date: GameDate;
  currentSlot: TimeSlot;
}

export const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '오전',
  afternoon: '오후',
  night: '야간',
};

export const START_GAME_DATE: GameDate = {
  year: 2026,
  month: 3,
  day: 2,
  weekday: 1, // 월요일
  grade: 1,
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export interface DateAdvanceResult {
  nextDate: GameDate;
  isMonthChanged: boolean;
  isGradeAdvanced: boolean;
  isCareerEnded: boolean; // 3학년 2월 말 졸업식 완료 시점
}

/**
 * 날짜를 하루 전진시키고 요일, 학년 진급, 졸업 여부를 갱신합니다.
 */
export function advanceGameDate(currentDate: GameDate): DateAdvanceResult {
  let nextYear = currentDate.year;
  let nextMonth = currentDate.month;
  let nextDay = currentDate.day + 1;
  const nextWeekday = (currentDate.weekday + 1) % 7;
  let nextGrade = currentDate.grade;
  let isGradeAdvanced = false;
  let isMonthChanged = false;
  let isCareerEnded = false;

  const daysInCurrentMonth = getDaysInMonth(nextYear, nextMonth);

  if (nextDay > daysInCurrentMonth) {
    nextDay = 1;
    nextMonth += 1;
    isMonthChanged = true;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    // 새 학년 진급 (매년 3월 1일)
    if (nextMonth === 3) {
      if (nextGrade < 3) {
        nextGrade = (nextGrade + 1) as 1 | 2 | 3;
        isGradeAdvanced = true;
      }
    }
  }

  // 3학년 2월 28일/29일 이후 졸업 여부 체크
  if (currentDate.grade === 3 && currentDate.month === 2 && currentDate.day >= getDaysInMonth(currentDate.year, 2)) {
    isCareerEnded = true;
  }

  return {
    nextDate: {
      year: nextYear,
      month: nextMonth,
      day: nextDay,
      weekday: nextWeekday,
      grade: nextGrade,
    },
    isMonthChanged,
    isGradeAdvanced,
    isCareerEnded,
  };
}

/**
 * 3학년 9월 둘째 주 월요일(KBO 신인 드래프트)까지 남은 일수를 계산합니다.
 */
export function calculateDaysUntilDraft(date: GameDate): number {
  // 기준: 고교 3학년 연도의 9월 14일 드래프트
  const draftYear = date.year + (3 - date.grade);
  const targetDate = new Date(draftYear, 8, 14); // 9월은 index 8
  const curr = new Date(date.year, date.month - 1, date.day);
  const diffTime = targetDate.getTime() - curr.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * UI 표시용 날짜 문자열 포맷터
 * 예: 1학년 3월 2일 (월) · 오전
 */
export function formatGameDate(date: GameDate, slot?: TimeSlot): string {
  const weekdayStr = WEEKDAY_NAMES[date.weekday];
  const slotStr = slot ? ` · ${TIME_SLOT_LABELS[slot]}` : '';
  return `${date.grade}학년 ${date.month}월 ${date.day}일 (${weekdayStr})${slotStr}`;
}

import type { GameDate } from '../types/calendar';
export const SEASON_CHAPTERS = [
  { id: 'spring', title: '입학 · 봄 시즌', months: [3, 4], description: '팀 훈련과 청백전에서 준비하고 이마트배·주말리그로 첫 시즌을 시작합니다.' },
  { id: 'early_summer', title: '초여름 · 대표 선발', months: [5, 6], description: '황금사자기와 시·도 대표 선발전을 거치며 출전 역할과 코치 평가를 확인하세요.' },
  { id: 'summer', title: '여름 · 전국 무대', months: [7, 8], description: '청룡기·봉황대기와 방학 훈련이 이어집니다. 성적과 피로에 맞춰 훈련과 휴식을 고르세요.' },
  { id: 'autumn', title: '가을 · 시즌 마무리', months: [9, 10, 11], description: '주말리그를 마무리하고, 시·도 대표 학교는 전국체전에 출전합니다. 탈락해도 훈련과 인연은 이어집니다.' },
  { id: 'winter', title: '겨울 · 다음 학년 준비', months: [12, 1, 2], description: '겨울방학에는 서킷·웨이트·실내 훈련을 고릅니다. 2월 말까지의 선택은 학년 일지로 남습니다.' },
] as const;
/** 시간 경과를 표시한다. 대회 우승/출전이나 실제 수행 완료로 오해하지 않게 분리한다. */
export function getSeasonJourney(date: GameDate) {
  const startYear = date.month < 3 ? date.year - 1 : date.year;
  const start = Date.UTC(startYear, 2, 1);
  const finish = Date.UTC(startYear + 1, 2, 1);
  const today = Date.UTC(date.year, date.month - 1, date.day);
  const totalDays = (finish - start) / 86400000;
  const elapsedDays = Math.max(0, Math.min(totalDays, (today - start) / 86400000));
  const chapterIndex = SEASON_CHAPTERS.findIndex(c => (c.months as readonly number[]).includes(date.month));
  return { startYear, totalDays, elapsedDays, remainingDays: totalDays - elapsedDays, chapterIndex, chapter: SEASON_CHAPTERS[chapterIndex] };
}

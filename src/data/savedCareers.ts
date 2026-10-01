import type { Player } from '../types';
/** 육성 모드에서 만든 선수만 표시하고 구단 모드의 샘플 선수는 제외한다. */
export function getSavedCareers(players: Player[]): Player[] {
  return players.filter(p => p.id !== undefined && p.status === 'HighSchool' && (p.careerGoal || p.cast || p.interviewCompleted || p.gameDate))
    .toSorted((a, b) => (b.id ?? 0) - (a.id ?? 0));
}
export function getCareerRoute(player: Player): string {
  return player.interviewCompleted ? `/development/dashboard/${player.id}` : `/development/interview/${player.id}`;
}

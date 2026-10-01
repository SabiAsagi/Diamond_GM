import type { Player, GameDate } from '../types';
import { SUB_ACTIVITY_POOL, type ActivityResult, type ActivityOption } from '../types/activity';
import { getDaysInMonth } from '../types/calendar';
import { applyBondChanges, actualBondChanges, type RelationshipTargets } from '../types/bondScores';

export type MonthlyGoalKind = 'technique' | 'recovery' | 'teamwork';
export interface MonthlyGoal {
  id: string; year: number; month: number; grade: number; kind: MonthlyGoalKind;
  title: string; description: string; target: number; progress: number; declaredDay: number;
}
export interface MonthlyGoalReport extends MonthlyGoal {
  completed: boolean; reward: RelationshipTargets; feedback: string;
}
const TECHNIQUE_KEYS = ['contact', 'power', 'eye', 'defense', 'stuff', 'control', 'movement', 'velocity', 'arm', 'fieldingRange', 'fieldingError', 'gapPower', 'avoidK'];
const TEAM_BONDS = ['coach', 'coach2', 'peer', 'senior', 'junior', 'pe'];
export function isGoalForMonth(goal: MonthlyGoal | undefined, date: Pick<GameDate, 'year' | 'month'>): boolean {
  return !!goal && goal.year === date.year && goal.month === date.month;
}
export function getMonthlyGoalOptions(player: Player, date: GameDate): MonthlyGoal[] {
  const days = getDaysInMonth(date.year, date.month) - date.day + 1;
  const target = Math.max(1, Math.min(10, Math.ceil(days / 4)));
  const technique = player.position === 'P' ? '구종·구위·제구를 다루는 훈련' : player.position === 'TwoWay' ? '타격·수비 또는 구종·제구 훈련' : '타격·선구안·수비를 다루는 훈련';
  return ([
    { kind: 'technique', title: '기술 훈련을 꾸준히', description: `${technique}을 중심으로 계획하세요. 타격·수비·투구 기술 효과가 있는 훈련·전술 연구를 셉니다.` },
    { kind: 'recovery', title: '휴식도 훈련의 일부', description: '휴식 카테고리 활동을 수행하세요. 컨디션이 가득 차도 휴식 선택은 인정합니다.' },
    { kind: 'teamwork', title: '야구부와 함께 성장', description: '감독·코치·선후배·동기·체육 교사와 인연을 쌓는 관계 활동을 수행하세요.' },
  ] as const).map(o => ({ ...o, id: `${date.year}-${date.month}`, year: date.year, month: date.month, grade: date.grade,
    target, progress: 0, declaredDay: date.day }));
}
/** 미리보기와 진행 판정이 같은 조건을 쓴다. 경기/컷신/상점 보상은 활동 횟수로 세지 않는다. */
export function matchesMonthlyGoal(goal: MonthlyGoal, activity: Pick<ActivityResult, 'activityCategory' | 'statChanges' | 'pitchTraining' | 'relationshipTargets'>): boolean {
  if (goal.kind === 'recovery') return activity.activityCategory === 'rest';
  if (goal.kind === 'teamwork') return activity.activityCategory === 'relationship' && TEAM_BONDS.some(id => Number((activity.relationshipTargets as Record<string, number> | undefined)?.[id]) > 0);
  return ['training', 'special'].includes(activity.activityCategory ?? '') && (!!activity.pitchTraining || TECHNIQUE_KEYS.some(k => Number((activity.statChanges as Record<string, number>)[k]) > 0));
}
export function optionMatchesMonthlyGoal(goal: MonthlyGoal, option: ActivityOption): boolean {
  return matchesMonthlyGoal(goal, { ...option, activityCategory: option.category });
}
function sourceForGoal(result: ActivityResult): ActivityResult {
  const option = result.activityId && Object.values(SUB_ACTIVITY_POOL).flat().find(o => o.id === result.activityId && o.category === result.activityCategory);
  return option ? { ...result, statChanges: option.statChanges, pitchTraining: option.pitchTraining, relationshipTargets: option.relationshipTargets } : result;
}
export function progressMonthlyGoal(player: Player, result: ActivityResult, date: GameDate): Player {
  const goal = player.monthlyGoal;
  if (!goal || !isGoalForMonth(goal, date) || goal.progress >= goal.target || !matchesMonthlyGoal(goal, sourceForGoal(result))) return player;
  return { ...player, monthlyGoal: { ...goal, progress: goal.progress + 1 } };
}
/** 월말 활동과 같은 저장에서 한 번 평가한다. 미달성 벌점은 없다. */
export function settleMonthlyGoal(player: Player, date: GameDate): Player {
  const goal = player.monthlyGoal;
  if (!goal || !isGoalForMonth(goal, date) || player.monthlyGoalReports?.some(r => r.id === goal.id)) return player;
  const completed = goal.progress >= goal.target;
  const updated = completed ? applyBondChanges(player, goal.kind === 'technique' ? { coach2: 2 } : goal.kind === 'teamwork' ? { coach: 2, peer: 1 } : { coach: 2 }) : player;
  const report: MonthlyGoalReport = { ...goal, completed, reward: actualBondChanges(player, updated),
    feedback: completed ? '약속한 습관을 지켰습니다. 다음 달에도 무리 없는 계획을 이어가세요.' : '목표에는 조금 못 미쳤습니다. 경기 일정과 피로를 돌아보고 다음 달 계획에 반영해 보세요.' };
  return { ...updated, monthlyGoalReports: [...(player.monthlyGoalReports ?? []), report] };
}

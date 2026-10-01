import { trainingFocus, trainingRecommendation } from '../../data/teamCompetition';
import { useState } from 'react';
import type { Player, GameDate } from '../../types';
import { getMonthlyGoalOptions, isGoalForMonth } from '../../data/monthlyGoals';
import { getDaysInMonth } from '../../types/calendar';
import { formatBondChanges } from '../../types/bondScores';
import { personalizeText } from '../../data/cast';
import { useGameClockStore } from '../../store/gameClockStore';
import './MonthlyGoalsPanel.css';

export function MonthlyGoalsPanel({ player, date, compact = false, onOpen }: { player: Player; date: GameDate; compact?: boolean; onOpen?: () => void }) {
  const [error, setError] = useState('');
  const declareMonthlyGoal = useGameClockStore(s => s.declareMonthlyGoal);
  const isLoading = useGameClockStore(s => s.isLoading);
  const activeCutscene = useGameClockStore(s => s.activeCutscene);
  const isCareerEnded = useGameClockStore(s => s.isCareerEnded);
  const goal = isGoalForMonth(player.monthlyGoal, date) ? player.monthlyGoal : undefined;
  const remaining = getDaysInMonth(date.year, date.month) - date.day + 1;
  const recommendedKind = trainingFocus(player) === 'recovery' ? 'recovery' : 'technique';
  const latest = player.monthlyGoalReports?.at(-1);
  return <section className="monthly-goals-panel glass-panel" aria-label="월간 훈련 목표">
    <h3>{date.month}월 나의 약속</h3>
    {goal ? <><strong>{goal.title}</strong><p>{goal.progress} / {goal.target}회 · {goal.progress >= goal.target ? '수행 완료 · 월말 평가 대기' : `월말까지 ${remaining}일`}</p><progress aria-label="월간 목표 진행률" value={goal.progress} max={goal.target} /><p>{goal.description}</p></> : <p>{isCareerEnded ? '고교 생활의 월간 목표를 마쳤습니다.' : `남은 ${remaining}일, 이번 달에 이어갈 습관을 골라보세요.`}</p>}
    {compact ? <><button className="btn btn-secondary" onClick={onOpen}>{goal ? '목표 · 지난 평가 확인' : '이번 달 목표 고르기'}</button>{latest && <small>최근 평가: {latest.month}월 · {latest.completed ? '달성' : '미달성'} ({latest.progress}/{latest.target}회)</small>}</> : <>
      {!goal && !isCareerEnded && <div className="monthly-goal-options">{getMonthlyGoalOptions(player, date).map(option => <button key={option.kind} className="btn btn-secondary" disabled={isLoading || !!activeCutscene || !!player.pendingGradeReportId} onClick={async () => { setError(''); try { await declareMonthlyGoal(option.kind); } catch { setError('목표를 저장하지 못했습니다. 다시 선택해주세요.'); } }}><strong>{option.title} · {option.target}회</strong>{option.kind === recommendedKind && <span>현재 상태 추천 · {trainingRecommendation(player)}</span>}<span>{option.description}</span></button>)}</div>}
      <p className="monthly-goal-note">선언 이후 수행만 인정 · 이번 달 선택은 변경할 수 없음 · 달성 보상은 월말 자동 반영 · 미달성 벌점 없음</p>
      <p className="monthly-goal-note">기술: 기술 코치 인연 +2 · 휴식: 감독 +2 · 야구부 인연: 감독 +2, 동기 +1 (상한 100)</p>
      {error && <p role="alert">{error}</p>}
      <h4>지난 월간 평가</h4>
      {player.monthlyGoalReports?.length ? <ul className="monthly-goal-history">{player.monthlyGoalReports.toReversed().map(report => <li key={report.id}><strong>{report.year}년 {report.month}월 · {report.title}</strong><p>{report.completed ? '달성' : '미달성'} · {report.progress}/{report.target}회</p><p>{report.feedback}</p><small>{Object.keys(report.reward).length ? personalizeText(formatBondChanges(report.reward), player) : '인연 추가 변화 없음'}</small></li>)}</ul> : <p>월말이 되면 이번 달 수행 기록과 평가가 남습니다.</p>}
    </>}
  </section>;
}

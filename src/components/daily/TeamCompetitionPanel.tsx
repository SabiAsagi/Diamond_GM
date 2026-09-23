import { useState } from 'react';
import type { Player, Position } from '../../types';
import { POSITION_LABELS } from '../../types';
import { useGameClockStore } from '../../store/gameClockStore';
import { APPEARANCE_LABELS, TEAM_ROLE_LABELS, FIELD_POSITIONS, fieldPosition, getDepthChart, getStanding, technicalScore, coachScore, trainingRecommendation, dateNumber, type FieldPosition } from '../../data/teamCompetition';
import { getRelScore } from '../../types/bondScores';

export function MatchSelectionCard({player,matchId}:{player:Player;matchId:string}) {
  const selection=player.teamCompetition?.selection;
  if(!selection||selection.matchId!==matchId)return null;
  return <section className="team-selection" aria-label="당일 선발 라인업 발표">
    <div className="team-section-heading"><h4>선발 라인업 발표</h4><strong className="team-role-chip">{APPEARANCE_LABELS[selection.role]}</strong></div>
    <p>{selection.reason}</p>
    {selection.advice&&<blockquote className="team-advice">{selection.advice}<small>출전하면 경기 후 멘탈 회복 +3 · 선배 인연 +1</small></blockquote>}
    <details><summary>선발 9명 확인</summary><ol className="team-lineup">{selection.lineup.map(n=><li key={n.position} className={n.id==='player'?'is-player':''}><span>{POSITION_LABELS[n.position]}</span><strong>{n.name}{n.id==='player'?' (나)':''}</strong></li>)}</ol><small>포지션별 선발 명단이며 타순은 아닙니다.</small></details>
  </section>;
}

export function TeamCompetitionPanel({player,onClose}:{player:Player;onClose:()=>void}) {
  const [position,setPosition]=useState<FieldPosition>(()=>fieldPosition(player.position));
  const [newPosition,setNewPosition]=useState<Position>(()=>player.position==='SS'?'2B':'SS');
  const [error,setError]=useState('');
  const {clock,dailyPlan,isLoading,activeCutscene,isCareerEnded,coachMeeting}=useGameClockStore();
  const t=player.teamCompetition; if(!t)return null;
  const standing=getStanding(player);const chart=getDepthChart(player,position);
  const remaining=Math.max(0,7-(dateNumber(clock.date)-(t.lastInterviewDay??-Infinity)));
  const canMeet=clock.currentSlot==='afternoon'&&!dailyPlan.slots.afternoon.forced&&!remaining&&!isLoading&&!activeCutscene&&!isCareerEnded;
  const meetingReason=remaining?`${remaining}일 뒤 다시 면담할 수 있습니다.`:clock.currentSlot!=='afternoon'||dailyPlan.slots.afternoon.forced?'자유 오후에 면담할 수 있습니다.':'면담은 오후 슬롯을 사용합니다. 다음 면담은 7일 뒤 가능합니다.';
  const meet=async(choice:'chance'|'position'|'accept')=>{setError('');try{await coachMeeting(choice,choice==='position'?newPosition:undefined);}catch{setError('저장하지 못했습니다. 다시 시도해 주세요.');}};
  return <section className="team-panel glass-panel" aria-labelledby="team-title">
    <header className="team-section-heading"><div><small>{player.highSchool} 야구부</small><h2 id="team-title">주전 경쟁</h2></div><button className="btn btn-secondary" onClick={onClose}>홈으로</button></header>
    <div className="team-summary-grid">
      <div><small>현재 팀 내 위치</small><strong>{TEAM_ROLE_LABELS[t.role]}</strong><span>{POSITION_LABELS[player.position]} {standing.rank}위 / {standing.total}명</span></div>
      <div><small>감독 평가</small><strong>{coachScore(player).toFixed(1)}</strong><span>감독 신뢰 {getRelScore(player,'coach')} / 100</span></div>
      <div><small>기술 코치 평가</small><strong>{technicalScore(player).toFixed(1)}</strong><span>훈련 성과 {t.training.toFixed(0)} · 최근 실적 {t.recentForm.toFixed(0)}</span></div>
    </div>
    <p className="team-help">능력·훈련 성과·최근 경기 내용·컨디션으로 평가합니다. 감독은 신뢰와 경험도 고려합니다. 포지션 1위는 주전, 2위는 백업이며 주전 평가 65점부터 핵심 선수입니다.</p>
    {t.poorStarts>0&&<p>최근 연속 부진 {t.poorStarts}경기 · 신뢰 75 이상인 기존 주전은 포지션 2위 이내에서 부진 두 경기까지 지위를 유지합니다.</p>}
    <section><div className="team-section-heading"><h3>포지션별 경쟁자</h3><label>포지션 <select value={position} onChange={e=>setPosition(e.target.value as FieldPosition)}>{FIELD_POSITIONS.map(p=><option key={p} value={p}>{POSITION_LABELS[p]}</option>)}</select></label></div>
      <p className="team-help">학교 선수 규모와 포지션 경쟁도를 반영한 게임 속 선수들입니다. 이도현은 친구이자 같은 포지션의 경쟁자로 시작하며, 포지션을 바꿔도 그의 포지션은 유지됩니다.</p>
      <div className="team-table-scroll"><table className="team-depth-table"><thead><tr><th scope="col">서열</th><th scope="col">선수</th><th scope="col">학년</th><th scope="col">평가</th><th scope="col">컨디션</th></tr></thead><tbody>{chart.map((n,i)=><tr key={n.id} className={n.isPlayer?'is-player':''}><td>{i+1}</td><th scope="row">{n.name}{n.isPlayer?' (나)':n.bondId==='peer'?' · 동기':n.bondId==='senior'?' · 주장':''}</th><td>{n.grade}학년</td><td>{n.score.toFixed(1)}</td><td>{n.condition}</td></tr>)}</tbody></table></div>
    </section>
    <section><h3>대회 엔트리 발표</h3><p className="team-help">개막 3일 전 확정 · 게임 규칙: 투수 최대 5명, 야수 포지션별 최대 2명. 발표 후 해당 대회 동안 고정됩니다. 주말리그·평가전은 경기마다 기회를 판단합니다.</p>
      {t.entries.length===0?<p>아직 발표된 대회 엔트리가 없습니다.</p>:t.entries.map(e=><details className="team-entry" key={`${e.year}-${e.tournamentId}`}><summary>{e.date} · {e.name} — {e.included?'엔트리 합류':'엔트리 제외'}</summary><p>{e.reason}</p><p>등록 {e.memberNames.length}명: {e.memberNames.join(', ')}</p></details>)}
    </section>
    {t.lastFeedback&&<section className="team-feedback"><h3>최근 경기 → 다음 훈련</h3><p>{APPEARANCE_LABELS[t.lastFeedback.performance.role]} · {t.lastFeedback.summary}</p><p>{TEAM_ROLE_LABELS[t.lastFeedback.before]} → {TEAM_ROLE_LABELS[t.lastFeedback.after]} · 감독 평가 {t.lastFeedback.coachDelta>=0?'+':''}{t.lastFeedback.coachDelta} · 코치 평가 {t.lastFeedback.technicalDelta>=0?'+':''}{t.lastFeedback.technicalDelta}</p><strong>{trainingRecommendation(player)}</strong></section>}
    <section><h3>감독 면담</h3><p>{meetingReason}</p>{t.opportunityGames>0&&<p>기회 요청: 엔트리 포함 경기 {t.opportunityGames}회 남음</p>}
      <div className="team-meeting-options">
        <button className="btn btn-secondary" disabled={!canMeet} onClick={()=>void meet('chance')}>기회를 주세요<small>다음 2경기 교체 기회 우선 검토 · 평가전 선발 기회</small></button>
        <div><label htmlFor="new-team-position">변경할 포지션</label><select id="new-team-position" value={newPosition} disabled={!canMeet} onChange={e=>setNewPosition(e.target.value as Position)}>{Object.entries(POSITION_LABELS).filter(([p])=>p!==player.position).map(([p,label])=><option key={p} value={p}>{label}</option>)}</select><button className="btn btn-secondary" disabled={!canMeet||newPosition===player.position} onClick={()=>void meet('position')}>포지션 변경 요청</button></div>
        <button className="btn btn-secondary" disabled={!canMeet} onClick={()=>void meet('accept')}>현재 역할을 받아들일게요<small>감독 신뢰 +3 · 동기 인연 +1 · 멘탈 +6</small></button>
      </div>{error&&<p role="alert">{error}</p>}
    </section>
  </section>;
}

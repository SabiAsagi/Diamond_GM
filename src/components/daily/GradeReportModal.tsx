import { useState } from 'react';
import type { Player } from '../../types';
import type { GradeReport } from '../../data/gradeReport';
import { getBondName } from '../../data/cast';
import { TEAM_ROLE_LABELS } from '../../data/teamCompetition';
import { useGameClockStore } from '../../store/gameClockStore';
import './GradeReportModal.css';

const signed = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n * 10) / 10}`;
export function GradeReportContent({ report, player }: { report: GradeReport; player: Player }) {
  const { start, end } = report;
  return <div className="grade-report-content">
    <p>{start.date.year}.{start.date.month}.{start.date.day} — {end.date.year}.{end.date.month}.{end.date.day}</p>
    {start.partial && <p className="grade-report-note">이전 저장본은 처음 불러온 날부터 성장을 비교합니다. 대회 요약은 보존된 시즌 기록 기준입니다.</p>}
    <div className="grade-report-grid">
      <section><h3>개인 성장</h3><strong>OVR {start.overall} → {end.overall}</strong><p>{signed(end.overall - start.overall)} 성장 · 장비 효과 포함</p><p>전국 상위 {start.percentile}% → {end.percentile}%</p><small>{report.grade}학년 기준 추정치 · 실제 선수 순위 아님</small></section>
      <section><h3>팀에서의 한 해</h3><strong>{TEAM_ROLE_LABELS[start.role]} → {TEAM_ROLE_LABELS[end.role]}</strong><p>감독 평가 {end.coachEvaluation.toFixed(1)} ({signed(end.coachEvaluation - start.coachEvaluation)})</p><p>코치 평가 {end.technicalEvaluation.toFixed(1)} ({signed(end.technicalEvaluation - start.technicalEvaluation)})</p><p>공식전 출전 {report.officialAppearances}회 · 미출전 {report.benchGames}회</p>{report.unknownGames > 0 && <small>출전 형태가 없는 이전 기록 {report.unknownGames}회 제외</small>}</section>
    </div>
    <section><h3>시즌 성적 · 학교 기준</h3>{report.tournaments.length ? <ul>{report.tournaments.map(t => <li key={t.id}><span>{t.name}</span><strong>{t.result}</strong></li>)}</ul> : <p>보존된 대회 결과가 없습니다.</p>}<small>청백전·연습경기는 제외합니다. 개인 미출전 경기의 팀 성적도 포함합니다.</small></section>
    <section><h3>함께 성장한 인연</h3><p>새롭게 3단계에 도달한 인연 {report.newBonds.length}명</p><p>{report.newBonds.map(id => getBondName(player, id)).join(' · ') || '다음 학년에도 꾸준히 마음을 나눠보세요.'}</p></section>
    <section><h3>새로 얻은 업적 {report.achievements.length}개</h3><p>{report.achievements.map(a => a.title).join(' · ') || '차곡차곡 쌓인 경험은 다음 도전으로 이어집니다.'}</p></section>
    <section className="grade-report-advice"><h3>다음 훈련을 준비하며</h3><p>{report.recommendation}</p></section>
  </div>;
}
export function GradeReportModal({ report, player }: { report: GradeReport; player: Player }) {
  const [error, setError] = useState('');
  const { dismissGradeReport, isLoading } = useGameClockStore();
  const close = async () => { try { await dismissGradeReport(); } catch { setError('확인 내용을 저장하지 못했습니다. 다시 눌러주세요.'); } };
  return <div className="cutscene-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="grade-report-title"
    onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); e.currentTarget.querySelector('button')?.focus(); } }}>
    <div className="glass-panel grade-report-card">
      <header><span className="cutscene-top-tag">나의 고교 야구 일지</span><h2 id="grade-report-title">{report.grade}학년을 완주했습니다!</h2><p>매일의 선택이 쌓여, {player.name} 선수의 한 해가 되었습니다.</p></header>
      <div className="grade-report-scroll"><GradeReportContent report={report} player={player} /></div>
      <footer>{error && <p role="alert">{error}</p>}<button autoFocus className="btn btn-primary" disabled={isLoading} onClick={() => void close()}>{isLoading ? '저장 중…' : report.grade < 3 ? `${report.grade + 1}학년 시작하기` : '고교 생활 돌아보기'}</button><small>확인한 리포트는 기록 → 학년 일지에서 다시 볼 수 있습니다.</small></footer>
    </div>
  </div>;
}

import { getRivalComparison, type RivalReport } from '../../data/rival';

const signed = (n: number) => `${n >= 0 ? '+' : ''}${n}`;
export function RivalReportModal({report,onClose}:{report:RivalReport;onClose:()=>void}) {
  return <div className="cutscene-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rival-report-title"
    onKeyDown={e => {if(e.key === 'Escape'){e.preventDefault();onClose();} if(e.key === 'Tab')e.preventDefault();}}>
    <div className="cutscene-modal-card glass-panel">
      <span className="cutscene-top-tag">🔥 월간 라이벌 리포트</span>
      <h2 className="cutscene-title" id="rival-report-title">라이벌 근황 · {report.year}년 {report.month}월</h2>
      <p className="cutscene-subtitle">지난 한 달 동안의 변화</p>
      <div className="cutscene-dialogue-box">
        <strong>박태성 · 지역 라이벌</strong>
        <p>종합 {report.rivalOverall} ({signed(report.rivalDelta)} 이번 달)</p>
        <strong>당신</strong>
        <p>종합 {report.playerOverall} ({signed(report.playerDelta)} 이번 달)</p>
      </div>
      <p>{getRivalComparison(report.playerOverall,report.rivalOverall)}</p>
      <p className="cutscene-subtitle">당신의 활동 선택과 관계없이, 박태성도 매달 자신의 훈련을 이어갑니다.</p>
      <button autoFocus className="btn btn-primary" onClick={onClose}>리포트 확인</button>
    </div>
  </div>;
}

import { EXTRA_RATINGS } from '../../data/playerDevelopment';
import { useEffect } from 'react';
import type { ActivityResult } from '../../types/activity';
import { CheckCircle2, ArrowUp, ArrowDown, X } from 'lucide-react';

interface SlotResultModalProps {
  result: ActivityResult;
  onClose: () => void;
}

export function SlotResultModal({ result, onClose }: SlotResultModalProps) {
  // ESC 키로 닫기 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 스탯 키 번역 맵
  const statLabels: Record<string, string> = {
    ...Object.fromEntries(Object.entries(EXTRA_RATINGS).map(([k,v])=>[k,v[0]])),velocity:'구속',
    stuff: '구위',
    control: '제구',
    stamina: '스태미너',
    contact: '컨택',
    power: '파워',
    eye: '선구안',
    speed: '주력',
    defense: '수비',
    condition: '컨디션',
    academics: '학업',
    fame: '인지도',
    relationshipFriends: '교우',
    relationshipTeam: '팀신뢰',
    relationshipCoach: '감독',
    relationshipFamily: '가족',
  };

  const statEntries = Object.entries(result.statChanges).filter(
    ([, val]) => typeof val === 'number' && val !== 0
  );

  return (
    <div className="result-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="result-modal-card glass-panel animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <button className="result-modal-close" onClick={onClose} aria-label="닫기">
          <X size={18} />
        </button>

        <div className="result-modal-header">
          <CheckCircle2 size={24} className="text-secondary" />
          <h4 className="result-title">활동 완료</h4>
        </div>

        <p className="result-log-preview">{result.logMessage.split('\n')[0]}</p>

        {/* 스탯 및 체력 변화 그리드 */}
        <div className="result-deltas-grid">
          {/* 체력 변화 */}
          {result.staminaDelta !== 0 && (
            <div
              className={`delta-item ${result.staminaDelta > 0 ? 'delta-positive' : 'delta-negative'}`}
            >
              <span className="delta-label">체력</span>
              <span className="delta-val">
                {result.staminaDelta > 0 ? `+${result.staminaDelta}` : result.staminaDelta}
              </span>
              {result.staminaDelta > 0 ? (
                <ArrowUp size={14} className="delta-icon" />
              ) : (
                <ArrowDown size={14} className="delta-icon" />
              )}
            </div>
          )}

          {/* 멘탈 변화 */}
          {result.mentalDelta !== undefined && result.mentalDelta !== 0 && (
            <div
              className={`delta-item ${result.mentalDelta > 0 ? 'delta-positive' : 'delta-negative'}`}
            >
              <span className="delta-label">멘탈/컨디션</span>
              <span className="delta-val">
                {result.mentalDelta > 0 ? `+${result.mentalDelta}` : result.mentalDelta}
              </span>
              {result.mentalDelta > 0 ? (
                <ArrowUp size={14} className="delta-icon" />
              ) : (
                <ArrowDown size={14} className="delta-icon" />
              )}
            </div>
          )}

          {/* 세부 스탯 변화 */}
          {result.moneyDelta !== undefined && result.moneyDelta !== 0 && (
            <div className={`delta-item ${result.moneyDelta > 0 ? 'delta-positive' : 'delta-negative'}`}><span className="delta-label">소지금</span><span className="delta-val">{result.moneyDelta > 0 ? '+' : ''}{result.moneyDelta.toLocaleString()}원</span></div>
          )}
          {statEntries.map(([key, val]) => {
            const numVal = val as number;
            const isPos = numVal > 0;
            return (
              <div
                key={key}
                className={`delta-item ${isPos ? 'delta-positive' : 'delta-negative'}`}
              >
                <span className="delta-label">{statLabels[key] || key}</span>
                <span className="delta-val">{isPos ? `+${numVal}` : numVal}</span>
                {isPos ? (
                  <ArrowUp size={14} className="delta-icon" />
                ) : (
                  <ArrowDown size={14} className="delta-icon" />
                )}
              </div>
            );
          })}
        </div>

        {/* 부상 알림 경고 */}
        {result.isInjured && (
          <div className="result-injury-alert">
            {result.injuryNotice || '과도한 피로로 부상 위험이 발생했습니다!'}
          </div>
        )}

        <button className="btn btn-primary btn-sm result-confirm-btn" onClick={onClose}>
          확인 (Enter)
        </button>
      </div>
    </div>
  );
}

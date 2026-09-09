import type { Player } from '../../../types';
import { buildBondProfiles, scoreToStage } from '../../../types/relationship';
import { Users, Sparkles, Heart } from 'lucide-react';

export function RelationshipsView({ player }: { player: Player; onClose: () => void }) {
  const profiles = buildBondProfiles(player);

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Users size={22} />
          <div>
            <h3 className="menu-view-title">선수 인연 & 인간관계도</h3>
            <p className="menu-view-sub">
              학년과 호감도에 따라 새로운 조언, 특훈, 특별한 인연 이벤트가 열립니다.
            </p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        <div className="relationships-grid">
          {profiles.map(p => {
            const stage = scoreToStage(p.score);
            const romance = !!p.romanceable && stage >= 4;
            const currentLabel = p.stageLabels[stage - 1] || '인연 형성 중';

            return (
              <div className="rel-card glass-panel" key={p.id}>
                <div className="rel-card-top">
                  <span className="rel-icon">{p.icon}</span>
                  <div className="rel-info">
                    <strong className="rel-name">{p.name}</strong>
                    <span className="rel-role">{p.role}</span>
                  </div>
                  <span className="rel-score-badge">{p.score} pt</span>
                </div>

                <div className="rel-gauge-track">
                  <div className="rel-gauge-fill" style={{ width: `${Math.min(100, p.score)}%` }} />
                </div>

                <div className="rel-status-text">
                  <strong>{currentLabel}</strong>
                </div>

                <p className="rel-effect-desc">
                  <Sparkles size={12} /> {p.note}
                </p>

                {p.romanceable && (
                  <p className="rel-effect-desc" style={{ color: romance ? '#f43f5e' : '#fb7185' }}>
                    <Heart size={12} />{' '}
                    {romance ? '특별한 사이 · 연애 이벤트 활성화' : '호감도가 깊어지면 연애 이벤트 가능'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

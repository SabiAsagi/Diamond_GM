import type { Player } from '../../../types';
import { buildBondProfiles, scoreToStage, RELATIONSHIP_GROUP_LABELS } from '../../../types/relationship';
import { Users, Heart, ChevronDown } from 'lucide-react';

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
              인물을 눌러 단계별 실제 효과를 확인하세요. 같은 그룹의 인연 점수는 함께 변합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        <div className="relationships-grid">
          {profiles.map(p => {
            const stage = scoreToStage(p.score);
            const effectStage = scoreToStage(p.sharedScore);
            const currentLabel = p.stageLabels[stage - 1] || '인연 형성 중';

            return (
              <details className="rel-card glass-panel" key={p.id}>
                <summary className="rel-summary" aria-label={`${p.name} 단계별 효과`}>
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
                  <strong>현재 {stage}단계 · {currentLabel}</strong>
                </div>

                <span className="rel-detail-prompt">
                  {p.stageEffects.some(effect => effect.hasEffect) ? '단계별 효과 보기' : '효과 없음 · 단계별 상세 보기'}
                  <ChevronDown size={16} aria-hidden="true" />
                </span>

                {p.romanceable && (
                  <p className="rel-effect-desc rel-romance-label">
                    <Heart size={12} aria-hidden="true" /> 로맨스 대상 · 단계 효과와 별도
                  </p>
                )}
                </summary>

                <div className="rel-stage-details">
                  <p className="rel-shared-score">
                    공유 {RELATIONSHIP_GROUP_LABELS[p.scoreKey]}: <strong>{p.sharedScore}점 · {effectStage}단계</strong>
                  </p>
                  {p.scoreAdjustmentNote && <p className="rel-detail-note">{p.scoreAdjustmentNote}</p>}
                  <h4>단계별 추가 효과</h4>
                  <p className="rel-detail-note">달성 여부는 공유 인연 점수 기준입니다. 이전 단계의 효과는 계속 유지됩니다.</p>
                  <ol className="rel-stage-list">
                    {p.stageEffects.map(effect => {
                      const reached = effectStage >= effect.stage;
                      return <li key={effect.stage} className={`rel-stage-row ${reached ? 'is-reached' : 'is-locked'}`}>
                        <div className="rel-stage-heading">
                          <strong>{effect.stage}단계 · {p.stageLabels[effect.stage - 1]}</strong>
                          <span>{reached ? '✓ 달성' : '미달성'}</span>
                        </div>
                        <p>{effect.description}{reached && effect.hasEffect && <span className="rel-effect-active"> · 적용 중</span>}</p>
                      </li>;
                    })}
                  </ol>
                  {p.scoreKey === 'relationshipTeam' && <p className="rel-detail-note">팀 인연 보너스는 이 점수를 공유하는 인물 전체에 대해 한 번만 적용되며, 인물 수만큼 중복되지 않습니다.</p>}
                  {p.id === 'coach' && <p className="rel-detail-note">%p는 승리 확률에 더하는 값입니다. 최종 승률에는 10~90% 제한이 적용됩니다.</p>}
                  {p.stageEffects.some(effect => effect.hasEffect) && <p className="rel-detail-note">훈련 효과는 능력치 증가량에 배율을 적용한 뒤 반올림합니다. 작은 증가량은 보정 전후가 같을 수 있습니다.</p>}
                  <p className="rel-detail-note">대화·데이트 이벤트는 활동·점수·학년·컨디션·쿨다운 등 별도 조건으로 발생하며, 단계 달성만으로 보장되지 않습니다.</p>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

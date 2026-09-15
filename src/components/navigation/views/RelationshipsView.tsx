import type { Player } from '../../../types';
import { buildBondProfiles, scoreToStage } from '../../../types/relationship';
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
              인물을 눌러 단계별 실제 효과를 확인하세요. 인연은 인물마다 따로 쌓입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        <div className="relationships-grid">
          {profiles.map(p => {
            const stage = scoreToStage(p.score);
            const effectStage = stage;
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

                {p.id === 'rival' && player.rivalProgress && <p className="rel-effect-desc">현재 종합 {player.rivalProgress.overall} · {player.overall === player.rivalProgress.overall ? '당신과 동률' : player.overall > player.rivalProgress.overall ? `당신이 ${player.overall-player.rivalProgress.overall} 앞섬` : `당신이 ${player.rivalProgress.overall-player.overall} 뒤짐`}</p>}
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
                  <h4>단계별 추가 효과</h4>
                  <p className="rel-detail-note">달성 여부는 이 인물의 인연 점수 기준입니다. 이전 단계의 효과는 계속 유지됩니다.</p>
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
                  {p.id === 'peer' && <p className="rel-detail-note">이도현과의 인연 5단계에서 훈련 효율 +10%를 얻습니다. 감독의 훈련 효과와 합산됩니다.</p>}
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

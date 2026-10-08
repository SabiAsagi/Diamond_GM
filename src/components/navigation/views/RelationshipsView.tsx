import { useEffect, useRef, useState } from 'react';
import type { Player } from '../../../types';
import { buildBondProfiles, scoreToStage, type BondProfile } from '../../../types/relationship';
import { Users, Heart, X } from 'lucide-react';
import { CharacterPortrait } from '../../CharacterPortrait';
import { personalizeText } from '../../../data/cast';
import { hasMet } from '../../../data/careerJourney';

export function RelationshipsView({ player }: { player: Player; onClose: () => void }) {
  const profiles = buildBondProfiles(player).filter(p => hasMet(player, p.id));
  const [selectedId, setSelectedId] = useState<BondProfile['id'] | null>(null);
  const selected = profiles.find(p => p.id === selectedId);

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Users size={22} />
          <div>
            <h3 className="menu-view-title">선수 인연 & 인간관계도</h3>
            <p className="menu-view-sub">
              첫 만남을 마친 인물만 표시됩니다. 학교생활과 컷씬을 통해 새로운 인연을 만나세요.
            </p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        <div className="relationships-grid">
          {profiles.map(p => {
            const stage = scoreToStage(p.score);
            const currentLabel = p.stageLabels[stage - 1] || '인연 형성 중';
            return (
              <button type="button" className="rel-card glass-panel" key={p.id} onClick={() => setSelectedId(p.id)} aria-haspopup="dialog" aria-label={`${p.name} 단계별 효과 보기`}>
                <div className="rel-card-top">
                  <CharacterPortrait player={player} id={p.id} className="rel-character-portrait" />
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
                {p.romanceable && (
                  <p className="rel-effect-desc rel-romance-label">
                    <Heart size={12} aria-hidden="true" /> 로맨스 대상 · 단계 효과와 별도
                  </p>
                )}
                <span className="rel-detail-prompt">
                  {p.stageEffects.some(effect => effect.hasEffect) || p.id === 'senior' ? '효과·인연 상세 보기' : '단계별 상세 보기'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected && <BondDetailDialog player={player} profile={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

/** 단계별 효과 팝업. 카드 목록을 밀어내지 않도록 화면 위에 띄운다. 닫기·Esc·바깥 클릭으로 닫힌다. */
function BondDetailDialog({ player, profile: p, onClose }: { player: Player; profile: BondProfile; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const stage = scoreToStage(p.score);

  return (
    <dialog
      ref={dialog}
      className="rel-dialog"
      aria-labelledby="rel-dialog-title"
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <header className="rel-dialog-header">
        <CharacterPortrait player={player} id={p.id} className="rel-dialog-portrait" />
        <div className="rel-info">
          <strong id="rel-dialog-title" className="rel-name">{p.name}</strong>
          <span className="rel-role">{p.role} · {p.score} pt · 현재 {stage}단계</span>
          {p.romanceable && <span className="rel-romance-label"><Heart size={12} aria-hidden="true" /> 로맨스 대상</span>}
        </div>
        <button type="button" className="rel-dialog-close" onClick={onClose} aria-label="닫기" autoFocus><X size={20} /></button>
      </header>
      <div className="rel-stage-details">
        <h4>단계별 추가 효과</h4>
        {['coach', 'senior'].includes(p.id) && <p className="rel-detail-note">{p.note}</p>}
        <p className="rel-detail-note">달성 여부는 이 인물의 인연 점수 기준입니다. 이전 단계의 효과는 계속 유지됩니다.</p>
        <ol className="rel-stage-list">
          {p.stageEffects.map(effect => {
            const reached = stage >= effect.stage;
            return <li key={effect.stage} className={`rel-stage-row ${reached ? 'is-reached' : 'is-locked'}`}>
              <div className="rel-stage-heading">
                <strong>{effect.stage}단계 · {p.stageLabels[effect.stage - 1]}</strong>
                <span>{reached ? '✓ 달성' : '미달성'}</span>
              </div>
              <p>{effect.description}{reached && effect.hasEffect && <span className="rel-effect-active"> · 적용 중</span>}</p>
            </li>;
          })}
        </ol>
        {p.id === 'peer' && <p className="rel-detail-note">{personalizeText('{peer|과}의 인연 5단계에서 훈련 효율 +10%를 얻습니다. 감독의 훈련 효과와 합산됩니다.', player)}</p>}
        {p.id === 'coach' && <p className="rel-detail-note">%p는 승리 확률에 더하는 값입니다. 최종 승률에는 10~90% 제한이 적용됩니다.</p>}
        {p.stageEffects.some(effect => effect.hasEffect) && <p className="rel-detail-note">훈련 효과는 능력치 증가량에 배율을 적용한 뒤 반올림합니다. 작은 증가량은 보정 전후가 같을 수 있습니다.</p>}
        <p className="rel-detail-note">대화·데이트 이벤트는 활동·점수·학년·컨디션·쿨다운 등 별도 조건으로 발생하며, 단계 달성만으로 보장되지 않습니다.</p>
      </div>
    </dialog>
  );
}

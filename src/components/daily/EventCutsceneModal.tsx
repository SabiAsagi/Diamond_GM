import type { EventCutscene } from '../../types/randomEvent';
import { Sparkles, ArrowRight, UserCheck } from 'lucide-react';

interface EventCutsceneModalProps {
  cutscene: EventCutscene;
  onConfirm: () => void;
}

export function EventCutsceneModal({ cutscene, onConfirm }: EventCutsceneModalProps) {
  return (
    <div className="cutscene-modal-backdrop animate-fade-in">
      <div className="cutscene-modal-card glass-panel animate-scale-up">
        {/* 상단 뱃지 */}
        <div className="cutscene-top-tag">
          <Sparkles size={15} color="#fbbf24" />
          <span>특별 이벤트 컷신 발생</span>
        </div>

        <div className="cutscene-header">
          <span className="cutscene-icon-huge">{cutscene.icon}</span>
          <div className="cutscene-header-texts">
            <h3 className="cutscene-title">{cutscene.title}</h3>
            <p className="cutscene-subtitle">{cutscene.subtitle}</p>
          </div>
        </div>

        {/* 대사창 박스 */}
        <div className="cutscene-dialogue-box">
          <div className="cutscene-speaker-badge">
            <UserCheck size={14} color="#60a5fa" />
            <strong>{cutscene.speakerName}</strong>
            <span className="speaker-role-chip">{cutscene.speakerRole}</span>
          </div>
          <p className="cutscene-quote">{cutscene.dialogue}</p>
        </div>

        <div className="cutscene-footer">
          <button className="btn btn-primary btn-lg cutscene-confirm-btn" onClick={onConfirm}>
            <span>계속 진행하기</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

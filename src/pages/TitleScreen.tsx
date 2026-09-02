import { Trophy, Shield, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

export default function TitleScreen() {
  const navigate = useNavigate();

  return (
    <div className="title-screen-container">
      <div className="title-content animate-fade-in">
        <Trophy size={64} color="var(--accent)" className="title-icon" />
        <h1 className="title-text">Diamond GM</h1>
        <p className="title-subtitle">하나의 세계관, 두 가지의 전설</p>

        <div className="mode-selection-container">
          {/* 선수 육성 모드 */}
          <button 
            className="mode-card glass-panel" 
            onClick={() => navigate('/development/create')}
          >
            <UserPlus size={48} color="var(--secondary)" className="mode-icon" />
            <h2>선수 육성 모드</h2>
            <p>고교 야구 유망주를 생성하고 훈련시켜 프로 무대로 진출시키세요. 당신만의 서사를 가진 프랜차이즈 스타를 직접 육성할 수 있습니다.</p>
          </button>

          {/* 구단 운영 모드 */}
          <button 
            className="mode-card glass-panel" 
            onClick={() => navigate('/management')}
          >
            <Shield size={48} color="var(--primary)" className="mode-icon" />
            <h2>구단 운영 모드</h2>
            <p>프로 구단의 단장이 되어 드래프트, 트레이드, 2군 관리를 통해 최고의 팀을 만드세요. 당신이 키운 선수를 직접 영입할 수도 있습니다.</p>
          </button>
        </div>
      </div>
    </div>
  );
}

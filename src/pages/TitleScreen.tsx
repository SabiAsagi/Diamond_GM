import { useEffect, useState } from 'react';
import type { Player } from '../types';
import { db } from '../db';
import { getSavedCareers, getCareerRoute } from '../data/savedCareers';
import { POSITION_LABELS } from '../types';
import { GAME_VERSION } from '../version';
import { Trophy, Shield, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import './TitleScreen.css';

export default function TitleScreen() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Player[]>([]);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    db.players.toArray().then(players => { if (active) { setCareers(getSavedCareers(players)); setLoadError(''); } })
      .catch(() => { if (active) setLoadError('저장된 선수를 불러오지 못했습니다.'); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <div className="title-screen-container">
      <div className="title-content animate-fade-in">
        <Trophy size={64} color="var(--accent)" className="title-icon" />
        <h1 className="title-text">Diamond GM</h1>
        <p>버전 {GAME_VERSION}</p>
        <p className="title-subtitle">매일의 선택으로 완성하는 고교 야구 일지</p>
        {loadError && <p role="alert">{loadError} <button className="btn btn-secondary" onClick={() => setAttempt(n => n + 1)}>다시 불러오기</button></p>}
        {careers.length > 0 && <section className="glass-panel saved-careers" aria-label="저장된 선수 이어서 하기"><h2>이어서 하기</h2><div>{careers.map(player => <button className="btn btn-secondary" key={player.id} onClick={() => navigate(getCareerRoute(player))}><strong>{player.name} · {POSITION_LABELS[player.position]}</strong><span>{player.highSchool} · {player.careerEndedAt || player.gradeReports?.some(r => r.grade === 3) ? '졸업 기록 돌아보기' : player.interviewCompleted ? `${player.gameDate?.grade ?? player.grade ?? 1}학년 ${player.gameDate?.month ?? 3}월 ${player.gameDate?.day ?? 2}일` : '입학 면담 이어서 하기'}</span></button>)}</div></section>}

        <div className="mode-selection-container">
          {/* 선수 육성 모드 */}
          <button 
            className="mode-card glass-panel" 
            onClick={() => navigate('/development/create')}
          >
            <UserPlus size={48} color="var(--secondary)" className="mode-icon" />
            <h2>새 선수 만들기</h2>
            <p>나만의 선수로 입학해 경기·훈련·인연을 쌓고, 한 해의 성장을 학년 일지에 남겨보세요.</p>
          </button>

          {/* 구단 운영 모드 */}
          <button 
            className="mode-card glass-panel" 
            onClick={() => navigate('/management')}
          >
            <Shield size={48} color="var(--primary)" className="mode-icon" />
            <h2>구단 운영 모드 · 미리보기</h2>
            <p>구단 화면의 기초를 둘러볼 수 있습니다. 드래프트·트레이드와 육성 선수 연동은 후속 개발 예정입니다.</p>
          </button>
        </div>
      </div>
    </div>
  );
}


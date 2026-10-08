import { useEffect, useState } from 'react';
import type { Player } from '../types';
import { db } from '../db';
import { getSavedCareers, getCareerRoute } from '../data/savedCareers';
import { POSITION_LABELS } from '../types';
import { GAME_VERSION } from '../version';
import { Diamond, Shield, UserPlus, ArrowUpRight } from 'lucide-react';
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
        <div className="title-journal-label"><Diamond size={24} aria-hidden="true" /> THE PLAYER'S JOURNEY <span>v{GAME_VERSION}</span></div>
        <div className="title-journal-grid"><section className="title-journal-intro">
        <h1 className="title-text">Diamond GM</h1>
        <h2 className="title-journal-headline">한 번의 스윙보다,<br />매일의 선택이 나를 만든다.</h2>
        <p className="title-subtitle">처음 유니폼을 입는 날부터 마지막 고교 경기까지.<br />경기와 훈련, 친구들과 함께 나만의 야구 일지를 써보세요.</p>
        <button className="btn btn-primary title-primary-action" onClick={() => navigate('/development/create')}><UserPlus size={20} aria-hidden="true" /> 새 선수로 입학하기<ArrowUpRight size={20} aria-hidden="true" /></button>
        <div className="title-journal-facts"><span><strong>91</strong>개의 고교 야구부</span><span><strong>3</strong>년의 선수 생활</span><span><strong>나</strong>만의 성장 기록</span></div>
        </section><div className="title-player-cover" aria-hidden="true"><div className="cover-diamond" /><span className="cover-label">YOUR NEXT CHAPTER</span><img src={`${import.meta.env.BASE_URL}assets/portraits/male-spiky-v19.webp`} alt="" /><strong>PLAY.<br />GROW.<br />BELONG.</strong><span className="cover-caption">그라운드에서 시작하는 나의 이야기</span></div></div>
        {loadError && <p role="alert">{loadError} <button className="btn btn-secondary" onClick={() => setAttempt(n => n + 1)}>다시 불러오기</button></p>}
        {careers.length > 0 && <section className="glass-panel saved-careers" aria-label="저장된 선수 이어서 하기"><h2>이어서 하기</h2><div>{careers.map(player => <button className="btn btn-secondary" key={player.id} onClick={() => navigate(getCareerRoute(player))}><strong>{player.name} · {POSITION_LABELS[player.position]}</strong><span>{player.highSchool} · {player.careerEndedAt || player.gradeReports?.some(r => r.grade === 3) ? '졸업 기록 돌아보기' : player.interviewCompleted ? `${player.gameDate?.grade ?? player.grade ?? 1}학년 ${player.gameDate?.month ?? 3}월 ${player.gameDate?.day ?? 2}일` : '입학 면담 이어서 하기'}</span></button>)}</div></section>}

        <div className="mode-selection-container">
          <button 
            className="mode-card glass-panel" 
            onClick={() => navigate('/management')}
          >
            <Shield size={24} color="var(--primary)" className="mode-icon" aria-hidden="true" />
            <h2>구단 운영 모드 · 미리보기</h2>
            <p>구단 화면의 기초를 둘러볼 수 있습니다. 드래프트·트레이드와 육성 선수 연동은 후속 개발 예정입니다.</p>
          </button>
        </div>
      </div>
    </div>
  );
}


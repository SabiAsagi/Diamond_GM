import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { initDummyDataIfNeeded } from './db';
import TitleScreen from './pages/TitleScreen';
import MainLayout from './layouts/MainLayout';
import PlayerCreation from './pages/development/PlayerCreation';
import './index.css';

import CoachInterview from './pages/development/CoachInterview';
import DevelopmentDashboard from './pages/development/DevelopmentDashboard';

// Placeholder Pages for Management Mode
const ManagementDashboard = () => (
  <div className="animate-fade-in">
    <h1>구단 대시보드</h1>
    <div className="glass-panel">
      <h2>단장님, 환영합니다</h2>
      <p>현재 팀의 주요 일정과 재정 상태를 확인하세요.</p>
    </div>
  </div>
);

const ManagementRoster = () => (
  <div className="animate-fade-in">
    <h1>선수단 관리</h1>
    <div className="glass-panel">
      <p>1군, 2군 로스터를 관리하고 선발 라인업을 구성하세요.</p>
    </div>
  </div>
);

const ManagementLeague = () => (
  <div className="animate-fade-in">
    <h1>리그 순위</h1>
    <div className="glass-panel">
      <p>정규 시즌 순위와 선수 개인 기록을 확인합니다.</p>
    </div>
  </div>
);

const App = () => {
  useEffect(() => {
    initDummyDataIfNeeded();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        
        {/* 선수 육성 모드 */}
        <Route path="/development/create" element={<PlayerCreation />} />
        <Route path="/development/interview/:id" element={<CoachInterview />} />
        <Route path="/development/dashboard/:id" element={<DevelopmentDashboard />} />

        {/* 구단 운영 모드 */}
        <Route path="/management" element={<MainLayout />}>
          <Route index element={<ManagementDashboard />} />
          <Route path="roster" element={<ManagementRoster />} />
          <Route path="league" element={<ManagementLeague />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

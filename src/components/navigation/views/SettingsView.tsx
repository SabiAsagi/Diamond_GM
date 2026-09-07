import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../../../types';
import { Settings, Zap, Volume2, Database, RotateCcw } from 'lucide-react';
import { db } from '../../../db';

interface SettingsViewProps {
  player: Player;
  onClose: () => void;
}

export function SettingsView({ player }: SettingsViewProps) {
  const navigate = useNavigate();

  const [simSpeed, setSimSpeed] = useState<'normal' | 'fast' | 'instant'>('fast');
  const [criticalMoments, setCriticalMoments] = useState<boolean>(true);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);

  const handleResetData = async () => {
    if (confirm('정말로 이 선수의 데이터를 초기화하고 처음부터 다시 시작하시겠습니까?')) {
      if (player.id) {
        await db.players.delete(player.id);
      }
      navigate('/development/create');
    }
  };

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Settings size={22} className="text-primary" />
          <div>
            <h3 className="menu-view-title">환경설정 & 데이터 관리</h3>
            <p className="menu-view-sub">게임 진행 옵션, 음향, 세이브 데이터를 관리합니다.</p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        <div className="settings-sections-stack">
          {/* 1. 경기 시뮬레이션 설정 */}
          <div className="settings-section glass-panel">
            <h4 className="setting-sec-title">
              <Zap size={16} className="text-accent" /> 경기 시뮬레이션 설정
            </h4>

            <div className="setting-row">
              <div className="setting-label-group">
                <strong>경기 진행 속도</strong>
                <span>공식 경기 시뮬레이션 속도를 조절합니다.</span>
              </div>
              <div className="setting-button-group">
                {(['normal', 'fast', 'instant'] as const).map(s => (
                  <button
                    key={s}
                    className={`setting-toggle-btn ${simSpeed === s ? 'active' : ''}`}
                    onClick={() => setSimSpeed(s)}
                  >
                    {s === 'normal' ? '보통 (1x)' : s === 'fast' ? '빠름 (2x)' : '즉시 (결과)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-label-group">
                <strong>승부처 중요 순간 개입 (Clutch Intervention)</strong>
                <span>득점권 위기나 끝내기 타석 시 플레이어 수동 선택지를 제공합니다.</span>
              </div>
              <button
                className={`toggle-switch-btn ${criticalMoments ? 'on' : 'off'}`}
                onClick={() => setCriticalMoments(prev => !prev)}
              >
                {criticalMoments ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 2. 사운드 및 음향 */}
          <div className="settings-section glass-panel">
            <h4 className="setting-sec-title">
              <Volume2 size={16} className="text-secondary" /> 사운드 및 효과음
            </h4>

            <div className="setting-row">
              <div className="setting-label-group">
                <strong>배경음악 (BGM)</strong>
                <span>메인 화면 및 경기 BGM 재생 여부를 설정합니다.</span>
              </div>
              <button
                className={`toggle-switch-btn ${bgmEnabled ? 'on' : 'off'}`}
                onClick={() => setBgmEnabled(prev => !prev)}
              >
                {bgmEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-label-group">
                <strong>타격/투구 효과음 (SFX)</strong>
                <span>배트 타격음 및 포수 포구 효과음을 설정합니다.</span>
              </div>
              <button
                className={`toggle-switch-btn ${sfxEnabled ? 'on' : 'off'}`}
                onClick={() => setSfxEnabled(prev => !prev)}
              >
                {sfxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 3. 데이터 저장 및 관리 */}
          <div className="settings-section glass-panel">
            <h4 className="setting-sec-title">
              <Database size={16} className="text-primary" /> 세이브 데이터 및 초기화
            </h4>

            <div className="setting-row">
              <div className="setting-label-group">
                <strong>저장 방식</strong>
                <span>브라우저 IndexedDB (Dexie)에 실시간 자동 영속화됩니다.</span>
              </div>
              <span className="save-status-badge">✅ 자동 저장 활성화</span>
            </div>

            <div className="setting-row danger-zone">
              <div className="setting-label-group">
                <strong style={{ color: '#ef4444' }}>선수 데이터 초기화</strong>
                <span>현재 진행 중인 선수를 삭제하고 새 선수를 생성합니다.</span>
              </div>
              <button className="btn btn-sm btn-danger" onClick={handleResetData}>
                <RotateCcw size={14} /> 데이터 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

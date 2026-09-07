import { useState } from 'react';
import type { Player } from '../../../types';
import type { ScheduledMatch } from '../../../types/tournament';
import type { DayLogRecord } from '../../../store/gameClockStore';
import { Trophy, Calendar, BookOpen, Shield, Award } from 'lucide-react';

interface MatchesViewProps {
  player: Player;
  matches: ScheduledMatch[];
  historyLogs: DayLogRecord[];
  onClose: () => void;
}

export function MatchesView({ player, matches, historyLogs }: MatchesViewProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'stats' | 'logs'>('schedule');

  const isPitcher = player.position === 'P';

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Trophy size={22} className="text-accent" />
          <div>
            <h3 className="menu-view-title">공식 경기 & 대회 기록실</h3>
            <p className="menu-view-sub">주말리그 및 메이저 전국대회 전적과 개인 기록을 확인합니다.</p>
          </div>
        </div>

        {/* 탭 전환 바 */}
        <div className="menu-view-tabs">
          <button
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={14} /> 대회 일정 & 결과
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Award size={14} /> 개인 시즌 성적
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <BookOpen size={14} /> 활동 일지 아카이브
          </button>
        </div>
      </div>

      <div className="menu-view-body">
        {/* 1. 대회 일정 및 결과 */}
        {activeTab === 'schedule' && (
          <div className="matches-schedule-list">
            <div className="record-summary-banner glass-panel">
              <div className="school-record-stat">
                <Shield size={20} className="text-primary" />
                <span>{player.highSchool} 야구부 2026 시즌 공식 경기 현황</span>
              </div>
              <span className="record-badge">총 {matches.length}경기 편성</span>
            </div>

            <div className="match-cards-grid">
              {matches.map(m => (
                <div key={m.id} className="match-card glass-panel">
                  <div className="m-card-header">
                    <span className="m-tour-name">{m.tournamentName}</span>
                    <span className="m-date-tag">{m.date.month}월 {m.date.day}일</span>
                  </div>
                  <div className="m-round-title">{m.round}</div>
                  <div className="m-vs-row">
                    <span className="team-name home">{m.homeSchoolName}</span>
                    <span className="vs-tag">VS</span>
                    <span className="team-name away">{m.awaySchoolName}</span>
                  </div>
                  <p className="m-desc">{m.description || '정규 공식 경기'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. 개인 시즌 성적 */}
        {activeTab === 'stats' && (
          <div className="player-season-records">
            <div className="season-stats-grid">
              {isPitcher ? (
                <>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">평균자책점 (ERA)</span>
                    <strong className="stat-box-num">2.45</strong>
                    <span className="stat-box-sub">전국 상위 5%</span>
                  </div>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">탈삼진 (SO)</span>
                    <strong className="stat-box-num">38</strong>
                    <span className="stat-box-sub">9이닝당 10.2개</span>
                  </div>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">소화 이닝 (IP)</span>
                    <strong className="stat-box-num">33.0</strong>
                    <span className="stat-box-sub">선발 5회 등판</span>
                  </div>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">WHIP (이닝당 출루)</span>
                    <strong className="stat-box-num">1.09</strong>
                    <span className="stat-box-sub">안정적 제구력</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">시즌 타율 (AVG)</span>
                    <strong className="stat-box-num">.348</strong>
                    <span className="stat-box-sub">46타수 16안타</span>
                  </div>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">홈런 (HR)</span>
                    <strong className="stat-box-num">3</strong>
                    <span className="stat-box-sub">장타율 .587</span>
                  </div>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">타점 (RBI)</span>
                    <strong className="stat-box-num">14</strong>
                    <span className="stat-box-sub">득점권 타율 .412</span>
                  </div>
                  <div className="season-stat-box glass-panel">
                    <span className="stat-box-label">출루율 (OBP)</span>
                    <strong className="stat-box-num">.423</strong>
                    <span className="stat-box-sub">OPS 1.010</span>
                  </div>
                </>
              )}
            </div>

            <div className="season-scout-eval glass-panel" style={{ marginTop: '16px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#fbbf24' }}>
                📋 KBO 스카우트 팀 평가 코멘트
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                "{player.name} 선수는 {player.highSchool}의 핵심 전력으로, 위기 상황에서도 주눅 들지 않는 강한 멘탈과 뛰어난 신체 밸런스를 보여주고 있습니다. 후반기 주말리그와 전국대회에서 스카우트들의 관심이 더욱 고조될 유망주입니다."
              </p>
            </div>
          </div>
        )}

        {/* 3. 활동 일지 아카이브 */}
        {activeTab === 'logs' && (
          <div className="logs-archive-list">
            {historyLogs.length === 0 ? (
              <div className="empty-archive">
                <BookOpen size={24} className="text-muted" />
                <p>아직 지난 일자의 활동 기록이 없습니다.</p>
              </div>
            ) : (
              historyLogs.map((item, idx) => (
                <div key={idx} className="archive-log-card glass-panel">
                  <div className="archive-date-tag">
                    📅 {item.date.grade}학년 {item.date.month}월 {item.date.day}일
                  </div>
                  <div className="archive-lines">
                    {item.morningLog && <div className="a-slot-item">🌅 오전: {item.morningLog}</div>}
                    {item.afternoonLog && <div className="a-slot-item">☀️ 오후: {item.afternoonLog}</div>}
                    {item.nightLog && <div className="a-slot-item">🌙 야간: {item.nightLog}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { TournamentBracket } from './TournamentBracket';
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
  const [activeTab, setActiveTab] = useState<'schedule' | 'stats' | 'logs' | 'bracket'>('schedule');



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
        <div className="menu-view-tabs"><button className={`tab-btn ${activeTab==='bracket'?'active':''}`} onClick={()=>setActiveTab('bracket')}>조 추첨 · 대진표</button>
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

      <div className="menu-view-body">{activeTab==='bracket'&&<TournamentBracket matches={matches}/>}
        {/* 1. 대회 일정 및 결과 */}
        {activeTab === 'schedule' && (
          <div className="matches-schedule-list">
            <div className="record-summary-banner glass-panel">
              <div className="school-record-stat">
                <Shield size={20} className="text-primary" />
                <span>{player.highSchool} 야구부 {player.gameDate?.year??2026} 시즌 공식 경기 현황</span>
              </div>
              <span className="record-badge">우리 학교 {matches.filter(m=>m.isPlayerTeamMatch).length}경기 편성</span>
            </div>

            <div className="match-cards-grid">
              {matches.filter(m=>m.isPlayerTeamMatch).map(m => (
                <div key={m.id} className="match-card glass-panel">
                  <div className="m-card-header">
                    <span className="m-tour-name">{m.tournamentName}</span>
                    <span className="m-date-tag">{m.date.month}월 {m.date.day}일</span>
                  </div>
                  <div className="m-round-title">{m.round}</div>
                  <div className="m-vs-row">
                    <span className="team-name home">{m.drawn===false?'추첨 대기':m.homeSchoolName}</span>
                    <span className="vs-tag">VS</span>
                    <span className="team-name away">{m.drawn===false?'추첨 대기':m.awaySchoolName}</span>
                  </div>
                  <p className="m-desc">{m.result ? `승리: ${m.result==='home'?m.homeSchoolName:m.awaySchoolName}` : m.description || '정규 공식 경기'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. 개인 시즌 성적 */}
        {activeTab === 'stats' && (
          <div className="player-season-records">
            <h4>개인 경기 기록 · {player.position==='TwoWay'?'투구 / 타격':player.position==='P'?'투구':'타격'}</h4>
            {(player.matchRecords??[]).filter(r=>r.year===(player.gameDate?.year??2026)).length===0?<p>아직 경기 기록이 없습니다. 첫 경기를 치르면 실제 결과가 쌓입니다.</p>:(player.matchRecords??[]).filter(r=>r.year===(player.gameDate?.year??2026)).map(r=><p key={r.matchId} style={{whiteSpace:'pre-line'}}>{r.log}</p>)}

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

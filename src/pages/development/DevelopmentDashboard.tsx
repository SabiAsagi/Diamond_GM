import { MonthlyGoalsPanel } from '../../components/daily/MonthlyGoalsPanel';
import { GradeReportModal } from '../../components/daily/GradeReportModal';
import { TeamCompetitionPanel } from '../../components/daily/TeamCompetitionPanel';
import { TEAM_ROLE_LABELS, getStanding } from '../../data/teamCompetition';
import { RivalReportModal } from '../../components/daily/RivalReportModal';
import { getBondName, getRivalSchool } from '../../data/cast';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { useGameClockStore } from '../../store/gameClockStore';
import { DailyTopBar } from '../../components/daily/DailyTopBar';
import { UpcomingScheduleWidget } from '../../components/daily/UpcomingScheduleWidget';
import { SlotActionPanel } from '../../components/daily/SlotActionPanel';
import { SlotResultModal } from '../../components/daily/SlotResultModal';
import { EventCutsceneModal } from '../../components/daily/EventCutsceneModal';
import { AppNavigation, type MainNavTab } from '../../components/navigation/AppNavigation';

// 통합 네비게이션 뷰
import { RecordsView } from '../../components/navigation/views/RecordsView';
import { InfoView } from '../../components/navigation/views/InfoView';
import { GoalsView } from '../../components/navigation/views/GoalsView';
import { SettingsView } from '../../components/navigation/views/SettingsView';
import { TownView } from '../../components/navigation/views/TownView';

import { TournamentBracket } from '../../components/navigation/views/TournamentBracket';
import { Heart, Star, Trophy } from 'lucide-react';
import '../../index.css';

export default function DevelopmentDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeNavTab, setActiveNavTab] = useState<MainNavTab>('home');
  const [outingOpen, setOutingOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [confirmedDraw, setConfirmedDraw] = useState<string | null>(null);

  const {
    player,
    school,
    clock,
    dailyPlan,
    seasonMatches,
    academicEvents,
    historyLogs,
    isCareerEnded,
    lastActionResult,
    clearLastActionResult,
    dismissRivalReport,
    activeCutscene,
    resolveCutscene,
    initClock,
    selectActivity,
    executeForcedSlot,
    purchaseEquipment,
    equipItem,
    visitOutdoorLocation,
  } = useGameClockStore();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
      setLoadError('');
      const p = await db.players.get(Number(id));
      if (!p) { setLoadError('선수 저장본을 찾지 못했습니다.'); return; }
      if (p) {
        if (!p.interviewCompleted) {
          navigate(`/development/interview/${p.id}`);
          return;
        }
        await initClock(p);
      }
      } catch { setLoadError('저장본을 불러오지 못했습니다. 다시 시도해주세요.'); }
    }
    loadData();
  }, [id, navigate, initClock, loadAttempt]);

  const drawDue=seasonMatches.find(m=>m.isPlayerTeamMatch && m.drawn===false && m.date.month===clock.date.month && m.date.day===clock.date.day);
  // 추첨마다 키가 달라서, 새 추첨이 오면 이전에 확인한 키와 자동으로 불일치한다.
  const drawKey = drawDue ? `${clock.date.year}:${drawDue.tournamentId}` : null;

  if (!player || player.id !== Number(id) || loadError) {
    return (
      <div className="onepage-viewport-container loading-state">
        <div className="wizard-panel glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          {loadError ? <><p role="alert">{loadError}</p><button className="btn btn-primary" onClick={() => setLoadAttempt(n => n + 1)}>다시 불러오기</button><button className="btn btn-secondary" onClick={() => navigate('/')}>시작 화면으로</button></> : <h3>고교 야구 커리어 데이터를 로딩 중입니다...</h3>}
        </div>
      </div>
    );
  }

  const gradeReport = player.gradeReports?.find(r => r.id === player.pendingGradeReportId);
  const showGradeReport = !!gradeReport && !activeCutscene && !lastActionResult;
  const showRivalReport = !gradeReport && !!player.pendingRivalReport && activeNavTab === 'home' && !outingOpen && !drawDue && !activeCutscene && !lastActionResult;
  const currentSlotAssignment = dailyPlan.slots[clock.currentSlot];



  return (
    <div className="onepage-viewport-container">
      {/* 1. 상단바 (고정) */}
      <DailyTopBar
        player={player}
        school={school}
        date={clock.date}
        currentSlot={clock.currentSlot}
      />

      {/* 2. 메인 중앙 콘텐츠 영역 */}
      {drawDue && confirmedDraw !== drawKey && !activeCutscene && !lastActionResult && <div className="cutscene-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="draw-intro-title"><div className="cutscene-modal-card glass-panel"><span className="cutscene-top-tag">📢 대회 개막</span><h2 id="draw-intro-title">{drawDue.tournamentName} 조 추첨일</h2><p>전국 각지의 학교들이 대진 조 추첨을 위해 모였습니다. 우리 학교는 어떤 상대를 만나게 될까요?</p><button autoFocus className="btn btn-primary" onClick={() => setConfirmedDraw(drawKey)}>조 추첨 현장으로 이동</button></div></div>}
      <main className="onepage-main-stage" inert={showGradeReport || showRivalReport || (!!drawDue && confirmedDraw !== drawKey)}>
        {drawDue && confirmedDraw === drawKey && <div className="menu-view-container glass-panel"><h3>대회 개막 · 조 추첨</h3><div className="menu-view-body"><TournamentBracket key={drawKey} matches={seasonMatches.filter(m => m.tournamentId === drawDue.tournamentId)} /></div></div>}
        {activeNavTab === 'home' && teamOpen && !drawDue && <TeamCompetitionPanel player={player} onClose={() => setTeamOpen(false)} />}
        {activeNavTab === 'home' && !teamOpen && !outingOpen && !drawDue && (
          <div className="home-dashboard-layout animate-fade-in">
            {/* 좌측 패널 (데스크톱) 또는 상단 요약 (모바일) */}
            <section className="home-left-rail">
              <button className="btn btn-secondary" onClick={() => setOutingOpen(true)}>외출 · 상점</button>
              <button className="btn btn-secondary team-home-button" onClick={() => setTeamOpen(true)}><span>주전 경쟁 · 감독 면담</span><strong>{TEAM_ROLE_LABELS[player.teamCompetition?.role ?? 'bench']} · 포지션 {getStanding(player).rank}위</strong>{player.teamCompetition?.entries.at(-1) && <small>최근 엔트리: {player.teamCompetition.entries.at(-1)!.included ? '합류' : '제외'} · 명단 확인</small>}</button>
              <MonthlyGoalsPanel compact player={player} date={clock.date} onOpen={() => setActiveNavTab('goals')} />
              {/* 3대 핵심 게이지 요약 바 */}
              <div className="compact-gauges-row glass-panel">
                {/* OVR */}
                <div className="compact-gauge-box">
                  <span className="cg-label">종합 OVR</span>
                  <div className="cg-num-row">
                    <span className="cg-big-num">{player.overall}</span>
                    <span className="cg-sub">/ {player.potential}</span>
                  </div>
                  <div className="cg-track">
                    <div
                      className="cg-fill"
                      style={{ width: `${Math.min(100, (player.overall / player.potential) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 체력 / 컨디션 */}
                <div className="compact-gauge-box">
                  <div className="cg-header-line">
                    <Heart size={13} color="#ef4444" />
                    <span className="cg-label">체력/컨디션</span>
                  </div>
                  <div className="cg-num-row">
                    <span
                      className="cg-big-num"
                      style={{ color: player.condition > 70 ? '#10b981' : player.condition > 35 ? '#fbbf24' : '#ef4444' }}
                    >
                      {player.condition}
                    </span>
                    <span className="cg-sub">/ 100</span>
                  </div>
                  <div className="cg-track">
                    <div
                      className="cg-fill"
                      style={{
                        width: `${player.condition}%`,
                        backgroundColor: player.condition > 70 ? '#10b981' : player.condition > 35 ? '#fbbf24' : '#ef4444',
                      }}
                    ></div>
                  </div>
                </div>

                {/* 스카우트 인지도 */}
                <div className="compact-gauge-box">
                  <div className="cg-header-line">
                    <Star size={13} color="#fbbf24" />
                    <span className="cg-label">스카우트 인지도</span>
                  </div>
                  <div className="cg-num-row">
                    <span className="cg-big-num" style={{ color: '#fbbf24' }}>
                      {player.fame || 10}
                    </span>
                    <span className="cg-sub">pt</span>
                  </div>
                  <div className="cg-track">
                    <div
                      className="cg-fill"
                      style={{
                        width: `${Math.min(100, (player.fame || 10))}%`,
                        backgroundColor: '#fbbf24',
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 다가오는 30일 주요 일정 요약 (컴팩트) */}
              <UpcomingScheduleWidget
                compact
                currentDate={clock.date}
                matches={seasonMatches}
                academicEvents={academicEvents}
              />
            </section>

            {/* 우측 패널: 오늘 슬롯 행동 선택 패널 */}
            <section className="home-center-stage">
              <SlotActionPanel
                currentSlot={clock.currentSlot}
                date={clock.date}
                assignment={currentSlotAssignment}
                player={player}
                onExecuteForced={executeForcedSlot}
                onSelectActivity={selectActivity}
              />
            </section>
          </div>
        )}

        {/* 통합 네비게이션 뷰 렌더링 */}
        {activeNavTab === 'records' && !drawDue && (
          <RecordsView
            player={player}
            matches={seasonMatches}
            historyLogs={historyLogs}
            onClose={() => setActiveNavTab('home')}
          />
        )}

        {activeNavTab === 'info' && !drawDue && (
          <InfoView player={player} onClose={() => setActiveNavTab('home')} />
        )}

        {activeNavTab === 'goals' && !drawDue && <GoalsView player={player} onClose={() => setActiveNavTab('home')} />}

        {activeNavTab === 'home' && outingOpen && !drawDue && (
          <div className="people-unified-wrapper"><button className="btn btn-secondary" onClick={() => setOutingOpen(false)}>홈으로 돌아가기</button>
          <TownView
            player={player}
            onPurchase={purchaseEquipment}
            onEquip={equipItem}
            onVisit={visitOutdoorLocation}
          /></div>
        )}

        {activeNavTab === 'settings' && !drawDue && (
          <SettingsView player={player} onClose={() => setActiveNavTab('home')} />
        )}
      </main>

      {/* 3. 앱 메인 네비게이션 (데스크톱 사이드 / 모바일 하단 탭바) */}
      <div inert={showGradeReport || !!drawDue || showRivalReport}><AppNavigation activeTab={activeNavTab} onTabChange={tab => { setActiveNavTab(tab); setOutingOpen(false); setTeamOpen(false); }} /></div>

      {/* 4. 활동 완료 즉시 스탯 변화 팝업 모달 */}
      {lastActionResult && (
        <SlotResultModal result={lastActionResult} onClose={clearLastActionResult} />
      )}

      {/* 5. 확률적 이벤트 컷신 모달 */}
      {activeCutscene && !lastActionResult && (
        <EventCutsceneModal key={activeCutscene.id} cutscene={activeCutscene} player={player} onChoose={resolveCutscene} />
      )}

      {showGradeReport && gradeReport && <GradeReportModal report={gradeReport} player={player} />}
      {showRivalReport && player.pendingRivalReport && <RivalReportModal report={player.pendingRivalReport} rivalName={getBondName(player, 'rival')} rivalSchool={getRivalSchool(player)} onClose={() => { void dismissRivalReport(); }} />}

      {/* 6. 졸업 축하 배너 */}
      {isCareerEnded && (
        <div className="career-end-toast glass-panel animate-scale-up">
          <div className="cet-left">
            <Trophy size={28} color="#fbbf24" />
            <div>
              <strong>🎉 고교 야구 생활을 마쳤습니다!</strong>
              <p>{player.name} 선수는 3년간의 모든 고교 일정과 대회를 완주하였습니다.</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveNavTab('records')}>
            기록 돌아보기
          </button>
        </div>
      )}
    </div>
  );
}


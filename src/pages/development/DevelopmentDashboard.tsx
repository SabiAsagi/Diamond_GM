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

// 5대 서브 메뉴 뷰
import { MatchesView } from '../../components/navigation/views/MatchesView';
import { RelationshipsView } from '../../components/navigation/views/RelationshipsView';
import { PlayerStatsView } from '../../components/navigation/views/PlayerStatsView';
import { TrophiesView } from '../../components/navigation/views/TrophiesView';
import { SettingsView } from '../../components/navigation/views/SettingsView';

import { Heart, Star, Sparkles, Trophy } from 'lucide-react';
import '../../index.css';

export default function DevelopmentDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeNavTab, setActiveNavTab] = useState<MainNavTab>('home');

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
    activeCutscene,
    clearActiveCutscene,
    initClock,
    selectActivity,
    executeForcedSlot,
  } = useGameClockStore();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const p = await db.players.get(Number(id));
      if (p) {
        if (!p.interviewCompleted) {
          navigate(`/development/interview/${p.id}`);
          return;
        }
        await initClock(p);
      }
    }
    loadData();
  }, [id, navigate, initClock]);

  if (!player) {
    return (
      <div className="onepage-viewport-container loading-state">
        <div className="wizard-panel glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>고교 야구 3개년 커리어 데이터를 로딩 중입니다...</h3>
        </div>
      </div>
    );
  }

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
      <main className="onepage-main-stage">
        {activeNavTab === 'home' && (
          <div className="home-dashboard-layout animate-fade-in">
            {/* 좌측 패널 (데스크톱) 또는 상단 요약 (모바일) */}
            <section className="home-left-rail">
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

              {/* 보유 특성 칩 바 */}
              {player.traits && player.traits.length > 0 && (
                <div className="home-traits-strip glass-panel">
                  {player.traits.map(t => (
                    <span key={t} className="home-trait-tag">
                      <Sparkles size={11} /> #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* 다가오는 30일 주요 일정 요약 (컴팩트) */}
              <UpcomingScheduleWidget
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

        {/* 5대 서브 메뉴 뷰 렌더링 */}
        {activeNavTab === 'matches' && (
          <MatchesView
            player={player}
            matches={seasonMatches}
            historyLogs={historyLogs}
            onClose={() => setActiveNavTab('home')}
          />
        )}

        {activeNavTab === 'relationships' && (
          <RelationshipsView player={player} onClose={() => setActiveNavTab('home')} />
        )}

        {activeNavTab === 'stats' && (
          <PlayerStatsView player={player} onClose={() => setActiveNavTab('home')} />
        )}

        {activeNavTab === 'trophies' && (
          <TrophiesView player={player} onClose={() => setActiveNavTab('home')} />
        )}

        {activeNavTab === 'settings' && (
          <SettingsView player={player} onClose={() => setActiveNavTab('home')} />
        )}
      </main>

      {/* 3. 앱 메인 네비게이션 (데스크톱 사이드 / 모바일 하단 탭바) */}
      <AppNavigation activeTab={activeNavTab} onTabChange={setActiveNavTab} />

      {/* 4. 활동 완료 즉시 스탯 변화 팝업 모달 */}
      {lastActionResult && (
        <SlotResultModal result={lastActionResult} onClose={clearLastActionResult} />
      )}

      {/* 5. 확률적 이벤트 컷신 모달 */}
      {activeCutscene && (
        <EventCutsceneModal cutscene={activeCutscene} onConfirm={clearActiveCutscene} />
      )}

      {/* 6. 졸업 축하 배너 */}
      {isCareerEnded && (
        <div className="career-end-toast glass-panel animate-scale-up">
          <div className="cet-left">
            <Trophy size={28} color="#fbbf24" />
            <div>
              <strong>🎉 3개년 고교 야구 완주 & KBO 드래프트 참가!</strong>
              <p>{player.name} 선수는 3년간의 모든 고교 일정과 대회를 완주하였습니다.</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveNavTab('trophies')}>
            트로피/업적 확인
          </button>
        </div>
      )}
    </div>
  );
}

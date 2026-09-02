import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import type { Player } from '../../types';
import { getHighSchoolDataByName } from '../../data/highSchools';
import { SchoolEmblem } from '../../components/SchoolEmblem';
import { 
  Calendar, Flame, Zap, Heart, 
  ArrowRight, Star, Activity, Sparkles, BookOpen
} from 'lucide-react';
import '../../index.css';

interface TrainingOption {
  id: string;
  name: string;
  desc: string;
  targetStats: string;
  icon: string;
  staminaCost: number;
}

const PITCHER_TRAININGS: TrainingOption[] = [
  { id: 'bullpen', name: '불펜 실전 피칭', desc: '포수와 호흡을 맞추며 전력 투구', targetStats: '구위 +1, 제구 +1', icon: '🔥', staminaCost: 15 },
  { id: 'breaking', name: '변화구 집중 연마', desc: '주무기 브레이킹 볼 각도 개선', targetStats: '제구 +2, 구위 +1', icon: '🌀', staminaCost: 12 },
  { id: 'weight_p', name: '하체 & 웨이트 트레이닝', desc: '폭발적인 릴리스 파워 강화', targetStats: '구위 +2, 체력 +1', icon: '🏋️', staminaCost: 20 },
  { id: 'stamina_run', name: '인터벌 러닝 & 체력', desc: '9회까지 지치지 않는 심폐 지구력', targetStats: '체력 +3, 컨디션 +2', icon: '🏃', staminaCost: 15 },
  { id: 'mental_rest', name: '컨디셔닝 & 마사지', desc: '피로 누적 해소 및 멘탈 회복', targetStats: '컨디션 +25, 체력 회복', icon: '🌿', staminaCost: -10 }
];

const BATTER_TRAININGS: TrainingOption[] = [
  { id: 'live_batting', name: '라이브 배팅 훈련', desc: '실전 투수 볼을 보며 타이밍 배팅', targetStats: '컨택 +1, 선구안 +1', icon: '⚔️', staminaCost: 15 },
  { id: 'power_swing', name: '파워 풀스윙 & 웨이트', desc: '비거리와 타구 속도 집중 강화', targetStats: '파워 +2, 컨택 +1', icon: '💣', staminaCost: 20 },
  { id: 'defense_fungo', name: '수비 펑고 & 송구', desc: '불규칙 바운드 포구 및 어깨 강화', targetStats: '수비 +2, 주력 +1', icon: '🧤', staminaCost: 15 },
  { id: 'sprint_base', name: '베이스 러닝 & 대시', desc: '스타트 타이밍 및 순발력 극대화', targetStats: '주력 +3, 선구안 +1', icon: '⚡', staminaCost: 18 },
  { id: 'mental_rest', name: '컨디셔닝 & 휴식', desc: '타격 밸런스 점검 및 피로 회복', targetStats: '컨디션 +25, 체력 회복', icon: '🌿', staminaCost: -10 }
];

export default function DevelopmentDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<string>('bullpen');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState<{ title: string; desc: string; icon: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const p = await db.players.get(Number(id));
      if (p) {
        // 면담을 안 거쳤다면 면담으로 강제 안내
        if (!p.interviewCompleted) {
          navigate(`/development/interview/${p.id}`);
          return;
        }
        setPlayer(p);
        setSelectedTraining(p.position === 'P' ? 'bullpen' : 'live_batting');
        setLogs([`고교 ${p.grade || 1}학년 ${p.month || 3}월 ${p.week || 1}주차: ${p.highSchool} 야구부 공식 훈련이 시작되었습니다!`]);
      }
    }
    loadData();
  }, [id, navigate]);

  if (!player) {
    return (
      <div className="creation-container">
        <div className="wizard-panel glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>플레이어 데이터를 로딩 중입니다...</h3>
        </div>
      </div>
    );
  }

  const schoolData = getHighSchoolDataByName(player.highSchool);
  const grade = player.grade || 1;
  const month = player.month || 3;
  const week = player.week || 1;
  const isPitcher = player.position === 'P';

  const trainings = isPitcher ? PITCHER_TRAININGS : BATTER_TRAININGS;

  // 1주 진행 (Next Turn Engine)
  const handleAdvanceWeek = async () => {
    if (!player.id) return;

    let nextWeek = week + 1;
    let nextMonth = month;
    let nextGrade = grade;

    if (nextWeek > 4) {
      nextWeek = 1;
      nextMonth += 1;
      if (nextMonth > 12) {
        nextMonth = 1;
      }
      // 3월에 학년 진급
      if (nextMonth === 3) {
        nextGrade += 1;
      }
    }

    // 졸업 조건 체크 (3학년 10월 KBO 신인 드래프트 완료)
    if (nextGrade > 3 || (nextGrade === 3 && nextMonth > 10)) {
      alert("🎉 축하합니다! 3개년 고교 야구 생활을 모두 완주하고 KBO 신인 드래프트에 참가합니다!");
      return;
    }

    // 훈련 효과 적용
    const train = trainings.find(t => t.id === selectedTraining) || trainings[0];
    let newStuff = player.stuff;
    let newControl = player.control;
    let newStamina = player.stamina;
    let newContact = player.contact;
    let newPower = player.power;
    let newEye = player.eye;
    let newSpeed = player.speed;
    let newDefense = player.defense;
    let newCondition = Math.max(10, Math.min(100, player.condition - train.staminaCost));

    let logMsg = `[${grade}학년 ${month}월 ${week}주차] ${train.name} 훈련 완료! `;

    if (train.id === 'bullpen') {
      newStuff += 1; newControl += 1;
      logMsg += `(구위 +1, 제구 +1)`;
    } else if (train.id === 'breaking') {
      newControl += 2; newStuff += 1;
      logMsg += `(제구 +2, 구위 +1)`;
    } else if (train.id === 'weight_p') {
      newStuff += 2; newStamina += 1;
      logMsg += `(구위 +2, 체력 +1)`;
    } else if (train.id === 'stamina_run') {
      newStamina += 3;
      logMsg += `(스태미너 +3)`;
    } else if (train.id === 'live_batting') {
      newContact += 1; newEye += 1;
      logMsg += `(컨택 +1, 선구안 +1)`;
    } else if (train.id === 'power_swing') {
      newPower += 2; newContact += 1;
      logMsg += `(파워 +2, 컨택 +1)`;
    } else if (train.id === 'defense_fungo') {
      newDefense += 2; newSpeed += 1;
      logMsg += `(수비 +2, 주력 +1)`;
    } else if (train.id === 'sprint_base') {
      newSpeed += 3; newEye += 1;
      logMsg += `(주력 +3, 선구안 +1)`;
    } else if (train.id === 'mental_rest') {
      newCondition = Math.min(100, player.condition + 30);
      logMsg += `(컨디션 +30 대폭 회복)`;
    }

    // 주차별 랜덤 이벤트 발생
    const randomSeed = Math.random();
    let eventObj: { title: string; desc: string; icon: string } | null = null;

    if (month === 5 && week === 2) {
      eventObj = { title: '🏆 [전국대회] 황금사자기 전국고교야구대회 개막!', desc: '목동 야구장에서 메이저 전국대회 1회전이 열립니다. 스카우트들의 이목이 집중됩니다.', icon: '🦁' };
      newStuff += 1; newPower += 1;
    } else if (month === 7 && week === 1) {
      eventObj = { title: '🏆 [전국대회] 청룡기 전국고교야구선수권 개막!', desc: '전통의 청룡기 대회가 시작되었습니다! 팀의 주축으로 마운드/타석에 오릅니다.', icon: '🐉' };
    } else if (randomSeed > 0.75) {
      eventObj = { title: '👀 프로 스카우트의 밀착 관찰', desc: 'KBO 구단 스카우트들이 연습 경기장에 방문하여 자네의 투구/타격을 리포트에 기록했습니다. (인지도 +5)', icon: '📋' };
    } else if (randomSeed < 0.2) {
      eventObj = { title: '✨ 감독님의 원포인트 특별 레슨', desc: '감독님이 방과 후 남아 1:1로 메커니즘을 교정해주셨습니다. 밸런스가 크게 좋아집니다.', icon: '👨‍🏫' };
      newControl += 1; newContact += 1;
    }

    setCurrentEvent(eventObj);

    // OVR 계산
    let newOvr = player.overall;
    if (isPitcher) {
      newOvr = Math.round((newStuff + newControl + newStamina) / 3);
    } else {
      newOvr = Math.round((newContact + newPower + newEye + newSpeed + newDefense) / 5);
    }

    const updated: Player = {
      ...player,
      grade: nextGrade,
      month: nextMonth,
      week: nextWeek,
      stuff: newStuff,
      control: newControl,
      stamina: newStamina,
      contact: newContact,
      power: newPower,
      eye: newEye,
      speed: newSpeed,
      defense: newDefense,
      condition: newCondition,
      overall: newOvr,
      fame: (player.fame || 10) + 1
    };

    await db.players.put(updated);
    setPlayer(updated);
    setLogs(prev => [logMsg, ...(eventObj ? [`[이벤트] ${eventObj.title}: ${eventObj.desc}`] : []), ...prev.slice(0, 15)]);
  };

  return (
    <div className="creation-container animate-fade-in" style={{ padding: '20px 10px' }}>
      <div className="wizard-panel glass-panel dashboard-main-panel" style={{ maxWidth: '1000px', width: '100%' }}>
        
        {/* 상단 스테이터스 헤더 */}
        <div className="career-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {schoolData && <SchoolEmblem school={schoolData} size="md" />}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{player.name}</h2>
                <span className="player-num-tag">#{player.uniformNumber}</span>
                <span className="player-pos-badge">{player.position}</span>
                <span className="school-tag">{player.highSchool}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {player.handedness} • {isPitcher ? player.pitchingForm : player.battingForm} • 목표: <strong>{player.chosenPathTitle || '특화 육성'}</strong>
              </div>
            </div>
          </div>

          {/* 3개년 캘린더 날짜 표시 배지 */}
          <div className="career-calendar-badge">
            <div className="calendar-top">
              <Calendar size={16} color="#60a5fa" />
              <span>고교 야구 3개년 커리어</span>
            </div>
            <div className="calendar-current-date">
              <strong>{grade}학년 {month}월 {week}주차</strong>
            </div>
          </div>
        </div>

        {/* 3대 핵심 게이지 & 오버롤 바 */}
        <div className="career-overview-grid">
          {/* 종합 오버롤 */}
          <div className="overview-card glass-panel">
            <div className="card-top-label">종합 능력치</div>
            <div className="ovr-large-display">
              <span className="ovr-num">{player.overall}</span>
              <span className="ovr-sub">OVR (잠재력 {player.potential})</span>
            </div>
            <div className="potential-bar-track">
              <div className="potential-fill" style={{ width: `${(player.overall / player.potential) * 100}%` }}></div>
            </div>
          </div>

          {/* 컨디션 & 멘탈 */}
          <div className="overview-card glass-panel">
            <div className="card-top-label">
              <Heart size={16} color="#ef4444" /> 컨디션 및 체력
            </div>
            <div className="condition-display">
              <span className={`condition-tag ${player.condition > 70 ? 'good' : player.condition > 40 ? 'normal' : 'bad'}`}>
                {player.condition > 80 ? '최상 😃' : player.condition > 60 ? '양호 🙂' : player.condition > 35 ? '피로 😓' : '경고 ⚠️'}
              </span>
              <span className="condition-val">{player.condition} / 100</span>
            </div>
            <div className="condition-bar-track">
              <div className="condition-fill" style={{ width: `${player.condition}%` }}></div>
            </div>
          </div>

          {/* 스카우트 주목도 */}
          <div className="overview-card glass-panel">
            <div className="card-top-label">
              <Star size={16} color="#fbbf24" /> 전국 인지도 & 스카우트 평점
            </div>
            <div className="fame-display">
              <span className="fame-grade">
                {(player.fame || 10) > 60 ? '1라운드 유력' : (player.fame || 10) > 30 ? '상위 지명 후보' : '프로 관심 유망주'}
              </span>
              <span className="fame-val">{player.fame || 10} pt</span>
            </div>
            <div className="fame-traits-row">
              {player.traits?.map(t => (
                <span key={t} className="trait-chip-sm"><Sparkles size={10} /> #{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 능력치 세부 현황 & 훈련 선택 2열 레이아웃 */}
        <div className="career-middle-layout">
          {/* 좌측: 선수 세부 스탯 현황 */}
          <div className="stats-dashboard-card glass-panel">
            <div className="section-header-title">
              <Activity size={18} color="var(--primary)" /> 선수 능력치 현황
            </div>

            {isPitcher ? (
              <div className="stats-bars-container">
                <div className="stat-row">
                  <span className="stat-name">구위 (Stuff)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.stuff}%` }}></div></div>
                  <span className="stat-value">{player.stuff}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">제구 (Control)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.control}%` }}></div></div>
                  <span className="stat-value">{player.control}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">스태미너 (Stamina)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.stamina}%` }}></div></div>
                  <span className="stat-value">{player.stamina}</span>
                </div>
              </div>
            ) : (
              <div className="stats-bars-container">
                <div className="stat-row">
                  <span className="stat-name">컨택트 (Contact)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.contact}%` }}></div></div>
                  <span className="stat-value">{player.contact}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">파워 (Power)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.power}%` }}></div></div>
                  <span className="stat-value">{player.power}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">선구안 (Eye)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.eye}%` }}></div></div>
                  <span className="stat-value">{player.eye}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">주력 (Speed)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.speed}%` }}></div></div>
                  <span className="stat-value">{player.speed}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">수비력 (Defense)</span>
                  <div className="stat-track"><div className="stat-fill" style={{ width: `${player.defense}%` }}></div></div>
                  <span className="stat-value">{player.defense}</span>
                </div>
              </div>
            )}
          </div>

          {/* 우측: 주간 훈련 메뉴 선택 */}
          <div className="training-selection-card glass-panel">
            <div className="section-header-title">
              <Flame size={18} color="#f59e0b" /> 이번 주 훈련 플랜 선택
            </div>

            <div className="training-options-list">
              {trainings.map(t => {
                const isSelected = selectedTraining === t.id;
                return (
                  <button 
                    key={t.id} 
                    className={`training-option-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTraining(t.id)}
                  >
                    <div className="t-left">
                      <span className="t-icon">{t.icon}</span>
                      <div>
                        <strong className="t-name">{t.name}</strong>
                        <div className="t-desc">{t.desc}</div>
                      </div>
                    </div>
                    <div className="t-right">
                      <span className="t-stats">{t.targetStats}</span>
                      <span className="t-cost">체력 {t.staminaCost > 0 ? `-${t.staminaCost}` : `+${Math.abs(t.staminaCost)}`}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 일정 진행 버튼 */}
            <button className="btn btn-primary advance-turn-btn" onClick={handleAdvanceWeek}>
              <Zap size={18} /> 이번 주 훈련 진행하기 (다음 주로 진행) <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* 발생 이벤트 알림 팝업 배너 */}
        {currentEvent && (
          <div className="current-event-banner glass-panel animate-fade-in">
            <div className="event-icon-circle">{currentEvent.icon}</div>
            <div className="event-text-group">
              <strong className="event-title">{currentEvent.title}</strong>
              <p className="event-desc">{currentEvent.desc}</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setCurrentEvent(null)}>확인</button>
          </div>
        )}

        {/* 하단 훈련 & 커리어 진행 로그 */}
        <div className="career-logs-card glass-panel">
          <div className="logs-header">
            <BookOpen size={16} /> 육성 일지 및 최근 기록
          </div>
          <div className="logs-scroll-box">
            {logs.map((log, idx) => (
              <div key={idx} className="log-line">
                <span className="log-bullet">•</span> {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

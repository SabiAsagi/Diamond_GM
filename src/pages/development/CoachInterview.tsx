import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import type { Player } from '../../types';
import { getHighSchoolDataByName } from '../../data/highSchools';
import { 
  PITCHER_INTERVIEW_CHOICES, 
  BATTER_INTERVIEW_CHOICES, 
  TWOWAY_INTERVIEW_CHOICES, 
  type InterviewChoice 
} from '../../data/interviewChoices';
import { SchoolEmblem } from '../../components/SchoolEmblem';
import { Sparkles, CheckCircle, ChevronRight, UserCheck, Award, MessageSquare } from 'lucide-react';
import '../../index.css';

export default function CoachInterview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [dialogueStep, setDialogueStep] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<InterviewChoice | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function loadPlayer() {
      if (!id) return;
      const p = await db.players.get(Number(id));
      if (p) {
        setPlayer(p);
      }
    }
    loadPlayer();
  }, [id]);

  if (!player) {
    return (
      <div className="creation-container">
        <div className="wizard-panel glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>선수 데이터를 불러오는 중입니다...</h3>
        </div>
      </div>
    );
  }

  const schoolData = getHighSchoolDataByName(player.highSchool);

  // 역할에 따른 선택지 목록
  const choices: InterviewChoice[] = 
    player.position === 'TwoWay' 
      ? TWOWAY_INTERVIEW_CHOICES 
      : player.position === 'P' 
        ? PITCHER_INTERVIEW_CHOICES 
        : BATTER_INTERVIEW_CHOICES;

  const handleSelectChoice = (choice: InterviewChoice) => {
    setSelectedChoice(choice);
  };

  const handleConfirmChoice = async () => {
    if (!selectedChoice || !player.id) return;
    setIsApplying(true);

    const boosts = selectedChoice.statBoosts;
    const currentTraits = player.traits || [];

    const updatedPlayer: Player = {
      ...player,
      stuff: player.stuff + (boosts.stuff || 0),
      control: player.control + (boosts.control || 0),
      stamina: player.stamina + (boosts.stamina || 0),
      contact: player.contact + (boosts.contact || 0),
      power: player.power + (boosts.power || 0),
      eye: player.eye + (boosts.eye || 0),
      speed: player.speed + (boosts.speed || 0),
      defense: player.defense + (boosts.defense || 0),
      condition: Math.min(100, player.condition + (boosts.condition || 0)),
      traits: [...currentTraits, selectedChoice.gainedTrait],
      interviewCompleted: true,
      chosenPathTitle: selectedChoice.title,
      grade: 1, // 고교 1학년
      month: 3, // 3월 입학
      week: 1, // 1주차 시작
      fame: 10 // 초기 인지도
    };

    // Overall 재계산
    if (player.position === 'P') {
      updatedPlayer.overall = Math.round((updatedPlayer.stuff + updatedPlayer.control + updatedPlayer.stamina) / 3);
    } else if (player.position === 'TwoWay') {
      const pAvg = (updatedPlayer.stuff + updatedPlayer.control + updatedPlayer.stamina) / 3;
      const bAvg = (updatedPlayer.contact + updatedPlayer.power + updatedPlayer.eye + updatedPlayer.speed + updatedPlayer.defense) / 5;
      updatedPlayer.overall = Math.round((pAvg + bAvg) / 2);
    } else {
      updatedPlayer.overall = Math.round(
        (updatedPlayer.contact + updatedPlayer.power + updatedPlayer.eye + updatedPlayer.speed + updatedPlayer.defense) / 5
      );
    }

    await db.players.put(updatedPlayer);
    setPlayer(updatedPlayer);
    setIsApplying(false);
    setConfirmed(true);
  };

  const handleEnterDashboard = () => {
    navigate(`/development/dashboard/${player.id}`);
  };

  return (
    <div className="creation-container animate-fade-in">
      <div className="wizard-panel glass-panel interview-scene-panel" style={{ maxWidth: '900px', width: '100%' }}>
        {/* 상단 씬 헤더 */}
        <div className="interview-scene-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {schoolData && <SchoolEmblem school={schoolData} size="md" />}
            <div>
              <span className="interview-location-tag">{player.highSchool} 야구부 감독실</span>
              <h2 className="interview-title">신입 부원 1:1 진로 & 육성 면담</h2>
            </div>
          </div>
          <div className="interview-date-badge">
            📅 고교 1학년 3월 1주차
          </div>
        </div>

        {/* 감독 대화창 씬 */}
        <div className="interview-dialogue-box">
          <div className="coach-avatar-section">
            <div className="coach-avatar-circle">
              <UserCheck size={32} color="#60a5fa" />
            </div>
            <div className="coach-name-label">
              <strong>{schoolData?.name || player.highSchool} 감독</strong>
              <span>Head Coach</span>
            </div>
          </div>

          <div className="coach-speech-bubble">
            {!confirmed ? (
              dialogueStep === 0 ? (
                <div className="speech-content">
                  <p className="speech-text">
                    "어서 오게, <strong>{player.name}</strong> 군. 우리 {player.highSchool} 야구부에 입학한 것을 진심으로 환영하네!
                    중학교 때부터 자네의 뛰어난 잠재력을 눈여겨보고 있었지."
                  </p>
                  <p className="speech-subtext">
                    "우리 학교는 자네 같은 유망주가 전국 최고의 선수로 도약할 수 있도록 모든 지원을 아끼지 않을 걸세."
                  </p>
                  <button className="btn btn-primary btn-sm next-speech-btn" onClick={() => setDialogueStep(1)}>
                    다음 대화 <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="speech-content">
                  <p className="speech-text">
                    "본격적인 훈련 스케줄을 짜기 전에 먼저 묻고 싶군. 
                    자네는 앞으로 우리 팀에서 <strong>어떤 유형의 {player.position === 'P' ? '투수' : player.position === 'TwoWay' ? '선수' : '타자'}</strong>로 성장하고 싶은가?
                    자네가 품고 있는 포부와 목표를 솔직하게 들려주게."
                  </p>
                  <p className="speech-hint">
                    💡 선택한 목표에 따라 <strong>선수의 핵심 능력치가 크게 특화</strong>되고 고유 특성이 부여됩니다.
                  </p>
                </div>
              )
            ) : (
              <div className="speech-content">
                <p className="speech-text highlight">
                  "<strong>'{selectedChoice?.title}'</strong>(이)라! 아주 눈빛이 살아있어. 마음에 드는 각오일세!"
                </p>
                <p className="speech-subtext">
                  {selectedChoice?.response}
                </p>
                <p className="speech-coach-plan">
                  📋 <strong>[감독의 특화 육성 플랜 수립]:</strong> {selectedChoice?.coachReply}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 면담 선택지 영역 */}
        {dialogueStep >= 1 && !confirmed && (
          <div className="interview-choices-container animate-fade-in">
            <h4 className="choices-section-heading">
              <MessageSquare size={18} /> 희망하는 성장 방향을 선택하세요
            </h4>

            <div className="interview-choices-grid">
              {choices.map(choice => {
                const isSelected = selectedChoice?.id === choice.id;
                return (
                  <div 
                    key={choice.id}
                    className={`interview-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectChoice(choice)}
                  >
                    <div className="choice-card-top">
                      <span className="choice-icon">{choice.icon}</span>
                      <strong className="choice-title">{choice.title}</strong>
                      {isSelected && <CheckCircle size={18} color="#60a5fa" className="check-icon" />}
                    </div>

                    <p className="choice-dialogue">{choice.dialogue}</p>

                    {/* 능력치 보너스 뱃지 */}
                    <div className="stat-boost-badges">
                      {Object.entries(choice.statBoosts).map(([statKey, boost]) => (
                        <span key={statKey} className="boost-badge">
                          +{boost} {
                            statKey === 'stuff' ? '구위' :
                            statKey === 'control' ? '제구' :
                            statKey === 'stamina' ? '체력' :
                            statKey === 'contact' ? '컨택' :
                            statKey === 'power' ? '파워' :
                            statKey === 'eye' ? '선구안' :
                            statKey === 'speed' ? '주력' :
                            statKey === 'defense' ? '수비' : '컨디션'
                          }
                        </span>
                      ))}
                    </div>

                    {/* 획득 특성 */}
                    <div className="gained-trait-box">
                      <span className="trait-tag"><Sparkles size={12} /> #{choice.gainedTrait}</span>
                      <span className="trait-desc">{choice.traitDescription}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 선택 확정 버튼 */}
            {selectedChoice && (
              <div className="confirm-action-bar animate-fade-in">
                <button 
                  className="btn btn-primary confirm-choice-btn"
                  onClick={handleConfirmChoice}
                  disabled={isApplying}
                >
                  <Award size={18} /> '{selectedChoice.title}' 각오 전달하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 확정 완료 후 결과 요약 & 대시보드 진입 */}
        {confirmed && selectedChoice && (
          <div className="interview-result-container animate-fade-in">
            <div className="boost-result-banner glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={22} color="#fbbf24" />
                <h3 style={{ margin: 0, color: '#fef08a' }}>특화 능력치 및 고유 특성 획득 완료!</h3>
              </div>
              
              <div className="boost-summary-grid">
                <div className="boost-item">
                  <span className="item-label">선택한 각오</span>
                  <strong className="item-val">{selectedChoice.title}</strong>
                </div>
                <div className="boost-item">
                  <span className="item-label">획득 고유 특성</span>
                  <strong className="item-val trait">✨ #{selectedChoice.gainedTrait}</strong>
                </div>
                <div className="boost-item">
                  <span className="item-label">종합 오버롤 (OVR)</span>
                  <strong className="item-val ovr">{player.overall} OVR</strong>
                </div>
              </div>
            </div>

            <button className="btn btn-primary start-career-btn" onClick={handleEnterDashboard}>
              본격적인 3개년 고교 야구 라이프 시작하기 <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

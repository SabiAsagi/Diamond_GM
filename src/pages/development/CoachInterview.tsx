import { normalizePlayer, overallRating } from '../../data/playerDevelopment';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import type { Player } from '../../types';
import { getHighSchoolDataByName } from '../../data/highSchools';
import {
  INTERVIEW_QUESTIONS,
  type InterviewChoiceOption,
} from '../../data/interviewChoices';
import { SchoolEmblem } from '../../components/SchoolEmblem';
import {
  Sparkles,
  CheckCircle,
  ChevronRight,
  UserCheck,
  Award,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import '../../index.css';

export default function CoachInterview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedInCurrentQ, setSelectedInCurrentQ] = useState<InterviewChoiceOption | null>(null);
  const [confirmedAnswers, setConfirmedAnswers] = useState<InterviewChoiceOption[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

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
  const currentQuestion = INTERVIEW_QUESTIONS[currentQIndex];
  const totalQuestions = INTERVIEW_QUESTIONS.length;

  const handleSelectOption = (option: InterviewChoiceOption) => {
    setSelectedInCurrentQ(option);
  };

  const handleNextQuestion = () => {
    if (!selectedInCurrentQ) return;
    const newAnswers = [...confirmedAnswers, selectedInCurrentQ];
    setConfirmedAnswers(newAnswers);

    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedInCurrentQ(null);
    } else {
      // 3개 질문 모두 완료 -> 최종 저장
      handleFinishInterview(newAnswers);
    }
  };

  const handleFinishInterview = async (allAnswers: InterviewChoiceOption[]) => {
    if (!player.id) return;
    setIsApplying(true);

    let newStuff = player.stuff;
    let newControl = player.control;
    let newStamina = player.stamina;
    let newContact = player.contact;
    let newPower = player.power;
    let newEye = player.eye;
    let newSpeed = player.speed;
    let newDefense = player.defense;
    let newCondition = player.condition;
    let newAcademics = player.academics || 50;
    let newFame = player.fame || 10;
    let newRelCoach = player.relationshipCoach || 50;
    let newRelTeam = player.relationshipTeam || 50;
    let newRelFriends = player.relationshipFriends || 50;
    let newRelFamily = player.relationshipFamily || 50;

    const newTraits = [...(player.traits || [])];

    for (const ans of allAnswers) {
      const b = ans.statBoosts;
      if (b.stuff) newStuff += b.stuff;
      if (b.control) newControl += b.control;
      if (b.stamina) newStamina += b.stamina;
      if (b.contact) newContact += b.contact;
      if (b.power) newPower += b.power;
      if (b.eye) newEye += b.eye;
      if (b.speed) newSpeed += b.speed;
      if (b.defense) newDefense += b.defense;
      if (b.condition) newCondition = Math.min(100, newCondition + b.condition);
      if (b.academics) newAcademics = Math.min(100, newAcademics + b.academics);
      if (b.fame) newFame += b.fame;
      if (b.relationshipCoach) newRelCoach += b.relationshipCoach;
      if (b.relationshipTeam) newRelTeam += b.relationshipTeam;
      if (b.relationshipFriends) newRelFriends += b.relationshipFriends;
      if (b.relationshipFamily) newRelFamily += b.relationshipFamily;

      if (!newTraits.includes(ans.gainedTrait)) {
        newTraits.push(ans.gainedTrait);
      }
    }

    const pathTitle = allAnswers.find(a=>a.id.startsWith('q1_'))?.title || '';
    const siblings = allAnswers.find(a=>a.id.startsWith('sibling_'))?.id.replace('sibling_','') as Player['siblings'];

    const updatedPlayer: Player = {
      ...player,
      stuff: newStuff,
      control: newControl,
      stamina: newStamina,
      contact: newContact,
      power: newPower,
      eye: newEye,
      speed: newSpeed,
      defense: newDefense,
      condition: newCondition,
      academics: newAcademics,
      fame: newFame,
      relationshipCoach: newRelCoach,
      relationshipTeam: newRelTeam,
      relationshipFriends: newRelFriends,
      relationshipFamily: newRelFamily,
      traits: newTraits,
      interviewCompleted: true,
      chosenPathTitle: pathTitle,
      familyBackground: allAnswers.some(a=>a.id==='q4_grandma') ? 'grandmother' : 'parents',
      siblings,
      grade: 1,
      month: 3,
      day: 2,
      week: 1,
      gameDate: {
        year: 2026,
        month: 3,
        day: 2,
        weekday: 1,
        grade: 1,
      },
      currentSlot: 'morning',
    };

    // Overall 계산
    if (player.position === 'P') {
      updatedPlayer.overall = Math.round((newStuff + newControl + newStamina) / 3);
    } else if (player.position === 'TwoWay') {
      const pAvg = (newStuff + newControl + newStamina) / 3;
      const bAvg = (newContact + newPower + newEye + newSpeed + newDefense) / 5;
      updatedPlayer.overall = Math.round((pAvg + bAvg) / 2);
    } else {
      updatedPlayer.overall = Math.round((newContact + newPower + newEye + newSpeed + newDefense) / 5);
    }

    Object.assign(updatedPlayer,normalizePlayer(updatedPlayer));
    updatedPlayer.overall=overallRating(updatedPlayer);
    await db.players.put(updatedPlayer);
    setPlayer(updatedPlayer);
    setIsApplying(false);
    setIsCompleted(true);
  };

  const handleEnterDashboard = () => {
    navigate(`/development/dashboard/${player.id}`);
  };

  return (
    <div className="creation-container animate-fade-in">
      <div className="wizard-panel glass-panel interview-scene-panel" style={{ maxWidth: '920px', width: '100%' }}>
        {/* 상단 씬 헤더 */}
        <div className="interview-scene-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {schoolData && <SchoolEmblem school={schoolData} size="md" />}
            <div>
              <span className="interview-location-tag">{player.highSchool} 야구부 감독실</span>
              <h2 className="interview-title">신입 부원 1:1 진로 & 플레이 성향 심층 면담</h2>
            </div>
          </div>
          <div className="interview-date-badge">
            📅 고교 1학년 3월 2일 (월) · 입학 첫날
          </div>
        </div>

        {/* 면담 완료 최종 결과 카드 */}
        {!introComplete ? (
          <div className="interview-confirmed-view animate-fade-in">
            <div className="interview-dialogue-box">
              <div className="coach-avatar-section"><div className="coach-avatar-circle"><UserCheck size={32} color="#60a5fa" /></div></div>
              <div className="coach-speech-bubble">
                <p className="coach-quote">“어서 오게, {player.name}. 오늘부터 자네도 {player.highSchool} 야구부의 한 식구야. 긴장할 필요 없네. 먼저 서로 어떤 사람인지 천천히 이야기해 보지.”</p>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:20 }} onClick={() => setIntroComplete(true)}>감독님과 면담 시작하기 <ArrowRight size={18}/></button>
          </div>
        ) : isCompleted ? (
          <div className="interview-confirmed-view animate-fade-in">
            <div className="confirmed-badge-box">
              <CheckCircle size={48} color="#10b981" />
              <h3>면담이 성공적으로 마무리되었습니다!</h3>
              <p>감독님이 자네의 남다른 각오와 인성에 깊은 인상을 받으셨습니다.</p>
            </div>

            <div className="confirmed-summary-card glass-panel">
              <div className="summary-title">
                <Award size={18} color="var(--primary)" /> 확정된 선수 플레이 성향 및 획득 특성
              </div>
              <div className="chosen-traits-grid" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '14px 0' }}>
                {confirmedAnswers.map(ans => (
                  <div key={ans.id} className="trait-summary-pill glass-panel" style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)' }}>
                    <span style={{ marginRight: '6px' }}>{ans.icon}</span>
                    <strong style={{ color: '#93c5fd' }}>#{ans.gainedTrait}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1', marginLeft: '6px' }}>({ans.traitDescription})</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                • 감독 신뢰도: <strong style={{ color: '#34d399' }}>{player.relationshipCoach} pt</strong> (+보너스 반영)<br />
                • 목표 슬로건: <strong style={{ color: '#fbbf24' }}>"{player.chosenPathTitle}"</strong>
              </div>
            </div>

            <button className="btn btn-primary btn-lg enter-dashboard-btn" onClick={handleEnterDashboard} style={{ width: '100%', marginTop: '20px' }}>
              고교 야구부 대시보드 입장하기 <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <>
            {/* 진행 단계 인디케이터 (1/3 -> 2/3 -> 3/3) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                {currentQuestion.questionTitle}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                단계 {currentQIndex + 1} / {totalQuestions}
              </span>
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
                <p className="coach-quote">{currentQuestion.questionDialogue}</p>
                {selectedInCurrentQ && (
                  <div className="coach-reply-box animate-fade-in" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span className="reply-label" style={{ color: '#fbbf24', fontWeight: 700 }}>감독님의 화답:</span>
                    <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '4px 0' }}>"{selectedInCurrentQ.coachReply}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* 답변 선택지 카드 4종 */}
            <div className="interview-choices-container">
              <div className="choices-heading">
                <MessageSquare size={16} /> 자네의 생각과 태도를 정중하고 확신 있게 답하게:
              </div>

              <div className="choices-grid">
                {currentQuestion.options.map(option => {
                  const isSelected = selectedInCurrentQ?.id === option.id;
                  return (
                    <div
                      key={option.id}
                      className={`interview-choice-card ${isSelected ? 'card-active' : ''}`}
                      onClick={() => handleSelectOption(option)}
                    >
                      <div className="choice-card-header">
                        <span className="choice-icon">{option.icon}</span>
                        <strong className="choice-title">{option.title}</strong>
                        {isSelected && <CheckCircle size={18} color="#60a5fa" />}
                      </div>

                      <p className="choice-player-dialogue">{option.dialogue}</p>

                      <div className="choice-perks-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="trait-badge">
                          <Sparkles size={12} /> #{option.gainedTrait}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {option.traitDescription}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단 진행 버튼 바 */}
            <div className="interview-footer-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary btn-lg"
                disabled={!selectedInCurrentQ || isApplying}
                onClick={handleNextQuestion}
              >
                {isApplying ? (
                  <span>성향 반영 중...</span>
                ) : currentQIndex < totalQuestions - 1 ? (
                  <>
                    <span>다음 질문으로</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <Award size={18} />
                    <span>면담 완료 및 최종 확정</span>
                    <CheckCircle size={18} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { AppearanceEditor } from '../../components/PlayerAppearance';
import { DEFAULT_APPEARANCE, normalizePlayer, overallRating } from '../../data/playerDevelopment';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db';
import type { Player, Position, Handedness, PitchingForm, BattingForm, PitcherRole, Gender } from '../../types';
import { POSITION_LABELS } from '../../types';
import { HIGH_SCHOOLS_BY_REGION, getHighSchoolDataByName } from '../../data/highSchools';
import { PITCHING_FORM_GUIDES, BATTING_FORM_GUIDES, type FormGuide } from '../../data/formGuides';
import { SchoolEmblem } from '../../components/SchoolEmblem';
import { SchoolGraphs } from '../../components/SchoolGraphs';
import { School, User, Save, ChevronRight, ChevronLeft, Trophy, Sparkles, X, Check, ArrowLeft, HelpCircle } from 'lucide-react';
import '../../index.css';

export default function PlayerCreation() {
  const navigate = useNavigate();
  const [appearance,setAppearance]=useState(DEFAULT_APPEARANCE);
  const [step, setStep] = useState(1);

  const [activeRegion, setActiveRegion] = useState('서울');
  // 초기에는 아무 학교도 선택되어 있지 않음
  const [highSchool, setHighSchool] = useState<string>('');
  // 팝업으로 상세 정보를 띄울 학교
  const [previewSchoolName, setPreviewSchoolName] = useState<string | null>(null);

  // 폼 가이드 상세 팝업 모달
  const [selectedFormGuide, setSelectedFormGuide] = useState<FormGuide | null>(null);

  // 모달 팝업 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (previewSchoolName || selectedFormGuide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [previewSchoolName, selectedFormGuide]);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [uniformNumber, setUniformNumber] = useState('1');
  const [handedness, setHandedness] = useState<Handedness>('R/R');
  
  const [roleType, setRoleType] = useState<'Pitcher' | 'Batter' | 'TwoWay'>('Batter');
  const [position, setPosition] = useState<Position>('SS');
  const [pitchingForm, setPitchingForm] = useState<PitchingForm>('None');
  const [pitcherRole, setPitcherRole] = useState<PitcherRole>('None');
  const [battingForm, setBattingForm] = useState<BattingForm>('None');

  const selectedSchoolData = highSchool ? getHighSchoolDataByName(highSchool) : undefined;
  const previewSchoolData = previewSchoolName ? getHighSchoolDataByName(previewSchoolName) : undefined;

  // 현재 활성화된 투구폼 / 타격폼 가이드 객체
  const currentEffectivePitchingForm = pitchingForm === 'None' ? 'Overhand' : pitchingForm;
  const currentPitchingGuide = PITCHING_FORM_GUIDES[currentEffectivePitchingForm];

  const currentEffectiveBattingForm = battingForm === 'None' ? 'Straight' : battingForm;
  const currentBattingGuide = BATTING_FORM_GUIDES[currentEffectiveBattingForm];

  const handleUniformNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 2) {
      val = val.slice(0, 2);
    }
    setUniformNumber(val);
  };

  const handleNext = () => {
    if (step === 1 && !highSchool) {
      alert("입학할 고등학교를 선택해주세요.");
      return;
    }
    if (step === 4 && !name.trim()) {
      alert("선수 이름을 입력해주세요.");
      return;
    }
    setStep(s => Math.min(s + 1, 5));
  };
  
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("선수 이름을 입력해주세요.");
      setStep(4);
      return;
    }
    if (!highSchool) {
      alert("입학할 학교를 선택해주세요.");
      setStep(1);
      return;
    }
    
    // 포지션 및 폼 매핑 보정
    const finalPosition = roleType === 'Pitcher' ? 'P' : (roleType === 'TwoWay' ? 'TwoWay' : position);
    const finalPitchingForm = roleType === 'Batter' ? 'None' : (pitchingForm === 'None' ? 'Overhand' : pitchingForm);
    const finalPitcherRole = roleType === 'Batter' ? 'None' : (pitcherRole === 'None' ? 'Starter' : pitcherRole);
    const finalBattingForm = roleType === 'Pitcher' ? 'None' : (battingForm === 'None' ? 'Straight' : battingForm);

    // 등번호 처리 (00, 0, 1~99 등 완벽 지원)
    const finalUniformNumber = uniformNumber.trim() === '' ? 1 : (uniformNumber === '00' ? '00' : parseInt(uniformNumber, 10));

    const baseRating = gender === 'female' ? 17 : 20;
    const newPlayer: Omit<Player, 'id'> = {
      appearance,
      name: name.trim(),
      gender,
      age: 16, // 고1 시작
      position: finalPosition,
      status: 'HighSchool',
      teamId: undefined,
      uniformNumber: finalUniformNumber,
      highSchool,
      handedness,
      pitchingForm: finalPitchingForm,
      pitcherRole: finalPitcherRole,
      battingForm: finalBattingForm,
      
      // Base stats
      overall: baseRating,
      potential: Math.floor(Math.random() * 20) + (gender === 'female' ? 65 : 70),
      
      contact: baseRating, power: baseRating, eye: baseRating, speed: baseRating, defense: baseRating,
      stuff: baseRating, control: baseRating, stamina: baseRating,
      
      condition: 100,
      academics: 50,
      relationshipFamily: 20,
      relationshipFriends: 15,
      relationshipTeam: 10,
      relationshipCoach: 10,
      money: 50000,
      inventory: [],
      equippedItems: {},
      careerGoal: 'KBO',
      familyBackground: 'parents'
    };

    const normalized = normalizePlayer(newPlayer);
    normalized.overall=overallRating(normalized);
    const id = await db.players.add(normalized);
    navigate(`/development/interview/${id}`);
  };

  const getTierColor = (tier?: string) => {
    switch(tier) {
      case 'S': return '#ef4444';
      case 'A': return '#f59e0b';
      case 'B': return '#3b82f6';
      case 'C': return '#10b981';
      case 'D': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="creation-container animate-fade-in">
      <div className="wizard-panel glass-panel" style={{ maxWidth: '860px', width: '100%' }}>
        {/* 스티키 상단 헤더 (스크롤 시 상단 고정, 버튼 높이 완벽 일치, 타이틀 위에 Step 배치) */}
        <div className="wizard-header-sticky">
          <div className="wizard-nav-main-row">
            {/* 좌측: 뒤로가기 / 이전 버튼 */}
            <div className="nav-side-col left">
              {step === 1 ? (
                <button className="btn btn-sm btn-secondary nav-action-btn" onClick={() => navigate('/')}>
                  <ArrowLeft size={16} /> 메인으로
                </button>
              ) : (
                <button className="btn btn-sm btn-secondary nav-action-btn" onClick={handlePrev}>
                  <ChevronLeft size={16} /> 이전
                </button>
              )}
            </div>

            {/* 중앙: 상단 Step 배지 + 바로 아래 새로운 스타 생성 타이틀 */}
            <div className="nav-center-col">
              <div className="step-indicator-large">Step {step} of 5</div>
              <h2 className="wizard-main-title">새로운 스타 생성</h2>
            </div>

            {/* 우측: 다음 / 생성 완료 버튼 */}
            <div className="nav-side-col right">
              {step < 5 ? (
                <button 
                  className={`btn btn-sm btn-primary nav-action-btn ${step === 1 && !highSchool ? 'disabled' : ''}`} 
                  onClick={handleNext}
                >
                  다음 <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn-sm btn-primary nav-action-btn" onClick={handleCreate}>
                  <Save size={16} /> 생성 완료
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="wizard-body">
          {/* STEP 1: 학교 선택 */}
          {step === 1 && (
            <div className="step-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <School size={26} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>고교 야구부 / 클럽 선택</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                학교를 클릭하면 상세 스탯과 정보가 팝업으로 표시됩니다. 원하는 학교를 선택하여 입학하세요.
              </p>
              
              {/* 현재 선택된 학교 배너 */}
              {selectedSchoolData ? (
                <div className="selected-school-banner" onClick={() => setPreviewSchoolName(selectedSchoolData.name)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SchoolEmblem school={selectedSchoolData} size="sm" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>{selectedSchoolData.name}</span>
                        <span className="tier-badge" style={{ backgroundColor: getTierColor(selectedSchoolData.tier) }}>{selectedSchoolData.tier}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {selectedSchoolData.region} • 전국우승 {selectedSchoolData.championships}회 • 부원 {selectedSchoolData.rosterSize}명
                      </div>
                    </div>
                  </div>
                  <span className="change-school-badge">상세보기 / 변경</span>
                </div>
              ) : (
                <div className="unselected-school-alert">
                  <span>⚠️ 아직 선택된 학교가 없습니다. 아래 목록에서 학교를 클릭하세요.</span>
                </div>
              )}

              {/* 권역 탭 */}
              <div className="region-tabs">
                {Object.keys(HIGH_SCHOOLS_BY_REGION).map(region => (
                  <button 
                    key={region} 
                    className={`tab-btn ${activeRegion === region ? 'active' : ''}`}
                    onClick={() => setActiveRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>

              {/* 학교 목록 카드 그리드 */}
              <div className="school-grid-modal-layout">
                {(() => {
                  const tierOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
                  const sorted = [...HIGH_SCHOOLS_BY_REGION[activeRegion]].sort((a, b) => {
                    const da = getHighSchoolDataByName(a);
                    const db = getHighSchoolDataByName(b);
                    const tierA = da ? tierOrder[da.tier] ?? 5 : 5;
                    const tierB = db ? tierOrder[db.tier] ?? 5 : 5;
                    if (tierA !== tierB) return tierA - tierB;
                    return a.localeCompare(b, 'ko');
                  });
                  return sorted.map(schoolName => {
                    const data = getHighSchoolDataByName(schoolName);
                    const isSelected = highSchool === schoolName;
                    return (
                      <button 
                        key={schoolName} 
                        className={`school-select-card-popup-mode ${isSelected ? 'active' : ''}`}
                        onClick={() => setPreviewSchoolName(schoolName)}
                      >
                        <div className="school-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            {data && <SchoolEmblem school={data} size="sm" />}
                            <span className="school-name">{schoolName}</span>
                          </div>
                          {data && (
                            <span 
                              className="tier-badge" 
                              style={{ backgroundColor: getTierColor(data.tier) }}
                            >
                              {data.tier}
                            </span>
                          )}
                        </div>
                        {data && (
                          <div className="school-card-sub" style={{ paddingLeft: '40px' }}>
                            <span>{data.type === 'Club' ? '클럽(BC)' : `${data.foundedYear}년 창단`} ({data.region})</span>
                            <span>선수 {data.rosterSize}명</span>
                          </div>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* STEP 2: 기본 역할 및 투타 유형 */}
          {step === 2 && (
            <div className="step-content">
              <h3><User size={24}/> 기본 역할 및 투타 유형</h3>
              <div className="form-group">
                <label>역할 선택</label>
                <div className="responsive-btn-grid">
                  <button className={`select-btn ${roleType === 'Pitcher' ? 'active' : ''}`} onClick={() => setRoleType('Pitcher')}>투수</button>
                  <button className={`select-btn ${roleType === 'Batter' ? 'active' : ''}`} onClick={() => setRoleType('Batter')}>타자</button>
                  <button className={`select-btn ${roleType === 'TwoWay' ? 'active' : ''}`} onClick={() => setRoleType('TwoWay')}>투타 겸업</button>
                </div>
              </div>
              <div className="form-group">
                <label>투타 유형</label>
                <div className="responsive-btn-grid cols-4">
                  {['R/R', 'R/L', 'L/R', 'L/L'].map(type => (
                    <button key={type} className={`select-btn ${handedness === type ? 'active' : ''}`} onClick={() => setHandedness(type as Handedness)}>
                      {type === 'R/R' ? '우투우타' : type === 'R/L' ? '우투좌타' : type === 'L/R' ? '좌투우타' : '좌투좌타'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 상세 포지션 및 폼 */}
          {step === 3 && (
            <div className="step-content">
              <h3>상세 포지션 및 폼 설정</h3>
              
              {(roleType === 'Pitcher' || roleType === 'TwoWay') && (
                <div className="role-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0 }}>투수 설정</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💡 폼을 클릭하면 설명이 표시됩니다</span>
                  </div>

                  {/* 투구 폼 선택 */}
                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>투구 폼</span>
                      {currentPitchingGuide && (
                        <button 
                          className="form-guide-link-btn"
                          onClick={() => setSelectedFormGuide(currentPitchingGuide)}
                        >
                          <HelpCircle size={14} /> {currentPitchingGuide.name} 상세 가이드 팝업
                        </button>
                      )}
                    </label>
                    <div className="responsive-btn-grid cols-4">
                      {(['Overhand', 'ThreeQuarter', 'Sidearm', 'Underhand'] as PitchingForm[]).map(form => (
                        <button 
                          key={form} 
                          className={`select-btn ${pitchingForm === form || (pitchingForm === 'None' && form === 'Overhand') ? 'active' : ''}`}
                          onClick={() => {
                            setPitchingForm(form);
                          }}
                        >
                          {form === 'Overhand' ? '오버핸드' : form === 'ThreeQuarter' ? '쓰리쿼터' : form === 'Sidearm' ? '사이드암' : '언더핸드'}
                        </button>
                      ))}
                    </div>

                    {/* 선택된 투구 폼 라이브 가이드 카드 */}
                    {currentPitchingGuide && (
                      <div className="selected-form-preview-card" onClick={() => setSelectedFormGuide(currentPitchingGuide)}>
                        <div className="form-preview-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="form-preview-badge">투구 메커니즘</span>
                            <strong className="form-preview-name">{currentPitchingGuide.name}</strong>
                            <span className="form-preview-eng">({currentPitchingGuide.engName})</span>
                          </div>
                          <span className="click-detail-hint">상세보기 🔍</span>
                        </div>
                        <p className="form-preview-tagline">{currentPitchingGuide.tagline}</p>
                        <div className="form-preview-action-cue">
                          <span>🎯 <strong>동작 특징:</strong> {currentPitchingGuide.visualCue}</span>
                        </div>
                        <div className="form-preview-pros">
                          <span>✨ <strong>주요 강점:</strong> {currentPitchingGuide.advantages.join(' • ')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 희망 보직 */}
                  <div className="form-group">
                    <label>희망 보직</label>
                    <div className="responsive-btn-grid">
                      {(['Starter', 'Reliever', 'Closer'] as PitcherRole[]).map(role => (
                        <button 
                          key={role} 
                          className={`select-btn ${pitcherRole === role || (pitcherRole === 'None' && role === 'Starter') ? 'active' : ''}`}
                          onClick={() => setPitcherRole(role)}
                        >
                          {role === 'Starter' ? '선발투수' : role === 'Reliever' ? '중간계투' : '마무리'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(roleType === 'Batter' || roleType === 'TwoWay') && (
                <div className="role-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0 }}>타자 설정</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💡 폼을 클릭하면 설명이 표시됩니다</span>
                  </div>

                  {/* 수비 포지션 */}
                  <div className="form-group">
                    <label>수비 포지션</label>
                    <div className="responsive-btn-grid cols-4">
                      {(['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as Position[]).map(pos => (
                        <button 
                          key={pos} 
                          className={`select-btn ${position === pos ? 'active' : ''}`}
                          onClick={() => setPosition(pos)}
                        >
                          {POSITION_LABELS[pos]} ({pos})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 타격 폼 */}
                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>타격 폼</span>
                      {currentBattingGuide && (
                        <button 
                          className="form-guide-link-btn"
                          onClick={() => setSelectedFormGuide(currentBattingGuide)}
                        >
                          <HelpCircle size={14} /> {currentBattingGuide.name} 상세 가이드 팝업
                        </button>
                      )}
                    </label>
                    <div className="responsive-btn-grid cols-4">
                      {(['Straight', 'Open', 'LegKick', 'ToeTap'] as BattingForm[]).map(form => (
                        <button 
                          key={form} 
                          className={`select-btn ${battingForm === form || (battingForm === 'None' && form === 'Straight') ? 'active' : ''}`}
                          onClick={() => {
                            setBattingForm(form);
                          }}
                        >
                          {form === 'Straight' ? '스탠다드' : form === 'Open' ? '오픈 스탠스' : form === 'LegKick' ? '레그킥' : '토탭'}
                        </button>
                      ))}
                    </div>

                    {/* 선택된 타격 폼 라이브 가이드 카드 */}
                    {currentBattingGuide && (
                      <div className="selected-form-preview-card" onClick={() => setSelectedFormGuide(currentBattingGuide)}>
                        <div className="form-preview-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="form-preview-badge batting">타격 메커니즘</span>
                            <strong className="form-preview-name">{currentBattingGuide.name}</strong>
                            <span className="form-preview-eng">({currentBattingGuide.engName})</span>
                          </div>
                          <span className="click-detail-hint">상세보기 🔍</span>
                        </div>
                        <p className="form-preview-tagline">{currentBattingGuide.tagline}</p>
                        <div className="form-preview-action-cue">
                          <span>🎯 <strong>동작 특징:</strong> {currentBattingGuide.visualCue}</span>
                        </div>
                        <div className="form-preview-pros">
                          <span>✨ <strong>주요 강점:</strong> {currentBattingGuide.advantages.join(' • ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: 선수 프로필 기본 입력 */}
          {step === 4 && (
            <div className="step-content animate-fade-in">
              <h3>선수 프로필 기본 입력</h3>
              <div className="form-group">
                <label>선수 이름</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="form-group">
                <label>성별 선택</label>
                <div className="responsive-btn-grid">
                  <button className={`select-btn ${gender === 'male' ? 'active' : ''}`} onClick={() => setGender('male')}>남자 선수</button>
                  <button className={`select-btn ${gender === 'female' ? 'active' : ''}`} onClick={() => setGender('female')}>여자 선수</button>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>
                  여자 선수는 희소한 도전 경로로 시작 능력치가 조금 낮지만, 동일한 훈련·대회·진출 기회를 가지며 전용 인연·로맨스 스토리가 열립니다.
                </small>
              </div>
              <div className="form-group">
                <label>등번호</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  className="glass-input" 
                  value={uniformNumber} 
                  onChange={handleUniformNumberChange}
                  placeholder="0 ~ 99 (00 가능)"
                />
              </div>

              <div className="form-group" style={{ marginTop: '24px' }}>
                <div style={{ padding: '14px 16px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '10px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#93c5fd' }}>
                    💡 '다음' 버튼을 누르면 선택한 <strong>{gender === 'male' ? '남자 선수' : '여자 선수'}</strong> 체형과 등번호를 반영한 <strong>외형 커스터마이징 화면</strong>으로 이동합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: 외형 커스터마이징 & 최종 확인 */}
          {step === 5 && (
            <div className="step-content animate-fade-in">
              <h3>선수 외형 커스터마이징 & 최종 확인</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                선택한 <strong>{gender === 'male' ? '남자 선수' : '여자 선수'}</strong> 실루엣에 맞추어 피부톤, 헤어스타일, 유니폼 색상을 조율하세요.
              </p>

              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <AppearanceEditor
                  value={appearance}
                  onChange={setAppearance}
                  number={uniformNumber || '1'}
                  gender={gender}
                />
              </div>

              <div className="summary-box">
                <h4>최종 생성 정보 요약</h4>
                <p><strong>소속:</strong> {highSchool} ({selectedSchoolData?.tier} Tier / {selectedSchoolData?.region})</p>
                <p><strong>선수명:</strong> {name || '무명 선수'}</p>
                <p><strong>성별:</strong> {gender === 'male' ? '남자 선수' : '여자 선수'}</p>
                <p><strong>유형:</strong> {roleType === 'Pitcher' ? '투수' : (roleType === 'Batter' ? '타자' : '투타 겸업')} ({handedness})</p>
                <p><strong>포지션:</strong> {roleType === 'Pitcher' ? POSITION_LABELS.P : (roleType === 'TwoWay' ? POSITION_LABELS.TwoWay : `${POSITION_LABELS[position]} (${position})`)}</p>
                {roleType !== 'Batter' && (
                  <p><strong>투구 폼:</strong> {currentPitchingGuide?.name} ({currentPitchingGuide?.releaseAngle})</p>
                )}
                {roleType !== 'Pitcher' && (
                  <p><strong>타격 폼:</strong> {currentBattingGuide?.name} ({currentBattingGuide?.stanceType})</p>
                )}
                <p><strong>등번호:</strong> #{uniformNumber || '1'}</p>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCreate}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem', fontWeight: 700 }}
                >
                  <Save size={18} /> 선수 생성 완료 및 감독 면담 입장
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          학교 상세 정보 모달 팝업 (뷰포트 정중앙 Portal 렌더링)
          ========================================== */}
      {previewSchoolData && typeof document !== 'undefined' && createPortal(
        <div className="school-modal-overlay" onClick={() => setPreviewSchoolName(null)}>
          <div className="school-modal-content" onClick={e => e.stopPropagation()}>
            {/* 팝업 헤더 */}
            <div className="modal-header-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                <SchoolEmblem school={previewSchoolData} size="md" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 className="modal-school-title">{previewSchoolData.name}</h3>
                    <span 
                      className="tier-badge-large"
                      style={{ backgroundColor: getTierColor(previewSchoolData.tier) }}
                    >
                      {previewSchoolData.tier} Tier
                    </span>
                    <span className="type-tag">{previewSchoolData.type === 'Club' ? '클럽팀' : '고교야구부'}</span>
                  </div>
                  <div className="detail-meta">
                    <span>{previewSchoolData.region}</span> • 
                    <span>{previewSchoolData.foundedYear}년 창단</span> • 
                    <span>부원 {previewSchoolData.rosterSize}명</span>
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewSchoolName(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              {/* 전국우승 배너 */}
              <div className="modal-trophy-banner">
                <Trophy size={20} color="#f59e0b" />
                <span>전국대회 통산 <strong>{previewSchoolData.championships}회 우승</strong></span>
              </div>

              {/* 팀 소개 및 설명 */}
              <p className="school-desc">{previewSchoolData.description}</p>

              {/* 특성 (Traits) */}
              <div className="traits-section">
                <div className="section-label"><Sparkles size={16} /> 학교 특성</div>
                <div className="traits-container">
                  {previewSchoolData.traits.map(trait => (
                    <span key={trait} className="trait-chip">#{trait}</span>
                  ))}
                </div>
              </div>

              {/* 메이저 대회별 우승 횟수 */}
              {previewSchoolData.tournamentTitles && (
                <div className="tournament-titles-section">
                  <div className="section-label"><Trophy size={16} /> 주요 전국대회 우승 내역</div>
                  <div className="titles-grid">
                    <div className="title-item">
                      <span className="title-badge gold">황금사자기</span>
                      <span className="title-count">{previewSchoolData.tournamentTitles.goldenLion}회</span>
                    </div>
                    <div className="title-item">
                      <span className="title-badge blue">청룡기</span>
                      <span className="title-count">{previewSchoolData.tournamentTitles.blueDragon}회</span>
                    </div>
                    <div className="title-item">
                      <span className="title-badge orange">봉황대기</span>
                      <span className="title-count">{previewSchoolData.tournamentTitles.phoenix}회</span>
                    </div>
                    <div className="title-item">
                      <span className="title-badge purple">대통령배</span>
                      <span className="title-count">{previewSchoolData.tournamentTitles.president}회</span>
                    </div>
                    {(previewSchoolData.tournamentTitles.others || 0) > 0 && (
                      <div className="title-item">
                        <span className="title-badge cyan">기타 전국대회</span>
                        <span className="title-count">{previewSchoolData.tournamentTitles.others}회</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2대 시각화 그래프 */}
              <SchoolGraphs school={previewSchoolData} />
            </div>

            {/* 팝업 푸터 버튼 */}
            <div className="modal-footer-action">
              <button className="btn btn-secondary" onClick={() => setPreviewSchoolName(null)}>
                닫기
              </button>
              <button 
                className={`btn btn-primary ${highSchool === previewSchoolData.name ? 'selected-done' : ''}`}
                onClick={() => {
                  setHighSchool(previewSchoolData.name);
                  setPreviewSchoolName(null);
                }}
              >
                {highSchool === previewSchoolData.name ? (
                  <>
                    <Check size={18} /> 선택 완료됨
                  </>
                ) : (
                  <>
                    <Check size={18} /> 이 학교로 입학하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==========================================
          폼 상세 가이드 모달 팝업 (투구폼 / 타격폼 설명)
          ========================================== */}
      {selectedFormGuide && typeof document !== 'undefined' && createPortal(
        <div className="school-modal-overlay" onClick={() => setSelectedFormGuide(null)}>
          <div className="form-guide-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-top">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`form-category-tag ${selectedFormGuide.category.toLowerCase()}`}>
                    {selectedFormGuide.category === 'Pitching' ? '투구 폼' : '타격 폼'}
                  </span>
                  <h3 className="modal-school-title">{selectedFormGuide.name}</h3>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({selectedFormGuide.engName})</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '4px' }}>
                  {selectedFormGuide.releaseAngle || selectedFormGuide.stanceType}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedFormGuide(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              {/* 캐치프레이즈 배너 */}
              <div className="form-tagline-banner">
                <Sparkles size={18} color="#60a5fa" />
                <span>{selectedFormGuide.tagline}</span>
              </div>

              {/* 동작 비주얼 묘사 */}
              <div className="form-guide-section">
                <div className="guide-section-title">🏃 동작 메커니즘 (어떻게 던지고 치는가?)</div>
                <div className="visual-cue-box">
                  {selectedFormGuide.visualCue}
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, margin: '8px 0 0 0' }}>
                  {selectedFormGuide.description}
                </p>
              </div>

              {/* 주요 특징 */}
              <div className="form-guide-section">
                <div className="guide-section-title">📊 폼의 고유 특징</div>
                <ul className="guide-feature-list">
                  {selectedFormGuide.characteristics.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* 장점과 유의점 */}
              <div className="form-pros-cons-grid">
                <div className="pros-box">
                  <div className="box-label">✅ 장점 및 시너지</div>
                  <ul>
                    {selectedFormGuide.advantages.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>
                <div className="cons-box">
                  <div className="box-label">⚠️ 유의사항 및 약점</div>
                  <ul>
                    {selectedFormGuide.drawbacks.map((dr, idx) => (
                      <li key={idx}>{dr}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 추천 선수 유형 */}
              <div className="ideal-player-box">
                <strong>🌟 추천 육성 유형:</strong> {selectedFormGuide.idealPitcherOrBatter}
              </div>
            </div>

            <div className="modal-footer-action">
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedFormGuide(null)}>
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

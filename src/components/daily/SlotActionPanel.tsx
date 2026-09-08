import { useState } from 'react';
import type { TimeSlot, GameDate } from '../../types/calendar';
import { TIME_SLOT_LABELS } from '../../types/calendar';
import type { SlotAssignment, DailyActivityCategory } from '../../types/dailySchedule';
import { isSchoolDay } from '../../types/academicCalendar';
import type { Player } from '../../types';
import type { ActivityOption } from '../../types/activity';
import {
  getActivityCategories,
  sampleSubActivities,
  evaluateActivityWithGating,
} from '../../types/activity';
import {
  Zap,
  ArrowRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';

interface SlotActionPanelProps {
  currentSlot: TimeSlot;
  date: GameDate;
  assignment: SlotAssignment;
  player: Player;
  onExecuteForced: (slot: TimeSlot) => Promise<void>;
  onSelectActivity: (
    slot: TimeSlot,
    category: DailyActivityCategory,
    subActivityId: string
  ) => Promise<void>;
}

export function SlotActionPanel({
  currentSlot,
  date,
  assignment,
  player,
  onExecuteForced,
  onSelectActivity,
}: SlotActionPanelProps) {
  // 등교일 여부(주말/방학)에 따른 1차 카테고리 동적 산출
  const schoolDay = isSchoolDay(date);
  const availableCategories = getActivityCategories(currentSlot, schoolDay);

  const defaultCat = assignment.category !== 'exam' && assignment.category !== 'match' && assignment.category !== 'event'
    ? assignment.category
    : availableCategories[0]?.category || 'rest';

  const [selectedCategory, setSelectedCategory] = useState<DailyActivityCategory>(defaultCat);

  // 2차 세부 행동 후보군 (카테고리 선택 시마다 가중치 기반 3~4개 랜덤 샘플링!)
  const [sampledSubActivities, setSampledSubActivities] = useState<ActivityOption[]>(() =>
    !assignment.forced ? sampleSubActivities(defaultCat, 4, player.position, currentSlot) : []
  );
  const [selectedSubId, setSelectedSubId] = useState<string>(() => sampledSubActivities[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 슬롯 또는 등교일 상태가 변경되었을 때 상태 재설정
  const [prevKey, setPrevKey] = useState(`${currentSlot}-${assignment.forced}-${schoolDay}`);
  const currentKey = `${currentSlot}-${assignment.forced}-${schoolDay}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setSelectedCategory(defaultCat);
    if (!assignment.forced) {
      const sampled = sampleSubActivities(defaultCat, 4, player.position, currentSlot);
      setSampledSubActivities(sampled);
      setSelectedSubId(sampled[0]?.id || '');
    }
  }

  const handleCategorySelect = (cat: DailyActivityCategory) => {
    setSelectedCategory(cat);
    const sampled = sampleSubActivities(cat, 4, player.position, currentSlot);
    setSampledSubActivities(sampled);
    setSelectedSubId(sampled[0]?.id || '');
  };

  const handleRunForced = async () => {
    setIsProcessing(true);
    try {
      await onExecuteForced(currentSlot);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunSubActivity = async () => {
    if (!selectedSubId) return;
    setIsProcessing(true);
    try {
      await onSelectActivity(currentSlot, selectedCategory, selectedSubId);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedOption = sampledSubActivities.find(o => o.id === selectedSubId);
  const evaluatedPreview = selectedOption
    ? evaluateActivityWithGating(selectedOption, player.condition, player.condition)
    : null;

  const isLowStamina = player.condition <= 20;
  const isLowMental = player.condition <= 40;

  // (a) 강제 일정 화면 (forced === true: 대회 경기 또는 학사 이벤트)
  if (assignment.forced) {
    const isMatch = assignment.category === 'match';
    const isExam = assignment.category === 'exam';

    return (
      <div className="slot-action-panel glass-panel forced-slot-panel animate-fade-in">
        <div className="forced-badge-row">
          <span className={`forced-status-pill ${isMatch ? 'match-pill' : 'academic-pill'}`}>
            {isMatch ? '🏆 공식 대회 일정' : isExam ? '📝 정규 지필 평가' : '🌸 학교 공식 행사'}
          </span>
          <span className="slot-badge-indicator">
            {TIME_SLOT_LABELS[currentSlot]} 슬롯 강제 지정
          </span>
        </div>

        <div className="forced-content-box">
          <div className="forced-icon-large">
            {isMatch ? '⚾' : isExam ? '✍️' : '🏫'}
          </div>
          <div className="forced-details">
            <h3 className="forced-title">{assignment.label}</h3>
            <p className="forced-desc">{assignment.description}</p>
          </div>
        </div>

        <div className="forced-action-footer">
          <div className="forced-notice-text">
            {isMatch
              ? '※ 공식 경기 결과에 따라 스카우트 인지도 및 실전 경기 감각이 변동됩니다.'
              : '※ 학업 성취도(Academics)와 멘탈 컨디션이 결과에 영향을 줍니다.'}
          </div>
          <button
            className={`btn btn-lg ${isMatch ? 'btn-primary match-action-btn' : 'btn-secondary academic-action-btn'}`}
            onClick={handleRunForced}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span>진행 중...</span>
            ) : (
              <>
                <CalendarCheck size={18} />
                <span>{isMatch ? '경기 시작하기 (결과 확인)' : '학사 일정 진행하기'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // (b) 자유 선택 화면 (forced === false: 1차 카테고리 탭 -> 2차 세부 행동 랜덤 카드)
  return (
    <div className="slot-action-panel glass-panel free-slot-panel animate-fade-in">
      <div className="slot-panel-header">
        <div className="header-left">
          <span className="slot-turn-title">
            <Zap size={18} className="text-primary" /> {TIME_SLOT_LABELS[currentSlot]} 계획 선택
          </span>
          <span className="slot-panel-subtitle">
            1차 카테고리를 고르면 실시간으로 3~4개의 세부 행동이 랜덤 노출됩니다.
          </span>
        </div>

        {/* 체력 경고 표시 */}
        {isLowStamina && (
          <div className="stamina-warning-pill animate-pulse">
            <AlertTriangle size={15} /> 체력 고갈 경고 (훈련 효율 50% 감소 및 부상 위험)
          </div>
        )}
      </div>

      {/* 1단계: 1차 카테고리 선택 버튼 바 */}
      <div className="category-selection-row">
        {availableCategories.map(cat => {
          const isSelected = selectedCategory === cat.category;
          return (
            <button
              key={cat.id}
              className={`category-chip-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(cat.category)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-label">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2단계: 2차 세부 행동 랜덤 샘플링 카드 그리드 */}
      <div className="sub-activities-grid">
        {sampledSubActivities.map(opt => {
          const isSelected = selectedSubId === opt.id;
          const isTrainingOpt = opt.category === 'training';
          const isRestOpt = opt.category === 'rest' || opt.category === 'relationship';

          return (
            <div
              key={opt.id}
              className={`sub-activity-card ${isSelected ? 'card-selected' : ''}`}
              onClick={() => setSelectedSubId(opt.id)}
            >
              <div className="card-top">
                <span className="card-icon">{opt.icon}</span>
                <strong className="card-title">{opt.label}</strong>
                {isSelected && <CheckCircle2 size={18} className="check-icon" />}
              </div>

              <p className="card-desc">{opt.description}</p>

              {/* 스탯 및 체력 변동 칩 */}
              <div className="card-meta-chips">
                <span
                  className={`cost-chip ${opt.staminaDelta < 0 ? 'cost-minus' : 'cost-plus'}`}
                >
                  체력 {opt.staminaDelta > 0 ? `+${opt.staminaDelta}` : opt.staminaDelta}
                </span>

                {Object.entries(opt.statChanges).map(([k, v]) => (
                  <span key={k} className="stat-chip">
                    {k === 'stuff' && '구위'}
                    {k === 'control' && '제구'}
                    {k === 'stamina' && '스태미너'}
                    {k === 'contact' && '컨택'}
                    {k === 'power' && '파워'}
                    {k === 'eye' && '선구안'}
                    {k === 'speed' && '주력'}
                    {k === 'defense' && '수비'}
                    {k === 'academics' && '학업'}
                    {k === 'condition' && '컨디션'}
                    {k === 'fame' && '인지도'}
                    {k === 'relationshipFriends' && '교우'}
                    {k === 'relationshipTeam' && '팀신뢰'}
                    {k === 'relationshipCoach' && '감독'} {v! > 0 ? `+${v}` : v}
                  </span>
                ))}
              </div>

              {/* 상태 게이팅 특수 배지 */}
              {isLowStamina && isTrainingOpt && (
                <div className="gate-notice-chip penalty">
                  ⚠️ 체력 20 이하: 효과 50% & 부상 위험
                </div>
              )}
              {isLowMental && isRestOpt && (
                <div className="gate-notice-chip bonus">
                  ✨ 멘탈 케어: 회복량 +30% 증폭
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 실행 액션 바 */}
      <div className="slot-action-footer">
        <div className="preview-summary-text">
          {selectedOption && (
            <span>
              선택: <strong>{selectedOption.label}</strong>
              {evaluatedPreview && (
                <span className="preview-text-sub"> — {evaluatedPreview.logMessage}</span>
              )}
            </span>
          )}
        </div>

        <button
          className="btn btn-primary btn-lg advance-slot-btn"
          onClick={handleRunSubActivity}
          disabled={!selectedSubId || isProcessing}
        >
          {isProcessing ? (
            <span>활동 처리 중...</span>
          ) : (
            <>
              <Flame size={18} />
              <span>{TIME_SLOT_LABELS[currentSlot]} 활동 완료 (다음 슬롯으로)</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

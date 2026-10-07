import { isGoalForMonth, optionMatchesMonthlyGoal } from '../../data/monthlyGoals';
import { MatchSelectionCard } from './TeamCompetitionPanel';
import { trainingRecommendation, optionMatchesTrainingAdvice } from '../../data/teamCompetition';
import type { BondId } from '../../types/bondScores';
import { getBondName, personalizeText } from '../../data/cast';
import { EXTRA_RATINGS } from '../../data/playerDevelopment';
import { useState } from 'react';
import type { TimeSlot, GameDate } from '../../types/calendar';
import { TIME_SLOT_LABELS } from '../../types/calendar';
import type { SlotAssignment, DailyActivityCategory } from '../../types/dailySchedule';
import { isSchoolDay } from '../../types/academicCalendar';
import type { Player } from '../../types';
import type { ActivityOption } from '../../types/activity';
import {
  SUB_ACTIVITY_POOL,
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
  Dumbbell, BookOpen, Moon, MessagesSquare, Sparkles, School, CircleDot,
} from 'lucide-react';

function ActivityIcon({ category, size = 20 }: { category: DailyActivityCategory; size?: number }) {
  const Icon = category === 'training' ? Dumbbell : category === 'study' || category === 'exam' ? BookOpen : category === 'rest' ? Moon : category === 'relationship' ? MessagesSquare : category === 'match' ? CircleDot : category === 'event' ? School : Sparkles;
  return <Icon size={size} aria-hidden="true" />;
}

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

  const categoryLabels: Partial<Record<DailyActivityCategory,string>> = {training:'훈련',study:'학업',rest:'휴식',relationship:'인연',special:'특별'};
  const defaultCat = assignment.category !== 'exam' && assignment.category !== 'match' && assignment.category !== 'event'
    ? assignment.category
    : availableCategories[0]?.category || 'rest';

  const [selectedCategory, setSelectedCategory] = useState<DailyActivityCategory>(defaultCat);

  // 2차 세부 행동 후보군 (카테고리 선택 시마다 가중치 기반 3~4개 랜덤 샘플링!)
  const [sampledSubActivities, setSampledSubActivities] = useState<ActivityOption[]>(() =>
    !assignment.forced ? sampleSubActivities(defaultCat, 4, player.position, currentSlot, player.grade ?? 1, date) : []
  );
  const [selectedSubId, setSelectedSubId] = useState<string>(() => sampledSubActivities[0]?.id || '');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 슬롯 또는 등교일 상태가 변경되었을 때 상태 재설정
  const [prevKey, setPrevKey] = useState(`${player.id}-${player.position}-${date.year}-${date.month}-${date.day}-${currentSlot}-${assignment.forced}-${schoolDay}`);
  const currentKey = `${player.id}-${player.position}-${date.year}-${date.month}-${date.day}-${currentSlot}-${assignment.forced}-${schoolDay}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setSelectedCategory(defaultCat);
    if (!assignment.forced) {
      const sampled = sampleSubActivities(defaultCat, 4, player.position, currentSlot, player.grade ?? 1, date);
      setSampledSubActivities(sampled);
      setSelectedSubId(sampled[0]?.id || '');
    }
  }

  const handleCategorySelect = (cat: DailyActivityCategory) => {
    setSelectedCategory(cat);
    const sampled = sampleSubActivities(cat, 4, player.position, currentSlot, player.grade ?? 1, date);
    setSampledSubActivities(sampled);
    setSelectedSubId(sampled[0]?.id || '');
  };

  const handleRunForced = async () => {
    if (isProcessing) return;
    setError('');
    setIsProcessing(true);
    try {
      await onExecuteForced(currentSlot);
    } catch {
      setError('진행 내용을 저장하지 못했습니다. 현재 슬롯에서 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunSubActivity = async () => {
    if (!selectedSubId) return;
    if (isProcessing) return;
    setError('');
    setIsProcessing(true);
    try {
      await onSelectActivity(currentSlot, selectedCategory, selectedSubId);
    } catch {
      setError('진행 내용을 저장하지 못했습니다. 현재 슬롯에서 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedOption = sampledSubActivities.find(o => o.id === selectedSubId);
  const evaluatedPreview = selectedOption
    ? evaluateActivityWithGating(selectedOption, player.condition, player.condition, { rollInjury: false })
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
            <ActivityIcon category={assignment.category} size={16} />{isMatch ? '야구부 경기 일정' : isExam ? '정규 지필 평가' : '학교 공식 행사'}
          </span>
          <span className="slot-badge-indicator">
            {TIME_SLOT_LABELS[currentSlot]} · 필수 일정
          </span>
        </div>

        <div className="forced-content-box">
          <div className="forced-icon-large">
            <ActivityIcon category={assignment.category} size={36} />
          </div>
          <div className="forced-details">
            <h2 className="forced-title">{assignment.label}</h2>
            <p className="forced-desc">{assignment.description}</p>
          </div>
        </div>

        {isMatch && assignment.sourceEventId && <MatchSelectionCard player={player} matchId={assignment.sourceEventId} />}
        {error && <p role="alert">{error}</p>}
        <div className="forced-action-footer">
          <div className="forced-notice-text">
            {isMatch
              ? '※ 발표된 역할로 경기를 진행합니다. 벤치 대기는 교체 없이 끝날 수도 있습니다.'
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
                <span>{isMatch ? '경기 진행 · 출전 결과 확인' : '학사 일정 진행하기'}</span>
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
          <h2 className="slot-turn-title">
            <Zap size={20} className="text-primary" aria-hidden="true" /> {TIME_SLOT_LABELS[currentSlot]}에 무엇을 할까요?
          </h2>
          <span className="slot-panel-subtitle">
            오늘의 작은 선택을 훈련 수첩에 남겨보세요.
          </span>
        </div>

        {/* 체력 경고 표시 */}
        {isLowStamina && (
          <div className="stamina-warning-pill animate-pulse">
            <AlertTriangle size={15} /> 체력 고갈 경고 (훈련 효율 50% 감소 및 부상 위험)
          </div>
        )}
      </div>

      {player.teamCompetition?.lastFeedback && <p className="team-training-tip">경기 후 코치 조언 · {trainingRecommendation(player)}</p>}
      {/* 1단계: 1차 카테고리 선택 버튼 바 */}
      <div className="category-selection-row">
        {availableCategories.map(cat => {
          const isSelected = selectedCategory === cat.category;
          return (
            <button
              key={cat.id}
              className={`category-chip-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(cat.category)}
              aria-pressed={isSelected}
            >
              <span className="cat-icon"><ActivityIcon category={cat.category} /></span>
              <span className="cat-label">{categoryLabels[cat.category] ?? cat.label}</span>
            </button>
          );
        })}
      </div>

      {selectedCategory==='training' && currentSlot==='afternoon' && <label className="training-focus">훈련 수첩 · 집중할 기술
        <select value={selectedSubId.startsWith('pitch_')||selectedSubId.startsWith('skill_')?selectedSubId:''} onChange={e=>{const option=SUB_ACTIVITY_POOL.training.find(o=>o.id===e.target.value);if(option){setSampledSubActivities([option]);setSelectedSubId(option.id);}}}>
          <option value="">원하는 능력치·구종 선택</option>
          {SUB_ACTIVITY_POOL.training.filter(o=>(o.id.startsWith('pitch_')||o.id.startsWith('skill_'))&&(player.position==='TwoWay'||o.targetPosition===(player.position==='P'?'P':'B'))).map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
        </select></label>}
      {/* 2단계: 2차 세부 행동 랜덤 샘플링 카드 그리드 */}
      <div className="sub-activities-grid">
        {sampledSubActivities.map(opt => {
          const isSelected = selectedSubId === opt.id;
          const isTrainingOpt = opt.category === 'training';
          const isRestOpt = opt.category === 'rest' || opt.category === 'relationship';

          return (
            <button
              type="button"
              aria-pressed={isSelected}
              key={opt.id}
              className={`sub-activity-card ${isSelected ? 'card-selected' : ''}`}
              onClick={() => setSelectedSubId(opt.id)}
            >
              <div className="card-top">
                <span className="card-icon"><ActivityIcon category={opt.category} /></span>
                <strong className="card-title">{personalizeText(opt.label, player)}</strong>
                {isSelected && <CheckCircle2 size={20} className="check-icon" aria-hidden="true" />}
              </div>

              {player.monthlyGoal && isGoalForMonth(player.monthlyGoal, date) && player.monthlyGoal.progress < player.monthlyGoal.target && optionMatchesMonthlyGoal(player.monthlyGoal, opt) && <span className="monthly-goal-badge">이번 달 목표에 포함</span>}
              {player.teamCompetition?.lastFeedback && optionMatchesTrainingAdvice(player, opt) && <span className="monthly-goal-badge">코치 조언에 맞는 활동</span>}
              <p className="card-desc">{personalizeText(opt.description, player)}</p>

              {/* 스탯 및 체력 변동 칩 */}
              <div className="card-meta-chips">
                <span
                  className={`cost-chip ${opt.staminaDelta < 0 ? 'cost-minus' : 'cost-plus'}`}
                >
                  체력 {opt.staminaDelta > 0 ? `+${opt.staminaDelta}` : opt.staminaDelta}
                </span>

                {Object.entries(opt.relationshipTargets ?? {}).map(([id,delta]) => <span key={id} className="stat-chip">{getBondName(player, id as BondId)} 인연 {delta > 0 ? '+' : ''}{delta}</span>)}
                {Object.entries(opt.statChanges).map(([k, v]) => (
                  <span key={k} className="stat-chip">
                    {EXTRA_RATINGS[k as keyof typeof EXTRA_RATINGS]?.[0]}
                    {k === 'velocity' && '구속'}
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
                    {k === 'fame' && '인지도'} {v! > 0 ? `+${v}` : v}
                  </span>
                ))}
              </div>

              {/* 상태 게이팅 특수 배지 */}
              {isLowStamina && isTrainingOpt && (
                <div className="gate-notice-chip penalty">
                  <AlertTriangle size={16} aria-hidden="true" /> 체력 20 이하: 효과 50% & 부상 위험
                </div>
              )}
              {isLowMental && isRestOpt && (
                <div className="gate-notice-chip bonus">
                  <Sparkles size={16} aria-hidden="true" /> 멘탈 케어: 회복량 +30% 증폭
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p role="alert">{error}</p>}
      {/* 실행 액션 바 */}
      <div className="slot-action-footer">
        <div className="preview-summary-text">
          {selectedOption && (
            <span>
              선택: <strong>{personalizeText(selectedOption.label, player)}</strong>
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
              <Flame size={20} aria-hidden="true" />
              <span>{TIME_SLOT_LABELS[currentSlot]} 활동 완료</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}


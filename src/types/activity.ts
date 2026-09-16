import { BOND_NAMES, formatBondChanges, type RelationshipTargets, type BondId } from './bondScores';
import { PITCH_NAMES, EXTRA_RATINGS, type PitchType } from '../data/playerDevelopment';
import type { TimeSlot } from './calendar';
import type { DailyActivityCategory } from './dailySchedule';
import type { Position } from './index';

export interface PlayerStatsSubset {
  gapPower?: number; avoidK?: number; movement?: number; holdRunners?: number; stealing?: number; baserunning?: number; fieldingRange?: number; fieldingError?: number; arm?: number; velocity?: number;
  contact?: number;
  power?: number;
  eye?: number;
  speed?: number;
  defense?: number;
  stuff?: number;
  control?: number;
  stamina?: number;
  condition?: number; // 컨디션 및 멘탈
  academics?: number; // 학업 성취도
  fame?: number;
}

export interface ActivityOption {
  relationshipTargets?: RelationshipTargets;
  minGrade?: number;
  maxGrade?: number;
  pitchTraining?: PitchType;
  id: string;
  label: string;
  category: DailyActivityCategory;
  weight?: number;              // 2차 세부 행동 랜덤 노출 시 가중치 (기본 1)
  description: string;
  icon: string;
  staminaDelta: number;         // 체력 소모(-) 또는 회복(+)
  mentalDelta?: number;         // 컨디션/멘탈 소모(-) 또는 회복(+)
  statChanges: PlayerStatsSubset;
  targetPosition?: 'P' | 'B' | 'ALL';
  positionSpecific?: Position[]; // 투수/타자/공통
  allowedSlots?: TimeSlot[];
  moneyDelta?: number;
}

export interface ActivityResult {
  pitchTraining?: PitchType;
  pitchXp?: number;
  activityCategory?: DailyActivityCategory;
  statChanges: PlayerStatsSubset;
  staminaDelta: number;
  mentalDelta?: number;
  relationshipTargets?: RelationshipTargets;
  logMessage: string;
  isInjured?: boolean;
  injuryNotice?: string;
  moneyDelta?: number;
  matchOutcome?: { matchId: string; tournamentId: string; won: boolean };
}

export interface CategoryOption {
  id: string;
  category: DailyActivityCategory;
  label: string;
  description: string;
  icon: string;
}

/**
 * 슬롯별 1차 카테고리 후보군
 */
export const ACTIVITY_CATEGORIES: Record<TimeSlot, CategoryOption[]> = {
  morning: [
    { id: 'cat_study', category: 'study', label: '정규 수업 & 학업', description: '교실에서 수업에 집중하고 학업 역량을 기릅니다.', icon: '📚' },
    { id: 'cat_relationship_m', category: 'relationship', label: '친구 & 학교 교우', description: '동급생, 야구부 동기들과 대화를 나누며 교우관계를 돈독히 합니다.', icon: '🤝' },
    { id: 'cat_rest_m', category: 'rest', label: '쉬는 시간 휴식', description: '쉬는 시간과 점심시간을 활용해 체력을 보충합니다.', icon: '💤' },
    { id: 'cat_special_m', category: 'special', label: '야구 이론 & 전술 연구', description: '경기 영상과 야구 이론 서적을 보며 야구 지능을 높입니다.', icon: '🧠' },
  ],
  afternoon: [
    { id: 'cat_training', category: 'training', label: '정규 팀 훈련', description: '그라운드에서 실전 기술과 피지컬을 집중적으로 연마합니다.', icon: '⚾' },
    { id: 'cat_special_a', category: 'special', label: '포지션 특화 훈련', description: '투구 메커니즘 교정이나 배팅 밸런스를 1:1로 집중 지도받습니다.', icon: '🎯' },
    { id: 'cat_relationship_a', category: 'relationship', label: '감독 & 코치 면담', description: '지도자 분들과 면담하며 팀 내 신뢰와 전술적 조언을 얻습니다.', icon: '👨‍🏫' },
    { id: 'cat_rest_a', category: 'rest', label: '트레이닝실 케어', description: '가벼운 러닝과 마사지로 누적된 부하를 덜어냅니다.', icon: '🧘' },
  ],
  night: [
    { id: 'cat_rest_n', category: 'rest', label: '숙소 휴식 & 수면', description: '조기 취침과 숙면을 통해 내일을 위한 체력을 100% 회복합니다.', icon: '🌙' },
    { id: 'cat_training_n', category: 'training', label: '야간 자율 섀도우', description: '조용한 실내 훈련장에서 거울을 보며 섀도우 훈련을 진행합니다.', icon: '🔥' },
    { id: 'cat_relationship_n', category: 'relationship', label: '친구들과 야식 & 만남', description: '야구부 동기들과 야식을 먹거나 게임을 하며 스트레스를 해소합니다.', icon: '🍕' },
    { id: 'cat_special_n', category: 'special', label: '경기 분석 & 자기 계발', description: 'KBO 리그 중계를 모니터링하며 프로 선수들의 수 싸움을 분석합니다.', icon: '📺' },
  ],
};

/**
 * 주말 및 방학 기간 오전 자유 카테고리 후보군 (수업 등 학교 활동 제외)
 */
export const WEEKEND_VACATION_MORNING_CATEGORIES: CategoryOption[] = [
  { id: 'cat_rest_w', category: 'rest', label: '늦잠 & 온전한 휴식', description: '주말 늦잠을 자거나 마사지로 한 주의 피로를 풉니다.', icon: '🛏️' },
  { id: 'cat_training_w', category: 'training', label: '자율 아침 운동', description: '가벼운 조깅과 러닝, 코어 운동으로 체력을 다집니다.', icon: '🏃' },
  { id: 'cat_relationship_w', category: 'relationship', label: '친구 & 가족과의 시간', description: '동기들과 만나거나 가족들과 오붓한 시간을 보냅니다.', icon: '🍕' },
  { id: 'cat_special_w', category: 'special', label: '취미 생활 & 경기 분석', description: '좋아하는 취미를 즐기거나 프로야구 하이라이트를 분석합니다.', icon: '🎮' },
];

/**
 * 슬롯과 등교일 여부(주말/방학)에 따른 동적 1차 카테고리 반환
 */
export function getActivityCategories(slot: TimeSlot, isSchoolDay: boolean): CategoryOption[] {
  if (slot === 'morning') {
    return isSchoolDay ? ACTIVITY_CATEGORIES.morning : WEEKEND_VACATION_MORNING_CATEGORIES;
  }
  return ACTIVITY_CATEGORIES[slot] || [];
}

/**
 * 2차 세부 행동 전체 풀 (가중치 기반 랜덤 샘플링 대상)
 */
export const SUB_ACTIVITY_POOL: Record<DailyActivityCategory, ActivityOption[]> = {
  study: [
    {"id": "study_pe_theory", "label": "체육 이론 필기시험 대비", "description": "운동 원리와 경기 규칙을 정리하며 시험을 준비합니다.", "statChanges": {"academics": 3}, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "📚", "category": "study"},
    {"id": "study_presentation", "label": "동아리 발표 준비", "description": "친구들과 발표 자료와 대본을 함께 완성합니다.", relationshipTargets: { deskmate: 2 }, statChanges: { "academics": 2 }, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "📚", "category": "study"},
    {"id": "study_mentoring", "label": "교내 멘토링 참여", "description": "선배에게 공부 계획을 점검받고 취약 과목을 복습합니다.", relationshipTargets: { senior: 1 }, statChanges: { "academics": 3 }, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "📚", "category": "study"},
    {"id": "study_math_stats", "label": "확률과 야구 통계", "description": "타율과 출루율을 예제로 확률 문제를 풉니다.", "statChanges": {"academics": 3, "eye": 1}, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "📚", "category": "study"},
    {"id": "study_wrong_answers", "label": "오답 노트 정리", "description": "틀린 문제의 풀이 과정을 다시 적으며 이해합니다.", "statChanges": {"academics": 4}, "allowedSlots": ["morning"], "staminaDelta": -6, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "📚", "category": "study"},
    {"id": "study_reading_report", "label": "독서 감상문 작성", "description": "읽은 책의 내용을 자신의 말로 정리합니다.", "statChanges": {"academics": 3, "condition": 2}, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "📚", "category": "study"},
    {
      id: 'study_focus_class',
      label: '교과 수업 집중 경청',
      category: 'study',
      weight: 3,
      description: '앞자리에서 선생님 말씀에 집중하며 교과 진도를 완벽히 따라갑니다.',
      icon: '📖',
      staminaDelta: -4,
      mentalDelta: 3,
      statChanges: { academics: 3, condition: 2 },
      targetPosition: 'ALL',
    },
    {
      id: 'study_exam_problem',
      label: '내신 기출 문제집 풀기',
      category: 'study',
      weight: 3,
      description: '중간/기말고사를 대비해 핵심 기출문제 오답을 꼼꼼히 정리합니다.',
      icon: '✍️',
      staminaDelta: -6,
      mentalDelta: 1,
      statChanges: { academics: 5, condition: 0 },
      targetPosition: 'ALL',
    },
    {
      id: 'study_english_terms',
      label: '메이저리그 세이버메트릭스 & 영어',
      category: 'study',
      weight: 2,
      description: '영어 원서와 최신 야구 통계 용어를 공부하며 학업과 야구를 동시에 잡습니다.',
      icon: '🌐',
      staminaDelta: -5,
      mentalDelta: 4,
      statChanges: { academics: 3, eye: 1, condition: 3 },
      targetPosition: 'ALL',
    },
    {
      id: 'study_group',
      label: '반 친구들과 그룹 스터디',
      category: 'study',
      weight: 2,
      description: '학급 친구들에게 모르는 문제를 물어보며 시험 범위를 복습합니다.',
      icon: '👥',
      staminaDelta: -5,
      mentalDelta: 5,
      relationshipTargets: { deskmate: 3 }, statChanges: { academics: 4 },
      targetPosition: 'ALL',
    },
    {
      id: 'study_library_reading',
      label: '교내 도서관 자율 독서',
      category: 'study',
      weight: 2,
      description: '인문학 책과 스포츠 심리학 서적을 읽으며 멘탈을 다스립니다.',
      icon: '📑',
      staminaDelta: -2,
      mentalDelta: 8,
      statChanges: { academics: 2, condition: 5 },
      targetPosition: 'ALL',
    },
    {
      id: 'study_drowsy',
      label: '꾸벅꾸벅 졸면서 듣기',
      category: 'study',
      weight: 1,
      description: '어젯밤 피로로 눈꺼풀이 무겁지만 용케 수업 자리를 지켰습니다.',
      icon: '😪',
      staminaDelta: 4,
      mentalDelta: -2,
      statChanges: { academics: 1 },
      targetPosition: 'ALL',
    },
  ],

  training: [
    {"id": "train_catcher_block", "label": "블로킹 훈련", "description": "낮게 떨어지는 공을 몸 앞에 막아냅니다.", "statChanges": {"defense": 2, "fieldingError": 1}, "allowedSlots": ["afternoon"], "staminaDelta": -12, "mentalDelta": 2, "weight": 2, "targetPosition": "ALL", "icon": "⚾", "positionSpecific": ["C"], "category": "training"},
    {"id": "train_shortstop_double", "label": "더블플레이 풋워크", "description": "유격수 위치에서 포구와 연결 동작을 반복합니다.", "statChanges": {"fieldingRange": 2, "defense": 1}, "allowedSlots": ["afternoon"], "staminaDelta": -12, "mentalDelta": 2, "weight": 2, "targetPosition": "ALL", "icon": "⚾", "positionSpecific": ["SS"], "category": "training"},
    {"id": "train_second_pivot", "label": "2루 베이스 피벗", "description": "2루 베이스에서 병살 연결 발동작을 익힙니다.", "statChanges": {"fieldingError": 2, "defense": 1}, "allowedSlots": ["afternoon"], "staminaDelta": -12, "mentalDelta": 2, "weight": 2, "targetPosition": "ALL", "icon": "⚾", "positionSpecific": ["2B"], "category": "training"},
    {"id": "train_first_scoop", "label": "1루 바운드 포구", "description": "다양한 바운드의 송구를 안정적으로 받아냅니다.", "statChanges": {"fieldingError": 2, "defense": 1}, "allowedSlots": ["afternoon"], "staminaDelta": -10, "mentalDelta": 2, "weight": 2, "targetPosition": "ALL", "icon": "⚾", "positionSpecific": ["1B"], "category": "training"},
    {"id": "train_outfield_relay", "label": "외야 중계 송구", "description": "외야에서 중계 플레이의 방향과 정확도를 익힙니다.", "statChanges": {"arm": 2, "defense": 1}, "allowedSlots": ["afternoon"], "staminaDelta": -12, "mentalDelta": 2, "weight": 2, "targetPosition": "ALL", "icon": "⚾", "positionSpecific": ["LF", "CF", "RF"], "category": "training"},
    {"id": "train_third_reaction", "label": "핫코너 반응 훈련", "description": "3루에서 빠른 타구에 대응하는 첫 동작을 익힙니다.", "statChanges": {"fieldingRange": 2, "defense": 1}, "allowedSlots": ["afternoon"], "staminaDelta": -12, "mentalDelta": 2, "weight": 2, "targetPosition": "ALL", "icon": "⚾", "positionSpecific": ["3B"], "category": "training"},
    ...Object.entries(PITCH_NAMES).map(([type,label]): ActivityOption => ({id:`pitch_${type}`,label:`${label} 습득·집중 훈련`,description:'미습득 구종은 100 XP부터 사용 가능. 이후 100 XP마다 숙련도 +2.',category:'training',icon:'⚾',weight:2,staminaDelta:-12,statChanges:{control:1},targetPosition:'P',allowedSlots:['afternoon'],pitchTraining:type as PitchType})),
    ...Object.entries(EXTRA_RATINGS).map(([key,[label,description]]): ActivityOption => ({id:`skill_${key}`,label:`${label} 집중 훈련`,description,category:'training',icon:'🎯',weight:2,staminaDelta:-12,statChanges:{[key]:2},targetPosition:['movement','holdRunners'].includes(key)?'P':'B',allowedSlots:['afternoon']})),
    {id:'train_velocity',label:'구속 향상 메커니즘 훈련',description:'하체 전달과 릴리스 개선. 구속 +0.2 km/h',category:'training',icon:'🔥',weight:2,staminaDelta:-16,statChanges:{velocity:0.2},targetPosition:'P',allowedSlots:['afternoon']},
    // 투수 특화
    {
      id: 'train_bullpen_pitching',
      label: '불펜 전력 피칭 (40구)',
      category: 'training',
      weight: 3,
      description: '포수 미트에 강한 릴리스로 꽂아넣으며 실전 감각을 극대화합니다.',
      icon: '🔥',
      staminaDelta: -16,
      mentalDelta: -2,
      statChanges: { stuff: 1, control: 1 },
      targetPosition: 'P',
    },
    {
      id: 'train_breaking_sharp',
      label: '주무기 브레이킹볼 각도 연마',
      category: 'training',
      weight: 3,
      description: '슬라이더/체인지업의 브레이킹 궤적을 날카롭게 다듬습니다.',
      icon: '🌀',
      staminaDelta: -14,
      mentalDelta: 0,
      statChanges: { control: 2, stuff: 1 },
      targetPosition: 'P',
    },
    {
      id: 'train_pitcher_stamina_run',
      label: '폴대 인터벌 러닝',
      category: 'training',
      weight: 2,
      description: '9회까지 무너지지 않는 하체와 심폐 지구력을 혹독하게 단련합니다.',
      icon: '🏃',
      staminaDelta: -18,
      mentalDelta: -4,
      statChanges: { stamina: 2, control: 1 },
      targetPosition: 'P',
    },

    // 타자 특화
    {
      id: 'train_live_cage_batting',
      label: '라이브 배팅 & 피칭머신',
      category: 'training',
      weight: 3,
      description: '145km/h 패스트볼과 예리한 변화구를 공략하며 컨택 타이밍을 잡습니다.',
      icon: '⚔️',
      staminaDelta: -15,
      mentalDelta: -2,
      statChanges: { contact: 1, eye: 1 },
      targetPosition: 'B',
    },
    {
      id: 'train_power_slugger',
      label: '풀스윙 티배팅 & 롱토스',
      category: 'training',
      weight: 3,
      description: '타구에 회전을 걸어 펜스를 넘기는 장타 궤적을 훈련합니다.',
      icon: '💣',
      staminaDelta: -18,
      mentalDelta: -3,
      statChanges: { power: 2, contact: 1 },
      targetPosition: 'B',
    },
    {
      id: 'train_defense_fungo',
      label: '외곽 내야 펑고 100구',
      category: 'training',
      weight: 3,
      description: '불규칙 바운드를 침착하게 포구하고 1루 송구까지 매끄럽게 연결합니다.',
      icon: '🧤',
      staminaDelta: -16,
      mentalDelta: -2,
      statChanges: { defense: 2, speed: 1 },
      targetPosition: 'B',
    },
    {
      id: 'train_baserunning_sprint',
      label: '슬라이딩 & 베이스러닝 대시',
      category: 'training',
      weight: 2,
      description: '투수의 퀵모션을 읽고 과감하게 다음 베이스를 훔치는 주루 플레이입니다.',
      icon: '⚡',
      staminaDelta: -14,
      mentalDelta: 0,
      statChanges: { speed: 2, eye: 1 },
      targetPosition: 'B',
    },

    // 공통
    {
      id: 'train_weight_core',
      label: '하체 스쿼트 & 코어 웨이트',
      category: 'training',
      weight: 3,
      description: '지면 반발력을 극대화하여 회전력을 뿜어내는 피지컬 기초 공사입니다.',
      icon: '🏋️',
      staminaDelta: -18,
      mentalDelta: -3,
      statChanges: { stamina: 1, power: 1, stuff: 1 },
      targetPosition: 'ALL',
    },
    {
      id: 'train_team_scrimmage',
      label: '자체 청백전 실전 타석/투구',
      category: 'training',
      weight: 2,
      description: '동료들과 긴장감 넘치는 청백전을 치르며 코칭스태프에게 눈도장을 찍습니다.',
      icon: '🏟️',
      staminaDelta: -17,
      mentalDelta: 2,
      relationshipTargets: { peer: 1, junior: 1, senior: 1 }, statChanges: { contact: 1, stuff: 1, fame: 1 },
      targetPosition: 'ALL',
      allowedSlots: ['afternoon'],
    },
    { id: 'train_flat_ground', label: '플랫그라운드 릴리스 점검', category: 'training', weight: 2, description: '짧은 거리에서 릴리스와 회전을 섬세하게 교정합니다.', icon: '🎯', staminaDelta: -10, statChanges: { control: 2 }, targetPosition: 'P' },
    { id: 'train_opposite_field', label: '밀어치기·코스별 배팅', category: 'training', weight: 2, description: '코스에 맞춰 강한 타구를 보내는 능력을 기릅니다.', icon: '⚾', staminaDelta: -12, statChanges: { contact: 2, eye: 1 }, targetPosition: 'B' },
    { id: 'train_reaction', label: '순간 반응·첫발 훈련', category: 'training', weight: 2, description: '수비 첫발과 타구 판단 속도를 끌어올립니다.', icon: '⚡', staminaDelta: -11, statChanges: { defense: 1, speed: 1 }, targetPosition: 'ALL' },
  ],

  rest: [
    {"id": "rest_roommate_chat", "label": "룸메이트와 잡담", "description": "숙소에서 오늘 있었던 일을 나누며 긴장을 풉니다.", relationshipTargets: { peer: 2 }, statChanges: { "condition": 7 }, "allowedSlots": ["night"], "staminaDelta": 10, "mentalDelta": 6, "weight": 2, "targetPosition": "ALL", "icon": "🌙", "category": "rest"},
    {"id": "rest_diary", "label": "일기 쓰기", "description": "하루의 감정을 적어 생각을 정리합니다.", "statChanges": {"condition": 8}, "allowedSlots": ["night"], "staminaDelta": 8, "mentalDelta": 8, "weight": 2, "targetPosition": "ALL", "icon": "🌙", "category": "rest"},
    {"id": "rest_breathing", "label": "호흡 이완", "description": "느린 호흡으로 몸과 마음의 긴장을 풀어줍니다.", "statChanges": {"condition": 6}, "allowedSlots": ["morning", "afternoon", "night"], "staminaDelta": 10, "mentalDelta": 6, "weight": 2, "targetPosition": "ALL", "icon": "🌙", "category": "rest"},
    {"id": "rest_power_nap", "label": "점심시간 짧은 낮잠", "description": "쉬는 시간에 눈을 붙이고 오후를 준비합니다.", "statChanges": {"condition": 6}, "allowedSlots": ["morning"], "staminaDelta": 14, "mentalDelta": 4, "weight": 2, "targetPosition": "ALL", "icon": "🌙", "category": "rest"},
    {"id": "rest_sleep_routine", "label": "취침 루틴 정돈", "description": "훈련복을 정리하고 편안한 잠자리를 준비합니다.", "statChanges": {"condition": 9}, "allowedSlots": ["night"], "staminaDelta": 15, "mentalDelta": 7, "weight": 2, "targetPosition": "ALL", "icon": "🌙", "category": "rest"},
    {"id": "rest_light_walk", "label": "가벼운 회복 산책", "description": "숙소 주변을 천천히 걸으며 머리를 식힙니다.", "statChanges": {"condition": 7}, "allowedSlots": ["afternoon", "night"], "staminaDelta": 8, "mentalDelta": 8, "weight": 2, "targetPosition": "ALL", "icon": "🌙", "category": "rest"},
    { id: 'job_convenience', label: '동네 편의점 아르바이트', category: 'rest', weight: 1, description: '짧게 일해 장비 구입비를 모읍니다.', icon: '🏪', staminaDelta: -10, mentalDelta: -2, statChanges: {}, targetPosition: 'ALL', allowedSlots: ['night'], moneyDelta: 30000 },
    { id: 'job_batting_center', label: '배팅센터 보조 아르바이트', category: 'rest', weight: 1, description: '정리와 안내를 돕고 남는 시간에 감각을 익힙니다.', icon: '🪙', staminaDelta: -8, statChanges: { contact: 1 }, targetPosition: 'ALL', allowedSlots: ['night'], moneyDelta: 18000 },
    {
      id: 'rest_deep_sleep',
      label: '충분한 숙면과 낮잠',
      category: 'rest',
      weight: 4,
      description: '누적된 피로를 말끔히 씻어내는 가장 확실한 휴식입니다.',
      icon: '🛏️',
      staminaDelta: 25,
      mentalDelta: 15,
      statChanges: { condition: 15 },
      targetPosition: 'ALL',
    },
    {
      id: 'rest_massage_stretching',
      label: '폼롤러 근막 이완 & 스트레칭',
      category: 'rest',
      weight: 3,
      description: '어깨와 햄스트링의 긴장을 풀고 부상 위험도를 대폭 낮춥니다.',
      icon: '🧘',
      staminaDelta: 18,
      mentalDelta: 10,
      statChanges: { condition: 10, stamina: 1 },
      targetPosition: 'ALL',
    },
    {
      id: 'rest_hot_bath',
      label: '따뜻한 온욕 & 사우나',
      category: 'rest',
      weight: 3,
      description: '따뜻한 탕에 몸을 담그며 근육통을 완화하고 기분을 상쾌하게 만듭니다.',
      icon: '♨️',
      staminaDelta: 20,
      mentalDelta: 18,
      statChanges: { condition: 18 },
      targetPosition: 'ALL',
    },
    {
      id: 'rest_favorite_music',
      label: '음악 감상 & 명상',
      category: 'rest',
      weight: 2,
      description: '좋아하는 플레이리스트를 들으며 마운드와 타석에서의 멘탈을 가다듬습니다.',
      icon: '🎧',
      staminaDelta: 12,
      mentalDelta: 20,
      statChanges: { condition: 20 },
      targetPosition: 'ALL',
    },
    {
      id: 'rest_nutrition_food',
      label: '보양식 & 비타민 영양 섭취',
      category: 'rest',
      weight: 2,
      description: '소고기와 삼계탕으로 기력을 채우고 영양제를 챙겨 먹습니다.',
      icon: '🍲',
      staminaDelta: 24,
      mentalDelta: 12,
      statChanges: { condition: 12 },
      targetPosition: 'ALL',
    },
  ],

  relationship: [
    {id:'rel_tech_coach_video',label:'기술 코치와 영상 분석',category:'relationship',icon:'🎥',description:'기술 코치와 스윙·투구 영상을 돌려보며 조언을 듣습니다.',staminaDelta:-4,mentalDelta:2,statChanges:{eye:1},relationshipTargets:{coach2:4},targetPosition:'ALL',allowedSlots:['afternoon']},
    {id:'rel_rival_training_match',label:'라이벌과 자체 미니게임',category:'relationship',icon:'🔥',description:'박태성과 가벼운 내기를 걸고 훈련 대결을 펼칩니다.',staminaDelta:-6,mentalDelta:3,statChanges:{condition:2},relationshipTargets:{rival:4},targetPosition:'ALL',allowedSlots:['afternoon']},
    {id:'rel_junior_catch',label:'후배와 캐치볼',category:'relationship',icon:'⚾',description:'이준서와 캐치볼을 하며 이야기를 나눕니다.',staminaDelta:-3,mentalDelta:4,statChanges:{},relationshipTargets:{junior:4},minGrade:2,targetPosition:'ALL',allowedSlots:['afternoon','night']},
    {id:'rel_deskmate_notes',label:'짝과 필기 공유',category:'relationship',icon:'📝',description:'윤하린과 서로의 필기를 비교하며 이야기를 나눕니다.',staminaDelta:-3,mentalDelta:3,statChanges:{academics:1},relationshipTargets:{deskmate:4},targetPosition:'ALL',allowedSlots:['morning']},
    {id:'rel_neighbor_hangout',label:'동네 친구와 놀기',category:'relationship',icon:'🎮',description:'최민재와 오랜만에 만나 편하게 시간을 보냅니다.',staminaDelta:3,mentalDelta:6,statChanges:{condition:4},relationshipTargets:{neighbor:4},targetPosition:'ALL',allowedSlots:['night']},
    ...(Object.keys(BOND_NAMES) as BondId[]).map((id): ActivityOption => ({
      id: `bond_talk_${id}`, label: `${BOND_NAMES[id]} · 대화`, category: 'relationship', weight: 2,
      description: `${BOND_NAMES[id]}의 근황과 고민을 듣고 서로의 이야기를 나눕니다.`, icon: '💬',
      staminaDelta: -3, mentalDelta: 5, statChanges: {}, relationshipTargets: {[id]:6},
      targetPosition: 'ALL', minGrade: id === 'junior' ? 2 : undefined,
      allowedSlots: ['teacher','deskmate'].includes(id) ? ['morning']
        : ['coach','coach2','pe','rival','junior'].includes(id) ? ['afternoon'] : ['night'],
    })),
    {"id": "rel_partner_feedback", "label": "훈련 파트너와 피드백", "description": "서로의 플레이에서 좋았던 점을 이야기합니다.", relationshipTargets: { peer: 4 }, statChanges: { "condition": 2 }, "allowedSlots": ["afternoon"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {"id": "rel_class_help", "label": "반 친구 과제 도와주기", "description": "친구와 막힌 문제를 함께 해결합니다.", relationshipTargets: { deskmate: 4 }, statChanges: { "academics": 1 }, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {"id": "rel_rival_greeting", "label": "상대 학교 선수와 인사", "description": "상대 팀 선수와 훈련 경험을 나누며 교류합니다.", relationshipTargets: { rival: 3 }, statChanges: { "condition": 2 }, "allowedSlots": ["afternoon"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {"id": "rel_family_letter", "label": "가족에게 감사 편지", "description": "평소 전하지 못한 감사한 마음을 편지로 적습니다.", relationshipTargets: { mother: 2, father: 2 }, statChanges: { "condition": 3 }, "allowedSlots": ["night"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {"id": "rel_coach_questions", "label": "감독에게 전술 질문", "description": "훈련이 끝난 뒤 궁금했던 작전 의도를 묻습니다.", relationshipTargets: { coach: 4 }, statChanges: { "eye": 1 }, "allowedSlots": ["afternoon"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {"id": "rel_team_cleanup", "label": "동료와 장비실 정리", "description": "팀 장비를 함께 정리하며 대화를 나눕니다.", relationshipTargets: { peer: 2, junior: 1, senior: 1 }, statChanges: {  }, "allowedSlots": ["afternoon"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {"id": "rel_lunch_table", "label": "친구들과 점심 대화", "description": "점심시간에 취미 이야기를 나눕니다.", relationshipTargets: { deskmate: 4 }, statChanges: { "condition": 2 }, "allowedSlots": ["morning"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🤝", "category": "relationship"},
    {
      id: 'rel_friends_arcade',
      label: '이도현·최민재와 오락실/PC방',
      category: 'relationship',
      weight: 3,
      description: '스트레스도 날리고 전우애도 깊어지는 즐거운 시간입니다.',
      icon: '🎮',
      staminaDelta: -5,
      mentalDelta: 22,
      relationshipTargets: { neighbor: 6, peer: 4 }, statChanges: { condition: 15 },
      targetPosition: 'ALL',
    },
    {
      id: 'rel_coach_talk',
      label: '감독님과 1:1 진로 & 전술 상담',
      category: 'relationship',
      weight: 3,
      description: '감독님께 프로 지명을 위한 조언과 앞으로의 기용 방침을 경청합니다.',
      icon: '👨‍🏫',
      staminaDelta: -4,
      mentalDelta: 8,
      relationshipTargets: { coach: 8 }, statChanges: { control: 1, contact: 1 },
      targetPosition: 'ALL',
    },
    {
      id: 'rel_family_call',
      label: '부모님께 안부 전화 & 응원',
      category: 'relationship',
      weight: 3,
      description: '항상 묵묵히 헌신해주시는 부모님의 따뜻한 격려에 힘을 얻습니다.',
      icon: '📞',
      staminaDelta: 5,
      mentalDelta: 20,
      relationshipTargets: { mother: 4, father: 4 }, statChanges: { condition: 15 },
      targetPosition: 'ALL',
    },
    {
      id: 'rel_senior_lesson',
      label: '선배 에이스의 원포인트 노하우 전수',
      category: 'relationship',
      weight: 2,
      description: '3학년 주전 선배에게 실전 볼카운트 싸움 꿀팁을 전수받습니다.',
      icon: '🤝',
      staminaDelta: -8,
      mentalDelta: 5,
      relationshipTargets: { senior: 6 }, maxGrade: 2, statChanges: { eye: 1, control: 1 },
      targetPosition: 'ALL',
    },
    {
      id: 'rel_canteen_snack',
      label: '매점에서 동기들에게 간식 쏘기',
      category: 'relationship',
      weight: 2,
      description: '빵과 음료수를 사주며 팀 내 사기를 드높이고 인기를 얻습니다.',
      icon: '🥤',
      staminaDelta: 4,
      mentalDelta: 12,
      relationshipTargets: { deskmate: 5, peer: 5 }, statChanges: {  },
      targetPosition: 'ALL',
    },
  ],

  special: [
    {"id": "special_recovery_mobility", "label": "회복 가동성 스트레칭", "description": "무리하지 않는 범위에서 관절 가동성을 점검합니다.", "statChanges": {"condition": 5}, "allowedSlots": ["afternoon"], "staminaDelta": 8, "mentalDelta": 4, "weight": 2, "targetPosition": "ALL", "icon": "🧠", "category": "special"},
    {"id": "special_counseling", "label": "심리 상담 세션", "description": "상담 선생님과 경기 부담감을 이야기합니다.", "statChanges": {"condition": 10}, "allowedSlots": ["afternoon"], "staminaDelta": 3, "mentalDelta": 8, "weight": 2, "targetPosition": "ALL", "icon": "🧠", "category": "special"},
    {"id": "special_interview_practice", "label": "인터뷰 대응 연습", "description": "경기 후 질문에 차분히 대답하는 연습을 합니다.", "statChanges": {"academics": 1, "condition": 4}, "allowedSlots": ["afternoon"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🧠", "category": "special"},
    {"id": "special_visualization", "label": "경기 장면 시각화", "description": "내일의 플레이를 떠올리며 집중력을 다집니다.", "statChanges": {"eye": 1, "control": 1, "condition": 3}, "allowedSlots": ["night"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🧠", "category": "special"},
    {"id": "special_scorebook", "label": "스코어북 읽기", "description": "경기 기록지를 보며 수비 상황과 작전을 복기합니다.", "statChanges": {"academics": 2, "eye": 1}, "allowedSlots": ["morning", "night"], "staminaDelta": -4, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🧠", "category": "special"},
    {"id": "special_catcher_signs", "label": "포수 사인 조합 연구", "description": "주자 상황에 맞는 사인 교환을 익힙니다.", relationshipTargets: { peer: 1 }, statChanges: { "defense": 2 }, "allowedSlots": ["afternoon"], "staminaDelta": -5, "mentalDelta": 3, "weight": 2, "targetPosition": "ALL", "icon": "🧠", "positionSpecific": ["C"], "category": "special"},
    {
      id: 'special_video_scouting',
      label: 'KBO 프로 전력 분석 영상 시청',
      category: 'special',
      weight: 3,
      description: '프로 1군 경기 하이라이트와 타자들의 핫존을 정밀 분석합니다.',
      icon: '📺',
      staminaDelta: -4,
      mentalDelta: 6,
      statChanges: { eye: 2, control: 1 },
      targetPosition: 'ALL',
    },
    {
      id: 'special_shadow_mirror',
      label: '야간 거울 섀도우 폼 점검',
      category: 'special',
      weight: 3,
      description: '팔 스윙 궤적과 테이크백 릴리스 포인트를 오차 없이 교정합니다.',
      icon: '🪞',
      staminaDelta: -10,
      mentalDelta: 2,
      statChanges: { stuff: 1, control: 1, defense: 1 },
      targetPosition: 'ALL',
    },
    {
      id: 'special_glove_maintenance',
      label: '글러브 오일 바르기 & 스파이크 손질',
      category: 'special',
      weight: 2,
      description: '나의 소중한 야구 장비를 정성껏 닦으며 야구를 대하는 마음가짐을 다잡습니다.',
      icon: '🧤',
      staminaDelta: 2,
      mentalDelta: 12,
      statChanges: { defense: 1, condition: 10 },
      targetPosition: 'ALL',
    },
    {
      id: 'special_scout_eyecatch',
      label: '스카우트 앞 어필 투구/타격',
      category: 'special',
      weight: 2,
      description: '백스톱 뒤 스피드건을 든 스카우트들을 의식하며 전력 투구/스윙을 선보입니다.',
      icon: '📋',
      staminaDelta: -15,
      mentalDelta: -5,
      statChanges: { fame: 3, stuff: 1, power: 1 },
      targetPosition: 'ALL',
    },
  ],

  // 강제 일정용 기본 풀 (fallback)
  exam: [
    {
      id: 'exam_take_test',
      label: '정규 지필 평가 응시',
      category: 'exam',
      weight: 1,
      description: '긴장된 침묵 속에서 침착하게 시험 문제의 답안을 작성합니다.',
      icon: '📝',
      staminaDelta: -8,
      mentalDelta: -5,
      statChanges: { academics: 6 },
      targetPosition: 'ALL',
    },
  ],
  match: [
    {
      id: 'match_play_official',
      label: '공식 대회 경기 출전',
      category: 'match',
      weight: 1,
      description: '모든 관중과 스카우트의 시선이 집중된 마운드/타석에 오릅니다.',
      icon: '🏆',
      staminaDelta: -25,
      mentalDelta: 5,
      statChanges: { fame: 3, stuff: 1, contact: 1 },
      targetPosition: 'ALL',
    },
  ],
  event: [
    {
      id: 'event_participate',
      label: '교내 공식 행사 참가',
      category: 'event',
      weight: 1,
      description: '선생님과 전교생이 한자리에 모여 행사를 진행합니다.',
      icon: '🎉',
      staminaDelta: -10,
      mentalDelta: 15,
      relationshipTargets: { teacher: 5 }, statChanges: { condition: 15 },
      targetPosition: 'ALL',
    },
  ],
};

/**
 * 가중치 기반 비복원 무작위 추출 (Weighted Sampling without Replacement)
 * 사용자가 카테고리를 누를 때마다 3~4개의 신선한 옵션을 랜덤으로 뽑아냅니다.
 */
export function isActivityAvailable(option: ActivityOption, position: Position, slot?: TimeSlot, grade = 1): boolean {
  if (option.minGrade && grade < option.minGrade) return false;
  if (option.maxGrade && grade > option.maxGrade) return false;
  if (slot && option.allowedSlots && !option.allowedSlots.includes(slot)) return false;
  if (option.positionSpecific && !option.positionSpecific.includes(position)) return false;
  if (!option.targetPosition || option.targetPosition === 'ALL') return true;
  return position === 'TwoWay' || option.targetPosition === (position === 'P' ? 'P' : 'B');
}

export function sampleSubActivities(
  category: DailyActivityCategory,
  count = 4,
  playerPosition: Position = 'P',
  slot?: TimeSlot,
  grade = 1
): ActivityOption[] {
  const pool = SUB_ACTIVITY_POOL[category] || [];
  const filteredPool = pool.filter(opt => isActivityAvailable(opt, playerPosition, slot, grade));

  if (filteredPool.length <= count) {
    return [...filteredPool];
  }

  // 비복원 가중치 추출
  const available = [...filteredPool];
  const selected: ActivityOption[] = [];

  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, item) => sum + (item.weight || 1), 0);
    let rand = Math.random() * totalWeight;

    let pickedIdx = 0;
    for (let j = 0; j < available.length; j++) {
      const w = available[j].weight || 1;
      if (rand < w) {
        pickedIdx = j;
        break;
      }
      rand -= w;
    }

    selected.push(available[pickedIdx]);
    available.splice(pickedIdx, 1);
  }

  return selected;
}

/**
 * 체력 및 멘탈 상태에 따른 효과 보정 및 부상 판정 계산
 */
export function evaluateActivityWithGating(
  option: ActivityOption,
  currentStamina: number,
  currentMental: number
): ActivityResult {
  const isTraining = option.category === 'training';
  const isRestOrRel = option.category === 'rest' || option.category === 'relationship';

  let effectiveStaminaDelta = option.staminaDelta;
  let effectiveMentalDelta = option.mentalDelta || 0;
  const statChanges: PlayerStatsSubset = { ...option.statChanges };

  let isInjured = false;
  let injuryNotice = '';

  // 1. 체력 고갈 페널티 (체력 20 이하)
  if (currentStamina <= 20) {
    if (isTraining) {
      // 훈련 효과 50% 페널티
      for (const key of Object.keys(statChanges) as (keyof PlayerStatsSubset)[]) {
        const val = statChanges[key];
        if (typeof val === 'number' && val > 1) {
          statChanges[key] = Math.max(1, Math.round(val * 0.5));
        }
      }

      // 부상 확률 롤: base 1% + max(0, 20 - stamina) * 0.5%
      const injuryChance = 0.01 + Math.max(0, 20 - currentStamina) * 0.005;
      if (Math.random() < injuryChance) {
        isInjured = true;
        effectiveMentalDelta -= 20;
        effectiveStaminaDelta -= 10;
        injuryNotice = `⚠️ 과도한 피로로 인한 근육 경련/부상 위험 발생! (컨디션 대폭 하락)`;
      }
    }
  }

  // 2. 멘탈 저하 시 회복 활동 보너스 (멘탈/컨디션 40 이하일 때 번아웃 케어)
  if (currentMental <= 40 && isRestOrRel) {
    if (effectiveMentalDelta > 0) {
      effectiveMentalDelta = Math.round(effectiveMentalDelta * 1.3);
    }
    if (effectiveStaminaDelta > 0) {
      effectiveStaminaDelta = Math.round(effectiveStaminaDelta * 1.2);
    }
  }

  // 로그 메시지 생성
  const changesDesc = Object.entries(statChanges)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${translateStatKey(k)} ${v! > 0 ? `+${v}` : v}`)
    .join(', ');

  const costDesc = effectiveStaminaDelta !== 0
    ? `체력 ${effectiveStaminaDelta > 0 ? `+${effectiveStaminaDelta}` : effectiveStaminaDelta}`
    : '';

  let logMessage = `[${option.label}] 완료! `;
  if (changesDesc) logMessage += `(${changesDesc}) `;
  if (option.relationshipTargets && Object.keys(option.relationshipTargets).length) logMessage += `(${formatBondChanges(option.relationshipTargets)}) `;
  if (costDesc) logMessage += `[${costDesc}] `;
  if (injuryNotice) logMessage += `\n${injuryNotice}`;

  return {
    statChanges,
    relationshipTargets: option.relationshipTargets ? {...option.relationshipTargets} : undefined,
    staminaDelta: effectiveStaminaDelta,
    mentalDelta: effectiveMentalDelta,
    logMessage: logMessage.trim(),
    isInjured,
    injuryNotice,
    moneyDelta: option.moneyDelta,
    activityCategory: option.category,
    pitchTraining: option.pitchTraining,
    pitchXp: option.pitchTraining ? (currentStamina <= 20 ? 20 : 40) : undefined,
  };
}

function translateStatKey(key: string): string {
  const map: Record<string, string> = {
    contact: '컨택',
    power: '파워',
    eye: '선구안',
    speed: '주력',
    defense: '수비',
    stuff: '구위',
    control: '제구',
    stamina: '스태미너',
    condition: '컨디션',
    academics: '학업',
    fame: '인지도',
  };
  return map[key] || (EXTRA_RATINGS[key as keyof typeof EXTRA_RATINGS]?.[0]) || (key === 'velocity' ? '구속' : key);
}


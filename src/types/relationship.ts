import { getRelScore, type BondId } from './bondScores';
export { getRelScore } from './bondScores';
export type { RelationshipCharacterId } from './bondScores';
import type { Player } from './index';

export type RelationshipStage = 1 | 2 | 3 | 4 | 5;
export const STAGE_LABELS = ['', '아는 사이', '친한 사이', '가까운 사이', '신뢰하는 사이', '특별한 인연'];
export const scoreToStage = (score: number): RelationshipStage =>
  score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;

interface BondEffectRule {
  stage: RelationshipStage;
  kind: 'training' | 'winProbability';
  amount: number;
}

// 배율/단계를 조정할 때는 이 정의를 수정한다. 계산과 stageEffects 문구가 함께 갱신된다.
// 동기 이도현 5단계만 +10%를 제공한다. 감독과 합산해 최대 총 +18%.
const BOND_EFFECT_RULES: Record<'coach' | 'peer', readonly BondEffectRule[]> = {
  coach: [
    { stage: 2, kind: 'training', amount: 0.03 },
    { stage: 4, kind: 'winProbability', amount: 0.04 },
    { stage: 5, kind: 'training', amount: 0.05 },
  ],
  peer: [{ stage: 5, kind: 'training', amount: 0.10 }],
};

export interface StageEffect {
  stage: RelationshipStage;
  description: string;
  hasEffect: boolean;
}

function effectTotal(group: 'coach' | 'peer', kind: BondEffectRule['kind'], score: number): number {
  const stage = scoreToStage(score);
  return BOND_EFFECT_RULES[group]
    .filter(effect => effect.kind === kind && effect.stage <= stage)
    .reduce((total, effect) => total + effect.amount, 0);
}

export function getTrainingEfficiencyMultiplier(player: Player): number {
  const bonus = effectTotal('coach', 'training', getRelScore(player, 'coach'))
    + effectTotal('peer', 'training', getRelScore(player, 'peer'));
  return Math.round((1 + bonus) * 100) / 100;
}

export function getCoachWinProbabilityBonus(player: Player): number {
  return effectTotal('coach', 'winProbability', getRelScore(player, 'coach'));
}

function buildStageEffects(group?: 'coach' | 'peer'): StageEffect[] {
  const rules = group ? BOND_EFFECT_RULES[group] : [];
  let trainingTotal = 0;
  return ([1, 2, 3, 4, 5] as const).map(stage => {
    const effects = rules.filter(effect => effect.stage === stage);
    const descriptions = effects.map(effect => {
      const percent = Math.round(effect.amount * 100);
      if (effect.kind === 'winProbability') return `경기 승리 확률 보정 +${percent}%p`;
      const previous = trainingTotal;
      trainingTotal += effect.amount;
      return previous > 0
        ? `훈련 효율 추가 +${percent}% (누적 +${Math.round(trainingTotal * 100)}%)`
        : `훈련 효율 +${percent}%`;
    });
    return { stage, description: descriptions.join(' · ') || '효과 없음', hasEffect: effects.length > 0 };
  });
}

export interface BondProfile {
  id: BondId;
  name: string;
  role: string;
  score: number;
  icon: string;
  note: string;
  stageEffects: StageEffect[];
  stageLabels: [string, string, string, string, string];
  romanceable?: boolean;
}

export function buildBondProfiles(player: Player): BondProfile[] {
  const grade = player.grade || 1;

  // note는 기존 참조와의 호환을 위해 보존한다. 실제 효과 표시는 stageEffects를 사용한다.
  const profiles: Omit<BondProfile, 'stageEffects' | 'score'>[] = [
    {
      id: 'coach',
      name: '야구부 감독',
      role: '감독',
      icon: '🧢',
      note: '2단계 훈련 효율 +3% · 4단계 승리 확률 +4%p · 5단계 훈련 효율 추가 +5%',
      stageLabels: ['관찰 대상 신입', '눈도장 찍은 선수', '주전급 신뢰', '팀의 기둥에 대한 신뢰', '감독의 페르소나'],
    },
    {
      id: 'coach2',
      name: '기술 코치',
      role: '코치',
      icon: '📋',
      note: '포지션별 특별 훈련이 열립니다.',
      stageLabels: ['기초 역량 평가 중', '가능성을 본 원석', '맞춤 지도 대상', '특훈의 동반자', '스승과 애제자'],
    },
    {
      id: 'teacher',
      name: '담임 선생님',
      role: '담임',
      icon: '👩‍🏫',
      note: '학업과 진로 상담을 도와줍니다.',
      stageLabels: ['운동부 전입생', '성실한 학생', '진로 고민 상담자', '자랑스러운 제자', '학교의 명예'],
    },
    {
      id: 'pe',
      name: '체육 선생님',
      role: '체육',
      icon: '🏃',
      note: '체력 관리와 부상 예방을 돕습니다.',
      stageLabels: ['체육 시간 관찰', '체력 테스트 우수자', '신체 밸런스 지도', '특급 피지컬 관리', '든든한 후원자'],
    },
    {
      id: 'senior',
      name: grade >= 3 ? '졸업 선배 강민준' : '야구부 주장 강민준',
      role: grade >= 3 ? '졸업 선배' : '주장 선배',
      icon: '⚾',
      note: '인물별 인연과 이벤트 조건에 따라 가까워집니다.',
      romanceable: true,
      stageLabels: ['엄격한 야구부 주장', '인정받기 시작한 후배', '팀을 함께 이끄는 주축', '가슴 뛰는 존경과 설렘', '믿음직한 연인이자 멘토'],
    },
    {
      id: 'peer',
      name: '입학 동기 이도현',
      role: '동기',
      icon: '🤝',
      note: '인물별 인연과 이벤트 조건에 따라 가까워집니다.',
      romanceable: true,
      stageLabels: ['서먹한 배터리/라이벌', '신경 쓰이는 동기', '믿음을 주는 파트너', '특별한 감정의 싹', '마음을 확인한 연인'],
    },
    {
      id: 'rival',
      name: '지역 라이벌 박태성',
      role: '라이벌',
      icon: '🔥',
      note: '대결할수록 집중력과 실전 감각이 오릅니다.',
      stageLabels: ['경계 대상 1호', '의식되는 라이벌', '자극제가 되는 호적수', '인정하는 맞수', '운명의 숙적'],
    },
    ...(grade > 1
      ? [
          {
            id: 'junior',
            name: '야구부 후배 이준서',
            role: '후배',
            icon: '🌱',
            note: '조언과 멘토링 이벤트가 열립니다.',
            stageLabels: ['어려워하는 선배', '따르고 싶은 선배', '닮고 싶은 롤모델', '각별한 선후배', '동경의 대상'],
          } as Omit<BondProfile, 'stageEffects' | 'score'>,
        ]
      : []),
    {
      id: 'childhood',
      name: '소꿉친구 한서윤',
      role: '소꿉친구',
      icon: '🌸',
      note: '인물별 인연과 이벤트 조건에 따라 가까워집니다.',
      romanceable: true,
      stageLabels: ['어색한 소꿉친구', '서로를 챙기는 소꿉친구', '든든한 전속 매니저', '설레는 첫사랑', '영혼의 파트너'],
    },
    {
      id: 'neighbor',
      name: '동네 친구 최민재',
      role: '동네 친구',
      icon: '🎮',
      note: '휴식과 취미 이벤트를 함께합니다.',
      stageLabels: ['가끔 마주치는 친구', '동네 PC방 친구', '고민을 나누는 친구', '속마음 털어놓는 단짝', '평생의 불알친구'],
    },
    {
      id: 'deskmate',
      name: '옆자리 단짝 윤하린',
      role: '반 친구',
      icon: '📚',
      note: '인물별 인연과 이벤트 조건에 따라 가까워집니다.',
      romanceable: true,
      stageLabels: ['거리감 있는 학급 짝꿍', '가벼운 농담을 나누는 친구', '비밀을 공유하는 사이', '특별한 시선', '마음을 털어놓는 연인'],
    },
    {
      id: 'mother',
      name: '어머니',
      role: '가족',
      icon: '🏠',
      note: '식사와 응원으로 컨디션을 회복합니다.',
      stageLabels: ['걱정 많은 엄마', '응원하는 엄마', '믿고 지켜보는 엄마', '자랑스러워하는 엄마', '언제나 내 편인 엄마'],
    },
    {
      id: 'father',
      name: '아버지',
      role: '가족',
      icon: '🧤',
      note: '진로와 장비에 관한 현실적인 조언을 전합니다.',
      stageLabels: ['무뚝뚝한 아빠', '관심을 보이는 아빠', '현실적 조언자', '선수로서 인정한 아빠', '가장 든든한 버팀목'],
    },
  ];
  return profiles.map(profile => {
    const group = profile.id === 'coach' ? 'coach' : profile.id === 'peer' ? 'peer' : undefined;
    return {
      ...profile,
      score: getRelScore(player, profile.id),
      stageEffects: buildStageEffects(group),
    };
  });
}

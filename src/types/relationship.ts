import type { Player } from './index';

export type RelationshipStage = 1 | 2 | 3 | 4 | 5;
export const STAGE_LABELS = ['', '아는 사이', '친한 사이', '가까운 사이', '신뢰하는 사이', '특별한 인연'];
export const scoreToStage = (score: number): RelationshipStage =>
  score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;

export function getTrainingEfficiencyMultiplier(player: Player): number {
  const coachStage = scoreToStage(player.relationshipCoach || 0);
  const teamStage = scoreToStage(player.relationshipTeam || 0);
  let multiplier = 1;
  if (coachStage >= 2) multiplier += 0.03;
  if (coachStage >= 5) multiplier += 0.05;
  if (teamStage >= 5) multiplier += 0.10;
  return Math.round(multiplier * 100) / 100;
}

export interface BondProfile {
  id: string;
  name: string;
  role: string;
  score: number;
  icon: string;
  note: string;
  stageLabels: [string, string, string, string, string];
  romanceable?: boolean;
}

export function buildBondProfiles(player: Player): BondProfile[] {
  const team = player.relationshipTeam || 10;
  const friends = player.relationshipFriends || 15;
  const coach = player.relationshipCoach || 10;
  const family = player.relationshipFamily || 20;
  const grade = player.grade || 1;
  const isFemale = player.gender === 'female';

  return [
    {
      id: 'coach',
      name: '야구부 감독',
      role: '감독',
      score: coach,
      icon: '🧢',
      note: '2단계 훈련 효율 +3% · 4단계 출전 우대 · 5단계 훈련 효율 추가 +5%',
      stageLabels: ['관찰 대상 신입', '눈도장 찍은 선수', '주전급 신뢰', '팀의 기둥에 대한 신뢰', '감독의 페르소나'],
    },
    {
      id: 'coach2',
      name: '기술 코치',
      role: '코치',
      score: Math.min(100, coach + 2),
      icon: '📋',
      note: '포지션별 특별 훈련이 열립니다.',
      stageLabels: ['기초 역량 평가 중', '가능성을 본 원석', '맞춤 지도 대상', '특훈의 동반자', '스승과 애제자'],
    },
    {
      id: 'teacher',
      name: '담임 선생님',
      role: '담임',
      score: friends,
      icon: '👩‍🏫',
      note: '학업과 진로 상담을 도와줍니다.',
      stageLabels: ['운동부 전입생', '성실한 학생', '진로 고민 상담자', '자랑스러운 제자', '학교의 명예'],
    },
    {
      id: 'pe',
      name: '체육 선생님',
      role: '체육',
      score: team,
      icon: '🏃',
      note: '체력 관리와 부상 예방을 돕습니다.',
      stageLabels: ['체육 시간 관찰', '체력 테스트 우수자', '신체 밸런스 지도', '특급 피지컬 관리', '든든한 후원자'],
    },
    ...(grade < 3
      ? [
          {
            id: 'senior',
            name: '야구부 주장 강민준',
            role: '주장 선배',
            score: team,
            icon: '⚾',
            note: isFemale
              ? '엄격하지만 세심한 선배입니다. 각별해지면 설레는 연애 이벤트가 열립니다.'
              : '졸업 후에도 인연이 높으면 프로·대학·사회 진로 조언을 전합니다.',
            romanceable: isFemale,
            stageLabels: isFemale
              ? [
                  '엄격한 야구부 주장',
                  '인정받기 시작한 후배',
                  '팀을 함께 이끄는 주축',
                  '가슴 뛰는 존경과 설렘',
                  '믿음직한 연인이자 멘토',
                ]
              : [
                  '엄격한 야구부 주장',
                  '인정받기 시작한 후배',
                  '팀을 함께 이끄는 주축',
                  '존경과 각별한 유대',
                  '평생의 멘토이자 벗',
                ],
          } as BondProfile,
        ]
      : []),
    {
      id: 'peer',
      name: '입학 동기 이도현',
      role: '동기',
      score: team,
      icon: '🤝',
      note: isFemale
        ? '함께 성장하는 동기입니다. 5단계에서 훈련 효율 +10%와 연애 이벤트가 열립니다.'
        : '함께 성장하며 5단계에서 훈련 효율 +10%를 얻습니다.',
      romanceable: isFemale,
      stageLabels: isFemale
        ? [
            '서먹한 배터리/라이벌',
            '신경 쓰이는 동기',
            '믿음을 주는 파트너',
            '특별한 감정의 싹',
            '마음을 확인한 연인',
          ]
        : [
            '서먹한 배터리/라이벌',
            '신경 쓰이는 동기',
            '믿음을 주는 파트너',
            '절대적인 신뢰',
            '영혼의 배터리',
          ],
    },
    {
      id: 'rival',
      name: '지역 라이벌 박태성',
      role: '라이벌',
      score: Math.max(5, team - 5),
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
            score: team,
            icon: '🌱',
            note: '조언과 멘토링 이벤트가 열립니다.',
            stageLabels: ['어려워하는 선배', '따르고 싶은 선배', '닮고 싶은 롤모델', '각별한 선후배', '동경의 대상'],
          } as BondProfile,
        ]
      : []),
    {
      id: 'childhood',
      name: '소꿉친구 한서윤',
      role: '소꿉친구',
      score: friends,
      icon: '🌸',
      note: isFemale
        ? '오랜 추억을 공유하는 둘도 없는 단짝입니다. 신뢰가 깊어지면 든든한 조력자가 됩니다.'
        : '오랜 추억을 공유합니다. 높은 단계에서 연애 이벤트가 열립니다.',
      romanceable: !isFemale,
      stageLabels: isFemale
        ? [
            '어색한 소꿉친구',
            '서로를 챙기는 소꿉친구',
            '든든한 전속 매니저',
            '둘도 없는 소울메이트',
            '평생의 절친',
          ]
        : [
            '어색한 소꿉친구',
            '서로를 챙기는 소꿉친구',
            '든든한 전속 매니저',
            '설레는 첫사랑',
            '영혼의 파트너',
          ],
    },
    {
      id: 'neighbor',
      name: '동네 친구 최민재',
      role: '동네 친구',
      score: friends,
      icon: '🎮',
      note: '휴식과 취미 이벤트를 함께합니다.',
      stageLabels: ['가끔 마주치는 친구', '동네 PC방 친구', '고민을 나누는 친구', '속마음 털어놓는 단짝', '평생의 불알친구'],
    },
    {
      id: 'deskmate',
      name: '옆자리 단짝 윤하린',
      role: '반 친구',
      score: friends,
      icon: '📚',
      note: isFemale
        ? '공부와 학교생활을 돕는 단짝 친구입니다.'
        : '공부와 학교생활을 돕습니다. 높은 단계에서 연애 이벤트가 열립니다.',
      romanceable: !isFemale,
      stageLabels: isFemale
        ? [
            '거리감 있는 학급 짝꿍',
            '가벼운 농담을 나누는 친구',
            '비밀을 공유하는 사이',
            '마음을 터놓는 비밀 친구',
            '가장 든든한 단짝',
          ]
        : [
            '거리감 있는 학급 짝꿍',
            '가벼운 농담을 나누는 친구',
            '비밀을 공유하는 사이',
            '특별한 시선',
            '마음을 털어놓는 연인',
          ],
    },
    {
      id: 'mother',
      name: '어머니',
      role: '가족',
      score: family,
      icon: '🏠',
      note: '식사와 응원으로 컨디션을 회복합니다.',
      stageLabels: ['걱정 많은 엄마', '응원하는 엄마', '믿고 지켜보는 엄마', '자랑스러워하는 엄마', '언제나 내 편인 엄마'],
    },
    {
      id: 'father',
      name: '아버지',
      role: '가족',
      score: family,
      icon: '🧤',
      note: '진로와 장비에 관한 현실적인 조언을 전합니다.',
      stageLabels: ['무뚝뚝한 아빠', '관심을 보이는 아빠', '현실적 조언자', '선수로서 인정한 아빠', '가장 든든한 버팀목'],
    },
  ];
}

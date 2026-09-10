import type { PlayerStatsSubset } from './activity';

export interface OutdoorLocation {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  effects: { statChanges: PlayerStatsSubset; condition: number; money?: number };
  mapX?: number;
  mapY?: number;
}

const MAP_POSITIONS = [[18,24],[48,18],[78,29],[27,58],[62,55],[84,70],[43,82],[12,78]] as const;
function withMapCoordinates(locations: OutdoorLocation[]): OutdoorLocation[] {
  return locations.map((location,index)=>({...location,mapX:location.mapX??MAP_POSITIONS[index%MAP_POSITIONS.length][0],mapY:location.mapY??MAP_POSITIONS[index%MAP_POSITIONS.length][1]}));
}

const common: OutdoorLocation[] = [
  {
    id: 'goods',
    name: '지역 야구용품 거리',
    icon: '🛍️',
    description: '장비 상점에서 브랜드별 최신 야구용품과 기어를 살펴봅니다.',
    cost: 0,
    effects: { statChanges: {}, condition: 0 },
  },
  {
    id: 'cage',
    name: '실내 타격 배팅센터',
    icon: '⚾',
    description: '타격 머신의 빠른 공을 치며 실전 배트 컨트롤을 가다듬습니다.',
    cost: 10000,
    effects: { statChanges: { contact: 1 }, condition: -5 },
  },
  {
    id: 'library',
    name: '시립 도서관 & 북카페',
    icon: '📚',
    description: '학업 진도를 따라잡고 세이버메트릭스 야구 이론 서적을 탐독합니다.',
    cost: 0,
    effects: { statChanges: { academics: 3, eye: 1 }, condition: 5 },
  },
  {
    id: 'karaoke',
    name: '코인 노래방 & 오락실',
    icon: '🎤',
    description: '친구들과 신나게 노래를 부르고 게임을 즐기며 스트레스를 해소합니다.',
    cost: 8000,
    effects: { statChanges: { relationshipFriends: 3 }, condition: 15 },
  },
];

const landmarks: Record<string, OutdoorLocation[]> = {
  서울: [
    {
      id: 'jamsil',
      name: '잠실 종합운동장 & 야구장',
      icon: '🏟️',
      description: '프로 1군 경기의 뜨거운 열기를 느끼며 큰 무대에서의 플레이를 시각화합니다.',
      cost: 18000,
      effects: { statChanges: { fame: 1, eye: 1 }, condition: 12 },
    },
    {
      id: 'hangang',
      name: '한강 시민공원 러닝 코스',
      icon: '🌊',
      description: '시원한 강바람을 맞으며 롱 슬로우 디스턴스 러닝으로 폐활량을 늘립니다.',
      cost: 0,
      effects: { statChanges: { stamina: 1, speed: 1 }, condition: 10 },
    },
    {
      id: 'dongdaemun',
      name: '동대문 야구용품 헤리티지관',
      icon: '🏬',
      description: '한국 야구 역사를 둘러보고 장인들의 글러브 길들이기 기술을 배웁니다.',
      cost: 5000,
      effects: { statChanges: { defense: 1 }, condition: 8 },
    },
    {
      id: 'namsan',
      name: '남산 둘레길 계단 훈련',
      icon: '⛰️',
      description: '가파른 계단을 전력 질주하여 하체 밸런스와 폭발력을 단련합니다.',
      cost: 0,
      effects: { statChanges: { stamina: 2 }, condition: -5 },
    },
  ],
  부산: [
    {
      id: 'sajik',
      name: '사직 야구장',
      icon: '🏟️',
      description: '대한민국에서 가장 열정적인 팬들의 응원 속에서 프로 선수의 꿈을 다집니다.',
      cost: 16000,
      effects: { statChanges: { fame: 1, eye: 1 }, condition: 12 },
    },
    {
      id: 'gwangalli',
      name: '광안리 해변 모래사장 러닝',
      icon: '🏖️',
      description: '모래사장의 저항을 이겨내며 발목 힘과 순발력을 극대화합니다.',
      cost: 0,
      effects: { statChanges: { stamina: 1, speed: 1 }, condition: 15 },
    },
    {
      id: 'gukje',
      name: '남포동 국제시장 먹거리 특식',
      icon: '🍲',
      description: '신선한 해산물과 고단백 특식을 든든히 먹고 체력을 보충합니다.',
      cost: 12000,
      effects: { statChanges: {}, condition: 20 },
    },
    {
      id: 'busan_academy',
      name: '구덕 베이스볼 아카데미',
      icon: '🥊',
      description: '지역 레전드 선배의 수비 풋워크 원포인트 레슨을 받습니다.',
      cost: 15000,
      effects: { statChanges: { contact: 1, defense: 1 }, condition: -5 },
    },
  ],
  인천: [
    {
      id: 'munhak',
      name: '문학 SSG 랜더스필드',
      icon: '🏟️',
      description: '프로 거포들의 시원한 타격 궤적과 볼카운트별 수싸움을 관찰합니다.',
      cost: 16000,
      effects: { statChanges: { eye: 2 }, condition: 10 },
    },
    {
      id: 'wolmido',
      name: '월미도 해안도로 트레이닝',
      icon: '🎡',
      description: '바닷바람을 맞으며 인터벌 질주와 스트레칭으로 뭉친 근육을 풉니다.',
      cost: 0,
      effects: { statChanges: { stamina: 1 }, condition: 12 },
    },
    {
      id: 'chinatown',
      name: '차이나타운 보양식 거리',
      icon: '🥟',
      description: '에너지를 돋우는 전통 요리를 맛보며 지친 기운을 회복합니다.',
      cost: 15000,
      effects: { statChanges: {}, condition: 22 },
    },
  ],
  경기: [
    {
      id: 'suwon',
      name: '수원 KT 위즈파크',
      icon: '🏟️',
      description: '정교한 제구력의 에이스 투수들의 루틴과 투구 폼을 분석합니다.',
      cost: 16000,
      effects: { statChanges: { eye: 1, control: 1 }, condition: 10 },
    },
    {
      id: 'gwanggyo',
      name: '광교 호수공원 인터벌 코스',
      icon: '🌲',
      description: '수변 트랙을 따라 페이스를 조절하며 장거리 지구력을 기릅니다.',
      cost: 0,
      effects: { statChanges: { stamina: 1, speed: 1 }, condition: 12 },
    },
    {
      id: 'starfield',
      name: '복합 스포츠 엔터테인먼트존',
      icon: '🎳',
      description: '다양한 실내 구기 종목과 가상 스포츠로 동체시력을 훈련합니다.',
      cost: 12000,
      effects: { statChanges: { relationshipFriends: 2 }, condition: 15 },
    },
  ],
  대구: [
    {
      id: 'daegupark',
      name: '대구 삼성 라이온즈 파크',
      icon: '🏟️',
      description: '팔각 다이아몬드 구장의 특성과 장타자들의 타구 방향을 살펴봅니다.',
      cost: 16000,
      effects: { statChanges: { power: 1, eye: 1 }, condition: 10 },
    },
    {
      id: 'suseong',
      name: '수성못 산책로 리커버리',
      icon: '🦢',
      description: '잔잔한 물결을 바라보며 마인드 컨트롤과 멘탈 재정비를 마칩니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 18 },
    },
    {
      id: 'dongseongro',
      name: '동성로 파워 피트니스 클럽',
      icon: '🏋️',
      description: '체계적인 웨이트 기구로 코어와 회전 근력을 단련합니다.',
      cost: 12000,
      effects: { statChanges: { power: 1 }, condition: -5 },
    },
  ],
  광주: [
    {
      id: 'champions',
      name: '광주-기아 챔피언스 필드',
      icon: '🏟️',
      description: '전통의 명가 타이거즈의 기본기와 클러치 상황 대처법을 배웁니다.',
      cost: 15000,
      effects: { statChanges: { defense: 1, eye: 1 }, condition: 10 },
    },
    {
      id: 'mudeung',
      name: '무등산 편백숲 힐링로드',
      icon: '🌲',
      description: '울창한 숲길을 걸으며 신선한 산소를 마시고 피로를 완벽히 날립니다.',
      cost: 0,
      effects: { statChanges: { stamina: 2 }, condition: 15 },
    },
    {
      id: 'acc',
      name: '국립아시아문화전당 잔디마당',
      icon: '🏛️',
      description: '넓은 잔디밭에서 가벼운 캐치볼을 하며 어깨 유연성을 유지합니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 16 },
    },
  ],
  대전: [
    {
      id: 'daejeonpark',
      name: '대전 한화생명 이글스파크',
      icon: '🏟️',
      description: '포기하지 않는 열정과 승부처에서의 끈질긴 풀카운트 승부를 배웁니다.',
      cost: 15000,
      effects: { statChanges: { control: 1, contact: 1 }, condition: 10 },
    },
    {
      id: 'gapcheon',
      name: '갑천변 둔치 러닝트랙',
      icon: '🏃',
      description: '강변을 따라 일정한 스피드로 질주하며 하체 순발력을 키웁니다.',
      cost: 0,
      effects: { statChanges: { speed: 1 }, condition: 12 },
    },
    {
      id: 'yuseong',
      name: '유성 천연온천 족욕체험장',
      icon: '♨️',
      description: '따뜻한 천연 온천수에 발을 담그고 관절과 피로를 빠르게 회복합니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 25 },
    },
  ],
  강원: [
    {
      id: 'gangneung',
      name: '강릉 경포대 해변 트레이닝',
      icon: '🌊',
      description: '동해의 파도를 마주하고 바람을 가르며 근지구력을 한 단계 끌어올립니다.',
      cost: 0,
      effects: { statChanges: { stamina: 2 }, condition: 15 },
    },
    {
      id: 'chuncheon',
      name: '춘천 송암 스포츠타운 야구장',
      icon: '🏟️',
      description: '천연잔디 구장에서 불규칙 바운드를 대비한 포구 훈련을 진행합니다.',
      cost: 12000,
      effects: { statChanges: { eye: 1, defense: 1 }, condition: 10 },
    },
    {
      id: 'seorak',
      name: '설악산 맑은 공기 명상 코스',
      icon: '⛰️',
      description: '기품 있는 산세 속에서 호흡을 가다듬고 흔들리지 않는 멘탈을 기릅니다.',
      cost: 0,
      effects: { statChanges: { control: 1 }, condition: 20 },
    },
  ],
  충남: [
    {
      id: 'cheonan',
      name: '천안 종합운동장 야구장',
      icon: '🏟️',
      description: '지역 고교 엘리트 선수들의 연습 경기를 관전하며 라이벌을 체크합니다.',
      cost: 12000,
      effects: { statChanges: { contact: 1 }, condition: 10 },
    },
    {
      id: 'independence',
      name: '독립기념관 둘레길 장거리보행',
      icon: '🌳',
      description: '넓은 야외 부지를 걸으며 굳은 의지와 집중력을 새깁니다.',
      cost: 0,
      effects: { statChanges: { stamina: 1 }, condition: 15 },
    },
  ],
  충북: [
    {
      id: 'cheongju',
      name: '청주 종합야구장',
      icon: '🏟️',
      description: '아담한 구장의 펜스 거리를 감안하여 라이너성 장타 타법을 구상합니다.',
      cost: 12000,
      effects: { statChanges: { power: 1 }, condition: 10 },
    },
    {
      id: 'cheongnamdae',
      name: '청남대 대청호반 산책길',
      icon: '🏞️',
      description: '호숫가 수목원을 걸으며 맑은 머리로 전술 전략을 정리합니다.',
      cost: 5000,
      effects: { statChanges: {}, condition: 20 },
    },
  ],
  전북: [
    {
      id: 'gunsan',
      name: '군산 월명 야구장',
      icon: '🏟️',
      description: '역전의 명수 역사가 깃든 구장에서 9회말 2아웃 승부사 기질을 되새깁니다.',
      cost: 12000,
      effects: { statChanges: { contact: 1 }, condition: 10 },
    },
    {
      id: 'jeonju_hanok',
      name: '전주 한옥마을 전통 힐링',
      icon: '🏯',
      description: '고즈넉한 한옥 돌담길을 걷고 영양식을 즐기며 컨디션을 끌어올립니다.',
      cost: 8000,
      effects: { statChanges: {}, condition: 22 },
    },
  ],
  전남: [
    {
      id: 'suncheon',
      name: '순천만 국가정원 리커버리',
      icon: '🪷',
      description: '아름다운 정원 속에서 가벼운 스트레칭으로 신체 피로를 배출합니다.',
      cost: 5000,
      effects: { statChanges: { stamina: 1 }, condition: 20 },
    },
    {
      id: 'yeosu',
      name: '여수 밤바다 해양 산책',
      icon: '🌉',
      description: '반짝이는 밤바다를 보며 휴식을 취하고 긍정적인 에너지를 충전합니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 22 },
    },
  ],
  경북: [
    {
      id: 'pohang',
      name: '포항 야구장 & 영일대 러닝',
      icon: '🏟️',
      description: '바닷바람 속에서 펜스 플레이와 깊은 타구 판단력을 연습합니다.',
      cost: 12000,
      effects: { statChanges: { defense: 1, speed: 1 }, condition: 10 },
    },
    {
      id: 'gyeongju',
      name: '경주 유적지 힐링 코스',
      icon: '🏛️',
      description: '천년 고도의 차분한 분위기 속에서 평정심과 호흡을 정돈합니다.',
      cost: 0,
      effects: { statChanges: { control: 1 }, condition: 18 },
    },
  ],
  경남: [
    {
      id: 'changwon',
      name: '창원 NC 파크',
      icon: '🏟️',
      description: '최첨단 메이저리그급 구장에서 경기 전 웜업과 시설을 꼼꼼히 살펴봅니다.',
      cost: 15000,
      effects: { statChanges: { power: 1, eye: 1 }, condition: 12 },
    },
    {
      id: 'jinju',
      name: '진주 남강변 트랙',
      icon: '🌊',
      description: '남강을 따라 리듬감 있는 롱런 훈련을 수행합니다.',
      cost: 0,
      effects: { statChanges: { stamina: 1 }, condition: 14 },
    },
  ],
  울산: [
    {
      id: 'ulsan_munsu',
      name: '울산 문수 야구장 & 체육공원',
      icon: '🏟️',
      description: '웅장한 종합체육공원의 언덕 코스에서 하체 순발력을 강화합니다.',
      cost: 12000,
      effects: { statChanges: { defense: 1, speed: 1 }, condition: 10 },
    },
    {
      id: 'daewangam',
      name: '대왕암 공원 솔숲길',
      icon: '🌲',
      description: '기암괴석과 소나무 숲길을 걸으며 활력을 되찾습니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 20 },
    },
  ],
  제주: [
    {
      id: 'hallasan',
      name: '한라산 둘레길 고지대 트레이닝',
      icon: '⛰️',
      description: '맑은 고지대 공기 속에서 러닝을 진행하여 심폐 지구력을 대폭 향상합니다.',
      cost: 0,
      effects: { statChanges: { stamina: 2 }, condition: 15 },
    },
    {
      id: 'ora',
      name: '제주 오라야구장 전지훈련장',
      icon: '🏟️',
      description: '겨울에도 따뜻한 천혜의 환경에서 실전 타격 감각을 유지합니다.',
      cost: 12000,
      effects: { statChanges: { contact: 1, power: 1 }, condition: 8 },
    },
    {
      id: 'hamdeok',
      name: '함덕 에메랄드 해변 리커버리',
      icon: '🏝️',
      description: '에메랄드빛 바다를 바라보며 완벽한 힐링과 재충전을 만끽합니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 25 },
    },
  ],
};

export function getOutdoorLocations(region: string): OutdoorLocation[] {
  // 1. 완전 일치
  if (landmarks[region]) {
    return withMapCoordinates([...landmarks[region], ...common]);
  }

  // 2. 복합 권역 키워드 매칭 (예: '경기/인천', '강원/충청', '전라/제주', '경상')
  for (const [key, locs] of Object.entries(landmarks)) {
    if (region.includes(key)) {
      return withMapCoordinates([...locs, ...common]);
    }
  }

  // 3. 기본 폴백
  return withMapCoordinates([
    {
      id: 'regional_park',
      name: `${region} 종합운동장 야구장`,
      icon: '🏟️',
      description: '지역 스포츠 시설에서 프로와 엘리트 야구의 실전 감각을 체득합니다.',
      cost: 12000,
      effects: { statChanges: { eye: 1, stamina: 1 }, condition: 10 },
    },
    {
      id: 'regional_nature',
      name: `${region} 수변 생태공원 산책로`,
      icon: '🌿',
      description: '자연 친화적 트랙에서 가벼운 조깅으로 심신을 달래고 회복합니다.',
      cost: 0,
      effects: { statChanges: {}, condition: 18 },
    },
    ...common,
  ]);
}

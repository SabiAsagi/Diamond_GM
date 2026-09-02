export interface InterviewChoice {
  id: string;
  title: string;
  dialogue: string;
  response: string; // 감독의 화답
  coachReply: string;
  statBoosts: {
    stuff?: number;
    control?: number;
    stamina?: number;
    contact?: number;
    power?: number;
    eye?: number;
    speed?: number;
    defense?: number;
    condition?: number;
  };
  gainedTrait: string;
  traitDescription: string;
  icon: string;
}

export const PITCHER_INTERVIEW_CHOICES: InterviewChoice[] = [
  {
    id: 'power_fireballer',
    title: '강속구 파이어볼러 (구위 & 구속 특화)',
    dialogue: '"타자를 압도하는 150km/h대 강속구로 마운드를 지배하는 파이어볼러가 되겠습니다!"',
    response: '호기롭군! 빠른 공은 신이 내린 선물이지. 자네의 강한 어깨를 믿고 타자를 힘으로 윽박지르는 훈련을 집중적으로 시켜주겠네.',
    coachReply: '구위와 최고구속을 집중 훈련하며 타자의 헛스윙을 이끌어냅니다.',
    statBoosts: { stuff: 15, control: 4, stamina: 5 },
    gainedTrait: '파이어볼러',
    traitDescription: '패스트볼 체감 구속 상승 및 타자의 헛스윙 유도율 대폭 증가',
    icon: '🔥'
  },
  {
    id: 'control_artist',
    title: '면도날 제구파 (제구 & 선구안 파괴 특화)',
    dialogue: '"스트라이크 존 구석구석을 찌르는 칼날 같은 제구력으로 타자의 허를 찌르겠습니다!"',
    response: '좋은 눈과 영리한 마인드야. 결국 야구는 제구력의 싸움이지. 사사구를 줄이고 볼카운트를 유리하게 이끄는 정밀 피칭을 연마해보세.',
    coachReply: '사사구 비율을 최소화하고 스트라이크 존 보더라인을 완벽히 공략합니다.',
    statBoosts: { control: 16, stuff: 4, stamina: 4 },
    gainedTrait: '컨트롤 아티스트',
    traitDescription: '볼넷 허용률 최소화 및 2스트라이크 이후 결정구 성공률 증가',
    icon: '🎯'
  },
  {
    id: 'iron_inning_eater',
    title: '강철 체력의 이닝 이터 (완투 & 스태미너 특화)',
    dialogue: '"9회 마지막 아웃카운트까지 마운드를 든든하게 책임지는 에이스 선발투수가 되겠습니다!"',
    response: '진정한 에이스의 자세로군! 불펜의 부담을 덜어주는 완투형 투수야말로 모든 감독이 꿈꾸는 기둥이지. 강철 체력을 만들어주겠네.',
    coachReply: '투구수가 많아져도 구위 저하가 적고 이닝 소화력이 비약적으로 상승합니다.',
    statBoosts: { stamina: 18, control: 5, stuff: 4, condition: 10 },
    gainedTrait: '강철 어깨',
    traitDescription: '이닝당 스태미너 소모량 감소 및 연투 피로 회복 속도 대폭 증가',
    icon: '🛡️'
  },
  {
    id: 'stone_closer',
    title: '돌부처 수호신 (위기관리 & 클로저 특화)',
    dialogue: '"만루 위기에서도 흔들리지 않고 팀의 승리를 끝까지 지켜내는 마무리가 되겠습니다!"',
    response: '배짱이 두둑하군! 마운드 위에서의 강심장은 훈련만으로는 얻기 힘든 법. 자네의 강한 멘탈로 뒷문을 굳게 잠가주게.',
    coachReply: '주자가 득점권에 있을 때 멘탈이 흔들리지 않고 구위가 한 단계 각성합니다.',
    statBoosts: { stuff: 10, control: 8, stamina: 4, condition: 15 },
    gainedTrait: '돌부처 클로저',
    traitDescription: '득점권 위기 상황 및 9회 세이브 상황에서 피안타율 대폭 감소',
    icon: '💎'
  }
];

export const BATTER_INTERVIEW_CHOICES: InterviewChoice[] = [
  {
    id: 'slugger_home_run_king',
    title: '거포 슬러거 (파워 & 장타력 특화)',
    dialogue: '"담장을 훌쩍 넘기는 호쾌한 한 방으로 경기 흐름을 뒤집는 4번 홈런 타자가 되겠습니다!"',
    response: '홈런 한 방은 야구의 꽃이지! 자네의 체격과 파워를 살려 전국대회 담장을 넘기는 괴물 타자로 키워보겠네.',
    coachReply: '타구 속도와 비거리가 극대화되어 장타와 홈런 생산력이 크게 향상됩니다.',
    statBoosts: { power: 16, contact: 4, eye: 4 },
    gainedTrait: '거포 본능',
    traitDescription: '정타 시 장타 및 홈런 확률 증가, 비거리 보너스',
    icon: '💣'
  },
  {
    id: 'contact_machine',
    title: '3할 타격 머신 (컨택트 & 선구안 특화)',
    dialogue: '"어떤 코스의 공이든 날카로운 안타로 연결하는 정교한 3할 타자가 되겠습니다!"',
    response: '훌륭한 각오일세. 기복 없이 꾸준히 살아나가는 타자야말로 팀 타선의 심장이지. 배트 중심에 맞히는 훈련을 집중하겠네.',
    coachReply: '삼진을 당하지 않고 높은 타율과 출루율을 꾸준히 유지합니다.',
    statBoosts: { contact: 16, eye: 8, speed: 3 },
    gainedTrait: '타격 장인',
    traitDescription: '2스트라이크 이후 컨택트 보정 및 삼진 비율 대폭 감소',
    icon: '⚔️'
  },
  {
    id: 'speed_demon_leadoff',
    title: '호타준족 테이블세터 (주력 & 도루 특화)',
    dialogue: '"빠른 발로 그라운드를 흔들고 상대 배터리의 혼을 빼놓는 1번 도루왕이 되겠습니다!"',
    response: '발 빠른 주자는 수비진 전체를 공포에 떨게 만들지! 한 베이스를 더 훔치고 득점을 올리는 기동력 야구를 완성해보세.',
    coachReply: '도루 성공률이 극상승하며, 빗맞은 타구도 내야 안타로 만드는 스피드를 발휘합니다.',
    statBoosts: { speed: 18, contact: 6, eye: 5 },
    gainedTrait: '대도(Great Thief)',
    traitDescription: '도루 성공률 대폭 증가 및 내야 땅볼 시 세이프 확률 증가',
    icon: '⚡'
  },
  {
    id: 'golden_glove_defense',
    title: '철벽 수비 사령관 (수비 & 송구력 특화)',
    dialogue: '"어떤 타구도 빠져나가지 못하게 막아내어 투수를 든든하게 받쳐주는 수비의 핵이 되겠습니다!"',
    response: '진정한 야구 고수의 마인드야! 수비가 무너지면 이길 수 없는 법. 내야/외야를 완벽히 통솔하는 수비 명수로 만들어주겠네.',
    coachReply: '넓은 수비 범위와 강한 송구력으로 실책을 방지하고 팀의 실점을 차단합니다.',
    statBoosts: { defense: 18, speed: 5, contact: 4 },
    gainedTrait: '골든글러버',
    traitDescription: '수비 범위 증가, 실책 확률 0%에 수렴, 다이빙 캐치 성공률 상승',
    icon: '🧤'
  }
];

export const TWOWAY_INTERVIEW_CHOICES: InterviewChoice[] = [
  {
    id: 'two_way_phenom',
    title: '완전무결 만능 이도류 (투타 겸업 슈퍼스타)',
    dialogue: '"마운드에서는 150km를 던지고, 타석에서는 홈런을 때려내는 대한민국 최고의 이도류가 되겠습니다!"',
    response: '남들의 두 배로 땀을 흘려야 하는 험난한 길이지만, 자네의 재능과 열정이라면 분명 해낼 수 있을 걸세! 전폭적으로 지원하겠네.',
    coachReply: '투수와 타자 양쪽 능력치가 고르게 균형 성장하며 양 포지션에 출전 가능합니다.',
    statBoosts: { stuff: 8, control: 8, contact: 8, power: 8, stamina: 6 },
    gainedTrait: '만능 이도류',
    traitDescription: '투수 등판 경기에서 타격 보너스 획득 및 포지션 피로도 감소',
    icon: '⭐'
  },
  {
    id: 'ace_pitcher_focus',
    title: '투수 중심 에이스 겸업 (마운드 주력)',
    dialogue: '"마운드 위의 에이스로 팀을 이끌면서 필요할 때 결정적인 한 방을 보태겠습니다!"',
    response: '에이스 투수로서 중심을 잡되, 타석에서의 장점도 살리는 실리적인 선택이군. 마운드 훈련에 70%를 쏟아보세.',
    coachReply: '투수 스탯에 더 큰 보너스를 받으며 선발 로테이션의 주축이 됩니다.',
    statBoosts: { stuff: 12, control: 10, stamina: 8, power: 6 },
    gainedTrait: '마운드의 지휘관',
    traitDescription: '선발 등판 시 팀 타선 득점 지원 확률 증가',
    icon: '👑'
  }
];

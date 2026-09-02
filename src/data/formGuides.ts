export interface FormGuide {
  key: string;
  name: string;
  engName: string;
  category: 'Pitching' | 'Batting';
  releaseAngle?: string;
  stanceType?: string;
  tagline: string;
  description: string;
  visualCue: string;
  characteristics: string[];
  advantages: string[];
  drawbacks: string[];
  idealPitcherOrBatter: string;
}

export const PITCHING_FORM_GUIDES: Record<string, FormGuide> = {
  Overhand: {
    key: 'Overhand',
    name: '오버핸드',
    engName: 'Overhand',
    category: 'Pitching',
    releaseAngle: '수직 80° ~ 90° (가장 높은 타점)',
    tagline: '가장 높은 타점에서 내리꽂는 정통파 투구 폼',
    description: '팔을 지면과 수직에 가깝게 높이 들어 올려 중력을 이용해 내리꽂는 전통적이고 강력한 투구 폼입니다. 높은 릴리스 포인트에서 출발하는 강력한 수직 각도를 자랑합니다.',
    visualCue: '팔을 머리 위로 쭉 뻗어 높은 타점에서 힘차게 공을 내리꽂는 동작',
    characteristics: [
      '가장 높은 릴리스 포인트 형성',
      '종(Vertical) 브레이킹 볼 각도 극대화',
      '체감 구속과 타자 시야 압박감 우수'
    ],
    advantages: [
      '낙폭이 큰 포크볼, 커브, 하이 패스트볼에 최적화',
      '타자의 히팅 포인트를 상하로 크게 흔듦'
    ],
    drawbacks: [
      '어깨와 팔꿈치 관절에 가해지는 피로도 및 부상 위험이 상대적으로 높음',
      '체력 소모가 빠름'
    ],
    idealPitcherOrBatter: '탈삼진형 파워 피처, 각도 큰 종변화구 구사 투수'
  },
  ThreeQuarter: {
    key: 'ThreeQuarter',
    name: '쓰리쿼터',
    engName: 'Three-Quarter',
    category: 'Pitching',
    releaseAngle: '대각 45° ~ 60° (인체공학적 자연각)',
    tagline: '현대 야구에서 가장 대중적이고 완벽한 밸런스의 폼',
    description: '머리와 어깨 사이의 자연스러운 각도로 팔을 스윙하는 폼입니다. 신체 역학적으로 가장 무리가 적으며, 구속과 제구력의 완벽한 밸런스를 제공합니다.',
    visualCue: '어깨 라인보다 약간 높은 대각선 각도에서 부드럽고 유연하게 채찍질하듯 던지는 동작',
    characteristics: [
      '가장 자연스러운 팔 스윙 궤적',
      '종/횡 복합 무브먼트 형성',
      '뛰어난 제구 안정성과 스태미너 효율'
    ],
    advantages: [
      '투심, 슬라이더, 체인지업 등 다양한 구종을 안정적으로 제구 가능',
      '부상 위험이 가장 낮고 이닝 소화력이 뛰어남'
    ],
    drawbacks: [
      '극단적인 궤적의 개성보다는 투수 본인의 구위와 제구 완성도가 핵심'
    ],
    idealPitcherOrBatter: '안정적인 이닝 이터 선발투수, 올라운드 피처'
  },
  Sidearm: {
    key: 'Sidearm',
    name: '사이드암',
    engName: 'Sidearm',
    category: 'Pitching',
    releaseAngle: '수평 0° ~ 15° (지면 평행 릴리스)',
    tagline: '지면과 수평으로 날카롭게 파고드는 횡적 마구의 제왕',
    description: '상체를 약간 숙이고 팔을 옆으로 휘둘러 던지는 폼입니다. 좌우로 요동치는 강력한 횡(Horizontal) 무브먼트로 타자의 타이밍과 배트 중심을 빗맞힙니다.',
    visualCue: '몸을 회전시키며 옆구리 높이에서 원반을 던지듯 수평으로 날카롭게 릴리스하는 동작',
    characteristics: [
      '극대화된 좌우 횡 무브먼트(Sinker, Slider)',
      '우타자 몸쪽 / 좌타자 바깥쪽 파고드는 궤적',
      '땅볼 유도율 극상'
    ],
    advantages: [
      '동일한 손 타자(우투-우타)에게 공이 등 뒤에서 날아오는 듯한 공포감 선사',
      '빗맞은 땅볼 유도에 매우 유리'
    ],
    drawbacks: [
      '반대 손 타자(우투-좌타)에게 공의 릴리스 포인트가 일찍 노출되어 피장타율 증가 위험'
    ],
    idealPitcherOrBatter: '땅볼 유도형 투수, 위기 관리 불펜 전문 요원'
  },
  Underhand: {
    key: 'Underhand',
    name: '언더핸드',
    engName: 'Underhand (Submarine)',
    category: 'Pitching',
    releaseAngle: '마이너스 각도 (지면 초근접 상승 궤적)',
    tagline: '지면에서 솟구쳐 오르는 신비로운 궤적의 잠수함 투구',
    description: '허리를 지면에 닿을 정도로 깊게 숙여 공을 아래에서 위로 퍼 올리듯 던지는 초희귀 폼입니다. 중력을 거스르는 듯한 라이징 궤적으로 타자의 시야를 교란합니다.',
    visualCue: '허리를 극단적으로 숙여 손가락이 그라운드를 스칠 듯한 낮은 릴리스에서 공을 솟구치게 던지는 동작',
    characteristics: [
      '타자의 시야 아래에서 솟구쳐 오르는 업슛 궤적',
      '극단적인 희소성으로 인한 타이밍 교란',
      '독보적인 땅볼 유도와 타이밍 뺏기'
    ],
    advantages: [
      '생소한 궤적으로 인해 처음 상대하는 타자들에게 극강의 우위',
      '무회전/슬로우 커브 및 싱커의 솟구치는 무브먼트'
    ],
    drawbacks: [
      '빠른 구속을 형성하기 어렵고 유연성과 하체 근력 요구도가 극도로 높음'
    ],
    idealPitcherOrBatter: '완급 조절형 테크니션, 릴리프 스페셜리스트'
  }
};

export const BATTING_FORM_GUIDES: Record<string, FormGuide> = {
  Straight: {
    key: 'Straight',
    name: '스탠다드',
    engName: 'Standard / Square Stance',
    category: 'Batting',
    stanceType: '타석 평행 스퀘어 스탠스',
    tagline: '모든 코스에 즉각 대응하는 정석 타격 폼',
    description: '양발을 홈플레이트와 평행하게 두고 서서 가장 안정적인 균형으로 스윙을 준비하는 정석 폼입니다. 기복 없는 컨택트와 존 대처 능력을 자랑합니다.',
    visualCue: '양발을 나란히 두고 어깨너비로 균형을 잡은 채 간결하게 배트를 세워 준비하는 정자세',
    characteristics: [
      '가장 이상적인 밸런스와 중심 이동',
      '스트라이크 존 전 구역에 대한 고른 대응력',
      '기복 없는 꾸준한 타격 생산성'
    ],
    advantages: [
      '몸쪽과 바깥쪽 공 모두에 유연하게 대처 가능',
      '스윙 메커니즘 붕괴 위험이 가장 적음'
    ],
    drawbacks: [
      '특정 코스나 파워에 특화된 폭발력보다는 기본기 위주'
    ],
    idealPitcherOrBatter: '교타자, 3번 타자, 테이블세터 올라운더'
  },
  Open: {
    key: 'Open',
    name: '오픈 스탠스',
    engName: 'Open Stance',
    category: 'Batting',
    stanceType: '앞발을 열어 투수를 정면 응시',
    tagline: '넓은 시야 확보와 몸쪽 공 파워 통타에 최적화',
    description: '앞발을 홈플레이트 바깥쪽으로 열어 서서 투수를 양 눈으로 온전히 바라보며 릴리스 포인트를 정밀하게 포착하는 폼입니다. 몸쪽 공을 시원하게 당겨치는 데 특화되어 있습니다.',
    visualCue: '앞발을 바깥쪽으로 열어 상체를 투수 쪽으로 더 많이 향하게 한 채 투구 궤적을 넓게 바라보는 자세',
    characteristics: [
      '양안 시야 확보로 투수 릴리스 포인트 포착 용이',
      '몸쪽 패스트볼 공략 시 빠른 골반 회전 유도',
      '강력한 풀히팅(Pull-Hitting) 타구 형성'
    ],
    advantages: [
      '몸쪽 빠른 공에 배트가 밀리지 않고 강한 장타로 연결',
      '변화구 궤적 파악에 유리'
    ],
    drawbacks: [
      '바깥쪽 먼 코스 공에 헛스윙 비율이 증가할 수 있음'
    ],
    idealPitcherOrBatter: '몸쪽 공 킬러, 풀히터 강타자'
  },
  LegKick: {
    key: 'LegKick',
    name: '레그킥',
    engName: 'High Leg Kick',
    category: 'Batting',
    stanceType: '다이내믹한 앞다리 리프팅 폼',
    tagline: '폭발적인 체중 이동으로 담장을 넘기는 홈런 타자의 상징',
    description: '투수의 투구 동작에 맞춰 앞다리를 가슴 높이까지 높게 들어 올린 후, 체중을 실어 전방으로 폭발적인 회전력을 만들어내는 폼입니다. 최상급 비거리와 장타력을 만들어냅니다.',
    visualCue: '앞다리를 호쾌하게 번쩍 들어 올려 팽팽한 장전 상태를 만든 뒤 강력하게 배트를 휘두르는 동작',
    characteristics: [
      '극대화된 체중 이동과 배트 스피드',
      '타구 속도 및 비거리 대폭 증가',
      '장타율과 홈런 생산력 극대화'
    ],
    advantages: [
      '정타 시 KBO/MLB급 괴물 같은 타구 속도와 최장 비거리 양산',
      '투수의 타이밍을 뺏는 위압감'
    ],
    drawbacks: [
      '타이밍 잡기가 까다롭고 빠른 강속구에 타이밍이 늦어 헛스윙이 늘어날 수 있음'
    ],
    idealPitcherOrBatter: '클린업 4번 타자, 거포형 홈런 슬러거'
  },
  ToeTap: {
    key: 'ToeTap',
    name: '토탭',
    engName: 'Toe-Tap Stance',
    category: 'Batting',
    stanceType: '발끝 탭으로 정밀한 타이밍 제어',
    tagline: '머리 흔들림 없는 칼날 같은 선구안과 라인드라이브 양산',
    description: '스윙 직전 앞발 끝(Toe)으로 지면을 가볍게 톡 치며 타이밍을 맞추는 폼입니다. 머리의 상하 움직임을 최소화하여 뛰어난 선구안과 날카로운 라인드라이브 타구를 만들어냅니다.',
    visualCue: '앞발을 가볍게 탭(Tap)하여 템포를 조절한 뒤 중심을 안정적으로 유지하며 컴팩트하게 스윙하는 동작',
    characteristics: [
      '머리 흔들림 최소화로 선구안 극대화',
      '빠른 볼과 변화구 타이밍 조절에 탁월',
      '총알 같은 라인드라이브 타구 생성'
    ],
    advantages: [
      '삼진율이 매우 낮고 높은 출루율과 정교한 타율 유지',
      '다양한 구종의 브레이킹 포인트 파악에 최적'
    ],
    drawbacks: [
      '레그킥에 비해 순수 비거리나 파워의 폭발력은 약간 낮음'
    ],
    idealPitcherOrBatter: '스프레이 히터, 2번/3번 타자, 정교한 중장거리 타자'
  }
};

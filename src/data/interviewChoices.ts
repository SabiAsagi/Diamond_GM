export interface InterviewChoiceOption {
  id: string;
  title: string;
  dialogue: string;
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
    academics?: number;
    fame?: number;
    relationshipCoach?: number;
    relationshipTeam?: number;
    relationshipFriends?: number;
    relationshipFamily?: number;
  };
  gainedTrait: string;
  traitDescription: string;
  icon: string;
}

export interface InterviewQuestion {
  step: number;
  questionTitle: string;
  questionDialogue: string;
  options: InterviewChoiceOption[];
}

/**
 * 3단계 연속 질문 세트 (A: 목표/각오 + B: 야구관/플레이스타일 + C: 팀내 태도/역할)
 */
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // 1단계: 야구를 향한 궁극적인 목표 (세트 A 기반)
  {
    step: 1,
    questionTitle: '질문 1. 야구를 향한 궁극적인 목표',
    questionDialogue: '"자네는 어떤 각오와 목표를 품고 우리 고교 야구부 유니폼을 입게 되었나?"',
    options: [
      {
        id: 'q1_pro_bound',
        title: 'KBO 1라운드 프로 지명',
        dialogue: '"반드시 KBO 신인 드래프트 1라운드에 지명되어 대한민국 최고의 프로 선수가 되겠습니다!"',
        coachReply: '호기롭군! 높은 목표의식이야말로 프로를 향한 가장 강력한 연료지. 스카우트들의 눈길을 사로잡도록 집중 육성해보세.',
        statBoosts: { relationshipCoach: 5, fame: 6, condition: 5 },
        gainedTrait: '프로지망',
        traitDescription: '스카우트 주목도 및 전국 인지도 가산 보정',
        icon: '👑',
      },
      {
        id: 'q1_team_first',
        title: '메이저 전국대회 우승 헌신',
        dialogue: '"개인 성적보다 학교의 전국대회 우승기를 휘날리기 위해 모든 것을 바치겠습니다!"',
        coachReply: '진정한 원팀 플레이어야! 자네 같은 선수가 더그아웃에 있을 때 팀은 챔피언이 되는 법이지. 든든하구먼.',
        statBoosts: { relationshipCoach: 8, relationshipTeam: 8, condition: 10 },
        gainedTrait: '팀퍼스트',
        traitDescription: '팀 신뢰 및 감독 신뢰도 상승치 20% 보너스',
        icon: '🏆',
      },
      {
        id: 'q1_grit_spirit',
        title: '포기를 모르는 잡초 근성',
        dialogue: '"어떤 혹독한 훈련과 시련이 닥쳐도 절대 꺾이지 않고 끝까지 악착같이 버텨내겠습니다!"',
        coachReply: '그 눈빛이 마음에 드는군. 야구는 9회 투아웃부터라는 말처럼, 끈기 있는 자가 마침내 승리하는 법일세.',
        statBoosts: { stamina: 5, condition: 15, relationshipCoach: 4 },
        gainedTrait: '잡초근성',
        traitDescription: '스태미너 고갈 시 훈련 페널티 감소 및 슬럼프 저항',
        icon: '🛡️',
      },
      {
        id: 'q1_pure_passion',
        title: '야구를 향한 순수한 열정',
        dialogue: '"그냥 야구가 미치도록 좋습니다! 매일 그라운드에서 흙먼지를 마시며 성장하고 싶습니다!"',
        coachReply: '순수한 즐거움을 아는 자는 그 누구도 이길 수 없지. 자네의 그 맑은 열정을 소중히 지켜주겠네.',
        statBoosts: { condition: 20, relationshipFriends: 6 },
        gainedTrait: '야구소년',
        traitDescription: '휴식 및 취미 활동 시 멘탈/컨디션 회복량 대폭 증가',
        icon: '⚾',
      },
    ],
  },
  {
    step: 4,
    questionTitle: '질문 4. 곁에서 힘이 되어주는 가족',
    questionDialogue: '“힘든 고교 생활을 버티게 해줄 가족이나 보호자는 누구인가? 내가 알아두면 좋겠군.”',
    options: [
      { id:'q4_parents', title:'어머니와 아버지', dialogue:'“두 분 모두 제 꿈을 응원해 주십니다.”', coachReply:'든든한 버팀목이 있군. 감사한 마음을 잊지 말게.', statBoosts:{ relationshipFamily:8, condition:5 }, gainedTrait:'가족의응원', traitDescription:'가족 활동 회복 보너스', icon:'🏠' },
      { id:'q4_grandma', title:'할머니 손에서 성장', dialogue:'“할머니께서 저를 키워주셨습니다. 꼭 보답하고 싶습니다.”', coachReply:'그 마음이 자네를 더욱 단단하게 만들 걸세.', statBoosts:{ relationshipFamily:10, condition:8 }, gainedTrait:'굳센효심', traitDescription:'위기 상황 멘탈 저항', icon:'💐' },
      { id:'q4_older', title:'누나 또는 형', dialogue:'“늘 앞에서 길을 보여주는 누나·형이 있습니다.”', coachReply:'좋은 조언자를 두었군. 힘들 땐 혼자 참지 말게.', statBoosts:{ relationshipFamily:7, academics:3 }, gainedTrait:'든든한조언', traitDescription:'진로 이벤트 보너스', icon:'🧭' },
      { id:'q4_younger', title:'지켜주고 싶은 동생', dialogue:'“저를 자랑스러워하는 동생에게 멋진 선수가 되고 싶습니다.”', coachReply:'책임감은 선수를 성장시키는 큰 힘이지.', statBoosts:{ relationshipFamily:7, condition:6 }, gainedTrait:'맏이의책임', traitDescription:'중요 경기 집중력 보너스', icon:'🌱' },
    ],
  },

  // 2단계: 야구관 및 플레이 스타일 (세트 B 기반)
  {
    step: 2,
    questionTitle: '질문 2. 지향하는 야구 철학과 플레이 스타일',
    questionDialogue: '"자네가 생각하는 이상적인 야구란 무엇이며, 그라운드에서 어떤 플레이를 보여줄 텐가?"',
    options: [
      {
        id: 'q2_smart_baseball',
        title: '데이터와 수 싸움의 스마트 야구',
        dialogue: '"철저한 전력 분석과 볼카운트 수 싸움으로 상대를 두뇌로 제압하는 스마트 야구입니다."',
        coachReply: '영리하군! 현대 야구는 정보와 두뇌의 승부지. 자네의 뛰어난 야구 지능을 극대화시켜 주겠네.',
        statBoosts: { academics: 8, control: 2, eye: 2, relationshipCoach: 5 },
        gainedTrait: '스마트플레이',
        traitDescription: '상대 분석 및 시험 준비 활동 시 추가 효율',
        icon: '🧠',
      },
      {
        id: 'q2_physical_power',
        title: '압도적인 힘과 피지컬 야구',
        dialogue: '"피와 땀으로 빚어낸 강력한 피지컬로 상대를 힘으로 찍어누르는 파워풀한 야구입니다."',
        coachReply: '탄탄한 체격과 폭발력이야말로 마운드와 타석을 지배하는 무기지! 강철 하체를 만들어주겠네.',
        statBoosts: { stuff: 2, power: 2, stamina: 4, relationshipCoach: 4 },
        gainedTrait: '피지컬괴물',
        traitDescription: '웨이트 및 피칭/타격 훈련 시 추가 스탯 상승',
        icon: '🏋️',
      },
      {
        id: 'q2_one_team_spirit',
        title: '동료들과 하나 되는 원팀 스피릿',
        dialogue: '"9명이 눈빛만 봐도 호흡이 맞는 끈끈한 수비와 조직력으로 기적을 만드는 팀 스포츠입니다."',
        coachReply: '훌륭한 통찰이야. 야구는 혼자 하는 게 아니지. 자네가 우리 팀 조직력의 중심축이 되어주게.',
        statBoosts: { relationshipTeam: 10, relationshipFriends: 8, relationshipCoach: 5 },
        gainedTrait: '원팀스피릿',
        traitDescription: '팀원과의 관계도에 따라 실전 경기에서 클러치 능력 보정',
        icon: '🤝',
      },
      {
        id: 'q2_family_duty',
        title: '가족을 향한 보답과 책임감',
        dialogue: '"새벽마다 도시락을 싸주시는 부모님을 생각하며, 무거운 책임감을 갖고 던지고 치겠습니다."',
        coachReply: '가슴이 뭉클하군. 든든한 가족의 사랑을 아는 선수는 결코 쉽게 무너지지 않는 법이지.',
        statBoosts: { relationshipFamily: 12, condition: 10, relationshipCoach: 5 },
        gainedTrait: '효심과책임',
        traitDescription: '가족과의 소통 시 멘탈 회복 극대화 및 집중력 증가',
        icon: '🏠',
      },
    ],
  },

  // 3단계: 팀 내 태도 및 역할 (세트 C 기반)
  {
    step: 3,
    questionTitle: '질문 3. 팀에서의 역할과 마음가짐',
    questionDialogue: '"마지막으로 묻겠네. 자네는 고교 3년간 우리 야구부에서 어떤 존재로 기억되고 싶나?"',
    options: [
      {
        id: 'q3_coach_disciple',
        title: '스승의 가르침을 흡수하는 충직한 제자',
        dialogue: '"감독님의 지도 방식을 전폭적으로 믿고 따르겠습니다. 무엇이든 스펀지처럼 배우겠습니다!"',
        coachReply: '스승으로서 더없이 고마운 말이군. 내 모든 야구 노하우를 자네에게 아낌없이 쏟아붓겠네.',
        statBoosts: { relationshipCoach: 12, condition: 10 },
        gainedTrait: '감독의애제자',
        traitDescription: '감독 면담 시 보너스 스탯 증폭 및 기용 신뢰도 최고치',
        icon: '👨‍🏫',
      },
      {
        id: 'q3_fierce_freshman',
        title: '선배도 뛰어넘는 패기의 신입생',
        dialogue: '"선배들이라고 양보할 생각 없습니다! 당당히 실력으로 주전 자리를 빼앗아 오겠습니다!"',
        coachReply: '하하하! 당돌하지만 패기 넘쳐서 좋군. 실력으로 증명해보게. 기회는 공평하게 줄 테니!',
        statBoosts: { fame: 6, condition: 10, speed: 2 },
        gainedTrait: '패기의신입',
        traitDescription: '주전 경쟁도 높은 학교에서도 빠른 1군 발탁 기회 부여',
        icon: '⚡',
      },
      {
        id: 'q3_scholar_athlete',
        title: '공부와 야구를 모두 잡는 문무겸비',
        dialogue: '"그라운드 밖에서도 모범을 보여, 학업과 인성을 두루 갖춘 당당한 학생 선수가 되겠습니다."',
        coachReply: '학생 야구의 본질을 아는군! 프로에 가든 사회에 나가든 자네의 지성과 인품은 큰 빛이 될 걸세.',
        statBoosts: { academics: 12, relationshipFriends: 6, condition: 10 },
        gainedTrait: '문무겸비',
        traitDescription: '시험 기간 페널티 무효화 및 학업 성적 우수 장학금',
        icon: '📜',
      },
      {
        id: 'q3_mood_maker',
        title: '더그아웃을 뜨겁게 달구는 무드메이커',
        dialogue: '"언제나 파이팅 넘치게 소리치며, 지친 동료들의 사기를 북돋우는 팀의 비타민이 되겠습니다!"',
        coachReply: '더그아웃의 활력소로군! 힘든 경기 흐름을 한순간에 바꿀 수 있는 귀한 재능이야.',
        statBoosts: { relationshipFriends: 10, relationshipTeam: 10, condition: 15 },
        gainedTrait: '분위기메이커',
        traitDescription: '팀 전체 컨디션 상승 유도 및 동료들과의 인연 보너스',
        icon: '🎉',
      },
    ],
  },
];

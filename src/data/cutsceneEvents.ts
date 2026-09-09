import type { EventCutscene } from '../types/randomEvent';

const BASE_CUTSCENES: EventCutscene[] = [
  { id:'homeroom_checkin', title:'담임 선생님의 조용한 배려', subtitle:'수업과 원정 일정을 함께 챙겨주십니다.', dialogue:'“운동도 중요하지만 졸업까지 네 생활 전체를 같이 챙겨보자.”', speakerName:'담임 선생님', speakerRole:'Homeroom Teacher', icon:'📚', baseChance:.09, cooldownDays:12, effect:p=>({statChanges:{academics:Math.min(100,p.academics+3),relationshipFriends:Math.min(100,p.relationshipFriends+2)},logMessage:'담임 선생님과 학업 계획을 정리했습니다.'}) },
  { id:'pe_recovery', title:'체육 선생님의 회복 루틴', subtitle:'훈련 전후 몸 관리법을 배웁니다.', dialogue:'“강하게 훈련하는 것만큼 제대로 회복하는 것도 실력이다.”', speakerName:'체육 선생님', speakerRole:'Physical Education', icon:'🏃', baseChance:.08, cooldownDays:14, conditions:p=>p.condition<65, effect:p=>({statChanges:{condition:Math.min(100,p.condition+12),stamina:Math.min(100,p.stamina+1)},logMessage:'회복 루틴을 배워 컨디션을 되찾았습니다.'}) },
  { id:'childhood_date', title:'소꿉친구와의 첫 데이트', subtitle:'오랜 친구 사이에 새로운 감정이 피어납니다.', dialogue:'“야구 이야기 말고… 오늘은 우리 이야기만 하면 안 될까?”', speakerName:'한서윤', speakerRole:'소꿉친구', icon:'🌸', baseChance:.06, cooldownDays:30, conditions:p=>(p.relationshipFriends||0)>=75, effect:p=>({statChanges:{relationshipFriends:Math.min(100,p.relationshipFriends+6),condition:Math.min(100,p.condition+10)},logMessage:'소꿉친구와 특별한 시간을 보냈습니다. 연애 인연이 깊어졌습니다.'}) },
  { id:'junior_advice', title:'후배의 고민 상담', subtitle:'이제는 누군가의 선배가 되었습니다.', dialogue:'“선배님처럼 중요한 순간에도 흔들리지 않으려면 어떻게 해야 해요?”', speakerName:'이준서', speakerRole:'야구부 후배', icon:'🌱', baseChance:.1, cooldownDays:15, conditions:p=>(p.grade||1)>1, effect:p=>({statChanges:{relationshipTeam:Math.min(100,p.relationshipTeam+5),condition:Math.min(100,p.condition+5)},logMessage:'후배에게 조언하며 스스로의 기본도 되돌아봤습니다.'}) },
  { id:'graduated_senior_call', title:'졸업한 선배에게 온 전화', subtitle:'프로·대학·사회인 야구의 현실적인 이야기를 듣습니다.', dialogue:'“어디로 가든 네 야구가 끝나는 건 아니야. 지금 네 선택에 집중해.”', speakerName:'졸업한 주장 선배', speakerRole:'Alumni Mentor', icon:'📞', baseChance:.09, cooldownDays:20, conditions:p=>(p.grade||1)===3&&(p.relationshipTeam||0)>=70, effect:p=>({statChanges:{fame:Math.min(100,(p.fame||0)+2),condition:Math.min(100,p.condition+8)},logMessage:'졸업 선배의 진로 조언으로 목표가 선명해졌습니다.'}) },
  {
    id: 'scout_secret_visit',
    title: 'KBO 프로 스카우트의 밀착 관찰',
    subtitle: '백스톱 뒤에서 스피드건을 든 프로 스카우트가 자네를 지켜봅니다.',
    dialogue: '"저 녀석 메커니즘이 제법인데? 다음 주말리그 경기 때 스카우트 팀장님께도 보고서를 올려야겠어."',
    speakerName: 'KBO 구단 스카우트',
    speakerRole: '프로 스카우팅 팀',
    icon: '📋',
    baseChance: 0.12, // 12%
    cooldownDays: 7,
    conditions: player => (player.fame || 0) >= 15,
    effect: player => ({
      statChanges: {
        fame: (player.fame || 10) + 4,
        condition: Math.min(100, player.condition + 5),
      },
      logMessage: '👀 프로 스카우트가 연습장에 방문하여 자네의 플레이를 스카우팅 리포트에 기록했습니다! (인지도 +4)',
    }),
  },
  {
    id: 'coach_one_point_lesson',
    title: '감독님의 방과 후 원포인트 레슨',
    subtitle: '해가 진 뒤 남아서 1:1로 릴리스 포인트와 타격 궤적을 짚어주십니다.',
    dialogue: '"자네의 릴리스 각도가 조금 흔들리는군. 하체를 단단히 디디고 팔을 채는 느낌을 기억하게."',
    speakerName: '담당 감독',
    speakerRole: 'Head Coach',
    icon: '👨‍🏫',
    baseChance: 0.15,
    cooldownDays: 8,
    conditions: player => (player.relationshipCoach || 50) >= 45,
    effect: player => {
      const isP = player.position === 'P';
      return {
        statChanges: {
          control: isP ? player.control + 2 : player.control,
          contact: !isP ? player.contact + 2 : player.contact,
          relationshipCoach: (player.relationshipCoach || 50) + 3,
        },
        logMessage: `✨ 감독님이 1:1 밀착 교정으로 밸런스를 바로잡아 주셨습니다. (${isP ? '제구 +2' : '컨택 +2'}, 감독신뢰 +3)`,
      };
    },
  },
  {
    id: 'senior_secret_pep_talk',
    title: '3학년 주전 선배의 격려와 조언',
    subtitle: '고교 야구 메이저 대회를 앞두고 선배가 실전 노하우를 전수합니다.',
    dialogue: '"처음엔 다 떨려. 하지만 마운드나 타석에선 그냥 나 자신과 공만 믿는 거야. 넌 충분히 잘하고 있어."',
    speakerName: '3학년 주장 선배',
    speakerRole: 'Team Captain',
    icon: '🤝',
    baseChance: 0.14,
    cooldownDays: 7,
    effect: player => ({
      statChanges: {
        condition: Math.min(100, player.condition + 15),
        relationshipTeam: (player.relationshipTeam || 50) + 5,
      },
      logMessage: '💪 주전 선배의 든든한 격려를 받으며 마인드컨트롤과 멘탈이 크게 회복되었습니다. (컨디션 +15)',
    }),
  },
  {
    id: 'rival_school_provocation',
    title: '라이벌 고교 에이스와의 조우',
    subtitle: '경기장 복도에서 마주친 라이벌 학교 주전이 강한 눈빛을 보냅니다.',
    dialogue: '"이번 주말리그에서 맞붙게 되겠군. 어디 네 공/배트가 얼마나 대단한지 똑똑히 지켜보겠다."',
    speakerName: '라이벌 고교 유망주',
    speakerRole: 'Rival Ace',
    icon: '⚔️',
    baseChance: 0.10,
    cooldownDays: 10,
    effect: player => ({
      statChanges: {
        stuff: player.position === 'P' ? player.stuff + 1 : player.stuff,
        power: player.position !== 'P' ? player.power + 1 : player.power,
        fame: (player.fame || 10) + 2,
      },
      logMessage: '🔥 라이벌과의 팽팽한 신경전으로 가슴속 투지가 불타오릅니다! (승부욕 및 능력치 상승)',
    }),
  },
];

export const CUTSCENE_EVENTS_POOL: EventCutscene[] = [
 ...BASE_CUTSCENES.map(e=>({...e,categories:(e.id.includes('coach')||e.id.includes('scout')||e.id==='pe_recovery'?['training','special']:e.id==='homeroom_checkin'?['study']:['relationship']) as EventCutscene['categories']})),
 {id:'pitch_grip_discovery',title:'손끝에서 달라진 공',subtitle:'불펜 · 훈련을 마친 뒤',dialogue:'방금 공은 회전이 달랐어. 손가락이 걸리는 느낌을 기억해 봐. 무리해서 던지기보다 그립부터 함께 확인하자.',speakerName:'투수 코치',speakerRole:'투구 지도',icon:'⚾',baseChance:.22,cooldownDays:7,categories:['training'],conditions:p=>p.position==='P'||p.position==='TwoWay',effect:p=>({statChanges:{movement:Math.min(100,(p.movement??p.stuff)+2),control:Math.min(100,p.control+1)},logMessage:'그립을 복기했습니다. 무브먼트 +2 · 제구 +1'})},
 {id:'two_strike_lesson',title:'마지막 한 공을 버티는 법',subtitle:'배팅 케이지 · 오후',dialogue:'두 스트라이크라고 조급해질 필요 없어. 배트를 짧게 잡고 바깥쪽 공은 끝까지 보자. 네 타석은 아직 끝나지 않았어.',speakerName:'타격 코치',speakerRole:'타격 지도',icon:'🏏',baseChance:.22,cooldownDays:7,categories:['training'],conditions:p=>p.position!=='P',effect:p=>({statChanges:{avoidK:Math.min(100,(p.avoidK??p.contact)+2),eye:Math.min(100,p.eye+1)},logMessage:'2스트라이크 접근법을 배웠습니다. 삼진 회피 +2 · 선구안 +1'})}
];

import { getBondScore } from '../types/bondScores';
import type { EventCutscene } from '../types/randomEvent';

const BASE_CUTSCENES: EventCutscene[] = [
  { id:'homeroom_checkin', title:'담임 선생님의 조용한 배려', subtitle:'수업과 원정 일정을 함께 챙겨주십니다.', dialogue:'“운동도 중요하지만 졸업까지 네 생활 전체를 같이 챙겨보자.”', speakerName:'담임 선생님', speakerRole:'Homeroom Teacher', icon:'📚', baseChance:.09, cooldownDays:12, effect:p=>({relationshipTargets: { teacher: 2 },statChanges:{academics:Math.min(100,p.academics+3)},logMessage:'담임 선생님과 학업 계획을 정리했습니다.'}) },
  { id:'pe_recovery', title:'체육 선생님의 회복 루틴', subtitle:'훈련 전후 몸 관리법을 배웁니다.', dialogue:'“강하게 훈련하는 것만큼 제대로 회복하는 것도 실력이다.”', speakerName:'체육 선생님', speakerRole:'Physical Education', icon:'🏃', baseChance:.08, cooldownDays:14, conditions:p=>p.condition<65, effect:p=>({statChanges:{condition:Math.min(100,p.condition+12),stamina:Math.min(100,p.stamina+1)},logMessage:'회복 루틴을 배워 컨디션을 되찾았습니다.'}) },
  { id:'childhood_date', title:'소꿉친구와의 첫 데이트', subtitle:'오랜 친구 사이에 새로운 감정이 피어납니다.', dialogue:'“야구 이야기 말고… 오늘은 우리 이야기만 하면 안 될까?”', speakerName:'한서윤', speakerRole:'소꿉친구', icon:'🌸', baseChance:.06, cooldownDays:30, conditions:p=>getBondScore(p,'childhood')>=75, effect:p=>({relationshipTargets: { childhood: 6 },statChanges:{condition:Math.min(100,p.condition+10)},logMessage:'소꿉친구와 특별한 시간을 보냈습니다. 연애 인연이 깊어졌습니다.'}) },
  { id:'junior_advice', title:'후배의 고민 상담', subtitle:'이제는 누군가의 선배가 되었습니다.', dialogue:'“선배님처럼 중요한 순간에도 흔들리지 않으려면 어떻게 해야 해요?”', speakerName:'이준서', speakerRole:'야구부 후배', icon:'🌱', baseChance:.1, cooldownDays:15, conditions:p=>(p.grade||1)>1, effect:p=>({relationshipTargets: { junior: 5 },statChanges:{condition:Math.min(100,p.condition+5)},logMessage:'후배에게 조언하며 스스로의 기본도 되돌아봤습니다.'}) },
  { id:'graduated_senior_call', title:'졸업한 선배에게 온 전화', subtitle:'프로·대학·사회인 야구의 현실적인 이야기를 듣습니다.', dialogue:'“어디로 가든 네 야구가 끝나는 건 아니야. 지금 네 선택에 집중해.”', speakerName:'졸업한 주장 선배', speakerRole:'Alumni Mentor', icon:'📞', baseChance:.09, cooldownDays:20, conditions:p=>(p.grade||1)===3&&getBondScore(p,'senior')>=70, effect:p=>({relationshipTargets:{senior:3},statChanges:{fame:Math.min(100,(p.fame||0)+2),condition:Math.min(100,p.condition+8)},logMessage:'졸업 선배의 진로 조언으로 목표가 선명해졌습니다.'}) },
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
    conditions: player => getBondScore(player,'coach') >= 45,
    effect: player => {
      const isP = player.position === 'P';
      return {
        relationshipTargets: { coach: 3 },
        statChanges: {
          control: isP ? player.control + 2 : player.control,
          contact: !isP ? player.contact + 2 : player.contact,
        },
        logMessage: `✨ 감독님이 1:1 밀착 교정으로 밸런스를 바로잡아 주셨습니다. (${isP ? '제구 +2' : '컨택 +2'}, 감독신뢰 +3)`,
      };
    },
  },
  {
    id: 'senior_secret_pep_talk',
    conditions: p => (p.grade ?? 1) < 3,
    title: '3학년 주전 선배의 격려와 조언',
    subtitle: '고교 야구 메이저 대회를 앞두고 선배가 실전 노하우를 전수합니다.',
    dialogue: '"처음엔 다 떨려. 하지만 마운드나 타석에선 그냥 나 자신과 공만 믿는 거야. 넌 충분히 잘하고 있어."',
    speakerName: '3학년 주장 선배',
    speakerRole: 'Team Captain',
    icon: '🤝',
    baseChance: 0.14,
    cooldownDays: 7,
    effect: player => ({
      relationshipTargets: { senior: 5 },
      statChanges: {
        condition: Math.min(100, player.condition + 15),
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

const EVENTS: EventCutscene[] = [
 ...BASE_CUTSCENES.map(e=>({...e,categories:(e.id.includes('coach')||e.id.includes('scout')||e.id==='pe_recovery'?['training','special']:e.id==='homeroom_checkin'?['study']:['relationship']) as EventCutscene['categories']})),
 {id:'pitch_grip_discovery',title:'손끝에서 달라진 공',subtitle:'불펜 · 훈련을 마친 뒤',dialogue:'방금 공은 회전이 달랐어. 손가락이 걸리는 느낌을 기억해 봐. 무리해서 던지기보다 그립부터 함께 확인하자.',speakerName:'투수 코치',speakerRole:'투구 지도',icon:'⚾',baseChance:.22,cooldownDays:7,categories:['training'],conditions:p=>p.position==='P'||p.position==='TwoWay',effect:p=>({relationshipTargets: { coach2: 3 },statChanges:{movement:Math.min(100,(p.movement??p.stuff)+2),control:Math.min(100,p.control+1)},logMessage:'그립을 복기했습니다. 무브먼트 +2 · 제구 +1'})},
 {id:'two_strike_lesson',title:'마지막 한 공을 버티는 법',subtitle:'배팅 케이지 · 오후',dialogue:'두 스트라이크라고 조급해질 필요 없어. 배트를 짧게 잡고 바깥쪽 공은 끝까지 보자. 네 타석은 아직 끝나지 않았어.',speakerName:'타격 코치',speakerRole:'타격 지도',icon:'🏏',baseChance:.22,cooldownDays:7,categories:['training'],conditions:p=>p.position!=='P',effect:p=>({relationshipTargets: { coach2: 3 },statChanges:{avoidK:Math.min(100,(p.avoidK??p.contact)+2),eye:Math.min(100,p.eye+1)},logMessage:'2스트라이크 접근법을 배웠습니다. 삼진 회피 +2 · 선구안 +1'})}
];


// Each scene owns its dialogue, branches and rewards. No global consolation reward.
const story: Record<string, { portrait: string; reply: string; ending: string; first?: string; alternative?: [string, string, string, Partial<Record<'academics' | 'condition' | 'eye' | 'defense' | 'control' | 'stamina', number>>] }> = {
 homeroom_checkin: {portrait:'female-bob',reply:'원정이 겹치면 수업을 따라가기 어려워요.',ending:'그래서 같이 계획을 세우려는 거야. 어떤 도움이 필요하니?',first:'보충 공부 계획을 세운다',alternative:['notes','수업 필기부터 정리한다','필기를 나누니 빠뜨린 부분이 보이기 시작했다.',{academics:1,condition:6}]},
 pe_recovery: {portrait:'male-buzz',reply:'요즘은 자고 일어나도 몸이 무거워요.',ending:'몸이 보내는 신호를 무시하지 마. 오늘은 회복 방법부터 고르자.',first:'스트레칭 루틴을 배운다',alternative:['breathing','호흡과 가벼운 산책을 한다','호흡을 고르며 긴장을 풀었다.',{condition:18}]},
 childhood_date: {portrait:'female-long',reply:'좋아. 오늘은 훈련 이야기를 잠깐 내려놓을게.',ending:'그럼 어디부터 가 볼까? 너랑 같이 고르고 싶어.',first:'공원을 걸으며 속마음을 이야기한다',alternative:['cafe','카페에서 다음 시험을 함께 준비한다','서로 문제를 내 주다 보니 어느새 웃음이 났다.',{academics:3,condition:4}]},
 junior_advice: {portrait:'male-spiky',reply:'나도 떨려. 실수를 숨기기보다 다음 공에 집중하려고 해.',ending:'그럼 선배는 긴장될 때 구체적으로 뭘 하세요?',first:'실수했던 경험을 솔직하게 들려준다',alternative:['catch','캐치볼로 기본 자세를 함께 점검한다','차근차근 공을 주고받으며 서로의 자세를 점검했다.',{defense:2}]},
 graduated_senior_call: {portrait:'male-parted',reply:'선배도 진로를 정할 때 많이 고민했어요?',ending:'물론이지. 남들과 속도가 달라도 괜찮아. 네가 쌓은 시간은 사라지지 않으니까.'},
 scout_secret_visit: {portrait:'male-wavy',reply:'백스톱 뒤에 처음 보는 사람이 있네. 평소처럼 집중하자.',ending:'기록만이 아니라 다음 플레이를 준비하는 자세까지 보고 있다네.'},
 coach_one_point_lesson: {portrait:'male-buzz',reply:'힘을 주려고 하면 오히려 동작이 흔들려요.',ending:'힘보다 타이밍이 먼저야. 직접 몸으로 익혀도 좋고, 영상으로 비교해 봐도 좋다.',first:'동작을 천천히 반복하며 교정한다',alternative:['video','좋았던 동작과 영상을 비교한다','좋은 동작의 차이를 눈으로 익혔다.',{eye:2}]},
 senior_secret_pep_talk: {portrait:'male-parted',reply:'큰 경기에서는 첫 실수가 자꾸 머리에 남아요.',ending:'그럴수록 할 일을 하나로 줄여 봐. 네가 준비한 걸 믿어.',first:'선배의 경험을 끝까지 듣는다',alternative:['routine','경기 전 루틴을 함께 연습한다','짧은 준비 루틴을 반복하며 몸의 균형을 잡았다.',{stamina:2,condition:3}]},
 rival_school_provocation: {portrait:'male-spiky',reply:'나도 기다리고 있어. 지난번과는 다를 거야.',ending:'좋아. 서로 제대로 준비해서 만나자.',first:'다음 맞대결을 약속한다',alternative:['observe','상대의 준비 동작을 눈여겨본다','말보다 움직임에 집중해 상대의 습관을 기억했다.',{eye:2}]},
 pitch_grip_discovery: {portrait:'male-buzz',reply:'손끝에 걸리는 느낌을 다시 확인하고 싶어요.',ending:'좋아. 그립과 릴리스 중 어디부터 살펴볼까?',first:'새로운 그립을 복기한다',alternative:['release','릴리스 위치를 일정하게 맞춘다','릴리스 위치를 맞추며 제구 감각을 다듬었다.',{control:2}]},
 two_strike_lesson: {portrait:'male-wavy',reply:'놓치면 안 된다는 생각에 너무 일찍 배트가 나가요.',ending:'한 공을 더 보는 것도 선택이야. 오늘은 어떤 접근을 연습해 볼까?',first:'짧은 스윙으로 공을 맞히는 연습을 한다',alternative:['watch','스트라이크와 볼을 끝까지 구별한다','공을 오래 보며 존을 구별하는 감각을 익혔다.',{eye:3}]},
};
export const CUTSCENE_EVENTS_POOL: EventCutscene[] = EVENTS.map(event => {
 const scene = story[event.id];
 const alternative = scene.alternative;
 const choices: EventCutscene['choices'] = scene.first ? [{id:'learn',label:scene.first,response:({homeroom_checkin:'좋아. 원정 중에도 할 수 있는 짧은 복습 계획부터 세워 보자.',pe_recovery:'숨을 참지 말고 천천히 늘려 봐. 몸이 한결 가벼워질 거야.',childhood_date:'이렇게 네 이야기를 들으니까 더 가까워진 것 같아. 다음에도 같이 걷자.',junior_advice:'선배도 그런 적이 있었군요. 저도 다음 공에 집중해 볼게요!',coach_one_point_lesson:'바로 그 느낌이다. 빠르게 하기보다 정확한 동작을 기억해.',senior_secret_pep_talk:'조급해하지 마. 넌 네 생각보다 훨씬 잘 준비되어 있어.',rival_school_provocation:'약속이다. 다음에는 그라운드에서 답을 보여 줘.',pitch_grip_discovery:'회전이 안정됐네. 오늘 손끝의 감각을 꼭 기록해 둬.',two_strike_lesson:'좋아, 마지막까지 공을 봤잖아. 그 짧은 스윙을 기억하자.'} as Record<string,string>)[event.id] ?? scene.ending,effect:event.effect}] : undefined;
 if (choices && alternative) choices.push({id:alternative[0],label:alternative[1],response:alternative[2],effect:player=>({
   statChanges:Object.fromEntries(Object.entries(alternative[3]).map(([key,delta])=>[key,Math.min(100,(Number(player[key as keyof typeof player])||0)+delta)])),
   relationshipTargets:event.id==='childhood_date'?{childhood:3}:event.id==='junior_advice'?{junior:3}:undefined,
   logMessage:alternative[2],
 })});
 if(event.id==='homeroom_checkin' && choices)choices.push({id:'consult',label:'진로 고민을 털어놓는다',response:'네가 고민하는 걸 알려줘서 고맙다. 진로는 함께 천천히 알아보자.',effect:p=>({statChanges:{condition:Math.min(100,p.condition+8)},relationshipTargets:{teacher:4},logMessage:'담임 선생님에게 진로 고민을 이야기했습니다.'})});
 return {...event,portrait:event.id==='homeroom_checkin'?'assets/characters/teacher.webp':['pe_recovery','coach_one_point_lesson','pitch_grip_discovery','two_strike_lesson','scout_secret_visit'].includes(event.id)?'assets/characters/coach.webp':scene.portrait === 'female-long' ? 'assets/portraits/female-long-v17.webp' : `assets/portraits/${scene.portrait}.png`,dialogueLines:[{speaker:'npc',text:event.dialogue},{speaker:'player',text:scene.reply},{speaker:'npc',text:scene.ending}],choices};
});

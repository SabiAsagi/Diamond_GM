import type { Player } from '../types';
import type { GameDate } from '../types/calendar';
import { BOND_NAMES, getRelScore, type BondId } from '../types/bondScores';
import type { EventCutscene } from '../types/randomEvent';
import type { ActivityOption } from '../types/activity';
import { getHighSchoolDataByName } from './highSchools';
import { overallRating, EXTRA_RATINGS } from './playerDevelopment';

export type CareerRoute = 'university' | 'professional' | 'overseas' | 'club';
export interface CareerJourney {
  onboarding?: 'school' | 'team' | 'interview' | 'complete';
  met: BondId[];
  completedScenes: string[];
  trainingGrowth: Record<string, number>;
  lastGrowth?: string;
  offers: CareerRoute[];
  chosenRoute?: CareerRoute;
  ending?: { route: CareerRoute; title: string; text: string; overall: number; appearances: number };
}
export function createCareerJourney(): CareerJourney {
  return { onboarding: 'school', met: ['mother', 'father'], completedScenes: [], trainingGrowth: {}, offers: [] };
}
/** Old careers keep their existing acquaintances and all accumulated scores. */
export function migrateCareerJourney(p: Player): CareerJourney {
  return p.careerJourney ?? { ...createCareerJourney(), onboarding: undefined, met: Object.keys(BOND_NAMES) as BondId[] };
}
export const hasMet = (p: Player, id: string) => !p.careerJourney || p.careerJourney.met.includes(id as BondId);
export function canDoSocialActivity(p: Player, option: Pick<ActivityOption, 'relationshipTargets'>): boolean {
  return Object.keys(option.relationshipTargets ?? {}).every(id => hasMet(p, id));
}
const meet = (id: BondId, day: number, title: string, dialogue: string, grade = 1): EventCutscene => ({
  id: 'meet_' + id, title, subtitle: '첫 만남 · 대화를 마치면 인연에 추가됩니다',
  speakerId: id, speakerName: id === 'coach' || id === 'coach2' || id === 'teacher' || id === 'pe' ? BOND_NAMES[id] : `{${id}}`,
  speakerRole: '새로운 인연', icon: '🤝', dialogue,
  dialogueLines: [{ speaker: 'npc', text: dialogue }, { speaker: 'player', text: '앞으로 잘 부탁드려요. 함께 지내면서 천천히 알아가고 싶어요.' }],
  baseChance: 1, cooldownDays: 9999,
  conditions: (p, date) => !hasMet(p, id) && date.grade >= grade && (date.grade > grade || date.month !== 3 || date.day >= day),
  effect: p => ({ statChanges: { careerJourney: { ...migrateCareerJourney(p), met: [...new Set([...migrateCareerJourney(p).met, id])] } }, relationshipTargets: { [id]: 2 }, logMessage: `${['coach','coach2','teacher','pe'].includes(id) ? BOND_NAMES[id] : `{${id}}`} 인연이 시작되었습니다.` }),
});
const orientation = (stage: 'school' | 'team', title: string, members: BondId[], lines: NonNullable<EventCutscene['dialogueLines']>): EventCutscene => ({
  id: `meet_orientation_${stage}`, title, subtitle: stage === 'school' ? '입학식 · 교실에서 처음 만나는 사람들' : '입학식 후 · 야구부 첫 미팅',
  speakerId: members[0], speakerName: BOND_NAMES[members[0]], speakerRole: '첫날 소개', icon: '🤝',
  dialogue: lines[0].text, dialogueLines: lines, baseChance: 1, cooldownDays: 9999,
  conditions: p => !p.interviewCompleted && p.careerJourney?.onboarding === stage,
  effect: p => ({ statChanges: { careerJourney: { ...migrateCareerJourney(p), onboarding: stage === 'school' ? 'team' : 'interview', met: [...new Set([...migrateCareerJourney(p).met, ...members])] } }, relationshipTargets: Object.fromEntries(members.map(id => [id,2])), logMessage: `${title} — ${stage === 'school' ? '담임·반장·짝꿍' : '감독·기술 코치·주장·동기'}와 인사를 나눴습니다.` }),
});
export const ORIENTATION_SCENES = [
  orientation('school', '입학식, 우리 반의 첫 만남', ['teacher','classLeader','deskmate'], [
    { speaker: 'npc', speakerId: 'teacher', text: '입학을 축하해요. 입학식을 마쳤으니 이제 우리 반 친구들과 인사를 나눠 볼까요? 선생님은 여러분의 담임이에요.' },
    { speaker: 'npc', speakerId: 'classLeader', text: '안녕, 반장을 맡은 {classLeader|이야}. 학급 공지와 수업 자료를 챙길게. 원정으로 자리를 비우면 필요한 내용을 같이 정리하자.' },
    { speaker: 'npc', speakerId: 'deskmate', text: '나는 {deskmate|이야}. 네 옆자리에 앉게 됐어. 반 친구들과 점심도 같이 먹자!' },
    { speaker: 'player', text: '잘 부탁해! 야구도 학교생활도 열심히 해 볼게. 반 친구들의 자기소개를 들으니 교실이 조금 편해졌다.' },
    { speaker: 'npc', speakerId: 'teacher', text: '야구부 신입생은 이제 야구부 첫 미팅에 가면 돼요. 학교생활에서 어려운 일이 생기면 언제든 이야기해요.' },
  ]),
  orientation('team', '야구부, 첫 번째 미팅', ['coach','coach2','senior','peer'], [
    { speaker: 'npc', speakerId: 'coach', text: '교실에서 인사는 잘 나눴니? 이제 야구부에 온 걸 환영한다. 먼저 함께 훈련할 사람들을 소개하마.' },
    { speaker: 'npc', speakerId: 'coach2', text: '기술 코치다. 첫날부터 무리하지 말고, 네 자세와 회복 습관부터 함께 살펴보자.' },
    { speaker: 'npc', speakerId: 'senior', text: '주장 {senior|이야}. 운동장과 장비실은 내가 안내할게. 궁금한 건 편하게 물어봐.' },
    { speaker: 'npc', speakerId: 'peer', text: '나도 오늘 들어온 {peer|이야}. 같은 신입생끼리 잘해 보자!' },
    { speaker: 'player', text: '잘 부탁드립니다. 이제 팀 동료들과 함께 첫 시즌을 준비하고 싶어요.' },
    { speaker: 'npc', speakerId: 'coach', text: '팀 소개는 여기까지다. 이제 각자 어떤 선수가 되고 싶은지 면담해 보자.' },
  ]),
];
export const INTRODUCTION_SCENES: EventCutscene[] = [
  ...ORIENTATION_SCENES,
  meet('classLeader', 3, '우리 반 반장과의 인사', '반장 {classLeader|이야}. 학급 공지나 놓친 수업이 있으면 함께 정리하자.'),
  meet('coach', 2, '야구부 첫 인사', '우리 팀에 온 걸 환영한다. 결과보다 네가 준비하는 태도부터 보겠다.'),
  meet('teacher', 2, '처음 들어선 교실', '담임 선생님이야. 원정과 수업이 겹칠 때는 함께 계획을 세워 보자.'),
  meet('deskmate', 3, '옆자리의 첫 인사', '안녕, 나는 {deskmate|이야}. 같은 책상을 쓰게 됐네. 야구부라고 들었어!'),
  meet('coach2', 4, '그라운드에서 만난 기술 코치', '오늘부터 기술 훈련을 함께할 코치다. 먼저 네 동작을 보여줄래?'),
  meet('peer', 5, '함께 공을 줍는 동기', '나도 올해 들어왔어. 나는 {peer|이야}. 오늘 캐치볼 같이 할래?'),
  meet('senior', 7, '주장의 라커룸 안내', '주장 {senior|이야}. 모르는 건 물어봐. 신입이라고 혼자 버틸 필요 없어.'),
  meet('pe', 9, '체육관에서 배운 회복', '체육 선생님이야. 몸이 아프면 참지 말고 말하렴. 회복도 훈련이란다.'),
  meet('childhood', 10, '학교 앞에서 다시 만난 친구', '오랜만이네! 어릴 때 같이 놀던 {childhood|이야}. 새 학교 생활은 어때?'),
  meet('neighbor', 12, '동네 공원에서의 재회', '나 {neighbor|이야}. 요즘 운동장에서 안 보이더니 야구부에 들어갔구나!'),
  meet('rival', 15, '다른 학교의 같은 꿈', '나는 {rival|이야}. 같은 지역에서 뛰는 선수라며? 언젠가 그라운드에서 만나자.'),
  meet('junior', 2, '새 학년, 새로운 후배', '신입생 {junior|이에요}. 선배와 같이 훈련하게 돼서 기대돼요!', 2),
];

function chapter(id: string, grade: number, month: number, speaker: BondId, title: string, dialogue: string,
  choices: { id: string; label: string; response: string; rating: 'condition' | 'academics' | 'defense' | 'eye'; delta: number }[]): EventCutscene {
  return { id, title, subtitle: `${grade}학년 이야기 · 선택이 다음 준비를 바꿉니다`,
    speakerId: speaker, speakerName: ['coach','coach2','teacher'].includes(speaker) ? BOND_NAMES[speaker] : `{${speaker}}`, speakerRole: '학년 이야기', icon: '📖',
    dialogue, baseChance: 1, cooldownDays: 9999,
    conditions: (p, date) => date.grade === grade && date.month === month && hasMet(p, speaker),
    effect: p => ({ statChanges: { condition: Math.min(100, p.condition + 3) }, logMessage: title }),
    choices: choices.map(c => ({ ...c, effect: p => ({ statChanges: { [c.rating]: Math.min(100, Number(p[c.rating]) + c.delta) }, relationshipTargets: { [speaker]: 3 }, logMessage: `${title}: ${c.label} — ${c.response}` }) })),
  };
}
export const GRADE_STORY_SCENES: EventCutscene[] = [
  chapter('year1_first_goal',1,4,'peer','우리의 첫 시즌','첫 시즌에는 무엇을 가장 소중하게 생각할 거야?',[
    {id:'learn',label:'기본기를 함께 다진다',response:'같이 반복하면 실수도 고칠 수 있을 거야.',rating:'defense',delta:2},
    {id:'challenge',label:'작은 출전 기회부터 잡는다',response:'벤치에서도 다음 플레이를 준비하자.',rating:'eye',delta:2}]),
  chapter('year2_leadership',2,3,'junior','이제 누군가의 선배','실수할 때마다 선배 눈치가 보여요. 어떻게 해야 할까요?',[
    {id:'learn',label:'내 첫 실수도 솔직히 이야기한다',response:'실수해도 다시 준비하는 모습을 보여 주세요.',rating:'condition',delta:8},
    {id:'practice',label:'수비 기본기를 함께 연습한다',response:'공을 주고받으니 조금 덜 긴장돼요.',rating:'defense',delta:2}]),
  chapter('year2_competition',2,7,'peer','같은 자리, 다른 마음','우리 둘 다 주전이 되고 싶잖아. 경쟁하면서도 함께할 수 있을까?',[
    {id:'learn',label:'서로 영상을 보며 약점을 알려준다',response:'경쟁 상대여도 서로를 더 좋은 선수로 만들 수 있어.',rating:'eye',delta:2},
    {id:'support',label:'명단과 관계없이 응원하기로 약속한다',response:'팀이 이기면 함께 웃자. 내 기회도 준비할게.',rating:'condition',delta:10}]),
  chapter('year2_rival',2,9,'rival','한 해 뒤의 재대결','처음 만났을 때와는 다르네. 네가 어떻게 달라졌는지 보여 줘.',[
    {id:'learn',label:'상대의 달라진 준비 동작을 관찰한다',response:'한 공씩 집중해서 서로의 성장을 확인하자.',rating:'eye',delta:2},
    {id:'promise',label:'다음 대회에서 다시 만나자고 한다',response:'그 약속이 다음 겨울에도 우리를 움직이겠지.',rating:'condition',delta:8}]),
  chapter('year3_responsibility',3,3,'coach','마지막 학년의 책임','이제 네 준비를 보고 후배들이 배운다. 어떤 선배가 되고 싶니?',[
    {id:'learn',label:'훈련 준비와 회복의 모범을 보인다',response:'말보다 꾸준한 행동을 후배들이 기억할 거다.',rating:'condition',delta:10},
    {id:'mentor',label:'후배와 수비 훈련을 함께한다',response:'누군가를 가르치면 네 기본도 더 단단해진다.',rating:'defense',delta:2}]),
  chapter('year3_last_summer',3,7,'peer','마지막 여름의 약속','이 유니폼을 입고 맞는 마지막 여름이네. 후회 없이 끝내자.',[
    {id:'learn',label:'마지막까지 함께 준비한다',response:'결과가 어떻든 이 시간을 기억할 거야.',rating:'condition',delta:12},
    {id:'record',label:'경기와 훈련을 일지로 남긴다',response:'다음 길에서도 우리가 배운 것을 잊지 말자.',rating:'eye',delta:2}]),
  chapter('year3_future',3,9,'teacher','야구 다음의 선택','입학할 때 품었던 꿈과 지금 원하는 길은 같니? 제안과 학업을 함께 살펴보자.',[
    {id:'learn',label:'진로 제안을 비교하고 상담한다',response:'명성보다 네가 계속 성장할 수 있는 길을 고르자.',rating:'academics',delta:3},
    {id:'prepare',label:'공부와 경기 기록을 함께 정리한다',response:'선택할 수 있는 길을 넓히는 것도 준비야.',rating:'academics',delta:4}]),
];
export function nextJourneyScene(p: Player, date: GameDate): EventCutscene | null {
  if (p.pendingGradeReportId || p.careerEndedAt) return null;
  const done = migrateCareerJourney(p).completedScenes;
  return [...INTRODUCTION_SCENES, ...GRADE_STORY_SCENES].find(e => !done.includes(e.id) && e.conditions?.(p, date)) ?? null;
}

export const ROUTE_LABELS: Record<CareerRoute,string> = { university:'대학 야구부 진학', professional:'프로 구단 지명', overseas:'해외 육성팀 입단', club:'지역 클럽에서 야구 계속하기' };
export function officialAppearances(p: Player): number {
  return (p.matchRecords ?? []).filter(r => r.kind && !['practice','scrimmage'].includes(r.kind) && r.performance && !['bench','outside'].includes(r.performance.role)).length;
}
export function scoutingScore(p: Player): number {
  return Math.min(100, Math.round(overallRating(p) * .55 + (p.fame ?? 0) * .25 + Math.min(20, officialAppearances(p))));
}
export function eligibleRoutes(p: Player): CareerRoute[] {
  const games = officialAppearances(p), rating = overallRating(p);
  const routes: CareerRoute[] = ['club'];
  if (p.academics >= 45 && rating >= 30 && games >= 4) routes.push('university');
  if (rating >= 60 && (p.fame ?? 0) >= 35 && games >= 10) routes.push('professional');
  if (rating >= 72 && (p.fame ?? 0) >= 55 && games >= 12) routes.push('overseas');
  return routes;
}
export function updateCareerProgress(p: Player, ended = false): Player {
  const journey = { ...migrateCareerJourney(p) };
  const d = p.gameDate;
  if (ended || (d?.grade === 3 && (d.month >= 9 || d.month <= 2))) journey.offers = [...new Set([...journey.offers, ...eligibleRoutes(p)])];
  if (ended && !journey.ending) {
    const route = journey.chosenRoute && journey.offers.includes(journey.chosenRoute) ? journey.chosenRoute : 'club';
    journey.ending = { route, title: ROUTE_LABELS[route], overall: overallRating(p), appearances: officialAppearances(p),
      text: route === 'club' ? '고교의 마지막 경기를 마쳤습니다. 다음 무대는 지역 클럽입니다. 야구를 즐기는 삶은 계속됩니다.' : `훈련과 경기, 함께한 인연을 품고 ${ROUTE_LABELS[route]}의 길을 시작합니다. 다음 무대의 이야기는 졸업 이후에 이어집니다.` };
  }
  return { ...p, careerJourney: journey };
}

export function schoolTrainingCulture(p: Player) {
  const school = getHighSchoolDataByName(p.highSchool);
  const seed = [...(school?.id ?? p.highSchool)].reduce((n,c) => n+c.charCodeAt(0),0);
  return [
    { label:'불펜 중심', keys:['stuff','control','stamina'], text:'구위·제구·지구력 훈련 성장 5% 증가' },
    { label:'타석 중심', keys:['contact','power','eye'], text:'컨택·파워·선구안 훈련 성장 5% 증가' },
    { label:'수비·주루 중심', keys:['defense','speed'], text:'수비·스피드 훈련 성장 5% 증가' },
  ][seed % 3];
}
export function chemistry(p: Player) {
  const peer = hasMet(p,'peer') && getRelScore(p,'peer') >= 55 ? .025 : 0;
  const coach = hasMet(p,'coach2') && getRelScore(p,'coach2') >= 55 ? .025 : 0;
  return { bonus: peer + coach, text: [peer ? '동기와의 호흡 +2.5%p' : '', coach ? '코치의 기술 지도 +2.5%p' : ''].filter(Boolean).join(' · ') };
}

export const GROWTH_LABELS: Record<string,string> = { stuff:'구위', control:'제구', stamina:'지구력', contact:'컨택', power:'파워', eye:'선구안', speed:'스피드', defense:'수비', ...Object.fromEntries(Object.entries(EXTRA_RATINGS).map(([key,[label]]) => [key,label])) };
export function recordCareerAction(before: Player, after: Player, result: import('../types/activity').ActivityResult): Player {
  let journey = { ...migrateCareerJourney(after), trainingGrowth: { ...migrateCareerJourney(after).trainingGrowth } };
  if (result.activityCategory === 'training') {
    const changes: string[] = [];
    for (const [key,label] of Object.entries(GROWTH_LABELS)) {
      const delta = Number(after[key as keyof Player]) - Number(before[key as keyof Player]);
      if (delta > 0) { journey.trainingGrowth[key] = (journey.trainingGrowth[key] ?? 0) + delta; changes.push(`${label} +${delta.toFixed(1)}`); }
    }
    journey = { ...journey, lastGrowth: changes.length ? changes.join(' · ') : '이번 훈련은 성장보다 컨디션과 회복 관리가 필요합니다.' };
  }
  return updateCareerProgress({ ...after, careerJourney: journey }, !!after.careerEndedAt);
}

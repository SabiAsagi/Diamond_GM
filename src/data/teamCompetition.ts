import type { Player, Position } from '../types';
import type { HighSchoolData } from '../types/highSchool';
import type { GameDate, TimeSlot } from '../types/calendar';
import type { ScheduledMatch } from '../types/tournament';
import { getMatchKind, getPlayerMatchForDate } from '../types/tournament';
import type { ActivityOption, ActivityResult } from '../types/activity';
import { battingRating, pitchingRating } from './playerDevelopment';
import { getRelScore } from '../types/bondScores';
import { getBondName } from './cast';

export const FIELD_POSITIONS = ['P','C','1B','2B','3B','SS','LF','CF','RF'] as const;
export type FieldPosition = typeof FIELD_POSITIONS[number];
export type TeamRole = 'bench' | 'backup' | 'starter' | 'core';
export type AppearanceRole = 'starter' | 'bench' | 'pinchHit' | 'pinchRun' | 'defense' | 'relief' | 'outside';
export const TEAM_ROLE_LABELS: Record<TeamRole,string> = {bench:'벤치',backup:'백업',starter:'주전',core:'핵심 선수'};
export const APPEARANCE_LABELS: Record<AppearanceRole,string> = {starter:'선발 출전',bench:'벤치 대기',pinchHit:'대타',pinchRun:'대주자',defense:'수비 교체',relief:'구원 등판',outside:'엔트리 제외'};
export interface Teammate { id: string; name: string; position: FieldPosition; grade: number; ability: number; form: number; condition: number; bondId?: 'peer' | 'senior' | 'junior' }
export interface TeamEntry { tournamentId: string; year: number; name: string; date: string; memberIds: string[]; memberNames: string[]; included: boolean; reason: string }
export interface MatchSelection { matchId: string; year: number; role: AppearanceRole; reason: string; lineup: {position: FieldPosition; id: string; name: string}[]; advice?: string; protected: boolean }
export interface MatchPerformance { role: AppearanceRole; atBats: number; hits: number; homeRuns: number; rbi: number; innings: number; strikeouts: number; runsAllowed: number; stolenBases: number; errors: number; rating?: number }
export interface TeamFeedback { matchId: string; summary: string; before: TeamRole; after: TeamRole; coachDelta: number; technicalDelta: number; recommendation: string; performance: MatchPerformance }
export interface TeamCompetition {
  schema: 1; seasonYear: number; grade: number; roster: Teammate[];
  training: number; recentForm: number; coachEvaluation: number; technicalEvaluation: number;
  role: TeamRole; poorStarts: number; opportunityGames: number; lastInterviewDay?: number;
  entries: TeamEntry[]; selection?: MatchSelection; lastFeedback?: TeamFeedback; lastTrainingDay?: number;
}
const clamp = (n:number) => Math.max(0,Math.min(100,n));
const round = (n:number) => Math.round(n*10)/10;
export const fieldPosition = (p:Position):FieldPosition => p==='TwoWay'?'P':p;
export const dateNumber = (d:GameDate) => Math.floor(Date.UTC(d.year,d.month-1,d.day)/86400000);
function hash(s:string) { let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0; }
function pressure(s:HighSchoolData,p:FieldPosition) {return p==='P'?s.competition.pitcher:p==='C'?s.competition.catcher:['LF','CF','RF'].includes(p)?s.competition.outfielder:s.competition.infielder;}
function createRoster(player:Player,school:HighSchoolData,date:GameDate):Teammate[] {
  const count=Math.max(18,Math.min(60,school.rosterSize))-1;
  const roster:Teammate[]=[];
  const names=['김도윤','박시우','정하준','이건우','최준혁','한지호','오서진','임현우','장민성','유지훈','신태준','문승우'];
  for(let i=0;i<count;i++) {
    const position=FIELD_POSITIONS[i%9];const seed=hash(`${school.id}:${date.year}:${i}`);const grade=1+seed%3;
    roster.push({id:`team-${date.year}-${i}`,name:`${names[i%names.length]}${i>=names.length?' '+(1+Math.floor(i/names.length)):''}`,position,grade,
      ability:round(20+pressure(school,position)*1.7+(grade-1)*7+seed%7),form:45+seed%16,condition:65+seed%26});
  }
  const peer=roster.find(n=>n.position===fieldPosition(player.position))!;
  Object.assign(peer,{id:'peer',name:getBondName(player,'peer'),grade:date.grade,bondId:'peer',ability:26+pressure(school,peer.position)*1.5+(date.grade-1)*9});
  if(date.grade<3){const senior=roster.find(n=>n.id!=='peer'&&n.position==='SS')!;Object.assign(senior,{id:'senior',name:getBondName(player,'senior'),grade:date.grade+1,bondId:'senior',ability:42+pressure(school,'SS')});}
  return roster;
}
export function ensureTeamCompetition(player:Player,school:HighSchoolData,date:GameDate):Player {
  player={...player,grade:date.grade};
  const old=player.teamCompetition;
  if(old?.schema===1&&old.grade===date.grade) return refreshTeamEvaluation({...player,teamCompetition:{...old,seasonYear:date.year,entries:old.entries.filter(e=>e.year===date.year)}});
  // 졸업생의 포지션을 신입생이 이어받아 어느 포지션도 사라지지 않게 한다.
  const roster=old?.roster.map((n,i)=>{
    const grade=n.grade+date.grade-old.grade;
    if(grade<=3)return {...n,grade,ability:clamp(n.ability+7)};
    return {id:`recruit-${date.year}-${i}`,name:`신입 ${['김준호','박서우','이민성','최도현','정재윤','한태민','오승현','임건호','장시윤'][i%9]} ${1+Math.floor(i/9)}`,position:n.position,grade:1,ability:26+pressure(school,n.position),form:45,condition:80};
  });
  const state:TeamCompetition={schema:1,seasonYear:date.year,grade:date.grade,roster:roster??createRoster(player,school,date),training:old?.training??25,recentForm:old?.recentForm??40,coachEvaluation:old?.coachEvaluation??35,technicalEvaluation:old?.technicalEvaluation??35,role:'bench',poorStarts:0,opportunityGames:0,entries:[],lastInterviewDay:old?.lastInterviewDay};
  const updated={...player,teamCompetition:state};state.role=getStanding(updated).role;state.technicalEvaluation=technicalScore(updated);state.coachEvaluation=coachScore(updated);return updated;
}
export function technicalScore(player:Player):number {
  const t=player.teamCompetition;
  const skill=player.position==='P'?pitchingRating(player):player.position==='TwoWay'?(pitchingRating(player)+battingRating(player))/2:battingRating(player);
  return round(clamp(skill*.5+(t?.training??25)*.2+(t?.recentForm??40)*.2+player.condition*.1));
}
export function coachScore(player:Player):number {return round(clamp(technicalScore(player)+(getRelScore(player,'coach')-50)*.12+((player.grade??1)-1)*2));}
export const teammateScore=(n:Teammate)=>round(n.ability*.7+n.form*.2+n.condition*.1+(n.grade-1)*2);
export function getDepthChart(player:Player,position:FieldPosition=fieldPosition(player.position)) {
  const rows=(player.teamCompetition?.roster??[]).filter(n=>n.position===position).map(n=>({...n,score:teammateScore(n),isPlayer:false}));
  if(fieldPosition(player.position)===position) rows.push({id:'player',name:player.name,position,grade:player.grade??1,ability:technicalScore(player),form:player.teamCompetition?.recentForm??40,condition:player.condition,score:coachScore(player),isPlayer:true});
  return rows.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export function getStanding(player:Player):{rank:number;total:number;role:TeamRole;score:number} {
  const chart=getDepthChart(player);const rank=chart.findIndex(n=>n.isPlayer)+1;const score=coachScore(player);
  const role:TeamRole=rank===1?(score>=65?'core':'starter'):rank<=2?'backup':'bench';
  return {rank,total:chart.length,role,score};
}
function buildEntry(player:Player,match:ScheduledMatch,date:GameDate):TeamEntry {
  const ids=FIELD_POSITIONS.flatMap(pos=>getDepthChart(player,pos).slice(0,pos==='P'?5:2).map(n=>n.id));
  const included=ids.includes('player');const names=ids.map(id=>id==='player'?player.name:player.teamCompetition!.roster.find(n=>n.id===id)!.name);
  return {tournamentId:match.tournamentId,year:date.year,name:match.tournamentName,date:`${date.month}/${date.day}`,memberIds:ids,memberNames:names,included,
    reason:included?'포지션별 평가 순위로 엔트리에 합류했습니다.':'같은 포지션의 경쟁자가 앞섰습니다. 이번 대회는 팀과 동행하며 다음 기회를 준비합니다.'};
}
export function selectMatch(player:Player,match:ScheduledMatch,date:GameDate):MatchSelection {
  const t=player.teamCompetition!;const kind=getMatchKind(match);const friendly=kind==='scrimmage'||kind==='practice';
  const entry=t.entries.find(e=>e.year===date.year&&e.tournamentId===match.tournamentId);
  const included=friendly||!entry||entry.included;
  const standing=getStanding(player);const fit=player.condition>=35;
  const incumbent=t.role==='starter'||t.role==='core';
  const protectedStart=incumbent&&getRelScore(player,'coach')>=75&&t.poorStarts>0&&t.poorStarts<=2&&standing.rank<=2&&fit;
  const rotation=friendly&&hash(`${date.year}:${match.id}`)%3===0;
  const start=included&&fit&&(standing.rank===1||protectedStart||rotation||(friendly&&t.opportunityGames>0));
  const role:AppearanceRole=!included?'outside':start?'starter':'bench';
  let reason=!included?'대회 엔트리에 포함되지 않았습니다.':!fit?'컨디션이 낮아 선발에서 제외되었습니다.':protectedStart?'감독이 최근 부진에도 기존 주전에게 한 번 더 기회를 줍니다.':rotation?'평가전에서 다른 선수에게도 선발 기회를 줍니다.':start?'포지션 경쟁 평가에 따라 선발로 선택되었습니다.':'벤치에서 경기 상황에 따른 교체 출전을 기다립니다.';
  if(t.opportunityGames>0&&included&&!start)reason+=' 면담 후 교체 기회를 우선 검토합니다.';
  const lineup=FIELD_POSITIONS.map(pos=>{
    const rows=getDepthChart(player,pos).filter(n=>friendly||!entry||entry.memberIds.includes(n.id));
    const chosen=pos===fieldPosition(player.position)&&start?rows.find(n=>n.isPlayer):rows.find(n=>!n.isPlayer);
    const fallback=chosen??rows[0];return {position:pos,id:fallback?.id??`empty-${pos}`,name:fallback?.name??'선발 공석'};
  });
  const senior=getBondName(player,'senior');
  const advice=getRelScore(player,'senior')>=55?(date.grade<3?`${senior}: “경쟁은 길어. 오늘 네가 준비한 한 가지에 집중해.”`:`${senior}의 메시지: “결과보다 준비한 플레이에 집중해. 네 경기를 해.”`):undefined;
  return {matchId:match.id,year:date.year,role,reason,lineup,protected:protectedStart,advice};
}
/** 엔트리는 개막 3일 전, 선발 명단은 당일 오후에 한 번만 확정한다. */
export function prepareTeamContext(player:Player,school:HighSchoolData,date:GameDate,slot:TimeSlot,matches:ScheduledMatch[]):Player {
  const updated=ensureTeamCompetition(player,school,date);const t={...updated.teamCompetition!,entries:[...updated.teamCompetition!.entries]};updated.teamCompetition=t;
  for(const match of matches.filter(m=>m.isPlayerTeamMatch&&!m.result)) {
    if(getMatchKind(match)!=='national')continue;
    const diff=Math.floor(Date.UTC(date.year,match.date.month-1,match.date.day)/86400000)-dateNumber(date);
    if(diff<0||diff>3||t.entries.some(e=>e.year===date.year&&e.tournamentId===match.tournamentId))continue;
    t.entries.push(buildEntry(updated,match,date));
  }
  const match=getPlayerMatchForDate(date,matches);
  if(slot==='afternoon'&&match&&(t.selection?.matchId!==match.id||t.selection.year!==date.year))t.selection=selectMatch(updated,match,date);
  return updated;
}
export function refreshTeamEvaluation(player:Player):Player {
  if(!player.teamCompetition)return player;
  const t={...player.teamCompetition};const updated={...player,teamCompetition:t};
  t.technicalEvaluation=technicalScore(updated);t.coachEvaluation=coachScore(updated);
  const standing=getStanding(updated);
  const protectedRole=(t.role==='starter'||t.role==='core')&&getRelScore(updated,'coach')>=75&&t.poorStarts>0&&t.poorStarts<=2&&standing.rank<=2;
  if(!protectedRole)t.role=standing.role;
  return updated;
}
export function trainingFocus(player: Player): 'recovery' | 'control' | 'batting' | 'technique' {
  if (player.condition < 45) return 'recovery';
  if ((player.teamCompetition?.recentForm ?? 40) < 40 && player.position !== 'TwoWay') return player.position === 'P' ? 'control' : 'batting';
  return 'technique';
}
export function optionMatchesTrainingAdvice(player: Player, option: ActivityOption): boolean {
  const focus = trainingFocus(player);
  if (focus === 'recovery') return option.category === 'rest' && (Number(option.statChanges.condition ?? 0) + option.staminaDelta + (option.mentalDelta ?? 0)) > 0;
  if (!['training', 'special'].includes(option.category)) return false;
  const keys = focus === 'control' ? ['control'] : focus === 'batting' ? ['contact', 'eye'] : player.position === 'P' ? ['stuff', 'control', 'movement', 'velocity'] : player.position === 'TwoWay' ? ['contact', 'eye', 'power', 'defense', 'stuff', 'control', 'movement', 'velocity'] : ['contact', 'eye', 'power', 'defense', 'fieldingRange', 'fieldingError'];
  return (focus === 'technique' && ['P', 'TwoWay'].includes(player.position) && !!option.pitchTraining) || keys.some(k => Number((option.statChanges as Record<string, number>)[k]) > 0);
}
export function trainingRecommendation(player:Player):string {
  const focus = trainingFocus(player);
  if(focus === 'recovery')return '다음 훈련 전에 휴식으로 컨디션을 회복하세요. 피로가 쌓이면 출전 기회도 줄어듭니다.';
  if(focus === 'control')return '제구 훈련과 제구를 다루는 경기 영상 분석으로 실점을 줄여보세요.';
  if(focus === 'batting')return '컨택·선구안 훈련으로 다음 타석을 준비하세요.';
  return player.position==='P'?'구종·제구·구위 훈련 성과를 쌓아 다음 평가전에서 보여주세요.':player.position==='TwoWay'?'타격·수비와 구종·제구 훈련을 함께 준비하세요.':'타격·수비 훈련 성과를 쌓아 다음 평가전에서 보여주세요.';
}
export function updateCompetitionAfterAction(before:Player,after:Player,result:ActivityResult,date:GameDate):Player {
  if(!after.teamCompetition)return after;
  const t={...after.teamCompetition};let updated={...after,teamCompetition:t};
  if(result.activityCategory==='training'||result.activityCategory==='special') {
    const gains=Object.entries(result.statChanges).filter(([k,v])=>!['condition','academics','fame'].includes(k)&&Number(v)>0).reduce((s,[,v])=>s+Number(v),0);
    t.training=clamp(t.training+Math.min(3,gains*.6));t.lastTrainingDay=dateNumber(date);
  }
  if(result.competitionInterview){
    t.lastInterviewDay=dateNumber(date);
    if(result.competitionInterview.choice==='chance')t.opportunityGames=2;
    if(result.competitionInterview.choice==='position'&&result.competitionInterview.position){
      updated={...updated,position:result.competitionInterview.position};t.poorStarts=0;t.role='bench';t.selection=undefined;t.opportunityGames=0;
      if(updated.position==='P'||updated.position==='TwoWay'){updated.pitchingForm=updated.pitchingForm==='None'?'Overhand':updated.pitchingForm;updated.pitcherRole='Reliever';}
      if(updated.position!=='P'&&updated.battingForm==='None')updated.battingForm='Straight';
    }
  }
  if(result.matchPerformance) {
    const p=result.matchPerformance;const played=p.role!=='bench'&&p.role!=='outside';
    if(played&&p.rating!==undefined)t.recentForm=round(clamp(t.recentForm*.65+p.rating*.35));
    if(p.role==='starter')t.poorStarts=(p.rating??50)<40?t.poorStarts+1:0;
    if(p.role!=='outside')t.opportunityGames=Math.max(0,t.opportunityGames-1);
    t.roster=t.roster.map(n=>{const drift=(hash(`${date.year}:${result.matchOutcome?.matchId}:${n.id}`)%11)-5;return {...n,form:clamp(n.form+drift),condition:60+hash(`${result.matchOutcome?.matchId}:${n.id}`)%36};});
  }
  t.technicalEvaluation=technicalScore(updated);t.coachEvaluation=coachScore(updated);
  const standing=getStanding(updated);const previous=before.teamCompetition?.role??'bench';
  // 높은 신뢰의 기존 주전만 최대 두 번의 부진 동안 지위를 유지한다.
  t.role=result.competitionInterview?.choice!=='position'&&(previous==='starter'||previous==='core')&&getRelScore(updated,'coach')>=75&&t.poorStarts>0&&t.poorStarts<=2&&standing.rank<=2?previous:standing.role;
  if(result.matchPerformance&&result.matchOutcome){
    t.lastFeedback={matchId:result.matchOutcome.matchId,summary:result.matchPerformance.role==='outside'?'엔트리 밖에서 다음 기회를 준비합니다.':result.matchPerformance.role==='bench'?'출전 없이 경기를 마쳤습니다. 개인 실적 평가는 유지됩니다.':(result.matchPerformance.rating??0)>=60?'경기에서 준비한 실력을 보여줬습니다.':(result.matchPerformance.rating??0)<40?'경기 내용이 아쉬웠습니다. 다음 훈련에서 보완해 봅시다.':'맡은 역할을 마쳤습니다. 꾸준함을 이어가 봅시다.',before:previous,after:t.role,coachDelta:round(t.coachEvaluation-coachScore(before)),technicalDelta:round(t.technicalEvaluation-technicalScore(before)),recommendation:trainingRecommendation(updated),performance:result.matchPerformance};
  }
  return updated;
}

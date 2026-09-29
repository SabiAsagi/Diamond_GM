import { battingRating, pitchingRating, normalizePlayer } from '../data/playerDevelopment';
import type { ScheduledMatch } from '../types/tournament';
import { getMatchKind } from '../types/tournament';
import type { Player } from '../types';
import type { HighSchoolData } from '../types/highSchool';
import type { ActivityResult } from '../types/activity';
import { getCoachWinProbabilityBonus } from '../types/relationship';
import { getRelScore } from '../types/bondScores';
import { personalizeText } from '../data/cast';
import { APPEARANCE_LABELS, prepareTeamContext, selectMatch, type MatchPerformance } from '../data/teamCompetition';

/** 간이 경기 엔진: 실제 출전 역할에 따라 개인 성적과 육성 보상을 계산한다. */
export function resolveMatchPlaceholder(match:ScheduledMatch,input:Player,school:HighSchoolData):ActivityResult {
  const date=input.gameDate??{year:match.year??2026,...match.date,weekday:0,grade:1 as const};
  const player=prepareTeamContext(normalizePlayer(input),school,date,'afternoon',[match]);
  const t=player.teamCompetition!;
  const selection=t.selection?.matchId===match.id?t.selection:selectMatch(player,match,date);
  const pitcher=player.position==='P'||player.position==='TwoWay';
  let role=selection.role;
  if(role==='bench'&&player.condition>=25) {
    const chance=Math.min(.85,.22+getRelScore(player,'coach')*.003+(t.opportunityGames>0?.25:0)+(getMatchKind(match)==='scrimmage'?.2:0));
    if(Math.random()<chance){
      if(pitcher)role='relief';
      else if(player.speed>player.contact+5)role='pinchRun';
      else if(player.defense>player.contact+5)role='defense';
      else role='pinchHit';
    }
  }
  const played=role!=='outside'&&role!=='bench';
  const skill=pitcher?pitchingRating(player):battingRating(player);
  const coachBonus=getCoachWinProbabilityBonus(player);
  // 벤치 선수의 능력 대신 학교 전력을 사용한다. 신뢰 효과는 기존 팀 전술 보정 유지.
  const teamSkill=20+school.prestige*.3;
  const contribution=played?teamSkill*.8+skill*.2:teamSkill;
  const won=Math.random()<Math.min(.9,Math.max(.1,.5+(contribution-40)*.004+coachBonus));
  const loser=Math.floor(Math.random()*4);const winner=loser+1+Math.floor(Math.random()*4);
  const myScore=won?winner:loser,oppScore=won?loser:winner;
  const performance:MatchPerformance={role,atBats:0,hits:0,homeRuns:0,rbi:0,innings:0,strikeouts:0,runsAllowed:0,stolenBases:0,errors:0};
  const statChanges:ActivityResult['statChanges']={};
  const lines:string[]=[];
  if(played){
    if(pitcher){
      performance.innings=role==='starter'?4+Math.floor(Math.random()*3):1+Math.floor(Math.random()*2);
      performance.strikeouts=Math.min(performance.innings*3,Math.floor(performance.innings*(.25+player.stuff/70)*Math.random()*2));
      performance.runsAllowed=Math.min(oppScore,Math.floor(Math.random()*5*(1-player.control/140)));
      performance.rating=Math.max(5,Math.min(95,60+performance.strikeouts*4-performance.runsAllowed*18));
      statChanges.stuff=.4;statChanges.control=.4;
      lines.push(`${performance.innings}이닝 ${performance.strikeouts}탈삼진 ${performance.runsAllowed}실점`);
    }
    if(!pitcher||(player.position==='TwoWay'&&role==='starter')){
      performance.atBats=role==='pinchHit'?1:role==='pinchRun'||role==='defense'?0:4;
      for(let i=0;i<performance.atBats;i++)if(Math.random()<.12+player.contact*.004){performance.hits++;if(Math.random()<.02+player.power*.002)performance.homeRuns++;}
      performance.homeRuns=Math.min(performance.homeRuns,myScore);
      performance.rbi=Math.min(myScore,performance.hits+(performance.homeRuns>0?1:0));
      if(role==='pinchRun')performance.stolenBases=Math.random()<.25+player.speed*.005?1:0;
      if(role==='defense')performance.errors=Math.random()>.55+player.defense*.004?1:0;
      const battingPerformance=role==='pinchRun'?(performance.stolenBases?75:45):role==='defense'?(performance.errors?20:60):Math.min(95,20+performance.hits/performance.atBats*100+performance.homeRuns*15);
      performance.rating=performance.rating===undefined?battingPerformance:(performance.rating+battingPerformance)/2;
      if(performance.atBats){statChanges.contact=.4;statChanges.eye=.3;lines.push(`${performance.atBats}타수 ${performance.hits}안타 ${performance.homeRuns}홈런 ${performance.rbi}타점`);}
      if(role==='pinchRun'){statChanges.speed=.3;lines.push(`타석 없음 · ${performance.stolenBases}도루`);}
      if(role==='defense'){statChanges.defense=.3;lines.push(`타석 없음 · 수비 ${performance.errors}실책`);}
    }
    statChanges.fame=getMatchKind(match)==='national'?(performance.rating!>=60?3:1):1;
  }
  const good=played&&(performance.rating??0)>=60;const bad=played&&(performance.rating??0)<40;
  const peerRival=t.roster.some(n=>n.bondId==='peer'&&n.position===(player.position==='TwoWay'?'P':player.position));
  const peerClose=getRelScore(player,'peer')>=55;
  const relationships:ActivityResult['relationshipTargets']={};
  if(played){relationships.coach=good?2:bad?-2:1;relationships.coach2=good?1:0;}
  if(peerRival)relationships.peer=peerClose?1:good?-1:0;
  if(selection.advice)relationships.senior=1;
  const bondStory=personalizeText(peerRival?(peerClose?'{peer|과} 서로의 플레이를 복기하며 다음 훈련을 약속했습니다.':good?'같은 포지션의 {peer|이} 당신의 활약을 의식합니다.':'{peer}의 플레이를 보며 다음 경쟁을 준비합니다.') : '',player);
  const logMessage=`⚾ [${match.tournamentName} ${match.round}] ${school.name} ${myScore} : ${oppScore} ${match.homeSchoolId===school.id?match.awaySchoolName:match.homeSchoolName} (${won?'승리':'패배'})\n[${APPEARANCE_LABELS[role]}] ${played?lines.join(' · '):'미출전 · 개인 기록과 경기 성장치 없음'}\n${selection.advice??''}${selection.advice?'\n':''}${bondStory}${coachBonus?' · 감독 신뢰로 승리 확률 보정 +4%p':''}`;
  return {activityCategory:'match',statChanges,relationshipTargets:relationships,staminaDelta:played?(role==='starter'?-20:-8):-3,mentalDelta:played?(good?6:bad?-6:1)+(selection.advice?3:0):role==='outside'?-3:-1,logMessage,matchPerformance:performance,matchOutcome:{matchId:match.id,tournamentId:match.tournamentId,won}};
}

import type { Player } from '../types';
import type { GameDate } from '../types/calendar';

export interface RivalProgress {
  overall: number;
  potential: number;
  lastUpdatedMonth: number;
  lastUpdatedYear: number;
  playerMonthStartOverall: number;
}
export interface RivalReport {
  year: number;
  month: number;
  rivalOverall: number;
  rivalDelta: number;
  playerOverall: number;
  playerDelta: number;
}
export function initializeRival(player: Player, date: Pick<GameDate,'year'|'month'>, random = Math.random): RivalProgress {
  const potential = 65 + Math.floor(random()*21);
  return {overall:Math.min(potential,Math.max(15,player.overall-2+Math.floor(random()*5))),potential,
    lastUpdatedYear:date.year,lastUpdatedMonth:date.month,playerMonthStartOverall:player.overall};
}
// 연도도 기록하여 연말·연초 및 다음 해 같은 달의 성장을 구분한다.
export function growRivalIfNeeded(player: Player, currentMonth: number, currentYear: number, random = Math.random): RivalProgress | undefined {
  const rival = player.rivalProgress;
  if(!rival) return undefined;
  const elapsed = (currentYear-rival.lastUpdatedYear)*12 + currentMonth-rival.lastUpdatedMonth;
  if(elapsed <= 0) return rival;
  let overall = rival.overall;
  for(let month=0;month<elapsed;month++) {
    const growth = Math.max(0,Math.round((rival.potential-overall)*0.08 + random()*3-1));
    overall = Math.min(rival.potential,overall+growth);
  }
  return {...rival,overall,lastUpdatedYear:currentYear,lastUpdatedMonth:currentMonth,playerMonthStartOverall:player.overall};
}
export function updateMonthlyRival(player: Player, date: Pick<GameDate,'year'|'month'>): Player {
  const before = player.rivalProgress;
  const after = growRivalIfNeeded(player,date.month,date.year);
  if(!before || !after || before === after) return player;
  const pendingRivalReport: RivalReport = {year:date.year,month:date.month,rivalOverall:after.overall,
    rivalDelta:after.overall-before.overall,playerOverall:player.overall,
    playerDelta:player.overall-before.playerMonthStartOverall};
  return {...player,rivalProgress:after,pendingRivalReport};
}
export function getRivalComparison(playerOverall: number, rivalOverall: number): string {
  const gap = playerOverall-rivalOverall;
  return gap >= 8 ? '당신이 크게 앞서고 있습니다. 박태성도 꾸준히 격차를 좁히고 있습니다.'
    : gap >= 0 ? '당신이 근소하게 앞서거나 대등합니다. 잠시 방심하면 순서가 바뀔 수 있습니다.'
    : '박태성이 앞서 있습니다. 다음 달에는 격차를 좁혀 봅시다.';
}

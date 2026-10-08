import type { Player } from '../types';
import type { ScheduledMatch } from '../types/tournament';
import { selectMatch } from './teamCompetition';

export type MatchDecisionId = 'challenge' | 'corners' | 'mix' | 'contact' | 'attack' | 'patient';
export interface MatchDecision { id: MatchDecisionId; label: string; description: string; rating: number; bonus: number; hitBonus: number; homerBonus: number }
/** No random preview: refreshing or comparing options cannot reroll the match. */
export function matchDecisions(p: Player, match?: ScheduledMatch): MatchDecision[] {
  if (!match || !p.gameDate) return [];
  const selection = p.teamCompetition?.selection?.matchId === match.id ? p.teamCompetition.selection : selectMatch(p, match, p.gameDate);
  if (!['starter','relief','pinchHit'].includes(selection.role)) return [];
  const pitcher = p.position === 'P' || p.position === 'TwoWay';
  const fatigue = p.condition < 40 ? -.025 : 0;
  const make = (id: MatchDecisionId,label:string,description:string,rating:number,hitBonus=0,homerBonus=0): MatchDecision => ({ id,label,description,rating,bonus:Math.max(-.06,Math.min(.06,(rating-45)*.001+fatigue)),hitBonus,homerBonus });
  return pitcher ? [
    make('challenge','정면 승부','구위로 승부합니다. 구위가 낮거나 지쳤다면 장타 위험이 커집니다.',p.stuff),
    make('corners','코너 공략','제구로 위험한 타자를 상대합니다. 제구가 낮으면 어려운 승부가 됩니다.',p.control),
    make('mix','구종 조합','무브먼트와 제구를 활용해 타이밍을 흔듭니다.',((p.movement ?? p.stuff)+p.control)/2),
  ] : [
    make('contact','짧은 스윙','컨택으로 주자를 불러들이는 접근. 안타 확률을 높이고 홈런 확률을 낮춥니다.',p.contact,.04,-.025),
    make('attack','장타 노리기','파워로 큰 타구를 노립니다. 안타 확률을 낮추고 홈런 확률을 높입니다.',p.power,-.035,.045),
    make('patient','끝까지 공 보기','선구안으로 좋은 공을 기다립니다. 선구안과 컨택의 균형이 중요합니다.',(p.eye+p.contact)/2,.015,-.01),
  ];
}
export function matchSituation(match: ScheduledMatch, p: Player) {
  const n = [...match.id].reduce((v,c)=>v+c.charCodeAt(0),0);
  return p.position === 'P' || p.position === 'TwoWay'
    ? `${n%2 ? '7회 1점 차' : '6회 동점'}, 2사 득점권. 상대 중심 타선에 어떤 접근으로 승부할까요?`
    : `${n%2 ? '7회 1점 차' : '6회 동점'}, 2사 득점권 타석. 어떤 접근으로 한 공을 준비할까요?`;
}

import schedule from './kbo2026.json';
import type { GameDate, TimeSlot } from '../types/calendar';

export const PRO_TEAMS = ['LG','DOOSAN','KIWOOM','SSG','KT','HANWHA','KIA','SAMSUNG','LOTTE','NC'] as const;
export type ProTeam = typeof PRO_TEAMS[number];
export interface ProFixture {date:string;away:string;home:string;venue:string;time:string;cancelled:boolean}
const homeVenue: Record<ProTeam,string> = {LG:'JAMSIL',DOOSAN:'JAMSIL',KIWOOM:'GOCHEOKSKY',SSG:'MUNHAK',KT:'SUWON',HANWHA:'DAEJEON',KIA:'GWANGJU',SAMSUNG:'DAEGU',LOTTE:'SAJIK',NC:'CHANGWON'};
const locations: Record<string,string> = {jamsil:'JAMSIL',gocheok:'GOCHEOKSKY',munhak:'MUNHAK',suwon:'SUWON',daejeonpark:'DAEJEON',champions:'GWANGJU',daegupark:'DAEGU',sajik:'SAJIK',changwon:'CHANGWON'};
const names:Record<string,string>={LG:'LG',DOOSAN:'두산',KIWOOM:'키움',SSG:'SSG',KT:'KT',HANWHA:'한화',KIA:'KIA',SAMSUNG:'삼성',LOTTE:'롯데',NC:'NC'};
const cache=new Map<number,ProFixture[]>();
const dateKey=(year:number,month:number,day:number)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

/** Future game years have no published real schedule: explicitly labelled simulation.
 * 16 meetings per opponent, 144 games and 72 home games per club; Mondays off.
 * Invert each round in alternating cycles, including the two clubs sharing Jamsil.
 */
export function simulatedProSeason(year:number):ProFixture[] {
 const cached=cache.get(year);if(cached)return cached;
 const order:ProTeam[]=[...PRO_TEAMS];const rounds:[ProTeam,ProTeam][][]=[];
 for(let round=0;round<9;round++){
   const pairs:[ProTeam,ProTeam][]=[];
   for(let i=0;i<5;i++)pairs.push([order[i],order[9-i]]);
   const lg=pairs.find(pair=>pair.includes('LG'))!;const ds=pairs.find(pair=>pair.includes('DOOSAN'))!;
   if(lg!==ds && lg.indexOf('LG')===ds.indexOf('DOOSAN'))ds.reverse();
   rounds.push(pairs);order.splice(1,0,order.pop()!);
 }
 const day=new Date(Date.UTC(year,2,25));while(day.getUTCDay()!==6)day.setUTCDate(day.getUTCDate()+1);
 const games:ProFixture[]=[];
 for(let cycle=0;cycle<16;cycle++)for(const pairs of rounds){
   while(day.getUTCDay()===1 || (day.getUTCMonth()===6 && day.getUTCDate()>=10 && day.getUTCDate()<=13))day.setUTCDate(day.getUTCDate()+1);
   for(const pair of pairs){const [home,away]=cycle%2?[pair[1],pair[0]]:pair;games.push({date:dateKey(year,day.getUTCMonth()+1,day.getUTCDate()),home,away,venue:homeVenue[home],time:day.getUTCDay()===0?'14:00':day.getUTCDay()===6?'17:00':'18:30',cancelled:false});}
   day.setUTCDate(day.getUTCDate()+1);
 }
 cache.set(year,games);return games;
}
export function getProFixtures(year:number):ProFixture[]{return year===schedule.year?schedule.games:simulatedProSeason(year);}
export function getBallparkVisit(locationId:string,date:GameDate,slot:TimeSlot){
 const venue=locations[locationId];if(!venue)return null;
 const key=dateKey(date.year,date.month,date.day);
 const games=getProFixtures(date.year);const today=games.filter(g=>g.venue===venue && g.date===key);
 const fixture=today.find(g=>!g.cancelled);
 const next=games.find(g=>g.venue===venue && g.date>key && !g.cancelled);
 const simulated=date.year!==schedule.year;
 const source=simulated?'가상 시즌 · 팀당 144경기 / 홈 72경기':`KBO 공식 일정 · ${schedule.asOf} 확인`;
 const nextText=next?`다음 홈경기 ${next.date.slice(5).replace('-','/')} · ${names[next.away]} vs ${names[next.home]}`:'이번 시즌 남은 홈경기가 없습니다.';
 const matchSlot=fixture && Number(fixture.time.split(':')[0])>=18?'night':'afternoon';
 const available=!!fixture && slot===matchSlot;
 const reason=fixture?`${fixture.time} ${names[fixture.away]} vs ${names[fixture.home]}${available?' · 관람 가능':` · ${matchSlot==='night'?'야간':'오후'}에 관람 가능`}`:today.length?'우천 등으로 오늘 경기가 취소되었습니다.':'오늘은 이 구장에 홈경기가 없습니다.';
 return {available,reason,nextText,source,simulated,fixture};
}

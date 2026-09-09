import type { HighSchoolData, SchoolTier } from './highSchool';
import type { GameDate } from './calendar';

export type TournamentType =
  | 'weekend_league'     // 주말리그 (정규시즌, 매주 토요일 반복)
  | 'spring_national'    // 이마트배 등 전국대회
  | 'summer_national'    // 황금사자기 / 청룡기 등
  | 'autumn_national'    // 봉황대기 등
  | 'regional_qualifier'; // 지역 예선

export interface TournamentSchedule {
  id: string;
  type: TournamentType;
  name: string;                 // "제1회 이마트배 전국고교야구대회"
  region?: string;               // regional_qualifier일 때만 사용
  startDate: { month: number; day: number };
  roundIntervalDays: number;     // 라운드 간 간격 (토너먼트면 보통 2~3일)
  participatingTiers: SchoolTier[]; // 어떤 티어 학교가 출전 가능한지
  description?: string;
}

export interface ScheduledMatch {
  year?: number;
  group?: string;
  drawn?: boolean;
  result?: 'home' | 'away';

  id: string;
  date: { month: number; day: number };
  tournamentId: string;
  tournamentName: string;
  round: string;                 // "8강", "4강", "결승", "전반기 주말리그 3주차" 등
  homeSchoolId: string;
  awaySchoolId: string;
  homeSchoolName: string;
  awaySchoolName: string;
  isPlayerTeamMatch: boolean;    // 플레이어 소속 학교 경기인지
  description?: string;
}

/**
 * 기본 메이저 전국대회 템플릿
 */
export const MAJOR_TOURNAMENT_TEMPLATES: TournamentSchedule[] = [
  {
    id: 'emart_spring',
    type: 'spring_national',
    name: '신세계 이마트배 전국고교야구대회',
    startDate: { month: 4, day: 11 },
    roundIntervalDays: 3,
    participatingTiers: ['S', 'A', 'B', 'C', 'D'],
    description: '대한야구소프트볼협회 주관 전국 규모 최대 등록 고교 참가 대회.',
  },
  {
    id: 'golden_lion',
    type: 'summer_national',
    name: '제79회 황금사자기 전국고교야구대회',
    startDate: { month: 5, day: 16 },
    roundIntervalDays: 3,
    participatingTiers: ['S', 'A', 'B', 'C'],
    description: '동아일보사 주최 역사와 전통을 자랑하는 메이저 전국대회.',
  },
  {
    id: 'blue_dragon',
    type: 'summer_national',
    name: '제80회 청룡기 전국고교야구선수권',
    startDate: { month: 7, day: 11 },
    roundIntervalDays: 3,
    participatingTiers: ['S', 'A', 'B', 'C'],
    description: '조선일보사 주최 고교야구 최고의 권위를 지닌 하계 선수권.',
  },
  {
    id: 'phoenix_autumn',
    type: 'autumn_national',
    name: '제54회 봉황대기 전국고교야구대회',
    startDate: { month: 8, day: 22 },
    roundIntervalDays: 3,
    participatingTiers: ['S', 'A', 'B', 'C', 'D'],
    description: '초록 봉황을 향한 전국 모든 고교가 조건 없이 출전하는 토너먼트.',
  },
];

/**
 * 특정 연도의 플레이어 소속 학교 시즌 전체 대진을 한 번에 사전 생성합니다.
 */
export function generateSeasonMatches(
  year: number,
  playerSchool: HighSchoolData,
  allSchools: HighSchoolData[]
): ScheduledMatch[] {
  const matches: ScheduledMatch[] = [];
  const otherSchools = allSchools.filter(s => s.id !== playerSchool.id && s.name !== playerSchool.name);

  // 같은 권역 학교 우선 선택, 부족하면 전체 풀에서 선택
  const sameRegionSchools = otherSchools.filter(s => s.region === playerSchool.region);
  const candidateOpponents = sameRegionSchools.length >= 5 ? sameRegionSchools : otherSchools;

  let opponentIdx = 0;
  const getNextOpponent = () => {
    if (candidateOpponents.length === 0) {
      return { id: 'rival_high', name: '라이벌고', region: playerSchool.region, tier: 'B' as SchoolTier };
    }
    const opp = candidateOpponents[opponentIdx % candidateOpponents.length];
    opponentIdx++;
    return opp;
  };

  // 1. 고교야구 주말리그 (4월 1일 ~ 9월 20일 사이의 모든 토요일)
  let weekendWeek = 1;
  for (let m = 4; m <= 9; m++) {
    // 8월 후반 봉황대기 시즌 일부 휴식 제외, 토요일마다 주말리그 배치
    const daysInM = m === 4 || m === 6 || m === 9 ? 30 : 31;
    for (let d = 1; d <= daysInM; d++) {
      const dObj = new Date(year, m - 1, d);
      if (dObj.getDay() === 6) { // 6: 토요일
        // 여름방학 집중 휴식(7/25~8/8) 제외
        if (m === 7 && d >= 25) continue;
        if (m === 8 && d <= 8) continue;

        const opp = getNextOpponent();
        const stageName = m <= 6 ? '전반기' : '후반기';
        matches.push({
          id: `weekend_${m}_${d}`,
          date: { month: m, day: d },
          tournamentId: 'weekend_league',
          tournamentName: '고교야구 주말리그',
          round: `${stageName} ${weekendWeek}주차`,
          homeSchoolId: playerSchool.id,
          homeSchoolName: playerSchool.name,
          awaySchoolId: opp.id,
          awaySchoolName: opp.name,
          isPlayerTeamMatch: true,
          description: `주말리그 ${stageName} 조별리그 ${weekendWeek}차전 (${opp.name}전)`,
        });
        weekendWeek++;
      }
    }
  }

  // 16개 조, 각 조 4팀 토너먼트 예선. 조 우승팀만 본선 16강 진출 (게임 규칙).
  for (const tour of MAJOR_TOURNAMENT_TEMPLATES) {
    const entrants = otherSchools.slice();
    for(let i=entrants.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[entrants[i],entrants[j]]=[entrants[j],entrants[i]];}
    const field=[playerSchool,...entrants.slice(0,63)];
    const size=2 ** Math.floor(Math.log2(field.length));
    if(size<2) continue;
    field.length=size;
    for(let i=field.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[field[i],field[j]]=[field[j],field[i]];}
    for(let i=0;i<field.length;i+=2){
      const home=field[i],away=field[i+1];
      matches.push({id:`${tour.id}_r0_${i/2}`,year,date:{...tour.startDate},tournamentId:tour.id,tournamentName:tour.name,
        round:size>32?'조 예선 1차전':size>16?'조 예선 결정전':`${size}강전`,group:`${Math.floor(i/4)+1}조`,drawn:false,
        homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
        isPlayerTeamMatch:home.id===playerSchool.id||away.id===playerSchool.id,description:'조 추첨 후 예선 상대 공개'});
    }
  }
  // 일자 순서로 정렬
  matches.sort((a, b) => {
    if (a.date.month !== b.date.month) return a.date.month - b.date.month;
    return a.date.day - b.date.day;
  });

  return matches;
}

export function progressTournament(matches: ScheduledMatch[], outcome: { matchId: string; tournamentId: string; won: boolean }, playerSchool: HighSchoolData, _schools: HighSchoolData[]): ScheduledMatch[] {
 const current=matches.find(m=>m.id===outcome.matchId);
 if(!current || current.result) return matches;
 const playerHome=current.homeSchoolId===playerSchool.id;
 const result: 'home'|'away' = outcome.won===playerHome?'home':'away';
 if(current.tournamentId==='weekend_league') return matches.map(m=>m.id===current.id?{...m,result}:m);
 const peers=matches.filter(m=>m.tournamentId===current.tournamentId && m.round===current.round);
 const resolved=matches.map(m=>peers.includes(m)?{...m,drawn:true,result:m.id===current.id?result:m.result??(Math.random()<0.5?'home' as const:'away' as const)}:m);
 const winners=resolved.filter(m=>peers.some(p=>p.id===m.id)).map(m=>m.result==='home'?{id:m.homeSchoolId,name:m.homeSchoolName}:{id:m.awaySchoolId,name:m.awaySchoolName});
 if(winners.length<2) return resolved;
 const date=new Date(current.year??2026,current.date.month-1,current.date.day+3);
 const nextRound=winners.length>16?'조 예선 결정전':winners.length===2?'결승전':winners.length===4?'4강 준결승':`${winners.length}강전`;
 for(let i=0;i<winners.length;i+=2){ const home=winners[i],away=winners[i+1];
 resolved.push({...current,id:`${current.tournamentId}_${nextRound}_${i/2}`,date:{month:date.getMonth()+1,day:date.getDate()},round:nextRound,
 group:winners.length>16?`${i/2+1}조`:undefined,result:undefined,drawn:true,
 homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
 isPlayerTeamMatch:home.id===playerSchool.id||away.id===playerSchool.id,description:'이전 라운드 승리 학교끼리 대결'});
 }

 return resolved.sort((a,b)=>a.date.month-b.date.month||a.date.day-b.date.day);
}

/**
 * 특정 날짜에 플레이어 소속 학교 경기가 있는지 조회합니다.
 */
export function getPlayerMatchForDate(
  date: GameDate,
  matches: ScheduledMatch[]
): ScheduledMatch | null {
  return (
    [...matches].sort((a,b)=>Number(a.tournamentId==='weekend_league')-Number(b.tournamentId==='weekend_league')).find(
      m => m.date.month === date.month && m.date.day === date.day && m.isPlayerTeamMatch && !m.result
    ) || null
  );
}

/** Advance non-player rounds only when their scheduled date has arrived. */
export function advanceOtherTournamentMatches(matches: ScheduledMatch[], date: GameDate, playerSchool: HighSchoolData): ScheduledMatch[] {
 let updated=matches;
 for(let i=0;i<32;i++){
  const due=updated.find(m=>m.tournamentId!=='weekend_league'&&!m.result&&!m.isPlayerTeamMatch&&m.date.month*32+m.date.day<=date.month*32+date.day&&!updated.some(p=>p.tournamentId===m.tournamentId&&p.round===m.round&&p.isPlayerTeamMatch&&!p.result));
  if(!due)break;
  updated=progressTournament(updated,{matchId:due.id,tournamentId:due.tournamentId,won:Math.random()<.5},playerSchool,[]);
 }
 return updated;
}

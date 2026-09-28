import type { HighSchoolData, SchoolTier } from './highSchool';
import type { GameDate } from './calendar';

export type TournamentType =
  | 'weekend_league'     // 주말리그 (정규시즌, 매주 토요일 반복)
  | 'spring_national'    // 이마트배 등 전국대회
  | 'summer_national'    // 황금사자기 / 청룡기 등
  | 'autumn_national'    // 봉황대기 등
  | 'sports_festival'    // 전국체육대회 고등부 (시·도 대표전)
  | 'regional_qualifier'; // 지역 예선

/** open: 전국 학교 추첨으로 64강 조 예선부터, provincial: 시·도별 대표 1개교씩 본선 토너먼트 */
export type TournamentEntry = 'open' | 'provincial';

export interface TournamentSchedule {
  id: string;
  type: TournamentType;
  name: string;                 // "제1회 이마트배 전국고교야구대회"
  region?: string;               // regional_qualifier일 때만 사용
  startDate: { month: number; day: number };
  roundIntervalDays: number;     // 라운드 간 간격 (토너먼트면 보통 2~3일)
  participatingTiers: SchoolTier[]; // 어떤 티어 학교가 출전 가능한지
  entry?: TournamentEntry;       // 기본 open
  description?: string;
}

export type MatchKind = 'scrimmage' | 'practice' | 'weekend' | 'national';
export function getMatchKind(match: ScheduledMatch): MatchKind {
  return match.kind ?? (match.tournamentId === 'weekend_league' ? 'weekend' : match.tournamentId.startsWith('scrimmage_') ? 'scrimmage' : match.tournamentId.startsWith('practice_') ? 'practice' : 'national');
}
export interface ScheduledMatch {
  kind?: MatchKind;
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
  {
    id: 'national_sports_festival',
    type: 'sports_festival',
    name: '전국체육대회 고등부 야구',
    startDate: { month: 10, day: 16 },
    roundIntervalDays: 3,
    participatingTiers: ['S', 'A', 'B', 'C', 'D'],
    entry: 'provincial',
    description: '6월 시·도 대표 선발전을 통과한 16개 시·도 대표가 고향의 이름을 걸고 겨루는 종합 체육대회 고등부 종목.',
  },
];

export const NATIONAL_FESTIVAL_ID = 'national_sports_festival';
export const FESTIVAL_QUALIFIER_ID = 'festival_qualifier';

/** 시·도 대표 선발전 라운드 날짜. 황금사자기 이후 6월 평일(주말리그 토요일과 겹치지 않음)에 치르며, 참가 학교가 적으면 뒤쪽 날짜만 쓴다. */
const QUALIFIER_ROUND_DATES = [{ month: 6, day: 9 }, { month: 6, day: 11 }, { month: 6, day: 16 }, { month: 6, day: 18 }, { month: 6, day: 23 }];

/**
 * 제107회 전국체육대회(2026 제주) 남자18세이하부 야구 공식 일정 (대한체육회 대회정보, 2026-09-28 확인).
 * 라운드별 경기는 대진표 위에서부터의 순서이며, 다음 라운드 k번째 경기는 이전 라운드 2k·2k+1번째 경기 승자끼리 치른다.
 */
const FESTIVAL_VENUE = '서귀포야구장';
const FESTIVAL_OFFICIAL_YEAR = 2026;
const FESTIVAL_ROUNDS: { round: string; games: [month: number, day: number, time: string][] }[] = [
  { round: '16강전', games: [[10, 18, '09:00'], [10, 18, '11:30'], [10, 17, '09:00'], [10, 16, '09:00'], [10, 17, '11:30'], [10, 17, '14:00'], [10, 16, '11:30'], [10, 16, '14:00']] },
  { round: '8강전', games: [[10, 19, '14:00'], [10, 19, '09:00'], [10, 19, '11:30'], [10, 18, '14:00']] },
  { round: '4강 준결승', games: [[10, 21, '12:30'], [10, 21, '10:00']] },
  { round: '결승전', games: [[10, 22, '10:00']] },
];
/** 2026 공식 1회전 대진의 시·도 배치 (경기 순서대로 홈, 원정). 발표 전 연도는 같은 일정에 시·도를 무작위로 배치한다. */
const FESTIVAL_2026_DRAW = ['인천', '전남', '전북', '강원', '광주', '경북', '부산', '대전', '경남', '경기', '대구', '충남', '충북', '울산', '제주', '서울'];

/** 대진표 화면에 표시하는 대회 방식 안내 */
export function getTournamentRuleText(tournamentId: string): string {
  if (tournamentId === FESTIVAL_QUALIFIER_ID) return '대회 규칙: 같은 시·도 학교끼리 단판 토너먼트(참가 학교 수에 따라 1회전 부전승) → 우승 학교가 전국체전 시·도 대표로 출전';
  if (tournamentId === NATIONAL_FESTIVAL_ID) return '대회 규칙: 16개 시·도 대표 단판 토너먼트 1회전 → 8강 → 4강 → 결승 (경기마다 정해진 날짜에 진행)';
  return '게임 대회 규칙: 4팀씩 조별 토너먼트 예선 → 조 우승팀 본선 16강 → 8강 → 4강 → 결승';
}

const TIER_ORDER: SchoolTier[] = ['S', 'A', 'B', 'C', 'D'];
type Team = { id: string; name: string };
const BYE: Team = { id: 'bye', name: '부전승' };
const dayOrder = (d: { month: number; day: number }) => d.month * 32 + d.day;
const knockoutRoundName = (teams: number) => teams === 2 ? '결승전' : teams === 4 ? '4강 준결승' : `${teams}강전`;

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** 선발전을 직접 치르지 않는 시·도는 최상위 티어 학교 중 1개교를 대표로 뽑는다. */
function pickRegionRepresentative(schools: HighSchoolData[]): HighSchoolData {
  const bestTier = TIER_ORDER.find(tier => schools.some(s => s.tier === tier));
  const top = schools.filter(s => s.tier === bestTier);
  return top[Math.floor(Math.random() * top.length)];
}

/** 선발전이 끝날 때까지 플레이어 시·도 대표 자리를 지키는 자리 표시 */
const regionPlaceholder = (region: string): Team => ({ id: `rep_${region}`, name: `${region} 선발전 우승교` });

function festivalMatch(year: number, stage: number, k: number, home: Team, away: Team, playerSchool: HighSchoolData, regions?: [string, string]): ScheduledMatch {
  const [month, day, time] = FESTIVAL_ROUNDS[stage].games[k];
  const side = (team: Team, region: string) => team.id.startsWith('rep_') ? team.name : `${region} 대표 ${team.name}`;
  const matchup = regions ? `${side(home, regions[0])} vs ${side(away, regions[1])}` : '이전 경기 승리 시·도 대표끼리 대결';
  return {id:`${NATIONAL_FESTIVAL_ID}_${stage}_${k}`,year,kind:'national',date:{month,day},tournamentId:NATIONAL_FESTIVAL_ID,tournamentName:'전국체육대회 고등부 야구',
    round:FESTIVAL_ROUNDS[stage].round,drawn:true,homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
    isPlayerTeamMatch:home.id===playerSchool.id||away.id===playerSchool.id,
    description:`${time} ${FESTIVAL_VENUE}${year===FESTIVAL_OFFICIAL_YEAR?'':' (가상 일정)'} · ${matchup}`};
}

/** 전국체전 1회전 8경기. 플레이어 시·도는 선발전 우승교(qualifier) 또는 지정 학교가 대표로 나간다. */
function buildFestivalFirstRound(year: number, playerSchool: HighSchoolData, allSchools: HighSchoolData[], playerRegionRep: HighSchoolData | 'qualifier'): ScheduledMatch[] {
  const regions = [...new Set(allSchools.map(s => s.region))];
  const official = year === FESTIVAL_OFFICIAL_YEAR && regions.length === FESTIVAL_2026_DRAW.length && regions.every(r => FESTIVAL_2026_DRAW.includes(r));
  const draw = official ? FESTIVAL_2026_DRAW : shuffle(regions).slice(0, 16);
  if (draw.length < 16) return [];
  const teamFor = (region: string): Team => region !== playerSchool.region
    ? pickRegionRepresentative(allSchools.filter(s => s.region === region))
    : playerRegionRep === 'qualifier' ? regionPlaceholder(region) : playerRegionRep;
  const teams = draw.map(teamFor);
  return Array.from({ length: 8 }, (_, k) => festivalMatch(year, 0, k, teams[2 * k], teams[2 * k + 1], playerSchool, [draw[2 * k], draw[2 * k + 1]]));
}

/** 플레이어 시·도의 전국체전 대표 선발전 1라운드. 학교가 1개뿐인 시·도는 선발전 없이 대표가 된다. */
function buildFestivalQualifier(year: number, playerSchool: HighSchoolData, allSchools: HighSchoolData[]): ScheduledMatch[] {
  const entrants = shuffle(allSchools.filter(s => s.region === playerSchool.region));
  if (entrants.length < 2) return [];
  const size = 2 ** Math.floor(Math.log2(entrants.length));
  const preliminary = entrants.length - size; // 1회전 경기 수. 나머지 학교는 부전승으로 다음 라운드에 오른다.
  const rounds = (preliminary > 0 ? 1 : 0) + Math.log2(size);
  const date = QUALIFIER_ROUND_DATES[QUALIFIER_ROUND_DATES.length - rounds];
  const pairs: [Team, Team][] = [];
  if (preliminary > 0) {
    for (let i = 0; i < preliminary; i++) pairs.push([entrants[2 * i], entrants[2 * i + 1]]);
    for (const school of entrants.slice(2 * preliminary)) pairs.push([school, BYE]);
  } else {
    for (let i = 0; i < entrants.length; i += 2) pairs.push([entrants[i], entrants[i + 1]]);
  }
  return pairs.map(([home, away], i): ScheduledMatch => {
    const bye = away.id === BYE.id;
    return {id:`${FESTIVAL_QUALIFIER_ID}_r0_${i}`,year,kind:'national',date:{...date},tournamentId:FESTIVAL_QUALIFIER_ID,tournamentName:`${playerSchool.region} 전국체전 대표 선발전`,
      round:preliminary>0?'1회전':knockoutRoundName(size),group:`${Math.floor(i/2)+1}조`,drawn:false,result:bye?'home':undefined,
      homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
      isPlayerTeamMatch:!bye&&(home.id===playerSchool.id||away.id===playerSchool.id),
      description:bye?'1회전 부전승 · 다음 라운드 직행':'우승 학교가 전국체전 시·도 대표로 출전'};
  });
}

/** 선발전과 전국체전 1회전을 함께 만든다. qualify=false면 선발전 없이 플레이어 학교가 대표로 출전한다(이전 저장본 보완용). */
function buildFestivalSeason(year: number, playerSchool: HighSchoolData, allSchools: HighSchoolData[], qualify = true): ScheduledMatch[] {
  const qualifier = qualify ? buildFestivalQualifier(year, playerSchool, allSchools) : [];
  return [...qualifier, ...buildFestivalFirstRound(year, playerSchool, allSchools, qualifier.length ? 'qualifier' : playerSchool)];
}

/** 선발전 우승교를 전국체전 대진의 플레이어 시·도 자리에 넣는다. */
function fillFestivalRepresentative(matches: ScheduledMatch[], winner: Team, playerSchool: HighSchoolData): ScheduledMatch[] {
  const placeholder = regionPlaceholder(playerSchool.region);
  const filled = matches.map(m => {
    if (m.tournamentId !== NATIONAL_FESTIVAL_ID || (m.homeSchoolId !== placeholder.id && m.awaySchoolId !== placeholder.id)) return m;
    const home = m.homeSchoolId === placeholder.id ? winner : { id: m.homeSchoolId, name: m.homeSchoolName };
    const away = m.awaySchoolId === placeholder.id ? winner : { id: m.awaySchoolId, name: m.awaySchoolName };
    return {...m,homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
      isPlayerTeamMatch:home.id===playerSchool.id||away.id===playerSchool.id,
      description:m.description?.replace(placeholder.name,`${playerSchool.region} 대표 ${winner.name}`)};
  });
  return settleScheduleConflicts(filled);
}

/** 전국체전은 경기마다 날짜가 달라, 두 선행 경기가 모두 끝나면 바로 다음 경기를 편성한다. */
function progressFestival(matches: ScheduledMatch[], current: ScheduledMatch, result: 'home' | 'away', playerSchool: HighSchoolData): ScheduledMatch[] {
  const updated = matches.map(m => m.id === current.id ? { ...m, drawn: true, result } : m);
  const [stage, k] = current.id.split('_').slice(-2).map(Number);
  if (stage >= FESTIVAL_ROUNDS.length - 1) return updated;
  const byId = (s: number, i: number) => updated.find(m => m.id === `${NATIONAL_FESTIVAL_ID}_${s}_${i}`);
  const [upper, lower] = [byId(stage, k - (k % 2)), byId(stage, k - (k % 2) + 1)];
  if (!upper?.result || !lower?.result || byId(stage + 1, k >> 1)) return updated;
  const winner = (m: ScheduledMatch): Team => m.result === 'home' ? { id: m.homeSchoolId, name: m.homeSchoolName } : { id: m.awaySchoolId, name: m.awaySchoolName };
  return settleScheduleConflicts([...updated, festivalMatch(current.year ?? FESTIVAL_OFFICIAL_YEAR, stage + 1, k >> 1, winner(upper), winner(lower), playerSchool)]);
}

/** 전국대회 1라운드(조 추첨 전) 대진을 만든다. 16개 조, 각 조 4팀 예선 후 조 우승팀만 본선 16강 진출 (게임 규칙). */
function buildNationalFirstRound(tour: TournamentSchedule, year: number, playerSchool: HighSchoolData, otherSchools: HighSchoolData[]): ScheduledMatch[] {
  const entrants = shuffle(otherSchools.slice());
  const field = [playerSchool, ...entrants.slice(0, 63)];
  const size = 2 ** Math.floor(Math.log2(field.length));
  if (size < 2) return [];
  field.length = size;
  shuffle(field);
  const matches: ScheduledMatch[] = [];
  for (let i = 0; i < field.length; i += 2) {
    const home = field[i], away = field[i + 1];
    matches.push({id:`${tour.id}_r0_${i/2}`,year,date:{...tour.startDate},tournamentId:tour.id,tournamentName:tour.name,
      round:size>32?'조 예선 1차전':size>16?'조 예선 결정전':`${size}강전`,group:`${Math.floor(i/4)+1}조`,drawn:false,
      homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
      isPlayerTeamMatch:home.id===playerSchool.id||away.id===playerSchool.id,description:'조 추첨 후 예선 상대 공개'});
  }
  return matches;
}

function buildTournamentOpening(tour: TournamentSchedule, year: number, playerSchool: HighSchoolData, allSchools: HighSchoolData[], qualify = true): ScheduledMatch[] {
  if (tour.id === NATIONAL_FESTIVAL_ID) return buildFestivalSeason(year, playerSchool, allSchools, qualify);
  return buildNationalFirstRound(tour, year, playerSchool, allSchools.filter(s => s.id !== playerSchool.id && s.name !== playerSchool.name));
}

/**
 * 이전 버전 저장본에 없는 전국대회 중 아직 개막 전인 대회의 대진을 추가한다.
 * 전국체전은 선발전 첫날 전이면 선발전부터, 선발전이 지났으면 플레이어 학교가 시·도 대표로 출전한다.
 */
export function addMissingNationals(matches: ScheduledMatch[], year: number, playerSchool: HighSchoolData, allSchools: HighSchoolData[], from: GameDate): ScheduledMatch[] {
  const missing = MAJOR_TOURNAMENT_TEMPLATES.filter(t => !matches.some(m => m.tournamentId === t.id) && dayOrder(t.startDate) >= dayOrder(from));
  if (!missing.length) return matches;
  const qualify = dayOrder(from) <= dayOrder(QUALIFIER_ROUND_DATES[0]);
  const added = [...matches, ...missing.flatMap(t => buildTournamentOpening(t, year, playerSchool, allSchools, qualify))];
  return settleScheduleConflicts(added, from);
}

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

  for (const tour of MAJOR_TOURNAMENT_TEMPLATES) matches.push(...buildTournamentOpening(tour, year, playerSchool, allSchools));
  // 일자 순서로 정렬
  matches.sort((a, b) => {
    if (a.date.month !== b.date.month) return a.date.month - b.date.month;
    return a.date.day - b.date.day;
  });

  return addClubMatches(matches, year, playerSchool, allSchools);
}

export function progressTournament(matches: ScheduledMatch[], outcome: { matchId: string; tournamentId: string; won: boolean }, playerSchool: HighSchoolData, _schools: HighSchoolData[]): ScheduledMatch[] {
 const current=matches.find(m=>m.id===outcome.matchId);
 if(!current || current.result) return matches;
 const playerHome=current.homeSchoolId===playerSchool.id;
 const result: 'home'|'away' = outcome.won===playerHome?'home':'away';
 if(getMatchKind(current)!=='national') return matches.map(m=>m.id===current.id?{...m,result}:m);
 if(current.tournamentId===NATIONAL_FESTIVAL_ID) return progressFestival(matches,current,result,playerSchool);
 const peers=matches.filter(m=>m.tournamentId===current.tournamentId && m.round===current.round);
 const resolved=matches.map(m=>peers.includes(m)?{...m,drawn:true,result:m.id===current.id?result:m.result??(Math.random()<0.5?'home' as const:'away' as const)}:m);
 const winners=resolved.filter(m=>peers.some(p=>p.id===m.id)).map(m=>m.result==='home'?{id:m.homeSchoolId,name:m.homeSchoolName}:{id:m.awaySchoolId,name:m.awaySchoolName});
 if(winners.length<2) return current.tournamentId===FESTIVAL_QUALIFIER_ID&&winners.length===1?fillFestivalRepresentative(resolved,winners[0],playerSchool):resolved;
 // 선발전은 정해진 6월 날짜, 그 밖의 전국대회는 3일 간격으로 다음 라운드를 치른다.
 const qualifierDate=current.tournamentId===FESTIVAL_QUALIFIER_ID?QUALIFIER_ROUND_DATES.find(d=>dayOrder(d)>dayOrder(current.date)):undefined;
 const date=qualifierDate?new Date(current.year??2026,qualifierDate.month-1,qualifierDate.day):new Date(current.year??2026,current.date.month-1,current.date.day+3);
 const nextRound=winners.length>16?'조 예선 결정전':knockoutRoundName(winners.length);
 for(let i=0;i<winners.length;i+=2){ const home=winners[i],away=winners[i+1];
 resolved.push({...current,id:`${current.tournamentId}_${nextRound}_${i/2}`,date:{month:date.getMonth()+1,day:date.getDate()},round:nextRound,
 group:winners.length>16?`${i/2+1}조`:undefined,result:undefined,drawn:true,
 homeSchoolId:home.id,homeSchoolName:home.name,awaySchoolId:away.id,awaySchoolName:away.name,
 isPlayerTeamMatch:home.id===playerSchool.id||away.id===playerSchool.id,description:'이전 라운드 승리 학교끼리 대결'});
 }

 return settleScheduleConflicts(resolved);
}

/**
 * 특정 날짜에 플레이어 소속 학교 경기가 있는지 조회합니다.
 */
export function getPlayerMatchForDate(
  date: GameDate,
  matches: ScheduledMatch[]
): ScheduledMatch | null {
  return (
    [...matches].sort((a,b)=>Number(getMatchKind(a)!=='national')-Number(getMatchKind(b)!=='national')).find(
      m => m.date.month === date.month && m.date.day === date.day && m.isPlayerTeamMatch && !m.result
    ) || null
  );
}

/** Advance non-player rounds only when their scheduled date has arrived. */
export function advanceOtherTournamentMatches(matches: ScheduledMatch[], date: GameDate, playerSchool: HighSchoolData): ScheduledMatch[] {
 let updated=matches;
 for(let i=0;i<32;i++){
  const due=updated.find(m=>getMatchKind(m)==='national'&&!m.result&&!m.isPlayerTeamMatch&&m.date.month*32+m.date.day<=date.month*32+date.day&&(m.tournamentId===NATIONAL_FESTIVAL_ID||!updated.some(p=>p.tournamentId===m.tournamentId&&p.round===m.round&&p.isPlayerTeamMatch&&!p.result)));
  if(!due)break;
  updated=progressTournament(updated,{matchId:due.id,tournamentId:due.tournamentId,won:Math.random()<.5},playerSchool,[]);
 }
 return updated;
}

/** 실제 공식 일정이 아닌 육성 모드의 팀 평가 일정. */
export function addClubMatches(matches: ScheduledMatch[], year: number, school: HighSchoolData, schools: HighSchoolData[], from?: GameDate): ScheduledMatch[] {
  const added=[...matches];
  const dates: {month:number;day:number;kind:'scrimmage'|'practice'}[]=[];
  for(const month of [3,6,9,11]) {dates.push({month,day:7,kind:'scrimmage'},{month,day:21,kind:'practice'});}
  for(const item of dates){
    if(from&&item.month*32+item.day<from.month*32+from.day)continue;
    const id=`${item.kind}_${year}_${item.month}`;if(added.some(m=>m.id===id))continue;
    const opponent=schools.find(s=>s.id!==school.id&&s.region===school.region)??schools.find(s=>s.id!==school.id);
    added.push({id,year,kind:item.kind,date:{month:item.month,day:item.day},tournamentId:id,tournamentName:item.kind==='scrimmage'?'야구부 청백전':'학교 간 연습경기',round:'주전 경쟁 평가전',drawn:true,homeSchoolId:school.id,homeSchoolName:school.name,awaySchoolId:item.kind==='scrimmage'?`${school.id}-white`:opponent?.id??'practice-away',awaySchoolName:item.kind==='scrimmage'?'교내 백팀':opponent?.name??'연습 상대교',isPlayerTeamMatch:true,description:'게임 내 평가 일정 · 선발과 교체 기회를 통해 팀 내 경쟁을 평가합니다.'});
  }
  return settleScheduleConflicts(added,from);
}
/** 한 오후에 두 경기를 치르지 않는다. 겹치는 비전국대회 경기는 다음 빈 날로 이월한다. */
export function settleScheduleConflicts(matches: ScheduledMatch[], from?: GameDate): ScheduledMatch[] {
  const used=new Set<string>();const updated=matches.map(m=>({...m,date:{...m.date}}));
  const candidates=updated.filter(m=>m.isPlayerTeamMatch).sort((a,b)=>Number(!a.result)-Number(!b.result)||Number(getMatchKind(a)!=='national')-Number(getMatchKind(b)!=='national')||a.date.month-b.date.month||a.date.day-b.date.day);
  for(const m of candidates){
    if(from&&m.date.month*32+m.date.day<from.month*32+from.day)continue;
    while(used.has(`${m.date.month}-${m.date.day}`)&&!m.result){const d=new Date(m.year??from?.year??2026,m.date.month-1,m.date.day+1);m.date={month:d.getMonth()+1,day:d.getDate()};}
    used.add(`${m.date.month}-${m.date.day}`);
  }
  return updated.sort((a,b)=>a.date.month-b.date.month||a.date.day-b.date.day);
}

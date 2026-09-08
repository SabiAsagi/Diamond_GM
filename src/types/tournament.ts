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

  // 2. 전국대회는 첫 경기만 편성합니다. 다음 상대는 승리한 뒤에 확정됩니다.

  for (const tour of MAJOR_TOURNAMENT_TEMPLATES) {
    if (!tour.participatingTiers.includes(playerSchool.tier)) {
      continue; // 참가 자격이 안 되면 스킵
    }

    let m = tour.startDate.month;
    let d = tour.startDate.day;

    const opp = getNextOpponent();
    matches.push({
        id: `${tour.id}_r1`,
        date: { month: m, day: d },
        tournamentId: tour.id,
        tournamentName: tour.name,
        round: '예선/32강전',
        homeSchoolId: playerSchool.id,
        homeSchoolName: playerSchool.name,
        awaySchoolId: opp.id,
        awaySchoolName: opp.name,
        isPlayerTeamMatch: true,
        description: `${tour.name} 첫 경기 (${opp.name}전) · 승리 시 다음 대진 공개`,
      });
  }

  // 일자 순서로 정렬
  matches.sort((a, b) => {
    if (a.date.month !== b.date.month) return a.date.month - b.date.month;
    return a.date.day - b.date.day;
  });

  return matches;
}

export function progressTournament(matches: ScheduledMatch[], outcome: { matchId: string; tournamentId: string; won: boolean }, playerSchool: HighSchoolData, schools: HighSchoolData[]): ScheduledMatch[] {
  if (outcome.tournamentId === 'weekend_league' || !outcome.won) return matches;
  const current = matches.find(m => m.id === outcome.matchId);
  if (!current || matches.some(m => m.tournamentId === outcome.tournamentId && m.id !== current.id)) return matches;
  const rounds = ['예선/32강전','16강전','8강전','4강 준결승','결승전'];
  const currentIndex = rounds.indexOf(current.round);
  if (currentIndex < 0 || currentIndex === rounds.length - 1) return matches;
  const candidates = schools.filter(s => s.id !== playerSchool.id && s.id !== current.awaySchoolId);
  const opponent = candidates[Math.floor(Math.random() * candidates.length)];
  let month = current.date.month, day = current.date.day + 3;
  const daysInMonth = new Date(2026, month, 0).getDate(); if (day > daysInMonth) { day -= daysInMonth; month += 1; }
  const next: ScheduledMatch = { ...current, id:`${outcome.tournamentId}_r${currentIndex+2}`, date:{month,day}, round:rounds[currentIndex+1], awaySchoolId:opponent.id, awaySchoolName:opponent.name, description:`이전 경기 승리로 진출 · ${opponent.name}전` };
  return [...matches, next].sort((a,b)=>a.date.month-b.date.month || a.date.day-b.date.day);
}

/**
 * 특정 날짜에 플레이어 소속 학교 경기가 있는지 조회합니다.
 */
export function getPlayerMatchForDate(
  date: GameDate,
  matches: ScheduledMatch[]
): ScheduledMatch | null {
  return (
    matches.find(
      m => m.date.month === date.month && m.date.day === date.day && m.isPlayerTeamMatch
    ) || null
  );
}

import type { Player, GameDate, ScheduledMatch } from '../types';
import { getBondScores, type BondId, type BondScores } from '../types/bondScores';
import { scoreToStage } from '../types/relationship';
import { getNationalPercentile } from './nationalRanking';
import { overallRating } from './playerDevelopment';
import { buildAchievements } from './achievements';
import { getMatchKind } from '../types/tournament';
import { trainingRecommendation, type TeamRole } from './teamCompetition';

export interface GradeSnapshot {
  date: GameDate;
  partial: boolean;
  overall: number;
  percentile: number;
  bonds: BondScores;
  achievementIds: string[];
  recordCount: number;
  role: TeamRole;
  coachEvaluation: number;
  technicalEvaluation: number;
  tournaments: TournamentSummary[];
}
export interface TournamentSummary {
  id: string;
  name: string;
  result: string;
  games: number;
  wins: number;
}
export interface GradeReport {
  id: string;
  grade: number;
  start: GradeSnapshot;
  end: GradeSnapshot;
  tournaments: TournamentSummary[];
  officialAppearances: number;
  benchGames: number;
  unknownGames: number;
  newBonds: BondId[];
  achievements: { id: string; title: string }[];
  recommendation: string;
}

export function createGradeSnapshot(player: Player, date: GameDate): GradeSnapshot {
  const overall = overallRating(player);
  return { date: { ...date }, partial: date.month !== 3 || date.day > 2,
    overall, percentile: getNationalPercentile({ ...player, overall, grade: date.grade }).percentile,
    bonds: getBondScores(player), achievementIds: [...(player.earnedAchievementIds ?? [])],
    recordCount: player.matchRecords?.length ?? 0, role: player.teamCompetition?.role ?? 'bench',
    coachEvaluation: player.teamCompetition?.coachEvaluation ?? 0,
    technicalEvaluation: player.teamCompetition?.technicalEvaluation ?? 0, tournaments: [] };
}

/** 기존 대진표를 요약한다. 다음 해 일정으로 교체하기 전에만 별도로 보존한다. */
export function summarizeTournaments(matches: ScheduledMatch[], school: string, year: number): TournamentSummary[] {
  const own = matches.filter(m => m.isPlayerTeamMatch && m.result);
  return [...new Set(own.map(m => m.tournamentId))].flatMap(id => {
    const games = own.filter(m => m.tournamentId === id);
    if (['practice', 'scrimmage'].includes(getMatchKind(games[0]))) return [];
    const won = (m: ScheduledMatch) => (m.result === 'home' ? m.homeSchoolName : m.awaySchoolName) === school;
    const last = games.toSorted((a, b) => a.date.month * 32 + a.date.day - b.date.month * 32 - b.date.day).at(-1)!;
    const result = getMatchKind(last) === 'weekend' ? `${games.filter(won).length}승 ${games.filter(m => !won(m)).length}패`
      : last.round === '결승전' ? (won(last) ? '우승' : '준우승')
      : `${last.round} ${won(last) ? '진출' : '탈락'}`;
    return [{ id: `${last.year ?? year}:${id}`, name: last.tournamentName, result, games: games.length, wins: games.filter(won).length }];
  });
}

export function preserveGradeTournaments(player: Player, matches: ScheduledMatch[]): Player {
  if (!player.gradeStartSnapshot) return player;
  const summaries = new Map(player.gradeStartSnapshot.tournaments.map(t => [t.id, t]));
  for (const summary of summarizeTournaments(matches, player.highSchool, player.savedSeasonYear ?? player.gameDate?.year ?? player.gradeStartSnapshot.date.year)) summaries.set(summary.id, summary);
  return { ...player, gradeStartSnapshot: { ...player.gradeStartSnapshot, tournaments: [...summaries.values()] } };
}

/** 진급 전 학년/평가로 마감하여 동학년 퍼센타일의 기준과 팀 역할이 섞이지 않게 한다. */
export function finishGradeReport(player: Player, date: GameDate): Player {
  const start = player.gradeStartSnapshot;
  if (!start) return player;
  const id = `${start.date.year}:${date.grade}`;
  if (player.gradeReports?.some(r => r.id === id)) return player;
  const end = createGradeSnapshot(player, date);
  const records = (player.matchRecords ?? []).slice(start.recordCount).filter(r => !['scrimmage', 'practice'].includes(r.kind ?? ''));
  const report: GradeReport = { id, grade: date.grade, start, end,
    tournaments: preserveGradeTournaments(player, player.savedMatches ?? []).gradeStartSnapshot!.tournaments,
    officialAppearances: records.filter(r => r.performance && !['bench', 'outside'].includes(r.performance.role)).length,
    benchGames: records.filter(r => r.performance && ['bench', 'outside'].includes(r.performance.role)).length,
    unknownGames: records.filter(r => !r.performance).length,
    newBonds: (Object.keys(end.bonds) as BondId[]).filter(id => scoreToStage(start.bonds[id]) < 3 && scoreToStage(end.bonds[id]) >= 3),
    achievements: buildAchievements(player).filter(a => a.unlocked && !start.achievementIds.includes(a.id)).map(a => ({ id: a.id, title: a.title })),
    recommendation: trainingRecommendation(player) };
  return { ...player, gradeReports: [...(player.gradeReports ?? []), report], pendingGradeReportId: id };
}

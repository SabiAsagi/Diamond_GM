import { pitchingRating, battingRating, normalizePlayer } from '../data/playerDevelopment';
import { getEffectiveStat } from '../types/equipment';
import type { ScheduledMatch } from '../types/tournament';
import type { Player } from '../types';
import type { HighSchoolData } from '../types/highSchool';
import type { ActivityResult } from '../types/activity';
import { scoreToStage } from '../types/relationship';

/**
 * 경기 세부 시뮬레이션(타석/투구 확률 계산) 이전 단계의 임시 더미 경기 결과 생성 엔진.
 * 오후 슬롯이 강제 전환되었을 때 호출되어 realistic한 스코어, 개인 성적 및 로그를 생성합니다.
 */
export function resolveMatchPlaceholder(
  match: ScheduledMatch,
  player: Player,
  playerSchool: HighSchoolData
): ActivityResult {
  const isPitcher = player.position === 'P';
  const isTwoWay = player.position === 'TwoWay';

  // 학교 및 선수 역량 기반 승률 계산
  player=normalizePlayer(player);
  const baseSkill=isPitcher?pitchingRating(player):isTwoWay?(pitchingRating(player)+battingRating(player))/2:battingRating(player);

  const coachStage = scoreToStage(player.relationshipCoach || 0);
  const coachTrustBonus = coachStage >= 4 ? 0.04 : 0;
  const isWin = Math.random() < Math.min(.9,Math.max(.1,0.5 + (baseSkill - 20) * 0.005 + coachTrustBonus));

  let myScore: number;
  let oppScore: number;
  if (isWin) {
    oppScore = Math.floor(Math.random() * 4);
    myScore = oppScore + 1 + Math.floor(Math.random() * 4);
  } else {
    myScore = Math.floor(Math.random() * 4);
    oppScore = myScore + 1 + Math.floor(Math.random() * 4);
  }

  const scoreText = `${playerSchool.name} ${myScore} : ${oppScore} ${match.homeSchoolName===playerSchool.name?match.awaySchoolName:match.homeSchoolName}`;
  const winStatus = isWin ? '승리! 🎉' : '아쉬운 패배 😢';

  // 개인 성적 및 스탯 변동
  let personalPerformance = '';
  let stuffGain = 0;
  let controlGain = 0;
  let contactGain = 0;
  let powerGain = 0;
  let eyeGain = 0;
  const fameGain = isWin ? 3 : 1;

  const effectiveStuff = getEffectiveStat(player, 'stuff');
  const effectivePower = getEffectiveStat(player, 'power');

  if (isPitcher || isTwoWay) {
    const innings = Math.min(9, 4 + Math.floor(Math.random() * 5));
    const kCount = Math.floor(Math.random() * 6) + (effectiveStuff > 30 ? 4 : 2);
    const runs = Math.min(oppScore,Math.floor(Math.random() * (oppScore+1)));
    personalPerformance = `[선발 등판] ${innings}이닝 ${kCount}탈삼진 ${runs}실점`;
    stuffGain = 1;
    controlGain = 1;
    if (isTwoWay) { const hits = Math.random() > .45 ? 2 : 1; personalPerformance += ` · [타석] 4타수 ${hits}안타 ${hits}타점`; contactGain = 1; eyeGain = 1; }
  } else {
    const atBats = 4;
    let hits = isWin ? (Math.random() > 0.4 ? 2 : 1) : (Math.random() > 0.6 ? 1 : 0);
    const isHr = Math.random() < (effectivePower > 30 ? 0.25 : 0.08);
    if(isHr)hits=Math.max(1,hits);
    const hrText = isHr ? ' 1홈런' : '';
    const rbi = hits + (isHr ? 2 : 0);
    personalPerformance = `[타석 기록] ${atBats}타수 ${hits}안타${hrText} ${rbi}타점`;
    contactGain = 1;
    if (isHr) powerGain = 1;
    eyeGain = 1;
  }

  const trustText = coachTrustBonus ? ' · 감독 신뢰로 선발 기회 우대' : '';
  const logMessage = `🏆 [${match.tournamentName} ${match.round}] ${scoreText} (${winStatus})\n⚾ ${personalPerformance} | 인지도 +${fameGain}, 실전 감각 대폭 상승!${trustText}`;

  return {
    statChanges: {
      stuff: stuffGain,
      control: controlGain,
      contact: contactGain,
      power: powerGain,
      eye: eyeGain,
      fame: fameGain,
      condition: isWin ? 5 : -5,
      relationshipTeam: 3,
    },
    staminaDelta: -25, // 경기 소모 체력
    mentalDelta: isWin ? 10 : -8,
    logMessage,
    matchOutcome: { matchId: match.id, tournamentId: match.tournamentId, won: isWin },
  };
}

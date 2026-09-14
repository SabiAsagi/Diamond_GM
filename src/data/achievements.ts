import type { Player } from '../types';
import { scoreToStage } from '../types/relationship';
import { MAJOR_TOURNAMENT_TEMPLATES } from '../types/tournament';

export interface Achievement { id: string; title: string; desc: string; unlocked: boolean; icon: string }
export interface TournamentTrophy { id: string; name: string; subtitle: string; unlocked: boolean; icon: string }

export function buildAchievements(p: Player): Achievement[] {
  const pitcher = p.position === 'P' || p.position === 'TwoWay';
  const rows: Array<[string, string, string, boolean, string]> = [
    ['entrance', '고교 야구부 입학', '감독 면담 완료', !!p.interviewCompleted, '🌸'],
    ['first_match', '첫 공식전 출전', '저장된 공식 경기 기록 1개 이상', (p.matchRecords?.length ?? 0) >= 1, '⚾'],
    ['pro_interest', '스카우트 레이더망 포착', '인지도 30 이상', (p.fame ?? 0) >= 30, '📋'],
    ['ace', pitcher ? '탈삼진 머신' : '거포의 탄생', pitcher ? '구위 30 이상' : '파워 30 이상', pitcher ? p.stuff >= 30 : p.power >= 30, '🔥'],
    ['academics', '성실한 학생 선수', '학업 70 이상', p.academics >= 70, '📜'],
    ['national_prospect', '전국구 유망주', '인지도 70 이상', (p.fame ?? 0) >= 70, '👑'],
    ['academic_excellence', '학업 우수상', '학업 90 이상', p.academics >= 90, '🎓'],
    ['scholar_athlete', '문무겸비', '학업 80과 종합 60 동시 달성', p.academics >= 80 && p.overall >= 60, '🏅'],
    ['coach_trust', '감독의 신임', '감독 인연 5단계', scoreToStage(p.relationshipCoach ?? 0) === 5, '🧢'],
    ['popular', '인기만점', '친구 인연 5단계', scoreToStage(p.relationshipFriends ?? 0) === 5, '🤝'],
    ['team_bond', '팀의 중심', '팀 인연 5단계', scoreToStage(p.relationshipTeam ?? 0) === 5, '🫂'],
    ['potential', '잠재력 만개', '종합이 잠재력의 90% 이상', p.potential > 0 && p.overall >= p.potential * .9, '✨'],
    ['pitch_master', '구종 마스터', '구종 하나가 해당 구종의 잠재력 상한에 도달', pitcher && !!p.pitches?.some(x => x.potential > 0 && x.rating >= x.potential), '🎯'],
    ['pitch_repertoire', '다채로운 레퍼토리', '숙련도 1 이상 구종 3개 보유', pitcher && (p.pitches?.filter(x => x.rating > 0).length ?? 0) >= 3, '🌀'],
    ['equipment', '나만의 장비', '장비 3개 이상 보유', new Set(p.inventory ?? []).size >= 3, '🧤'],
    ['veteran', '그라운드의 경험', '공식 경기 기록 20개 이상', (p.matchRecords?.length ?? 0) >= 20, '💪'],
  ];
  return rows.map(([id, title, desc, unlocked, icon]) => ({ id: `ach_${id}`, title, desc, unlocked: unlocked || !!p.earnedAchievementIds?.includes(`ach_${id}`), icon }));
}

export function buildTournamentTrophies(p: Player): TournamentTrophy[] {
  const games = (p.savedMatches ?? []).filter(m => m.isPlayerTeamMatch && (m.homeSchoolName === p.highSchool || m.awaySchoolName === p.highSchool));
  return MAJOR_TOURNAMENT_TEMPLATES.flatMap(t => {
    const own = games.filter(m => m.tournamentId === t.id);
    return [
      { stage: 'semifinal', label: '4강 진출', icon: '🥉', reached: own.some(m => m.round === '4강 준결승' || m.round === '결승전') },
      { stage: 'final', label: '결승 진출', icon: '🥈', reached: own.some(m => m.round === '결승전') },
      { stage: 'champion', label: '우승', icon: '🏆', reached: own.some(m => m.round === '결승전' && !!m.result && (m.result === 'home' ? m.homeSchoolName : m.awaySchoolName) === p.highSchool) },
    ].map(s => {
      const id = `${t.id}_${s.stage}`;
      return { id, name: t.name, subtitle: s.label, icon: s.icon, unlocked: s.reached || !!p.earnedTrophyIds?.includes(id) };
    });
  });
}

/** Latch earned awards before saving or replacing a season's match schedule. */
export function captureAchievements(p: Player): void {
  p.earnedAchievementIds = [...new Set([...(p.earnedAchievementIds ?? []), ...buildAchievements(p).filter(a => a.unlocked).map(a => a.id)])];
  p.earnedTrophyIds = [...new Set([...(p.earnedTrophyIds ?? []), ...buildTournamentTrophies(p).filter(t => t.unlocked).map(t => t.id)])];
}

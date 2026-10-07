import type { GameDate, Player } from '../types';
import { isGoalForMonth } from './monthlyGoals';
import { buildAchievements, buildTournamentTrophies } from './achievements';
import { PITCH_NAMES } from './playerDevelopment';
import { EQUIPMENT_CATALOG } from '../types/equipment';
import { getBondName } from './cast';
import { hasMet, ROUTE_LABELS, GRADE_STORY_SCENES } from './careerJourney';
import { scoreToStage, STAGE_LABELS } from '../types/relationship';
import type { BondId } from '../types/bondScores';

export type NewsTab = 'records' | 'goals' | 'info';
export interface PlayerNews { id: string; tab: NewsTab; section: string; title: string; }

/** 저장 원본에서 소식을 파생한다. 날짜·플레이어별 읽음 기록은 Player에 저장한다. */
export function collectPlayerNews(player: Player, date: GameDate): PlayerNews[] {
  const news: PlayerNews[] = [{ id: `overall:${player.overall}`, tab: 'info', section: 'ratings', title: `종합 능력치 ${player.overall}` }];
  for (const pitch of player.pitches ?? []) if (pitch.rating > 0) news.push({ id: `pitch:${pitch.type}:${Math.floor(pitch.rating / 10)}`, tab: 'info', section: 'pitches', title: `${PITCH_NAMES[pitch.type]} 숙련도 ${pitch.rating}` });
  for (const id of player.inventory ?? []) news.push({ id: `item:${id}`, tab: 'info', section: 'equipment', title: `새 장비 · ${EQUIPMENT_CATALOG.find(e => e.id === id)?.name ?? id}` });
  for (const trait of player.traits ?? []) news.push({ id: `trait:${trait}`, tab: 'info', section: 'relationships', title: `새 특성 · ${trait}` });
  for (const id of player.careerJourney?.met ?? []) if (!['mother','father'].includes(id)) news.push({id:`met:${id}`,tab:'info',section:'relationships',title:`새 인연 · ${getBondName(player,id)}`});
  for (const route of player.careerJourney?.offers ?? []) news.push({id:`offer:${route}`,tab:'info',section:'journey',title:`새 진로 제안 · ${ROUTE_LABELS[route]}`});
  for (const scene of GRADE_STORY_SCENES) if (player.careerJourney?.completedScenes.includes(scene.id)) news.push({id:`story:${scene.id}`,tab:'info',section:'journey',title:`육성 이야기 · ${scene.title}`});
  for (const [id, score] of Object.entries(player.relationships)) {
    const stage = scoreToStage(score ?? 0);
    if (stage > 1 && hasMet(player, id)) news.push({ id: `bond:${id}:${stage}`, tab: 'info', section: 'relationships', title: `${getBondName(player, id as BondId)} · ${STAGE_LABELS[stage]}` });
  }
  for (const r of player.matchRecords ?? []) news.push({ id: `match:${r.year}:${r.matchId}`, tab: 'records', section: 'matches', title: `${r.year}년 경기 기록이 추가되었습니다.` });
  for (const r of player.gradeReports ?? []) news.push({ id: `grade:${r.id}`, tab: 'records', section: 'years', title: `${r.grade}학년 일지가 도착했습니다.` });
  if (!player.careerEndedAt && !player.gradeReports?.some(r => r.grade === 3) && !isGoalForMonth(player.monthlyGoal, date)) news.push({ id: `plan:${date.year}:${date.month}`, tab: 'goals', section: 'monthly', title: `${date.month}월의 새 목표를 정할 수 있습니다.` });
  for (const r of player.monthlyGoalReports ?? []) news.push({ id: `goal:${r.id}`, tab: 'goals', section: 'monthly', title: `${r.month}월 목표 ${r.completed ? '달성' : '평가'} · ${r.title}` });
  for (const a of buildAchievements(player)) if (a.unlocked) news.push({ id: `award:${a.id}`, tab: 'goals', section: 'trophies', title: `업적 달성 · ${a.title}` });
  for (const t of buildTournamentTrophies(player)) if (t.unlocked) news.push({ id: `trophy:${t.id}`, tab: 'goals', section: 'trophies', title: `${t.name} · ${t.subtitle}` });
  return news;
}

export function getUnreadNews(player: Player, date: GameDate): PlayerNews[] {
  const read = new Set(player.readNewsIds ?? []);
  return collectPlayerNews(player, date).filter(n => !read.has(n.id));
}

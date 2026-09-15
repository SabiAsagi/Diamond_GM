import type { Player } from './index';

export const BOND_NAMES = {
  coach: '야구부 감독', coach2: '기술 코치', teacher: '담임 선생님', pe: '체육 선생님',
  senior: '강민준', peer: '이도현', rival: '박태성', junior: '이준서',
  childhood: '한서윤', neighbor: '최민재', deskmate: '윤하린', mother: '어머니', father: '아버지',
} as const;
export type BondId = keyof typeof BOND_NAMES;
export type RelationshipCharacterId = BondId;
export type BondScores = Record<BondId, number>;
export type RelationshipTargets = Partial<BondScores>;
export const TEAM_BOND_IDS: BondId[] = ['pe', 'senior', 'peer', 'rival', 'junior'];
export const FRIEND_BOND_IDS: BondId[] = ['teacher', 'childhood', 'neighbor', 'deskmate'];
export const INITIAL_RELATIONSHIPS: BondScores = {
  coach:10, coach2:10, teacher:15, pe:15, senior:10, peer:15, rival:10, junior:10,
  childhood:15, neighbor:15, deskmate:15, mother:20, father:20,
};
const clamp = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;

// 구 저장을 읽을 때만 허용하는 필드. Player에는 존재하지 않으며 정규화 후 저장에서 제거된다.
interface LegacyRelationshipFields {
  relationshipCoach?: number; relationshipTeam?: number;
  relationshipFriends?: number; relationshipFamily?: number;
}
export function getBondScores(p: Player): BondScores {
  const old = p as Player & LegacyRelationshipFields;
  const c = clamp(old.relationshipCoach ?? 10), t = clamp(old.relationshipTeam ?? 10);
  const f = clamp(old.relationshipFriends ?? 15), family = clamp(old.relationshipFamily ?? 20);
  const scores: BondScores = {
    coach:c, coach2:c, teacher:f, pe:t, senior:t, peer:t, rival:t, junior:t,
    childhood:f, neighbor:f, deskmate:f, mother:family, father:family,
  };
  // 0점도 유지하며 부분 저장에서 누락된 인물만 채운다. 반복 변환으로 점수를 덮어쓰지 않는다.
  for (const id of Object.keys(scores) as BondId[]) scores[id] = clamp(p.relationships?.[id] ?? scores[id]);
  return scores;
}
export const getRelScore = (p: Player, id: BondId) => clamp(p.relationships?.[id] ?? 10);
export const getBondScore = getRelScore;
export function getHighestBondScore(p: Player, ids: BondId[]): number {
  return Math.max(0, ...ids.map(id => getRelScore(p,id)));
}
export function normalizeRelationships(p: Player): Player {
  const next: Player & LegacyRelationshipFields = {...p, relationships:getBondScores(p)};
  delete next.relationshipCoach; delete next.relationshipTeam;
  delete next.relationshipFriends; delete next.relationshipFamily;
  return next;
}
export function applyBondChanges(p: Player, targets: RelationshipTargets = {}): Player {
  const relationships = getBondScores(p);
  for (const [targetId,delta] of Object.entries(targets)) {
    if (Object.hasOwn(BOND_NAMES,targetId) && Number.isFinite(delta)) {
      const id = targetId as BondId;
      relationships[id] = clamp(relationships[id] + delta);
    }
  }
  return normalizeRelationships({...p,relationships});
}
export function actualBondChanges(before: Player, after: Player): RelationshipTargets {
  const changes: RelationshipTargets = {};
  for (const id of Object.keys(BOND_NAMES) as BondId[]) {
    const delta = getRelScore(after,id) - getRelScore(before,id);
    if(delta) changes[id] = delta;
  }
  return changes;
}
export const formatBondChanges = (targets: RelationshipTargets = {}) => Object.entries(targets)
  .filter(([,delta]) => delta !== 0).map(([id,delta]) => `${BOND_NAMES[id as BondId]} 인연 ${delta > 0 ? '+' : ''}${delta}`).join(' · ');

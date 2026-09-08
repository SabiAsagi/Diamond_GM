import type { Player } from './index';

export type RelationshipStage = 1 | 2 | 3 | 4 | 5;
export const STAGE_LABELS = ['','아는 사이','친한 사이','가까운 사이','신뢰하는 사이','특별한 인연'];
export const scoreToStage = (score: number): RelationshipStage => score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;

export interface BondProfile { id: string; name: string; role: string; score: number; icon: string; note: string; romanceable?: boolean; }

export function buildBondProfiles(player: Player): BondProfile[] {
  const team = player.relationshipTeam || 50, friends = player.relationshipFriends || 50, coach = player.relationshipCoach || 50, family = player.relationshipFamily || 50;
  const grade = player.grade || 1;
  return [
    { id:'coach', name:'야구부 감독', role:'감독', score:coach, icon:'🧢', note:'훈련 효율과 출전 기회가 증가합니다.' },
    { id:'coach2', name:'기술 코치', role:'코치', score:Math.min(100,coach+2), icon:'📋', note:'포지션별 특별 훈련이 열립니다.' },
    { id:'teacher', name:'담임 선생님', role:'담임', score:friends, icon:'👩‍🏫', note:'학업과 진로 상담을 도와줍니다.' },
    { id:'pe', name:'체육 선생님', role:'체육', score:team, icon:'🏃', note:'체력 관리와 부상 예방을 돕습니다.' },
    ...(grade < 3 ? [{ id:'senior', name:'야구부 주장 선배', role:'선배', score:team, icon:'⚾', note:'졸업 후에도 인연이 높으면 프로·대학·사회 진로 조언을 전합니다.' }] : []),
    { id:'peer', name:'입학 동기 김도윤', role:'동기', score:team, icon:'🤝', note:'함께 성장하며 주전 경쟁을 벌입니다.' },
    { id:'rival', name:'지역 라이벌 박태성', role:'라이벌', score:Math.max(25,team-10), icon:'🔥', note:'대결할수록 집중력과 실전 감각이 오릅니다.' },
    ...(grade > 1 ? [{ id:'junior', name:'야구부 후배 이준서', role:'후배', score:team, icon:'🌱', note:'조언과 멘토링 이벤트가 열립니다.' }] : []),
    { id:'childhood', name:'소꿉친구 한서윤', role:'소꿉친구', score:friends, icon:'🌸', note:'오랜 추억을 공유합니다. 높은 단계에서 연애 이벤트가 열립니다.', romanceable:true },
    { id:'neighbor', name:'동네 친구 최민재', role:'동네 친구', score:friends, icon:'🎮', note:'휴식과 취미 이벤트를 함께합니다.' },
    { id:'deskmate', name:'옆자리 단짝 윤하린', role:'반 친구', score:friends, icon:'📚', note:'공부와 학교생활을 돕습니다.', romanceable:true },
    { id:'mother', name:'어머니', role:'가족', score:family, icon:'🏠', note:'식사와 응원으로 컨디션을 회복합니다.' },
    { id:'father', name:'아버지', role:'가족', score:family, icon:'🧤', note:'진로와 장비에 관한 현실적인 조언을 전합니다.' },
  ];
}

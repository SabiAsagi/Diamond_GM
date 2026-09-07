import type { Player } from '../../../types';
import { Users, Sparkles } from 'lucide-react';

interface RelationshipsViewProps {
  player: Player;
  onClose: () => void;
}

interface RelationshipProfile {
  id: string;
  name: string;
  role: string;
  score: number;
  levelTitle: string;
  effectDescription: string;
  icon: string;
}

export function RelationshipsView({ player }: RelationshipsViewProps) {
  const getLevel = (val: number) => {
    if (val >= 85) return { title: '영혼의 단짝 / 무한 신뢰', color: '#10b981' };
    if (val >= 70) return { title: '매우 돈독함 / 든든한 조력', color: '#3b82f6' };
    if (val >= 50) return { title: '원만한 관계 / 보통', color: '#fbbf24' };
    return { title: '어색함 / 관심 필요', color: '#ef4444' };
  };

  const relCoach = player.relationshipCoach || 50;
  const relTeam = player.relationshipTeam || 50;
  const relFriends = player.relationshipFriends || 50;
  const relFamily = player.relationshipFamily || 50;

  const profiles: RelationshipProfile[] = [
    {
      id: 'coach',
      name: `${player.highSchool} 야구부 감독님`,
      role: '사령탑 / 지도자',
      score: relCoach,
      levelTitle: getLevel(relCoach).title,
      effectDescription: '신뢰도가 높을수록 실전 경기 주전 기용 확률 증가 및 방과 후 1:1 레슨 이벤트 확률 상승',
      icon: '👨‍🏫',
    },
    {
      id: 'lead_coach',
      name: '야구부 수석 트레이닝 코치',
      role: '피지컬 & 기술 코치',
      score: Math.min(100, relCoach + 5),
      levelTitle: getLevel(relCoach + 5).title,
      effectDescription: '훈련 피로도 경감 및 특화 훈련 시 추가 스탯 보너스 효과 부여',
      icon: '🏋️',
    },
    {
      id: 'senior_ace',
      name: '3학년 주장 & 주전 선배진',
      role: '선배 / 멘토',
      score: relTeam,
      levelTitle: getLevel(relTeam).title,
      effectDescription: '대회 출전 시 경기 긴장감 감소 및 클러치 위기 상황에서 팀 수비력 보정',
      icon: '⚾',
    },
    {
      id: 'peers',
      name: '야구부 1학년 입학 동기들',
      role: '동기 / 라이벌',
      score: relFriends,
      levelTitle: getLevel(relFriends).title,
      effectDescription: '자체 청백전 경험치 획득량 증가 및 야간 교우 활동 시 컨디션 대폭 회복',
      icon: '🤝',
    },
    {
      id: 'classmates',
      name: '학급 반 친구들',
      role: '일반 학생 / 교우',
      score: relFriends,
      levelTitle: getLevel(relFriends).title,
      effectDescription: '중간/기말고사 시험 기간 학업 성취도 보너스 및 학교생활 멘탈 지원',
      icon: '🏫',
    },
    {
      id: 'family',
      name: '언제나 헌신해주시는 부모님',
      role: '가족 / 정신적 지주',
      score: relFamily,
      levelTitle: getLevel(relFamily).title,
      effectDescription: '슬럼프 및 저체력 위기 상태에서 즉각적인 멘탈 회복과 심리적 안정감 제공',
      icon: '🏠',
    },
  ];

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Users size={22} className="text-secondary" />
          <div>
            <h3 className="menu-view-title">선수 인연 & 인간관계도</h3>
            <p className="menu-view-sub">지도자, 동료, 친구, 가족과의 신뢰도와 특수 관계 효과를 확인합니다.</p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        <div className="relationships-grid">
          {profiles.map(p => {
            const lvl = getLevel(p.score);
            return (
              <div key={p.id} className="rel-card glass-panel">
                <div className="rel-card-top">
                  <span className="rel-icon">{p.icon}</span>
                  <div className="rel-info">
                    <strong className="rel-name">{p.name}</strong>
                    <span className="rel-role">{p.role}</span>
                  </div>
                  <span className="rel-score-badge" style={{ color: lvl.color, borderColor: lvl.color }}>
                    {p.score} pt
                  </span>
                </div>

                <div className="rel-gauge-track">
                  <div
                    className="rel-gauge-fill"
                    style={{ width: `${p.score}%`, backgroundColor: lvl.color }}
                  ></div>
                </div>

                <div className="rel-status-text">
                  <span>관계 단계: <strong style={{ color: lvl.color }}>{p.levelTitle}</strong></span>
                </div>

                <p className="rel-effect-desc">
                  <Sparkles size={12} className="text-accent" /> {p.effectDescription}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

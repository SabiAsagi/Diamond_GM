import { buildAchievements, buildTournamentTrophies } from '../../../data/achievements';
import type { Player } from '../../../types';
import { Award, Trophy, Medal, Lock, CheckCircle } from 'lucide-react';

interface TrophiesViewProps {
  player: Player;
  onClose: () => void;
}

export function TrophiesView({ player }: TrophiesViewProps) {
  const tournamentTrophies = buildTournamentTrophies(player);
  const achievements = buildAchievements(player);

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Award size={22} className="text-accent" />
          <div>
            <h3 className="menu-view-title">대회 트로피 진열장 & 업적 뱃지</h3>
            <p className="menu-view-sub">전국대회 제패 기록과 선수가 달성한 명예로운 이력을 확인합니다.</p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        {/* 메이저 전국대회 트로피 진열장 */}
        <div className="trophies-section">
          <h4 className="section-sub-title">
            <Trophy size={16} color="#fbbf24" /> 전국대회 단계별 트로피
          </h4>
          <div className="trophies-grid">
            {tournamentTrophies.map(t => (
              <div key={t.id} className={`trophy-card glass-panel ${t.unlocked ? 'unlocked' : 'locked'}`}>
                <div className="t-icon-box">
                  {t.unlocked ? (
                    <span className="trophy-emoji">{t.icon}</span>
                  ) : (
                    <div className="trophy-locked-icon">
                      <Lock size={20} className="text-muted" />
                    </div>
                  )}
                </div>
                <strong className="t-name">{t.name}</strong>
                <span className="t-desc">{t.subtitle}</span>
                <span className={`t-status-chip ${t.unlocked ? 'status-won' : 'status-lock'}`}>
                  {t.unlocked ? `${t.subtitle} 달성 ${t.icon}` : '도전 진행 중'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 커리어 업적 뱃지 */}
        <div className="achievements-section" style={{ marginTop: '24px' }}>
          <h4 className="section-sub-title">
            <Medal size={16} color="#34d399" /> 선수 개인 업적 뱃지
          </h4>
          <div className="achievements-grid">
            {achievements.map(a => (
              <div key={a.id} className={`achievement-card glass-panel ${a.unlocked ? 'unlocked' : 'locked'}`}>
                <div className="ach-icon-circle">
                  {a.unlocked ? a.icon : <Lock size={16} color="#94a3b8" />}
                </div>
                <div className="ach-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong className="ach-title">{a.title}</strong>
                    {a.unlocked && <CheckCircle size={14} color="#10b981" />}
                  </div>
                  <p className="ach-desc">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


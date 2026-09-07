import type { Player } from '../../../types';
import { Award, Trophy, Medal, Lock, CheckCircle } from 'lucide-react';

interface TrophiesViewProps {
  player: Player;
  onClose: () => void;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

interface TournamentTrophy {
  id: string;
  name: string;
  subtitle: string;
  unlocked: boolean;
  icon: string;
}

export function TrophiesView({ player }: TrophiesViewProps) {
  const isPitcher = player.position === 'P';

  const tournamentTrophies: TournamentTrophy[] = [
    { id: 't_emart', name: '신세계 이마트배', subtitle: '전국 최대 규모 등록 고교 참가 대회', unlocked: false, icon: '🏆' },
    { id: 't_golden', name: '황금사자기', subtitle: '역사와 전통의 메이저 토너먼트', unlocked: false, icon: '🦁' },
    { id: 't_dragon', name: '청룡기', subtitle: '고교야구 최고의 권위를 지닌 하계 선수권', unlocked: false, icon: '🐉' },
    { id: 't_phoenix', name: '봉황대기', subtitle: '초록 봉황을 향한 전국 모든 고교 토너먼트', unlocked: false, icon: '🦅' },
    { id: 't_weekend', name: '주말리그 전반기 우승', subtitle: '광역 권역 조별리그 1위 제패', unlocked: false, icon: '🥇' },
  ];

  const achievements: Achievement[] = [
    {
      id: 'ach_entrance',
      title: '고교 야구부 입학',
      desc: '신입 부원 1:1 감독 면담을 완료하고 야구부에 정식 입단함',
      unlocked: !!player.interviewCompleted,
      icon: '🌸',
    },
    {
      id: 'ach_first_match',
      title: '첫 공식전 출전',
      desc: '주말리그 또는 전국대회 무대에 당당히 출격',
      unlocked: (player.fame || 0) > 10,
      icon: '⚾',
    },
    {
      id: 'ach_pro_interest',
      title: '스카우트 레이더망 포착',
      desc: '스카우트 인지도 30pt 이상 달성',
      unlocked: (player.fame || 0) >= 30,
      icon: '📋',
    },
    {
      id: 'ach_ace',
      title: isPitcher ? '탈삼진 머신' : '거포의 탄생',
      desc: isPitcher ? '구위 30 이상 달성' : '파워 30 이상 달성',
      unlocked: isPitcher ? player.stuff >= 30 : player.power >= 30,
      icon: isPitcher ? '🔥' : '💣',
    },
    {
      id: 'ach_academics',
      title: '문무겸비 우등생',
      desc: '학업 성취도 70 이상 달성',
      unlocked: (player.academics || 0) >= 70,
      icon: '📜',
    },
    {
      id: 'ach_draft_round1',
      title: '드래프트 1라운드 지명',
      desc: '3학년 KBO 신인 드래프트 전체 상위 지명 영예',
      unlocked: (player.fame || 0) >= 70,
      icon: '👑',
    },
  ];

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
            <Trophy size={16} color="#fbbf24" /> 전국대회 우승 트로피 진열장
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
                  {t.unlocked ? '우승 달성 🏆' : '도전 진행 중'}
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

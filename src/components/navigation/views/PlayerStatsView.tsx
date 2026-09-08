import type { Player } from '../../../types';
import { Activity, Sparkles } from 'lucide-react';

interface PlayerStatsViewProps {
  player: Player;
  onClose: () => void;
}

export function PlayerStatsView({ player }: PlayerStatsViewProps) {
  const isPitcher = player.position === 'P';
  const isTwoWay = player.position === 'TwoWay';

  const renderStatRow = (label: string, value: number, max = 100, color = 'var(--primary)') => (
    <div className="stat-detail-row">
      <span className="s-label">{label}</span>
      <div className="s-track">
        <div
          className="s-fill"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
        ></div>
      </div>
      <span className="s-value">{value}</span>
    </div>
  );

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <Activity size={22} className="text-primary" />
          <div>
            <h3 className="menu-view-title">선수 정밀 스탯 & 성장 리포트</h3>
            <p className="menu-view-sub">현재 기술 능력치와 잠재력, 보유 고유 특성을 확인합니다.</p>
          </div>
        </div>
      </div>

      <div className="menu-view-body">
        {/* 상단 3대 종합 지표 */}
        <div className="stats-overview-banner glass-panel">
          <div className="so-box">
            <span className="so-label">종합 능력치 (OVR)</span>
            <span className="so-num">{player.overall}</span>
            <span className="so-sub">잠재력: {player.potential}</span>
          </div>
          <div className="so-box">
            <span className="so-label">컨디션 & 멘탈</span>
            <span className="so-num" style={{ color: player.condition > 70 ? '#10b981' : '#f59e0b' }}>
              {player.condition}
            </span>
            <span className="so-sub">최대치: 100 pt</span>
          </div>
          <div className="so-box">
            <span className="so-label">스카우트 주목도</span>
            <span className="so-num" style={{ color: '#fbbf24' }}>
              {player.fame || 10}
            </span>
            <span className="so-sub">{(player.fame || 10) > 40 ? '상위 지명권' : '지목 유망주'}</span>
          </div>
        </div>

        {/* 투수 및 타자 세부 스탯 컬럼 */}
        <div className="stats-columns-grid">
          {/* 1. 포지션 기술 스탯 */}
          <div className="stats-col-card glass-panel">
            <h4 className="col-title">
              {isPitcher ? '⚾ 투수 세부 평가' : '⚔️ 타격 & 수비 세부 평가'}
            </h4>

            {isPitcher || isTwoWay ? (
              <div className="stat-rows-stack">
                <strong>투수 평가</strong>
                {renderStatRow('구위 (Stuff)', player.stuff, 100, '#ef4444')}
                {renderStatRow('제구력 (Control)', player.control, 100, '#3b82f6')}
                {renderStatRow('스태미너 (Stamina)', player.stamina, 100, '#10b981')}
                {isTwoWay && <><strong style={{ marginTop: 8 }}>타격·주루·수비 평가</strong>{renderStatRow('정교한 타격', player.contact, 100, '#3b82f6')}{renderStatRow('장타 생산력', player.power, 100, '#ef4444')}{renderStatRow('선구·존 판단', player.eye, 100, '#10b981')}{renderStatRow('주루·가속력', player.speed, 100, '#f59e0b')}{renderStatRow('포구·송구·범위', player.defense, 100, '#8b5cf6')}</>}
              </div>
            ) : (
              <div className="stat-rows-stack">
                {renderStatRow('컨택트 (Contact)', player.contact, 100, '#3b82f6')}
                {renderStatRow('파워 (Power)', player.power, 100, '#ef4444')}
                {renderStatRow('선구안 (Eye)', player.eye, 100, '#10b981')}
                {renderStatRow('주력 (Speed)', player.speed, 100, '#f59e0b')}
                {renderStatRow('수비력 (Defense)', player.defense, 100, '#8b5cf6')}
              </div>
            )}
          </div>

          {/* 2. 학교생활 & 멘탈 스탯 */}
          <div className="stats-col-card glass-panel">
            <h4 className="col-title">🎓 학생 선수 소양 및 멘탈</h4>
            <div className="stat-rows-stack">
              {renderStatRow('학업 성취도 (Academics)', player.academics || 50, 100, '#60a5fa')}
              {renderStatRow('멘탈 안정성', player.condition, 100, '#34d399')}
              {renderStatRow('감독 신뢰도', player.relationshipCoach || 50, 100, '#fbbf24')}
              {renderStatRow('팀 내 신뢰도', player.relationshipTeam || 50, 100, '#a78bfa')}
            </div>
          </div>
        </div>

        {/* 3. 보유 특성(Traits) 목록 */}
        <div className="traits-showcase-panel glass-panel" style={{ marginTop: '16px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> 획득한 고유 특성 (Traits)
          </h4>
          <div className="traits-pills-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {player.traits && player.traits.length > 0 ? (
              player.traits.map(t => (
                <div key={t} className="trait-pill-item glass-panel">
                  <span className="t-name">#{t}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                아직 획득한 특성이 없습니다. 훈련과 대회, 면담을 통해 특성을 획득할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

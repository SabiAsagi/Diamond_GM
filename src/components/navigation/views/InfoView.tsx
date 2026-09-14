import { useState } from 'react';
import type { Player } from '../../../types';
import { PlayerStatsView } from './PlayerStatsView';
import { RelationshipsView } from './RelationshipsView';

const sections = [['ratings', '능력치'], ['pitches', '스킬'], ['equipment', '아이템'], ['relationships', '특성·인연']] as const;
export function InfoView({ player, onClose }: { player: Player; onClose: () => void }) {
  const [section, setSection] = useState<typeof sections[number][0]>('ratings');
  return <div className="people-unified-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="menu-view-tabs glass-panel" role="tablist" aria-label="선수 정보">
      {sections.map(([id, label]) => <button key={id} role="tab" aria-selected={section === id} className={`tab-btn ${section === id ? 'active' : ''}`} onClick={() => setSection(id)}>{label}</button>)}
    </div>
    {section === 'relationships' ? <><div className="home-traits-strip glass-panel">보유 특성: {player.traits?.join(' · ') || '아직 없음'}</div><RelationshipsView player={player} onClose={onClose} /></> : <PlayerStatsView player={player} onClose={onClose} section={section} />}
  </div>;
}

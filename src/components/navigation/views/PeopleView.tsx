import { useState } from 'react';
import type { Player } from '../../../types';
import { RelationshipsView } from './RelationshipsView';
import { PlayerStatsView } from './PlayerStatsView';
import { Users, Activity } from 'lucide-react';

interface PeopleViewProps {
  player: Player;
  onClose: () => void;
  defaultSubTab?: 'relationships' | 'stats';
}

export function PeopleView({ player, onClose, defaultSubTab = 'relationships' }: PeopleViewProps) {
  const [subTab, setSubTab] = useState<'relationships' | 'stats'>(defaultSubTab);

  return (
    <div className="people-unified-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        className="menu-view-tabs glass-panel"
        style={{ padding: '6px 12px', display: 'flex', gap: '8px', alignSelf: 'flex-start', borderRadius: '10px' }}
      >
        <button
          className={`tab-btn ${subTab === 'relationships' ? 'active' : ''}`}
          onClick={() => setSubTab('relationships')}
        >
          <Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 인연 & 인간관계
        </button>
        <button
          className={`tab-btn ${subTab === 'stats' ? 'active' : ''}`}
          onClick={() => setSubTab('stats')}
        >
          <Activity size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 내 선수 & 장비
        </button>
      </div>

      {subTab === 'relationships' ? (
        <RelationshipsView player={player} onClose={onClose} />
      ) : (
        <PlayerStatsView player={player} onClose={onClose} />
      )}
    </div>
  );
}

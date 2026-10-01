import { useState } from 'react';
import type { Player } from '../../../types';
import { TrophiesView } from './TrophiesView';
import { MonthlyGoalsPanel } from '../../daily/MonthlyGoalsPanel';
import { useGameClockStore } from '../../../store/gameClockStore';
export function GoalsView({ player, onClose }: { player: Player; onClose: () => void }) {
  const [tab, setTab] = useState<'monthly' | 'trophies'>('monthly');
  const date = useGameClockStore(s => s.clock.date);
  return <div className="menu-view-container glass-panel"><div className="menu-view-tabs"><button className={`tab-btn ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>월간 목표</button><button className={`tab-btn ${tab === 'trophies' ? 'active' : ''}`} onClick={() => setTab('trophies')}>트로피 · 업적</button></div><div className="menu-view-body">{tab === 'monthly' ? <MonthlyGoalsPanel player={player} date={date} /> : <TrophiesView player={player} onClose={onClose} />}</div></div>;
}

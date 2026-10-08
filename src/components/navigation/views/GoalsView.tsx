import { getUnreadNews } from '../../../data/news';
import { NewsNotice } from '../NewsNotice';
import { useState } from 'react';
import type { Player } from '../../../types';
import { TrophiesView } from './TrophiesView';
import { MonthlyGoalsPanel } from '../../daily/MonthlyGoalsPanel';
import { useGameClockStore } from '../../../store/gameClockStore';
export function GoalsView({ player, onClose }: { player: Player; onClose: () => void }) {
  const [tab, setTab] = useState<'monthly' | 'trophies'>('monthly');
  const date = useGameClockStore(s => s.clock.date);
  const news = getUnreadNews(player, date).filter(n => n.tab === 'goals');
  return <div className="menu-view-container glass-panel"><div className="menu-view-tabs"><button className={`tab-btn ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>월간 목표{news.some(n => n.section === 'monthly') && <span className="news-dot" aria-label="새 소식" />}</button><button className={`tab-btn ${tab === 'trophies' ? 'active' : ''}`} onClick={() => setTab('trophies')}>트로피 · 업적{news.some(n => n.section === 'trophies') && <span className="news-dot" aria-label="새 소식" />}</button></div><div className="menu-view-body"><NewsNotice news={news.filter(n => n.section === tab)} />{tab === 'monthly' ? <MonthlyGoalsPanel player={player} date={date} /> : <TrophiesView player={player} onClose={onClose} />}</div></div>;
}

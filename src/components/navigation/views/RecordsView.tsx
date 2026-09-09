import { useState } from 'react';
import type { Player } from '../../../types';
import type { ScheduledMatch } from '../../../types/tournament';
import type { DayLogRecord } from '../../../store/gameClockStore';
import { MatchesView } from './MatchesView';
import { TrophiesView } from './TrophiesView';
import { Trophy, Award } from 'lucide-react';

interface RecordsViewProps {
  player: Player;
  matches: ScheduledMatch[];
  historyLogs: DayLogRecord[];
  onClose: () => void;
  defaultSubTab?: 'matches' | 'trophies';
}

export function RecordsView({
  player,
  matches,
  historyLogs,
  onClose,
  defaultSubTab = 'matches',
}: RecordsViewProps) {
  const [subTab, setSubTab] = useState<'matches' | 'trophies'>(defaultSubTab);

  return (
    <div className="records-unified-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        className="menu-view-tabs glass-panel"
        style={{ padding: '6px 12px', display: 'flex', gap: '8px', alignSelf: 'flex-start', borderRadius: '10px' }}
      >
        <button
          className={`tab-btn ${subTab === 'matches' ? 'active' : ''}`}
          onClick={() => setSubTab('matches')}
        >
          <Trophy size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 경기 일정 & 결과
        </button>
        <button
          className={`tab-btn ${subTab === 'trophies' ? 'active' : ''}`}
          onClick={() => setSubTab('trophies')}
        >
          <Award size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 트로피 & 업적
        </button>
      </div>

      {subTab === 'matches' ? (
        <MatchesView player={player} matches={matches} historyLogs={historyLogs} onClose={onClose} />
      ) : (
        <TrophiesView player={player} onClose={onClose} />
      )}
    </div>
  );
}

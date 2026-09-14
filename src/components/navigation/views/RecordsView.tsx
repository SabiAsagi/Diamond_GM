import { useState } from 'react';
import type { Player } from '../../../types';
import type { ScheduledMatch } from '../../../types/tournament';
import type { DayLogRecord } from '../../../store/gameClockStore';
import { MatchesView } from './MatchesView';
import { TournamentBracket } from './TournamentBracket';
import { Trophy, Award } from 'lucide-react';

interface RecordsViewProps {
  player: Player;
  matches: ScheduledMatch[];
  historyLogs: DayLogRecord[];
  onClose: () => void;
  defaultSubTab?: 'matches' | 'tournaments';
}

export function RecordsView({
  player,
  matches,
  historyLogs,
  onClose,
  defaultSubTab = 'matches',
}: RecordsViewProps) {
  const [subTab, setSubTab] = useState<'matches' | 'tournaments'>(defaultSubTab);

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
          <Trophy size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 경기
        </button>
        <button
          className={`tab-btn ${subTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setSubTab('tournaments')}
        >
          <Award size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 대회·리그
        </button>
      </div>

      {subTab === 'matches' ? (
        <MatchesView showBracket={false} player={player} matches={matches} historyLogs={historyLogs} onClose={onClose} />
      ) : (
        <div className="menu-view-container glass-panel"><div className="menu-view-body"><TournamentBracket matches={matches} />
          <section aria-label="주말리그"><h4>주말리그 일정·결과</h4>
            {matches.filter(m => m.tournamentId === 'weekend_league' && m.isPlayerTeamMatch).map(m => <div className="bracket-game" key={m.id}>
              <small>{m.date.month}/{m.date.day} · {m.round}</small>
              <p>{m.homeSchoolName} vs {m.awaySchoolName}</p>
              <strong>{m.result ? `${m.result === 'home' ? m.homeSchoolName : m.awaySchoolName} 승리` : '경기 예정'}</strong>
            </div>)}
          </section></div></div>
      )}
    </div>
  );
}


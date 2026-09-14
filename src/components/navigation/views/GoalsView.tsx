import type { Player } from '../../../types';
import { TrophiesView } from './TrophiesView';
export function GoalsView({ player, onClose }: { player: Player; onClose: () => void }) {
  return <TrophiesView player={player} onClose={onClose} />;
}

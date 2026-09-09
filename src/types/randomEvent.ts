import type { GameDate } from './calendar';
import type { Player } from './index';

export interface EventCutscene {
  categories?: import('./dailySchedule').DailyActivityCategory[];
  id: string;
  title: string;
  subtitle: string;
  dialogue: string;
  speakerName: string;
  speakerRole: string;
  icon: string;
  baseChance: number; // 0 ~ 1 (기본 발생 확률)
  cooldownDays: number; // 재발생 쿨다운 일수 (기본 7일)
  conditions?: (player: Player, date: GameDate) => boolean;
  effect: (player: Player) => {
    statChanges: Partial<Player>;
    logMessage: string;
  };
}

export interface CutsceneTriggerHistory {
  [eventId: string]: {
    year: number;
    month: number;
    day: number;
  };
}

/**
 * 쿨다운(예: 7일)과 조건 및 확률 롤을 판정하여 이벤트 컷신 발생 여부를 검사합니다.
 */
export function shouldTriggerCutscene(
  event: EventCutscene,
  player: Player,
  date: GameDate,
  history: CutsceneTriggerHistory
): boolean {
  // 1. 조건 검사
  if (event.conditions && !event.conditions(player, date)) {
    return false;
  }

  // 2. 쿨다운 검사
  const lastTriggered = history[event.id];
  if (lastTriggered) {
    const lastDate = new Date(lastTriggered.year, lastTriggered.month - 1, lastTriggered.day);
    const currDate = new Date(date.year, date.month - 1, date.day);
    const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < event.cooldownDays) {
      return false;
    }
  }

  // 3. 확률 롤 (조건에 따른 보정 가능)
  let effectiveChance = event.baseChance;
  // 감독 신뢰도가 높으면 코칭/멘토 이벤트 확률 증가
  if (player.relationshipCoach && player.relationshipCoach > 70) {
    effectiveChance += 0.05;
  }

  return Math.random() < effectiveChance;
}

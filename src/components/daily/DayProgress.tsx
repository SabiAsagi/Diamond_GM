import { Check, Moon, Sun, Sunrise } from 'lucide-react';
import type { TimeSlot } from '../../types/calendar';
import { TIME_SLOT_LABELS } from '../../types/calendar';

const slots = [
  { id: 'morning', Icon: Sunrise },
  { id: 'afternoon', Icon: Sun },
  { id: 'night', Icon: Moon },
] as const;

export function DayProgress({ currentSlot, ended }: { currentSlot: TimeSlot; ended: boolean }) {
  const current = slots.findIndex(slot => slot.id === currentSlot);
  return <section className="day-progress" aria-label="오늘의 진행">
    <div className="day-progress-heading"><span>오늘의 루틴</span><strong>{ended ? '커리어 완료' : `${current + 1} / 3`}</strong></div>
    <ol>{slots.map(({ id, Icon }, index) => {
      const done = ended || index < current;
      const active = !ended && index === current;
      return <li key={id} className={done ? 'done' : active ? 'current' : ''} aria-current={active ? 'step' : undefined}>
        <span className="day-step-icon">{done ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}</span>
        <span>{TIME_SLOT_LABELS[id]}<small>{done ? '완료' : active ? '진행 중' : '예정'}</small></span>
      </li>;
    })}</ol>
  </section>;
}

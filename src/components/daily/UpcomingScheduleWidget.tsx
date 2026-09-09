import { useMemo } from 'react';
import type { GameDate } from '../../types/calendar';
import type { ScheduledMatch } from '../../types/tournament';
import type { AcademicEvent } from '../../types/academicCalendar';
import { CalendarDays, Clock } from 'lucide-react';

interface UpcomingScheduleWidgetProps {
  currentDate: GameDate;
  matches: ScheduledMatch[];
  academicEvents: AcademicEvent[];
}

interface UpcomingItem {
  id: string;
  title: string;
  subtitle: string;
  diffDays: number;
  dDayStr: string;
  category: 'match' | 'academic';
  icon: string;
}

export function UpcomingScheduleWidget({
  currentDate,
  matches,
  academicEvents,
}: UpcomingScheduleWidgetProps) {
  const upcomingItems = useMemo(() => {
    const items: UpcomingItem[] = [];
    const curr = new Date(currentDate.year, currentDate.month - 1, currentDate.day);

    // 1. 경기 일정 필터링
    for (const m of matches) {
      if(!m.isPlayerTeamMatch || m.result) continue;
      // 같은 해의 일자 기준 (월/일)
      let matchYear = currentDate.year;
      // 1~2월인 경우 다음 연도일 수도 있음
      if (m.date.month < currentDate.month && currentDate.month >= 11) {
        matchYear = currentDate.year + 1;
      }
      const matchDate = new Date(matchYear, m.date.month - 1, m.date.day);
      const diffTime = matchDate.getTime() - curr.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 30) {
        const isMajor = m.tournamentId !== 'weekend_league';
        items.push({
          id: m.id,
          title: `${m.tournamentName} ${m.round}`,
          subtitle: m.drawn===false?'조 추첨 예정':`${m.homeSchoolName} vs ${m.awaySchoolName}`,
          diffDays,
          dDayStr: diffDays === 0 ? 'D-Day' : `D-${diffDays}`,
          category: 'match',
          icon: isMajor ? '🏆' : '⚾',
        });
      }
    }

    // 2. 학사 일정 필터링
    for (const ev of academicEvents) {
      if (ev.gradeCondition !== undefined && ev.gradeCondition !== currentDate.grade) {
        continue;
      }

      let evYear = currentDate.year;
      if (ev.month < currentDate.month && currentDate.month >= 11) {
        evYear = currentDate.year + 1;
      }
      const evDate = new Date(evYear, ev.month - 1, ev.day);
      const diffTime = evDate.getTime() - curr.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 30) {
        let icon = '📌';
        if (ev.type.includes('exam')) icon = '📝';
        else if (ev.type === 'entrance_ceremony') icon = '🌸';
        else if (ev.type === 'sports_day') icon = '🏃';
        else if (ev.type === 'field_trip') icon = '🚌';
        else if (ev.type === 'graduation_ceremony') icon = '🎓';

        items.push({
          id: `${ev.id}_${ev.month}_${ev.day}`,
          title: ev.label,
          subtitle: `${ev.month}월 ${ev.day}일 예정 (${ev.durationDays > 1 ? `${ev.durationDays}일간` : '당일'})`,
          diffDays,
          dDayStr: diffDays === 0 ? 'D-Day' : `D-${diffDays}`,
          category: 'academic',
          icon,
        });
      }
    }

    // 일수 오름차순 정렬 후 상위 4개 선택
    items.sort((a, b) => a.diffDays - b.diffDays);
    return items.slice(0, 4);
  }, [currentDate, matches, academicEvents]);

  return (
    <div className="upcoming-schedule-card glass-panel animate-fade-in">
      <div className="schedule-header">
        <div className="schedule-title-group">
          <CalendarDays size={18} className="text-primary" />
          <strong className="schedule-title">향후 30일 주요 일정</strong>
        </div>
        <span className="schedule-count-tag">{upcomingItems.length}개 예정</span>
      </div>

      <div className="schedule-items-list">
        {upcomingItems.length === 0 ? (
          <div className="schedule-empty-box">
            <Clock size={20} className="text-muted" />
            <p>향후 30일간 예정된 공식 일정이 없습니다. (자율 훈련 집중 기간)</p>
          </div>
        ) : (
          upcomingItems.map(item => (
            <div
              key={item.id}
              className={`schedule-item-row ${item.diffDays === 0 ? 'is-today' : ''}`}
            >
              <div className="schedule-left">
                <span className="schedule-icon">{item.icon}</span>
                <div className="schedule-info">
                  <span className="item-title">{item.title}</span>
                  <span className="item-sub">{item.subtitle}</span>
                </div>
              </div>

              <div className="schedule-right">
                <span
                  className={`d-day-chip ${item.diffDays === 0 ? 'd-day-now' : item.diffDays <= 3 ? 'd-day-urgent' : ''}`}
                >
                  {item.dDayStr}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

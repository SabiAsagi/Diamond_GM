import { PlayerPortrait } from '../PlayerAppearance';
import type { GameDate, TimeSlot } from '../../types/calendar';
import { calculateDaysUntilDraft, WEEKDAY_NAMES, TIME_SLOT_LABELS } from '../../types/calendar';
import type { Player } from '../../types';
import type { HighSchoolData } from '../../types/highSchool';
import { SchoolEmblem } from '../SchoolEmblem';
import { Calendar, Trophy, Wallet } from 'lucide-react';

interface DailyTopBarProps {
  player: Player;
  school: HighSchoolData | null;
  date: GameDate;
  currentSlot: TimeSlot;
}

export function DailyTopBar({ player, school, date, currentSlot }: DailyTopBarProps) {
  const daysUntilDraft = calculateDaysUntilDraft(date);
  const weekdayStr = WEEKDAY_NAMES[date.weekday];
  const slotLabel = TIME_SLOT_LABELS[currentSlot];

  const getSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'night':
        return '🌙';
    }
  };

  const getSlotClass = (slot: TimeSlot) => {
    switch (slot) {
      case 'morning':
        return 'slot-morning';
      case 'afternoon':
        return 'slot-afternoon';
      case 'night':
        return 'slot-night';
    }
  };

  return (
    <div className="daily-top-bar glass-panel animate-fade-in">
      {/* 1. 학교 및 선수 기본 프로필 정보 */}
      <div className="daily-profile-cluster"><div className="profile-portrait"><PlayerPortrait appearance={player.appearance} number={player.uniformNumber}/></div>
        {school && <SchoolEmblem school={school} size="sm" />}
        <div className="daily-player-meta">
          <div className="daily-player-row">
            <span className="player-name-bold">{player.name}</span>
            <span className="player-num-chip">#{player.uniformNumber}</span>
            <span className="player-pos-chip">{player.position}</span>
            <span className="player-school-chip">{school?.name || player.highSchool}</span>
          </div>
          <div className="daily-player-sub">
            {player.handedness} · OVR <strong>{player.overall}</strong> (잠재력 {player.potential}) · {player.chosenPathTitle || '특화 육성'}
          </div>
        </div>
      </div>

      {/* 2. 날짜 & 슬롯 & 드래프트 현황 바 (명세서 규격) */}
      <div className="daily-status-line">
        <div className="daily-date-pill">
          <Calendar size={15} className="text-primary" />
          <span>
            {date.grade}학년 {date.month}월 {date.day}일 ({weekdayStr})
          </span>
        </div>

        <div className={`daily-slot-pill ${getSlotClass(currentSlot)}`}>
          <span className="slot-emoji">{getSlotIcon(currentSlot)}</span>
          <span className="slot-text">{slotLabel}</span>
        </div>

        <div className="daily-draft-dday-pill">
          <Trophy size={14} className="text-accent" />
          <span>KBO 드래프트 D-{daysUntilDraft}</span>
        </div>
        <div className="daily-draft-dday-pill"><Wallet size={14}/><span>{(player.money || 0).toLocaleString()}원</span></div>
      </div>
    </div>
  );
}

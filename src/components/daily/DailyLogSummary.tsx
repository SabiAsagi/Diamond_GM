import { useState } from 'react';
import type { GameDate } from '../../types/calendar';
import type { DayLogRecord } from '../../store/gameClockStore';
import { BookOpen, History, ChevronDown, ChevronUp } from 'lucide-react';

interface DailyLogSummaryProps {
  currentDate: GameDate;
  todayLogs: string[];
  historyLogs: DayLogRecord[];
}

export function DailyLogSummary({
  currentDate,
  todayLogs,
  historyLogs,
}: DailyLogSummaryProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="daily-logs-card glass-panel animate-fade-in">
      <div className="logs-header-row">
        <div className="logs-title-group">
          <BookOpen size={17} className="text-primary" />
          <strong className="logs-main-title">오늘의 일일 활동 일지</strong>
          <span className="logs-date-tag">
            {currentDate.grade}학년 {currentDate.month}월 {currentDate.day}일
          </span>
        </div>

        {historyLogs.length > 0 && (
          <button
            className="btn btn-sm btn-secondary history-toggle-btn"
            onClick={() => setShowHistory(prev => !prev)}
          >
            <History size={14} />
            <span>이전 일지 ({historyLogs.length}일)</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* 오늘 발생한 로그 목록 */}
      <div className="today-logs-stream">
        {todayLogs.length === 0 ? (
          <div className="logs-empty">아직 오늘 진행된 활동이 없습니다.</div>
        ) : (
          todayLogs.map((log, idx) => (
            <div key={idx} className="today-log-row animate-fade-in">
              <span className="log-bullet-dot"></span>
              <span className="log-text-content">{log}</span>
            </div>
          ))
        )}
      </div>

      {/* 이전 일지 히스토리 아코디언 */}
      {showHistory && historyLogs.length > 0 && (
        <div className="history-logs-container animate-fade-in">
          <div className="history-section-title">최근 지난 활동 기록</div>
          <div className="history-scroll-box">
            {historyLogs.map((item, idx) => (
              <div key={idx} className="history-day-card">
                <div className="history-day-header">
                  📅 {item.date.grade}학년 {item.date.month}월 {item.date.day}일
                </div>
                <div className="history-day-body">
                  {item.morningLog && <p className="h-slot-line">• {item.morningLog}</p>}
                  {item.afternoonLog && <p className="h-slot-line">• {item.afternoonLog}</p>}
                  {item.nightLog && <p className="h-slot-line">• {item.nightLog}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

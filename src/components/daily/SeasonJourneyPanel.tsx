import type { GameDate } from '../../types/calendar';
import { getSeasonJourney, SEASON_CHAPTERS } from '../../data/seasonJourney';
import './SeasonJourneyPanel.css';
export function SeasonJourneyPanel({ date }: { date: GameDate }) {
  const journey = getSeasonJourney(date);
  return <section className="season-journey glass-panel" aria-label="학년 진행 일지">
    <h3>{date.grade}학년의 한 해</h3><strong>{journey.chapter.title}</strong><p>{journey.chapter.description}</p>
    <progress aria-label="학년 시간 경과" value={journey.elapsedDays} max={journey.totalDays} />
    <small>{journey.elapsedDays}일 경과 · 학년 마무리까지 {journey.remainingDays}일</small>
    <details><summary>한 해의 흐름 보기</summary><ol>{SEASON_CHAPTERS.map((chapter, index) => <li key={chapter.id} aria-current={index === journey.chapterIndex ? 'step' : undefined}><strong>{chapter.title}</strong><span>{index < journey.chapterIndex ? '지나온 시기' : index === journey.chapterIndex ? '지금' : '다가올 시기'}</span></li>)}</ol><p>시간 경과이며 대회 우승·개인 출전을 뜻하지 않습니다. 진급 후 기록 → 학년 일지에서 성적과 성장을 돌아볼 수 있습니다.</p></details>
  </section>;
}

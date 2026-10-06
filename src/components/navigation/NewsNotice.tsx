import { useState } from 'react';
import type { PlayerNews } from '../../data/news';
import { useGameClockStore } from '../../store/gameClockStore';

/** 알림 내용을 먼저 보여주고 명시적으로 확인한 소식만 읽음 처리한다. */
export function NewsNotice({ news }: { news: PlayerNews[] }) {
  const readNews = useGameClockStore(s => s.readNews);
  const isLoading = useGameClockStore(s => s.isLoading);
  const [error, setError] = useState('');
  if (!news.length) return null;
  const visible = news.slice(-5);
  return <aside className="news-notice" aria-label="새 소식">
    <div className="news-notice-heading"><strong><span className="news-dot" aria-hidden="true" />새 소식 · {news.length}개</strong>
      <button className="btn btn-secondary" disabled={isLoading} onClick={async () => {
        try { setError(''); await readNews(visible.map(n => n.id)); }
        catch { setError('읽음 상태를 저장하지 못했습니다. 다시 확인해주세요.'); }
      }}>표시된 소식 확인</button></div>
    <ul>{visible.map(n => <li key={n.id}>{n.title}</li>)}</ul>
    {news.length > visible.length && <small>위 소식을 확인하면 남은 소식을 보여드립니다.</small>}
    {error && <p role="alert">{error}</p>}
  </aside>;
}

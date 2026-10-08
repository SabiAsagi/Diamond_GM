import { useState } from 'react';
import type { Player } from '../../types';
import { migrateCareerJourney, scoutingScore, officialAppearances, schoolTrainingCulture, ROUTE_LABELS, GRADE_STORY_SCENES, GROWTH_LABELS, type CareerRoute } from '../../data/careerJourney';
import { useGameClockStore } from '../../store/gameClockStore';
import { personalizeText } from '../../data/cast';
import '../../styles/career-journey.css';

export function CareerJourneyPanel({ player }: { player: Player }) {
  const journey = migrateCareerJourney(player);
  const culture = schoolTrainingCulture(player);
  const { chooseCareerRoute, isLoading, isCareerEnded } = useGameClockStore();
  const [notice, setNotice] = useState('');
  const choose = async (route: CareerRoute) => {
    try { await chooseCareerRoute(route); setNotice(`${ROUTE_LABELS[route]}을 졸업 후 진로로 선택했습니다.`); }
    catch { setNotice('진로 선택을 저장하지 못했습니다. 다시 시도해 주세요.'); }
  };
  const stories = GRADE_STORY_SCENES.filter(e => journey.completedScenes.includes(e.id));
  return <section className="career-journey-panel glass-panel" aria-labelledby="journey-title">
    <header><small>{player.highSchool} · {player.grade ?? 1}학년</small><h2 id="journey-title">나의 야구 인생</h2><p>훈련의 변화, 함께한 사람들, 그리고 다음 무대.</p></header>
    <div className="career-summary-grid">
      <article><h3>학교 훈련 분위기</h3><strong>{culture.label}</strong><p>{culture.text}</p><small>게임 안에서 학교별로 정해진 훈련 성향입니다.</small></article>
      <article><h3>최근 훈련에서 달라진 점</h3><p>{journey.lastGrowth ?? '훈련을 마치면 실제 성장한 능력이 여기에 기록됩니다.'}</p><small>{Object.entries(journey.trainingGrowth).filter(([,v]) => v > 0).map(([key,v]) => `${GROWTH_LABELS[key] ?? key} +${v.toFixed(1)}`).join(' · ') || '아직 누적 훈련 기록이 없습니다.'}</small></article>
      <article><h3>스카우트의 관심</h3><strong>{scoutingScore(player)} / 100</strong><progress value={scoutingScore(player)} max={100} aria-label="스카우트 관심" /><p>공식 출전 {officialAppearances(player)}경기 · 인지도 {Math.round(player.fame ?? 0)}</p><small>능력·실전 출전·인지도를 함께 봅니다. 점수만으로 프로 지명이 확정되지는 않습니다.</small></article>
    </div>
    <article className="career-story-list"><h3>기억에 남은 순간</h3>{stories.length ? <ul>{stories.map(e => <li key={e.id}>{personalizeText(e.title,player)}</li>)}</ul> : <p>학교생활의 첫 만남과 학년별 이야기가 여기서 이어집니다.</p>}<p>현재 인연 {journey.met.length}명 · 새 인물은 첫 만남 컷씬을 마친 뒤 인연 목록에 추가됩니다.</p></article>
    <article><h3>졸업 후의 다음 무대</h3>
      {journey.ending ? <><strong>{journey.ending.title}</strong><p>{journey.ending.text}</p><p>졸업 종합 능력 {journey.ending.overall} · 공식 출전 {journey.ending.appearances}경기</p></>
      : <><p>3학년 가을부터 진로 제안을 선택할 수 있습니다. 졸업 전에는 선택을 변경할 수 있습니다.</p>
        <ul><li>대학 야구부: 학업 45 · 종합 능력 30 · 공식 출전 4경기</li><li>프로 지명: 종합 능력 60 · 인지도 35 · 공식 출전 10경기</li><li>해외 육성팀: 종합 능력 72 · 인지도 55 · 공식 출전 12경기</li><li>지역 클럽: 성적과 관계없이 야구를 계속할 수 있는 길</li></ul>
        <div className="career-choice-grid">{journey.offers.map(route => <button key={route} className={`career-choice ${journey.chosenRoute === route ? 'selected' : ''}`} aria-pressed={journey.chosenRoute === route} disabled={isLoading || isCareerEnded} onClick={() => void choose(route)}><strong>{ROUTE_LABELS[route]}</strong><span>{journey.chosenRoute === route ? '선택한 진로' : '제안 확인 · 선택하기'}</span></button>)}</div>
        {journey.offers.length > 0 && !journey.chosenRoute && <small>졸업까지 제안을 선택하지 않으면 지역 클럽에서 야구를 이어갑니다.</small>}
      </>}
      {notice && <p role="status">{notice}</p>}
    </article>
  </section>;
}

import { useState, useRef, useEffect } from 'react';
import type { EventCutscene } from '../../types/randomEvent';
import type { Player } from '../../types';
import { PlayerPortrait } from '../PlayerAppearance';
import { formatBondChanges, actualBondChanges, applyBondChanges } from '../../types/bondScores';

function rewardText(event: EventCutscene, player: Player, choiceId: string) {
  const effect = (event.choices?.find(c => c.id === choiceId)?.effect ?? event.effect)(player);
  const labels: Record<string,string> = {academics:'학업',condition:'컨디션',eye:'선구안',control:'제구',contact:'컨택',power:'파워',stuff:'구위',stamina:'스태미너',defense:'수비',fame:'인지도',movement:'무브먼트',avoidK:'삼진 회피'};
  return [...Object.entries(effect.statChanges).flatMap(([key,value])=>{
    if(typeof value !== 'number') return [];
    const delta = Math.max(0,Math.min(100,value)) - Number(player[key as keyof Player] ?? 0);
    return delta ? [`${labels[key] ?? key} ${delta>0?'+':''}${delta}`] : [];
  }), formatBondChanges(actualBondChanges(player,applyBondChanges(player,effect.relationshipTargets)))].filter(Boolean).join(' · ') || '현재 능력치 유지';
}

export function EventCutsceneModal({cutscene,player,onChoose}:{cutscene:EventCutscene;player:Player;onChoose:(choice:string)=>Promise<void>}) {
  const [step,setStep] = useState(-1);
  const [chosen,setChosen] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const element=dialog.current;element?.showModal();return ()=>element?.close();},[]);
  const lines=cutscene.dialogueLines ?? [{speaker:'npc' as const,text:cutscene.dialogue}];
  const line=lines[Math.max(0,Math.min(step,lines.length-1))];
  const choice=cutscene.choices?.find(c=>c.id===chosen);
  const isPlayer=step>=0 && !chosen && line.speaker==='player';
  const atEnd=step===lines.length-1;
  async function finish() {
    if(busy)return;
    setBusy(true);setError('');
    try {await onChoose(chosen ?? 'learn');} catch {setError('저장하지 못했습니다. 다시 눌러 주세요.');setBusy(false);}
  }
  return <dialog ref={dialog} className="story-dialog" aria-labelledby="story-title" onCancel={e=>e.preventDefault()}>
    <header className="story-heading"><small>{step<0?'새로운 이야기':cutscene.subtitle}</small><h2 id="story-title">{cutscene.title}</h2></header>
    <div className="story-cast" aria-hidden="true">
      <div className={isPlayer?'cast-person speaking':'cast-person'}><PlayerPortrait appearance={player.appearance} gender={player.gender} schoolName={player.highSchool} number={player.uniformNumber} size="100%"/></div>
      <div className={!isPlayer?'cast-person speaking':'cast-person'}><img src={cutscene.portrait} alt=""/></div>
    </div>
    <section className="story-dialogue">
      <strong className="story-speaker">{step<0?'잠깐, 누군가 다가옵니다':isPlayer?player.name:cutscene.speakerName}</strong>
      <p key={`${step}-${chosen}`} className="story-line" aria-live="polite">{step<0?cutscene.subtitle:choice?choice.response:line.text}</p>
      {step<0?<button autoFocus className="btn btn-primary" onClick={()=>setStep(0)}>이야기 시작하기</button>:
       chosen || (atEnd && !cutscene.choices?.length)?<button className="btn btn-primary" disabled={busy} onClick={()=>void finish()}>{busy?'저장 중…':'이야기 마무리'}</button>:
       atEnd?<div className="story-choices">{cutscene.choices?.map(c=><button className="btn btn-secondary" key={c.id} onClick={()=>setChosen(c.id)}><span>{c.label}</span><small>{rewardText(cutscene,player,c.id)}</small></button>)}</div>:
       <button className="btn btn-primary" onClick={()=>setStep(step+1)}>다음 대화 <span aria-hidden="true">▸</span></button>}
      {error && <p role="alert">{error}</p>}
      <small className="story-page">{step>=0?`${Math.min(step+1,lines.length)} / ${lines.length}`:'활동 결과를 확인한 뒤 이야기가 이어집니다.'}</small>
    </section>
  </dialog>;
}

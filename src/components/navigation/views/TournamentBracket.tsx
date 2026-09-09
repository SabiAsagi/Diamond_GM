import { useState } from 'react';
import type { ScheduledMatch } from '../../../types/tournament';
import { useGameClockStore } from '../../../store/gameClockStore';
export function TournamentBracket({matches}:{matches:ScheduledMatch[]}){
 const tours=[...new Map(matches.filter(m=>m.tournamentId!=='weekend_league').map(m=>[m.tournamentId,m.tournamentName])).entries()];
 const [selected,setSelected]=useState(tours[0]?.[0]??'');const [busy,setBusy]=useState(false);const [revealed,setRevealed]=useState(0);
 const reveal=useGameClockStore(s=>s.revealTournament);const player=useGameClockStore(s=>s.player);
 const games=matches.filter(m=>m.tournamentId===selected);const rounds=[...new Set(games.map(m=>m.round))];const first=games.filter(m=>m.round===rounds[0]);
 const groups=[...new Set(first.map(m=>m.group??'예선'))];const drawn=first.every(m=>m.drawn);const visible=drawn?groups.length:revealed;
 return <section><label>대회 선택 <select value={selected} onChange={e=>{setSelected(e.target.value);setRevealed(0);}}>{tours.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><p>게임 대회 규칙: 4팀씩 조별 토너먼트 예선 → 조 우승팀 본선 16강 → 8강 → 4강 → 결승</p><p>다음 라운드는 이전 라운드 승리 학교가 결정된 후 편성됩니다.</p>
 {!drawn&&<button className="btn btn-primary" disabled={busy} onClick={async()=>{if(visible+1<groups.length){setRevealed(visible+1);return;}setBusy(true);try{await reveal(selected);}finally{setBusy(false);}}}>{visible===0?'조 추첨 시작':`${visible+1}번째 조 공개`}</button>}
 {!drawn&&visible>0&&<button className="btn btn-secondary" disabled={busy} onClick={async()=>{setBusy(true);try{await reveal(selected);}finally{setBusy(false);}}}>전체 추첨 결과 보기</button>}
 <div className="draw-groups">{groups.slice(0,visible).map(group=><div className="draw-card animate-fade-in" key={group}><strong>{group}</strong>{first.filter(m=>(m.group??'예선')===group).flatMap(m=>[m.homeSchoolName,m.awaySchoolName]).map(name=><p key={name} style={{color:name===player?.highSchool?'#6ee7b7':undefined}}>{name===player?.highSchool?'★ ':''}{name}</p>)}</div>)}</div>
 {drawn&&<div className="bracket-rounds">{rounds.map(round=><div className="bracket-round" key={round}><h4>{round}</h4>{games.filter(m=>m.round===round).map(m=><div key={m.id} className="bracket-game"><small>{m.date.month}/{m.date.day} · {m.group??'본선'}</small><p className={m.result==='home'?'winner':''}>{m.homeSchoolName}{m.result==='home'?' ✓':''}</p><p className={m.result==='away'?'winner':''}>{m.awaySchoolName}{m.result==='away'?' ✓':''}</p></div>)}</div>)}{!games.some(m=>m.round==='결승전'&&m.result)&&<div className="bracket-round"><h4>다음 라운드</h4><p>이전 라운드 승자 확정 대기</p></div>}</div>}
 </section>;
}

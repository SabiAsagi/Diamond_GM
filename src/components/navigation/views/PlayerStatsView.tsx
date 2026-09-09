import { useState } from 'react';
import type { Player } from '../../../types';
import { EXTRA_RATINGS, normalizePlayer, PITCH_NAMES, DEFAULT_APPEARANCE, type Appearance } from '../../../data/playerDevelopment';
import { AppearanceEditor } from '../../PlayerAppearance';
import { useGameClockStore } from '../../../store/gameClockStore';
const BAT = [['contact','컨택','안타로 연결하는 타격 정확도'],['gapPower',...EXTRA_RATINGS.gapPower],['power','홈런파워','담장을 넘기는 타구를 생산하는 힘'],['eye','선구안','볼을 골라 출루하는 능력'],['avoidK',...EXTRA_RATINGS.avoidK]];
const PITCH = [['stuff','구위','헛스윙과 탈삼진을 유도하는 능력'],['movement',...EXTRA_RATINGS.movement],['control','제구','원하는 코스로 던져 볼넷을 줄이는 능력'],['stamina','지구력','많은 투구 수에도 구질을 유지하는 능력'],['holdRunners',...EXTRA_RATINGS.holdRunners]];
const FIELD = [['speed','주력','달리는 순수 속도'],...(['stealing','baserunning','fieldingRange','fieldingError','arm'] as const).map(key=>[key,...EXTRA_RATINGS[key]])];
function RatingGroup({title,rows,player}:{title:string;rows:string[][];player:Player}){
 return <section className="rating-card"><h4>{title}</h4>{rows.map(([key,label,help])=>{const value=Number(player[key as keyof Player]??0);return <div className="rating-row" key={key}><div><strong>{label}</strong><small>{help}</small></div><meter min={0} max={100} value={value} aria-label={label}/><b>{Math.round(value)}</b></div>;})}</section>;
}
export function PlayerStatsView({player:raw}:{player:Player;onClose:()=>void}){
 const p=normalizePlayer(raw);const [tab,setTab]=useState('ratings');const [appearance,setAppearance]=useState<Appearance>(p.appearance??DEFAULT_APPEARANCE);const [saved,setSaved]=useState('');
 const saveAppearance=useGameClockStore(s=>s.saveAppearance);const pitcher=p.position==='P'||p.position==='TwoWay';
 return <div className="menu-view-container glass-panel"><div className="menu-view-header"><div><h3>내 선수 · {p.name}</h3><p>능력치 0–100 · 종합 {p.overall} · 잠재력 {p.potential}</p></div><div className="menu-view-tabs">{[['ratings','능력치'],['pitches','구종 성장'],['appearance','커스터마이징']].map(([id,label])=><button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>)}</div></div><div className="menu-view-body">
 {tab==='ratings'&&<><div className="rating-grid">{pitcher&&<RatingGroup title={`투구 · 구속 ${p.velocity!.toFixed(1)} km/h`} rows={PITCH} player={p}/ >}{p.position!=='P'&&<RatingGroup title="타격" rows={BAT} player={p}/>}<RatingGroup title="주루 · 수비" rows={FIELD} player={p}/><RatingGroup title="학교생활" rows={[["academics","학업","교과 이해도"],["relationshipCoach","감독 신뢰","기용과 지도 관계"],["relationshipTeam","팀 신뢰","동료와의 유대"]]} player={p}/></div><p>보유 특성: {p.traits?.join(' · ')||'아직 없음'}</p></>}
 {tab==='pitches'&&(pitcher?<><p>구종별 100 XP마다 숙련도 +2. 미습득 구종은 첫 100 XP를 채우면 사용할 수 있습니다. 오후 훈련에서 원하는 구종을 선택하세요.</p><div className="rating-grid">{Object.entries(PITCH_NAMES).map(([type,name])=>{const pitch=p.pitches!.find(x=>x.type===type);return <section className="rating-card" key={type}><h4>{name} <small>{pitch?.rating?'보유':pitch?'습득 중':'미습득'}</small></h4><p>숙련도 {pitch?.rating??0} / 잠재력 {pitch?.potential??p.potential}</p><progress value={pitch?.xp??0} max={100}/><p>{pitch?.xp??0} / 100 XP {pitch&&pitch.rating>=pitch.potential?'· 성장 한계 도달':''}</p></section>;})}</div></>:<p>투수와 투타겸업 선수가 구종을 훈련할 수 있습니다.</p>)}
 {tab==='appearance'&&<><AppearanceEditor value={appearance} onChange={a=>{setAppearance(a);setSaved('');}} number={p.uniformNumber}/><button className="btn btn-primary" onClick={async()=>{await saveAppearance(appearance);setSaved('외형을 저장했습니다.');}}>외형 저장</button><p role="status">{saved}</p></>}
 </div></div>;
}

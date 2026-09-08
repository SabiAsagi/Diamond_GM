import { useState } from 'react';
import type { Player } from '../../../types';
import { EQUIPMENT_CATALOG, type EquipmentSlot } from '../../../types/equipment';
import { getOutdoorLocations, type OutdoorLocation } from '../../../types/outdoorMap';
import { getHighSchoolDataByName } from '../../../data/highSchools';
import { Map, ShoppingBag, Wallet } from 'lucide-react';

interface Props {
  player: Player;
  onPurchase: (id: string) => Promise<boolean>;
  onEquip: (id: string, slot: EquipmentSlot) => Promise<void>;
  onVisit: (location: OutdoorLocation) => Promise<boolean>;
}

export function TownView({ player, onPurchase, onEquip, onVisit }: Props) {
  const [tab, setTab] = useState<'map'|'shop'>('map');
  const [notice, setNotice] = useState('');
  const region = getHighSchoolDataByName(player.highSchool)?.region || '서울';
  const act = async (fn: () => Promise<boolean>, ok: string) => setNotice(await fn() ? ok : '소지금이 부족하거나 이미 보유한 장비입니다.');
  return <div className="menu-view-container glass-panel animate-scale-up">
    <div className="menu-view-header"><div className="menu-view-title-group"><Map size={22}/><div><h3 className="menu-view-title">{region} 연고지 생활 지도</h3><p className="menu-view-sub">학교 연고지에 맞는 장소를 방문하고 장비를 준비합니다.</p></div></div><span><Wallet size={14}/> {(player.money||0).toLocaleString()}원</span></div>
    <div className="menu-view-tabs"><button className={`tab-btn ${tab==='map'?'active':''}`} onClick={()=>setTab('map')}><Map size={14}/> 지역 지도</button><button className={`tab-btn ${tab==='shop'?'active':''}`} onClick={()=>setTab('shop')}><ShoppingBag size={14}/> 장비 상점</button></div>
    {notice && <p style={{color:'#fbbf24'}}>{notice}</p>}
    <div className="menu-view-body"><div className="match-cards-grid">
      {tab === 'map' ? getOutdoorLocations(region).map(loc => <div className="match-card glass-panel" key={loc.id}><div className="m-round-title">{loc.icon} {loc.name}</div><p className="m-desc">{loc.description}</p><button className="btn btn-primary btn-sm" onClick={()=> loc.id==='goods' ? setTab('shop') : act(()=>onVisit(loc), `${loc.name} 활동을 마쳤습니다.`)}>{loc.cost ? `${loc.cost.toLocaleString()}원 · 방문` : '방문'}</button></div>) :
      EQUIPMENT_CATALOG.map(item => { const owned=player.inventory?.includes(item.id); const equipped=player.equippedItems?.[item.slot]===item.id; return <div className="match-card glass-panel" key={item.id}><div className="m-card-header"><span className="m-tour-name">{item.brand} · {item.tier}</span><span className="m-date-tag">{item.price.toLocaleString()}원</span></div><div className="m-round-title">{item.name}</div><p className="m-desc">{item.feature}<br/>{Object.entries(item.bonuses).map(([k,v])=>`${k} +${v}`).join(' · ')}</p>{owned ? <button className="btn btn-secondary btn-sm" disabled={equipped} onClick={()=>onEquip(item.id,item.slot)}>{equipped?'장착 중':'장착하기'}</button> : <button className="btn btn-primary btn-sm" onClick={()=>act(()=>onPurchase(item.id),`${item.name}을 구매했습니다.`)}>구매</button>}</div> })}
    </div></div>
  </div>;
}

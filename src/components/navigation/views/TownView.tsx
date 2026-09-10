import { useState } from 'react';
import type { Player } from '../../../types';
import {
  EQUIPMENT_CATALOG, EQUIPMENT_SLOT_LABELS, EQUIPMENT_STAT_LABELS, SHOP_TIERS,
  getRelevantSlots, isEquipmentRelevant, type EquipmentSlot, type EquipmentStat,
} from '../../../types/equipment';
import { getOutdoorLocations, type OutdoorLocation } from '../../../types/outdoorMap';
import { isSchoolDay } from '../../../types/academicCalendar';
import { getHighSchoolDataByName } from '../../../data/highSchools';
import { useGameClockStore } from '../../../store/gameClockStore';
import { MapPin, ShoppingBag, Wallet, Info } from 'lucide-react';

interface Props {
  player: Player;
  onPurchase: (id: string) => Promise<boolean>;
  onEquip: (id: string, slot: EquipmentSlot) => Promise<void>;
  onVisit: (location: OutdoorLocation) => Promise<boolean>;
}

export function TownView({ player, onPurchase, onEquip, onVisit }: Props) {
  const [tab, setTab] = useState<'map' | 'shop'>('map');
  const [shopTier, setShopTier] = useState<'basic' | 'premium'>('basic');
  const [shopCategory, setShopCategory] = useState<EquipmentSlot>('bat');
  const [selectedLocation, setSelectedLocation] = useState<OutdoorLocation | null>(null);
  const [notice, setNotice] = useState('');
  const clock = useGameClockStore(s => s.clock);
  const region = getHighSchoolDataByName(player.highSchool)?.region || '서울';
  const locations = getOutdoorLocations(region);
  const todayDateStr = `${clock.date.year}-${clock.date.month}-${clock.date.day}`;
  const isVisitedToday = player.lastOutdoorVisitDate === todayDateStr;
  const outingAllowedNow = !isSchoolDay(clock.date) || clock.currentSlot === 'night';
  const relevantSlots = getRelevantSlots(player.position);
  const activeCategory = relevantSlots.includes(shopCategory) ? shopCategory : relevantSlots[0];
  const tierConfig = SHOP_TIERS.find(s => s.id === shopTier)!;
  const shopItems = EQUIPMENT_CATALOG.filter(item => tierConfig.tiers.some(tier => tier === item.tier) && item.slot === activeCategory && isEquipmentRelevant(player, item));

  const act = async (fn: () => Promise<boolean>, ok: string) => {
    const success = await fn();
    if (success) setNotice(ok);
    else setNotice(isVisitedToday ? '오늘의 외출을 이미 마쳤습니다.' : !outingAllowedNow ? '외출은 야간이나 주말·방학에만 가능합니다.' : '소지금이 부족하거나 방문할 수 없습니다.');
  };

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group"><MapPin size={22}/><div><h3 className="menu-view-title">외출 · {region}</h3><p className="menu-view-sub">야간 또는 주말·방학에 지역 명소를 방문할 수 있습니다. (하루 1회)</p></div></div>
        <span><Wallet size={14}/> {(player.money || 0).toLocaleString()}원</span>
      </div>
      <div className="menu-view-tabs">
        <button className={`tab-btn ${tab==='map'?'active':''}`} onClick={()=>setTab('map')}><MapPin size={14}/> 지역 지도</button>
        <button className={`tab-btn ${tab==='shop'?'active':''}`} onClick={()=>setTab('shop')}><ShoppingBag size={14}/> 장비 상점</button>
      </div>
      {tab==='map' && (!outingAllowedNow || isVisitedToday) && <div className="town-notice"><Info size={16}/><span>{isVisitedToday?'오늘의 외출을 이미 마쳤습니다. 장비 상점은 언제든 이용할 수 있습니다.':'외출은 야간이나 주말·방학에만 가능합니다. 장비 상점은 언제든 이용할 수 있습니다.'}</span></div>}
      {notice && <p className="town-action-notice">{notice}</p>}

      <div className="menu-view-body">
        {tab==='map' ? (
          <div className="town-map-shell">
            <svg className="town-map-background" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs><linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#183b55"/><stop offset="1" stopColor="#10251f"/></linearGradient></defs>
              <rect width="100" height="100" fill="url(#mapSky)"/><path d="M0 72 Q20 58 38 69 T75 61 T100 68 V100 H0Z" fill="#1e4935"/>
              <path d="M-5 48 Q25 40 45 58 T105 46" fill="none" stroke="#6b7280" strokeWidth="5"/><path d="M40 -5 Q52 20 45 45 T58 105" fill="none" stroke="#64748b" strokeWidth="4"/>
              <path d="M0 82 Q28 75 55 88 T100 78" fill="none" stroke="#256b86" strokeWidth="7" opacity=".8"/>
            </svg>
            {locations.map(loc => <button key={loc.id} className={`map-building ${selectedLocation?.id===loc.id?'active':''}`} style={{left:`${loc.mapX}%`,top:`${loc.mapY}%`}} onClick={()=>setSelectedLocation(loc)} aria-label={loc.name}><span>{loc.icon}</span><small>{loc.name.split(' ')[0]}</small></button>)}
            {selectedLocation && <div className="map-location-card glass-panel"><button className="map-card-close" onClick={()=>setSelectedLocation(null)}>×</button><strong>{selectedLocation.icon} {selectedLocation.name}</strong><p>{selectedLocation.description}</p><button className="btn btn-primary btn-sm" disabled={selectedLocation.id!=='goods'&&(!outingAllowedNow||isVisitedToday)} onClick={()=>selectedLocation.id==='goods'?setTab('shop'):act(()=>onVisit(selectedLocation),`${selectedLocation.name} 활동을 마쳤습니다.`)}>{selectedLocation.id==='goods'?'상점 둘러보기':selectedLocation.cost?`${selectedLocation.cost.toLocaleString()}원 · 방문`:'방문'}</button></div>}
          </div>
        ) : (
          <div className="equipment-shop">
            <div className="shop-tier-tabs">{SHOP_TIERS.map(shop=><button key={shop.id} className={`shop-tier-card ${shopTier===shop.id?'active':''}`} onClick={()=>setShopTier(shop.id)}><strong>{shop.label}</strong><small>{shop.description}</small></button>)}</div>
            <div className="shop-category-tabs">{relevantSlots.map(slot=><button key={slot} className={`tab-btn ${activeCategory===slot?'active':''}`} onClick={()=>setShopCategory(slot)}>{EQUIPMENT_SLOT_LABELS[slot]}</button>)}</div>
            <div className="match-cards-grid">{shopItems.map(item=>{
              const owned=player.inventory?.includes(item.id); const equipped=player.equippedItems?.[item.slot]===item.id;
              return <div className="match-card glass-panel" key={item.id}><div className="m-card-header"><span className="m-tour-name">{item.brand} · {item.tier}</span><span className="m-date-tag">{item.price.toLocaleString()}원</span></div><div className="m-round-title">{item.name}</div><p className="m-desc">{item.feature}<br/><span className="equipment-bonus-text">{Object.entries(item.bonuses).map(([k,v])=>`${EQUIPMENT_STAT_LABELS[k as EquipmentStat]} +${v}`).join(' · ')}</span></p>{owned?<button className="btn btn-secondary btn-sm" onClick={()=>onEquip(equipped?'':item.id,item.slot)}>{equipped?'장착 중 (클릭 시 해제)':'장착하기'}</button>:<button className="btn btn-primary btn-sm" onClick={()=>act(()=>onPurchase(item.id),`${item.name}을 구매했습니다.`)}>구매</button>}</div>;
            })}</div>
          </div>
        )}
      </div>
    </div>
  );
}

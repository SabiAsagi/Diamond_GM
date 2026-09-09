import { useState } from 'react';
import type { Player } from '../../../types';
import { EQUIPMENT_CATALOG, type EquipmentSlot } from '../../../types/equipment';
import { getOutdoorLocations, type OutdoorLocation } from '../../../types/outdoorMap';
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
  const [notice, setNotice] = useState('');
  const clock = useGameClockStore(s => s.clock);

  const region = getHighSchoolDataByName(player.highSchool)?.region || '서울';
  const todayDateStr = `${clock.date.year}-${clock.date.month}-${clock.date.day}`;
  const isVisitedToday = player.lastOutdoorVisitDate === todayDateStr;

  const act = async (fn: () => Promise<boolean>, ok: string) => {
    const success = await fn();
    if (success) {
      setNotice(ok);
    } else {
      setNotice(
        isVisitedToday
          ? '오늘의 외출을 이미 마쳤습니다. 내일 다시 외출할 수 있습니다.'
          : '소지금이 부족하거나 방문할 수 없습니다.'
      );
    }
  };

  return (
    <div className="menu-view-container glass-panel animate-scale-up">
      <div className="menu-view-header">
        <div className="menu-view-title-group">
          <MapPin size={22} />
          <div>
            <h3 className="menu-view-title">외출 · {region}</h3>
            <p className="menu-view-sub">
              연고지 명소를 방문하여 기분 전환과 성장을 도모합니다. (외출은 하루 1회 가능)
            </p>
          </div>
        </div>
        <span>
          <Wallet size={14} /> {(player.money || 0).toLocaleString()}원
        </span>
      </div>

      <div className="menu-view-tabs">
        <button className={`tab-btn ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>
          <MapPin size={14} /> 지역 명소
        </button>
        <button className={`tab-btn ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>
          <ShoppingBag size={14} /> 장비 상점
        </button>
      </div>

      {isVisitedToday && tab === 'map' && (
        <div
          style={{
            margin: '8px 16px 0 16px',
            padding: '10px 14px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            color: '#fbbf24',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Info size={16} />
          <span>오늘의 외출을 이미 마쳤습니다. 내일 날짜가 지나면 다시 방문할 수 있습니다. (장비 상점은 상시 이용 가능)</span>
        </div>
      )}

      {notice && (
        <p style={{ color: '#fbbf24', padding: '0 16px', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
          {notice}
        </p>
      )}

      <div className="menu-view-body">
        <div className="match-cards-grid">
          {tab === 'map'
            ? getOutdoorLocations(region).map(loc => {
                const isGoods = loc.id === 'goods';
                const disabled = !isGoods && isVisitedToday;

                return (
                  <div className="match-card glass-panel" key={loc.id}>
                    <div className="m-round-title">
                      {loc.icon} {loc.name}
                    </div>
                    <p className="m-desc">{loc.description}</p>
                    <button
                      className={`btn ${disabled ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                      disabled={disabled}
                      onClick={() =>
                        isGoods ? setTab('shop') : act(() => onVisit(loc), `${loc.name} 활동을 마쳤습니다.`)
                      }
                    >
                      {isGoods
                        ? '상점 둘러보기'
                        : disabled
                        ? '오늘 외출 완료'
                        : loc.cost
                        ? `${loc.cost.toLocaleString()}원 · 방문`
                        : '방문'}
                    </button>
                  </div>
                );
              })
            : EQUIPMENT_CATALOG.map(item => {
                const owned = player.inventory?.includes(item.id);
                const equipped = player.equippedItems?.[item.slot] === item.id;
                return (
                  <div className="match-card glass-panel" key={item.id}>
                    <div className="m-card-header">
                      <span className="m-tour-name">
                        {item.brand} · {item.tier}
                      </span>
                      <span className="m-date-tag">{item.price.toLocaleString()}원</span>
                    </div>
                    <div className="m-round-title">{item.name}</div>
                    <p className="m-desc">
                      {item.feature}
                      <br />
                      {Object.entries(item.bonuses)
                        .map(([k, v]) => `${k} +${v}`)
                        .join(' · ')}
                    </p>
                    {owned ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEquip(equipped ? '' : item.id, item.slot)}
                      >
                        {equipped ? '장착 중 (클릭 시 해제)' : '장착하기'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => act(() => onPurchase(item.id), `${item.name}을 구매했습니다.`)}
                      >
                        구매
                      </button>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

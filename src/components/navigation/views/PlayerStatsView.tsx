import { useState } from 'react';
import type { Player } from '../../../types';
import { EXTRA_RATINGS, normalizePlayer, PITCH_NAMES, DEFAULT_APPEARANCE, type Appearance } from '../../../data/playerDevelopment';
import { AppearanceEditor } from '../../PlayerAppearance';
import { useGameClockStore } from '../../../store/gameClockStore';
import { EQUIPMENT_CATALOG, EQUIPMENT_SLOT_LABELS, EQUIPMENT_STAT_LABELS, getRelevantSlots, isEquipmentRelevant, type EquipmentStat } from '../../../types/equipment';
import { Sparkles, ShoppingBag, X } from 'lucide-react';

const BAT = [
  ['contact', '컨택', '안타로 연결하는 타격 정확도'],
  ['gapPower', ...EXTRA_RATINGS.gapPower],
  ['power', '홈런파워', '담장을 넘기는 타구를 생산하는 힘'],
  ['eye', '선구안', '볼을 골라 출루하는 능력'],
  ['avoidK', ...EXTRA_RATINGS.avoidK],
];

const PITCH = [
  ['stuff', '구위', '헛스윙과 탈삼진을 유도하는 능력'],
  ['movement', ...EXTRA_RATINGS.movement],
  ['control', '제구', '원하는 코스로 던져 볼넷을 줄이는 능력'],
  ['stamina', '지구력', '많은 투구 수에도 구질을 유지하는 능력'],
  ['holdRunners', ...EXTRA_RATINGS.holdRunners],
];

const FIELD = [
  ['speed', '주력', '달리는 순수 속도'],
  ...(['stealing', 'baserunning', 'fieldingRange', 'fieldingError', 'arm'] as const).map(key => [key, ...EXTRA_RATINGS[key]]),
];

function RatingGroup({
  title,
  rows,
  player,
  bonuses = {},
}: {
  title: string;
  rows: string[][];
  player: Player;
  bonuses?: Partial<Record<EquipmentStat, number>>;
}) {
  return (
    <section className="rating-card">
      <h4>{title}</h4>
      {rows.map(([key, label, help]) => {
        const rawValue = Number(player[key as keyof Player] ?? 0);
        const bonus = bonuses[key as EquipmentStat] || 0;
        const totalValue = Math.min(100, rawValue + bonus);
        return (
          <div className="rating-row" key={key}>
            <div>
              <strong>{label}</strong>
              <small>{help}</small>
            </div>
            <meter min={0} max={100} value={totalValue} aria-label={label} />
            <b>
              {Math.round(totalValue)}
              {bonus > 0 && <span style={{ color: '#10b981', fontSize: '0.8rem', marginLeft: '4px' }}> (+{bonus})</span>}
            </b>
          </div>
        );
      })}
    </section>
  );
}

export function PlayerStatsView({ player: raw }: { player: Player; onClose: () => void }) {
  const p = normalizePlayer(raw);
  const [tab, setTab] = useState<'ratings' | 'pitches' | 'equipment' | 'appearance'>('ratings');
  const [appearance, setAppearance] = useState<Appearance>(p.appearance ?? DEFAULT_APPEARANCE);
  const [saved, setSaved] = useState('');

  const saveAppearance = useGameClockStore(s => s.saveAppearance);
  const equipItem = useGameClockStore(s => s.equipItem);
  const pitcher = p.position === 'P' || p.position === 'TwoWay';

  // 장비 총 보너스 계산
  const totalBonuses: Partial<Record<EquipmentStat, number>> = {};
  for (const itemId of Object.values(p.equippedItems || {})) {
    const item = EQUIPMENT_CATALOG.find(i => i.id === itemId);
    if (item) {
      for (const [s, val] of Object.entries(item.bonuses)) {
        if (typeof val === 'number') {
          totalBonuses[s as EquipmentStat] = (totalBonuses[s as EquipmentStat] || 0) + val;
        }
      }
    }
  }

  return (
    <div className="menu-view-container glass-panel animate-fade-in">
      <div className="menu-view-header">
        <div>
          <h3>내 선수 · {p.name}</h3>
          <p>능력치 0–100 · 종합 {p.overall} · 잠재력 {p.potential}</p>
        </div>
        <div className="menu-view-tabs">
          {[
            ['ratings', '능력치'],
            ['equipment', '장비'],
            ['pitches', '구종 성장'],
            ['appearance', '커스터마이징'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`tab-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id as typeof tab)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-view-body">
        {tab === 'ratings' && (
          <>
            <div className="rating-grid">
              {pitcher && (
                <RatingGroup
                  title={`투구 · 구속 ${p.velocity!.toFixed(1)} km/h`}
                  rows={PITCH}
                  player={p}
                  bonuses={totalBonuses}
                />
              )}
              {p.position !== 'P' && (
                <RatingGroup title="타격" rows={BAT} player={p} bonuses={totalBonuses} />
              )}
              <RatingGroup title="주루 · 수비" rows={FIELD} player={p} bonuses={totalBonuses} />
              <RatingGroup
                title="학교생활"
                rows={[
                  ['academics', '학업', '교과 이해도'],
                  ['relationshipCoach', '감독 신뢰', '기용과 지도 관계'],
                  ['relationshipTeam', '팀 신뢰', '동료와의 유대'],
                ]}
                player={p}
              />
            </div>
            <p>보유 특성: {p.traits?.join(' · ') || '아직 없음'}</p>
          </>
        )}

        {tab === 'equipment' && (
          <div className="equipment-view-cluster">
            {/* 상단 장비 보너스 요약 배너 */}
            <div
              className="glass-panel"
              style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '10px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} color="#fbbf24" />
                <strong style={{ fontSize: '0.95rem' }}>장비 총 보너스 합계</strong>
              </div>
              {Object.keys(totalBonuses).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(totalBonuses).map(([stat, val]) => (
                    <span
                      key={stat}
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {EQUIPMENT_STAT_LABELS[stat as EquipmentStat] || stat} +{val}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  현재 장착된 장비가 없습니다. 장비를 장착하면 경기와 훈련에 능력치 보너스가 실시간 반영됩니다.
                </p>
              )}
            </div>

            {/* 7대 슬롯별 장착 카드 그리드 */}
            <div className="match-cards-grid">
              {getRelevantSlots(p.position).map(slot => {
                const equippedId = p.equippedItems?.[slot];
                const equippedCandidate = equippedId ? EQUIPMENT_CATALOG.find(i => i.id === equippedId) : null;
                const equippedItem = equippedCandidate && isEquipmentRelevant(p, equippedCandidate) ? equippedCandidate : null;
                const ownedItems = EQUIPMENT_CATALOG.filter(
                  i => i.slot === slot && isEquipmentRelevant(p, i) && p.inventory?.includes(i.id) && i.id !== equippedId
                );

                return (
                  <div
                    key={slot}
                    className="match-card glass-panel"
                    style={{
                      borderLeft: equippedItem ? '3px solid #3b82f6' : '3px dashed rgba(255,255,255,0.2)',
                    }}
                  >
                    <div className="m-card-header">
                      <span className="m-tour-name" style={{ fontWeight: 700 }}>
                        {EQUIPMENT_SLOT_LABELS[slot]}
                      </span>
                      {equippedItem ? (
                        <span className="m-date-tag" style={{ background: '#2563eb', color: '#fff' }}>
                          {equippedItem.tier}
                        </span>
                      ) : (
                        <span className="m-date-tag" style={{ opacity: 0.6 }}>
                          미장착
                        </span>
                      )}
                    </div>

                    {equippedItem ? (
                      <>
                        <div className="m-round-title" style={{ fontSize: '1.05rem', marginTop: '4px' }}>
                          {equippedItem.name}
                        </div>
                        <p className="m-desc" style={{ minHeight: '38px' }}>
                          {equippedItem.feature}
                          <br />
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {Object.entries(equippedItem.bonuses)
                              .map(([k, v]) => `${EQUIPMENT_STAT_LABELS[k as EquipmentStat] || k} +${v}`)
                              .join(' · ')}
                          </span>
                        </p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => equipItem('', slot)}
                          >
                            <X size={14} style={{ marginRight: '4px' }} /> 장착 해제
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="m-round-title" style={{ fontSize: '0.95rem', opacity: 0.7, marginTop: '4px' }}>
                          슬롯 비어있음
                        </div>
                        <p className="m-desc" style={{ minHeight: '38px', color: 'var(--text-muted)' }}>
                          {ownedItems.length > 0
                            ? `보유 중인 장비 ${ownedItems.length}개가 있습니다.`
                            : '보유 중인 장비가 없습니다. 외출 상점에서 구입하세요.'}
                        </p>
                        {ownedItems.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                            {ownedItems.map(item => (
                              <button
                                key={item.id}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                onClick={() => equipItem(item.id, slot)}
                              >
                                {item.name} 장착
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              marginTop: '8px',
                              padding: '6px',
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <ShoppingBag size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            외출 탭의 상점에서 구매 가능
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'pitches' &&
          (pitcher ? (
            <>
              <p>
                구종별 100 XP마다 숙련도 +2. 미습득 구종은 첫 100 XP를 채우면 사용할 수 있습니다. 오후 훈련에서
                원하는 구종을 선택하세요.
              </p>
              <div className="rating-grid">
                {Object.entries(PITCH_NAMES).map(([type, name]) => {
                  const pitch = p.pitches!.find(x => x.type === type);
                  return (
                    <section className="rating-card" key={type}>
                      <h4>
                        {name}{' '}
                        <small>{pitch?.rating ? '보유' : pitch ? '습득 중' : '미습득'}</small>
                      </h4>
                      <p>
                        숙련도 {pitch?.rating ?? 0} / 잠재력 {pitch?.potential ?? p.potential}
                      </p>
                      <progress value={pitch?.xp ?? 0} max={100} />
                      <p>
                        {pitch?.xp ?? 0} / 100 XP{' '}
                        {pitch && pitch.rating >= pitch.potential ? '· 성장 한계 도달' : ''}
                      </p>
                    </section>
                  );
                })}
              </div>
            </>
          ) : (
            <p>투수와 투타겸업 선수가 구종을 훈련할 수 있습니다.</p>
          ))}

        {tab === 'appearance' && (
          <>
            <AppearanceEditor
              value={appearance}
              onChange={a => {
                setAppearance(a);
                setSaved('');
              }}
              number={p.uniformNumber}
              gender={p.gender}
              schoolName={p.highSchool}
            />
            <button
              className="btn btn-primary"
              onClick={async () => {
                await saveAppearance(appearance);
                setSaved('외형을 저장했습니다.');
              }}
            >
              외형 저장
            </button>
            <p role="status">{saved}</p>
          </>
        )}
      </div>
    </div>
  );
}

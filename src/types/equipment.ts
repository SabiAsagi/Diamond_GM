import type { Player } from './index';

export type EquipmentSlot = 'bat' | 'glove' | 'catcherGear' | 'spikes' | 'trainingGear';
export type EquipmentTier = '입문' | '학생' | '엘리트' | '프로';
export type EquipmentStat = 'contact' | 'power' | 'eye' | 'speed' | 'defense' | 'stuff' | 'control' | 'stamina';

export interface EquipmentItem {
  id: string; brand: string; tier: EquipmentTier; slot: EquipmentSlot; name: string; price: number;
  bonuses: Partial<Record<EquipmentStat, number>>; feature: string;
}

const tierScale: Record<EquipmentTier, number> = { 입문: 1, 학생: 2, 엘리트: 3, 프로: 4 };
const brandLines = [
  { brand: '미즈노아', feature: '균형 잡힌 착용감과 정교한 컨트롤', slot: 'glove' as EquipmentSlot, bonuses: { defense: 2, control: 1 } },
  { brand: '롤린즈', feature: '견고한 가죽과 안정적인 포구', slot: 'glove' as EquipmentSlot, bonuses: { defense: 3 } },
  { brand: '윌슨즈', feature: '가볍고 빠른 글러브 전환', slot: 'glove' as EquipmentSlot, bonuses: { defense: 2, speed: 1 } },
  { brand: '제트라', feature: '공격적인 밸런스와 강한 타구', slot: 'bat' as EquipmentSlot, bonuses: { power: 2, contact: 1 } },
  { brand: '하타케온', feature: '포수 미트와 보호장비 전문', slot: 'catcherGear' as EquipmentSlot, bonuses: { defense: 3, control: 1 } },
  { brand: '골드파크', feature: '국내 선수 체형에 맞춘 실전형 설계', slot: 'trainingGear' as EquipmentSlot, bonuses: { stamina: 2, stuff: 1 } },
  { brand: '브레튼', feature: '합리적인 가격의 올라운드 장비', slot: 'bat' as EquipmentSlot, bonuses: { contact: 2, eye: 1 } },
  { brand: '스톰즈', feature: '강한 임팩트와 파워 특화', slot: 'bat' as EquipmentSlot, bonuses: { power: 3 } },
];

export const EQUIPMENT_CATALOG: EquipmentItem[] = brandLines.flatMap((line, brandIndex) =>
  (['입문', '학생', '엘리트', '프로'] as EquipmentTier[]).map((tier) => {
    const scale = tierScale[tier];
    return {
      id: `${brandIndex}_${line.slot}_${tier}`,
      brand: line.brand, tier, slot: line.slot,
      name: `${line.brand} ${tier} ${line.slot === 'catcherGear' ? '포수 세트' : line.slot === 'bat' ? '배트' : line.slot === 'glove' ? '글러브' : '트레이닝 기어'}`,
      price: 35000 * scale * scale + brandIndex * 4000,
      feature: line.feature,
      bonuses: Object.fromEntries(Object.entries(line.bonuses).map(([key, value]) => [key, value * scale])) as EquipmentItem['bonuses'],
    };
  })
);

export function getEffectiveStat(player: Player, stat: EquipmentStat): number {
  const bonus = Object.values(player.equippedItems || {}).reduce((sum, id) => {
    const item = EQUIPMENT_CATALOG.find(e => e.id === id);
    return sum + (item?.bonuses[stat] || 0);
  }, 0);
  return Math.min(100, player[stat] + bonus);
}

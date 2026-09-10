import type { Player } from './index';

export type EquipmentSlot = 'bat' | 'glove' | 'catcherGear' | 'spikes' | 'trainingGear' | 'protectiveGear' | 'accessory' | 'baseRunningGloves';
export type EquipmentTier = '입문' | '학생' | '엘리트' | '프로';
export type EquipmentStat = 'contact' | 'power' | 'eye' | 'speed' | 'defense' | 'stuff' | 'control' | 'stamina';
export type GloveCategory = 'infield' | 'outfield' | 'firstBase' | 'pitcher';

export interface EquipmentItem {
  id: string;
  brand: string;
  tier: EquipmentTier;
  slot: EquipmentSlot;
  name: string;
  price: number;
  bonuses: Partial<Record<EquipmentStat, number>>;
  feature: string;
  gloveCategory?: GloveCategory;
}

export const EQUIPMENT_STAT_LABELS: Record<EquipmentStat, string> = {
  contact: '컨택', power: '파워', eye: '선구안', speed: '스피드', defense: '수비',
  stuff: '구위', control: '제구', stamina: '스태미나',
};

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  bat: '배트',
  glove: '글러브',
  catcherGear: '포수 장비',
  spikes: '스파이크',
  trainingGear: '트레이닝 기어',
  protectiveGear: '보호대',
  accessory: '액세서리',
  baseRunningGloves: '주루장갑',
};

export const SHOP_TIERS = [
  { id: 'basic', label: '동네 스포츠샵', description: '입문 · 학생용', tiers: ['입문', '학생'] },
  { id: 'premium', label: '프리미엄 전문점', description: '엘리트 · 프로용', tiers: ['엘리트', '프로'] },
] as const satisfies ReadonlyArray<{ id: 'basic' | 'premium'; label: string; description: string; tiers: readonly EquipmentTier[] }>;

const tierScale: Record<EquipmentTier, number> = { 입문: 1, 학생: 2, 엘리트: 3, 프로: 4 };

const slotSuffix: Record<EquipmentSlot, string> = {
  bat: '배트',
  glove: '글러브',
  catcherGear: '포수 세트',
  spikes: '스파이크',
  trainingGear: '트레이닝 기어',
  protectiveGear: '보호대',
  accessory: '액세서리',
  baseRunningGloves: '주루장갑',
};

const brandLines: { brand: string; feature: string; slot: EquipmentSlot; bonuses: Partial<Record<EquipmentStat, number>>; gloveCategory?: GloveCategory }[] = [
  // Existing 8 brands (indices 0..7) preserved
  { brand: '미즈노아', feature: '작고 가벼운 내야 글러브', slot: 'glove', gloveCategory: 'infield', bonuses: { defense: 2, control: 1 } },
  { brand: '롤린즈', feature: '깊은 포켓의 외야 글러브', slot: 'glove', gloveCategory: 'outfield', bonuses: { defense: 3, speed: 1 } },
  { brand: '윌슨즈', feature: '빠른 송구 전환용 내야 글러브', slot: 'glove', gloveCategory: 'infield', bonuses: { defense: 2, speed: 1 } },
  { brand: '제트라', feature: '공격적인 밸런스와 강한 타구', slot: 'bat', bonuses: { power: 2, contact: 1 } },
  { brand: '하타케온', feature: '포수 미트와 보호장비 전문', slot: 'catcherGear', bonuses: { defense: 3, control: 1 } },
  { brand: '골드파크', feature: '국내 선수 체형에 맞춘 실전형 설계', slot: 'trainingGear', bonuses: { stamina: 2, stuff: 1 } },
  { brand: '브레튼', feature: '합리적인 가격의 올라운드 장비', slot: 'bat', bonuses: { contact: 2, eye: 1 } },
  { brand: '스톰즈', feature: '강한 임팩트와 파워 특화', slot: 'bat', bonuses: { power: 3 } },
  // Spikes (3 brands)
  { brand: '패스트런', feature: '폭발적인 스타트와 가속력 특화', slot: 'spikes', bonuses: { speed: 3 } },
  { brand: '맥스그립', feature: '견고한 접지력과 급제동 안정성', slot: 'spikes', bonuses: { speed: 2, defense: 1 } },
  { brand: '에어로스파이크', feature: '초경량 피팅감과 날렵한 주루 센스', slot: 'spikes', bonuses: { speed: 2, contact: 1 } },
  // Protective Gear (3 brands)
  { brand: '가디언즈', feature: '고강도 프로텍터로 충격 흡수 및 부상 방지', slot: 'protectiveGear', bonuses: { defense: 2, stamina: 1 } },
  { brand: '에보쉴드핏', feature: '커스텀 몰딩 암가드로 정교한 스윙 궤적 유지', slot: 'protectiveGear', bonuses: { contact: 2, eye: 1 } },
  { brand: '아머배트', feature: '팔꿈치와 정강이를 보호하는 일체형 가드', slot: 'protectiveGear', bonuses: { power: 2, defense: 1 } },
  // Accessories (3 brands)
  { brand: '오클리언', feature: '난반사 방지 편광 렌즈로 타구 판독력 극대화', slot: 'accessory', bonuses: { eye: 3 } },
  { brand: '파이텐스', feature: '신체 밸런스 유지와 피로도 저감 파워 티타늄', slot: 'accessory', bonuses: { stamina: 2, control: 1 } },
  { brand: '에너지코어', feature: '마그네틱 이온 루프로 마운드 위 집중력 강화', slot: 'accessory', bonuses: { stuff: 2, eye: 1 } },
  // Training Gear additional brand
  { brand: '아이언포스', feature: '헤비 트레이닝 웨이트와 구속 강화', slot: 'trainingGear', bonuses: { stuff: 2, power: 1 } },
  // Position-specific glove lines are appended to preserve every existing catalog ID.
  { brand: '퍼스트킹', feature: '넓은 포구면의 1루수 전용 미트', slot: 'glove', gloveCategory: 'firstBase', bonuses: { defense: 3, contact: 1 } },
  { brand: '마운드쉴드', feature: '그립을 숨기고 제구를 돕는 투수 글러브', slot: 'glove', gloveCategory: 'pitcher', bonuses: { control: 3, defense: 1 } },
  { brand: '스틸런', feature: '밀착형 손바닥 패드로 슬라이딩 안정성 강화', slot: 'baseRunningGloves', bonuses: { speed: 2, defense: 1 } },
  { brand: '퀵베이스', feature: '초경량 원단으로 주루 감각과 스타트 집중', slot: 'baseRunningGloves', bonuses: { speed: 3 } },
];

export const EQUIPMENT_CATALOG: EquipmentItem[] = brandLines.flatMap((line, brandIndex) =>
  (['입문', '학생', '엘리트', '프로'] as EquipmentTier[]).map((tier) => {
    const scale = tierScale[tier];
    return {
      id: `${brandIndex}_${line.slot}_${tier}`,
      brand: line.brand,
      tier,
      slot: line.slot,
      name: `${line.brand} ${tier} ${slotSuffix[line.slot]}`,
      price: 35000 * scale * scale + brandIndex * 4000,
      feature: line.feature,
      gloveCategory: line.gloveCategory,
      bonuses: Object.fromEntries(
        Object.entries(line.bonuses).map(([key, value]) => [key, (value ?? 0) * scale])
      ) as EquipmentItem['bonuses'],
    };
  })
);

export function getRelevantSlots(position: Player['position']): EquipmentSlot[] {
  const common: EquipmentSlot[] = ['spikes', 'protectiveGear', 'accessory', 'trainingGear'];
  if (position === 'P') return [...common, 'glove'];
  if (position === 'C') return [...common, 'glove', 'catcherGear', 'baseRunningGloves'];
  return [...common, 'bat', 'glove', 'baseRunningGloves'];
}

export function getRelevantGloveCategory(position: Player['position']): GloveCategory {
  if (position === 'P') return 'pitcher';
  if (position === '1B') return 'firstBase';
  if (['LF', 'CF', 'RF'].includes(position)) return 'outfield';
  return 'infield';
}

export function isEquipmentRelevant(player: Player, item: EquipmentItem): boolean {
  if (!getRelevantSlots(player.position).includes(item.slot)) return false;
  return item.slot !== 'glove' || item.gloveCategory === getRelevantGloveCategory(player.position);
}

export function getEffectiveStat(player: Player, stat: EquipmentStat): number {
  const bonus = Object.values(player.equippedItems || {}).reduce((sum, id) => {
    const item = EQUIPMENT_CATALOG.find(e => e.id === id);
    return sum + (item && isEquipmentRelevant(player, item) ? item.bonuses[stat] || 0 : 0);
  }, 0);
  return Math.min(100, (player[stat] ?? 0) + bonus);
}

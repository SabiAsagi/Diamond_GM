import type { PlayerStatsSubset } from './activity';

export interface OutdoorLocation {
  id: string; name: string; icon: string; description: string; cost: number;
  effects: { statChanges: PlayerStatsSubset; condition: number; money?: number };
}

const common: OutdoorLocation[] = [
  { id: 'goods', name: '지역 야구용품 거리', icon: '🛍️', description: '장비 상점에서 브랜드별 용품을 살펴봅니다.', cost: 0, effects: { statChanges: {}, condition: 0 } },
  { id: 'cage', name: '동네 배팅센터', icon: '⚾', description: '자유롭게 타격 감각을 가다듬습니다.', cost: 10000, effects: { statChanges: { contact: 1 }, condition: -5 } },
  { id: 'library', name: '시립 도서관', icon: '📚', description: '공부와 야구 이론을 함께 정리합니다.', cost: 0, effects: { statChanges: { academics: 3, eye: 1 }, condition: 3 } },
  { id: 'karaoke', name: '코인 노래방', icon: '🎤', description: '친구와 스트레스를 풉니다.', cost: 8000, effects: { statChanges: { relationshipFriends: 3 }, condition: 12 } },
];

const landmarks: Record<string, OutdoorLocation[]> = {
  서울: [{ id: 'jamsil', name: '잠실 야구장', icon: '🏟️', description: '프로 경기를 보며 큰 무대의 감각을 익힙니다.', cost: 18000, effects: { statChanges: { fame: 1, eye: 1 }, condition: 10 } }],
  부산: [{ id: 'sajik', name: '사직 야구장', icon: '🏟️', description: '열정적인 응원 속에서 프로의 꿈을 키웁니다.', cost: 16000, effects: { statChanges: { fame: 1, eye: 1 }, condition: 12 } }, { id: 'gwangalli', name: '광안리 해변 산책로', icon: '🌊', description: '바닷바람을 맞으며 몸과 마음을 회복합니다.', cost: 0, effects: { statChanges: { stamina: 1 }, condition: 15 } }],
  인천: [{ id: 'munhak', name: '문학 야구장', icon: '🏟️', description: '프로 경기의 수 싸움을 관찰합니다.', cost: 16000, effects: { statChanges: { eye: 2 }, condition: 9 } }],
  경기: [{ id: 'suwon', name: '수원 야구장', icon: '🏟️', description: '프로 선수의 준비 과정을 관찰합니다.', cost: 16000, effects: { statChanges: { eye: 1, control: 1 }, condition: 9 } }],
  대구: [{ id: 'daegupark', name: '대구 야구장', icon: '🏟️', description: '장타자들의 타격을 가까이에서 봅니다.', cost: 16000, effects: { statChanges: { power: 1, eye: 1 }, condition: 10 } }],
  광주: [{ id: 'champions', name: '광주 야구장', icon: '🏟️', description: '전통 강호의 기본기를 배웁니다.', cost: 15000, effects: { statChanges: { defense: 1, eye: 1 }, condition: 10 } }],
  대전: [{ id: 'daejeonpark', name: '대전 야구장', icon: '🏟️', description: '투수와 타자의 승부를 집중 관찰합니다.', cost: 15000, effects: { statChanges: { control: 1, contact: 1 }, condition: 10 } }],
};

export function getOutdoorLocations(region: string): OutdoorLocation[] {
  return [...(landmarks[region] || [{ id: 'regional', name: `${region} 지역 야구장`, icon: '🏟️', description: '연고지 야구 문화를 체험합니다.', cost: 12000, effects: { statChanges: { eye: 1 }, condition: 10 } }]), ...common];
}

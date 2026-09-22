import type { BondId } from '../types/bondScores';

// 인연 카드와 대화 장면에서 같은 인물의 전용 일러스트를 사용한다.
export const CHARACTER_PORTRAITS = {
  coach: 'assets/characters/coach.webp',
  coach2: 'assets/characters/coach2-v18.webp',
  teacher: 'assets/characters/teacher-v18.webp',
  pe: 'assets/characters/pe-v18.webp',
  senior: 'assets/characters/senior-v18.webp',
  peer: 'assets/characters/peer-v18.webp',
  rival: 'assets/characters/rival-v18.webp',
  junior: 'assets/characters/junior-v18.webp',
  childhood: 'assets/characters/childhood-v18.webp',
  neighbor: 'assets/characters/neighbor-v18.webp',
  deskmate: 'assets/characters/deskmate-v18.webp',
  mother: 'assets/characters/mother-v18.webp',
  father: 'assets/characters/father-v18.webp',
  scout: 'assets/characters/scout-v18.webp',
} satisfies Record<BondId | 'scout', string>;

export type PortraitCharacterId = keyof typeof CHARACTER_PORTRAITS;

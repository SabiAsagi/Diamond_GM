export type RandomRelationshipRole =
  | 'senior'
  | 'peer'
  | 'rival'
  | 'junior'
  | 'childhood'
  | 'neighbor'
  | 'deskmate';

export type ProfileGender = 'male' | 'female';

export interface RandomRelationshipProfile {
  id: string;
  gender: ProfileGender;
  nameCandidates: readonly string[];
  baseballPortrait?: string;
  schoolPortrait?: string;
  casualPortrait?: string;
}

const 야구부프로필 = (
  role: 'senior' | 'peer' | 'rival' | 'junior',
  names: readonly string[],
): readonly RandomRelationshipProfile[] =>
  names.map((name, index) => ({
    id: `${role}-${String(index + 1).padStart(2, '0')}`,
    gender: index < 8 ? 'male' : 'female',
    nameCandidates: [name],
    baseballPortrait: `assets/characters/random/${role}/${role}-${String(index + 1).padStart(2, '0')}-baseball.webp`,
  }));

const 친구프로필 = (
  role: 'childhood' | 'neighbor' | 'deskmate',
  names: readonly string[],
): readonly RandomRelationshipProfile[] =>
  names.map((name, index) => ({
    id: `${role}-${String(index + 1).padStart(2, '0')}`,
    gender: index < 5 ? 'female' : 'male',
    nameCandidates: [name],
    schoolPortrait: `assets/characters/random/${role}/${role}-${String(index + 1).padStart(2, '0')}-school.webp`,
    casualPortrait: `assets/characters/random/${role}/${role}-${String(index + 1).padStart(2, '0')}-casual.webp`,
  }));

// 새 게임 생성 시 역할별 목록에서 하나를 뽑아 이름과 초상화를 함께 저장한다.
// 같은 프로필의 교복·사복 이미지는 동일 인물로 제작되어 있다.
export const RANDOM_RELATIONSHIP_PROFILES = {
  senior: 야구부프로필('senior', [
    '강민준', '이준혁', '박현우', '김도윤', '정태양',
    '최건우', '윤시우', '한재민', '서예린', '오하은',
  ]),
  peer: 야구부프로필('peer', [
    '이도현', '김태훈', '박준서', '최우진', '정민재',
    '강서준', '윤지호', '한성민', '임수아', '배지민',
  ]),
  rival: 야구부프로필('rival', [
    '박태성', '김건호', '이현석', '최도하', '정우찬',
    '강민혁', '윤재성', '한도윤', '서지아', '류채원',
  ]),
  junior: 야구부프로필('junior', [
    '김시온', '이하준', '박도하', '최선우', '정유찬',
    '강이안', '윤지환', '한승민', '오시은', '서주아',
  ]),
  childhood: 친구프로필('childhood', [
    '한서윤', '김나연', '박소희', '이채린', '정다은',
    '강지훈', '윤현우', '서준호', '임도경', '배시온',
  ]),
  neighbor: 친구프로필('neighbor', [
    '최유나', '김하린', '박지우', '이서아', '정수빈',
    '최민재', '강우빈', '윤태호', '한재윤', '임시후',
  ]),
  deskmate: 친구프로필('deskmate', [
    '윤하린', '김세아', '박예은', '이다빈', '정유진',
    '최도겸', '강민수', '서이준', '한우현', '임건우',
  ]),
} satisfies Record<RandomRelationshipRole, readonly RandomRelationshipProfile[]>;

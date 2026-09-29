import type { Appearance } from './playerDevelopment';
import { PORTRAIT_PRESETS } from './playerDevelopment';
import { CHARACTER_PORTRAITS } from './characterPortraits';
import { RANDOM_RELATIONSHIP_PROFILES } from './randomRelationshipProfiles';
import type { Gender, Player } from '../types';
import type { HighSchoolData } from '../types/highSchool';
import { BOND_NAMES, CAST_BOND_IDS, type BondId } from '../types/bondScores';

/** 회차마다 새로 정해지는 학생 인물. 감독·교사·부모는 고정 인물이다. */
export const CAST_IDS = CAST_BOND_IDS;
export type CastId = typeof CAST_IDS[number];
const FRIEND_CAST = ['childhood', 'neighbor', 'deskmate'] as const;

export type CastPortrait =
  | { kind: 'image'; src: string; schoolName?: string }
  | { kind: 'imagePair'; schoolSrc: string; casualSrc: string }
  | { kind: 'preset'; appearance: Appearance; schoolName: string; number: number };
export interface CastMember { name: string; gender: Gender; portrait: CastPortrait }
export type Cast = Record<CastId, CastMember>;

export const isCastId = (id: string): id is CastId => (CAST_IDS as readonly string[]).includes(id);

/** 캐스트가 없는 이전 저장본의 인물. 기존 이름과 전용 일러스트를 그대로 쓴다. */
const DEFAULT_GENDERS: Record<CastId, Gender> = {
  senior: 'male', peer: 'male', rival: 'male', junior: 'male', childhood: 'female', neighbor: 'male', deskmate: 'female',
};
export const DEFAULT_CAST: Cast = Object.fromEntries(CAST_IDS.map(id => [id, {
  name: BOND_NAMES[id], gender: DEFAULT_GENDERS[id], portrait: { kind: 'image', src: CHARACTER_PORTRAITS[id] },
}])) as Cast;

const ACCESSORIES: (string | undefined)[] = [undefined, undefined, 'headband', 'goggles'];

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍', '전', '고', '문', '배', '백'];
const GIVEN_NAMES: Record<Gender, string[]> = {
  male: ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준우', '건우', '현우', '우진', '선우', '연우', '유준', '정우', '승우', '승현', '시윤', '준혁', '은우', '지환', '승민', '태윤', '재윤', '민성', '동현', '태민', '성빈'],
  female: ['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '윤서', '지유', '지민', '채원', '수아', '지아', '다은', '예은', '수빈', '소율', '예린', '지원', '하린', '유나', '가은', '시은', '다인', '채은', '나연', '소윤', '예서', '주아', '은서'],
};

/** 회차별 라이벌의 소속 학교·팀. 이전 저장본의 기본 라이벌은 소속 정보가 없다. */
export function getRivalSchool(player: Pick<Player, 'cast'>): string | undefined {
  const portrait = getCastMember(player, 'rival').portrait;
  return portrait.kind === 'preset' || portrait.kind === 'image' ? portrait.schoolName : undefined;
}

export function getCastMember(player: Pick<Player, 'cast'>, id: CastId): CastMember {
  return player.cast?.[id] ?? DEFAULT_CAST[id];
}

/** 인연 인물의 이름. 학생 인물은 회차별 이름, 나머지는 고정 호칭. */
export function getBondName(player: Pick<Player, 'cast'> | null | undefined, id: BondId): string {
  return isCastId(id) && player ? getCastMember(player, id).name : BOND_NAMES[id];
}

const JOSA: Record<string, [withBatchim: string, withoutBatchim: string]> = {
  이: ['이', '가'], 가: ['이', '가'], 은: ['은', '는'], 는: ['은', '는'], 을: ['을', '를'], 를: ['을', '를'],
  과: ['과', '와'], 와: ['과', '와'], 이랑: ['이랑', '랑'], 랑: ['이랑', '랑'], 아: ['아', '야'], 야: ['아', '야'],
};
const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

/**
 * 문장 속 {peer} 같은 인물 자리를 이번 회차 이름으로 바꾼다.
 * {peer|과}처럼 조사를 붙이면 이름 받침에 맞춰 과/와, 이/가, 은/는, 을/를 등을 고른다.
 */
export function personalizeText(text: string, player: Pick<Player, 'cast'> | null | undefined): string {
  return text.replace(/\{(senior|peer|rival|junior|childhood|neighbor|deskmate)(?:\|([^}]+))?\}/g, (_, id: CastId, josa?: string) => {
    const name = getBondName(player, id);
    const forms = josa ? JOSA[josa] : undefined;
    return name + (forms ? forms[hasBatchim(name) ? 0 : 1] : josa ?? '');
  });
}

/** 새 커리어의 학생 인물을 무작위로 만든다. 이름은 서로·선수와 겹치지 않고, 야구부 인물 얼굴은 선수와 겹치지 않는다. */
export function generateCast(
  player: Pick<Player, 'name' | 'gender' | 'appearance' | 'highSchool'>,
  schools: HighSchoolData[],
  random: () => number = Math.random,
): Cast {
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const shuffle = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  };

  // 성만 다르고 이름이 같으면 헷갈리므로 이름(성 제외)도 서로·선수와 겹치지 않게 고른다.
  const usedGiven = new Set([player.name.slice(1)]);
  const nameFor = (gender: Gender) => {
    const given = pick(GIVEN_NAMES[gender].filter(g => !usedGiven.has(g))) ?? pick(GIVEN_NAMES[gender]);
    usedGiven.add(given);
    return pick(SURNAMES) + given;
  };

  // 후배는 선수 생성 프리셋을 사용한다. 나머지 야구부 인물은 역할별 전용 일러스트 풀에서 뽑는다.
  const faces: Record<Gender, string[]> = {
    male: shuffle(PORTRAIT_PRESETS.male.map(p => p.id).filter(id => id !== player.appearance?.hairStyleId)),
    female: shuffle(PORTRAIT_PRESETS.female.map(p => p.id).filter(id => id !== player.appearance?.hairStyleId)),
  };
  const home = schools.find(s => s.name === player.highSchool);
  // 라이벌은 선수가 고른 학교·팀과 같은 시·도의 다른 학교·팀 소속. 같은 지역에 다른 팀이 없으면 전국에서 고른다.
  const otherSchools = schools.filter(s => s.name !== player.highSchool);
  const rivalSchools = otherSchools.filter(s => !home || s.region === home.region);
  const rivalSchool = pick(rivalSchools.length ? rivalSchools : otherSchools)?.name ?? player.highSchool;
  const cast: Partial<Cast> = {};
  for (const id of ['senior', 'peer', 'rival'] as const) {
    const profile = pick([...RANDOM_RELATIONSHIP_PROFILES[id]]);
    cast[id] = {
      name: nameFor(profile.gender),
      gender: profile.gender,
      portrait: {
        kind: 'image',
        src: profile.baseballPortrait!,
        schoolName: id === 'rival' ? rivalSchool : player.highSchool,
      },
    };
  }
  for (const id of ['junior'] as const) {
    let gender: Gender = random() < 0.5 ? 'male' : 'female';
    if (!faces[gender].length) gender = gender === 'male' ? 'female' : 'male';
    const hairStyleId = faces[gender].shift() ?? PORTRAIT_PRESETS[gender][0].id;
    cast[id] = {
      name: nameFor(gender), gender,
      portrait: { kind: 'preset', appearance: { hairStyleId, accessoryId: pick(ACCESSORIES) }, schoolName: player.highSchool, number: 2 + Math.floor(random() * 58) },
    };
  }
  // 친구 인물: 역할별 10명 중 하나를 뽑고, 교복·사복 한 쌍을 함께 저장한다.
  FRIEND_CAST.forEach(id => {
    const profile = pick([...RANDOM_RELATIONSHIP_PROFILES[id]]);
    cast[id] = {
      name: nameFor(profile.gender),
      gender: profile.gender,
      portrait: { kind: 'imagePair', schoolSrc: profile.schoolPortrait!, casualSrc: profile.casualPortrait! },
    };
  });
  return cast as Cast;
}

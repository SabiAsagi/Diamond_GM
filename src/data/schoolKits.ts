import { getHighSchoolDataByName } from './highSchools';

export type KitStyle = 'classic' | 'pinstripe' | 'solid' | 'raglan';
const STYLES: KitStyle[] = ['classic', 'pinstripe', 'solid', 'raglan'];
const SCHOOL_STYLES: Record<string, KitStyle> = {
  덕수고: 'pinstripe', 서울고: 'classic', 충암고: 'raglan', 휘문고: 'solid',
  경북고: 'classic', 광주제일고: 'pinstripe', 부산고: 'raglan', 북일고: 'solid',
  경남고: 'classic', 유신고: 'raglan', 신일고: 'solid', 인천고: 'pinstripe',
};
export const KIT_STYLE_LABELS: Record<KitStyle, string> = {
  classic: '화이트 · 배색 파이핑', pinstripe: '화이트 · 핀스트라이프',
  solid: '팀 컬러 · 투톤 트림', raglan: '화이트 · 배색 소매',
};

// 게임용 학교 키트. 실제 학교의 공식 유니폼 재현을 뜻하지 않는다.
// 목록 순서가 바뀌어도 같은 학교는 같은 디자인을 사용한다.
export function getSchoolKit(schoolName: string) {
  const school = getHighSchoolDataByName(schoolName);
  const name = school?.name || schoolName || '고교';
  const seed = [...(school?.id || name)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const primary = school?.uniformPrimaryColor ?? school?.emblem?.primaryColor ?? '#1e3a8a';
  const secondary = school?.uniformSecondaryColor ?? school?.emblem?.secondaryColor ?? '#f59e0b';
  const style = SCHOOL_STYLES[name] ?? STYLES[seed % STYLES.length];
  return {
    primary, secondary, style, label: KIT_STYLE_LABELS[style],
    name: name.replace(/등학교$/, '').slice(0, 6),
    symbol: (school?.emblem?.symbolText || name.slice(0, 2)).slice(0, 2),
    ink: style === 'solid' ? '#ffffff' : primary,
    capText: school?.emblem?.textColor ?? '#ffffff',
  };
}

export interface PortraitFit {
  jersey: string;
  hairExclusion?: string;
  eyeX: number;
  eyeY: number;
  eyeGap: number;
  forehead: number;
  headWidth: number;
  headX: number;
  chestY: number;
  chestX: number;
  placketX: number;
  shoulderY: number;
  cuffY: number;
}

// 원화의 200 × 300 좌표. 목선·소매·밑단과 가슴 앞으로 내려오는 머리를 개별 측정한다.
export const PORTRAIT_FITS: Record<string, PortraitFit> = {
  male_spiky: {
    jersey: 'M0 179 Q5 151 29 148 L74 126 Q70 148 98 163 Q126 148 128 126 L175 148 Q196 154 200 180 V241 Q179 250 164 247 L159 235 L164 300 H36 L41 238 L36 246 Q20 248 0 240Z',
    eyeX: 82, eyeY: 75, eyeGap: 30, forehead: 55, headWidth: 96, headX: 100,
    chestY: 189, chestX: 139, placketX: 89, shoulderY: 152, cuffY: 241,
  },
  male_buzz: {
    jersey: 'M0 181 Q8 147 26 129 L73 105 Q66 124 96 137 Q126 122 127 105 L179 128 Q193 145 200 181 V213 Q177 223 161 222 L158 241 Q169 261 157 268 Q102 277 44 268 Q29 265 35 254 L42 238 L38 220 Q20 221 0 213Z',
    eyeX: 85, eyeY: 60, eyeGap: 27, forehead: 43, headWidth: 80, headX: 99,
    chestY: 164, chestX: 139, placketX: 91, shoulderY: 131, cuffY: 215,
  },
  male_parted: {
    jersey: 'M0 180 Q7 148 24 132 L73 108 Q68 127 99 142 Q126 126 129 108 L179 131 Q195 146 200 181 V214 Q180 225 162 223 L157 243 Q171 261 156 268 Q100 277 43 267 Q29 261 38 251 L43 239 L39 220 Q20 223 0 213Z',
    eyeX: 83, eyeY: 63, eyeGap: 27, forehead: 45, headWidth: 83, headX: 98,
    chestY: 170, chestX: 139, placketX: 92, shoulderY: 135, cuffY: 215,
  },
  male_wavy: {
    jersey: 'M0 187 Q6 154 24 136 L72 110 Q67 129 98 143 Q126 127 130 110 L176 134 Q195 153 200 189 V217 Q180 229 161 225 L157 243 Q171 262 155 268 Q102 277 43 268 Q29 263 38 251 L43 240 L39 225 Q20 226 0 217Z',
    eyeX: 81, eyeY: 63, eyeGap: 27, forehead: 45, headWidth: 86, headX: 97,
    chestY: 170, chestX: 138, placketX: 91, shoulderY: 139, cuffY: 218,
  },
  female_short: {
    jersey: 'M0 183 Q6 144 28 128 L74 110 Q69 130 100 144 Q129 130 128 110 L172 127 Q192 138 200 185 V200 Q177 212 152 216 L148 233 Q164 249 149 255 Q105 266 91 263 Q61 264 48 255 Q36 248 46 235 L49 224 L46 213 Q20 210 0 201Z',
    eyeX: 82, eyeY: 67, eyeGap: 30, forehead: 48, headWidth: 88, headX: 98,
    chestY: 170, chestX: 136, placketX: 93, shoulderY: 132, cuffY: 201,
  },
  female_bob: {
    jersey: 'M0 184 Q5 145 27 132 L74 112 Q72 133 103 145 Q130 129 128 111 L173 129 Q193 143 200 185 V201 Q180 213 156 218 L149 235 Q165 252 150 258 Q111 266 97 264 Q64 266 49 258 Q35 248 45 235 L47 223 L44 215 Q23 216 0 203Z',
    eyeX: 84, eyeY: 67, eyeGap: 30, forehead: 48, headWidth: 89, headX: 100,
    chestY: 171, chestX: 138, placketX: 94, shoulderY: 133, cuffY: 204,
  },
  female_long: {
    jersey: 'M0 207 Q7 164 25 147 L77 129 Q75 149 101 158 Q133 139 129 128 L164 139 Q192 151 200 206 V225 Q180 235 159 240 L157 253 Q168 269 153 273 Q108 283 94 278 Q66 278 49 269 Q36 262 47 246 L46 239 L45 240 Q20 234 0 225Z',
    hairExclusion: 'M54 135 L78 128 L77 151 L72 179 Q71 193 81 200 L77 204 Q58 205 54 190 Q50 174 54 151Z',
    eyeX: 84, eyeY: 73, eyeGap: 31, forehead: 54, headWidth: 91, headX: 100,
    chestY: 189, chestX: 139, placketX: 95, shoulderY: 150, cuffY: 224,
  },
  female_ponytail: {
    jersey: 'M0 196 Q9 151 25 138 L72 118 Q67 137 96 151 Q124 136 122 118 L164 137 Q185 149 200 198 V204 Q180 218 155 223 L148 240 Q163 257 148 268 Q107 279 92 274 Q64 275 48 267 Q33 259 44 246 L46 230 L46 220 Q23 222 0 209Z',
    eyeX: 80, eyeY: 77, eyeGap: 28, forehead: 57, headWidth: 87, headX: 95,
    chestY: 180, chestX: 133, placketX: 88, shoulderY: 143, cuffY: 208,
  },
};

/** White fabric → exact team colour, retaining the original ink and fold shadows. */
export function fabricColorMatrix(hex: string) {
  const channels = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return channels.map(channel => `${.2126 * channel} ${.7152 * channel} ${.0722 * channel} 0 0`).join(' ') + ' 0 0 0 1 0';
}

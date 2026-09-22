import { useId } from 'react';
import { getHighSchoolDataByName } from '../data/highSchools';
import { DEFAULT_APPEARANCE, getPortraitPresets, normalizeAppearance, type Appearance } from '../data/playerDevelopment';

export interface PlayerPortraitProps {
  appearance?: Appearance;
  number?: string | number;
  gender?: 'male' | 'female';
  schoolName?: string;
  size?: number | string;
  className?: string;
}

export function PlayerPortrait({ appearance = DEFAULT_APPEARANCE, number = 1, gender = 'male', schoolName = '', size = 150, className = '' }: PlayerPortraitProps) {
  const normalized = normalizeAppearance(appearance, gender);
  const preset = getPortraitPresets(gender).find(p => p.id === normalized.hairStyleId) ?? getPortraitPresets(gender)[0];
  const school = getHighSchoolDataByName(schoolName);
  const primary = school?.uniformPrimaryColor ?? school?.emblem?.primaryColor ?? '#1e3a8a';
  const secondary = primary;
  const maskId = useId().replace(/:/g, '');
  // Coordinates measured against each original 200 × 300 portrait canvas.
  const anchors: Record<string, {eyeY:number;eyeX:number;eyeWidth:number;neck:number;hem:number;shoulder:number}> = {
    male_spiky:{eyeY:75,eyeX:82,eyeWidth:30,neck:128,hem:300,shoulder:151},
    male_buzz:{eyeY:60,eyeX:85,eyeWidth:26,neck:105,hem:272,shoulder:126},
    male_parted:{eyeY:63,eyeX:84,eyeWidth:27,neck:109,hem:270,shoulder:131},
    male_wavy:{eyeY:63,eyeX:82,eyeWidth:26,neck:111,hem:269,shoulder:134},
    female_short:{eyeY:67,eyeX:83,eyeWidth:30,neck:111,hem:260,shoulder:130},
    female_bob:{eyeY:67,eyeX:84,eyeWidth:30,neck:112,hem:263,shoulder:131},
    female_long:{eyeY:73,eyeX:84,eyeWidth:32,neck:128,hem:279,shoulder:151},
    female_ponytail:{eyeY:77,eyeX:81,eyeWidth:27,neck:120,hem:275,shoulder:142},
  };
  const a=anchors[preset.id];
  const femaleJerseys: Record<string, string> = {
    female_short: 'M1 199 Q8 148 29 135 L73 117 Q70 134 102 144 Q128 130 127 115 L169 132 Q188 139 197 200 L165 217 L155 199 L148 229 Q151 251 149 258 Q103 267 53 259 L41 242 L43 210 L34 213 Z',
    female_bob: 'M1 200 Q7 145 28 135 L74 118 Q77 132 105 145 Q130 129 129 116 L170 133 Q189 140 199 200 L169 219 L158 205 L149 247 L151 260 Q109 268 59 259 L43 246 L43 211 L32 220 Z',
    female_long: 'M1 224 Q8 166 25 151 L76 136 Q78 148 103 158 Q131 143 130 131 L162 141 Q187 151 199 224 L168 238 L160 213 L151 251 L154 272 Q105 287 49 269 L41 250 L42 234 L32 240 Z',
    female_ponytail: 'M1 208 Q11 153 26 145 L71 125 Q72 137 96 151 Q122 138 121 124 L160 141 Q177 148 195 205 L158 222 L151 207 L146 251 L151 268 Q102 280 49 269 L39 259 L44 223 L36 222 Z',
  };
  const jersey=femaleJerseys[preset.id] ?? `M0 ${a.shoulder+35} Q8 ${a.shoulder} 30 ${a.shoulder-6} L74 ${a.neck} Q72 ${a.neck+19} 100 ${a.neck+31} Q128 ${a.neck+16} 126 ${a.neck} L172 ${a.shoulder-5} Q193 ${a.shoulder} 200 ${a.shoulder+35} L200 ${a.hem-52} L160 ${a.hem-44} L163 ${a.hem-5} Q105 ${a.hem+6} 39 ${a.hem-5} L41 ${a.hem-44} L0 ${a.hem-52} Z`;
  const shortSchoolName = (school?.name || schoolName || '고교').replace(/등학교$/, '').slice(0, 5);

  return (
    <div className={`player-portrait-preset ${className}`} role="img" aria-label={`${shortSchoolName} 선수 일러스트`} style={{ width: size, aspectRatio: '2 / 3' }}>
      <div className="portrait-stadium-bg" />
      <svg className="portrait-composite" viewBox="0 0 200 300" aria-hidden="true">
        <defs><mask id={maskId}><image href={preset.src} width="200" height="300" preserveAspectRatio="none"/><rect width="200" height="300" fill="black" opacity=".25"/>
          {preset.id==='female_long' && <path d="M0 0H200V134L166 143L151 126L153 60L50 40L35 150L57 185L84 201L79 210L52 204L39 188L32 151L0 157Z" fill="black"/>}
        </mask></defs>
        <image href={preset.src} width="200" height="300" preserveAspectRatio="none"/>
        <path d={jersey} fill={primary} opacity=".48" mask={`url(#${maskId})`} style={{mixBlendMode:'multiply'}}/>
        <text x="137" y={a.neck+65} textAnchor="middle" fill={secondary} stroke="#ffffff" strokeWidth=".9" paintOrder="stroke" fontSize="9" fontWeight="900" fontFamily="system-ui, sans-serif">{shortSchoolName}</text>
        <text x="140" y={a.neck+88} textAnchor="middle" fill={secondary} stroke="#ffffff" strokeWidth="1" paintOrder="stroke" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">{number}</text>
        {normalized.accessoryId==='goggles' && <g fill="#65b8d02b" stroke="#1e293b" strokeWidth="1.8">
          <rect x={a.eyeX-12} y={a.eyeY-6} width="24" height="13" rx="5"/><rect x={a.eyeX+a.eyeWidth-12} y={a.eyeY-6} width="24" height="13" rx="5"/>
          <path d={`M${a.eyeX+12} ${a.eyeY-1} Q${a.eyeX+a.eyeWidth/2} ${a.eyeY-5} ${a.eyeX+a.eyeWidth-12} ${a.eyeY-1}`} fill="none"/>
        </g>}
        {normalized.accessoryId==='headband' && <path d={`M${a.eyeX-19} ${a.eyeY-24} Q${a.eyeX+a.eyeWidth/2} ${a.eyeY-33} ${a.eyeX+a.eyeWidth+18} ${a.eyeY-24}`} fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round"/>}
      </svg>
    </div>
  );
}

export interface AppearanceEditorProps {
  value: Appearance;
  onChange: (a: Appearance) => void;
  number?: string | number;
  gender?: 'male' | 'female';
  schoolName?: string;
}

export function AppearanceEditor({ value, onChange, number = 1, gender = 'male', schoolName = '' }: AppearanceEditorProps) {
  const normalized = normalizeAppearance(value, gender);
  const presets = getPortraitPresets(gender);
  return (
    <div className="appearance-editor">
      <div className="portrait-preview-container">
        <PlayerPortrait appearance={normalized} number={number} gender={gender} schoolName={schoolName} size={200} />
      </div>
      <div className="appearance-fields">
        <strong>일러스트 프리셋</strong>
        <div className="portrait-preset-grid">
          {presets.map(preset => (
            <button key={preset.id} type="button" className={`portrait-preset-btn ${normalized.hairStyleId === preset.id ? 'active' : ''}`} onClick={() => onChange({ ...normalized, hairStyleId: preset.id })}>
              <img src={preset.src} alt="" /><span>{preset.label}</span>
            </button>
          ))}
        </div>
        <label>
          <span>액세서리</span>
          <select value={normalized.accessoryId ?? 'none'} onChange={e => onChange({ ...normalized, accessoryId: e.target.value === 'none' ? undefined : e.target.value })}>
            <option value="none">없음</option><option value="goggles">스포츠 고글</option><option value="headband">헤어밴드</option>
          </select>
        </label>
        <small>유니폼 색상과 가슴의 학교명은 선택한 학교에 맞춰 자동 적용됩니다.</small>
      </div>
    </div>
  );
}


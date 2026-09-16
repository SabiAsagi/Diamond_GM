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
    male_spiky:{eyeY:79,eyeX:82,eyeWidth:35,neck:140,hem:300,shoulder:158},
    male_buzz:{eyeY:65,eyeX:85,eyeWidth:29,neck:116,hem:284,shoulder:138},
    male_parted:{eyeY:68,eyeX:85,eyeWidth:28,neck:118,hem:280,shoulder:140},
    male_wavy:{eyeY:69,eyeX:86,eyeWidth:27,neck:119,hem:278,shoulder:142},
    female_short:{eyeY:74,eyeX:84,eyeWidth:31,neck:119,hem:278,shoulder:139},
    female_bob:{eyeY:74,eyeX:83,eyeWidth:33,neck:128,hem:276,shoulder:149},
    female_long:{eyeY:73,eyeX:82,eyeWidth:34,neck:128,hem:275,shoulder:151},
    female_ponytail:{eyeY:84,eyeX:78,eyeWidth:33,neck:132,hem:283,shoulder:151},
  };
  const a=anchors[preset.id];
  const jersey=`M0 ${a.shoulder+35} Q8 ${a.shoulder} 30 ${a.shoulder-6} L74 ${a.neck} Q72 ${a.neck+19} 100 ${a.neck+31} Q128 ${a.neck+16} 126 ${a.neck} L172 ${a.shoulder-5} Q193 ${a.shoulder} 200 ${a.shoulder+35} L200 ${a.hem-52} L160 ${a.hem-44} L163 ${a.hem-5} Q105 ${a.hem+6} 39 ${a.hem-5} L41 ${a.hem-44} L0 ${a.hem-52} Z`;
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


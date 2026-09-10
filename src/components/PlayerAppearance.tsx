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
  const secondary = school?.uniformSecondaryColor ?? school?.emblem?.secondaryColor ?? '#ffffff';
  const shortSchoolName = (school?.name || schoolName || '고교').replace(/등학교$/, '').slice(0, 5);

  return (
    <div className={`player-portrait-preset ${className}`} role="img" aria-label={`${shortSchoolName} 선수 일러스트`} style={{ width: size, aspectRatio: '2 / 3' }}>
      <div className="portrait-stadium-bg" />
      <img src={preset.src} alt="" draggable={false} />
      <svg className="portrait-uniform-overlay" viewBox="0 0 200 300" aria-hidden="true">
        <path d="M4 300 L8 205 Q28 175 58 168 L100 182 L142 168 Q172 175 192 205 L196 300 Z" fill={primary} opacity=".62" style={{ mixBlendMode: 'multiply' }} />
        <path d="M58 171 Q72 210 70 300 M142 171 Q128 210 130 300" fill="none" stroke={secondary} strokeWidth="3" opacity=".8" />
        <text x="100" y="230" textAnchor="middle" fill={secondary} stroke="rgba(0,0,0,.35)" strokeWidth="1" paintOrder="stroke" fontSize="15" fontWeight="900" fontFamily="system-ui, sans-serif">{shortSchoolName}</text>
        <text x="100" y="270" textAnchor="middle" fill={secondary} stroke="rgba(0,0,0,.35)" strokeWidth="1.5" paintOrder="stroke" fontSize="27" fontWeight="900" fontFamily="system-ui, sans-serif">{number}</text>
      </svg>
      {normalized.accessoryId === 'goggles' && <div className="portrait-goggles" aria-hidden="true"><span /><span /></div>}
      {normalized.accessoryId === 'headband' && <div className="portrait-headband" aria-hidden="true" />}
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

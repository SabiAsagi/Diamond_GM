import { getSchoolKit, getSchoolPortraitSrc, PORTRAIT_FITS } from '../data/schoolKits';
import {
  DEFAULT_APPEARANCE, getPortraitPresets, normalizeAppearance, type Appearance,
} from '../data/playerDevelopment';

export interface PlayerPortraitProps {
  appearance?: Appearance;
  number?: string | number;
  gender?: 'male' | 'female';
  schoolName?: string;
  size?: number | string;
  className?: string;
}

export function PlayerPortrait({
  appearance = DEFAULT_APPEARANCE, number = 1, gender = 'male', schoolName = '',
  size = 150, className = '',
}: PlayerPortraitProps) {
  const normalized = normalizeAppearance(appearance, gender);
  const preset = getPortraitPresets(gender).find(p => p.id === normalized.hairStyleId)
    ?? getPortraitPresets(gender)[0];
  const kit = getSchoolKit(schoolName);
  const fit = PORTRAIT_FITS[preset.id];
  return (
    <div className={`player-portrait-preset ${className}`} role="img"
      aria-label={`${kit.name} ${kit.label} 유니폼 선수 일러스트`}
      style={{ width: size, aspectRatio: '2 / 3' }}>
      <div className="portrait-stadium-bg" />
      <img src={getSchoolPortraitSrc(schoolName, preset.id)} alt="" aria-hidden="true" />
      <svg className="portrait-uniform-number" viewBox="0 0 200 300" aria-hidden="true">
        <text x={fit.chestX} y={fit.chestY + 26} textAnchor="middle" fontSize="17"
          fontFamily="system-ui, sans-serif" fontWeight="900" fill={kit.ink}
          stroke={kit.style === 'solid' ? kit.primary : kit.baseFabric}
          strokeWidth=".7" paintOrder="stroke">{String(number).slice(0, 2)}</text>
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

export function AppearanceEditor({
  value,
  onChange,
  number = 1,
  gender = 'male',
  schoolName = '',
}: AppearanceEditorProps) {
  const normalized = normalizeAppearance(value, gender);
  const presets = getPortraitPresets(gender);
  const kit = getSchoolKit(schoolName);
  return (
    <div className="appearance-editor">
      <div className="portrait-preview-container">
        <PlayerPortrait
          appearance={normalized}
          number={number}
          gender={gender}
          schoolName={schoolName}
          size={200}
        />
      </div>
      <div className="appearance-fields">
        <strong>선수 외형</strong>
        <div className="school-kit-label"><span style={{ background: kit.primary }} /><span style={{ background: kit.secondary }} /><b>{kit.name}</b> {kit.label}</div>
        <div className="portrait-preset-grid">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`portrait-preset-btn ${normalized.hairStyleId === preset.id ? 'active' : ''}`}
              aria-pressed={normalized.hairStyleId === preset.id}
              onClick={() => onChange({ ...normalized, hairStyleId: preset.id })}
            >
              <PlayerPortrait appearance={{ ...normalized, hairStyleId: preset.id }} number={number} gender={gender} schoolName={schoolName} size="100%" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
        <small>학교별 모자와 유니폼이 선수 원화에 맞춰 함께 바뀝니다.</small>
      </div>
    </div>
  );
}

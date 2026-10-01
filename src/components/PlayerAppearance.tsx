import { useId } from 'react';
import { getSchoolKit, PORTRAIT_FITS, fabricColorMatrix } from '../data/schoolKits';
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
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const left = fit.headX - fit.headWidth / 2;
  const right = fit.headX + fit.headWidth / 2;
  const cap = normalized.cap === 'team';
  const fabric = kit.style === 'solid' ? kit.primary : '#ffffff';
  const image = <image href={preset.src} width="200" height="300" preserveAspectRatio="none" />;

  return (
    <div className={`player-portrait-preset ${className}`} role="img"
      aria-label={`${kit.name} ${kit.label} 유니폼 선수 일러스트`}
      style={{ width: size, aspectRatio: '2 / 3' }}>
      <div className="portrait-stadium-bg" />
      <svg className="portrait-composite" viewBox="0 0 200 300" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-cap-shade`} x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".12" />
            <stop offset=".45" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#07101f" stopOpacity=".4" />
          </linearGradient>
          <filter id={`${id}-alpha`} colorInterpolationFilters="sRGB">
            <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
          </filter>
          <filter id={`${id}-team`} colorInterpolationFilters="sRGB">
            <feColorMatrix values={fabricColorMatrix(kit.primary)} />
          </filter>
          <filter id={`${id}-hair-mask`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="5" intercept="-2" />
              <feFuncG type="linear" slope="5" intercept="-2" />
              <feFuncB type="linear" slope="5" intercept="-2" />
            </feComponentTransfer>
          </filter>
          <clipPath id={`${id}-jersey-area`}><path d={fit.jersey} /></clipPath>
          {fit.hairExclusion && <clipPath id={`${id}-front-hair`}><path d={fit.hairExclusion} /></clipPath>}
          <mask id={`${id}-fabric`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="300">
            <g filter={`url(#${id}-alpha)`}>{image}</g>
            <path d={`M0 0H200V300H0Z ${fit.jersey}`} fill="black" fillRule="evenodd" />
            {fit.hairExclusion && (
              <g clipPath={`url(#${id}-jersey-area)`}>
                <g clipPath={`url(#${id}-front-hair)`} filter={`url(#${id}-hair-mask)`}>{image}</g>
              </g>
            )}
          </mask>
          <clipPath id={`${id}-hair`}>
            <path d={`M0 ${fit.forehead + 2} Q${fit.headX} ${fit.forehead - 7} 200 ${fit.forehead + 2} V300H0Z`} />
          </clipPath>
          <clipPath id={`${id}-sleeves`}>
            <path d={`M0 ${fit.shoulderY - 8} H52 L47 ${fit.cuffY + 10} H0Z M150 ${fit.shoulderY - 8} H200 V${fit.cuffY + 12} H155Z`} />
          </clipPath>
          <pattern id={`${id}-stripe`} width="9" height="300" patternUnits="userSpaceOnUse">
            <path d="M4 0V300" stroke={kit.primary} strokeWidth=".65" opacity=".55" />
          </pattern>
        </defs>
        <g clipPath={cap ? `url(#${id}-hair)` : undefined}>{image}</g>
        <g mask={`url(#${id}-fabric)`}>
          {kit.style === 'solid' && <g filter={`url(#${id}-team)`}>{image}</g>}
          {kit.style === 'raglan' && <g clipPath={`url(#${id}-sleeves)`} filter={`url(#${id}-team)`}>{image}</g>}
          {kit.style === 'pinstripe' && <rect width="200" height="300" fill={`url(#${id}-stripe)`} style={{ mixBlendMode: 'multiply' }} />}
          <g fill="none" stroke={kit.style === 'solid' ? kit.secondary : kit.primary} strokeWidth="1.5">
            <path d={`M${fit.placketX + 8} ${fit.chestY - 27} Q${fit.placketX - 1} ${fit.chestY - 21} ${fit.placketX} ${fit.chestY - 11} L${fit.placketX} ${fit.chestY + 66} Q${fit.placketX + 2} 270 ${fit.placketX} 300`} />
            <path d={`M0 ${fit.cuffY - 1} L35 ${fit.cuffY + 11} M165 ${fit.cuffY + 11} L200 ${fit.cuffY - 1}`} />
          </g>
          <g fill={kit.ink} stroke={fabric} strokeWidth=".6" paintOrder="stroke" fontFamily="system-ui, sans-serif" fontWeight="900" textAnchor="middle">
            <text x="100" y={fit.chestY} fontSize={Math.min(17, 84 / kit.name.length)} letterSpacing=".6">{kit.name}</text>
            <text x={fit.chestX} y={fit.chestY + 24} fontSize="20">{String(number).slice(0, 2)}</text>
          </g>
        </g>
        {cap && (
          <g stroke="#14202e" strokeWidth="1.8" strokeLinejoin="round">
            <path d={`M${left} ${fit.forehead} Q${left - 1} ${fit.forehead - 37} ${fit.headX} ${Math.max(2, fit.forehead - 44)} Q${right + 1} ${fit.forehead - 37} ${right} ${fit.forehead} Q${fit.headX} ${fit.forehead - 7} ${left} ${fit.forehead}Z`} fill={kit.primary} />
            <path d={`M${left} ${fit.forehead} Q${left - 1} ${fit.forehead - 37} ${fit.headX} ${Math.max(2, fit.forehead - 44)} Q${right + 1} ${fit.forehead - 37} ${right} ${fit.forehead} Q${fit.headX} ${fit.forehead - 7} ${left} ${fit.forehead}Z`} fill={`url(#${id}-cap-shade)`} stroke="none" />
            <path d={`M${fit.headX} ${Math.max(3, fit.forehead - 43)} Q${fit.headX - 8} ${fit.forehead - 24} ${fit.headX - 8} ${fit.forehead - 4} M${left + 12} ${fit.forehead - 27} Q${left + 20} ${fit.forehead - 20} ${left + 20} ${fit.forehead - 2} M${right - 12} ${fit.forehead - 27} Q${right - 20} ${fit.forehead - 20} ${right - 20} ${fit.forehead - 2}`} fill="none" stroke="#ffffff" strokeOpacity=".2" strokeWidth=".9" />
            <path d={`M${left - 2} ${fit.forehead} Q${fit.headX} ${fit.forehead - 10} ${right + 2} ${fit.forehead} L${right + 6} ${fit.forehead + 6} Q${fit.headX} ${fit.forehead + 13} ${left - 6} ${fit.forehead + 6}Z`} fill={kit.primary} />
            <path d={`M${left - 3} ${fit.forehead + 4} Q${fit.headX} ${fit.forehead + 10} ${right + 3} ${fit.forehead + 4}`} stroke={kit.secondary} strokeWidth="2" fill="none" />
            <text x={fit.headX} y={fit.forehead - 13} textAnchor="middle" fontSize="13" fontFamily="system-ui, sans-serif" fontWeight="900" fill={kit.capText} strokeWidth=".4" paintOrder="stroke">{kit.symbol}</text>
          </g>
        )}
        {normalized.accessoryId === 'goggles' && (
          <g stroke="#172635" strokeWidth="1.5" strokeLinejoin="round">
            <path d={`M${left + 5} ${fit.eyeY - 3} L${fit.eyeX - 11} ${fit.eyeY - 2} M${fit.eyeX + fit.eyeGap + 11} ${fit.eyeY - 2} L${right - 5} ${fit.eyeY - 3}`} fill="none" />
            {[fit.eyeX, fit.eyeX + fit.eyeGap].map(x => (
              <g key={x}>
                <path d={`M${x - 11} ${fit.eyeY - 5} Q${x} ${fit.eyeY - 8} ${x + 11} ${fit.eyeY - 5} L${x + 10} ${fit.eyeY + 5} Q${x} ${fit.eyeY + 9} ${x - 10} ${fit.eyeY + 5}Z`} fill="#80cce522" />
                <path d={`M${x - 7} ${fit.eyeY - 3} L${x - 3} ${fit.eyeY - 4}`} stroke="#ffffff" strokeWidth="1" />
              </g>
            ))}
            <path d={`M${fit.eyeX + 11} ${fit.eyeY - 2} Q${fit.eyeX + fit.eyeGap / 2} ${fit.eyeY - 5} ${fit.eyeX + fit.eyeGap - 11} ${fit.eyeY - 2}`} fill="none" />
          </g>
        )}
        {normalized.accessoryId === 'headband' && (
          <g stroke="#14202e" strokeWidth="1.1" strokeLinejoin="round">
            <path d={`M${left + 4} ${fit.forehead + 2} Q${fit.headX} ${fit.forehead - 6} ${right - 4} ${fit.forehead + 2} L${right - 5} ${fit.forehead + 8} Q${fit.headX} ${fit.forehead} ${left + 5} ${fit.forehead + 8}Z`} fill={kit.primary} />
            <path d={`M${left + 8} ${fit.forehead + 5} Q${fit.headX} ${fit.forehead - 2} ${right - 8} ${fit.forehead + 5}`} stroke={kit.secondary} strokeWidth="1.2" fill="none" />
          </g>
        )}
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
              onClick={() => onChange({ ...normalized, hairStyleId: preset.id })}
            >
              <PlayerPortrait appearance={{ ...normalized, hairStyleId: preset.id }} number={number} gender={gender} schoolName={schoolName} size="100%" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
        <label>
          <span>모자</span>
          <select value={normalized.cap} onChange={(e) => onChange({
            ...normalized, cap: e.target.value as 'team' | 'none',
            accessoryId: e.target.value === 'team' && normalized.accessoryId === 'headband' ? undefined : normalized.accessoryId,
          })}>
            <option value="team">학교 모자</option>
            <option value="none">벗기</option>
          </select>
        </label>
        <label>
          <span>액세서리</span>
          <select
            value={normalized.accessoryId ?? 'none'}
            onChange={(e) =>
              onChange({
                ...normalized,
                accessoryId: e.target.value === 'none' ? undefined : e.target.value,
                cap: e.target.value === 'headband' ? 'none' : normalized.cap,
              })
            }
          >
            <option value="none">없음</option>
            <option value="goggles">스포츠 고글</option>
            <option value="headband">헤어밴드</option>
          </select>
        </label>
        <small>학교를 바꾸면 모자·유니폼·배색이 함께 바뀝니다. 헤어밴드는 모자를 벗고 착용합니다.</small>
      </div>
    </div>
  );
}

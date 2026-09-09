import { useId } from 'react';
import { DEFAULT_APPEARANCE, type Appearance } from '../data/playerDevelopment';

export interface PlayerPortraitProps {
  appearance?: Appearance;
  number?: string | number;
  gender?: 'male' | 'female';
  size?: number | string;
  className?: string;
}

export function PlayerPortrait({
  appearance = DEFAULT_APPEARANCE,
  number = 1,
  gender = 'male',
  size = 150,
  className = '',
}: PlayerPortraitProps) {
  const id = useId().replace(/:/g, '_');
  const isFemale = gender === 'female';

  const skin = appearance.skin || '#e7b68e';
  const hair = appearance.hair || '#292524';
  const uniform = appearance.uniform || '#2563eb';
  const hairStyle = appearance.hairStyle || 'short';
  const accessory = appearance.accessory || 'none';

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      role="img"
      aria-label="선수 외형 일러스트"
      className={`player-portrait-svg ${className}`}
      style={{ display: 'block', borderRadius: '16px', overflow: 'hidden' }}
    >
      <defs>
        {/* 배경 그라데이션 */}
        <linearGradient id={`bg_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* 피부 그라데이션 */}
        <linearGradient id={`skin_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin} />
          <stop offset="100%" stopColor={skin} stopOpacity="0.88" />
        </linearGradient>

        {/* 목/턱 그림자 */}
        <linearGradient id={`neckShadow_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.02" />
        </linearGradient>

        {/* 유니폼 그라데이션 */}
        <linearGradient id={`uniform_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={uniform} />
          <stop offset="100%" stopColor={uniform} stopOpacity="0.82" />
        </linearGradient>

        {/* 머리카락 하이라이트 */}
        <linearGradient id={`hairLight_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>

        {/* 눈동자 그라데이션 */}
        <linearGradient id={`eye_${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* 치크 블러쉬 (볼터치) */}
        <radialGradient id={`blush_${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
        </radialGradient>
      </defs>

      {/* 1. 배경 카드 */}
      <rect width="200" height="240" rx="16" fill={`url(#bg_${id})`} />
      {/* 배경 스타디움 라이트 효과 */}
      <circle cx="100" cy="50" r="90" fill="#38bdf8" opacity="0.08" />

      {/* 2. 긴 머리 / 포니테일 뒷머리 레이어 (몸/얼굴 뒤) */}
      {hairStyle === 'long' && (
        <path
          d="M50 80 Q40 140 46 195 Q70 190 68 150 Q66 100 70 80 Z M150 80 Q160 140 154 195 Q130 190 132 150 Q134 100 130 80 Z"
          fill={hair}
        />
      )}
      {hairStyle === 'ponytail' && (
        <g>
          {/* 포니테일 묶음 (우측 뒤로 흩날리는 풍성한 결) */}
          <path
            d="M132 50 C165 30 185 55 180 95 C172 125 155 140 146 150 C150 125 158 95 142 75 Z"
            fill={hair}
          />
          {/* 포니테일 하이라이트 라인 */}
          <path
            d="M138 56 C160 42 174 65 170 95"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.22"
            fill="none"
          />
          {/* 머리끈 리본 / 밴드 */}
          <ellipse cx="134" cy="56" rx="6" ry="8" fill="#f43f5e" transform="rotate(-25 134 56)" />
        </g>
      )}

      {/* 3. 목 & 쇄골 */}
      {isFemale ? (
        // 여성 슬림한 목선
        <g>
          <path d="M88 116 L88 150 Q100 154 112 150 L112 116 Z" fill={`url(#skin_${id})`} />
          <rect x="88" y="116" width="24" height="14" fill={`url(#neckShadow_${id})`} />
        </g>
      ) : (
        // 남성 다부진 목선
        <g>
          <path d="M85 116 L85 152 Q100 156 115 152 L115 116 Z" fill={`url(#skin_${id})`} />
          <rect x="85" y="116" width="30" height="15" fill={`url(#neckShadow_${id})`} />
          {/* 목 근육 라인 음영 */}
          <path d="M93 126 Q95 144 91 150" stroke="#000000" strokeWidth="1" opacity="0.12" fill="none" />
          <path d="M107 126 Q105 144 109 150" stroke="#000000" strokeWidth="1" opacity="0.12" fill="none" />
        </g>
      )}

      {/* 4. 유니폼 (어깨 & 가슴) */}
      <g>
        {/* 메인 져지 바디 */}
        {isFemale ? (
          <path
            d="M32 240 L34 185 Q36 156 70 148 L100 158 L130 148 Q164 156 166 185 L168 240 Z"
            fill={`url(#uniform_${id})`}
          />
        ) : (
          <path
            d="M24 240 L26 180 Q28 150 68 144 L100 154 L132 144 Q172 150 174 180 L176 240 Z"
            fill={`url(#uniform_${id})`}
          />
        )}

        {/* 어깨 라글란 배색 파이핑 라인 */}
        <path
          d={isFemale ? 'M68 148 Q75 195 72 240' : 'M66 144 Q73 195 70 240'}
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity="0.35"
          fill="none"
        />
        <path
          d={isFemale ? 'M132 148 Q125 195 128 240' : 'M134 144 Q127 195 130 240'}
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity="0.35"
          fill="none"
        />

        {/* V넥 배색 옷깃 (카라) */}
        <path
          d={
            isFemale
              ? 'M84 149 L100 172 L116 149 Q108 154 100 154 Q92 154 84 149 Z'
              : 'M81 146 L100 174 L119 146 Q110 152 100 152 Q90 152 81 146 Z'
          }
          fill="#ffffff"
        />
        <path
          d={isFemale ? 'M88 149 L100 166 L112 149 Z' : 'M86 147 L100 168 L114 147 Z'}
          fill={`url(#skin_${id})`}
        />

        {/* 유니폼 등번호 (가슴 배번) */}
        <text
          x="100"
          y="218"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="30"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          {number}
        </text>
      </g>

      {/* 5. 귀 (얼굴 양옆) */}
      <g>
        {/* 좌측 귀 */}
        <ellipse cx={isFemale ? 54 : 52} cy="86" rx="6" ry="10" fill={`url(#skin_${id})`} />
        <path
          d={isFemale ? 'M54 82 Q56 86 54 90' : 'M52 81 Q54 86 52 91'}
          stroke="#000000"
          strokeWidth="1.2"
          opacity="0.2"
          fill="none"
        />
        {/* 우측 귀 */}
        <ellipse cx={isFemale ? 146 : 148} cy="86" rx="6" ry="10" fill={`url(#skin_${id})`} />
        <path
          d={isFemale ? 'M146 82 Q144 86 146 90' : 'M148 81 Q146 86 148 91'}
          stroke="#000000"
          strokeWidth="1.2"
          opacity="0.2"
          fill="none"
        />
      </g>

      {/* 6. 얼굴 윤곽 (턱선) */}
      {isFemale ? (
        // 여성: 유려하고 부드러운 달걀형 턱선
        <path
          d="M56 68 C56 106 72 136 100 136 C128 136 144 106 144 68 C144 42 125 32 100 32 C75 32 56 42 56 68 Z"
          fill={`url(#skin_${id})`}
        />
      ) : (
        // 남성: 굳건하고 탄탄한 턱선
        <path
          d="M54 68 C54 108 72 138 100 138 C128 138 146 108 146 68 C146 40 126 30 100 30 C74 30 54 40 54 68 Z"
          fill={`url(#skin_${id})`}
        />
      )}

      {/* 7. 볼터치 (Cheeks) */}
      <ellipse cx="70" cy="94" rx="10" ry="6" fill={`url(#blush_${id})`} />
      <ellipse cx="130" cy="94" rx="10" ry="6" fill={`url(#blush_${id})`} />

      {/* 8. 눈 (Anime Eyes) & 눈썹 */}
      <g>
        {/* 좌측 눈썹 */}
        <path
          d={isFemale ? 'M68 68 Q78 64 88 67' : 'M66 69 Q78 63 90 68'}
          stroke={hair}
          strokeWidth={isFemale ? '2.2' : '3'}
          strokeLinecap="round"
          fill="none"
        />
        {/* 우측 눈썹 */}
        <path
          d={isFemale ? 'M112 67 Q122 64 132 68' : 'M110 68 Q122 63 134 69'}
          stroke={hair}
          strokeWidth={isFemale ? '2.2' : '3'}
          strokeLinecap="round"
          fill="none"
        />

        {/* 좌측 눈 흰자위 */}
        <ellipse cx="78" cy="84" rx={isFemale ? 9 : 8.5} ry={isFemale ? 7 : 6} fill="#ffffff" />
        {/* 좌측 눈동자 (아이리스) */}
        <ellipse cx="78" cy="84" rx="6" ry={isFemale ? 6.5 : 5.8} fill={`url(#eye_${id})`} />
        {/* 좌측 동공 */}
        <circle cx="78" cy="84" r="2.8" fill="#0f172a" />
        {/* 좌측 캐치라이트 (하이라이트) */}
        <circle cx="76" cy="81.5" r="1.8" fill="#ffffff" />
        <circle cx="80" cy="86" r="0.9" fill="#ffffff" opacity="0.8" />
        {/* 좌측 아이라인 (상단 속눈썹) */}
        <path
          d={isFemale ? 'M67 83 Q78 75 89 83' : 'M68 83 Q78 77 88 83'}
          stroke="#1e293b"
          strokeWidth={isFemale ? '2.8' : '2.4'}
          strokeLinecap="round"
          fill="none"
        />
        {isFemale && (
          // 여성 윙 아이래시 디테일
          <path d="M88 81 Q91 79 92 78" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />
        )}

        {/* 우측 눈 흰자위 */}
        <ellipse cx="122" cy="84" rx={isFemale ? 9 : 8.5} ry={isFemale ? 7 : 6} fill="#ffffff" />
        {/* 우측 눈동자 (아이리스) */}
        <ellipse cx="122" cy="84" rx="6" ry={isFemale ? 6.5 : 5.8} fill={`url(#eye_${id})`} />
        {/* 우측 동공 */}
        <circle cx="122" cy="84" r="2.8" fill="#0f172a" />
        {/* 우측 캐치라이트 (하이라이트) */}
        <circle cx="120" cy="81.5" r="1.8" fill="#ffffff" />
        <circle cx="124" cy="86" r="0.9" fill="#ffffff" opacity="0.8" />
        {/* 우측 아이라인 (상단 속눈썹) */}
        <path
          d={isFemale ? 'M111 83 Q122 75 133 83' : 'M112 83 Q122 77 132 83'}
          stroke="#1e293b"
          strokeWidth={isFemale ? '2.8' : '2.4'}
          strokeLinecap="round"
          fill="none"
        />
        {isFemale && (
          // 여성 윙 아이래시 디테일
          <path d="M132 81 Q135 79 136 78" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </g>

      {/* 9. 코 & 입 */}
      <g>
        {/* 코 (미니멀 애니메 스타일) */}
        <path d="M100 96 L101 101" stroke="#a8715a" strokeWidth="1.4" strokeLinecap="round" />
        {/* 입 (자신감 있는 야구 소년/소녀 미소) */}
        <path
          d="M93 113 Q100 118 107 113"
          stroke="#9f4035"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* 입술 아래 부드러운 음영 */}
        <ellipse cx="100" cy="120" rx="3" ry="1.2" fill="#000000" opacity="0.1" />
      </g>

      {/* 10. 헤어스타일 5종 앞머리 및 볼륨 레이어 */}
      <g>
        {hairStyle === 'short' && (
          // 단정하고 스포티한 숏컷 (앞머리 결감 + 옆머리 구레나룻)
          <g>
            <path
              d="M50 78 C48 42 66 22 100 22 C134 22 152 42 150 78 L144 86 Q146 55 136 46 L130 68 L122 52 L112 72 L100 50 L88 74 L78 52 L68 70 Q56 55 56 86 Z"
              fill={hair}
            />
            {/* 앤젤링 하이라이트 */}
            <path
              d="M66 38 Q100 28 134 38"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.28"
              fill="none"
            />
          </g>
        )}

        {hairStyle === 'crop' && (
          // 스포티한 투블럭 / 스포츠컷
          <g>
            <path
              d="M54 70 C52 35 70 24 100 24 C130 24 148 35 146 70 L142 66 Q142 45 130 38 L124 50 L114 42 L104 52 L96 42 L86 50 L76 38 Q58 45 58 66 Z"
              fill={hair}
            />
            {/* 짧은 머리 결 하이라이트 */}
            <path
              d="M74 34 Q100 28 126 34"
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.25"
              fill="none"
            />
          </g>
        )}

        {hairStyle === 'long' && (
          // 풍성한 레이어드 롱헤어
          <g>
            <path
              d="M48 76 C46 32 68 20 100 20 C132 20 154 32 152 76 L148 105 Q146 64 136 52 L128 72 L118 56 L104 74 L92 56 L80 72 L72 52 Q54 64 52 105 Z"
              fill={hair}
            />
            {/* 앤젤링 하이라이트 */}
            <path
              d="M68 34 Q100 26 132 34"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.32"
              fill="none"
            />
          </g>
        )}

        {hairStyle === 'ponytail' && (
          // 하이 포니테일 앞머리 & 사이드 헤어
          <g>
            <path
              d="M52 76 C50 34 70 22 100 22 C130 22 150 34 148 76 L144 88 Q144 56 134 48 L126 66 L116 52 L102 68 L90 52 L80 66 L70 48 Q56 56 56 88 Z"
              fill={hair}
            />
            {/* 앤젤링 하이라이트 */}
            <path
              d="M70 34 Q100 27 130 34"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.3"
              fill="none"
            />
          </g>
        )}

        {hairStyle === 'bob' && (
          // 단정하고 경쾌한 보브 단발 (턱선을 감싸는 볼륨)
          <g>
            <path
              d="M50 78 C48 34 68 22 100 22 C132 22 152 34 150 78 C152 105 146 128 138 136 Q144 95 134 56 L126 70 L116 56 L102 70 L90 56 L78 70 L70 56 Q56 95 62 136 C54 128 48 105 50 78 Z"
              fill={hair}
            />
            {/* 앤젤링 하이라이트 */}
            <path
              d="M68 32 Q100 25 132 32"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.3"
              fill="none"
            />
          </g>
        )}
      </g>

      {/* 11. 액세서리 (안경 or 헤어밴드) */}
      {accessory === 'glasses' && (
        <g>
          {/* 좌측 안경 프레임 */}
          <rect
            x="66"
            y="74"
            width="25"
            height="20"
            rx="5"
            fill="rgba(255,255,255,0.12)"
            stroke="#1e293b"
            strokeWidth="2"
          />
          {/* 우측 안경 프레임 */}
          <rect
            x="109"
            y="74"
            width="25"
            height="20"
            rx="5"
            fill="rgba(255,255,255,0.12)"
            stroke="#1e293b"
            strokeWidth="2"
          />
          {/* 안경 브릿지 (코 연결부) */}
          <path d="M91 82 Q100 80 109 82" stroke="#1e293b" strokeWidth="2" fill="none" />
          {/* 안경다리 힌지 */}
          <line x1="60" y1="80" x2="66" y2="80" stroke="#1e293b" strokeWidth="2" />
          <line x1="134" y1="80" x2="140" y2="80" stroke="#1e293b" strokeWidth="2" />
          {/* 렌즈 유리 빛 반사선 */}
          <line x1="70" y1="78" x2="80" y2="88" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
          <line x1="113" y1="78" x2="123" y2="88" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
        </g>
      )}

      {accessory === 'headband' && (
        <g>
          {/* 헤어밴드 본체 (이마를 가로지르는 스포티한 밴드) */}
          <path
            d="M53 58 Q100 48 147 58 L146 68 Q100 58 54 68 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
          {/* 헤어밴드 포인트 스트라이프 */}
          <path d="M54 63 Q100 53 146 63" stroke="#ef4444" strokeWidth="2" fill="none" />
        </g>
      )}
    </svg>
  );
}

export interface AppearanceEditorProps {
  value: Appearance;
  onChange: (a: Appearance) => void;
  number?: string | number;
  gender?: 'male' | 'female';
}

export function AppearanceEditor({
  value,
  onChange,
  number = 1,
  gender = 'male',
}: AppearanceEditorProps) {
  return (
    <div className="appearance-editor" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div className="portrait-preview-container" style={{ flexShrink: 0 }}>
        <PlayerPortrait appearance={value} number={number} gender={gender} size={160} />
      </div>

      <div className="appearance-fields" style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {([
          ['skin', '피부색'],
          ['hair', '머리색'],
          ['uniform', '유니폼 색상'],
        ] as const).map(([key, label]) => (
          <label
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <span>{label}</span>
            <input
              type="color"
              value={value[key]}
              onChange={e => onChange({ ...value, [key]: e.target.value })}
              style={{
                width: '42px',
                height: '32px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: 'transparent',
              }}
            />
          </label>
        ))}

        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <span>헤어스타일</span>
          <select
            className="glass-input"
            style={{ width: '130px', padding: '4px 8px', fontSize: '0.85rem' }}
            value={value.hairStyle}
            onChange={e =>
              onChange({ ...value, hairStyle: e.target.value as Appearance['hairStyle'] })
            }
          >
            <option value="short">스포티 숏컷</option>
            <option value="crop">스포츠 투블럭</option>
            <option value="bob">보브 단발</option>
            <option value="ponytail">하이 포니테일</option>
            <option value="long">레이어드 롱</option>
          </select>
        </label>

        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <span>액세서리</span>
          <select
            className="glass-input"
            style={{ width: '130px', padding: '4px 8px', fontSize: '0.85rem' }}
            value={value.accessory}
            onChange={e =>
              onChange({ ...value, accessory: e.target.value as Appearance['accessory'] })
            }
          >
            <option value="none">없음</option>
            <option value="glasses">스포츠 안경</option>
            <option value="headband">헤어밴드</option>
          </select>
        </label>
      </div>
    </div>
  );
}

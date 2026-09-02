import React, { useState } from 'react';
import type { HighSchoolData } from '../types/highSchool';

interface SchoolEmblemProps {
  school: HighSchoolData;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

export const SchoolEmblem: React.FC<SchoolEmblemProps> = ({ 
  school, 
  size = 'md',
  showName = false 
}) => {
  const [imageError, setImageError] = useState(false);

  const emblem = school.emblem;
  const primary = emblem?.primaryColor || '#1e3a8a';
  const secondary = emblem?.secondaryColor || '#f59e0b';
  const textCol = emblem?.textColor || '#ffffff';
  const symbol = emblem?.symbolText || school.name.slice(0, 2);

  // 사이즈 설정
  const sizePx = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 84
  }[size];

  const fontSize = {
    sm: 11,
    md: 16,
    lg: 22,
    xl: 28
  }[size];

  // 실제 이미지 로고가 있고 에러가 안 났을 경우
  if ((school.logoUrl || emblem?.logoUrl) && !imageError) {
    return (
      <div className={`school-emblem emblem-${size}`} style={{ width: sizePx, height: sizePx }}>
        <img 
          src={school.logoUrl || emblem?.logoUrl} 
          alt={`${school.name} 로고`}
          onError={() => setImageError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {showName && <span className="emblem-school-name">{school.name}</span>}
      </div>
    );
  }

  // 고화질 야구단 엠블럼 SVG 렌더러
  return (
    <div 
      className={`school-emblem emblem-${size}`} 
      style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <svg 
        width={sizePx} 
        height={sizePx} 
        viewBox="0 0 100 100" 
        style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))' }}
      >
        <defs>
          <linearGradient id={`grad-${school.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
          <linearGradient id={`border-${school.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondary} />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {/* 외곽 방패/원형 프레임 */}
        <circle 
          cx="50" 
          cy="50" 
          r="46" 
          fill={`url(#grad-${school.id})`} 
          stroke={`url(#border-${school.id})`} 
          strokeWidth="4" 
        />
        
        {/* 야구공 실밥 스티치 라인 효과 */}
        <path 
          d="M 22 28 Q 38 50 22 72" 
          fill="none" 
          stroke="rgba(255,255,255,0.25)" 
          strokeWidth="2.5" 
          strokeDasharray="3 3"
        />
        <path 
          d="M 78 28 Q 62 50 78 72" 
          fill="none" 
          stroke="rgba(255,255,255,0.25)" 
          strokeWidth="2.5" 
          strokeDasharray="3 3"
        />

        {/* 엠블럼 중앙 심볼 텍스트 */}
        <text 
          x="50" 
          y="56" 
          fill={textCol} 
          fontSize={fontSize * (100 / sizePx)} 
          fontWeight="900" 
          fontFamily="'Outfit', sans-serif, 'Impact'" 
          textAnchor="middle" 
          dominantBaseline="middle"
          letterSpacing="-1"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
        >
          {symbol}
        </text>

        {/* 하단 리본 형태 테두리 액센트 */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="rgba(255,255,255,0.15)" 
          strokeWidth="1.5" 
        />
      </svg>

      {showName && <span className="emblem-school-name">{school.name}</span>}
    </div>
  );
};

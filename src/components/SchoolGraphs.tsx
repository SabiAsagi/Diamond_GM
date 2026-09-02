import React, { useState } from 'react';
import type { HighSchoolData } from '../types/highSchool';
import { TrendingUp, Users } from 'lucide-react';

interface RadarChartProps {
  data: { label: string; value: number; max?: number }[];
  color?: string;
  fillColor?: string;
}

/** 
 * 풀 와이드 초대형 5각 레이더 차트 (0~100, 50 전국 평균 가이드라인 강조)
 * 가로 전체 너비를 활용하여 시원하고 웅장하게 렌더링
 */
export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  color = '#3b82f6',
  fillColor = 'rgba(59, 130, 246, 0.25)'
}) => {
  const width = 440;
  const height = 310;
  const center = { x: width / 2, y: height / 2 + 4 };
  const radius = 110; // 와이드 대형 반경
  const total = data.length;

  const getPoint = (value: number, index: number, max = 100) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (Math.min(value, max) / max) * radius;
    const x = center.x + r * Math.cos(angle);
    const y = center.y + r * Math.sin(angle);
    return { x, y, angle };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPoints = data
    .map((item, i) => {
      const { x, y } = getPoint(item.value, i, item.max || 100);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ width: '100%', height: '310px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: '100%', maxHeight: '310px' }}
      >
        {/* 가이드 격자선 */}
        {gridLevels.map((lvl, idx) => {
          const points = data
            .map((_, i) => {
              const { x, y } = getPoint(lvl * 100, i, 100);
              return `${x},${y}`;
            })
            .join(' ');
          const isAverage = lvl === 0.5;
          return (
            <polygon
              key={idx}
              points={points}
              fill={idx === gridLevels.length - 1 ? 'rgba(255, 255, 255, 0.02)' : 'none'}
              stroke={isAverage ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)'}
              strokeWidth={isAverage ? '2' : '1'}
              strokeDasharray={isAverage ? '4 4' : undefined}
            />
          );
        })}

        {/* 중심 축선 */}
        {data.map((_, i) => {
          const { x, y } = getPoint(100, i, 100);
          return (
            <line
              key={i}
              x1={center.x}
              y1={center.y}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* 데이터 영역 폴리곤 */}
        <polygon
          points={polygonPoints}
          fill={fillColor}
          stroke={color}
          strokeWidth="3"
          style={{ filter: `drop-shadow(0 0 12px ${color}99)` }}
        />

        {/* 꼭짓점 포인트 & 큼직한 라벨 */}
        {data.map((item, i) => {
          const { x, y } = getPoint(item.value, i, item.max || 100);
          const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
          
          const labelDist = radius + 22;
          const labelX = center.x + labelDist * Math.cos(angle);
          const labelY = center.y + labelDist * Math.sin(angle);

          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          let xOffset = 0;
          let yOffset = 0;

          if (cos > 0.2) {
            anchor = 'start';
            xOffset = 6;
          } else if (cos < -0.2) {
            anchor = 'end';
            xOffset = -6;
          }

          if (sin < -0.6) {
            yOffset = -6;
          } else if (sin > 0.6) {
            yOffset = 8;
          }

          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5.5"
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={labelX + xOffset}
                y={labelY + yOffset}
                fill="#f8fafc"
                fontSize="14.5"
                fontWeight="800"
                fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
                textAnchor={anchor}
                dominantBaseline="middle"
                style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))',
                  userSelect: 'none'
                }}
              >
                {item.label} <tspan fill={color} fontWeight="900" fontSize="15">{item.value}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * 풀 와이드 초대형 4대 포지션별 주전 경쟁도 세로 막대 그래프 (0~10 스케일, 5.0 전국 평균선)
 */
export const CompetitionVerticalBarChart: React.FC<{
  competition: { pitcher: number; catcher: number; infielder: number; outfielder: number };
}> = ({ competition }) => {
  const items = [
    { label: '투수', sub: 'P', value: competition.pitcher },
    { label: '포수', sub: 'C', value: competition.catcher },
    { label: '내야수', sub: 'IF', value: competition.infielder },
    { label: '외야수', sub: 'OF', value: competition.outfielder },
  ];

  const getBarColor = (val: number) => {
    if (val >= 8.5) return { fill: 'linear-gradient(180deg, #ef4444, #b91c1c)', shadow: '#ef4444' };
    if (val >= 7.0) return { fill: 'linear-gradient(180deg, #f97316, #c2410c)', shadow: '#f97316' };
    if (val >= 5.0) return { fill: 'linear-gradient(180deg, #eab308, #a16207)', shadow: '#eab308' };
    if (val >= 3.5) return { fill: 'linear-gradient(180deg, #10b981, #047857)', shadow: '#10b981' };
    return { fill: 'linear-gradient(180deg, #06b6d4, #0e7490)', shadow: '#06b6d4' };
  };

  return (
    <div className="vertical-bar-container wide">
      <div className="vertical-bars-wrapper wide">
        {/* 가로 가이드 점선: 10, 7.5, 5.0, 2.5, 0 */}
        <div className="bar-grid-lines">
          <div className="grid-line line-10" />
          <div className="grid-line line-75" />
          <div className="grid-line line-50">
            <span className="grid-val avg">5.0</span>
          </div>
          <div className="grid-line line-25" />
          <div className="grid-line line-0" />
        </div>

        <div className="columns-grid wide">
          {items.map((item) => {
            const barInfo = getBarColor(item.value);
            const heightPercent = Math.min(Math.max((item.value / 10) * 100, 4), 100);

            return (
              <div key={item.label} className="column-item wide">
                {/* 상단 수치 배지 */}
                <div className="column-val-badge wide" style={{ borderColor: barInfo.shadow }}>
                  <span className="val-text wide">{item.value.toFixed(1)}</span>
                </div>

                {/* 세로 막대 트랙 */}
                <div className="column-track wide">
                  <div 
                    className="column-fill" 
                    style={{ 
                      height: `${heightPercent}%`,
                      background: barInfo.fill,
                      boxShadow: `0 0 12px ${barInfo.shadow}88`
                    }}
                  >
                    <div className="column-glow-top" />
                  </div>
                </div>

                {/* 하단 포지션 라벨 */}
                <div className="column-label-group wide">
                  <span className="pos-name wide">{item.label}</span>
                  <span className="pos-sub wide">({item.sub})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** 
 * 탭 전환형 풀와이드 대형 그래프 컴포넌트
 * 가로 100%를 전부 사용하여 글자 잘림을 0%로 만들고 압도적인 크기로 렌더링
 */
export const SchoolGraphs: React.FC<{ school: HighSchoolData }> = ({ school }) => {
  const [activeTab, setActiveTab] = useState<'env' | 'competition'>('env');

  const envStats = [
    { label: '명성', value: school.prestige },
    { label: '시설', value: school.facilities },
    { label: '코칭', value: school.coaching },
    { label: '노출도', value: school.scoutingExposure },
    { label: '안정성', value: school.stability }
  ];

  return (
    <div className="school-graphs-wrapper">
      {/* 상단 탭 스위처 */}
      <div className="graph-tab-switcher">
        <button
          className={`graph-tab-btn ${activeTab === 'env' ? 'active' : ''}`}
          onClick={() => setActiveTab('env')}
        >
          <TrendingUp size={16} />
          <span>학교 환경 & 육성 스탯 (5대 지표)</span>
        </button>
        <button
          className={`graph-tab-btn ${activeTab === 'competition' ? 'active' : ''}`}
          onClick={() => setActiveTab('competition')}
        >
          <Users size={16} />
          <span>포지션별 주전 경쟁도</span>
        </button>
      </div>

      {/* 대형 단일 풀와이드 카드 */}
      <div className="graph-card full-wide">
        <div className="graph-card-header">
          <span className="graph-card-title">
            {activeTab === 'env' ? '학교 환경 & 육성 스탯' : '포지션별 주전 경쟁도'}
          </span>
          <span className="graph-card-sub">
            {activeTab === 'env' ? '0 ~ 100 (전국 평균 50)' : '0 ~ 10 (전국 평균 5.0)'}
          </span>
        </div>

        <div className="graph-card-content wide">
          {activeTab === 'env' ? (
            <RadarChart
              data={envStats}
              color="#3b82f6"
              fillColor="rgba(59, 130, 246, 0.25)"
            />
          ) : (
            <CompetitionVerticalBarChart competition={school.competition} />
          )}
        </div>
      </div>
    </div>
  );
};

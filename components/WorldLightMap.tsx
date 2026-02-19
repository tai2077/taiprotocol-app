import React, { useMemo } from 'react';
import { AppLocale } from '../lib/format';
import { InviteMapResponse } from '../lib/api';

interface WorldLightMapProps {
  locale: AppLocale;
  data: InviteMapResponse | null;
  loading?: boolean;
}

function isLandDot(x: number, y: number, width: number, height: number): boolean {
  const nx = x / Math.max(width - 1, 1);
  const ny = y / Math.max(height - 1, 1);
  const shapeA = Math.sin(nx * 7.2) + Math.cos(ny * 8.4) + Math.sin((nx + ny) * 9.8) * 0.7;
  const shapeB = Math.cos(nx * 13.5 - ny * 6.1) * 0.45 + Math.sin(nx * 4.3 + ny * 11.2) * 0.3;
  return ny > 0.08 && ny < 0.92 && shapeA + shapeB > 0.7;
}

const WorldLightMap: React.FC<WorldLightMapProps> = ({ locale, data, loading }) => {
  const width = Math.max(20, data?.width || 58);
  const height = Math.max(10, data?.height || 26);
  const unit = 6;
  const pad = 10;
  const vbWidth = width * unit + pad * 2;
  const vbHeight = height * unit + pad * 2;

  const landPoints = useMemo(() => {
    const points: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (isLandDot(x, y, width, height)) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }, [height, width]);

  const litPoints = data?.litPoints || [];

  const statText = loading
    ? locale === 'zh'
      ? '地图加载中...'
      : 'Loading map...'
    : locale === 'zh'
      ? `已点亮 ${data?.totalLit || 0} 个节点 · 覆盖 ${data?.coverage || 0} 个区域`
      : `${data?.totalLit || 0} nodes lit · ${data?.coverage || 0} zones covered`;

  return (
    <div className="imperial-deep rounded-2xl p-3.5">
      <div className="relative rounded-xl overflow-hidden border border-[rgba(207,172,86,0.22)] bg-[#090909]">
        <svg viewBox={`0 0 ${vbWidth} ${vbHeight}`} className="w-full h-auto block" role="img" aria-label="invite world map">
          <defs>
            <linearGradient id="invite-map-fg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(246,223,154,0.85)" />
              <stop offset="60%" stopColor="rgba(207,172,86,0.9)" />
              <stop offset="100%" stopColor="rgba(200,16,46,0.88)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={vbWidth} height={vbHeight} fill="rgba(3,3,3,1)" />
          {landPoints.map((point) => (
            <circle
              key={`land-${point.x}-${point.y}`}
              cx={pad + point.x * unit + unit / 2}
              cy={pad + point.y * unit + unit / 2}
              r="1.15"
              fill="rgba(255,255,255,0.12)"
            />
          ))}
          {litPoints.map((point) => {
            const color = point.recent
              ? '#ff4d6a'
              : point.level === 2
                ? 'rgba(207,172,86,0.95)'
                : 'url(#invite-map-fg)';
            return (
              <g key={`lit-${point.address}-${point.x}-${point.y}`}>
                <circle
                  cx={pad + point.x * unit + unit / 2}
                  cy={pad + point.y * unit + unit / 2}
                  r="2.55"
                  fill={color}
                  opacity={point.activated ? 1 : 0.58}
                />
                <circle
                  cx={pad + point.x * unit + unit / 2}
                  cy={pad + point.y * unit + unit / 2}
                  r="4.1"
                  fill="none"
                  stroke={point.recent ? 'rgba(225,28,68,0.6)' : 'rgba(207,172,86,0.42)'}
                  strokeWidth="0.9"
                  opacity="0.72"
                />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[10px] font-bold text-white/60 mt-2">{statText}</p>
    </div>
  );
};

export default WorldLightMap;

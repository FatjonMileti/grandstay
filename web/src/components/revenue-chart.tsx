import { formatShortDate, money } from "@/lib/format";
import type { RevenuePoint } from "@/lib/types";

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const tension = 0.18;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const width = 660;
  const height = 240;
  const padTop = 16;
  const padBottom = 30;
  const padLeft = 46;
  const padRight = 30;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const max = Math.max(...data.map((point) => point.revenue), 0);
  const ceiling = max <= 0 ? 1000 : Math.ceil(max / 1000) * 1000;

  const points = data.map((point, index) => ({
    ...point,
    x:
      data.length === 1
        ? padLeft + innerWidth / 2
        : padLeft + (index * innerWidth) / (data.length - 1),
    y: padTop + innerHeight - (point.revenue / ceiling) * innerHeight,
  }));

  const line = smoothPath(points);
  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x.toFixed(2)} ${padTop + innerHeight} L ${points[0].x.toFixed(2)} ${padTop + innerHeight} Z`
      : "";

  const gridLines = [0, 1 / 3, 2 / 3, 1];

  return (
    <div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Revenue over the last 14 days">
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ae8950" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ae8950" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((fraction) => {
        const y = padTop + innerHeight * fraction;
        const label = Math.round((ceiling * (1 - fraction)) / 1000);
        return (
          <g key={fraction}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={y}
              y2={y}
              stroke="#131a16"
              strokeOpacity={fraction === 1 ? 0.12 : 0.06}
              strokeDasharray={fraction === 1 ? "0" : "3 5"}
            />
            <text
              x={padLeft - 10}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#131a16"
              fillOpacity="0.35"
              className="hidden sm:block"
            >
              {label === 0 ? "$0" : `$${label}k`}
            </text>
          </g>
        );
      })}

      {area && <path d={area} fill="url(#revenueFill)" />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke="#ae8950"
          strokeWidth="2.25"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {points.map((point, index) => {
        const isLast = index === points.length - 1;
        const showLabel =
          index === 0 || isLast || (index % 3 === 0 && points.length - 1 - index >= 2);
        return (
          <g key={point.date}>
            {showLabel && (
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="9.5"
                fill="#131a16"
                fillOpacity="0.35"
                className="hidden sm:block"
              >
                {formatShortDate(point.date)}
              </text>
            )}
            <circle cx={point.x} cy={point.y} r="9" fill="transparent">
              <title>{`${formatShortDate(point.date)} · ${money(point.revenue)}`}</title>
            </circle>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 4 : 2.5}
              fill={index === points.length - 1 ? "#15231c" : "#ae8950"}
              stroke="#f7f4ed"
              strokeWidth={index === points.length - 1 ? 2 : 1}
            />
          </g>
        );
      })}
    </svg>
    {points.length > 0 && (
      <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink/35 sm:hidden">
        <span>{formatShortDate(points[0].date)}</span>
        <span>{formatShortDate(points[points.length - 1].date)}</span>
      </div>
    )}
    </div>
  );
}

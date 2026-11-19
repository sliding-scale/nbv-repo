import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { formatClock } from '../../utils/telemetry'

const HEIGHT = 200
const PAD = { top: 12, right: 12, bottom: 24, left: 36 }

// Measure the container so text stays crisp (no viewBox scaling).
function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

const niceMax = (value) => Math.max(60, Math.ceil(value / 20) * 20)

/**
 * Speed over time for one trip, with the speed limit as a dashed reference line.
 * The line turns red wherever it's above the limit. Hover for a crosshair + tooltip.
 */
export default function SpeedChart({ track, limit }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const clipId = useId()

  const geometry = useMemo(() => {
    if (track.length < 2 || width === 0) return null
    const t0 = track[0].t
    const t1 = track.at(-1).t
    const yMax = niceMax(Math.max(limit + 10, ...track.map((p) => p.speed)))
    const innerW = width - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const x = (t) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * innerW
    const y = (s) => PAD.top + innerH - (s / yMax) * innerH
    const path = track.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.speed).toFixed(1)}`).join('')
    const yTicks = Array.from({ length: yMax / 20 + 1 }, (_, i) => i * 20)
    const xTicks = Array.from({ length: 4 }, (_, i) => t0 + ((t1 - t0) * i) / 3)
    return { x, y, path, yTicks, xTicks, innerW, innerH }
  }, [track, width, limit])

  const onPointerMove = (e) => {
    if (!geometry) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    // Nearest sample to the pointer.
    let best = 0
    for (let i = 1; i < track.length; i++) {
      if (Math.abs(geometry.x(track[i].t) - px) < Math.abs(geometry.x(track[best].t) - px)) best = i
    }
    setHover(best)
  }

  const point = hover != null ? track[hover] : null

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {geometry && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Speed over time. Limit ${limit} km/h.`}
          className="block touch-none"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {/* Region above the limit: the same line drawn red inside it. */}
            <clipPath id={clipId}>
              <rect x={PAD.left} y={0} width={geometry.innerW} height={geometry.y(limit)} />
            </clipPath>
          </defs>

          {/* Recessive grid + y labels */}
          {geometry.yTicks.map((s) => (
            <g key={s}>
              <line x1={PAD.left} x2={width - PAD.right} y1={geometry.y(s)} y2={geometry.y(s)} stroke="#eef1f5" />
              <text x={PAD.left - 8} y={geometry.y(s)} dy="0.32em" textAnchor="end" fontSize="11" fill="#94a3b8">
                {s}
              </text>
            </g>
          ))}
          {geometry.xTicks.map((t, i) => (
            <text
              key={t}
              x={geometry.x(t)}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? 'start' : i === geometry.xTicks.length - 1 ? 'end' : 'middle'}
              fontSize="11"
              fill="#94a3b8"
            >
              {formatClock(t)}
            </text>
          ))}

          {/* Speed limit reference, labelled directly */}
          <line x1={PAD.left} x2={width - PAD.right} y1={geometry.y(limit)} y2={geometry.y(limit)} stroke="#64748b" strokeDasharray="4 4" />
          <text x={width - PAD.right} y={geometry.y(limit) - 5} textAnchor="end" fontSize="11" fill="#475569">
            Limit {limit} km/h
          </text>

          <path d={geometry.path} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={geometry.path} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${clipId})`} />

          {point && (
            <g pointerEvents="none">
              <line x1={geometry.x(point.t)} x2={geometry.x(point.t)} y1={PAD.top} y2={PAD.top + geometry.innerH} stroke="#cbd5e1" />
              <circle
                cx={geometry.x(point.t)}
                cy={geometry.y(point.speed)}
                r="4.5"
                fill={point.speed > limit ? '#dc2626' : '#2563eb'}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      )}

      {point && geometry && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(geometry.x(point.t) - 60, 0), width - 120),
          }}
        >
          <div className="text-slate-500">{formatClock(point.t)}</div>
          <div className="font-semibold text-slate-900 tabular-nums">{point.speed} km/h</div>
          {point.speed > limit && <div className="font-medium text-red-600">▲ {point.speed - limit} over limit</div>}
        </div>
      )}
    </div>
  )
}

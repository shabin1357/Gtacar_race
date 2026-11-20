import { HudSnapshot } from '../game/types';

interface TachometerProps {
  hud: HudSnapshot;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function Tachometer({ hud }: TachometerProps) {
  const size = 156;
  const cx = size / 2;
  const cy = size / 2;

  // Sweep from 215 deg (bottom-left) to 485 deg (bottom-right) = 270 deg sweep
  const startDeg = 220;
  const sweepDeg = 260;
  const clampedRpm = Math.max(0, Math.min(1, hud.rpmRatio));
  const rpmEndDeg = startDeg + sweepDeg * clampedRpm;
  const redlineStartDeg = startDeg + sweepDeg * 0.78;

  // Bottom-right / bottom-left micro arcs for Nitro & Chassis Health
  const nitroRatio = Math.max(0, Math.min(1, hud.nitro / 100));
  const healthRatio = Math.max(0, Math.min(1, hud.health / 100));

  const nitroStart = 135;
  const nitroSweep = 38;
  const healthStart = 187;
  const healthSweep = 38;

  const healthColor =
    healthRatio > 0.55 ? '#10b981' : healthRatio > 0.28 ? '#f59e0b' : '#ef4444';

  const gearLabel = hud.gear === 0 ? 'R' : String(hud.gear);
  const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="relative select-none flex flex-col items-end gap-1">
      <div className="relative w-[156px] h-[156px] rounded-full bg-[#070a12]/90 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.68)]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          {/* Base RPM track */}
          <path
            d={describeArc(cx, cy, 62, startDeg, startDeg + sweepDeg)}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Redline zone indicator */}
          <path
            d={describeArc(cx, cy, 62, redlineStartDeg, startDeg + sweepDeg)}
            fill="none"
            stroke="rgba(244,63,94,0.38)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Live RPM sweep */}
          {clampedRpm > 0.01 && (
            <path
              d={describeArc(cx, cy, 62, startDeg, rpmEndDeg)}
              fill="none"
              stroke={
                hud.isBoosting
                  ? '#38bdf8'
                  : clampedRpm > 0.78
                    ? '#f43f5e'
                    : '#f8fafc'
              }
              strokeWidth="7"
              strokeLinecap="round"
            />
          )}

          {/* Tick marks 0..8 */}
          {ticks.map((t) => {
            const frac = t / 8;
            const ang = startDeg + frac * sweepDeg;
            const p1 = polarToCartesian(cx, cy, 52, ang);
            const p2 = polarToCartesian(cx, cy, 57, ang);
            const lbl = polarToCartesian(cx, cy, 43, ang);
            const isRed = t >= 7;
            return (
              <g key={t}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isRed ? '#f43f5e' : 'rgba(226,232,240,0.65)'}
                  strokeWidth={t % 2 === 0 ? '1.8' : '1.1'}
                />
                {t % 2 === 0 && (
                  <text
                    x={lbl.x}
                    y={lbl.y}
                    fill={isRed ? '#fb7185' : 'rgba(148,163,184,0.85)'}
                    fontSize="8.5"
                    fontFamily="Chakra Petch, sans-serif"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {t}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nitro bottom-right micro-arc */}
          <path
            d={describeArc(cx, cy, 71, nitroStart, nitroStart + nitroSweep)}
            fill="none"
            stroke="rgba(56,189,248,0.18)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {nitroRatio > 0.02 && (
            <path
              d={describeArc(cx, cy, 71, nitroStart, nitroStart + nitroSweep * nitroRatio)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* Chassis health bottom-left micro-arc */}
          <path
            d={describeArc(cx, cy, 71, healthStart, healthStart + healthSweep)}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {healthRatio > 0.02 && (
            <path
              d={describeArc(cx, cy, 71, healthStart, healthStart + healthSweep * healthRatio)}
              fill="none"
              stroke={healthColor}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center Digital Speed & Gear */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5">
          <div className="font-hud text-[34px] leading-none font-bold tracking-tight text-white">
            {hud.speedKph}
          </div>
          <div className="mt-0.5 text-[10px] font-hud uppercase tracking-[0.2em] text-slate-400">
            KM/H
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-hud">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold leading-none">
              {gearLabel}
            </span>
            {hud.isBoosting ? (
              <span className="text-sky-400 font-semibold tracking-wider">NOS</span>
            ) : hud.isDrifting ? (
              <span className="text-amber-400 font-semibold tracking-wider">DRIFT</span>
            ) : (
              <span className="text-slate-400 font-medium">{hud.speedMph} MPH</span>
            )}
          </div>
        </div>
      </div>

      {/* Unboxed vehicle telemetry caption */}
      <div className="flex items-center gap-2 pr-1 text-[11px] font-hud uppercase tracking-wider text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        <span className="text-sky-400">NOS {Math.round(hud.nitro)}%</span>
        <span className="text-slate-500">·</span>
        <span style={{ color: healthColor }}>HP {Math.round(hud.health)}%</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-300">{hud.vehicleName}</span>
      </div>
    </div>
  );
}

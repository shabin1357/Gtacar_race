import React from 'react';
import { Compass, MapPin, Navigation, X } from 'lucide-react';
import { HudSnapshot } from '../game/types';
import {
  PLAYABLE_MAX_X,
  PLAYABLE_MAX_Z,
  PLAYABLE_MIN_X,
  PLAYABLE_MIN_Z,
  ROAD_COORDS,
  WORLD_DISTRICTS,
} from '../game/world';

interface InteractiveMapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSetGps: (x: number, z: number, label: string) => void;
  onClearGps: () => void;
}

export function InteractiveMapModal({
  hud,
  onClose,
  onSetGps,
  onClearGps,
}: InteractiveMapModalProps) {
  const minX = -270;
  const maxX = 370;
  const minZ = -260;
  const maxZ = 260;
  const worldW = maxX - minX;
  const worldH = maxZ - minZ;

  const toPctX = (wx: number) => ((wx - minX) / worldW) * 100;
  const toPctY = (wz: number) => ((wz - minZ) / worldH) * 100;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const wx = Math.max(PLAYABLE_MIN_X, Math.min(PLAYABLE_MAX_X, minX + fx * worldW));
    const wz = Math.max(PLAYABLE_MIN_Z, Math.min(PLAYABLE_MAX_Z, minZ + fy * worldH));

    // Snap label to nearest district
    let nearest = WORLD_DISTRICTS[0];
    let bestD = Infinity;
    for (const d of WORLD_DISTRICTS) {
      const dist = Math.hypot(wx - d.x, wz - d.z);
      if (dist < bestD) {
        bestD = dist;
        nearest = d;
      }
    }
    onSetGps(Math.round(wx), Math.round(wz), `${nearest.name} Pin`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-[#090d16] border border-white/15 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-white tracking-tight">
                Coastal City GPS Map
              </h2>
              <p className="text-xs text-slate-400">
                Click anywhere on the map to drop a 3D holographic GPS route
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hud.gps && (
              <button
                type="button"
                onClick={onClearGps}
                className="px-3 py-1.5 rounded-lg text-xs font-hud uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
              >
                Clear GPS
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close map"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: Interactive Canvas + Quick District List */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] flex-1 min-h-0">
          <div className="p-4 flex items-center justify-center bg-[#060910]">
            <div
              onClick={handleMapClick}
              className="relative w-full aspect-[16/11] max-h-[62vh] rounded-lg overflow-hidden border border-white/10 bg-[#081524] cursor-crosshair select-none"
            >
              {/* City Landmass */}
              <div
                className="absolute bg-[#141c2b] border border-white/5"
                style={{
                  left: `${toPctX(-250)}%`,
                  top: `${toPctY(-250)}%`,
                  width: `${(475 / worldW) * 100}%`,
                  height: `${(500 / worldH) * 100}%`,
                }}
              />

              {/* Beachfront Sand */}
              <div
                className="absolute bg-[#3a3324]"
                style={{
                  left: `${toPctX(225)}%`,
                  top: `${toPctY(-250)}%`,
                  width: `${(85 / worldW) * 100}%`,
                  height: `${(500 / worldH) * 100}%`,
                }}
              />

              {/* Airport Runway */}
              <div
                className="absolute bg-[#253042] border border-slate-500/40"
                style={{
                  left: `${toPctX(55)}%`,
                  top: `${toPctY(190)}%`,
                  width: `${(115 / worldW) * 100}%`,
                  height: `${(36 / worldH) * 100}%`,
                }}
              />

              {/* Road Grid Lines */}
              {ROAD_COORDS.map((coord) => (
                <React.Fragment key={coord}>
                  <div
                    className="absolute bg-slate-500/75"
                    style={{
                      left: `${toPctX(coord)}%`,
                      top: `${toPctY(-245)}%`,
                      width: '3px',
                      height: `${(490 / worldH) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  <div
                    className="absolute bg-slate-500/75"
                    style={{
                      left: `${toPctX(-245)}%`,
                      top: `${toPctY(coord)}%`,
                      width: `${(470 / worldW) * 100}%`,
                      height: '3px',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </React.Fragment>
              ))}

              {/* Bay Bridge */}
              <div
                className="absolute bg-sky-400/60"
                style={{
                  left: `${toPctX(200)}%`,
                  top: `${toPctY(0)}%`,
                  width: `${(155 / worldW) * 100}%`,
                  height: '5px',
                  transform: 'translateY(-50%)',
                }}
              />

              {/* SVG GPS Line */}
              {hud.gps && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={`${toPctX(hud.playerX)}%`}
                    y1={`${toPctY(hud.playerZ)}%`}
                    x2={`${toPctX(hud.gps.x)}%`}
                    y2={`${toPctY(hud.gps.z)}%`}
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                </svg>
              )}

              {/* District Labels */}
              {WORLD_DISTRICTS.map((d) => (
                <div
                  key={d.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-hud uppercase tracking-wider text-slate-200/90 bg-[#090d16]/75 px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap"
                  style={{ left: `${toPctX(d.x)}%`, top: `${toPctY(d.z)}%` }}
                >
                  {d.name}
                </div>
              ))}

              {/* Repair Stations */}
              {hud.repairs.map((rep, idx) => (
                <div
                  key={idx}
                  title="Auto Repair Arch"
                  className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 border border-slate-950 pointer-events-none"
                  style={{ left: `${toPctX(rep.x)}%`, top: `${toPctY(rep.z)}%` }}
                />
              ))}

              {/* Police & Racers */}
              {hud.units.map((u, idx) => (
                <div
                  key={idx}
                  className={`absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-950 pointer-events-none ${
                    u.type === 'racer'
                      ? 'bg-amber-400'
                      : u.disabled
                        ? 'bg-slate-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ left: `${toPctX(u.x)}%`, top: `${toPctY(u.z)}%` }}
                />
              ))}

              {/* Active GPS Pin */}
              {hud.gps && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center"
                  style={{ left: `${toPctX(hud.gps.x)}%`, top: `${toPctY(hud.gps.z)}%` }}
                >
                  <MapPin className="w-5 h-5 text-emerald-400 fill-emerald-400/30 drop-shadow" />
                </div>
              )}

              {/* Player Arrow */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${toPctX(hud.playerX)}%`,
                  top: `${toPctY(hud.playerZ)}%`,
                  transform: `translate(-50%, -50%) rotate(${((-hud.playerRotY + Math.PI) * 180) / Math.PI}deg)`,
                }}
              >
                <Navigation className="w-5 h-5 text-white fill-sky-400 drop-shadow" />
              </div>
            </div>
          </div>

          {/* Quick-Set District Waypoints */}
          <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-4 overflow-y-auto flex flex-col gap-2">
            <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-1">
              Quick GPS Destinations
            </div>
            {WORLD_DISTRICTS.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => onSetGps(d.x, d.z, d.name)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-200 bg-white/[0.04] hover:bg-sky-500/20 hover:text-white border border-white/5 hover:border-sky-400/40 transition-colors cursor-pointer"
              >
                <span>{d.name}</span>
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              </button>
            ))}

            <div className="mt-auto pt-3 border-t border-white/10 flex flex-wrap gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Player
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Police
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Repair
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

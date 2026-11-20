import React, { useState } from 'react';
import { Compass, MapPin, Navigation, ShieldAlert, X, Zap } from 'lucide-react';
import { HudSnapshot } from '../game/types';
import {
  DistrictMarker,
  PLAYABLE_MAX_X,
  PLAYABLE_MAX_Z,
  PLAYABLE_MIN_X,
  PLAYABLE_MIN_Z,
  PLAYER_SPAWNS,
  ROAD_COORDS,
  WORLD_DISTRICTS,
} from '../game/world';

interface InteractiveMapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSetGps: (x: number, z: number, label: string) => void;
  onClearGps: () => void;
  onFastTravel: (x: number, z: number, label: string, rotY?: number) => void;
}

export function InteractiveMapModal({
  hud,
  onClose,
  onSetGps,
  onClearGps,
  onFastTravel,
}: InteractiveMapModalProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictMarker | null>(null);

  const minX = -290;
  const maxX = 390;
  const minZ = -290;
  const maxZ = 285;
  const worldW = maxX - minX;
  const worldH = maxZ - minZ;

  // Map world coords to SVG viewBox (0..1000 x 0..845)
  const vbW = 1000;
  const vbH = 845;
  const toSvgX = (wx: number) => ((wx - minX) / worldW) * vbW;
  const toSvgY = (wz: number) => ((wz - minZ) / worldH) * vbH;
  const toPctX = (wx: number) => ((wx - minX) / worldW) * 100;
  const toPctY = (wz: number) => ((wz - minZ) / worldH) * 100;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const wx = Math.max(PLAYABLE_MIN_X, Math.min(PLAYABLE_MAX_X, minX + fx * worldW));
    const wz = Math.max(PLAYABLE_MIN_Z, Math.min(PLAYABLE_MAX_Z, minZ + fy * worldH));

    let nearest = WORLD_DISTRICTS[0];
    let bestD = Infinity;
    for (const d of WORLD_DISTRICTS) {
      const dist = Math.hypot(wx - d.x, wz - d.z);
      if (dist < bestD) {
        bestD = dist;
        nearest = d;
      }
    }
    onSetGps(Math.round(wx), Math.round(wz), `${nearest.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-5">
      <div className="w-full max-w-6xl bg-[#090d16] border border-white/15 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-display text-base font-bold text-white tracking-tight">
                SOLARA STATE & REDROCK COUNTY — TOPOGRAPHICAL ATLAS
              </h2>
              <p className="text-xs text-slate-400">
                Click anywhere on the island to set a 3D holographic GPS route · Or fast-travel to any district
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hud.gps && (
              <button
                type="button"
                onClick={onClearGps}
                className="px-3 py-1.5 rounded-lg text-xs font-hud uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 cursor-pointer"
              >
                Clear GPS
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close atlas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Atlas + District Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] flex-1 min-h-0">
          {/* Illustrated Cartographic Island Map */}
          <div className="p-3 sm:p-4 flex items-center justify-center bg-[#06131c] overflow-hidden">
            <div
              onClick={handleMapClick}
              className="relative w-full aspect-[1000/845] max-h-[75vh] rounded-lg overflow-hidden border-2 border-[#d8cfb8]/40 shadow-[0_12px_40px_rgba(0,0,0,0.65)] cursor-crosshair select-none bg-[#55a7b9]"
            >
              <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                className="w-full h-full block"
                preserveAspectRatio="none"
              >
                <defs>
                  <radialGradient id="oceanGrad" cx="50%" cy="48%" r="65%">
                    <stop offset="0%" stopColor="#6dc3d1" />
                    <stop offset="70%" stopColor="#4c9fb3" />
                    <stop offset="100%" stopColor="#357d92" />
                  </radialGradient>
                  <pattern
                    id="restrictedHatch"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(220,38,38,0.58)" strokeWidth="3.5" />
                  </pattern>
                  <pattern id="gridLines" width="125" height="105" patternUnits="userSpaceOnUse">
                    <path
                      d="M 125 0 L 0 0 0 105"
                      fill="none"
                      stroke="rgba(15,23,42,0.12)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                {/* Turquoise Coastal Ocean + Subtle Atlas Grid */}
                <rect width={vbW} height={vbH} fill="url(#oceanGrad)" />
                <rect width={vbW} height={vbH} fill="url(#gridLines)" />

                {/* Shallow Coastal Bathymetry Halo */}
                <path
                  d="M 148 215 C 195 102, 375 40, 565 48 C 725 56, 845 148, 868 282 C 895 430, 885 570, 864 685 C 835 765, 745 796, 610 804 C 460 812, 322 798, 232 728 C 145 660, 82 542, 72 415 C 64 318, 98 262, 148 215 Z"
                  fill="#8cd8df"
                  opacity="0.46"
                />

                {/* Organic Solara State Island Landmass (Lush Verdant Base) */}
                <path
                  d="M 162 225 C 212 118, 382 62, 558 68 C 710 74, 818 158, 842 292 C 865 426, 858 556, 838 668 C 815 742, 735 772, 608 778 C 468 784, 336 770, 250 706 C 166 644, 106 534, 96 414 C 88 326, 118 272, 162 225 Z"
                  fill="#9ab567"
                  stroke="#5b6d3c"
                  strokeWidth="3"
                />

                {/* Northern Alpine Terrain (Mt. Calavera Peak & Highlands) */}
                <path
                  d="M 175 232 C 235 128, 385 82, 555 88 C 675 94, 758 148, 795 235 C 720 265, 595 275, 445 270 C 315 266, 225 265, 175 232 Z"
                  fill="#8ea85a"
                />
                <path
                  d="M 355 112 C 425 88, 535 95, 588 148 C 542 188, 445 196, 372 172 Z"
                  fill="#a69a74"
                  opacity="0.72"
                />

                {/* Arid Ochre Desert Basin — Redrock Badlands */}
                <path
                  d="M 295 178 C 435 152, 675 162, 778 232 C 812 276, 782 325, 692 332 C 555 342, 392 332, 305 288 Z"
                  fill="#d2b47c"
                  opacity="0.92"
                />

                {/* Inland Turquoise Saltwater Lake — Mirage Sea */}
                <path
                  d="M 392 212 C 455 186, 605 184, 672 218 C 698 242, 658 272, 565 276 C 462 280, 378 258, 392 212 Z"
                  fill="#4ea8bd"
                  stroke="#e3d5b2"
                  strokeWidth="5"
                />

                {/* Golden East Coast Barrier Beachfront — Neon Cay */}
                <path
                  d="M 756 268 C 804 285, 845 365, 842 486 C 840 596, 826 672, 782 722 L 732 715 C 752 630, 756 465, 742 322 Z"
                  fill="#e3cfa0"
                />

                {/* Coral Cove Southwest Sand & Canals */}
                <path
                  d="M 118 485 C 145 552, 198 632, 266 682 L 308 648 C 254 600, 195 538, 166 475 Z"
                  fill="#dfd0a8"
                />

                {/* Solara Metropolis High-Density Urban Slab */}
                <rect
                  x={toSvgX(-218)}
                  y={toSvgY(-115)}
                  width={toSvgX(218) - toSvgX(-218)}
                  height={toSvgY(155) - toSvgY(-115)}
                  rx="24"
                  fill="#c5c9cf"
                  stroke="#64748b"
                  strokeWidth="2"
                  opacity="0.9"
                />

                {/* Port Meridian Industrial Docks & Pier Slips */}
                <rect
                  x={toSvgX(-125)}
                  y={toSvgY(152)}
                  width={toSvgX(40) - toSvgX(-125)}
                  height={toSvgY(242) - toSvgY(152)}
                  rx="6"
                  fill="#9ca3af"
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* Solara International Airport Dual Runways (Restricted Zone 3★) */}
                <g>
                  <rect
                    x={toSvgX(48)}
                    y={toSvgY(156)}
                    width={toSvgX(198) - toSvgX(48)}
                    height={toSvgY(242) - toSvgY(156)}
                    rx="8"
                    fill="#94a3b8"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeDasharray="8 4"
                  />
                  <rect
                    x={toSvgX(48)}
                    y={toSvgY(156)}
                    width={toSvgX(198) - toSvgX(48)}
                    height={toSvgY(242) - toSvgY(156)}
                    rx="8"
                    fill="url(#restrictedHatch)"
                    opacity="0.45"
                  />
                  {/* Dual Runway Strips */}
                  <line
                    x1={toSvgX(62)}
                    y1={toSvgY(194)}
                    x2={toSvgX(184)}
                    y2={toSvgY(194)}
                    stroke="#1e293b"
                    strokeWidth="9"
                  />
                  <line
                    x1={toSvgX(62)}
                    y1={toSvgY(194)}
                    x2={toSvgX(184)}
                    y2={toSvgY(194)}
                    stroke="#f8fafc"
                    strokeWidth="1.6"
                    strokeDasharray="10 8"
                  />
                  <line
                    x1={toSvgX(68)}
                    y1={toSvgY(218)}
                    x2={toSvgX(176)}
                    y2={toSvgY(218)}
                    stroke="#1e293b"
                    strokeWidth="7"
                  />
                </g>

                {/* Fort Vespera Restricted Military Airbase (Restricted Zone 4★) */}
                <g>
                  <rect
                    x={toSvgX(-215)}
                    y={toSvgY(-202)}
                    width={toSvgX(-112) - toSvgX(-215)}
                    height={toSvgY(-112) - toSvgY(-202)}
                    rx="10"
                    fill="#a8a29e"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeDasharray="8 4"
                  />
                  <rect
                    x={toSvgX(-215)}
                    y={toSvgY(-202)}
                    width={toSvgX(-112) - toSvgX(-215)}
                    height={toSvgY(-112) - toSvgY(-202)}
                    rx="10"
                    fill="url(#restrictedHatch)"
                    opacity="0.55"
                  />
                  <line
                    x1={toSvgX(-202)}
                    y1={toSvgY(-158)}
                    x2={toSvgX(-124)}
                    y2={toSvgY(-158)}
                    stroke="#1e293b"
                    strokeWidth="7"
                  />
                </g>

                {/* Perimeter Island Interstate Loop (Bold Charcoal Dual Highway) */}
                <path
                  d={`M ${toSvgX(-200)} ${toSvgY(-200)} L ${toSvgX(200)} ${toSvgY(-200)} L ${toSvgX(200)} ${toSvgY(200)} L ${toSvgX(-200)} ${toSvgY(200)} Z`}
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="8.5"
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${toSvgX(-200)} ${toSvgY(-200)} L ${toSvgX(200)} ${toSvgY(-200)} L ${toSvgX(200)} ${toSvgY(200)} L ${toSvgX(-200)} ${toSvgY(200)} Z`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                  strokeDasharray="10 8"
                />

                {/* Connected Urban Arterial Avenue Grid */}
                {ROAD_COORDS.map((coord) => (
                  <React.Fragment key={coord}>
                    <line
                      x1={toSvgX(coord)}
                      y1={toSvgY(-215)}
                      x2={toSvgX(coord)}
                      y2={toSvgY(215)}
                      stroke="#334155"
                      strokeWidth="5.2"
                    />
                    <line
                      x1={toSvgX(-215)}
                      y1={toSvgY(coord)}
                      x2={toSvgX(215)}
                      y2={toSvgY(coord)}
                      stroke="#334155"
                      strokeWidth="5.2"
                    />
                  </React.Fragment>
                ))}

                {/* Neon Downtown Highlight Corridors (Pink & Cyan Vice/Solara Strip) */}
                <line
                  x1={toSvgX(200)}
                  y1={toSvgY(-120)}
                  x2={toSvgX(200)}
                  y2={toSvgY(180)}
                  stroke="#ec4899"
                  strokeWidth="4.5"
                />
                <line
                  x1={toSvgX(100)}
                  y1={toSvgY(-100)}
                  x2={toSvgX(100)}
                  y2={toSvgY(130)}
                  stroke="#06b6d4"
                  strokeWidth="3.5"
                />

                {/* Emerald Bay Suspension Causeway (East Bridge) */}
                <line
                  x1={toSvgX(200)}
                  y1={toSvgY(0)}
                  x2={toSvgX(355)}
                  y2={toSvgY(0)}
                  stroke="#1e293b"
                  strokeWidth="9"
                />
                <line
                  x1={toSvgX(200)}
                  y1={toSvgY(0)}
                  x2={toSvgX(355)}
                  y2={toSvgY(0)}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Neon Cay Lighthouse Marker */}
                <g transform={`translate(${toSvgX(275)}, ${toSvgY(178)})`}>
                  <circle r="11" fill="#fef08a" opacity="0.55" />
                  <polygon points="0,-13 5,6 -5,6" fill="#ffffff" stroke="#b91c1c" strokeWidth="2" />
                  <circle cy="-13" r="3.5" fill="#facc15" />
                </g>

                {/* Active GPS Route Line */}
                {hud.gps && (
                  <line
                    x1={toSvgX(hud.playerX)}
                    y1={toSvgY(hud.playerZ)}
                    x2={toSvgX(hud.gps.x)}
                    y2={toSvgY(hud.gps.z)}
                    stroke="#0284c7"
                    strokeWidth="5"
                    strokeDasharray="11 7"
                  />
                )}

                {/* Vintage Cartographic Title Block (Top-Left) */}
                <g transform="translate(26, 30)">
                  <text
                    x="0"
                    y="16"
                    fill="#0f172a"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="Chakra Petch, sans-serif"
                    letterSpacing="2.5"
                  >
                    THE ISLAND STATE OF
                  </text>
                  <text
                    x="0"
                    y="44"
                    fill="#0f172a"
                    fontSize="28"
                    fontWeight="900"
                    fontFamily="Outfit, sans-serif"
                    letterSpacing="0.5"
                  >
                    SOLARA STATE
                  </text>
                  <text
                    x="0"
                    y="66"
                    fill="#1e293b"
                    fontSize="16"
                    fontWeight="700"
                    fontFamily="Outfit, sans-serif"
                  >
                    & REDROCK COUNTY
                  </text>
                </g>

                {/* Vintage Compass Rose (Top-Right) */}
                <g transform="translate(928, 72)">
                  <circle r="38" fill="#f4ecd8" fillOpacity="0.86" stroke="#334155" strokeWidth="2" />
                  <circle r="28" fill="none" stroke="#64748b" strokeWidth="1" />
                  <polygon points="0,-32 7,-6 0,0 -7,-6" fill="#b91c1c" />
                  <polygon points="0,32 7,6 0,0 -7,6" fill="#334155" />
                  <polygon points="32,0 6,7 0,0 6,-7" fill="#334155" />
                  <polygon points="-32,0 -6,7 0,0 -6,-7" fill="#334155" />
                  <text
                    x="0"
                    y="-43"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="14"
                    fontWeight="800"
                    fontFamily="Chakra Petch, sans-serif"
                  >
                    N
                  </text>
                </g>

                {/* Cartographic Legend Box (Bottom-Left) */}
                <g transform="translate(24, 650)">
                  <rect
                    width="156"
                    height="172"
                    rx="6"
                    fill="#f6efe0"
                    fillOpacity="0.92"
                    stroke="#475569"
                    strokeWidth="1.8"
                  />
                  <text
                    x="12"
                    y="22"
                    fill="#0f172a"
                    fontSize="12"
                    fontWeight="800"
                    fontFamily="Chakra Petch, sans-serif"
                    letterSpacing="1.8"
                  >
                    ATLAS LEGEND
                  </text>
                  <line x1="12" y1="28" x2="144" y2="28" stroke="#94a3b8" strokeWidth="1" />

                  <g transform="translate(14, 46)" fontSize="10.5" fill="#1e293b" fontFamily="Outfit, sans-serif" fontWeight="600">
                    <line x1="0" y1="0" x2="22" y2="0" stroke="#1f2937" strokeWidth="4.5" />
                    <text x="30" y="3.5">Interstate Loop</text>

                    <line x1="0" y1="20" x2="22" y2="20" stroke="#ec4899" strokeWidth="3.5" />
                    <text x="30" y="23.5">Neon Resort Strip</text>

                    <rect x="0" y="34" width="22" height="11" fill="url(#restrictedHatch)" stroke="#dc2626" strokeWidth="1.2" />
                    <text x="30" y="43.5">Restricted Zone</text>

                    <circle cx="11" cy="62" r="4.5" fill="#10b981" stroke="#064e3b" strokeWidth="1.2" />
                    <text x="30" y="65.5">Auto-Repair Arch</text>

                    <circle cx="11" cy="82" r="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.2" />
                    <text x="30" y="85.5">VCPD Pursuit Unit</text>

                    <circle cx="11" cy="102" r="4.5" fill="#0284c7" stroke="#0c4a6e" strokeWidth="1.2" />
                    <text x="30" y="105.5">Active GPS Route</text>
                  </g>
                </g>
              </svg>

              {/* Interactive District Markers */}
              {WORLD_DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDistrict(d);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9.5px] font-hud font-bold uppercase tracking-wider whitespace-nowrap border shadow-sm transition-transform hover:scale-105 cursor-pointer ${
                    d.restricted
                      ? 'bg-rose-950/90 text-rose-100 border-rose-400/80'
                      : selectedDistrict?.id === d.id
                        ? 'bg-sky-600 text-white border-white'
                        : 'bg-[#101827]/85 text-slate-100 border-white/25'
                  }`}
                  style={{ left: `${toPctX(d.x)}%`, top: `${toPctY(d.z)}%` }}
                >
                  {d.restricted ? `⚠ ${d.name}` : d.name}
                </button>
              ))}

              {/* Repair Arches */}
              {hud.repairs.map((rep, idx) => (
                <div
                  key={idx}
                  title="Pay'n'Spray Auto-Repair Arch"
                  className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 border-2 border-slate-950 pointer-events-none shadow"
                  style={{ left: `${toPctX(rep.x)}%`, top: `${toPctY(rep.z)}%` }}
                />
              ))}

              {/* Live Police & Street Racers */}
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

              {/* Active GPS Destination Pin */}
              {hud.gps && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
                  style={{ left: `${toPctX(hud.gps.x)}%`, top: `${toPctY(hud.gps.z)}%` }}
                >
                  <MapPin className="w-6 h-6 text-emerald-500 fill-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>
              )}

              {/* Live Player Chevron */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${toPctX(hud.playerX)}%`,
                  top: `${toPctY(hud.playerZ)}%`,
                  transform: `translate(-50%, -50%) rotate(${((-hud.playerRotY + Math.PI) * 180) / Math.PI}deg)`,
                }}
              >
                <Navigation className="w-5 h-5 text-slate-950 fill-sky-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" />
              </div>
            </div>
          </div>

          {/* Right Sidebar: Selected Region Inspector + Safehouse Fast Travel + All 10 Regions */}
          <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-4 overflow-y-auto flex flex-col gap-3">
            {selectedDistrict && (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-sky-400/40 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-hud uppercase tracking-widest text-sky-400">
                      Sector {selectedDistrict.gridSector} · {selectedDistrict.biome}
                    </div>
                    <h3 className="font-display text-sm font-bold text-white">
                      {selectedDistrict.name}
                    </h3>
                  </div>
                  {selectedDistrict.restricted && (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedDistrict.summary}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-hud uppercase text-slate-400">
                  <span>Heat {selectedDistrict.wantedMultiplier}x</span>
                  {selectedDistrict.restricted && (
                    <span className="text-rose-400 font-bold">
                      · Auto {selectedDistrict.baseWanted}★ Alert
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onSetGps(selectedDistrict.x, selectedDistrict.z, selectedDistrict.name)
                    }
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-hud text-[11px] font-bold uppercase cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" /> Set GPS
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onFastTravel(selectedDistrict.x, selectedDistrict.z, selectedDistrict.name)
                    }
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-300 font-hud text-[11px] font-bold uppercase cursor-pointer"
                  >
                    <Zap className="w-3 h-3" /> Travel
                  </button>
                </div>
              </div>
            )}

            {/* Quick Safehouse Spawns */}
            <div>
              <div className="text-[10px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                Fast Travel Safehouses
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PLAYER_SPAWNS.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onFastTravel(sp.x, sp.z, sp.name, sp.rotY)}
                    className="px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 truncate cursor-pointer"
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* All 10 Solara State Regions */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-hud uppercase tracking-widest text-slate-400">
                10 Regions & Districts
              </div>
              {WORLD_DISTRICTS.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDistrict(d)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                    selectedDistrict?.id === d.id
                      ? 'bg-sky-500/15 border-sky-400/50'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                      {d.restricted && <span className="text-rose-400">⚠</span>}
                      <span className="truncate">{d.name}</span>
                    </div>
                    <div className="text-[10px] font-hud text-slate-400">
                      {d.gridSector} · {d.biome}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetGps(d.x, d.z, d.name);
                    }}
                    title="Set 3D GPS Route"
                    className="p-1.5 rounded-md bg-white/[0.06] hover:bg-sky-500/30 text-sky-400 shrink-0 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { HudSnapshot } from '../game/types';
import { ROAD_COORDS } from '../game/world';

interface MinimapProps {
  hud: HudSnapshot;
  onOpenMap: () => void;
}

export function Minimap({ hud, onOpenMap }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 148;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    const scale = 0.255;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Coastal turquoise-slate ocean
    ctx.fillStyle = '#0c2333';
    ctx.fillRect(0, 0, size, size);

    // Rotate relative to player heading so "up" is always forward
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(hud.playerRotY - Math.PI);

    const toMapX = (wx: number) => (wx - hud.playerX) * scale;
    const toMapY = (wz: number) => (wz - hud.playerZ) * scale;

    // Solara Island Verdant Terrain
    ctx.fillStyle = '#1b2c22';
    ctx.beginPath();
    ctx.ellipse(toMapX(15), toMapY(-10), 290 * scale, 285 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Northern Redrock Desert Basin
    ctx.fillStyle = '#3d3321';
    ctx.fillRect(toMapX(-160), toMapY(-270), 350 * scale, 130 * scale);

    // Mirage Sea Inland Saltwater Lake
    ctx.fillStyle = '#165e73';
    ctx.beginPath();
    ctx.ellipse(toMapX(45), toMapY(-240), 90 * scale, 40 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Solara Metropolis Urban Slab
    ctx.fillStyle = '#172030';
    ctx.fillRect(toMapX(-218), toMapY(-115), 436 * scale, 270 * scale);

    // Neon Cay Golden Beach Strip
    ctx.fillStyle = '#3d3525';
    ctx.fillRect(toMapX(224), toMapY(-220), 75 * scale, 450 * scale);

    // Fort Vespera Restricted Military Zone (Red-tinted radar alert box)
    ctx.fillStyle = 'rgba(220, 38, 38, 0.24)';
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.72)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(toMapX(-215), toMapY(-202), 103 * scale, 90 * scale);
    ctx.strokeRect(toMapX(-215), toMapY(-202), 103 * scale, 90 * scale);

    // Solara International Airport Restricted Runways
    ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
    ctx.fillRect(toMapX(48), toMapY(156), 150 * scale, 86 * scale);
    ctx.strokeRect(toMapX(48), toMapY(156), 150 * scale, 86 * scale);

    // Main Avenues Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.6;
    ctx.lineCap = 'square';
    for (const coord of ROAD_COORDS) {
      ctx.beginPath();
      ctx.moveTo(toMapX(coord), toMapY(-245));
      ctx.lineTo(toMapX(coord), toMapY(245));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toMapX(-245), toMapY(coord));
      ctx.lineTo(toMapX(225), toMapY(coord));
      ctx.stroke();
    }

    // Neon Cay Strip Highlight
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(toMapX(200), toMapY(-120));
    ctx.lineTo(toMapX(200), toMapY(180));
    ctx.stroke();

    // Emerald Bay Causeway Bridge
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(toMapX(200), toMapY(0));
    ctx.lineTo(toMapX(355), toMapY(0));
    ctx.stroke();

    // Repair Arches
    for (const rep of hud.repairs) {
      const rx = toMapX(rep.x);
      const ry = toMapY(rep.z);
      ctx.fillStyle = rep.ready ? '#10b981' : '#334155';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active GPS route line & destination beacon
    if (hud.gps) {
      const gx = toMapX(hud.gps.x);
      const gy = toMapY(hud.gps.z);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.setLineDash([]);

      const distPx = Math.hypot(gx, gy);
      const maxPinR = r - 9;
      const pinX = distPx > maxPinR ? (gx / distPx) * maxPinR : gx;
      const pinY = distPx > maxPinR ? (gy / distPx) * maxPinR : gy;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ecfdf5';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Police, SWAT & Street Racers
    const flashBlue = Math.floor(performance.now() / 160) % 2 === 0;
    for (const unit of hud.units) {
      const ux = toMapX(unit.x);
      const uy = toMapY(unit.z);
      if (unit.type === 'racer') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(ux, uy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.type === 'police' || unit.type === 'swat') {
        ctx.fillStyle = unit.disabled ? '#64748b' : flashBlue ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(ux, uy, unit.type === 'swat' ? 3.9 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Subtle radar inner shadow vignette
    const vignette = ctx.createRadialGradient(cx, cy, r * 0.68, cx, cy, r);
    vignette.addColorStop(0, 'rgba(6, 10, 18, 0)');
    vignette.addColorStop(1, 'rgba(6, 10, 18, 0.52)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);

    // Center player chevron
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5.5, 5.5);
    ctx.lineTo(0, 2.6);
    ctx.lineTo(-5.5, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Outer circular rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = hud.wantedLevel >= 3 ? 'rgba(244, 63, 94, 0.72)' : 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating North indicator
    const northAngle = hud.playerRotY - Math.PI - Math.PI / 2;
    const nx = cx + Math.cos(northAngle) * (r - 1);
    const ny = cy + Math.sin(northAngle) * (r - 1);
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(nx, ny, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny + 0.5);
  }, [hud]);

  return (
    <div className="flex flex-col items-start gap-1.5 select-none">
      <button
        type="button"
        onClick={onOpenMap}
        title="Open Solara State Topographical Atlas (M)"
        className={`relative rounded-full p-0.5 transition-transform active:scale-95 cursor-pointer bg-[#070a12]/90 shadow-[0_8px_24px_rgba(0,0,0,0.65)] ${
          hud.wantedLevel >= 3 ? 'police-alert-ring border border-rose-500/60' : 'border border-white/15 hover:border-sky-400/60'
        }`}
      >
        <canvas ref={canvasRef} width={148} height={148} className="block rounded-full" />
      </button>

      <div className="flex items-center gap-2 pl-1 text-[11px] font-hud tracking-wider uppercase text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        <span className="font-semibold text-white">{hud.district}</span>
        {hud.gps && (
          <>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-semibold">{hud.gps.distanceMeters}m</span>
          </>
        )}
      </div>
    </div>
  );
}

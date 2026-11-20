import React from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CameraMode,
  HudSnapshot,
  TouchInputState,
  WeatherCondition,
} from '../game/types';
import { Minimap } from './Minimap';
import { Tachometer } from './Tachometer';
import { PauseTab } from './PauseMenuModal';

interface GameHUDProps {
  hud: HudSnapshot;
  cameraMode: CameraMode;
  muted: boolean;
  hideHud: boolean;
  showTouchControls: boolean;
  activeShowcaseId: string;
  onStartDrive: () => void;
  onRestartDrive: () => void;
  onOpenMenu: (tab?: PauseTab) => void;
  onOpenMap: () => void;
  onCycleCamera: () => void;
  onToggleMute: () => void;
  onToggleTouchControls: () => void;
  onTouchChange: (partial: Partial<TouchInputState>) => void;
  onApplyShowcase: (id: string, weather: WeatherCondition, hours: number, intensity: number) => void;
}

const SHOWCASE_PRESETS: {
  id: string;
  label: string;
  weather: WeatherCondition;
  hours: number;
  intensity: number;
}[] = [
  { id: 'neon_rain', label: 'Neon Rain', weather: 'light_rain', hours: 20.4, intensity: 0.78 },
  { id: 'coastal_sun', label: 'Coastal Sunny', weather: 'sunny', hours: 12.6, intensity: 0.4 },
  { id: 'golden_hour', label: 'Golden Hour', weather: 'partly_cloudy', hours: 17.65, intensity: 0.55 },
  { id: 'thunderstorm', label: 'Thunderstorm', weather: 'thunderstorm', hours: 19.3, intensity: 0.95 },
  { id: 'dense_fog', label: 'Dense Fog', weather: 'heavy_fog', hours: 6.6, intensity: 0.88 },
];

const CAMERA_LABELS: Record<CameraMode, string> = {
  chase: 'Chase',
  close: 'Low',
  cockpit: 'Cockpit',
  hood: 'Hood',
  cinematic: 'Cine',
};

export function GameHUD({
  hud,
  cameraMode,
  muted,
  hideHud,
  showTouchControls,
  activeShowcaseId,
  onStartDrive,
  onRestartDrive,
  onOpenMenu,
  onOpenMap,
  onCycleCamera,
  onToggleMute,
  onToggleTouchControls,
  onTouchChange,
  onApplyShowcase,
}: GameHUDProps) {
  const bindTouch = (key: keyof TouchInputState) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      onTouchChange({ [key]: true });
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onTouchChange({ [key]: false });
    },
    onPointerCancel: () => onTouchChange({ [key]: false }),
    onLostPointerCapture: () => onTouchChange({ [key]: false }),
  });

  // 1. Clean Cinematic Title Screen (unobstructed 3D car showcase)
  if (hud.phase === 'title') {
    return (
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 select-none">
        {/* Top bar: subtle atmosphere selector + audio/source controls */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#070a12]/80 border border-white/10 rounded-lg p-1">
            {SHOWCASE_PRESETS.map((preset) => {
              const active = activeShowcaseId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onApplyShowcase(preset.id, preset.weather, preset.hours, preset.intensity)
                  }
                  className={`px-2.5 py-1 rounded-md text-[11px] font-hud uppercase tracking-wider transition-colors cursor-pointer ${
                    active
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/ProjectVelocity_Unity6_Pack.zip"
              download="ProjectVelocity_Unity6_Pack.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070a12]/80 hover:bg-[#0e1424] border border-white/15 text-xs font-hud uppercase tracking-wider text-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              Unity 6 C# Pack
            </a>
            <button
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-[#070a12]/80 hover:bg-[#0e1424] border border-white/15 text-slate-200 cursor-pointer"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bottom-left hero title & direct Play action (car stays wide open in center) */}
        <div className="pointer-events-auto flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="max-w-lg">
            <div className="text-[11px] font-hud uppercase tracking-[0.26em] text-sky-400 mb-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              Open-World Coastal Pursuit · {hud.vehicleName}
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[0.95] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
              PROJECT VELOCITY
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-200/90 max-w-md drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
              10 coastal districts, dynamic 24-hour weather, all 10 vehicle classes, holographic GPS routing, and VCPD pursuit AI.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onStartDrive}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-hud text-sm font-bold uppercase tracking-wider shadow-[0_8px_28px_rgba(14,165,233,0.4)] transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Drive Now
              </button>
              <button
                type="button"
                onClick={() => onOpenMenu('garage')}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#090d16]/85 hover:bg-[#111827] border border-white/15 text-white font-hud text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                Garage & Weather
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end text-[11px] font-hud uppercase tracking-wider text-slate-300/90 gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
            <span>WASD / Arrows · Steer & Throttle</span>
            <span>Space Handbrake · Shift Nitro · C Camera · M Map</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Busted / Wrecked Overlay
  if (hud.phase === 'busted' || hud.phase === 'wrecked') {
    const isBusted = hud.phase === 'busted';
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 select-none">
        <div className="w-full max-w-md bg-[#090d16] border border-white/15 rounded-xl p-6 text-center shadow-2xl">
          <div
            className={`font-display text-4xl font-extrabold tracking-tight uppercase ${
              isBusted ? 'text-rose-500' : 'text-amber-400'
            }`}
          >
            {isBusted ? 'Busted' : 'Vehicle Wrecked'}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {isBusted
              ? 'VCPD units boxed in your vehicle and ended the pursuit.'
              : 'Chassis integrity hit zero. Auto-repair arches restore 100% health on the fly.'}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 text-left">
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
              <div className="text-[10px] font-hud uppercase text-slate-400">Run Earnings</div>
              <div className="font-hud text-lg font-bold text-emerald-400">
                ${hud.score.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
              <div className="text-[10px] font-hud uppercase text-slate-400">Top Speed</div>
              <div className="font-hud text-lg font-bold text-white">
                {Math.round(hud.topSpeedMph * 1.609)} km/h
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
              <div className="text-[10px] font-hud uppercase text-slate-400">Takedowns</div>
              <div className="font-hud text-lg font-bold text-sky-400">{hud.takedowns}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
              <div className="text-[10px] font-hud uppercase text-slate-400">Chase Time</div>
              <div className="font-hud text-lg font-bold text-white">
                {Math.floor(hud.chaseSeconds)}s
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onRestartDrive}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-hud text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Drive Again
            </button>
            <button
              type="button"
              onClick={() => onOpenMenu('garage')}
              className="px-4 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/15 text-xs font-hud uppercase tracking-wider text-white cursor-pointer"
            >
              Garage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hideHud) {
    return null;
  }

  // 3. Clean Minimalist Playing HUD (Solar Crown & GTA 6 Inspired)
  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-5 select-none">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Clean Objective & GPS Strip (unboxed, high-contrast shadow) */}
        <div className="flex flex-col items-start gap-1 max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-2 text-[11px] font-hud uppercase tracking-wider text-slate-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
            <span className="text-sky-400 font-bold">{hud.mission.title}</span>
            <span className="text-slate-500">·</span>
            <span>{hud.timeFormatted}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">{hud.weatherLabel}</span>
          </div>

          <div className="text-xs sm:text-sm font-medium text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]">
            {hud.mission.objective}
            {hud.mission.mode === 'race' && (
              <span className="ml-2 font-hud text-amber-400 font-bold">
                POS {hud.mission.racePosition}/{hud.mission.totalRacers}
              </span>
            )}
            {(hud.mission.mode === 'mission' || hud.mission.mode === 'timetrial') && (
              <span className="ml-2 font-hud text-sky-400 font-bold">
                {hud.mission.timerSeconds.toFixed(1)}s
              </span>
            )}
          </div>

          {hud.gps && (
            <div className="text-[11px] font-hud uppercase tracking-wider text-emerald-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
              GPS {hud.gps.label} · {hud.gps.distanceMeters}m
            </div>
          )}
        </div>

        {/* Top-Right: Cash, Wanted Stars & Compact Utility Icons */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="font-hud text-lg sm:text-xl font-bold text-emerald-400 tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              ${hud.bankCash.toLocaleString()}
            </span>

            <div className="flex items-center gap-0.5" aria-label={`Wanted level ${hud.wantedLevel} of 5`}>
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const filled = starIdx <= hud.wantedLevel;
                return (
                  <Star
                    key={starIdx}
                    className={`w-4 h-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${
                      filled
                        ? hud.isEvading
                          ? 'text-sky-400 fill-sky-400'
                          : 'text-amber-400 fill-amber-400'
                        : 'text-white/25'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Compact Utility Icon Strip */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCycleCamera}
              title="Switch Camera (C)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#070a12]/80 hover:bg-[#111827] border border-white/15 text-[11px] font-hud uppercase tracking-wider text-slate-200 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{CAMERA_LABELS[cameraMode]}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMap}
              title="Interactive GPS Map (M)"
              className="p-1.5 rounded-lg bg-[#070a12]/80 hover:bg-[#111827] border border-white/15 text-slate-200 cursor-pointer"
              aria-label="Open Map"
            >
              <MapIcon className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={onToggleTouchControls}
              title="Toggle On-Screen Mobile Controls"
              className={`p-1.5 rounded-lg border cursor-pointer ${
                showTouchControls
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-[#070a12]/80 hover:bg-[#111827] border-white/15 text-slate-300'
              }`}
              aria-label="Toggle Touch Controls"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title="Mute / Unmute Audio (V)"
              className="p-1.5 rounded-lg bg-[#070a12]/80 hover:bg-[#111827] border border-white/15 text-slate-200 cursor-pointer"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => onOpenMenu('weather')}
              title="Menu · Garage · Weather · Modes (Esc)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#070a12]/80 hover:bg-[#111827] border border-white/15 text-[11px] font-hud uppercase tracking-wider text-white cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* CENTER-TOP TOAST & BUST PROGRESS */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
        {hud.bustProgress > 0.04 && (
          <div className="w-56 bg-[#090d16]/95 border border-rose-500/70 rounded-lg px-3 py-2 text-center">
            <div className="text-[11px] font-hud uppercase tracking-widest text-rose-400 font-bold">
              Busted Warning
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-rose-500"
                style={{ width: `${Math.min(100, Math.round(hud.bustProgress * 100))}%` }}
              />
            </div>
          </div>
        )}

        {hud.alert && (
          <div
            key={hud.alert.id}
            className={`px-4 py-2 rounded-lg bg-[#090d16]/90 border text-center shadow-lg ${
              hud.alert.accent === 'red'
                ? 'border-rose-500/60'
                : hud.alert.accent === 'gold'
                  ? 'border-amber-400/60'
                  : hud.alert.accent === 'emerald'
                    ? 'border-emerald-400/60'
                    : 'border-sky-400/60'
            }`}
          >
            <div className="font-hud text-xs font-bold uppercase tracking-wider text-white">
              {hud.alert.title}
            </div>
            <div className="text-[11px] text-slate-300">{hud.alert.subtitle}</div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR: Circular Radar (left) + Optional Touch Controls + Circular Tachometer (right) */}
      <div className="flex items-end justify-between gap-4">
        <div className="pointer-events-auto flex flex-col items-start gap-3">
          {showTouchControls && (
            <div className="flex items-center gap-2.5 touch-none">
              <button
                type="button"
                {...bindTouch('left')}
                className="w-14 h-14 rounded-xl bg-[#070a12]/85 active:bg-sky-500/35 border border-white/20 flex items-center justify-center text-white"
                aria-label="Steer Left"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                {...bindTouch('right')}
                className="w-14 h-14 rounded-xl bg-[#070a12]/85 active:bg-sky-500/35 border border-white/20 flex items-center justify-center text-white"
                aria-label="Steer Right"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>
          )}

          <Minimap hud={hud} onOpenMap={onOpenMap} />
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {showTouchControls && (
            <div className="flex items-end gap-2 touch-none">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  {...bindTouch('nitro')}
                  className="w-12 h-11 rounded-xl bg-sky-500/20 active:bg-sky-500/50 border border-sky-400/50 flex items-center justify-center text-sky-300"
                  aria-label="Nitro Boost"
                >
                  <Flame className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  {...bindTouch('drift')}
                  className="w-12 h-11 rounded-xl bg-amber-500/20 active:bg-amber-500/50 border border-amber-400/50 text-[10px] font-hud font-bold uppercase text-amber-300"
                >
                  DRIFT
                </button>
              </div>
              <button
                type="button"
                {...bindTouch('brake')}
                className="w-14 h-16 rounded-xl bg-rose-500/20 active:bg-rose-500/50 border border-rose-400/50 text-[11px] font-hud font-bold uppercase text-rose-200"
              >
                BRK
              </button>
              <button
                type="button"
                {...bindTouch('throttle')}
                className="w-14 h-20 rounded-xl bg-emerald-500/20 active:bg-emerald-500/50 border border-emerald-400/50 text-[11px] font-hud font-bold uppercase text-emerald-200"
              >
                GAS
              </button>
            </div>
          )}

          <Tachometer hud={hud} />
        </div>
      </div>
    </div>
  );
}

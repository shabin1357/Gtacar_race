import { useMemo, useState } from 'react';
import {
  Car,
  CloudRain,
  Download,
  Flag,
  FolderCode,
  Play,
  RotateCcw,
  Search,
  Smartphone,
  Sun,
  X,
} from 'lucide-react';
import {
  CAR_PAINTS,
  CustomizationState,
  formatTime24,
  GameMode,
  GraphicsQuality,
  HudSnapshot,
  RIM_FINISHES,
  SHOWROOM_SHEETS,
  ShowroomCategory,
  TIME_PRESETS,
  UNDERGLOW_OPTIONS,
  VEHICLE_SPECS,
  VehicleSpec,
  WEATHER_OPTIONS,
  WeatherCondition,
} from '../game/types';

export type PauseTab = 'modes' | 'garage' | 'weather' | 'unity';

interface PauseMenuModalProps {
  activeTab: PauseTab;
  onTabChange: (tab: PauseTab) => void;
  hud: HudSnapshot;
  customization: CustomizationState;
  weather: WeatherCondition;
  weatherIntensity: number;
  autoWeather: boolean;
  timeOfDayHours: number;
  autoDayNight: boolean;
  graphicsQuality: GraphicsQuality;
  showTouchControls: boolean;
  onResume: () => void;
  onSelectMode: (mode: GameMode) => void;
  onRespawn: () => void;
  onUpdateCustomization: (partial: Partial<CustomizationState>) => void;
  onWeatherChange: (w: WeatherCondition) => void;
  onWeatherIntensityChange: (val: number) => void;
  onAutoWeatherChange: (enabled: boolean) => void;
  onTimeOfDayChange: (hours: number) => void;
  onAutoDayNightChange: (enabled: boolean) => void;
  onGraphicsQualityChange: (q: GraphicsQuality) => void;
  onToggleTouchControls: (show: boolean) => void;
}

const SHOWROOM_FILTERS: { id: 'all' | ShowroomCategory; label: string }[] = [
  { id: 'all', label: `All (${VEHICLE_SPECS.length})` },
  { id: 'hyper_super', label: 'Hyper & Super' },
  { id: 'sports_tuner', label: 'Sports & Tuner' },
  { id: 'muscle_classic', label: 'Muscle & Classic' },
  { id: 'suv_utility', label: 'SUV, 4x4 & Vans' },
  { id: 'service_special', label: 'Service & Special' },
];

// Exact sprite-sheet crop helper for the user's two uploaded car sheets
function getVehicleThumbStyle(v: VehicleSpec): React.CSSProperties {
  const { sheet, col, row } = v.thumbnail;
  if (sheet === 'grid20') {
    const posX = (col / 3) * 100;
    const posY = (row / 4) * 100;
    return {
      backgroundImage: `url(${SHOWROOM_SHEETS.grid20})`,
      backgroundSize: '400% 500%',
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
    };
  }
  // Sheet B: 3 cols x 6 rows dealership screenshot — crop directly onto the studio car photo
  const colPositions = [7.6, 50.0, 92.4];
  const rowPositions = [11.3, 27.3, 43.2, 59.1, 75.0, 91.0];
  return {
    backgroundImage: `url(${SHOWROOM_SHEETS.dealer18})`,
    backgroundSize: '342% auto',
    backgroundPosition: `${colPositions[col] ?? 50}% ${rowPositions[row] ?? 50}%`,
    backgroundRepeat: 'no-repeat',
  };
}

export function PauseMenuModal({
  activeTab,
  onTabChange,
  hud,
  customization,
  weather,
  weatherIntensity,
  autoWeather,
  timeOfDayHours,
  autoDayNight,
  graphicsQuality,
  showTouchControls,
  onResume,
  onSelectMode,
  onRespawn,
  onUpdateCustomization,
  onWeatherChange,
  onWeatherIntensityChange,
  onAutoWeatherChange,
  onTimeOfDayChange,
  onAutoDayNightChange,
  onGraphicsQualityChange,
  onToggleTouchControls,
}: PauseMenuModalProps) {
  const [showroomFilter, setShowroomFilter] = useState<'all' | ShowroomCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedVehicle =
    VEHICLE_SPECS.find((v) => v.id === customization.vehicleId) ?? VEHICLE_SPECS[0];

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VEHICLE_SPECS.filter((v) => {
      if (showroomFilter !== 'all' && v.showroomGroup !== showroomFilter) return false;
      if (q && !v.name.toLowerCase().includes(q) && !v.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [showroomFilter, searchQuery]);

  const tabs: { id: PauseTab; label: string; icon: typeof Flag }[] = [
    { id: 'modes', label: 'Drive Modes', icon: Flag },
    { id: 'garage', label: `Showroom (${VEHICLE_SPECS.length})`, icon: Car },
    { id: 'weather', label: 'Weather & Graphics', icon: CloudRain },
    { id: 'unity', label: 'Unity 6 Android', icon: FolderCode },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-5">
      <div className="w-full max-w-6xl bg-[#090d16] border border-white/15 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold tracking-tight text-white">
              PROJECT VELOCITY
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-hud uppercase tracking-wider text-slate-400">
              ${hud.bankCash.toLocaleString()} · {hud.fps} FPS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResume}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-hud text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Drive
            </button>
            <button
              type="button"
              onClick={onResume}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-2.5 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-hud uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-sky-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
          {activeTab === 'modes' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'freeroam' as GameMode,
                    title: 'Open-World Free Roam',
                    desc: 'Explore all 10 Solara State & Redrock County regions including restricted Fort Vespera Airbase (4★) and Solara Airport (3★).',
                  },
                  {
                    id: 'mission' as GameMode,
                    title: 'Getaway Contract',
                    desc: 'Timed 3-stage pursuit escape from Industrial Docks to Solara Airport and Emerald Bay Causeway ($4,500 payout).',
                  },
                  {
                    id: 'timetrial' as GameMode,
                    title: 'Coastal Time Trial',
                    desc:
                      hud.mission.bestTimeTrialSeconds !== null
                        ? `6-checkpoint speed circuit without police. Best run: ${hud.mission.bestTimeTrialSeconds.toFixed(1)}s.`
                        : '6-checkpoint full-throttle circuit around the coastal loop with live lap timer.',
                  },
                  {
                    id: 'race' as GameMode,
                    title: 'Street Race vs 3 AI Rivals',
                    desc: 'Head-to-head street race against 3 rival cars through Solara Metropolis, Highway, and Neon Cay.',
                  },
                ].map((item) => {
                  const isCurrent = hud.mission.mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectMode(item.id);
                        onResume();
                      }}
                      className={`p-4 rounded-xl text-left border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-500/15 border-sky-400/60'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-white">
                          {item.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-hud uppercase tracking-wider text-sky-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div className="text-xs text-slate-400">
                  Controls: WASD / Arrows drive · Space handbrake · Shift nitro · C camera · M Solara Atlas · R reset car
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRespawn();
                    onResume();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/15 text-xs font-hud uppercase tracking-wider text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Car on Road
                </button>
              </div>
            </div>
          )}

          {activeTab === 'garage' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
              {/* Left: 38-Car Dealership Showroom Catalog */}
              <div className="flex flex-col gap-3 min-h-0">
                {/* Category Filter Tabs + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {SHOWROOM_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setShowroomFilter(f.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-hud uppercase tracking-wider border cursor-pointer transition-colors ${
                          showroomFilter === f.id
                            ? 'bg-rose-600 border-rose-400 text-white font-bold'
                            : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search 38 cars..."
                      className="pl-8 pr-3 py-1 rounded-md bg-white/[0.05] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 w-40"
                    />
                  </div>
                </div>

                {/* Dealership Thumbnail Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[58vh] overflow-y-auto pr-1">
                  {filteredVehicles.map((v) => {
                    const selected = v.id === customization.vehicleId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onUpdateCustomization({ vehicleId: v.id })}
                        className={`group rounded-lg overflow-hidden text-left border transition-all cursor-pointer flex flex-col bg-[#0f1422] ${
                          selected
                            ? 'border-sky-400 ring-1 ring-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.28)]'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {/* Cropped Car Photo from User's Uploaded Showroom Sheets */}
                        <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden">
                          <div
                            className="w-full h-full transition-transform duration-200 group-hover:scale-105"
                            style={getVehicleThumbStyle(v)}
                          />
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-hud font-bold text-sky-400">
                            {v.maxSpeedKph} km/h
                          </div>
                          {selected && (
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 text-[9px] font-hud font-bold uppercase">
                              Equipped
                            </div>
                          )}
                        </div>

                        {/* Dealership Name & Price Strip */}
                        <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-[#0b0f1a] border-t border-white/10">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-white truncate">
                              {v.name}
                            </div>
                            <div className="text-[9.5px] text-slate-400 truncate">
                              {v.category}
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-rose-700/90 text-white text-[10px] font-hud font-bold shrink-0">
                            {v.price > 0 ? `$${v.price.toLocaleString()}` : 'FLEET'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Live Selected Vehicle Specs & Customization */}
              <div className="space-y-3.5">
                <div className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/10">
                  <div className="w-full aspect-[16/9] bg-slate-900">
                    <div className="w-full h-full" style={getVehicleThumbStyle(selectedVehicle)} />
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-bold text-white">
                          {selectedVehicle.name}
                        </h3>
                        <div className="text-[11px] text-slate-400">
                          {selectedVehicle.category} · {selectedVehicle.mass} kg
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-hud text-xs font-bold">
                        {selectedVehicle.price > 0
                          ? `$${selectedVehicle.price.toLocaleString()}`
                          : 'FLEET UNIT'}
                      </span>
                    </div>

                    {[
                      { label: 'Top Speed', value: `${selectedVehicle.maxSpeedKph} km/h`, pct: (selectedVehicle.maxSpeedKph / 386) * 100 },
                      { label: 'Acceleration', value: `${selectedVehicle.acceleration}`, pct: (selectedVehicle.acceleration / 3200) * 100 },
                      { label: 'Braking', value: `${selectedVehicle.brakeForce}`, pct: (selectedVehicle.brakeForce / 4400) * 100 },
                      { label: 'Tire Grip', value: `${selectedVehicle.grip.toFixed(2)}`, pct: (selectedVehicle.grip / 1.44) * 100 },
                      { label: 'Off-Road', value: `${Math.round(selectedVehicle.offRoadCapability * 100)}%`, pct: selectedVehicle.offRoadCapability * 100 },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-1">
                        <div className="flex justify-between text-[10.5px] font-hud">
                          <span className="text-slate-400 uppercase">{stat.label}</span>
                          <span className="text-slate-200">{stat.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-sky-400 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(4, stat.pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 16 Metallic & Matte Factory Paint Swatches */}
                <div>
                  <div className="text-[10.5px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                    Factory & Custom Respray (16 Finishes)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CAR_PAINTS.map((paint) => (
                      <button
                        key={paint.id}
                        type="button"
                        onClick={() => onUpdateCustomization({ paintId: paint.id })}
                        title={paint.name}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                          customization.paintId === paint.id
                            ? 'border-white scale-115'
                            : 'border-white/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: paint.css }}
                      />
                    ))}
                  </div>
                </div>

                {/* Rim & Underglow */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10.5px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                      Alloy Rims
                    </div>
                    <div className="flex gap-1.5">
                      {RIM_FINISHES.map((rim) => (
                        <button
                          key={rim.id}
                          type="button"
                          onClick={() => onUpdateCustomization({ rimId: rim.id })}
                          title={rim.name}
                          className={`w-6 h-6 rounded-md border cursor-pointer ${
                            customization.rimId === rim.id
                              ? 'border-sky-400 ring-1 ring-sky-400'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: rim.css }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10.5px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                      Underglow
                    </div>
                    <div className="flex gap-1.5">
                      {UNDERGLOW_OPTIONS.map((ug) => (
                        <button
                          key={ug.id}
                          type="button"
                          onClick={() => onUpdateCustomization({ underglowId: ug.id })}
                          title={ug.name}
                          className={`w-6 h-6 rounded-md border cursor-pointer ${
                            customization.underglowId === ug.id
                              ? 'border-sky-400 ring-1 ring-sky-400'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: ug.css }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Engine & Grip Tuning */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10.5px] font-hud uppercase tracking-widest text-slate-400 mb-1">
                      ECU Tune
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onUpdateCustomization({ engineLevel: lvl })}
                          className={`py-1 rounded text-xs font-hud font-semibold border cursor-pointer ${
                            customization.engineLevel === lvl
                              ? 'bg-sky-500/20 border-sky-400 text-white'
                              : 'bg-white/[0.03] border-white/10 text-slate-400'
                          }`}
                        >
                          Lv {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10.5px] font-hud uppercase tracking-widest text-slate-400 mb-1">
                      Tire Compound
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onUpdateCustomization({ gripLevel: lvl })}
                          className={`py-1 rounded text-xs font-hud font-semibold border cursor-pointer ${
                            customization.gripLevel === lvl
                              ? 'bg-sky-500/20 border-sky-400 text-white'
                              : 'bg-white/[0.03] border-white/10 text-slate-400'
                          }`}
                        >
                          Lv {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weather' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: 10 Weather Conditions & Intensity */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400">
                    Dynamic Weather (10 Conditions)
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoWeather}
                      onChange={(e) => onAutoWeatherChange(e.target.checked)}
                      className="accent-sky-400"
                    />
                    Auto Weather
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {WEATHER_OPTIONS.map((w) => {
                    const active = weather === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onWeatherChange(w.id)}
                        className={`px-3 py-2 rounded-lg text-left text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-sky-500/20 border-sky-400 text-white'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>

                {/* Weather Intensity Slider */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-hud">
                    <span className="text-slate-400 uppercase tracking-wider">Weather Intensity</span>
                    <span className="text-white font-semibold">
                      {Math.round(weatherIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={Math.round(weatherIntensity * 100)}
                    onChange={(e) => onWeatherIntensityChange(Number(e.target.value) / 100)}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">
                    Adjusts rain density, puddle reflections, fog visibility, wind gusts, and wet braking grip.
                  </p>
                </div>
              </div>

              {/* Right: 24-Hour Cycle & Graphics Quality */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-hud uppercase tracking-wider text-slate-300">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Time of Day: {formatTime24(timeOfDayHours)}</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDayNight}
                        onChange={(e) => onAutoDayNightChange(e.target.checked)}
                        className="accent-sky-400"
                      />
                      Auto 24h Cycle
                    </label>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={23.95}
                    step={0.05}
                    value={timeOfDayHours}
                    onChange={(e) => onTimeOfDayChange(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onTimeOfDayChange(preset.hour24)}
                        className="px-2 py-1.5 rounded-md text-[11px] font-hud bg-white/[0.04] hover:bg-amber-500/20 hover:text-white border border-white/10 text-slate-300 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Android Graphics Quality Preset */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-hud">
                    <span className="text-slate-400 uppercase tracking-wider">
                      Graphics Quality (vivo T3x Profile)
                    </span>
                    <span className="text-emerald-400">{hud.fps} FPS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onGraphicsQualityChange(q)}
                        className={`py-2 rounded-lg text-xs font-hud uppercase font-semibold border cursor-pointer ${
                          graphicsQuality === q
                            ? 'bg-sky-500/20 border-sky-400 text-white'
                            : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Touch Controls Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Mobile Touch Controls</div>
                      <div className="text-[11px] text-slate-400">
                        On-screen steer, gas, brake, handbrake, nitro & camera buttons
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleTouchControls(!showTouchControls)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-hud uppercase font-semibold border cursor-pointer ${
                      showTouchControls
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-white/[0.04] border-white/15 text-slate-400'
                    }`}
                  >
                    {showTouchControls ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'unity' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-white">
                    Unity 6 URP Android Source Pack (38 Cars + Solara State World Manifest)
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Includes all C# scripts for Vehicle Physics, 38-Vehicle Pack Generator, Solara State & Redrock County
                    JSON World Manifest, Traffic & Police AI, all 8 Weather & 24h Lighting controllers, and Mobile UI.
                  </p>
                </div>
                <a
                  href="/ProjectVelocity_Unity6_Pack.zip"
                  download="ProjectVelocity_Unity6_Pack.zip"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-hud text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 font-mono-num text-slate-300">
                  <div className="font-hud uppercase tracking-wider text-slate-400 text-[11px] mb-2">
                    Included C# & World Manifest Files
                  </div>
                  <div>Assets/Resources/SolaraStateWorldManifest.json (8192×8192 10-Region Atlas + Spawns)</div>
                  <div>Assets/Editor/VehiclePackGenerator.cs (Generates all 38 Vehicle Profiles & Prefabs)</div>
                  <div>Assets/Scripts/Vehicle/ (CarController, CarPhysics, CarCamera, VehicleStatsApplier)</div>
                  <div>Assets/Scripts/World/ (WeatherManager, DayNightManager, Rain/Fog/Lightning/StreetLights)</div>
                  <div>Assets/Scripts/AI/ (TrafficAI, PoliceAI) & Assets/Scripts/UI/ (MobileControls, MiniMap)</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/25 space-y-2 text-slate-200">
                  <div className="font-hud uppercase tracking-wider text-amber-300 text-[11px]">
                    Android APK Build Notice
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    No Android <code className="text-white">.apk</code> has been compiled in this web environment because
                    Unity 6 Editor and the Android NDK/SDK are not installed here.
                  </p>
                  <p className="leading-relaxed text-slate-400">
                    Extract the ZIP on PC/Mac, open <code className="text-slate-200">OpenWorldCarChase</code> in Unity 6 URP,
                    run <code className="text-slate-200">Project Velocity → Generate All Cars Pack</code> and{' '}
                    <code className="text-slate-200">Auto-Build All Scenes & Weather</code>, then build ARM64 IL2CPP for your vivo T3x.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

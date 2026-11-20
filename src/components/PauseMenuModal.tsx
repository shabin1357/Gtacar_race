import {
  Car,
  CloudRain,
  Download,
  Flag,
  FolderCode,
  Play,
  RotateCcw,
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
  TIME_PRESETS,
  UNDERGLOW_OPTIONS,
  VEHICLE_SPECS,
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
  const selectedVehicle =
    VEHICLE_SPECS.find((v) => v.id === customization.vehicleId) ?? VEHICLE_SPECS[1];

  const tabs: { id: PauseTab; label: string; icon: typeof Flag }[] = [
    { id: 'modes', label: 'Drive Modes', icon: Flag },
    { id: 'garage', label: 'Garage (10)', icon: Car },
    { id: 'weather', label: 'Weather & Graphics', icon: CloudRain },
    { id: 'unity', label: 'Unity 6 Android', icon: FolderCode },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6">
      <div className="w-full max-w-5xl bg-[#090d16] border border-white/15 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
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
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-white/10 overflow-x-auto">
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
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'modes' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'freeroam' as GameMode,
                    title: 'Open-World Free Roam',
                    desc: 'Explore all 10 coastal districts, Ocean Drive, Airport, and Bay Bridge with dynamic VCPD patrols.',
                  },
                  {
                    id: 'mission' as GameMode,
                    title: 'Getaway Contract',
                    desc: 'Timed 3-stage pursuit escape from Industrial Docks to Airport Hangar and Bay Bridge ($4,500 payout).',
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
                    desc: 'Head-to-head street race against 3 rival cars through Downtown, Industrial Highway, and Ocean Drive.',
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
                  Controls: WASD / Arrows drive · Space handbrake · Shift nitro · C camera · M map · R reset car
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
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              {/* All 10 Vehicle Classes */}
              <div>
                <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-2.5">
                  All Cars Pack — Select Vehicle Class
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_SPECS.map((v) => {
                    const selected = v.id === customization.vehicleId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onUpdateCustomization({ vehicleId: v.id })}
                        className={`p-3 rounded-lg text-left border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-sky-500/15 border-sky-400 text-white'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold">{v.name}</span>
                          <span className="font-hud text-[11px] text-sky-400">
                            {v.maxSpeedKph} km/h
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{v.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Vehicle Specs & Visual Customization */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-base font-semibold text-white">
                      {selectedVehicle.name}
                    </h3>
                    <span className="text-xs font-hud text-slate-400">
                      {selectedVehicle.mass} kg
                    </span>
                  </div>

                  {[
                    { label: 'Top Speed', value: `${selectedVehicle.maxSpeedKph} km/h`, pct: (selectedVehicle.maxSpeedKph / 380) * 100 },
                    { label: 'Acceleration', value: `${selectedVehicle.acceleration}`, pct: (selectedVehicle.acceleration / 3100) * 100 },
                    { label: 'Braking', value: `${selectedVehicle.brakeForce}`, pct: (selectedVehicle.brakeForce / 4300) * 100 },
                    { label: 'Tire Grip', value: `${selectedVehicle.grip.toFixed(2)}`, pct: (selectedVehicle.grip / 1.4) * 100 },
                    { label: 'Off-Road', value: `${Math.round(selectedVehicle.offRoadCapability * 100)}%`, pct: selectedVehicle.offRoadCapability * 100 },
                  ].map((stat) => (
                    <div key={stat.label} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-hud">
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

                {/* Paint Swatches */}
                <div>
                  <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-2">
                    Metallic Paint
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CAR_PAINTS.map((paint) => (
                      <button
                        key={paint.id}
                        type="button"
                        onClick={() => onUpdateCustomization({ paintId: paint.id })}
                        title={paint.name}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                          customization.paintId === paint.id
                            ? 'border-white scale-110'
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
                    <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                      Alloy Rims
                    </div>
                    <div className="flex gap-1.5">
                      {RIM_FINISHES.map((rim) => (
                        <button
                          key={rim.id}
                          type="button"
                          onClick={() => onUpdateCustomization({ rimId: rim.id })}
                          title={rim.name}
                          className={`w-7 h-7 rounded-md border cursor-pointer ${
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
                    <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                      Underglow
                    </div>
                    <div className="flex gap-1.5">
                      {UNDERGLOW_OPTIONS.map((ug) => (
                        <button
                          key={ug.id}
                          type="button"
                          onClick={() => onUpdateCustomization({ underglowId: ug.id })}
                          title={ug.name}
                          className={`w-7 h-7 rounded-md border cursor-pointer ${
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
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                      ECU Tune
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onUpdateCustomization({ engineLevel: lvl })}
                          className={`py-1.5 rounded text-xs font-hud font-semibold border cursor-pointer ${
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
                    <div className="text-[11px] font-hud uppercase tracking-widest text-slate-400 mb-1.5">
                      Tire Compound
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onUpdateCustomization({ gripLevel: lvl })}
                          className={`py-1.5 rounded text-xs font-hud font-semibold border cursor-pointer ${
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
                    Unity 6 URP Android Source Pack (C#)
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Includes all C# scripts for Vehicle Physics, All 10 Cars Pack Generator, Traffic & Police AI,
                    all 8 Weather & 24h Lighting controllers, Mobile Touch UI, SaveSystem, and 1-click Editor Auto-Setup.
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
                    Included C# Architecture
                  </div>
                  <div>OpenWorldCarChase/Assets/Scripts/Vehicle/ (CarController, CarPhysics, CarCamera + All 10 Cars Pack)</div>
                  <div>OpenWorldCarChase/Assets/Scripts/AI/ (TrafficAI, PoliceAI)</div>
                  <div>OpenWorldCarChase/Assets/Scripts/World/ (WeatherManager, DayNightManager, RainController, FogController, LightningController, StreetLightController, VehicleWeatherEffects)</div>
                  <div>OpenWorldCarChase/Assets/Scripts/UI/ (MobileControls, MiniMap, GameManager, WeatherSettingsUI)</div>
                  <div>OpenWorldCarChase/Assets/Editor/ (ProjectVelocityAutoSetup, VehiclePackGenerator)</div>
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
                    run <code className="text-slate-200">Project Velocity → Auto-Build All Scenes & Weather</code>, and build
                    for ARM64 IL2CPP to profile on your vivo T3x.
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

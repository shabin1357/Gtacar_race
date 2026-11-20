import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { InteractiveMapModal } from './components/InteractiveMapModal';
import { PauseMenuModal, PauseTab } from './components/PauseMenuModal';
import { ViceRunEngine } from './game/engine';
import { DEFAULT_SAVE } from './game/saveSystem';
import {
  CameraMode,
  CustomizationState,
  formatTime24,
  GameMode,
  GraphicsQuality,
  HudSnapshot,
  TouchInputState,
  WeatherCondition,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  vehicleName: 'Pegassi Ignus',
  speedMph: 0,
  speedKph: 0,
  rpmRatio: 0.14,
  gear: 1,
  nitro: 100,
  health: 100,
  wantedLevel: 1,
  heatProgress: 0,
  evadeProgress: 0,
  isEvading: false,
  bustProgress: 0,
  score: 0,
  bankCash: DEFAULT_SAVE.bankCash,
  takedowns: 0,
  topSpeedMph: 0,
  chaseSeconds: 0,
  airTimeBest: 0,
  activeCops: 0,
  district: 'Ocean Drive',
  weather: DEFAULT_SAVE.weather,
  weatherLabel: 'Light Rain',
  timeOfDayHours: DEFAULT_SAVE.timeOfDayHours,
  timeFormatted: formatTime24(DEFAULT_SAVE.timeOfDayHours),
  isDrifting: false,
  isBoosting: false,
  isAirborne: false,
  fps: 60,
  alert: null,
  playerX: 200,
  playerZ: 110,
  playerRotY: Math.PI,
  units: [],
  repairs: [],
  ramps: [],
  gps: null,
  mission: {
    mode: 'freeroam',
    title: 'Free Roam',
    objective: 'Explore 10 coastal districts or evade VCPD',
    checkpointIndex: 0,
    totalCheckpoints: 0,
    timerSeconds: 0,
    racePosition: 1,
    totalRacers: 1,
    bestTimeTrialSeconds: null,
  },
};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ViceRunEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [customization, setCustomization] = useState<CustomizationState>(DEFAULT_SAVE.customization);
  const [weather, setWeather] = useState<WeatherCondition>(DEFAULT_SAVE.weather);
  const [weatherIntensity, setWeatherIntensity] = useState<number>(DEFAULT_SAVE.weatherIntensity);
  const [autoWeather, setAutoWeather] = useState<boolean>(DEFAULT_SAVE.autoWeather);
  const [timeOfDayHours, setTimeOfDayHours] = useState<number>(DEFAULT_SAVE.timeOfDayHours);
  const [autoDayNight, setAutoDayNight] = useState<boolean>(DEFAULT_SAVE.autoDayNight);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(DEFAULT_SAVE.graphicsQuality);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [muted, setMuted] = useState<boolean>(false);
  const [hideHud, setHideHud] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [activeShowcaseId, setActiveShowcaseId] = useState<string>('neon_rain');

  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  const [mapOpen, setMapOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [menuTab, setMenuTab] = useState<PauseTab>('weather');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const engine = new ViceRunEngine(
      el,
      (snapshot) => {
        setHud(snapshot);
        setWeather(snapshot.weather);
        setTimeOfDayHours(snapshot.timeOfDayHours);
      },
      (lost) => setContextLost(lost)
    );
    engineRef.current = engine;

    const profile = engine.getInitialProfile();
    setCustomization(profile.customization);
    setWeather(profile.weather);
    setWeatherIntensity(profile.weatherIntensity);
    setAutoWeather(profile.autoWeather);
    setTimeOfDayHours(profile.timeOfDayHours);
    setAutoDayNight(profile.autoDayNight);
    setGraphicsQuality(profile.graphicsQuality);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keep engine pause state synchronized whenever a modal is open
  useEffect(() => {
    engineRef.current?.setPaused(menuOpen || mapOpen);
  }, [menuOpen, mapOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (mapOpen) {
          setMapOpen(false);
        } else {
          setMenuOpen((prev) => !prev);
        }
        return;
      }
      if (e.code === 'KeyM') {
        setMenuOpen(false);
        setMapOpen((prev) => !prev);
        return;
      }
      if (menuOpen || mapOpen) return;

      if (e.code === 'KeyC') {
        const next = engineRef.current?.cycleCameraMode();
        if (next) setCameraMode(next);
      } else if (e.code === 'KeyR') {
        engineRef.current?.respawnOnRoad();
      } else if (e.code === 'KeyH') {
        setHideHud((prev) => !prev);
      } else if (e.code === 'KeyV') {
        setMuted((prev) => {
          const next = !prev;
          engineRef.current?.setMuted(next);
          return next;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapOpen, menuOpen]);

  const handleStartDrive = useCallback(() => {
    setMenuOpen(false);
    setMapOpen(false);
    engineRef.current?.startGame();
  }, []);

  const handleRestartDrive = useCallback(() => {
    setMenuOpen(false);
    setMapOpen(false);
    engineRef.current?.restartGame();
  }, []);

  const handleOpenMenu = useCallback((tab: PauseTab = 'weather') => {
    setMapOpen(false);
    setMenuTab(tab);
    setMenuOpen(true);
  }, []);

  const handleOpenMap = useCallback(() => {
    setMenuOpen(false);
    setMapOpen(true);
  }, []);

  const handleCycleCamera = useCallback(() => {
    const next = engineRef.current?.cycleCameraMode();
    if (next) setCameraMode(next);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleTouchChange = useCallback((partial: Partial<TouchInputState>) => {
    engineRef.current?.setTouchInput(partial);
  }, []);

  const handleApplyShowcase = useCallback(
    (id: string, w: WeatherCondition, hours: number, intensity: number) => {
      setActiveShowcaseId(id);
      setWeather(w);
      setTimeOfDayHours(hours);
      setWeatherIntensity(intensity);
      engineRef.current?.setWeather(w);
      engineRef.current?.setTimeOfDayHours(hours);
      engineRef.current?.setWeatherIntensity(intensity);
    },
    []
  );

  const handleSelectMode = useCallback((mode: GameMode) => {
    if (hud.phase === 'title') {
      engineRef.current?.startGame(mode);
    } else {
      engineRef.current?.startGameMode(mode);
    }
  }, [hud.phase]);

  const handleUpdateCustomization = useCallback((partial: Partial<CustomizationState>) => {
    const updated = engineRef.current?.updateCustomization(partial);
    if (updated) setCustomization(updated);
  }, []);

  const handleWeatherChange = useCallback((w: WeatherCondition) => {
    setWeather(w);
    engineRef.current?.setWeather(w);
  }, []);

  const handleWeatherIntensityChange = useCallback((val: number) => {
    setWeatherIntensity(val);
    engineRef.current?.setWeatherIntensity(val);
  }, []);

  const handleAutoWeatherChange = useCallback((enabled: boolean) => {
    setAutoWeather(enabled);
    engineRef.current?.setAutoWeather(enabled);
  }, []);

  const handleTimeOfDayChange = useCallback((hours: number) => {
    setTimeOfDayHours(hours);
    engineRef.current?.setTimeOfDayHours(hours);
  }, []);

  const handleAutoDayNightChange = useCallback((enabled: boolean) => {
    setAutoDayNight(enabled);
    engineRef.current?.setAutoDayNight(enabled);
  }, []);

  const handleGraphicsQualityChange = useCallback((q: GraphicsQuality) => {
    setGraphicsQuality(q);
    engineRef.current?.setGraphicsQuality(q);
  }, []);

  const handleSetGps = useCallback((x: number, z: number, label: string) => {
    engineRef.current?.setGpsWaypoint(x, z, label);
    setMapOpen(false);
  }, []);

  const handleClearGps = useCallback(() => {
    engineRef.current?.clearGpsWaypoint();
  }, []);

  const handleFastTravel = useCallback((x: number, z: number, label: string, rotY?: number) => {
    engineRef.current?.teleportToLocation(x, z, label, rotY);
    setMapOpen(false);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#090b10]">
      {/* Fullscreen WebGL 3D World Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Main Minimalist HUD / Title Overlay */}
      <GameHUD
        hud={hud}
        cameraMode={cameraMode}
        muted={muted}
        hideHud={hideHud}
        showTouchControls={showTouchControls}
        activeShowcaseId={activeShowcaseId}
        onStartDrive={handleStartDrive}
        onRestartDrive={handleRestartDrive}
        onOpenMenu={handleOpenMenu}
        onOpenMap={handleOpenMap}
        onCycleCamera={handleCycleCamera}
        onToggleMute={handleToggleMute}
        onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
        onTouchChange={handleTouchChange}
        onApplyShowcase={handleApplyShowcase}
      />

      {/* Fullscreen Topographical Solara State Atlas Map Modal */}
      {mapOpen && (
        <InteractiveMapModal
          hud={hud}
          onClose={() => setMapOpen(false)}
          onSetGps={handleSetGps}
          onClearGps={handleClearGps}
          onFastTravel={handleFastTravel}
        />
      )}

      {/* 4-Tab Pause / Garage / Weather & Graphics / Unity 6 Pack Modal */}
      {menuOpen && (
        <PauseMenuModal
          activeTab={menuTab}
          onTabChange={setMenuTab}
          hud={hud}
          customization={customization}
          weather={weather}
          weatherIntensity={weatherIntensity}
          autoWeather={autoWeather}
          timeOfDayHours={timeOfDayHours}
          autoDayNight={autoDayNight}
          graphicsQuality={graphicsQuality}
          showTouchControls={showTouchControls}
          onResume={() => setMenuOpen(false)}
          onSelectMode={handleSelectMode}
          onRespawn={() => engineRef.current?.respawnOnRoad()}
          onUpdateCustomization={handleUpdateCustomization}
          onWeatherChange={handleWeatherChange}
          onWeatherIntensityChange={handleWeatherIntensityChange}
          onAutoWeatherChange={handleAutoWeatherChange}
          onTimeOfDayChange={handleTimeOfDayChange}
          onAutoDayNightChange={handleAutoDayNightChange}
          onGraphicsQualityChange={handleGraphicsQualityChange}
          onToggleTouchControls={setShowTouchControls}
        />
      )}

      {/* WebGL Context Lost Recovery Notice */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6">
          <div className="max-w-sm bg-[#090d16] border border-white/15 rounded-xl p-5 text-center">
            <h2 className="font-display text-lg font-bold text-white">Graphics Context Paused</h2>
            <p className="mt-1.5 text-xs text-slate-400">
              Your GPU context was temporarily interrupted. Restoring the 3D scene automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

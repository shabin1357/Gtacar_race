import {
  CAR_PAINTS,
  CustomizationState,
  GraphicsQuality,
  VEHICLE_SPECS,
  WEATHER_OPTIONS,
  WeatherCondition,
} from './types';

export interface SavedProfile {
  bankCash: number;
  bestTimeTrialSeconds: number | null;
  totalTakedowns: number;
  customization: CustomizationState;
  graphicsQuality: GraphicsQuality;
  weather: WeatherCondition;
  weatherIntensity: number;
  autoWeather: boolean;
  timeOfDayHours: number;
  autoDayNight: boolean;
}

const STORAGE_KEY = 'project_velocity_save_v3';

export const DEFAULT_SAVE: SavedProfile = {
  bankCash: 25000,
  bestTimeTrialSeconds: null,
  totalTakedowns: 0,
  customization: {
    vehicleId: 'Supercar',
    paintId: 'alpine_blue',
    rimId: 'silver',
    underglowId: 'off',
    engineLevel: 1,
    gripLevel: 1,
  },
  graphicsQuality: 'high',
  weather: 'light_rain',
  weatherIntensity: 0.75,
  autoWeather: false,
  timeOfDayHours: 20.4, // Vibrant wet neon dusk/night matching reference screenshots
  autoDayNight: false,
};

export function loadSavedProfile(): SavedProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<SavedProfile>;
    const mergedCust: CustomizationState = {
      ...DEFAULT_SAVE.customization,
      ...(parsed.customization ?? {}),
    };
    if (!VEHICLE_SPECS.some((v) => v.id === mergedCust.vehicleId)) {
      mergedCust.vehicleId = 'Supercar';
    }
    if (!CAR_PAINTS.some((p) => p.id === mergedCust.paintId)) {
      mergedCust.paintId = 'alpine_blue';
    }
    const validWeather = WEATHER_OPTIONS.some((w) => w.id === parsed.weather)
      ? (parsed.weather as WeatherCondition)
      : DEFAULT_SAVE.weather;

    return {
      ...DEFAULT_SAVE,
      ...parsed,
      weather: validWeather,
      weatherIntensity:
        typeof parsed.weatherIntensity === 'number'
          ? Math.max(0.1, Math.min(1.0, parsed.weatherIntensity))
          : DEFAULT_SAVE.weatherIntensity,
      timeOfDayHours:
        typeof parsed.timeOfDayHours === 'number'
          ? ((parsed.timeOfDayHours % 24) + 24) % 24
          : DEFAULT_SAVE.timeOfDayHours,
      customization: mergedCust,
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function writeSavedProfile(profile: SavedProfile): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota restrictions
  }
}

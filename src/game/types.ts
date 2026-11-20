export type WeatherCondition =
  | 'sunny'
  | 'partly_cloudy'
  | 'overcast'
  | 'light_rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'fog'
  | 'heavy_fog'
  | 'windy'
  | 'clear_night';

export interface WeatherMeta {
  id: WeatherCondition;
  label: string;
  shortLabel: string;
  rainFactor: number;
  fogBoost: number;
  cloudCoverage: number;
  cloudDarkness: number;
  windFactor: number;
  wetnessTarget: number;
  hasLightning: boolean;
}

export const WEATHER_OPTIONS: WeatherMeta[] = [
  { id: 'sunny', label: 'Sunny', shortLabel: 'Sunny', rainFactor: 0, fogBoost: 0.72, cloudCoverage: 0.24, cloudDarkness: 0.0, windFactor: 0.15, wetnessTarget: 0.08, hasLightning: false },
  { id: 'partly_cloudy', label: 'Partly Cloudy', shortLabel: 'Cloudy', rainFactor: 0, fogBoost: 0.9, cloudCoverage: 0.48, cloudDarkness: 0.12, windFactor: 0.25, wetnessTarget: 0.22, hasLightning: false },
  { id: 'overcast', label: 'Overcast', shortLabel: 'Overcast', rainFactor: 0, fogBoost: 1.25, cloudCoverage: 0.82, cloudDarkness: 0.42, windFactor: 0.35, wetnessTarget: 0.35, hasLightning: false },
  { id: 'light_rain', label: 'Light Rain', shortLabel: 'Light Rain', rainFactor: 0.48, fogBoost: 1.45, cloudCoverage: 0.78, cloudDarkness: 0.52, windFactor: 0.45, wetnessTarget: 0.88, hasLightning: false },
  { id: 'heavy_rain', label: 'Heavy Rain', shortLabel: 'Heavy Rain', rainFactor: 0.92, fogBoost: 1.85, cloudCoverage: 0.92, cloudDarkness: 0.72, windFactor: 0.68, wetnessTarget: 1.0, hasLightning: false },
  { id: 'thunderstorm', label: 'Thunderstorm', shortLabel: 'Storm', rainFactor: 1.0, fogBoost: 2.15, cloudCoverage: 0.98, cloudDarkness: 0.86, windFactor: 0.95, wetnessTarget: 1.0, hasLightning: true },
  { id: 'fog', label: 'Fog', shortLabel: 'Fog', rainFactor: 0, fogBoost: 3.1, cloudCoverage: 0.7, cloudDarkness: 0.32, windFactor: 0.12, wetnessTarget: 0.52, hasLightning: false },
  { id: 'heavy_fog', label: 'Heavy Fog', shortLabel: 'Dense Fog', rainFactor: 0, fogBoost: 5.4, cloudCoverage: 0.88, cloudDarkness: 0.46, windFactor: 0.1, wetnessTarget: 0.65, hasLightning: false },
  { id: 'windy', label: 'Windy', shortLabel: 'Windy', rainFactor: 0, fogBoost: 1.05, cloudCoverage: 0.56, cloudDarkness: 0.2, windFactor: 1.0, wetnessTarget: 0.12, hasLightning: false },
  { id: 'clear_night', label: 'Clear Night', shortLabel: 'Clear Night', rainFactor: 0, fogBoost: 0.95, cloudCoverage: 0.14, cloudDarkness: 0.1, windFactor: 0.15, wetnessTarget: 0.42, hasLightning: false },
];

export type TimeOfDayPresetId =
  | 'sunrise'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'golden_hour'
  | 'sunset'
  | 'dusk'
  | 'night'
  | 'midnight';

export interface TimePreset {
  id: TimeOfDayPresetId;
  label: string;
  hour24: number;
}

export const TIME_PRESETS: TimePreset[] = [
  { id: 'sunrise', label: 'Sunrise', hour24: 6.2 },
  { id: 'morning', label: 'Morning', hour24: 9.25 },
  { id: 'noon', label: 'Noon', hour24: 12.5 },
  { id: 'afternoon', label: 'Afternoon', hour24: 15.25 },
  { id: 'golden_hour', label: 'Golden Hour', hour24: 17.65 },
  { id: 'sunset', label: 'Sunset', hour24: 18.65 },
  { id: 'dusk', label: 'Dusk', hour24: 19.65 },
  { id: 'night', label: 'Night', hour24: 21.8 },
  { id: 'midnight', label: 'Midnight', hour24: 0.5 },
];

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type CameraMode = 'chase' | 'close' | 'cockpit' | 'hood' | 'cinematic';

export type GameMode = 'freeroam' | 'mission' | 'timetrial' | 'race';

export type GamePhase = 'title' | 'playing' | 'busted' | 'wrecked';

export type VehicleClassId =
  | 'SportsCar'
  | 'Supercar'
  | 'Hypercar'
  | 'MuscleCar'
  | 'SUV'
  | 'Sedan'
  | 'OffRoad4x4'
  | 'PickupTruck'
  | 'PoliceCar'
  | 'RaceCar';

export interface VehicleSpec {
  id: VehicleClassId;
  name: string;
  category: string;
  // Exact stats from Project Velocity All Cars Pack
  maxSpeedKph: number;
  acceleration: number;
  brakeForce: number;
  steeringAngle: number;
  mass: number;
  grip: number;
  offRoadCapability: number;
  length: number;
  width: number;
  height: number;
  // Derived simulation helpers
  topSpeedMph: number;
  accelUnits: number;
  brakeUnits: number;
  maxSpeedUnits: number;
  boostMaxSpeedUnits: number;
  gripUnits: number;
  driftGripUnits: number;
  turnRate: number;
  ramMass: number;
}

function makeVehicleSpec(
  id: VehicleClassId,
  name: string,
  category: string,
  maxSpeedKph: number,
  acceleration: number,
  brakeForce: number,
  steeringAngle: number,
  mass: number,
  grip: number,
  offRoadCapability: number,
  length: number,
  width: number,
  height: number
): VehicleSpec {
  const topSpeedMph = Math.round(maxSpeedKph * 0.621371);
  const maxSpeedUnits = (maxSpeedKph / 3.6) * 0.84;
  const boostMaxSpeedUnits = maxSpeedUnits * 1.24;
  const accelUnits = 16 + (acceleration / 3100) * 32;
  const brakeUnits = 34 + (brakeForce / 4300) * 32;
  const gripUnits = 4.6 + grip * 3.4;
  const driftGripUnits = 1.15 + grip * 0.58;
  const turnRate = 2.0 + (steeringAngle / 34) * 1.05;
  const ramMass = mass / 1450;

  return {
    id,
    name,
    category,
    maxSpeedKph,
    acceleration,
    brakeForce,
    steeringAngle,
    mass,
    grip,
    offRoadCapability,
    length,
    width,
    height,
    topSpeedMph,
    accelUnits,
    brakeUnits,
    maxSpeedUnits,
    boostMaxSpeedUnits,
    gripUnits,
    driftGripUnits,
    turnRate,
    ramMass,
  };
}

export const VEHICLE_SPECS: VehicleSpec[] = [
  makeVehicleSpec('SportsCar', 'Sports Car', 'Street Coupe', 230, 1900, 3400, 32, 1350, 1.15, 0.15, 4.4, 1.9, 1.15),
  makeVehicleSpec('Supercar', 'Supercar', 'Exotic GT', 320, 2600, 3900, 29, 1450, 1.25, 0.05, 4.6, 2.0, 1.15),
  makeVehicleSpec('Hypercar', 'Hypercar', 'Apex Prototype', 380, 3100, 4300, 27, 1550, 1.30, 0.02, 4.8, 2.05, 1.10),
  makeVehicleSpec('MuscleCar', 'Muscle Car', 'V8 Supercharged', 210, 2300, 3200, 28, 1750, 0.95, 0.10, 4.9, 2.0, 1.35),
  makeVehicleSpec('SUV', 'SUV', 'Performance Utility', 190, 1700, 3600, 30, 2200, 0.90, 0.45, 4.8, 2.0, 1.75),
  makeVehicleSpec('Sedan', 'Sedan', 'Executive Saloon', 200, 1600, 3300, 32, 1550, 1.00, 0.12, 4.7, 1.85, 1.40),
  makeVehicleSpec('OffRoad4x4', 'Off-Road 4x4', 'All-Terrain Trail', 170, 1800, 3700, 34, 2350, 0.85, 0.95, 4.6, 2.0, 1.80),
  makeVehicleSpec('PickupTruck', 'Pickup Truck', 'Heavy Hauler', 180, 1750, 3600, 30, 2250, 0.90, 0.70, 5.3, 2.0, 1.80),
  makeVehicleSpec('PoliceCar', 'Police Car', 'VCPD Interceptor', 220, 2000, 3900, 33, 1650, 1.05, 0.20, 4.8, 1.95, 1.45),
  makeVehicleSpec('RaceCar', 'Race Car', 'GT3 Track Spec', 290, 2800, 4200, 25, 1150, 1.40, 0.01, 4.5, 2.0, 1.00),
];

export interface CarPaintOption {
  id: string;
  name: string;
  hex: number;
  css: string;
  metalness: number;
  roughness: number;
  accentHex: number;
}

export const CAR_PAINTS: CarPaintOption[] = [
  {
    id: 'alpine_blue',
    name: 'Solar Alpine Blue',
    hex: 0x0d74c8,
    css: '#0d74c8',
    metalness: 0.82,
    roughness: 0.14,
    accentHex: 0x38bdf8,
  },
  {
    id: 'corsa_red',
    name: 'Corsa Crimson',
    hex: 0xd91c2b,
    css: '#d91c2b',
    metalness: 0.74,
    roughness: 0.15,
    accentHex: 0xfef08a,
  },
  {
    id: 'obsidian',
    name: 'Vice Obsidian',
    hex: 0x151820,
    css: '#1c2230',
    metalness: 0.88,
    roughness: 0.18,
    accentHex: 0xff4d8d,
  },
  {
    id: 'pearl',
    name: 'Miami Silver Pearl',
    hex: 0xe6ebf2,
    css: '#e6ebf2',
    metalness: 0.58,
    roughness: 0.13,
    accentHex: 0xef4444,
  },
  {
    id: 'teal',
    name: 'Bayshore Teal',
    hex: 0x06b6a4,
    css: '#06b6a4',
    metalness: 0.78,
    roughness: 0.16,
    accentHex: 0xff4d8d,
  },
  {
    id: 'gold',
    name: 'Leonida Gold',
    hex: 0xf59e0b,
    css: '#f59e0b',
    metalness: 0.86,
    roughness: 0.16,
    accentHex: 0x111827,
  },
];

export interface RimFinishOption {
  id: string;
  name: string;
  hex: number;
  css: string;
}

export const RIM_FINISHES: RimFinishOption[] = [
  { id: 'silver', name: 'Brushed Alloy', hex: 0xdbe2ec, css: '#dbe2ec' },
  { id: 'stealth', name: 'Stealth Black', hex: 0x1e2430, css: '#1e2430' },
  { id: 'gold', name: 'Motorsport Gold', hex: 0xf59e0b, css: '#f59e0b' },
  { id: 'crimson', name: 'Track Red', hex: 0xef4444, css: '#ef4444' },
];

export interface UnderglowOption {
  id: string;
  name: string;
  enabled: boolean;
  hex: number;
  css: string;
}

export const UNDERGLOW_OPTIONS: UnderglowOption[] = [
  { id: 'off', name: 'Off', enabled: false, hex: 0x000000, css: '#1e293b' },
  { id: 'cyan', name: 'Electric Cyan', enabled: true, hex: 0x38bdf8, css: '#38bdf8' },
  { id: 'pink', name: 'Vice Magenta', enabled: true, hex: 0xff4d8d, css: '#ff4d8d' },
  { id: 'emerald', name: 'Neon Mint', enabled: true, hex: 0x10b981, css: '#10b981' },
  { id: 'amber', name: 'Solar Amber', enabled: true, hex: 0xf59e0b, css: '#f59e0b' },
];

export interface CustomizationState {
  vehicleId: VehicleClassId;
  paintId: string;
  rimId: string;
  underglowId: string;
  engineLevel: number;
  gripLevel: number;
}

export interface BuildingCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  district: string;
}

export interface JumpRamp {
  x: number;
  z: number;
  rotY: number;
  width: number;
  length: number;
  height: number;
}

export interface RepairStation {
  id: string;
  x: number;
  z: number;
  rotY: number;
  radius: number;
  cooldown: number;
}

export interface PickupItem {
  id: string;
  x: number;
  z: number;
  type: 'cash' | 'nitro';
  active: boolean;
  respawnTimer: number;
}

export interface MinimapUnit {
  x: number;
  z: number;
  rotY: number;
  type: 'police' | 'swat' | 'civilian' | 'racer';
  disabled?: boolean;
}

export interface PursuitAlert {
  id: number;
  title: string;
  subtitle: string;
  accent: 'gold' | 'cyan' | 'red' | 'emerald';
}

export interface GpsTarget {
  x: number;
  z: number;
  label: string;
  distanceMeters: number;
  relativeAngleRad: number;
}

export interface MissionHudInfo {
  mode: GameMode;
  title: string;
  objective: string;
  checkpointIndex: number;
  totalCheckpoints: number;
  timerSeconds: number;
  racePosition: number;
  totalRacers: number;
  bestTimeTrialSeconds: number | null;
}

export interface HudSnapshot {
  phase: GamePhase;
  vehicleName: string;
  speedMph: number;
  speedKph: number;
  rpmRatio: number;
  gear: number;
  nitro: number;
  health: number;
  wantedLevel: number;
  heatProgress: number;
  evadeProgress: number;
  isEvading: boolean;
  bustProgress: number;
  score: number;
  bankCash: number;
  takedowns: number;
  topSpeedMph: number;
  chaseSeconds: number;
  airTimeBest: number;
  activeCops: number;
  district: string;
  weather: WeatherCondition;
  weatherLabel: string;
  timeOfDayHours: number;
  timeFormatted: string;
  isDrifting: boolean;
  isBoosting: boolean;
  isAirborne: boolean;
  fps: number;
  alert: PursuitAlert | null;
  playerX: number;
  playerZ: number;
  playerRotY: number;
  units: MinimapUnit[];
  repairs: { x: number; z: number; ready: boolean }[];
  ramps: { x: number; z: number }[];
  gps: GpsTarget | null;
  mission: MissionHudInfo;
}

export interface TouchInputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
}

export function formatTime24(hours: number): string {
  const norm = ((hours % 24) + 24) % 24;
  const h = Math.floor(norm);
  const m = Math.floor((norm - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

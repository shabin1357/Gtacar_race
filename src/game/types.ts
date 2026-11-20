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

export type ShowroomCategory =
  | 'hyper_super'
  | 'sports_tuner'
  | 'muscle_classic'
  | 'suv_utility'
  | 'service_special';

export type VehicleBodyStyle =
  | 'coupe'
  | 'widebody'
  | 'supercar'
  | 'hypercar'
  | 'wedge'
  | 'lemans'
  | 'speedster'
  | 'cabrio'
  | 'roadster'
  | 'muscle'
  | 'sedan'
  | 'vintage_artdeco'
  | 'vintage_cruiser'
  | 'wagon'
  | 'minivan'
  | 'suv'
  | 'hummer_4x4'
  | 'trail_4x4'
  | 'open_pickup'
  | 'police'
  | 'ranger_suv'
  | 'taxi';

export type VehicleLivery =
  | 'none'
  | 'twin_stripes'
  | 'center_wedge'
  | 'side_accent'
  | 'police_bw'
  | 'ranger_green'
  | 'taxi_yellow_blue'
  | 'woodgrain'
  | 'two_tone_fenders';

export interface VehicleThumbnail {
  sheet: 'grid20' | 'dealer18';
  col: number;
  row: number;
}

export type VehicleClassId =
  // 18 Legendary Dealership Vehicles (Image 2)
  | 'BuffaloEVX'
  | 'ItaliGTOStinger'
  | 'OcelotVirtue'
  | 'ToundraPanthere'
  | 'ClassiqueBroadway'
  | 'Annis300R'
  | 'OverflodEntityMT'
  | 'Obey10F'
  | 'BenefactorSM722'
  | 'PegassiToreroXO'
  | 'LampadatiCorsita'
  | 'BenefactorLM87'
  | 'CometS2Cabrio'
  | 'OverflodZeno'
  | 'PegassiIgnus'
  | 'DewbaucheeChampion'
  | 'UbermachtCypher'
  | 'PfisterGrowler'
  // 20 Open-World Fleet Vehicles (Image 1)
  | 'FeltzerGT'
  | 'CometTurbo'
  | 'BodhiPickup'
  | 'BansheeV10'
  | 'BulletGT'
  | 'CheetahCorsa'
  | 'BuffaloS'
  | 'MesaTrail4x4'
  | 'MinivanMPV'
  | 'AdderW16'
  | 'SabreTurbo'
  | 'PatriotH2'
  | 'PoliceCruiser'
  | 'VolticRoadster'
  | 'ParkRangerSUV'
  | 'StallionFastback'
  | 'ZType1938'
  | 'ReginaEstate'
  | 'OsirisCarbon'
  | 'DowntownCab';

export interface VehicleSpec {
  id: VehicleClassId;
  name: string;
  category: string;
  showroomGroup: ShowroomCategory;
  price: number;
  bodyStyle: VehicleBodyStyle;
  livery: VehicleLivery;
  defaultPaintId: string;
  defaultAccentHex: number;
  thumbnail: VehicleThumbnail;
  // Physics stats
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

interface VehicleSpecInput {
  id: VehicleClassId;
  name: string;
  category: string;
  showroomGroup: ShowroomCategory;
  price: number;
  bodyStyle: VehicleBodyStyle;
  livery: VehicleLivery;
  defaultPaintId: string;
  defaultAccentHex: number;
  thumbnail: VehicleThumbnail;
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
}

function makeVehicleSpec(input: VehicleSpecInput): VehicleSpec {
  const topSpeedMph = Math.round(input.maxSpeedKph * 0.621371);
  const maxSpeedUnits = (input.maxSpeedKph / 3.6) * 0.84;
  const boostMaxSpeedUnits = maxSpeedUnits * 1.24;
  const accelUnits = 16 + (input.acceleration / 3200) * 33;
  const brakeUnits = 34 + (input.brakeForce / 4400) * 32;
  const gripUnits = 4.6 + input.grip * 3.4;
  const driftGripUnits = 1.15 + input.grip * 0.58;
  const turnRate = 2.0 + (input.steeringAngle / 34) * 1.05;
  const ramMass = input.mass / 1450;

  return {
    ...input,
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

export const SHOWROOM_SHEETS = {
  grid20: '/assets/aistudio/dkx1chd-3093715a-b12c-45f8-97db-b06766abdd25_6ae3d30f.jpg',
  dealer18: '/assets/aistudio/IMG_80a2ea07-3aa7-40f1-a791-c17e3e81733d_1980a178.png',
} as const;

export const VEHICLE_SPECS: VehicleSpec[] = [
  // === 18 DEALERSHIP SHOWROOM CARS (SHEET B) ===
  makeVehicleSpec({
    id: 'PegassiIgnus',
    name: 'Pegassi Ignus',
    category: 'V12 Hypercar',
    showroomGroup: 'hyper_super',
    price: 3000000,
    bodyStyle: 'hypercar',
    livery: 'center_wedge',
    defaultPaintId: 'alpine_blue',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 2, row: 4 },
    maxSpeedKph: 375, acceleration: 3050, brakeForce: 4300, steeringAngle: 28, mass: 1520, grip: 1.36, offRoadCapability: 0.04, length: 4.78, width: 2.08, height: 1.11,
  }),
  makeVehicleSpec({
    id: 'BenefactorSM722',
    name: 'Benefactor SM722',
    category: 'Open Speedster',
    showroomGroup: 'hyper_super',
    price: 3200000,
    bodyStyle: 'speedster',
    livery: 'none',
    defaultPaintId: 'pearl',
    defaultAccentHex: 0x1e293b,
    thumbnail: { sheet: 'dealer18', col: 2, row: 2 },
    maxSpeedKph: 350, acceleration: 2920, brakeForce: 4150, steeringAngle: 30, mass: 1410, grip: 1.28, offRoadCapability: 0.04, length: 4.72, width: 1.98, height: 1.06,
  }),
  makeVehicleSpec({
    id: 'OverflodEntityMT',
    name: 'Overflod Entity MT',
    category: 'Track Hypercar',
    showroomGroup: 'hyper_super',
    price: 3000000,
    bodyStyle: 'hypercar',
    livery: 'center_wedge',
    defaultPaintId: 'acid_lime',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 0, row: 2 },
    maxSpeedKph: 382, acceleration: 3120, brakeForce: 4350, steeringAngle: 27, mass: 1480, grip: 1.38, offRoadCapability: 0.02, length: 4.75, width: 2.06, height: 1.09,
  }),
  makeVehicleSpec({
    id: 'PegassiToreroXO',
    name: 'Pegassi Torero XO',
    category: 'Wedge Hypercar',
    showroomGroup: 'hyper_super',
    price: 2640000,
    bodyStyle: 'wedge',
    livery: 'center_wedge',
    defaultPaintId: 'sunset_orange',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 0, row: 3 },
    maxSpeedKph: 368, acceleration: 2980, brakeForce: 4200, steeringAngle: 28, mass: 1510, grip: 1.32, offRoadCapability: 0.03, length: 4.82, width: 2.08, height: 1.08,
  }),
  makeVehicleSpec({
    id: 'DewbaucheeChampion',
    name: 'Dewbauchee Champion',
    category: 'British V12 GT',
    showroomGroup: 'hyper_super',
    price: 2700000,
    bodyStyle: 'supercar',
    livery: 'center_wedge',
    defaultPaintId: 'solar_yellow',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 0, row: 5 },
    maxSpeedKph: 342, acceleration: 2760, brakeForce: 4050, steeringAngle: 29, mass: 1580, grip: 1.27, offRoadCapability: 0.06, length: 4.74, width: 2.02, height: 1.14,
  }),
  makeVehicleSpec({
    id: 'OcelotVirtue',
    name: 'Ocelot Virtue',
    category: 'EV Hypercar',
    showroomGroup: 'hyper_super',
    price: 2300000,
    bodyStyle: 'hypercar',
    livery: 'none',
    defaultPaintId: 'obsidian',
    defaultAccentHex: 0x38bdf8,
    thumbnail: { sheet: 'dealer18', col: 2, row: 0 },
    maxSpeedKph: 365, acceleration: 3200, brakeForce: 4300, steeringAngle: 30, mass: 1620, grip: 1.35, offRoadCapability: 0.04, length: 4.65, width: 2.04, height: 1.10,
  }),
  makeVehicleSpec({
    id: 'OverflodZeno',
    name: 'Overflod Zeno',
    category: 'Aero Hypercar',
    showroomGroup: 'hyper_super',
    price: 1900000,
    bodyStyle: 'hypercar',
    livery: 'center_wedge',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 1, row: 4 },
    maxSpeedKph: 362, acceleration: 2960, brakeForce: 4220, steeringAngle: 28, mass: 1460, grip: 1.34, offRoadCapability: 0.03, length: 4.76, width: 2.05, height: 1.09,
  }),
  makeVehicleSpec({
    id: 'BenefactorLM87',
    name: 'Benefactor LM87',
    category: 'Le Mans Prototype',
    showroomGroup: 'hyper_super',
    price: 1600000,
    bodyStyle: 'lemans',
    livery: 'none',
    defaultPaintId: 'obsidian',
    defaultAccentHex: 0xef4444,
    thumbnail: { sheet: 'dealer18', col: 2, row: 3 },
    maxSpeedKph: 372, acceleration: 3040, brakeForce: 4400, steeringAngle: 26, mass: 1120, grip: 1.44, offRoadCapability: 0.01, length: 4.75, width: 2.06, height: 1.01,
  }),
  makeVehicleSpec({
    id: 'GrottiItaliGTOStinger' as VehicleClassId,
    name: 'Grotti Itali GTO Stinger',
    category: 'Italian Grand Tourer',
    showroomGroup: 'sports_tuner',
    price: 250000,
    bodyStyle: 'supercar',
    livery: 'none',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0xfef08a,
    thumbnail: { sheet: 'dealer18', col: 1, row: 0 },
    maxSpeedKph: 325, acceleration: 2680, brakeForce: 3950, steeringAngle: 30, mass: 1470, grip: 1.26, offRoadCapability: 0.06, length: 4.65, width: 1.98, height: 1.16,
  }),
  makeVehicleSpec({
    id: 'LampadatiCorsita',
    name: 'Lampadati Corsita',
    category: 'Mid-Engine Exotic',
    showroomGroup: 'sports_tuner',
    price: 220000,
    bodyStyle: 'supercar',
    livery: 'none',
    defaultPaintId: 'acid_lime',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 1, row: 3 },
    maxSpeedKph: 332, acceleration: 2740, brakeForce: 4000, steeringAngle: 30, mass: 1420, grip: 1.29, offRoadCapability: 0.05, length: 4.62, width: 2.0, height: 1.13,
  }),
  makeVehicleSpec({
    id: 'Obey10F',
    name: 'Obey 10F',
    category: 'V10 Supercar',
    showroomGroup: 'sports_tuner',
    price: 180000,
    bodyStyle: 'supercar',
    livery: 'side_accent',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0x14171f,
    thumbnail: { sheet: 'dealer18', col: 1, row: 2 },
    maxSpeedKph: 326, acceleration: 2690, brakeForce: 3980, steeringAngle: 31, mass: 1490, grip: 1.28, offRoadCapability: 0.06, length: 4.56, width: 1.98, height: 1.15,
  }),
  makeVehicleSpec({
    id: 'CometS2Cabrio',
    name: 'Pfister Comet S2 Cabrio',
    category: 'Open-Top Cabriolet',
    showroomGroup: 'sports_tuner',
    price: 170000,
    bodyStyle: 'cabrio',
    livery: 'none',
    defaultPaintId: 'vice_pink',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 0, row: 4 },
    maxSpeedKph: 305, acceleration: 2520, brakeForce: 3850, steeringAngle: 32, mass: 1430, grip: 1.24, offRoadCapability: 0.08, length: 4.52, width: 1.94, height: 1.14,
  }),
  makeVehicleSpec({
    id: 'PfisterGrowler',
    name: 'Pfister Growler',
    category: 'Boxer Track Coupe',
    showroomGroup: 'sports_tuner',
    price: 95000,
    bodyStyle: 'coupe',
    livery: 'none',
    defaultPaintId: 'obsidian',
    defaultAccentHex: 0xf43f5e,
    thumbnail: { sheet: 'dealer18', col: 2, row: 5 },
    maxSpeedKph: 288, acceleration: 2380, brakeForce: 3780, steeringAngle: 33, mass: 1340, grip: 1.25, offRoadCapability: 0.10, length: 4.44, width: 1.90, height: 1.16,
  }),
  makeVehicleSpec({
    id: 'ToundraPanthere',
    name: 'Toundra Panthere',
    category: 'French Sports Coupe',
    showroomGroup: 'sports_tuner',
    price: 65000,
    bodyStyle: 'coupe',
    livery: 'none',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0xe2e8f0,
    thumbnail: { sheet: 'dealer18', col: 0, row: 1 },
    maxSpeedKph: 268, acceleration: 2240, brakeForce: 3650, steeringAngle: 33, mass: 1210, grip: 1.23, offRoadCapability: 0.14, length: 4.35, width: 1.88, height: 1.15,
  }),
  makeVehicleSpec({
    id: 'BuffaloEVX',
    name: 'Bravado Buffalo EVX',
    category: 'Electric Muscle',
    showroomGroup: 'muscle_classic',
    price: 60000,
    bodyStyle: 'muscle',
    livery: 'none',
    defaultPaintId: 'solar_yellow',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 0, row: 0 },
    maxSpeedKph: 274, acceleration: 2780, brakeForce: 3680, steeringAngle: 29, mass: 1890, grip: 1.12, offRoadCapability: 0.12, length: 4.92, width: 2.02, height: 1.32,
  }),
  makeVehicleSpec({
    id: 'UbermachtCypher',
    name: 'Ubermacht Cypher',
    category: 'German Street Tuner',
    showroomGroup: 'sports_tuner',
    price: 55000,
    bodyStyle: 'widebody',
    livery: 'none',
    defaultPaintId: 'burgundy',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'dealer18', col: 1, row: 5 },
    maxSpeedKph: 276, acceleration: 2340, brakeForce: 3720, steeringAngle: 33, mass: 1460, grip: 1.24, offRoadCapability: 0.10, length: 4.50, width: 1.95, height: 1.22,
  }),
  makeVehicleSpec({
    id: 'Annis300R',
    name: 'Annis 300R',
    category: 'JDM Heritage Coupe',
    showroomGroup: 'sports_tuner',
    price: 40000,
    bodyStyle: 'coupe',
    livery: 'none',
    defaultPaintId: 'pearl',
    defaultAccentHex: 0x1e293b,
    thumbnail: { sheet: 'dealer18', col: 2, row: 1 },
    maxSpeedKph: 265, acceleration: 2260, brakeForce: 3620, steeringAngle: 33, mass: 1380, grip: 1.20, offRoadCapability: 0.12, length: 4.46, width: 1.90, height: 1.18,
  }),
  makeVehicleSpec({
    id: 'ClassiqueBroadway',
    name: 'Classique Broadway',
    category: '1940s Classic Cruiser',
    showroomGroup: 'muscle_classic',
    price: 125000,
    bodyStyle: 'vintage_cruiser',
    livery: 'none',
    defaultPaintId: 'royal_blue',
    defaultAccentHex: 0xe2e8f0,
    thumbnail: { sheet: 'dealer18', col: 1, row: 1 },
    maxSpeedKph: 188, acceleration: 1580, brakeForce: 3150, steeringAngle: 31, mass: 1840, grip: 0.94, offRoadCapability: 0.15, length: 5.05, width: 1.98, height: 1.46,
  }),

  // === 20 OPEN-WORLD FLEET VEHICLES (SHEET A — 4x5 GRID) ===
  makeVehicleSpec({
    id: 'FeltzerGT',
    name: 'Feltzer Widebody GT',
    category: 'Widebody Sports',
    showroomGroup: 'sports_tuner',
    price: 145000,
    bodyStyle: 'widebody',
    livery: 'none',
    defaultPaintId: 'sunset_orange',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 0, row: 0 },
    maxSpeedKph: 295, acceleration: 2480, brakeForce: 3820, steeringAngle: 32, mass: 1420, grip: 1.26, offRoadCapability: 0.08, length: 4.55, width: 2.02, height: 1.18,
  }),
  makeVehicleSpec({
    id: 'CometTurbo',
    name: 'Comet Turbo GT',
    category: 'Rear-Engine Sports',
    showroomGroup: 'sports_tuner',
    price: 135000,
    bodyStyle: 'coupe',
    livery: 'none',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 1, row: 0 },
    maxSpeedKph: 302, acceleration: 2540, brakeForce: 3880, steeringAngle: 32, mass: 1370, grip: 1.25, offRoadCapability: 0.09, length: 4.48, width: 1.94, height: 1.16,
  }),
  makeVehicleSpec({
    id: 'BodhiPickup',
    name: 'Bodhi Open-Top 4x4',
    category: 'Classic Utility Pickup',
    showroomGroup: 'suv_utility',
    price: 25000,
    bodyStyle: 'open_pickup',
    livery: 'none',
    defaultPaintId: 'rust_terracotta',
    defaultAccentHex: 0x334155,
    thumbnail: { sheet: 'grid20', col: 2, row: 0 },
    maxSpeedKph: 174, acceleration: 1760, brakeForce: 3450, steeringAngle: 34, mass: 2150, grip: 0.90, offRoadCapability: 0.92, length: 4.95, width: 1.96, height: 1.66,
  }),
  makeVehicleSpec({
    id: 'BansheeV10',
    name: 'Banshee V10 Coupe',
    category: 'Twin-Stripe Sports',
    showroomGroup: 'sports_tuner',
    price: 165000,
    bodyStyle: 'coupe',
    livery: 'twin_stripes',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 3, row: 0 },
    maxSpeedKph: 314, acceleration: 2620, brakeForce: 3900, steeringAngle: 31, mass: 1440, grip: 1.22, offRoadCapability: 0.07, length: 4.62, width: 1.98, height: 1.14,
  }),
  makeVehicleSpec({
    id: 'BulletGT',
    name: 'Bullet Le Mans GT',
    category: 'Classic Wedge Supercar',
    showroomGroup: 'hyper_super',
    price: 240000,
    bodyStyle: 'wedge',
    livery: 'side_accent',
    defaultPaintId: 'alpine_blue',
    defaultAccentHex: 0xf97316,
    thumbnail: { sheet: 'grid20', col: 0, row: 1 },
    maxSpeedKph: 334, acceleration: 2740, brakeForce: 4000, steeringAngle: 29, mass: 1390, grip: 1.28, offRoadCapability: 0.05, length: 4.64, width: 2.02, height: 1.07,
  }),
  makeVehicleSpec({
    id: 'CheetahCorsa',
    name: 'Cheetah Corsa',
    category: 'Mid-Engine Hypercar',
    showroomGroup: 'hyper_super',
    price: 650000,
    bodyStyle: 'hypercar',
    livery: 'center_wedge',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 1, row: 1 },
    maxSpeedKph: 356, acceleration: 2910, brakeForce: 4180, steeringAngle: 29, mass: 1410, grip: 1.33, offRoadCapability: 0.04, length: 4.68, width: 2.04, height: 1.08,
  }),
  makeVehicleSpec({
    id: 'BuffaloS',
    name: 'Buffalo S Sport Sedan',
    category: 'V8 Muscle Sedan',
    showroomGroup: 'muscle_classic',
    price: 96000,
    bodyStyle: 'sedan',
    livery: 'none',
    defaultPaintId: 'sunset_orange',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 2, row: 1 },
    maxSpeedKph: 256, acceleration: 2240, brakeForce: 3550, steeringAngle: 31, mass: 1740, grip: 1.08, offRoadCapability: 0.14, length: 4.90, width: 1.98, height: 1.38,
  }),
  makeVehicleSpec({
    id: 'MesaTrail4x4',
    name: 'Mesa Trail 4x4',
    category: 'Off-Road Wrangler',
    showroomGroup: 'suv_utility',
    price: 45000,
    bodyStyle: 'trail_4x4',
    livery: 'none',
    defaultPaintId: 'matte_charcoal',
    defaultAccentHex: 0x94a3b8,
    thumbnail: { sheet: 'grid20', col: 3, row: 1 },
    maxSpeedKph: 176, acceleration: 1840, brakeForce: 3720, steeringAngle: 34, mass: 2260, grip: 0.90, offRoadCapability: 0.98, length: 4.58, width: 1.98, height: 1.78,
  }),
  makeVehicleSpec({
    id: 'MinivanMPV',
    name: 'Coastal Minivan MPV',
    category: 'Family Utility Van',
    showroomGroup: 'suv_utility',
    price: 30000,
    bodyStyle: 'minivan',
    livery: 'none',
    defaultPaintId: 'slate_grey',
    defaultAccentHex: 0x334155,
    thumbnail: { sheet: 'grid20', col: 0, row: 2 },
    maxSpeedKph: 182, acceleration: 1520, brakeForce: 3350, steeringAngle: 32, mass: 1960, grip: 0.94, offRoadCapability: 0.22, length: 4.92, width: 1.96, height: 1.72,
  }),
  makeVehicleSpec({
    id: 'AdderW16',
    name: 'Adder W16 Hypercar',
    category: 'Twin-Stripe W16',
    showroomGroup: 'hyper_super',
    price: 1000000,
    bodyStyle: 'hypercar',
    livery: 'twin_stripes',
    defaultPaintId: 'pearl',
    defaultAccentHex: 0x0f172a,
    thumbnail: { sheet: 'grid20', col: 1, row: 2 },
    maxSpeedKph: 386, acceleration: 3140, brakeForce: 4320, steeringAngle: 27, mass: 1620, grip: 1.34, offRoadCapability: 0.03, length: 4.74, width: 2.08, height: 1.11,
  }),
  makeVehicleSpec({
    id: 'SabreTurbo',
    name: 'Sabre Turbo Classic',
    category: '1970s Muscle Fastback',
    showroomGroup: 'muscle_classic',
    price: 72000,
    bodyStyle: 'muscle',
    livery: 'twin_stripes',
    defaultPaintId: 'matte_charcoal',
    defaultAccentHex: 0xe2e8f0,
    thumbnail: { sheet: 'grid20', col: 2, row: 2 },
    maxSpeedKph: 242, acceleration: 2380, brakeForce: 3300, steeringAngle: 29, mass: 1690, grip: 0.98, offRoadCapability: 0.12, length: 4.94, width: 1.98, height: 1.30,
  }),
  makeVehicleSpec({
    id: 'PatriotH2',
    name: 'Patriot H2 Tactical',
    category: 'Heavy Armored 4x4',
    showroomGroup: 'suv_utility',
    price: 88000,
    bodyStyle: 'hummer_4x4',
    livery: 'none',
    defaultPaintId: 'alpine_blue',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 3, row: 2 },
    maxSpeedKph: 186, acceleration: 1860, brakeForce: 3780, steeringAngle: 31, mass: 2680, grip: 0.92, offRoadCapability: 0.94, length: 4.98, width: 2.16, height: 1.88,
  }),
  makeVehicleSpec({
    id: 'PoliceCruiser',
    name: 'VCPD Patrol Cruiser',
    category: 'Law Enforcement',
    showroomGroup: 'service_special',
    price: 0,
    bodyStyle: 'police',
    livery: 'police_bw',
    defaultPaintId: 'obsidian',
    defaultAccentHex: 0xf8fafc,
    thumbnail: { sheet: 'grid20', col: 0, row: 3 },
    maxSpeedKph: 248, acceleration: 2220, brakeForce: 3980, steeringAngle: 33, mass: 1720, grip: 1.12, offRoadCapability: 0.24, length: 4.94, width: 1.96, height: 1.44,
  }),
  makeVehicleSpec({
    id: 'VolticRoadster',
    name: 'Voltic EV Roadster',
    category: 'Open-Top Electric',
    showroomGroup: 'sports_tuner',
    price: 150000,
    bodyStyle: 'roadster',
    livery: 'none',
    defaultPaintId: 'emerald_green',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 1, row: 3 },
    maxSpeedKph: 284, acceleration: 2840, brakeForce: 3920, steeringAngle: 34, mass: 1180, grip: 1.30, offRoadCapability: 0.08, length: 4.24, width: 1.88, height: 1.06,
  }),
  makeVehicleSpec({
    id: 'ParkRangerSUV',
    name: 'Park Ranger Patrol SUV',
    category: 'Coastal Ranger Unit',
    showroomGroup: 'service_special',
    price: 0,
    bodyStyle: 'ranger_suv',
    livery: 'ranger_green',
    defaultPaintId: 'pearl',
    defaultAccentHex: 0x15803d,
    thumbnail: { sheet: 'grid20', col: 2, row: 3 },
    maxSpeedKph: 204, acceleration: 1920, brakeForce: 3760, steeringAngle: 31, mass: 2420, grip: 0.98, offRoadCapability: 0.78, length: 5.20, width: 2.04, height: 1.84,
  }),
  makeVehicleSpec({
    id: 'StallionFastback',
    name: 'Stallion Classic Fastback',
    category: 'Retro Muscle Coupe',
    showroomGroup: 'muscle_classic',
    price: 68000,
    bodyStyle: 'muscle',
    livery: 'none',
    defaultPaintId: 'burnt_copper',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 3, row: 3 },
    maxSpeedKph: 234, acceleration: 2290, brakeForce: 3250, steeringAngle: 29, mass: 1680, grip: 0.96, offRoadCapability: 0.14, length: 4.92, width: 1.98, height: 1.29,
  }),
  makeVehicleSpec({
    id: 'ZType1938',
    name: 'Z-Type 1938 Classic',
    category: 'Art-Deco Grand Coupe',
    showroomGroup: 'muscle_classic',
    price: 950000,
    bodyStyle: 'vintage_artdeco',
    livery: 'two_tone_fenders',
    defaultPaintId: 'obsidian',
    defaultAccentHex: 0x881337,
    thumbnail: { sheet: 'grid20', col: 0, row: 4 },
    maxSpeedKph: 248, acceleration: 2150, brakeForce: 3420, steeringAngle: 30, mass: 1640, grip: 1.06, offRoadCapability: 0.12, length: 5.08, width: 1.96, height: 1.36,
  }),
  makeVehicleSpec({
    id: 'ReginaEstate',
    name: 'Regina Woodgrain Estate',
    category: 'Classic Station Wagon',
    showroomGroup: 'suv_utility',
    price: 22000,
    bodyStyle: 'wagon',
    livery: 'woodgrain',
    defaultPaintId: 'classic_cream',
    defaultAccentHex: 0x78350f,
    thumbnail: { sheet: 'grid20', col: 1, row: 4 },
    maxSpeedKph: 176, acceleration: 1460, brakeForce: 3180, steeringAngle: 31, mass: 1860, grip: 0.92, offRoadCapability: 0.20, length: 5.18, width: 1.98, height: 1.44,
  }),
  makeVehicleSpec({
    id: 'OsirisCarbon',
    name: 'Osiris Carbon Hypercar',
    category: 'Sculpted Hypercar',
    showroomGroup: 'hyper_super',
    price: 1950000,
    bodyStyle: 'hypercar',
    livery: 'center_wedge',
    defaultPaintId: 'corsa_red',
    defaultAccentHex: 0x111827,
    thumbnail: { sheet: 'grid20', col: 2, row: 4 },
    maxSpeedKph: 374, acceleration: 3060, brakeForce: 4280, steeringAngle: 28, mass: 1440, grip: 1.36, offRoadCapability: 0.03, length: 4.74, width: 2.06, height: 1.09,
  }),
  makeVehicleSpec({
    id: 'DowntownCab',
    name: 'Downtown City Taxi',
    category: 'Metro Cab Service',
    showroomGroup: 'service_special',
    price: 0,
    bodyStyle: 'taxi',
    livery: 'taxi_yellow_blue',
    defaultPaintId: 'solar_yellow',
    defaultAccentHex: 0x2563eb,
    thumbnail: { sheet: 'grid20', col: 3, row: 4 },
    maxSpeedKph: 214, acceleration: 1850, brakeForce: 3560, steeringAngle: 33, mass: 1690, grip: 1.04, offRoadCapability: 0.16, length: 4.94, width: 1.96, height: 1.44,
  }),
];

// Normalize legacy ID for Grotti Itali GTO Stinger cleanly
VEHICLE_SPECS.forEach((v) => {
  if ((v.id as string) === 'GrottiItaliGTOStinger') {
    v.id = 'ItaliGTOStinger';
  }
});

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
  { id: 'alpine_blue', name: 'Solar Alpine Blue', hex: 0x0d74c8, css: '#0d74c8', metalness: 0.82, roughness: 0.14, accentHex: 0x38bdf8 },
  { id: 'corsa_red', name: 'Corsa Crimson', hex: 0xd91c2b, css: '#d91c2b', metalness: 0.74, roughness: 0.15, accentHex: 0xfef08a },
  { id: 'obsidian', name: 'Vice Obsidian', hex: 0x151820, css: '#1c2230', metalness: 0.88, roughness: 0.18, accentHex: 0xff4d8d },
  { id: 'pearl', name: 'Miami Silver Pearl', hex: 0xe6ebf2, css: '#e6ebf2', metalness: 0.58, roughness: 0.13, accentHex: 0xef4444 },
  { id: 'sunset_orange', name: 'Sunset Orange', hex: 0xea580c, css: '#ea580c', metalness: 0.76, roughness: 0.16, accentHex: 0x111827 },
  { id: 'solar_yellow', name: 'Solar Yellow', hex: 0xeab308, css: '#eab308', metalness: 0.72, roughness: 0.16, accentHex: 0x111827 },
  { id: 'acid_lime', name: 'Acid Lime', hex: 0x65a30d, css: '#65a30d', metalness: 0.70, roughness: 0.16, accentHex: 0x111827 },
  { id: 'vice_pink', name: 'Vice Hot Pink', hex: 0xec4899, css: '#ec4899', metalness: 0.68, roughness: 0.15, accentHex: 0x111827 },
  { id: 'emerald_green', name: 'Emerald Roadster', hex: 0x0f766e, css: '#0f766e', metalness: 0.78, roughness: 0.16, accentHex: 0x38bdf8 },
  { id: 'royal_blue', name: 'Royal Classic Blue', hex: 0x2546a8, css: '#2546a8', metalness: 0.76, roughness: 0.18, accentHex: 0xe2e8f0 },
  { id: 'burgundy', name: 'Deep Burgundy', hex: 0x881337, css: '#881337', metalness: 0.80, roughness: 0.17, accentHex: 0xfbbf24 },
  { id: 'matte_charcoal', name: 'Matte Charcoal', hex: 0x2d323a, css: '#2d323a', metalness: 0.35, roughness: 0.62, accentHex: 0xe2e8f0 },
  { id: 'slate_grey', name: 'Urban Slate', hex: 0x525860, css: '#525860', metalness: 0.62, roughness: 0.28, accentHex: 0x94a3b8 },
  { id: 'burnt_copper', name: 'Burnt Copper', hex: 0xb45309, css: '#b45309', metalness: 0.78, roughness: 0.22, accentHex: 0x111827 },
  { id: 'rust_terracotta', name: 'Desert Terracotta', hex: 0xa15b52, css: '#a15b52', metalness: 0.22, roughness: 0.78, accentHex: 0x334155 },
  { id: 'classic_cream', name: 'Classic Cream', hex: 0xd6c7a1, css: '#d6c7a1', metalness: 0.38, roughness: 0.34, accentHex: 0x78350f },
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

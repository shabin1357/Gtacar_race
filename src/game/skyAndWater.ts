import * as THREE from 'three';
import { WEATHER_OPTIONS, WeatherCondition } from './types';

export interface AtmosphereState {
  topColor: THREE.Color;
  midColor: THREE.Color;
  horizonColor: THREE.Color;
  sunColor: THREE.Color;
  sunDirection: THREE.Vector3;
  fogColor: THREE.Color;
  fogDensity: number;
  sunLightColor: THREE.Color;
  sunLightIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  rimLightColor: THREE.Color;
  rimLightIntensity: number;
  exposure: number;
  emissiveScale: number;
  starIntensity: number;
  cloudCoverage: number;
  cloudDarkness: number;
  lightningFlash: number;
  nightFactor: number;
  waterDeep: THREE.Color;
  waterShallow: THREE.Color;
}

interface TimeStop {
  hour: number;
  top: number;
  mid: number;
  horizon: number;
  sun: number;
  fog: number;
  fogDensity: number;
  sunLight: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  rim: number;
  rimIntensity: number;
  exposure: number;
  emissive: number;
  stars: number;
  waterDeep: number;
  waterShallow: number;
}

// 24-hour keyframe stops calibrated directly to the user's coastal daylight, golden hour, peach sunset, blue hour, and neon night references
const TIME_STOPS: TimeStop[] = [
  {
    hour: 0.0, // Midnight
    top: 0x050814,
    mid: 0x10152d,
    horizon: 0x261a3b,
    sun: 0xc8dcff,
    fog: 0x101424,
    fogDensity: 0.0026,
    sunLight: 0x7ba4f7,
    sunIntensity: 0.95,
    hemiSky: 0x27345f,
    hemiGround: 0x160f22,
    hemiIntensity: 0.85,
    rim: 0xff4d8d,
    rimIntensity: 1.1,
    exposure: 1.08,
    emissive: 2.35,
    stars: 1.0,
    waterDeep: 0x041022,
    waterShallow: 0x0b2d47,
  },
  {
    hour: 5.4, // Pre-dawn
    top: 0x0d1530,
    mid: 0x2a274d,
    horizon: 0x874d68,
    sun: 0xffb38a,
    fog: 0x45324e,
    fogDensity: 0.0025,
    sunLight: 0xd9937a,
    sunIntensity: 1.15,
    hemiSky: 0x4b4c7a,
    hemiGround: 0x251b2c,
    hemiIntensity: 0.92,
    rim: 0x38bdf8,
    rimIntensity: 0.85,
    exposure: 1.08,
    emissive: 1.65,
    stars: 0.45,
    waterDeep: 0x0a223b,
    waterShallow: 0x19536e,
  },
  {
    hour: 6.5, // Sunrise
    top: 0x2a4f8a,
    mid: 0x9b6e86,
    horizon: 0xffb584,
    sun: 0xffe5b0,
    fog: 0xe6a58a,
    fogDensity: 0.002,
    sunLight: 0xffbc85,
    sunIntensity: 2.4,
    hemiSky: 0x8fb5e6,
    hemiGround: 0x56433e,
    hemiIntensity: 1.12,
    rim: 0x38bdf8,
    rimIntensity: 0.65,
    exposure: 1.12,
    emissive: 0.65,
    stars: 0.0,
    waterDeep: 0x0c4466,
    waterShallow: 0x2198a8,
  },
  {
    hour: 9.5, // Crisp Bright Morning
    top: 0x1962cc,
    mid: 0x4ca6eb,
    horizon: 0xc2ecfa,
    sun: 0xfffce8,
    fog: 0xb6e0f2,
    fogDensity: 0.0012,
    sunLight: 0xfff5e0,
    sunIntensity: 3.15,
    hemiSky: 0x8ad5ff,
    hemiGround: 0x675b4d,
    hemiIntensity: 1.32,
    rim: 0x67e8f9,
    rimIntensity: 0.55,
    exposure: 1.06,
    emissive: 0.14,
    stars: 0.0,
    waterDeep: 0x006599,
    waterShallow: 0x24cfd1,
  },
  {
    hour: 12.8, // Vivid Coastal Noon (Screenshots #1, #8, #9)
    top: 0x155cc7,
    mid: 0x44a6ed,
    horizon: 0xc9f0fc,
    sun: 0xfffff2,
    fog: 0xbde4f5,
    fogDensity: 0.0011,
    sunLight: 0xfff9ec,
    sunIntensity: 3.35,
    hemiSky: 0x94daff,
    hemiGround: 0x706455,
    hemiIntensity: 1.36,
    rim: 0x5eead4,
    rimIntensity: 0.5,
    exposure: 1.04,
    emissive: 0.1,
    stars: 0.0,
    waterDeep: 0x006b9e,
    waterShallow: 0x28d6d4,
  },
  {
    hour: 16.0, // Warm Late Afternoon
    top: 0x2268bf,
    mid: 0x73a8d8,
    horizon: 0xf7cfa2,
    sun: 0xffe9b5,
    fog: 0xdfc1a5,
    fogDensity: 0.0014,
    sunLight: 0xffd59e,
    sunIntensity: 3.0,
    hemiSky: 0x9bc4e8,
    hemiGround: 0x665244,
    hemiIntensity: 1.24,
    rim: 0x38bdf8,
    rimIntensity: 0.58,
    exposure: 1.08,
    emissive: 0.28,
    stars: 0.0,
    waterDeep: 0x094e73,
    waterShallow: 0x21a5b2,
  },
  {
    hour: 17.65, // Golden Hour Hazy Glow (Screenshots #2, #11)
    top: 0x3e5482,
    mid: 0xd18a5b,
    horizon: 0xffc67d,
    sun: 0xfff0ba,
    fog: 0xe6ad75,
    fogDensity: 0.0021,
    sunLight: 0xffb86b,
    sunIntensity: 3.05,
    hemiSky: 0xdba980,
    hemiGround: 0x523b2c,
    hemiIntensity: 1.15,
    rim: 0xffa652,
    rimIntensity: 0.72,
    exposure: 1.14,
    emissive: 0.72,
    stars: 0.0,
    waterDeep: 0x16415c,
    waterShallow: 0x328a94,
  },
  {
    hour: 18.7, // Pink-Peach Sunset (Screenshot #5)
    top: 0x242152,
    mid: 0xa64e77,
    horizon: 0xffa37a,
    sun: 0xffe0a8,
    fog: 0xd68478,
    fogDensity: 0.0022,
    sunLight: 0xff9b6a,
    sunIntensity: 2.35,
    hemiSky: 0x8b6eb5,
    hemiGround: 0x3d2735,
    hemiIntensity: 1.02,
    rim: 0x38bdf8,
    rimIntensity: 0.82,
    exposure: 1.12,
    emissive: 1.35,
    stars: 0.22,
    waterDeep: 0x0e3554,
    waterShallow: 0x1e7e91,
  },
  {
    hour: 19.7, // Blue Hour Dusk (Screenshot #13)
    top: 0x0d1e42,
    mid: 0x28436b,
    horizon: 0xd67c72,
    sun: 0xffb38e,
    fog: 0x24334d,
    fogDensity: 0.0024,
    sunLight: 0x9bb7e6,
    sunIntensity: 1.35,
    hemiSky: 0x3f5b87,
    hemiGround: 0x1d1c2e,
    hemiIntensity: 0.96,
    rim: 0xff5c97,
    rimIntensity: 1.0,
    exposure: 1.1,
    emissive: 1.95,
    stars: 0.65,
    waterDeep: 0x07203b,
    waterShallow: 0x16496b,
  },
  {
    hour: 21.5, // Neon Vice Night (Screenshots #3, #4, #6, #12)
    top: 0x060917,
    mid: 0x121936,
    horizon: 0x2e1a44,
    sun: 0xcce0ff,
    fog: 0x12172b,
    fogDensity: 0.0026,
    sunLight: 0x7da4f5,
    sunIntensity: 1.05,
    hemiSky: 0x2b3a6b,
    hemiGround: 0x1a1126,
    hemiIntensity: 0.9,
    rim: 0xff4d8d,
    rimIntensity: 1.15,
    exposure: 1.1,
    emissive: 2.45,
    stars: 0.95,
    waterDeep: 0x041124,
    waterShallow: 0x0d3350,
  },
  {
    hour: 24.0, // Wrap to Midnight
    top: 0x050814,
    mid: 0x10152d,
    horizon: 0x261a3b,
    sun: 0xc8dcff,
    fog: 0x101424,
    fogDensity: 0.0026,
    sunLight: 0x7ba4f7,
    sunIntensity: 0.95,
    hemiSky: 0x27345f,
    hemiGround: 0x160f22,
    hemiIntensity: 0.85,
    rim: 0xff4d8d,
    rimIntensity: 1.1,
    exposure: 1.08,
    emissive: 2.35,
    stars: 1.0,
    waterDeep: 0x041022,
    waterShallow: 0x0b2d47,
  },
];

const _cA = new THREE.Color();
const _cB = new THREE.Color();
const _stormTint = new THREE.Color(0x283546);
const _fogCyanTint = new THREE.Color(0x527578);
const _fogDayTint = new THREE.Color(0xaec0c8);

function lerpHex(out: THREE.Color, hexA: number, hexB: number, t: number): void {
  _cA.setHex(hexA);
  _cB.setHex(hexB);
  out.copy(_cA).lerp(_cB, t);
}

export function createAtmosphereState(): AtmosphereState {
  return {
    topColor: new THREE.Color(),
    midColor: new THREE.Color(),
    horizonColor: new THREE.Color(),
    sunColor: new THREE.Color(),
    sunDirection: new THREE.Vector3(0.5, 0.5, -0.5).normalize(),
    fogColor: new THREE.Color(),
    fogDensity: 0.002,
    sunLightColor: new THREE.Color(),
    sunLightIntensity: 2.0,
    hemiSkyColor: new THREE.Color(),
    hemiGroundColor: new THREE.Color(),
    hemiIntensity: 1.0,
    rimLightColor: new THREE.Color(),
    rimLightIntensity: 0.8,
    exposure: 1.1,
    emissiveScale: 1.2,
    starIntensity: 0.2,
    cloudCoverage: 0.4,
    cloudDarkness: 0.1,
    lightningFlash: 0,
    nightFactor: 0,
    waterDeep: new THREE.Color(),
    waterShallow: new THREE.Color(),
  };
}

export function evaluateAtmosphere(
  out: AtmosphereState,
  hour24: number,
  weather: WeatherCondition,
  weatherIntensity: number,
  lightningFlash: number
): AtmosphereState {
  const h = ((hour24 % 24) + 24) % 24;
  let a = TIME_STOPS[0];
  let b = TIME_STOPS[1];
  for (let i = 0; i < TIME_STOPS.length - 1; i++) {
    if (h >= TIME_STOPS[i].hour && h <= TIME_STOPS[i + 1].hour) {
      a = TIME_STOPS[i];
      b = TIME_STOPS[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, b.hour - a.hour);
  const t = THREE.MathUtils.clamp((h - a.hour) / span, 0, 1);

  lerpHex(out.topColor, a.top, b.top, t);
  lerpHex(out.midColor, a.mid, b.mid, t);
  lerpHex(out.horizonColor, a.horizon, b.horizon, t);
  lerpHex(out.sunColor, a.sun, b.sun, t);
  lerpHex(out.fogColor, a.fog, b.fog, t);
  lerpHex(out.sunLightColor, a.sunLight, b.sunLight, t);
  lerpHex(out.hemiSkyColor, a.hemiSky, b.hemiSky, t);
  lerpHex(out.hemiGroundColor, a.hemiGround, b.hemiGround, t);
  lerpHex(out.rimLightColor, a.rim, b.rim, t);
  lerpHex(out.waterDeep, a.waterDeep, b.waterDeep, t);
  lerpHex(out.waterShallow, a.waterShallow, b.waterShallow, t);

  out.fogDensity = THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, t);
  out.sunLightIntensity = THREE.MathUtils.lerp(a.sunIntensity, b.sunIntensity, t);
  out.hemiIntensity = THREE.MathUtils.lerp(a.hemiIntensity, b.hemiIntensity, t);
  out.rimLightIntensity = THREE.MathUtils.lerp(a.rimIntensity, b.rimIntensity, t);
  out.exposure = THREE.MathUtils.lerp(a.exposure, b.exposure, t);
  out.emissiveScale = THREE.MathUtils.lerp(a.emissive, b.emissive, t);
  out.starIntensity = THREE.MathUtils.lerp(a.stars, b.stars, t);

  // Continuous Sun / Moon arc across 24 hours
  const isDay = h >= 6.0 && h <= 19.2;
  if (isDay) {
    const dayPhase = (h - 6.0) / 13.2; // 0 sunrise -> 0.5 noon -> 1 sunset
    const elev = Math.sin(dayPhase * Math.PI) * 0.88 + 0.08;
    const az = Math.cos(dayPhase * Math.PI) * 0.85;
    out.sunDirection.set(az, elev, -0.52).normalize();
  } else {
    // Moonlight arc
    out.sunDirection.set(0.45, 0.52, -0.68).normalize();
  }

  // Night factor (0 = bright day, 1 = night)
  const nightFactor = h < 5.6 || h > 20.0 ? 1.0 : h < 7.2 ? 1 - (h - 5.6) / 1.6 : h > 18.2 ? (h - 18.2) / 1.8 : 0.0;
  out.nightFactor = THREE.MathUtils.clamp(nightFactor, 0, 1);

  // Modulate with active weather condition & intensity
  const meta = WEATHER_OPTIONS.find((w) => w.id === weather) ?? WEATHER_OPTIONS[0];
  const inten = THREE.MathUtils.clamp(weatherIntensity, 0.1, 1.0);

  out.cloudCoverage = THREE.MathUtils.lerp(0.18, meta.cloudCoverage, inten);
  out.cloudDarkness = meta.cloudDarkness * inten;
  out.lightningFlash = lightningFlash;

  // Storm / Overcast / Rain atmospheric mood
  if (meta.cloudDarkness > 0.25) {
    const stormAmt = THREE.MathUtils.clamp((meta.cloudDarkness - 0.15) * inten, 0, 0.85);
    out.topColor.lerp(_stormTint, stormAmt * 0.72);
    out.midColor.lerp(_stormTint, stormAmt * 0.62);
    out.horizonColor.lerp(_stormTint, stormAmt * 0.55);
    out.fogColor.lerp(_stormTint, stormAmt * 0.65);
    out.sunLightIntensity *= 1 - stormAmt * 0.52;
    out.starIntensity *= 1 - stormAmt;
    out.emissiveScale = Math.max(out.emissiveScale, 0.95 + stormAmt * 0.9);
  }

  // Atmospheric Fog / Dense Fog (Screenshot #10 teal-mist mood at dusk/night, pale coastal mist by day)
  const effectiveFogMult = THREE.MathUtils.lerp(1.0, meta.fogBoost, inten);
  out.fogDensity *= effectiveFogMult;
  if (weather === 'fog' || weather === 'heavy_fog') {
    const fogTintTarget = out.nightFactor > 0.4 ? _fogCyanTint : _fogDayTint;
    const tintAmt = (weather === 'heavy_fog' ? 0.78 : 0.52) * inten;
    out.fogColor.lerp(fogTintTarget, tintAmt);
    out.horizonColor.lerp(fogTintTarget, tintAmt);
    out.midColor.lerp(fogTintTarget, tintAmt * 0.55);
    out.emissiveScale = Math.max(out.emissiveScale, 1.45);
  }

  // Thunderstorm lightning flash burst
  if (lightningFlash > 0.01) {
    out.sunLightIntensity += lightningFlash * 4.2;
    out.hemiIntensity += lightningFlash * 1.4;
    out.sunLightColor.lerp(new THREE.Color(0xdbeafe), lightningFlash * 0.85);
    out.fogColor.lerp(new THREE.Color(0x94b4d8), lightningFlash * 0.45);
  }

  return out;
}

export interface SkySystem {
  mesh: THREE.Mesh;
  applyAtmosphere: (state: AtmosphereState) => void;
  update: (elapsed: number, cameraPos: THREE.Vector3) => void;
  dispose: () => void;
}

export function createSkyDome(initial: AtmosphereState): SkySystem {
  const uniforms = {
    uTopColor: { value: initial.topColor.clone() },
    uMidColor: { value: initial.midColor.clone() },
    uHorizonColor: { value: initial.horizonColor.clone() },
    uSunColor: { value: initial.sunColor.clone() },
    uSunDir: { value: initial.sunDirection.clone() },
    uTime: { value: 0 },
    uStarIntensity: { value: initial.starIntensity },
    uCloudCoverage: { value: initial.cloudCoverage },
    uCloudDarkness: { value: initial.cloudDarkness },
    uLightningFlash: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uTime;
      uniform float uStarIntensity;
      uniform float uCloudCoverage;
      uniform float uCloudDarkness;
      uniform float uLightningFlash;
      varying vec3 vWorldDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          v += amp * noise(p);
          p *= 2.04;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);

        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.32, h));
        col = mix(col, uTopColor, smoothstep(0.26, 0.85, h));

        // Sun / Moon disk & warm Mie atmospheric flare
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float sunDisk = smoothstep(0.9972, 0.9992, sunDot) * (1.0 - uCloudDarkness * 0.85);
        float sunHalo = (pow(sunDot, 10.0) * 0.52 + pow(sunDot, 56.0) * 0.72) * (1.0 - uCloudDarkness * 0.65);
        col += uSunColor * (sunHalo * 0.78 + sunDisk * 2.1);

        // Volumetric layered coastal & storm clouds
        if (dir.y > 0.02) {
          vec2 uv = dir.xz / (dir.y + 0.17) * 1.25 + vec2(uTime * 0.015, uTime * 0.007);
          float c = fbm(uv);
          float detail = fbm(uv * 2.2 - vec2(uTime * 0.01, 0.0));
          float density = mix(c, detail, 0.35);

          float threshLow = mix(0.62, 0.24, uCloudCoverage);
          float threshHigh = mix(0.84, 0.62, uCloudCoverage);
          float cloudMask = smoothstep(threshLow, threshHigh, density)
            * smoothstep(0.02, 0.22, dir.y)
            * smoothstep(0.98, 0.35, dir.y);

          vec3 brightCloud = mix(vec3(0.95, 0.97, 1.0), uSunColor * 1.15, pow(sunDot, 2.0) * 0.65 + 0.2);
          vec3 stormCloud = mix(vec3(0.16, 0.21, 0.28), vec3(0.32, 0.38, 0.46), detail);
          vec3 cloudCol = mix(brightCloud, stormCloud, uCloudDarkness);
          cloudCol += vec3(0.65, 0.8, 1.0) * uLightningFlash * (0.45 + 0.55 * detail);

          col = mix(col, cloudCol, cloudMask * mix(0.65, 0.94, uCloudDarkness));
        }

        // Crisp night stars
        if (uStarIntensity > 0.02 && dir.y > 0.14) {
          vec2 starGrid = floor(dir.xz / (dir.y + 0.1) * 150.0);
          float s = hash(starGrid);
          if (s > 0.9945) {
            float twinkle = 0.62 + 0.38 * sin(uTime * 3.2 + s * 100.0);
            col += vec3(0.86, 0.93, 1.0) * uStarIntensity * twinkle * smoothstep(0.14, 0.45, dir.y);
          }
        }

        // Subtle lightning sky glow
        col += vec3(0.45, 0.62, 0.9) * uLightningFlash * 0.35;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const geo = new THREE.SphereGeometry(960, 32, 20);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  return {
    mesh,
    applyAtmosphere: (state: AtmosphereState) => {
      uniforms.uTopColor.value.copy(state.topColor);
      uniforms.uMidColor.value.copy(state.midColor);
      uniforms.uHorizonColor.value.copy(state.horizonColor);
      uniforms.uSunColor.value.copy(state.sunColor);
      uniforms.uSunDir.value.copy(state.sunDirection);
      uniforms.uStarIntensity.value = state.starIntensity;
      uniforms.uCloudCoverage.value = state.cloudCoverage;
      uniforms.uCloudDarkness.value = state.cloudDarkness;
      uniforms.uLightningFlash.value = state.lightningFlash;
    },
    update: (elapsed: number, cameraPos: THREE.Vector3) => {
      uniforms.uTime.value = elapsed;
      mesh.position.copy(cameraPos);
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

export interface OceanWaterSystem {
  mesh: THREE.Mesh;
  applyAtmosphere: (state: AtmosphereState) => void;
  update: (elapsed: number) => void;
  dispose: () => void;
}

export function createOceanWater(initial: AtmosphereState): OceanWaterSystem {
  const geo = new THREE.PlaneGeometry(1100, 1800, 64, 64);
  geo.rotateX(-Math.PI / 2);

  const timeUniform = { value: 0 };
  const mat = new THREE.MeshPhysicalMaterial({
    color: initial.waterShallow.clone(),
    roughness: 0.12,
    metalness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 0.96,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaveTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uWaveTime;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float w1 = sin(transformed.x * 0.09 + uWaveTime * 1.45) * 0.24;
         float w2 = cos(transformed.z * 0.075 - uWaveTime * 1.15) * 0.20;
         float w3 = sin((transformed.x + transformed.z) * 0.16 + uWaveTime * 2.1) * 0.10;
         transformed.y += (w1 + w2 + w3);`
      );
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(760, -0.45, 0);
  mesh.receiveShadow = true;

  return {
    mesh,
    applyAtmosphere: (state: AtmosphereState) => {
      mat.color.copy(state.waterShallow).lerp(state.waterDeep, 0.38);
    },
    update: (elapsed: number) => {
      timeUniform.value = elapsed;
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

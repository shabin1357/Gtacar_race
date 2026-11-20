# PROJECT VELOCITY — Unity 6 URP Android Build & Inspector Setup Guide

## Important Honesty Note
This repository provides the complete Unity 6 C# source scripts, URP package manifest, Editor auto-builders, and Android build configuration under `OpenWorldCarChase/`. Because Unity 6 Editor and the Android NDK/SDK are not installed inside a web browser sandbox, **no `.apk` has been compiled or tested on physical Android (vivo T3x) hardware yet**. Follow the steps below in Unity 6 Editor on Windows/macOS to generate the scenes, prefabs, and APK.

---

## 1. Open in Unity 6 (URP)
1. Install **Unity 6 (6000.0 LTS or newer)** with the **Android Build Support (SDK, NDK, OpenJDK)** module via Unity Hub.
2. Extract `ProjectVelocity_Unity6_Pack.zip` and open the `OpenWorldCarChase` folder in Unity Hub.
3. Let Unity resolve `Packages/manifest.json` (Universal RP 17, Input System, Physics, Mobile).

---

## 2. One-Click Scene & All-Cars-Pack Generation
From the Unity top menu bar:
1. Click **Project Velocity > 1. Build Prefabs & Playable Scenes**
   - Generates URP PBR materials, `PlayerSportsCar.prefab`, `PoliceInterceptor.prefab`, and builds `MainMenu.unity`, `TestDrive.unity`, and `CityMap.unity` with all managers wired automatically.
2. Click **Project Velocity > Generate All Cars Pack**
   - Generates all **10 vehicle class prefabs** (`SportsCar`, `Supercar`, `Hypercar`, `MuscleCar`, `SUV`, `Sedan`, `OffRoad4x4`, `PickupTruck`, `PoliceCar`, `RaceCar`) under `Assets/Prefabs/Vehicles/` using `VehicleProfileLibrary.cs` and attaches `VehicleStatsApplier.cs`.
3. Click **Project Velocity > 2. Configure Android APK Build Settings**
   - Sets Landscape orientation, IL2CPP, ARM64, Minimum API 26, Target API 35, and adds all 3 scenes to Build Settings.

---

## 3. Realistic Weather & Dynamic Lighting Inspector Setup (8 Scripts)
All 8 scripts live under `Assets/Scripts/World/` and `Assets/Scripts/UI/` and are auto-attached to `ProjectVelocitySystems` and `PlayerSportsCar`:

- **`WeatherManager.cs`** (on `ProjectVelocitySystems`):
  - Controls all **10 weather states** (`Sunny`, `PartlyCloudy`, `Overcast`, `LightRain`, `HeavyRain`, `Thunderstorm`, `Fog`, `HeavyFog`, `Windy`, `ClearNight`), smooth lerp transitions, `weatherIntensity` (0.1–1.0), and `autoWeather`.
  - Assign `dayNightManager`, `rainController`, `fogController`, `lightningController`, `vehicleWeatherEffects`, and ambient wind/rain `AudioSource`.
- **`DayNightManager.cs`** (on `ProjectVelocitySystems`):
  - Drives the **24-hour cycle** (`timeOfDayHours`: 0–24) with 9 presets (`Sunrise`, `Morning`, `Noon`, `Afternoon`, `GoldenHour`, `Sunset`, `Dusk`, `Night`, `Midnight`).
  - Assign `sunLight` (Directional Light), optional `moonLight`, `skyboxMaterial`, and `streetLightController`.
- **`RainController.cs`** (on `ProjectVelocitySystems`):
  - Assign `followTarget` (Player Car transform), `rainParticleSystem` (world-space mobile-budgeted particle system), `wetRoadMaterials` (URP Lit road materials to boost `_Smoothness` & darken `_BaseColor` when wet), and optional `rainAudioSource`.
- **`FogController.cs`** (on `ProjectVelocitySystems`):
  - Smoothly blends `RenderSettings.fogMode = FogMode.ExponentialSquared`, fog color, and density for `Fog`, `HeavyFog`, and morning mist.
- **`LightningController.cs`** (on `ProjectVelocitySystems`):
  - Triggers random lightning flashes during `Thunderstorm`, briefly boosting `lightningLight` intensity and playing `thunderAudioSource` after a realistic speed-of-sound delay (0.6s–2.6s).
- **`StreetLightController.cs`** (on `ProjectVelocitySystems`):
  - Automatically toggles streetlight emissive materials, building window emission, and pooled streetlamp lights at dusk/night/storm using `MaterialPropertyBlock` (zero GC allocations).
- **`VehicleWeatherEffects.cs`** (on `PlayerSportsCar`):
  - Connects `WeatherManager` & `DayNightManager` to `CarController` / `CarPhysics`: reduces tire grip (`WheelFrictionCurve.stiffness`) and lengthens braking distance on wet roads, swings `leftWiperPivot` / `rightWiperPivot`, toggles headlights & fog beam meshes, and intensifies brake lights.
- **`WeatherSettingsUI.cs`** (on Canvas / `ProjectVelocitySystems`):
  - Binds mobile UI buttons/sliders for all 10 weather states, Auto Weather, Weather Intensity, 24h Time Slider, 9 Time Presets, Auto Day/Night, and Low/Medium/High quality presets.

---

## 4. vivo T3x Android Optimization Checklist
- **Low Preset (30 FPS battery/thermal mode)**: 75% URP render scale, shadows disabled, max 120 rain particles, 6 active traffic AI.
- **Medium Preset (Target 60 FPS on vivo T3x — Snapdragon 6 Gen 1)**: 90% URP render scale, 1024px 1-cascade shadows, 240 rain particles, baked Reflection Probes, 10 active traffic AI.
- **High Preset (60 FPS flagship)**: 100% URP render scale, 2048px soft shadows, 420 rain particles, URP Bloom, 16 active traffic AI.
- Always test on physical **vivo T3x** via **File > Build Profiles > Android > Build And Run** and inspect frame pacing in Unity Profiler before shipping an APK.

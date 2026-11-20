using UnityEngine;
using UnityEngine.Events;

namespace ProjectVelocity.World
{
    public enum WeatherCondition
    {
        Sunny = 0,
        PartlyCloudy = 1,
        Overcast = 2,
        LightRain = 3,
        HeavyRain = 4,
        Thunderstorm = 5,
        Fog = 6,
        HeavyFog = 7,
        Windy = 8,
        ClearNight = 9
    }

    [System.Serializable]
    public struct WeatherProfileData
    {
        public WeatherCondition condition;
        [Range(0f, 1f)] public float cloudCoverage;
        [Range(0f, 1f)] public float rainIntensity;
        [Range(0f, 1f)] public float fogDensity;
        [Range(0f, 1f)] public float windStrength;
        [Range(0.2f, 1.2f)] public float lightMultiplier;
        public Color skyTint;
        public Color fogTint;
        public bool enableLightning;
    }

    /// <summary>
    /// Central weather coordinator for Project Velocity (Unity 6 URP, vivo T3x Android optimized).
    /// Smoothly blends between all 10 weather conditions, manages automatic weather shifts,
    /// and notifies RainController, FogController, LightningController, and VehicleWeatherEffects.
    /// </summary>
    public class WeatherManager : MonoBehaviour
    {
        [Header("Weather State")]
        public WeatherCondition currentCondition = WeatherCondition.Sunny;
        [Range(0.1f, 1f)] public float weatherIntensity = 0.85f;
        public bool autoWeatherCycle = false;
        public float autoSwitchIntervalSeconds = 120f;
        public float transitionSpeed = 0.45f;

        [Header("Sub-Controllers")]
        public DayNightManager dayNightManager;
        public RainController rainController;
        public FogController fogController;
        public LightningController lightningController;
        public StreetLightController streetLightController;
        public VehicleWeatherEffects vehicleWeatherEffects;

        [Header("Events")]
        public UnityEvent<WeatherCondition> onWeatherChanged;

        // Current smoothly interpolated values (zero per-frame allocations)
        public float CurrentRainLevel { get; private set; }
        public float CurrentFogLevel { get; private set; }
        public float CurrentWindLevel { get; private set; }
        public float CurrentCloudCoverage { get; private set; }
        public float CurrentLightMultiplier { get; private set; } = 1f;
        public Color CurrentFogTint { get; private set; } = new Color(0.82f, 0.72f, 0.68f);

        private WeatherProfileData[] _profiles;
        private WeatherProfileData _targetProfile;
        private float _autoTimer;

        private void Awake()
        {
            BuildDefaultProfiles();
            _targetProfile = GetProfile(currentCondition);
            ApplyImmediate(_targetProfile);
        }

        private void BuildDefaultProfiles()
        {
            _profiles = new[]
            {
                new WeatherProfileData { condition = WeatherCondition.Sunny,        cloudCoverage = 0.12f, rainIntensity = 0.00f, fogDensity = 0.0012f, windStrength = 0.15f, lightMultiplier = 1.05f, skyTint = new Color(1.00f, 0.98f, 0.95f), fogTint = new Color(0.80f, 0.88f, 0.96f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.PartlyCloudy, cloudCoverage = 0.42f, rainIntensity = 0.00f, fogDensity = 0.0017f, windStrength = 0.28f, lightMultiplier = 0.92f, skyTint = new Color(0.92f, 0.94f, 0.98f), fogTint = new Color(0.76f, 0.82f, 0.90f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.Overcast,     cloudCoverage = 0.85f, rainIntensity = 0.00f, fogDensity = 0.0028f, windStrength = 0.40f, lightMultiplier = 0.68f, skyTint = new Color(0.68f, 0.72f, 0.78f), fogTint = new Color(0.58f, 0.62f, 0.68f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.LightRain,    cloudCoverage = 0.78f, rainIntensity = 0.42f, fogDensity = 0.0034f, windStrength = 0.48f, lightMultiplier = 0.66f, skyTint = new Color(0.62f, 0.68f, 0.76f), fogTint = new Color(0.52f, 0.58f, 0.66f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.HeavyRain,    cloudCoverage = 0.95f, rainIntensity = 0.88f, fogDensity = 0.0050f, windStrength = 0.72f, lightMultiplier = 0.50f, skyTint = new Color(0.45f, 0.52f, 0.62f), fogTint = new Color(0.38f, 0.44f, 0.54f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.Thunderstorm, cloudCoverage = 1.00f, rainIntensity = 1.00f, fogDensity = 0.0062f, windStrength = 0.95f, lightMultiplier = 0.36f, skyTint = new Color(0.28f, 0.32f, 0.44f), fogTint = new Color(0.24f, 0.28f, 0.38f), enableLightning = true  },
                new WeatherProfileData { condition = WeatherCondition.Fog,          cloudCoverage = 0.58f, rainIntensity = 0.00f, fogDensity = 0.0075f, windStrength = 0.12f, lightMultiplier = 0.76f, skyTint = new Color(0.76f, 0.80f, 0.84f), fogTint = new Color(0.72f, 0.76f, 0.80f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.HeavyFog,     cloudCoverage = 0.72f, rainIntensity = 0.00f, fogDensity = 0.0145f, windStrength = 0.08f, lightMultiplier = 0.62f, skyTint = new Color(0.68f, 0.72f, 0.76f), fogTint = new Color(0.66f, 0.70f, 0.75f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.Windy,        cloudCoverage = 0.48f, rainIntensity = 0.00f, fogDensity = 0.0022f, windStrength = 1.00f, lightMultiplier = 0.95f, skyTint = new Color(0.95f, 0.92f, 0.86f), fogTint = new Color(0.78f, 0.74f, 0.68f), enableLightning = false },
                new WeatherProfileData { condition = WeatherCondition.ClearNight,   cloudCoverage = 0.08f, rainIntensity = 0.00f, fogDensity = 0.0020f, windStrength = 0.18f, lightMultiplier = 0.85f, skyTint = new Color(0.22f, 0.28f, 0.45f), fogTint = new Color(0.08f, 0.10f, 0.20f), enableLightning = false }
            };
        }

        public WeatherProfileData GetProfile(WeatherCondition condition)
        {
            int idx = Mathf.Clamp((int)condition, 0, _profiles.Length - 1);
            return _profiles[idx];
        }

        public void SetWeather(WeatherCondition condition)
        {
            currentCondition = condition;
            _targetProfile = GetProfile(condition);

            if (condition == WeatherCondition.ClearNight && dayNightManager != null)
            {
                dayNightManager.SetTimeOfDayHours(23.0f);
            }

            onWeatherChanged?.Invoke(condition);
        }

        public void SetWeatherByIndex(int index)
        {
            if (index < 0 || index >= _profiles.Length) return;
            SetWeather((WeatherCondition)index);
        }

        public void SetIntensity(float intensity01)
        {
            weatherIntensity = Mathf.Clamp(intensity01, 0.1f, 1f);
        }

        public void SetAutoWeather(bool enabled)
        {
            autoWeatherCycle = enabled;
            _autoTimer = 0f;
        }

        private void ApplyImmediate(WeatherProfileData p)
        {
            CurrentRainLevel = p.rainIntensity * weatherIntensity;
            CurrentFogLevel = p.fogDensity * Mathf.Lerp(0.45f, 1.15f, weatherIntensity);
            CurrentWindLevel = p.windStrength * weatherIntensity;
            CurrentCloudCoverage = p.cloudCoverage;
            CurrentLightMultiplier = p.lightMultiplier;
            CurrentFogTint = p.fogTint;
        }

        private void Update()
        {
            float dt = Time.deltaTime;

            if (autoWeatherCycle)
            {
                _autoTimer += dt;
                if (_autoTimer >= autoSwitchIntervalSeconds)
                {
                    _autoTimer = 0f;
                    int next = Random.Range(0, _profiles.Length);
                    SetWeather((WeatherCondition)next);
                }
            }

            float step = dt * transitionSpeed;
            float targetRain = _targetProfile.rainIntensity * weatherIntensity;
            float targetFog = _targetProfile.fogDensity * Mathf.Lerp(0.45f, 1.15f, weatherIntensity);
            float targetWind = _targetProfile.windStrength * weatherIntensity;

            // Add subtle morning coastal mist between 05:30 and 07:30
            if (dayNightManager != null && dayNightManager.timeOfDayHours >= 5.5f && dayNightManager.timeOfDayHours <= 7.5f)
            {
                targetFog = Mathf.Max(targetFog, 0.0048f);
            }

            CurrentRainLevel = Mathf.MoveTowards(CurrentRainLevel, targetRain, step);
            CurrentFogLevel = Mathf.MoveTowards(CurrentFogLevel, targetFog, step * 0.01f);
            CurrentWindLevel = Mathf.MoveTowards(CurrentWindLevel, targetWind, step);
            CurrentCloudCoverage = Mathf.MoveTowards(CurrentCloudCoverage, _targetProfile.cloudCoverage, step);
            CurrentLightMultiplier = Mathf.MoveTowards(CurrentLightMultiplier, _targetProfile.lightMultiplier, step);
            CurrentFogTint = Color.Lerp(CurrentFogTint, _targetProfile.fogTint, step);

            if (rainController != null)
            {
                rainController.UpdateRain(CurrentRainLevel, CurrentWindLevel, dt);
            }

            if (fogController != null)
            {
                Color blendedFog = dayNightManager != null
                    ? Color.Lerp(dayNightManager.CurrentFogBaseColor, CurrentFogTint, 0.55f)
                    : CurrentFogTint;
                fogController.UpdateFog(CurrentFogLevel, blendedFog, dt);
            }

            if (lightningController != null)
            {
                lightningController.SetStormActive(_targetProfile.enableLightning && CurrentRainLevel > 0.45f, weatherIntensity);
            }

            if (vehicleWeatherEffects != null)
            {
                bool needsHeadlights = (dayNightManager != null && dayNightManager.IsNightOrDusk) ||
                                       CurrentRainLevel > 0.3f ||
                                       CurrentFogLevel > 0.0045f;
                vehicleWeatherEffects.ApplyWeatherToVehicle(CurrentRainLevel, CurrentFogLevel, CurrentWindLevel, needsHeadlights, dt);
            }

            if (streetLightController != null && dayNightManager != null)
            {
                bool lightsOn = dayNightManager.IsNightOrDusk || CurrentFogLevel > 0.006f || CurrentRainLevel > 0.65f;
                streetLightController.SetCityLightsActive(lightsOn, dt);
            }
        }
    }
}

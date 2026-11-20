using UnityEngine;

namespace ProjectVelocity.World
{
    public enum TimeOfDayPreset
    {
        Sunrise = 0,     // 06:00
        Morning = 1,     // 09:00
        Noon = 2,        // 12:30
        Afternoon = 3,   // 15:30
        GoldenHour = 4,  // 17:45
        Sunset = 5,      // 18:45
        Dusk = 6,        // 19:45
        Night = 7,       // 22:00
        Midnight = 8     // 00:30
    }

    /// <summary>
    /// Complete 24-hour dynamic Day/Night cycle for Unity 6 URP.
    /// Drives directional sunlight, moonlight at night, ambient/sky gradients, and soft shadows.
    /// </summary>
    public class DayNightManager : MonoBehaviour
    {
        [Header("24-Hour Clock")]
        [Range(0f, 24f)] public float timeOfDayHours = 18.25f;
        public bool enableDayNightCycle = false;
        [Tooltip("Real-world minutes for a complete 24-hour in-game day.")]
        public float realMinutesPerDay = 12f;

        [Header("Lights & References")]
        public Light sunLight;
        public Light moonLight;
        public WeatherManager weatherManager;
        public LightningController lightningController;

        public bool IsNightOrDusk => timeOfDayHours < 6.2f || timeOfDayHours >= 19.2f;
        public Color CurrentFogBaseColor { get; private set; } = new Color(0.84f, 0.49f, 0.44f);

        private static readonly float[] PresetHours = { 6.0f, 9.0f, 12.5f, 15.5f, 17.75f, 18.75f, 19.75f, 22.0f, 0.5f };

        public void SetPreset(TimeOfDayPreset preset)
        {
            int idx = Mathf.Clamp((int)preset, 0, PresetHours.Length - 1);
            SetTimeOfDayHours(PresetHours[idx]);
        }

        public void SetPresetByIndex(int index)
        {
            if (index < 0 || index >= PresetHours.Length) return;
            SetTimeOfDayHours(PresetHours[index]);
        }

        public void SetTimeOfDayHours(float hours24)
        {
            timeOfDayHours = Mathf.Repeat(hours24, 24f);
            UpdateCelestialLighting();
        }

        public void SetCycleEnabled(bool enabled)
        {
            enableDayNightCycle = enabled;
        }

        public string GetFormattedTime()
        {
            int h = Mathf.FloorToInt(timeOfDayHours);
            int m = Mathf.FloorToInt((timeOfDayHours - h) * 60f);
            return $"{h:00}:{m:00}";
        }

        private void Update()
        {
            if (enableDayNightCycle)
            {
                float hoursPerSecond = 24f / Mathf.Max(60f, realMinutesPerDay * 60f);
                timeOfDayHours = Mathf.Repeat(timeOfDayHours + hoursPerSecond * Time.deltaTime, 24f);
            }
            UpdateCelestialLighting();
        }

        private void UpdateCelestialLighting()
        {
            float weatherMult = weatherManager != null ? weatherManager.CurrentLightMultiplier : 1f;
            float flashBoost = lightningController != null ? lightningController.CurrentFlashBoost : 0f;

            // Sun elevation: rises at 06:00 (0 deg), peaks at 12:00 (90 deg), sets at 18:00 (180 deg)
            float sunPitch = ((timeOfDayHours - 6f) / 24f) * 360f;
            float sunHeight = Mathf.Sin(((timeOfDayHours - 6f) / 12f) * Mathf.PI); // >0 daytime, <=0 night
            float dayWeight = Mathf.Clamp01(sunHeight * 1.4f);
            float goldenWeight = Mathf.Exp(-Mathf.Pow((sunHeight - 0.14f) / 0.22f, 2f));

            if (sunLight != null)
            {
                sunLight.transform.rotation = Quaternion.Euler(sunPitch, 145f, 0f);
                Color noonSun = new Color(1.0f, 0.96f, 0.89f);
                Color goldenSun = new Color(1.0f, 0.58f, 0.34f);
                sunLight.color = Color.Lerp(noonSun, goldenSun, goldenWeight);
                float baseSunIntensity = Mathf.Lerp(0f, 2.35f, dayWeight) * weatherMult;
                sunLight.intensity = baseSunIntensity + flashBoost * 2.2f;
                sunLight.enabled = sunLight.intensity > 0.02f;
            }

            if (moonLight != null)
            {
                moonLight.transform.rotation = Quaternion.Euler(sunPitch + 180f, 145f, 0f);
                float nightWeight = Mathf.Clamp01(-sunHeight * 1.6f);
                moonLight.color = new Color(0.55f, 0.72f, 1.0f);
                moonLight.intensity = Mathf.Lerp(0f, 0.65f, nightWeight) * Mathf.Lerp(0.4f, 1f, weatherMult) + flashBoost * 1.6f;
                moonLight.enabled = moonLight.intensity > 0.02f;
            }

            // Smooth ambient and horizon fog palette
            Color nightAmb = new Color(0.11f, 0.13f, 0.24f);
            Color goldenAmb = new Color(0.56f, 0.34f, 0.44f);
            Color dayAmb = new Color(0.58f, 0.72f, 0.86f);
            Color ambient = Color.Lerp(nightAmb, dayAmb, dayWeight);
            ambient = Color.Lerp(ambient, goldenAmb, goldenWeight * 0.85f) * Mathf.Lerp(0.55f, 1f, weatherMult);
            if (flashBoost > 0.01f)
            {
                ambient += new Color(0.65f, 0.75f, 0.95f) * flashBoost;
            }
            RenderSettings.ambientLight = ambient;

            Color nightFog = new Color(0.07f, 0.09f, 0.17f);
            Color goldenFog = new Color(0.86f, 0.49f, 0.43f);
            Color dayFog = new Color(0.68f, 0.87f, 0.95f);
            Color fogBase = Color.Lerp(nightFog, dayFog, dayWeight);
            CurrentFogBaseColor = Color.Lerp(fogBase, goldenFog, goldenWeight * 0.9f);
        }
    }
}

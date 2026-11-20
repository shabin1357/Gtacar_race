using UnityEngine;
using UnityEngine.UI;
using ProjectVelocity.World;

namespace ProjectVelocity.UI
{
    /// <summary>
    /// Mobile Weather & Time-of-Day Settings UI Controller.
    /// Allows players to pick any of the 10 weather states, toggle Auto Weather,
    /// adjust Weather Intensity, scrub 24h Time of Day, toggle Day/Night Cycle,
    /// and switch vivo T3x Android Graphics Quality (Low / Medium / High).
    /// </summary>
    public class WeatherSettingsUI : MonoBehaviour
    {
        [Header("Managers")]
        public WeatherManager weatherManager;
        public DayNightManager dayNightManager;
        public RainController rainController;
        public GameManager gameManager;

        [Header("UI Controls")]
        public Dropdown weatherDropdown;
        public Toggle autoWeatherToggle;
        public Slider intensitySlider;
        public Slider timeOfDaySlider;
        public Text timeDisplayText;
        public Toggle dayNightCycleToggle;
        public Dropdown qualityDropdown;

        private void Start()
        {
            if (weatherDropdown != null && weatherManager != null)
            {
                weatherDropdown.value = (int)weatherManager.currentCondition;
                weatherDropdown.onValueChanged.AddListener(OnWeatherSelected);
            }

            if (autoWeatherToggle != null && weatherManager != null)
            {
                autoWeatherToggle.isOn = weatherManager.autoWeatherCycle;
                autoWeatherToggle.onValueChanged.AddListener(weatherManager.SetAutoWeather);
            }

            if (intensitySlider != null && weatherManager != null)
            {
                intensitySlider.value = weatherManager.weatherIntensity;
                intensitySlider.onValueChanged.AddListener(weatherManager.SetIntensity);
            }

            if (timeOfDaySlider != null && dayNightManager != null)
            {
                timeOfDaySlider.minValue = 0f;
                timeOfDaySlider.maxValue = 24f;
                timeOfDaySlider.value = dayNightManager.timeOfDayHours;
                timeOfDaySlider.onValueChanged.AddListener(OnTimeSliderChanged);
            }

            if (dayNightCycleToggle != null && dayNightManager != null)
            {
                dayNightCycleToggle.isOn = dayNightManager.enableDayNightCycle;
                dayNightCycleToggle.onValueChanged.AddListener(dayNightManager.SetCycleEnabled);
            }

            if (qualityDropdown != null)
            {
                qualityDropdown.onValueChanged.AddListener(OnQualityChanged);
            }
        }

        private void Update()
        {
            if (dayNightManager != null && timeDisplayText != null)
            {
                timeDisplayText.text = dayNightManager.GetFormattedTime();
            }
        }

        public void OnWeatherSelected(int index)
        {
            if (weatherManager != null) weatherManager.SetWeatherByIndex(index);
        }

        public void OnTimeSliderChanged(float hour24)
        {
            if (dayNightManager != null) dayNightManager.SetTimeOfDayHours(hour24);
        }

        public void OnTimePresetButton(int presetIndex)
        {
            if (dayNightManager != null)
            {
                dayNightManager.SetPresetByIndex(presetIndex);
                if (timeOfDaySlider != null) timeOfDaySlider.SetValueWithoutNotify(dayNightManager.timeOfDayHours);
            }
        }

        public void OnQualityChanged(int tierIndex)
        {
            AndroidGraphicsTier tier = (AndroidGraphicsTier)Mathf.Clamp(tierIndex, 0, 2);
            if (gameManager != null) gameManager.ApplyGraphicsQuality(tier);

            if (rainController != null)
            {
                rainController.SetParticleBudget(tier == AndroidGraphicsTier.Low ? 160 : tier == AndroidGraphicsTier.Medium ? 320 : 520);
            }
        }
    }
}

using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using ProjectVelocity.Vehicle;
using ProjectVelocity.World;
using ProjectVelocity.Persistence;

namespace ProjectVelocity.UI
{
    public enum GameModeType
    {
        FreeRoam = 0,
        DrivingMission = 1,
        TimeTrial = 2,
        StreetRace = 3
    }

    public enum AndroidGraphicsTier
    {
        Low = 0,    // 30 FPS battery/low-end target
        Medium = 1, // Balanced 45-60 FPS
        High = 2    // 60 FPS flagship target
    }

    /// <summary>
    /// Central coordinator for Project Velocity: manages gameplay modes (Free Roam, Driving Missions,
    /// Time Trials, Street Racing), Android URP Graphics Quality tiers, Pause state, Wanted stars,
    /// and SaveSystem persistence.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Core References")]
        public CarController playerCar;
        public CarCamera carCamera;
        public MiniMap miniMap;
        public WeatherManager weatherManager;
        public DayNightManager dayNightManager;
        public GameObject pausePanel;
        public GameObject fullMapPanel;

        [Header("State")]
        public GameModeType activeMode = GameModeType.FreeRoam;
        public int wantedLevel = 1;
        public int playerCash = 5000;
        public bool isPaused;

        private PlayerSaveData _saveData;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            _saveData = SaveSystem.Load();
            playerCash = _saveData.cash;
            ApplyGraphicsQuality((AndroidGraphicsTier)_saveData.graphicsTier);
        }

        public void SetGameMode(GameModeType mode)
        {
            activeMode = mode;
            if (mode == GameModeType.DrivingMission && miniMap != null)
            {
                miniMap.SetGpsWaypoint(new Vector3(240f, 0f, -180f)); // Airport Drop-off
            }
            else if (mode == GameModeType.TimeTrial && miniMap != null)
            {
                miniMap.SetGpsWaypoint(new Vector3(0f, 0f, -120f)); // Downtown Circuit Gate 1
            }
            else if (mode == GameModeType.StreetRace && miniMap != null)
            {
                miniMap.SetGpsWaypoint(new Vector3(200f, 0f, -120f)); // Ocean Drive Sprint
            }
        }

        public void TogglePause()
        {
            isPaused = !isPaused;
            Time.timeScale = isPaused ? 0f : 1f;
            if (pausePanel != null) pausePanel.SetActive(isPaused);
        }

        public void ToggleFullMap()
        {
            if (fullMapPanel == null) return;
            bool next = !fullMapPanel.activeSelf;
            fullMapPanel.SetActive(next);
            Time.timeScale = next ? 0f : (isPaused ? 0f : 1f);
        }

        public void ApplyGraphicsQuality(AndroidGraphicsTier tier)
        {
            QualitySettings.SetQualityLevel((int)tier, true);

            UniversalRenderPipelineAsset urp = GraphicsSettings.currentRenderPipeline as UniversalRenderPipelineAsset;
            switch (tier)
            {
                case AndroidGraphicsTier.Low:
                    Application.targetFrameRate = 30;
                    QualitySettings.lodBias = 0.7f;
                    if (urp != null)
                    {
                        urp.renderScale = 0.75f;
                        urp.shadowDistance = 35f;
                        urp.msaaSampleCount = 1;
                    }
                    break;

                case AndroidGraphicsTier.Medium:
                    Application.targetFrameRate = 60;
                    QualitySettings.lodBias = 1.0f;
                    if (urp != null)
                    {
                        urp.renderScale = 0.90f;
                        urp.shadowDistance = 65f;
                        urp.msaaSampleCount = 2;
                    }
                    break;

                case AndroidGraphicsTier.High:
                    Application.targetFrameRate = 60;
                    QualitySettings.lodBias = 1.4f;
                    if (urp != null)
                    {
                        urp.renderScale = 1.0f;
                        urp.shadowDistance = 110f;
                        urp.msaaSampleCount = 4;
                    }
                    break;
            }

            if (_saveData != null)
            {
                _saveData.graphicsTier = (int)tier;
                SaveSystem.Save(_saveData);
            }
        }

        public void AddCash(int amount)
        {
            playerCash += amount;
            if (_saveData != null)
            {
                _saveData.cash = playerCash;
                SaveSystem.Save(_saveData);
            }
        }
    }
}

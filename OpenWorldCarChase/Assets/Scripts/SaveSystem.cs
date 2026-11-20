using System;
using System.IO;
using UnityEngine;

namespace ProjectVelocity.Persistence
{
    [Serializable]
    public class PlayerSaveData
    {
        public int cash = 5000;
        public string selectedVehicleId = "apex_gtr";
        public string paintHex = "#FF4D6D";
        public string rimHex = "#D8DEE9";
        public bool underglowEnabled = true;
        public string underglowHex = "#38BDF8";
        public float engineUpgradeLevel = 1.0f;
        public float gripUpgradeLevel = 1.0f;
        public float bestTimeTrialSeconds = 999f;
        public int totalPoliceTakedowns = 0;
        public int graphicsTier = 1; // 0=Low, 1=Medium, 2=High
    }

    /// <summary>
    /// Persistent JSON Save/Load storage using Application.persistentDataPath (Android safe).
    /// </summary>
    public static class SaveSystem
    {
        private static string SaveFilePath => Path.Combine(Application.persistentDataPath, "project_velocity_save.json");

        public static void Save(PlayerSaveData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SaveFilePath, json);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ProjectVelocity] Save failed: {ex.Message}");
            }
        }

        public static PlayerSaveData Load()
        {
            try
            {
                if (File.Exists(SaveFilePath))
                {
                    string json = File.ReadAllText(SaveFilePath);
                    PlayerSaveData loaded = JsonUtility.FromJson<PlayerSaveData>(json);
                    if (loaded != null) return loaded;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ProjectVelocity] Load failed, using defaults: {ex.Message}");
            }
            return new PlayerSaveData();
        }
    }
}

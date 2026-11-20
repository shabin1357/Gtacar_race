using UnityEngine;
using UnityEngine.UI;
using ProjectVelocity.Vehicle;

namespace ProjectVelocity.UI
{
    /// <summary>
    /// Top-down orthographic MiniMap camera tracker & Interactive GPS Waypoint system.
    /// </summary>
    public class MiniMap : MonoBehaviour
    {
        public CarController playerCar;
        public Camera miniMapCamera;
        public float cameraHeight = 165f;
        public bool rotateWithPlayer = true;

        [Header("GPS Waypoint")]
        public Transform gpsBeaconPrefab;
        public Text gpsDistanceText;
        public RectTransform gpsCompassArrow;

        public bool HasWaypoint { get; private set; }
        public Vector3 WaypointWorldPos { get; private set; }

        private Transform _activeBeacon;

        public void SetGpsWaypoint(Vector3 worldPos)
        {
            WaypointWorldPos = new Vector3(worldPos.x, 0.5f, worldPos.z);
            HasWaypoint = true;

            if (_activeBeacon == null && gpsBeaconPrefab != null)
            {
                _activeBeacon = Instantiate(gpsBeaconPrefab, WaypointWorldPos, Quaternion.identity);
            }
            else if (_activeBeacon != null)
            {
                _activeBeacon.position = WaypointWorldPos;
                _activeBeacon.gameObject.SetActive(true);
            }
        }

        public void ClearGpsWaypoint()
        {
            HasWaypoint = false;
            if (_activeBeacon != null) _activeBeacon.gameObject.SetActive(false);
            if (gpsDistanceText != null) gpsDistanceText.text = "";
        }

        private void LateUpdate()
        {
            if (playerCar == null) return;
            Vector3 p = playerCar.transform.position;

            if (miniMapCamera != null)
            {
                miniMapCamera.transform.position = new Vector3(p.x, cameraHeight, p.z);
                float yaw = rotateWithPlayer ? playerCar.transform.eulerAngles.y : 0f;
                miniMapCamera.transform.rotation = Quaternion.Euler(90f, yaw, 0f);
            }

            if (HasWaypoint)
            {
                Vector3 toTarget = WaypointWorldPos - p;
                toTarget.y = 0f;
                float dist = toTarget.magnitude;

                if (dist < 14f)
                {
                    ClearGpsWaypoint();
                    return;
                }

                if (gpsDistanceText != null)
                {
                    gpsDistanceText.text = $"{Mathf.RoundToInt(dist)}m";
                }

                if (gpsCompassArrow != null)
                {
                    float signedAngle = Vector3.SignedAngle(playerCar.transform.forward, toTarget.normalized, Vector3.up);
                    gpsCompassArrow.localRotation = Quaternion.Euler(0f, 0f, -signedAngle);
                }
            }
        }
    }
}

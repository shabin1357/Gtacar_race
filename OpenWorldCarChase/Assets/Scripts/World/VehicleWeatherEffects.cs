using UnityEngine;
using ProjectVelocity.Vehicle;

namespace ProjectVelocity.World
{
    /// <summary>
    /// Integrates dynamic weather with CarController & CarPhysics without breaking mobile controls:
    /// adjusts wet tire grip, longer braking distances, stability, animated windshield wipers,
    /// automatic headlights/fog beams, and optional cockpit window droplet intensity.
    /// </summary>
    [RequireComponent(typeof(CarController))]
    public class VehicleWeatherEffects : MonoBehaviour
    {
        [Header("Headlights & Fog Beams")]
        public Light[] headlightLights;
        public Renderer[] headlightEmissiveRenderers;

        [Header("Cockpit Windshield Wipers & Droplets")]
        public Transform leftWiperArm;
        public Transform rightWiperArm;
        public float wiperMaxAngle = 72f;
        public Renderer windshieldDropletOverlay;

        private CarController _car;
        private Rigidbody _rb;
        private float _wiperPhase;
        private MaterialPropertyBlock _mpb;
        private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");

        private void Awake()
        {
            _car = GetComponent<CarController>();
            _rb = GetComponent<Rigidbody>();
            _mpb = new MaterialPropertyBlock();
        }

        public void ApplyWeatherToVehicle(
            float rainIntensity01,
            float fogDensity,
            float windStrength01,
            bool headlightsOn,
            float dt)
        {
            if (_car == null || _car.Physics == null) return;

            // 1. Reduce tire grip & lengthen braking distance smoothly during heavy rain
            _car.Physics.SetRoadWetness(rainIntensity01);

            // Subtle crosswind push at high speed during Windy / Thunderstorm conditions
            if (_rb != null && windStrength01 > 0.35f && _car.Physics.SpeedKmh > 60f)
            {
                float windForce = windStrength01 * 480f * Mathf.Sin(Time.time * 1.3f);
                _rb.AddForce(Vector3.right * windForce, ForceMode.Force);
            }

            // 2. Automatic Headlights
            if (headlightLights != null)
            {
                for (int i = 0; i < headlightLights.Length; i++)
                {
                    if (headlightLights[i] == null) continue;
                    headlightLights[i].enabled = headlightsOn;
                    headlightLights[i].intensity = fogDensity > 0.005f ? 14f : 9f;
                }
            }

            // 3. Windshield Wiper Animation (speed scales from Light Rain to Thunderstorm)
            if (rainIntensity01 > 0.08f)
            {
                float sweepRate = Mathf.Lerp(2.4f, 6.2f, rainIntensity01);
                _wiperPhase += dt * sweepRate;
                float angle = (0.5f + 0.5f * Mathf.Sin(_wiperPhase)) * wiperMaxAngle;
                if (leftWiperArm != null) leftWiperArm.localRotation = Quaternion.Euler(0f, 0f, -angle);
                if (rightWiperArm != null) rightWiperArm.localRotation = Quaternion.Euler(0f, 0f, -angle);
            }
            else
            {
                if (leftWiperArm != null)
                    leftWiperArm.localRotation = Quaternion.Lerp(leftWiperArm.localRotation, Quaternion.identity, dt * 6f);
                if (rightWiperArm != null)
                    rightWiperArm.localRotation = Quaternion.Lerp(rightWiperArm.localRotation, Quaternion.identity, dt * 6f);
            }

            // 4. Cockpit Raindrop Window Overlay
            if (windshieldDropletOverlay != null)
            {
                windshieldDropletOverlay.enabled = rainIntensity01 > 0.05f;
                windshieldDropletOverlay.GetPropertyBlock(_mpb);
                _mpb.SetColor(BaseColorId, new Color(0.85f, 0.92f, 1f, rainIntensity01 * 0.45f));
                windshieldDropletOverlay.SetPropertyBlock(_mpb);
            }
        }
    }
}

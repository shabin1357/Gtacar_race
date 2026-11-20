using UnityEngine;

namespace ProjectVelocity.World
{
    /// <summary>
    /// Automatically toggles city streetlights and building window emissives at Dusk/Night/Storms.
    /// Uses MaterialPropertyBlock & limited real-time lights to stay fast on Android (vivo T3x).
    /// </summary>
    public class StreetLightController : MonoBehaviour
    {
        public Renderer[] streetLampBulbRenderers;
        public Renderer[] buildingWindowRenderers;
        public Light[] nearbyRealTimeLampLights;

        public Color lampEmissionColor = new Color(1.0f, 0.72f, 0.36f) * 2.8f;
        public Color windowEmissionColor = new Color(1.0f, 0.88f, 0.68f) * 1.4f;

        private float _blend;
        private MaterialPropertyBlock _mpb;
        private static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");

        private void Awake()
        {
            _mpb = new MaterialPropertyBlock();
        }

        public void SetCityLightsActive(bool active, float dt)
        {
            float target = active ? 1f : 0f;
            if (Mathf.Approximately(_blend, target)) return;

            _blend = Mathf.MoveTowards(_blend, target, dt * 1.5f);

            ApplyEmission(streetLampBulbRenderers, lampEmissionColor * _blend);
            ApplyEmission(buildingWindowRenderers, windowEmissionColor * _blend);

            if (nearbyRealTimeLampLights != null)
            {
                for (int i = 0; i < nearbyRealTimeLampLights.Length; i++)
                {
                    Light l = nearbyRealTimeLampLights[i];
                    if (l == null) continue;
                    l.intensity = _blend * 6.5f;
                    l.enabled = _blend > 0.05f;
                }
            }
        }

        private void ApplyEmission(Renderer[] renderers, Color color)
        {
            if (renderers == null) return;
            for (int i = 0; i < renderers.Length; i++)
            {
                if (renderers[i] == null) continue;
                renderers[i].GetPropertyBlock(_mpb);
                _mpb.SetColor(EmissionColorId, color);
                renderers[i].SetPropertyBlock(_mpb);
            }
        }
    }
}

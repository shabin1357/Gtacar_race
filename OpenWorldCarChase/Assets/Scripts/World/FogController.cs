using UnityEngine;

namespace ProjectVelocity.World
{
    /// <summary>
    /// Controls URP exponential distance fog, dense/morning fog visibility,
    /// and headlight volumetric cone visibility in heavy mist.
    /// </summary>
    public class FogController : MonoBehaviour
    {
        [Header("Fog Settings")]
        public FogMode fogMode = FogMode.ExponentialSquared;
        [Range(0f, 2f)] public float globalFogMultiplier = 1f;
        public Renderer[] headlightFogConeRenderers;

        private MaterialPropertyBlock _mpb;
        private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");

        private void Awake()
        {
            _mpb = new MaterialPropertyBlock();
            RenderSettings.fog = true;
            RenderSettings.fogMode = fogMode;
        }

        public void SetFogMultiplier(float mult)
        {
            globalFogMultiplier = Mathf.Clamp(mult, 0f, 2f);
        }

        public void UpdateFog(float targetDensity, Color targetColor, float dt)
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = fogMode;
            float density = Mathf.Clamp(targetDensity * globalFogMultiplier, 0.0005f, 0.025f);
            RenderSettings.fogDensity = Mathf.Lerp(RenderSettings.fogDensity, density, dt * 2.5f);
            RenderSettings.fogColor = Color.Lerp(RenderSettings.fogColor, targetColor, dt * 2.5f);

            // Make headlight volumetric fog cones glow stronger in dense fog
            if (headlightFogConeRenderers != null)
            {
                float coneAlpha = Mathf.Clamp01((density - 0.003f) / 0.01f) * 0.28f;
                Color coneColor = new Color(0.88f, 0.95f, 1f, coneAlpha);
                for (int i = 0; i < headlightFogConeRenderers.Length; i++)
                {
                    Renderer r = headlightFogConeRenderers[i];
                    if (r == null) continue;
                    r.enabled = coneAlpha > 0.02f;
                    r.GetPropertyBlock(_mpb);
                    _mpb.SetColor(BaseColorId, coneColor);
                    r.SetPropertyBlock(_mpb);
                }
            }
        }
    }
}

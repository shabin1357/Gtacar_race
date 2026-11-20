using UnityEngine;

namespace ProjectVelocity.World
{
    /// <summary>
    /// Mobile-optimized URP Rain Controller for vivo T3x Android performance.
    /// Drives rain particle emission, wet road smoothness/puddle sheen, and procedural rain audio.
    /// </summary>
    public class RainController : MonoBehaviour
    {
        [Header("Particle & Follow Target")]
        public Transform followTarget;
        public ParticleSystem rainParticleSystem;
        public int maxMobileParticles = 450;

        [Header("Wet Road & Puddle Materials")]
        public Material[] roadMaterials;
        [Range(0f, 1f)] public float drySmoothness = 0.34f;
        [Range(0f, 1f)] public float wetSmoothness = 0.90f;
        [Range(0f, 1f)] public float puddleDarkenAmount = 0.28f;

        [Header("Audio")]
        public AudioSource rainAudioSource;

        public float RoadWetness { get; private set; }

        private static readonly int SmoothnessId = Shader.PropertyToID("_Smoothness");
        private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        private Color[] _dryBaseColors;

        private void Awake()
        {
            if (roadMaterials != null && roadMaterials.Length > 0)
            {
                _dryBaseColors = new Color[roadMaterials.Length];
                for (int i = 0; i < roadMaterials.Length; i++)
                {
                    if (roadMaterials[i] != null && roadMaterials[i].HasProperty(BaseColorId))
                    {
                        _dryBaseColors[i] = roadMaterials[i].GetColor(BaseColorId);
                    }
                }
            }

            EnsureProceduralRainAudio();
        }

        private void EnsureProceduralRainAudio()
        {
            if (rainAudioSource != null) return;
            rainAudioSource = gameObject.AddComponent<AudioSource>();
            rainAudioSource.loop = true;
            rainAudioSource.volume = 0f;
            rainAudioSource.spatialBlend = 0f;

            const int sr = 16000;
            float[] data = new float[sr * 2];
            System.Random rng = new System.Random(2026);
            float lp = 0f;
            for (int i = 0; i < data.Length; i++)
            {
                float white = (float)(rng.NextDouble() * 2.0 - 1.0);
                lp = lp * 0.72f + white * 0.28f;
                data[i] = lp * 0.32f;
            }
            AudioClip clip = AudioClip.Create("ProceduralRainLoop", data.Length, 1, sr, false);
            clip.SetData(data, 0);
            rainAudioSource.clip = clip;
            rainAudioSource.Play();
        }

        public void SetParticleBudget(int maxCount)
        {
            maxMobileParticles = Mathf.Clamp(maxCount, 100, 900);
            if (rainParticleSystem != null)
            {
                var main = rainParticleSystem.main;
                main.maxParticles = maxMobileParticles;
            }
        }

        public void UpdateRain(float rainIntensity01, float windStrength01, float dt)
        {
            // Roads get wet quickly in rain and dry gradually after rain stops
            float wetRate = rainIntensity01 > RoadWetness ? 0.35f : 0.08f;
            RoadWetness = Mathf.MoveTowards(RoadWetness, rainIntensity01 > 0.05f ? Mathf.Clamp01(rainIntensity01 * 1.15f) : 0f, dt * wetRate);

            if (rainParticleSystem != null)
            {
                if (followTarget != null)
                {
                    rainParticleSystem.transform.position = followTarget.position + Vector3.up * 18f;
                }

                var emission = rainParticleSystem.emission;
                emission.enabled = rainIntensity01 > 0.02f;
                emission.rateOverTime = rainIntensity01 * maxMobileParticles;

                var vel = rainParticleSystem.velocityOverLifetime;
                vel.enabled = true;
                vel.x = -windStrength01 * 9f;
            }

            if (roadMaterials != null)
            {
                float smoothness = Mathf.Lerp(drySmoothness, wetSmoothness, RoadWetness);
                for (int i = 0; i < roadMaterials.Length; i++)
                {
                    Material mat = roadMaterials[i];
                    if (mat == null) continue;
                    if (mat.HasProperty(SmoothnessId)) mat.SetFloat(SmoothnessId, smoothness);
                    if (_dryBaseColors != null && i < _dryBaseColors.Length && mat.HasProperty(BaseColorId))
                    {
                        mat.SetColor(BaseColorId, _dryBaseColors[i] * (1f - RoadWetness * puddleDarkenAmount));
                    }
                }
            }

            if (rainAudioSource != null)
            {
                rainAudioSource.volume = Mathf.Lerp(rainAudioSource.volume, rainIntensity01 * 0.45f, dt * 4f);
            }
        }
    }
}

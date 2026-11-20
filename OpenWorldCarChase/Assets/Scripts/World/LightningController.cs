using UnityEngine;

namespace ProjectVelocity.World
{
    /// <summary>
    /// Thunderstorm lightning flash & realistic distance-delayed thunder audio generator.
    /// Zero GC allocations during gameplay.
    /// </summary>
    public class LightningController : MonoBehaviour
    {
        public float minIntervalSeconds = 5.5f;
        public float maxIntervalSeconds = 14.0f;
        public AudioSource thunderAudioSource;

        public float CurrentFlashBoost { get; private set; }

        private bool _stormActive;
        private float _stormIntensity = 1f;
        private float _nextFlashTimer = 4f;
        private float _pendingThunderDelay = -1f;
        private float _pendingThunderVolume = 0.8f;

        private void Awake()
        {
            EnsureProceduralThunderAudio();
        }

        private void EnsureProceduralThunderAudio()
        {
            if (thunderAudioSource != null) return;
            thunderAudioSource = gameObject.AddComponent<AudioSource>();
            thunderAudioSource.playOnAwake = false;
            thunderAudioSource.spatialBlend = 0f;

            const int sr = 16000;
            const int len = sr * 3;
            float[] samples = new float[len];
            System.Random rng = new System.Random(909);
            float lp = 0f;
            for (int i = 0; i < len; i++)
            {
                float t = (float)i / len;
                float env = Mathf.Exp(-t * 2.4f) * (0.7f + 0.3f * Mathf.Sin(t * 28f));
                float n = (float)(rng.NextDouble() * 2.0 - 1.0);
                lp = lp * 0.94f + n * 0.06f;
                samples[i] = lp * env * 2.4f;
            }
            AudioClip clip = AudioClip.Create("ProceduralThunder", len, 1, sr, false);
            clip.SetData(samples, 0);
            thunderAudioSource.clip = clip;
        }

        public void SetStormActive(bool active, float intensity01)
        {
            _stormActive = active;
            _stormIntensity = Mathf.Clamp(intensity01, 0.2f, 1f);
        }

        private void Update()
        {
            float dt = Time.deltaTime;

            if (CurrentFlashBoost > 0.001f)
            {
                CurrentFlashBoost = Mathf.MoveTowards(CurrentFlashBoost, 0f, dt * 5.2f);
            }

            if (_pendingThunderDelay > 0f)
            {
                _pendingThunderDelay -= dt;
                if (_pendingThunderDelay <= 0f && thunderAudioSource != null)
                {
                    thunderAudioSource.pitch = Random.Range(0.75f, 1.1f);
                    thunderAudioSource.PlayOneShot(thunderAudioSource.clip, _pendingThunderVolume);
                }
            }

            if (!_stormActive) return;

            _nextFlashTimer -= dt;
            if (_nextFlashTimer <= 0f)
            {
                TriggerLightningBolt();
                float scale = Mathf.Lerp(1.35f, 0.75f, _stormIntensity);
                _nextFlashTimer = Random.Range(minIntervalSeconds, maxIntervalSeconds) * scale;
            }
        }

        public void TriggerLightningBolt()
        {
            CurrentFlashBoost = Random.Range(0.75f, 1.35f) * _stormIntensity;
            // Realistic speed-of-sound delay (0.4s close strike to 2.6s distant strike)
            _pendingThunderDelay = Random.Range(0.45f, 2.4f);
            _pendingThunderVolume = Mathf.Clamp01((1.2f - _pendingThunderDelay * 0.32f) * _stormIntensity);
        }
    }
}

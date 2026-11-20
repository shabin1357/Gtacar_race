using UnityEngine;
using ProjectVelocity.UI;

namespace ProjectVelocity.Vehicle
{
    /// <summary>
    /// High-level player sports car controller connecting MobileControls/Keyboard inputs,
    /// CarPhysics, procedural vehicle audio, cockpit steering wheel, customization paint/rims,
    /// nitro boost, and damage/repair state.
    /// </summary>
    [RequireComponent(typeof(CarPhysics))]
    public class CarController : MonoBehaviour
    {
        [Header("References")]
        public MobileControls mobileControls;
        public CarCamera carCamera;
        public Transform cockpitSteeringWheel;
        public Renderer[] paintBodyRenderers;
        public Renderer[] wheelRimRenderers;
        public Renderer[] brakeLightRenderers;
        public Light underglowLight;

        [Header("Status")]
        public float nitro = 100f;
        public float health = 100f;

        public CarPhysics Physics { get; private set; }
        public bool IsBoosting { get; private set; }

        private AudioSource _engineAudio;
        private AudioSource _screechAudio;
        private MaterialPropertyBlock _mpb;
        private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        private static readonly int EmissionColorId = Shader.PropertyToID("_EmissionColor");

        private void Awake()
        {
            Physics = GetComponent<CarPhysics>();
            _mpb = new MaterialPropertyBlock();
            SetupProceduralAudio();
        }

        private void SetupProceduralAudio()
        {
            _engineAudio = gameObject.AddComponent<AudioSource>();
            _engineAudio.loop = true;
            _engineAudio.volume = 0.3f;
            _engineAudio.clip = GenerateEngineClip();
            _engineAudio.Play();

            _screechAudio = gameObject.AddComponent<AudioSource>();
            _screechAudio.loop = true;
            _screechAudio.volume = 0f;
            _screechAudio.clip = GenerateNoiseClip();
            _screechAudio.Play();
        }

        private void FixedUpdate()
        {
            float throttle = 0f;
            float brake = 0f;
            float steer = 0f;
            bool handbrake = false;
            bool nitroPressed = false;

            if (mobileControls != null)
            {
                throttle = Mathf.Max(throttle, mobileControls.Throttle);
                brake = Mathf.Max(brake, mobileControls.Brake);
                steer += mobileControls.Steer;
                handbrake |= mobileControls.Handbrake;
                nitroPressed |= mobileControls.Nitro;
            }

            // Editor / Desktop fallback controls
            float v = Input.GetAxis("Vertical");
            float h = Input.GetAxis("Horizontal");
            if (v > 0.05f) throttle = Mathf.Max(throttle, v);
            if (v < -0.05f) brake = Mathf.Max(brake, -v);
            if (Mathf.Abs(h) > 0.05f) steer = Mathf.Clamp(steer + h, -1f, 1f);
            if (Input.GetKey(KeyCode.Space)) handbrake = true;
            if (Input.GetKey(KeyCode.LeftShift)) nitroPressed = true;

            IsBoosting = nitroPressed && throttle > 0.1f && nitro > 1f;
            if (IsBoosting)
            {
                nitro = Mathf.Max(0f, nitro - 25f * Time.fixedDeltaTime);
            }
            else
            {
                float regen = Physics.IsDrifting ? 15f : 5.5f;
                nitro = Mathf.Min(100f, nitro + regen * Time.fixedDeltaTime);
            }

            Physics.StepSimulation(throttle, brake, steer, handbrake, IsBoosting, Time.fixedDeltaTime);
        }

        private void Update()
        {
            Physics.SyncWheelMeshes();

            if (cockpitSteeringWheel != null)
            {
                cockpitSteeringWheel.localRotation = Quaternion.Euler(0f, 0f, -Physics.CurrentSteerAngle * 4.5f);
            }

            UpdateAudio();
            UpdateBrakeLights();
        }

        public void ApplyCustomization(Color paintColor, Color rimColor, bool underglowEnabled, Color underglowColor)
        {
            ApplyColorToRenderers(paintBodyRenderers, paintColor);
            ApplyColorToRenderers(wheelRimRenderers, rimColor);

            if (underglowLight != null)
            {
                underglowLight.enabled = underglowEnabled;
                underglowLight.color = underglowColor;
            }
        }

        public void RepairAndRefill()
        {
            health = 100f;
            nitro = 100f;
        }

        private void ApplyColorToRenderers(Renderer[] renderers, Color color)
        {
            if (renderers == null) return;
            for (int i = 0; i < renderers.Length; i++)
            {
                if (renderers[i] == null) continue;
                renderers[i].GetPropertyBlock(_mpb);
                _mpb.SetColor(BaseColorId, color);
                renderers[i].SetPropertyBlock(_mpb);
            }
        }

        private void UpdateBrakeLights()
        {
            if (brakeLightRenderers == null) return;
            Color em = Physics.IsBraking ? new Color(4.5f, 0.2f, 0.3f) : new Color(1.2f, 0.08f, 0.12f);
            for (int i = 0; i < brakeLightRenderers.Length; i++)
            {
                if (brakeLightRenderers[i] == null) continue;
                brakeLightRenderers[i].GetPropertyBlock(_mpb);
                _mpb.SetColor(EmissionColorId, em);
                brakeLightRenderers[i].SetPropertyBlock(_mpb);
            }
        }

        private void UpdateAudio()
        {
            float rpm = Physics.NormalizedRpm;
            if (_engineAudio != null)
            {
                _engineAudio.pitch = Mathf.Lerp(_engineAudio.pitch, 0.65f + rpm * 1.75f + (IsBoosting ? 0.25f : 0f), Time.deltaTime * 10f);
                _engineAudio.volume = Mathf.Lerp(_engineAudio.volume, 0.22f + rpm * 0.42f, Time.deltaTime * 8f);
            }
            if (_screechAudio != null)
            {
                float targetVol = Physics.IsDrifting ? Mathf.Clamp01(Physics.MaxWheelSlip) * 0.38f : 0f;
                _screechAudio.volume = Mathf.Lerp(_screechAudio.volume, targetVol, Time.deltaTime * 10f);
            }
        }

        private void OnCollisionEnter(Collision collision)
        {
            float impact = collision.relativeVelocity.magnitude;
            if (impact > 9f)
            {
                health = Mathf.Max(0f, health - Mathf.Min(20f, (impact - 8f) * 0.7f));
                if (carCamera != null) carCamera.TriggerShake(impact / 35f);
            }
        }

        private static AudioClip GenerateEngineClip()
        {
            const int sr = 22050;
            float[] samples = new float[sr];
            for (int i = 0; i < sr; i++)
            {
                float t = (float)i / sr;
                samples[i] = (Mathf.Sin(2f * Mathf.PI * 62f * t) + 0.5f * Mathf.Sin(2f * Mathf.PI * 124f * t)) * 0.35f;
            }
            AudioClip clip = AudioClip.Create("EngineLoop", sr, 1, sr, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private static AudioClip GenerateNoiseClip()
        {
            const int sr = 22050;
            float[] samples = new float[sr];
            System.Random rng = new System.Random(1337);
            for (int i = 0; i < sr; i++)
            {
                float t = (float)i / sr;
                samples[i] = (float)(rng.NextDouble() * 2.0 - 1.0) * Mathf.Sin(2f * Mathf.PI * 1350f * t) * 0.25f;
            }
            AudioClip clip = AudioClip.Create("ScreechLoop", sr, 1, sr, false);
            clip.SetData(samples, 0);
            return clip;
        }
    }
}

using UnityEngine;
using ProjectVelocity.Vehicle;

namespace ProjectVelocity.AI
{
    /// <summary>
    /// Escalating Police Interceptor AI with lead-target interception, flank offset,
    /// obstacle avoidance raycasts, flashing red/blue lightbar strobes, and takedown handling.
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    public class PoliceAI : MonoBehaviour
    {
        public CarController playerTarget;
        public bool isSwatEnforcer;
        public float maxChaseSpeedMs = 46f;
        public float turnSpeed = 3.2f;
        public float flankOffsetMeters = 6.5f;
        public float durability = 100f;

        [Header("Lightbar Visuals")]
        public Light strobeLight;
        public Renderer redLightbar;
        public Renderer blueLightbar;

        public bool IsDisabled => _disabledTimer > 0f;

        private Rigidbody _rb;
        private float _disabledTimer;
        private float _flankSign = 1f;
        private float _strobePhase;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            _flankSign = Random.value > 0.5f ? 1f : -1f;
            if (isSwatEnforcer) durability = 160f;
        }

        private void FixedUpdate()
        {
            if (playerTarget == null || IsDisabled) return;

            float dt = Time.fixedDeltaTime;
            Vector3 toPlayer = playerTarget.transform.position - transform.position;
            toPlayer.y = 0f;
            float dist = toPlayer.magnitude;

            // Predictive lead point + side flank for PIT maneuvers
            float leadTime = Mathf.Clamp(dist / 50f, 0.1f, 1.1f);
            Vector3 playerVel = playerTarget.GetComponent<Rigidbody>() != null
                ? playerTarget.GetComponent<Rigidbody>().linearVelocity
                : Vector3.zero;
            Vector3 flank = dist > 16f ? playerTarget.transform.right * (_flankSign * flankOffsetMeters) : Vector3.zero;
            Vector3 interceptPoint = playerTarget.transform.position + playerVel * leadTime + flank;

            Vector3 desiredDir = interceptPoint - transform.position;
            desiredDir.y = 0f;
            if (desiredDir.sqrMagnitude < 0.01f) return;
            desiredDir.Normalize();

            // Forward obstacle avoidance whisker raycasts
            Vector3 rayOrigin = transform.position + Vector3.up * 0.9f;
            if (Physics.Raycast(rayOrigin, transform.forward, 12f))
            {
                bool leftBlocked = Physics.Raycast(rayOrigin, (transform.forward - transform.right * 0.7f).normalized, 12f);
                desiredDir = (transform.forward + (leftBlocked ? transform.right : -transform.right) * 1.1f).normalized;
            }

            Quaternion targetRot = Quaternion.LookRotation(desiredDir, Vector3.up);
            _rb.MoveRotation(Quaternion.Slerp(_rb.rotation, targetRot, turnSpeed * dt));

            float catchupBonus = dist > 60f ? 10f : 0f;
            float targetSpeed = maxChaseSpeedMs + catchupBonus;
            Vector3 desiredVel = transform.forward * targetSpeed;
            desiredVel.y = _rb.linearVelocity.y;
            _rb.linearVelocity = Vector3.Lerp(_rb.linearVelocity, desiredVel, dt * 3.5f);
        }

        private void Update()
        {
            if (_disabledTimer > 0f)
            {
                _disabledTimer -= Time.deltaTime;
                if (strobeLight != null) strobeLight.intensity = 0f;
                return;
            }

            _strobePhase += Time.deltaTime * 9f;
            bool redActive = Mathf.FloorToInt(_strobePhase) % 2 == 0;
            if (strobeLight != null)
            {
                strobeLight.color = redActive ? Color.red : new Color(0.15f, 0.45f, 1f);
                strobeLight.intensity = 6.5f;
            }
        }

        private void OnCollisionEnter(Collision collision)
        {
            if (IsDisabled) return;
            if (collision.gameObject.GetComponent<CarController>() != null)
            {
                float impact = collision.relativeVelocity.magnitude;
                if (impact > 10f)
                {
                    durability -= impact * 2.2f;
                    if (durability <= 0f)
                    {
                        _disabledTimer = 10f;
                        durability = isSwatEnforcer ? 160f : 100f;
                    }
                }
            }
        }
    }
}

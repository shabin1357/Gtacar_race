using UnityEngine;

namespace ProjectVelocity.Vehicle
{
    public enum CameraViewMode
    {
        ThirdPersonChase = 0,
        CloseChase = 1,
        Cockpit = 2,
        Hood = 3
    }

    public class CarCamera : MonoBehaviour
    {
        public CarController targetCar;
        public Transform cockpitMount;
        public Transform hoodMount;

        public Vector3 chaseOffset = new Vector3(0f, 3.1f, -8.2f);
        public Vector3 closeOffset = new Vector3(0f, 2.3f, -5.8f);
        public float followDamping = 7.5f;
        public float baseFov = 60f;
        public float maxSpeedFovBoost = 18f;

        public CameraViewMode CurrentMode { get; private set; } = CameraViewMode.ThirdPersonChase;

        private Camera _cam;
        private Vector3 _smoothedLookAt;
        private float _shake;

        private void Awake()
        {
            _cam = GetComponent<Camera>();
        }

        public void CycleCameraMode()
        {
            CurrentMode = (CameraViewMode)(((int)CurrentMode + 1) % 4);
        }

        public void TriggerShake(float intensity)
        {
            _shake = Mathf.Max(_shake, Mathf.Clamp01(intensity) * 0.45f);
        }

        private void LateUpdate()
        {
            if (targetCar == null || targetCar.Physics == null) return;

            float dt = Time.deltaTime;
            Transform t = targetCar.transform;
            float speedNorm = Mathf.Clamp01(targetCar.Physics.SpeedKmh / 320f);

            if (CurrentMode == CameraViewMode.Cockpit && cockpitMount != null)
            {
                transform.SetPositionAndRotation(cockpitMount.position, cockpitMount.rotation);
            }
            else if (CurrentMode == CameraViewMode.Hood && hoodMount != null)
            {
                transform.SetPositionAndRotation(hoodMount.position, hoodMount.rotation);
            }
            else
            {
                Vector3 offset = CurrentMode == CameraViewMode.CloseChase ? closeOffset : chaseOffset;
                offset.z -= speedNorm * 1.9f;
                Vector3 desired = t.TransformPoint(offset);
                transform.position = Vector3.Lerp(transform.position, desired, 1f - Mathf.Exp(-followDamping * dt));

                Vector3 lookTarget = t.position + Vector3.up * 1.25f + t.forward * 8.5f;
                _smoothedLookAt = Vector3.Lerp(_smoothedLookAt, lookTarget, 1f - Mathf.Exp(-11f * dt));
                transform.LookAt(_smoothedLookAt, Vector3.up);
            }

            if (_shake > 0.002f)
            {
                transform.position += Random.insideUnitSphere * _shake;
                _shake = Mathf.Lerp(_shake, 0f, dt * 10f);
            }

            if (_cam != null)
            {
                float targetFov = baseFov + speedNorm * maxSpeedFovBoost + (targetCar.IsBoosting ? 8f : 0f);
                _cam.fieldOfView = Mathf.Lerp(_cam.fieldOfView, targetFov, dt * 6f);
            }
        }
    }
}

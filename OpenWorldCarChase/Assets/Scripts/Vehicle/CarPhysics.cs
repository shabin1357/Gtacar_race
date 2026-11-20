using UnityEngine;

namespace ProjectVelocity.Vehicle
{
    [CreateAssetMenu(fileName = "VehicleHandlingPreset", menuName = "Project Velocity/Vehicle Handling Preset")]
    public class VehicleHandlingPreset : ScriptableObject
    {
        public string vehicleId = "apex_gtr";
        public string displayName = "Apex GT-R";

        [Header("Chassis & Weight Transfer")]
        public float massKg = 1480f;
        public Vector3 centerOfMassOffset = new Vector3(0f, -0.42f, 0.14f);
        public float antiRollStiffness = 14500f;
        public float downforceCoefficient = 1.6f;
        public float dragCoefficient = 0.018f;

        [Header("Drivetrain & Transmission")]
        public float maxMotorTorque = 2500f;
        public float maxBrakeTorque = 4400f;
        public float handbrakeTorque = 6200f;
        public float topSpeedKmh = 330f;
        public float idleRpm = 950f;
        public float redlineRpm = 8400f;
        public float shiftUpRpm = 7650f;
        public float shiftDownRpm = 3100f;
        public float[] gearRatios = { 3.38f, 2.30f, 1.66f, 1.24f, 0.96f, 0.78f };
        public float finalDrive = 3.62f;

        [Header("Steering & Tires")]
        public float maxSteerAngle = 34f;
        public float highSpeedSteerAngle = 11f;
        public float steerResponse = 8.5f;
        public float suspensionDistance = 0.22f;
        public float suspensionSpring = 38000f;
        public float suspensionDamper = 4900f;
        public float forwardStiffness = 1.85f;
        public float sidewaysStiffness = 2.05f;
        public float driftSidewaysStiffness = 0.68f;
    }

    /// <summary>
    /// Low-level 4-WheelCollider physics solver: suspension springs, Ackermann steering,
    /// Pacejka tire friction curves, anti-roll weight transfer, aerodynamic downforce,
    /// and 6-speed automatic transmission + RPM simulation.
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    public class CarPhysics : MonoBehaviour
    {
        public VehicleHandlingPreset preset;

        [Header("Wheel Colliders")]
        public WheelCollider frontLeft;
        public WheelCollider frontRight;
        public WheelCollider rearLeft;
        public WheelCollider rearRight;

        [Header("Visual Wheel Meshes")]
        public Transform frontLeftMesh;
        public Transform frontRightMesh;
        public Transform rearLeftMesh;
        public Transform rearRightMesh;

        public float SpeedKmh { get; private set; }
        public float SpeedMph => SpeedKmh * 0.621371f;
        public float CurrentRpm { get; private set; } = 950f;
        public float NormalizedRpm => preset != null
            ? Mathf.Clamp01((CurrentRpm - preset.idleRpm) / Mathf.Max(1f, preset.redlineRpm - preset.idleRpm))
            : 0f;
        public int CurrentGear { get; private set; } = 1; // 0 = Reverse, 1..6 = Forward
        public float CurrentSteerAngle { get; private set; }
        public float MaxWheelSlip { get; private set; }
        public bool IsDrifting { get; private set; }
        public bool IsBraking { get; private set; }

        private Rigidbody _rb;
        private WheelCollider[] _colliders;
        private Transform[] _meshes;
        private float _shiftCooldown;
        private float _wetGripMultiplier = 1f;
        private float _engineUpgradeMult = 1f;
        private float _gripUpgradeMult = 1f;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            if (preset == null)
            {
                preset = ScriptableObject.CreateInstance<VehicleHandlingPreset>();
            }
            _colliders = new[] { frontLeft, frontRight, rearLeft, rearRight };
            _meshes = new[] { frontLeftMesh, frontRightMesh, rearLeftMesh, rearRightMesh };
            ConfigureChassisAndWheels();
        }

        public void ConfigureChassisAndWheels()
        {
            if (_rb == null || preset == null) return;
            _rb.mass = preset.massKg;
            _rb.centerOfMass = preset.centerOfMassOffset;
            _rb.interpolation = RigidbodyInterpolation.Interpolate;
            _rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;

            SetupWheel(frontLeft, false);
            SetupWheel(frontRight, false);
            SetupWheel(rearLeft, true);
            SetupWheel(rearRight, true);
        }

        public void SetRoadWetness(float wetness01)
        {
            _wetGripMultiplier = Mathf.Lerp(1f, 0.76f, Mathf.Clamp01(wetness01));
        }

        public void ApplyUpgrades(float engineMult, float gripMult)
        {
            _engineUpgradeMult = Mathf.Clamp(engineMult, 0.85f, 1.45f);
            _gripUpgradeMult = Mathf.Clamp(gripMult, 0.85f, 1.35f);
            ConfigureChassisAndWheels();
        }

        public void ResetPhysics(Vector3 worldPos, Quaternion worldRot)
        {
            _rb.linearVelocity = Vector3.zero;
            _rb.angularVelocity = Vector3.zero;
            transform.SetPositionAndRotation(worldPos, worldRot);
            CurrentGear = 1;
            CurrentRpm = preset.idleRpm;
        }

        private void SetupWheel(WheelCollider wc, bool isRear)
        {
            if (wc == null) return;

            wc.suspensionDistance = preset.suspensionDistance;
            JointSpring spring = wc.suspensionSpring;
            spring.spring = preset.suspensionSpring;
            spring.damper = preset.suspensionDamper;
            spring.targetPosition = 0.45f;
            wc.suspensionSpring = spring;

            WheelFrictionCurve fwd = wc.forwardFriction;
            fwd.extremumSlip = 0.35f;
            fwd.extremumValue = 1.06f;
            fwd.asymptoteSlip = 0.85f;
            fwd.asymptoteValue = 0.68f;
            fwd.stiffness = preset.forwardStiffness * _gripUpgradeMult;
            wc.forwardFriction = fwd;

            WheelFrictionCurve side = wc.sidewaysFriction;
            side.extremumSlip = 0.28f;
            side.extremumValue = 1.02f;
            side.asymptoteSlip = 0.65f;
            side.asymptoteValue = 0.72f;
            side.stiffness = (isRear ? preset.sidewaysStiffness * 0.96f : preset.sidewaysStiffness) * _gripUpgradeMult;
            wc.sidewaysFriction = side;
        }

        public void StepSimulation(float throttle, float brake, float steer, bool handbrake, bool nitroActive, float dt)
        {
            if (_rb == null || preset == null) return;

            float forwardMs = Vector3.Dot(_rb.linearVelocity, transform.forward);
            SpeedKmh = _rb.linearVelocity.magnitude * 3.6f;

            StepTransmission(throttle, brake, forwardMs, dt);
            StepSteering(steer, dt);
            StepDrivetrain(throttle, brake, handbrake, nitroActive, forwardMs);
            StepTireFriction(handbrake);
            StepAntiRoll(frontLeft, frontRight, preset.antiRollStiffness);
            StepAntiRoll(rearLeft, rearRight, preset.antiRollStiffness * 0.9f);
            StepAerodynamics();
        }

        public void SyncWheelMeshes()
        {
            if (_colliders == null || _meshes == null) return;
            for (int i = 0; i < _colliders.Length; i++)
            {
                if (_colliders[i] == null || _meshes[i] == null) continue;
                _colliders[i].GetWorldPose(out Vector3 pos, out Quaternion rot);
                _meshes[i].SetPositionAndRotation(pos, rot);
            }
        }

        private void StepTransmission(float throttle, float brake, float forwardMs, float dt)
        {
            _shiftCooldown = Mathf.Max(0f, _shiftCooldown - dt);

            if (brake > 0.2f && forwardMs < 0.7f && throttle < 0.1f)
            {
                CurrentGear = 0;
            }
            else if (throttle > 0.1f && CurrentGear == 0 && forwardMs > -1f)
            {
                CurrentGear = 1;
            }

            float avgRearRpm = (rearLeft != null && rearRight != null)
                ? (Mathf.Abs(rearLeft.rpm) + Mathf.Abs(rearRight.rpm)) * 0.5f
                : 0f;

            int gearIdx = Mathf.Clamp(CurrentGear - 1, 0, preset.gearRatios.Length - 1);
            float ratio = CurrentGear == 0 ? 3.4f : preset.gearRatios[gearIdx];
            float targetRpm = Mathf.Clamp(
                preset.idleRpm + avgRearRpm * ratio * preset.finalDrive * 0.82f + throttle * 820f,
                preset.idleRpm,
                preset.redlineRpm
            );
            CurrentRpm = Mathf.Lerp(CurrentRpm, targetRpm, dt * 10f);

            if (CurrentGear > 0 && _shiftCooldown <= 0f)
            {
                if (CurrentRpm >= preset.shiftUpRpm && CurrentGear < preset.gearRatios.Length)
                {
                    CurrentGear++;
                    _shiftCooldown = 0.34f;
                }
                else if (CurrentRpm <= preset.shiftDownRpm && CurrentGear > 1 && forwardMs > 4f)
                {
                    CurrentGear--;
                    _shiftCooldown = 0.34f;
                }
            }
        }

        private void StepSteering(float steerInput, float dt)
        {
            float speedRatio = Mathf.Clamp01(SpeedKmh / Mathf.Max(1f, preset.topSpeedKmh));
            float maxAngle = Mathf.Lerp(preset.maxSteerAngle, preset.highSpeedSteerAngle, speedRatio);
            CurrentSteerAngle = Mathf.Lerp(CurrentSteerAngle, steerInput * maxAngle, dt * preset.steerResponse);

            if (frontLeft != null) frontLeft.steerAngle = CurrentSteerAngle < 0f ? CurrentSteerAngle * 1.08f : CurrentSteerAngle;
            if (frontRight != null) frontRight.steerAngle = CurrentSteerAngle > 0f ? CurrentSteerAngle * 1.08f : CurrentSteerAngle;
        }

        private void StepDrivetrain(float throttle, float brake, bool handbrake, bool nitroActive, float forwardMs)
        {
            float topSpeed = preset.topSpeedKmh + (nitroActive ? 48f : 0f);
            int gearIdx = Mathf.Clamp(CurrentGear - 1, 0, preset.gearRatios.Length - 1);
            float gearFactor = CurrentGear == 0 ? 0.65f : preset.gearRatios[gearIdx] / preset.gearRatios[0];

            float motorTorque = 0f;
            float brakeTorque = 0f;

            if (CurrentGear == 0)
            {
                motorTorque = -brake * preset.maxMotorTorque * 0.55f * _engineUpgradeMult;
                IsBraking = throttle > 0.1f;
                brakeTorque = IsBraking ? preset.maxBrakeTorque : 0f;
            }
            else
            {
                if (SpeedKmh < topSpeed)
                {
                    float boostMult = nitroActive ? 1.65f : 1f;
                    motorTorque = throttle * preset.maxMotorTorque * (0.45f + 0.55f * gearFactor) * boostMult * _engineUpgradeMult;
                }
                IsBraking = brake > 0.1f && forwardMs > 0.5f;
                brakeTorque = IsBraking ? brake * preset.maxBrakeTorque : 0f;
            }

            if (frontLeft != null) frontLeft.motorTorque = motorTorque * 0.30f;
            if (frontRight != null) frontRight.motorTorque = motorTorque * 0.30f;
            if (rearLeft != null) rearLeft.motorTorque = motorTorque * 0.70f;
            if (rearRight != null) rearRight.motorTorque = motorTorque * 0.70f;

            float frontBrake = brakeTorque * 0.65f;
            float rearBrake = handbrake ? preset.handbrakeTorque : brakeTorque * 0.35f;

            if (frontLeft != null) frontLeft.brakeTorque = frontBrake;
            if (frontRight != null) frontRight.brakeTorque = frontBrake;
            if (rearLeft != null) rearLeft.brakeTorque = rearBrake;
            if (rearRight != null) rearRight.brakeTorque = rearBrake;
        }

        private void StepTireFriction(bool handbrake)
        {
            float rearStiff = (handbrake ? preset.driftSidewaysStiffness : preset.sidewaysStiffness) * _gripUpgradeMult * _wetGripMultiplier;
            float frontStiff = preset.sidewaysStiffness * _gripUpgradeMult * _wetGripMultiplier;

            ApplySideStiffness(frontLeft, frontStiff);
            ApplySideStiffness(frontRight, frontStiff);
            ApplySideStiffness(rearLeft, rearStiff);
            ApplySideStiffness(rearRight, rearStiff);

            float maxSlip = 0f;
            for (int i = 0; i < _colliders.Length; i++)
            {
                if (_colliders[i] != null && _colliders[i].GetGroundHit(out WheelHit hit))
                {
                    float slip = Mathf.Max(Mathf.Abs(hit.sidewaysSlip), Mathf.Abs(hit.forwardSlip));
                    if (slip > maxSlip) maxSlip = slip;
                }
            }
            MaxWheelSlip = maxSlip;
            IsDrifting = SpeedKmh > 28f && (maxSlip > 0.42f || handbrake);
        }

        private static void ApplySideStiffness(WheelCollider wc, float value)
        {
            if (wc == null) return;
            WheelFrictionCurve curve = wc.sidewaysFriction;
            curve.stiffness = value;
            wc.sidewaysFriction = curve;
        }

        private void StepAntiRoll(WheelCollider left, WheelCollider right, float stiffness)
        {
            if (left == null || right == null) return;
            float travelL = 1f;
            float travelR = 1f;

            bool gL = left.GetGroundHit(out WheelHit hL);
            if (gL) travelL = (-left.transform.InverseTransformPoint(hL.point).y - left.radius) / left.suspensionDistance;

            bool gR = right.GetGroundHit(out WheelHit hR);
            if (gR) travelR = (-right.transform.InverseTransformPoint(hR.point).y - right.radius) / right.suspensionDistance;

            float force = (travelL - travelR) * stiffness;
            if (gL) _rb.AddForceAtPosition(left.transform.up * -force, left.transform.position);
            if (gR) _rb.AddForceAtPosition(right.transform.up * force, right.transform.position);
        }

        private void StepAerodynamics()
        {
            float speedSq = _rb.linearVelocity.sqrMagnitude;
            _rb.AddForce(-transform.up * (preset.downforceCoefficient * speedSq));
            _rb.AddForce(-_rb.linearVelocity * (preset.dragCoefficient * _rb.linearVelocity.magnitude));
        }
    }
}

using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class VehicleStatsApplier : MonoBehaviour
{
    public VehicleProfile profile;
    public WheelCollider[] wheels;
    private Rigidbody body;

    private void Awake()
    {
        body = GetComponent<Rigidbody>();
        ApplyProfile();
    }

    [ContextMenu("Apply Vehicle Profile")]
    public void ApplyProfile()
    {
        if (profile == null) return;
        if (body == null) body = GetComponent<Rigidbody>();
        body.mass = profile.mass;

        if (wheels == null) return;
        foreach (var wheel in wheels)
        {
            if (wheel == null) continue;
            var forward = wheel.forwardFriction;
            forward.stiffness = profile.grip;
            wheel.forwardFriction = forward;

            var sideways = wheel.sidewaysFriction;
            sideways.stiffness = profile.grip;
            wheel.sidewaysFriction = sideways;
        }
    }
}

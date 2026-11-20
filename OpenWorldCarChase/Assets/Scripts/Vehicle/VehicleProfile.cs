using UnityEngine;

public enum VehicleClass
{
    SportsCar, Supercar, Hypercar, MuscleCar, SUV,
    Sedan, OffRoad4x4, PickupTruck, PoliceCar, RaceCar
}

[CreateAssetMenu(menuName = "Project Velocity/Vehicle Profile")]
public class VehicleProfile : ScriptableObject
{
    public string displayName = "New Vehicle";
    public VehicleClass vehicleClass;

    [Header("Performance")]
    [Min(1)] public float maxSpeedKph = 180f;
    [Min(0)] public float acceleration = 1500f;
    [Min(0)] public float brakeForce = 3000f;
    [Range(10, 45)] public float steeringAngle = 30f;
    [Min(100)] public float mass = 1300f;
    [Range(0.1f, 2f)] public float grip = 1f;
    [Range(0f, 1f)] public float offRoadCapability = 0.2f;
}

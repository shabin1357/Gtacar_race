using UnityEngine;

[CreateAssetMenu(menuName = "Project Velocity/Vehicle Profile Library")]
public class VehicleProfileLibrary : ScriptableObject
{
    public VehicleProfile[] profiles;

    public VehicleProfile Find(VehicleClass type)
    {
        if (profiles == null) return null;
        foreach (var profile in profiles)
        {
            if (profile != null && profile.vehicleClass == type) return profile;
        }
        return null;
    }
}

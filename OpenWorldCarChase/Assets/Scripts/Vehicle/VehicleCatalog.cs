using UnityEngine;

public class VehicleCatalog : MonoBehaviour
{
    public VehicleProfileLibrary library;
    public VehicleClass selectedClass = VehicleClass.SportsCar;

    public VehicleProfile SelectedProfile =>
        library != null ? library.Find(selectedClass) : null;

    public void SelectVehicle(int classIndex)
    {
        if (classIndex < 0 || classIndex >= System.Enum.GetValues(typeof(VehicleClass)).Length)
            return;
        selectedClass = (VehicleClass)classIndex;
    }
}

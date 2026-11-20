#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using System.IO;

public static class VehiclePackGenerator
{
    private const string Root = "Assets/ProjectVelocityGenerated";

    private static readonly (string name, VehicleClass type, float speed, float accel, float brake,
        float steer, float mass, float grip, float offroad, float length, float width, float height)[] Data =
    {
        ("Sports Car", VehicleClass.SportsCar, 230, 1900, 3400, 32, 1350, 1.15f, 0.15f, 4.4f, 1.9f, 1.15f),
        ("Supercar", VehicleClass.Supercar, 320, 2600, 3900, 29, 1450, 1.25f, 0.05f, 4.6f, 2.0f, 1.15f),
        ("Hypercar", VehicleClass.Hypercar, 380, 3100, 4300, 27, 1550, 1.30f, 0.02f, 4.8f, 2.05f, 1.10f),
        ("Muscle Car", VehicleClass.MuscleCar, 210, 2300, 3200, 28, 1750, 0.95f, 0.10f, 4.9f, 2.0f, 1.35f),
        ("SUV", VehicleClass.SUV, 190, 1700, 3600, 30, 2200, 0.90f, 0.45f, 4.8f, 2.0f, 1.75f),
        ("Sedan", VehicleClass.Sedan, 200, 1600, 3300, 32, 1550, 1.00f, 0.12f, 4.7f, 1.85f, 1.40f),
        ("Off Road 4x4", VehicleClass.OffRoad4x4, 170, 1800, 3700, 34, 2350, 0.85f, 0.95f, 4.6f, 2.0f, 1.80f),
        ("Pickup Truck", VehicleClass.PickupTruck, 180, 1750, 3600, 30, 2250, 0.90f, 0.70f, 5.3f, 2.0f, 1.80f),
        ("Police Car", VehicleClass.PoliceCar, 220, 2000, 3900, 33, 1650, 1.05f, 0.20f, 4.8f, 1.95f, 1.45f),
        ("Race Car", VehicleClass.RaceCar, 290, 2800, 4200, 25, 1150, 1.40f, 0.01f, 4.5f, 2.0f, 1.00f)
    };

    [MenuItem("Project Velocity/Generate All Cars Pack")]
    public static void Generate()
    {
        EnsureFolders();
        var profiles = new VehicleProfile[Data.Length];

        for (int i = 0; i < Data.Length; i++)
        {
            var d = Data[i];
            string safe = d.name.Replace(" ", "");
            string path = Root + "/Profiles/" + safe + ".asset";
            var p = AssetDatabase.LoadAssetAtPath<VehicleProfile>(path);
            if (p == null) p = ScriptableObject.CreateInstance<VehicleProfile>();

            p.displayName = d.name;
            p.vehicleClass = d.type;
            p.maxSpeedKph = d.speed;
            p.acceleration = d.accel;
            p.brakeForce = d.brake;
            p.steeringAngle = d.steer;
            p.mass = d.mass;
            p.grip = d.grip;
            p.offRoadCapability = d.offroad;

            if (AssetDatabase.LoadAssetAtPath<VehicleProfile>(path) == null)
                AssetDatabase.CreateAsset(p, path);

            EditorUtility.SetDirty(p);
            profiles[i] = p;
            CreatePlaceholderPrefab(d.name, p, d.length, d.width, d.height);
        }

        string libPath = Root + "/VehicleProfileLibrary.asset";
        var library = AssetDatabase.LoadAssetAtPath<VehicleProfileLibrary>(libPath);
        if (library == null) library = ScriptableObject.CreateInstance<VehicleProfileLibrary>();
        library.profiles = profiles;
        if (AssetDatabase.LoadAssetAtPath<VehicleProfileLibrary>(libPath) == null)
            AssetDatabase.CreateAsset(library, libPath);

        EditorUtility.SetDirty(library);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("Project Velocity: generated 10 configurable vehicles with WheelColliders and VehicleProfileLibrary.");
    }

    private static void EnsureFolders()
    {
        foreach (var f in new[] { Root, Root + "/Profiles", Root + "/Prefabs" })
        {
            if (!AssetDatabase.IsValidFolder(f))
            {
                string parent = Path.GetDirectoryName(f).Replace("\\", "/");
                string name = Path.GetFileName(f);
                AssetDatabase.CreateFolder(parent, name);
            }
        }
    }

    private static void CreatePlaceholderPrefab(string name, VehicleProfile profile, float length, float width, float height)
    {
        var root = new GameObject(name);
        root.transform.position = Vector3.zero;
        var rb = root.AddComponent<Rigidbody>();
        rb.mass = profile.mass;

        var applier = root.AddComponent<VehicleStatsApplier>();
        applier.profile = profile;

        var body = GameObject.CreatePrimitive(PrimitiveType.Cube);
        body.name = "Body";
        body.transform.SetParent(root.transform, false);
        body.transform.localScale = new Vector3(width, height * 0.48f, length);
        body.transform.localPosition = new Vector3(0, height * 0.48f, 0);

        var cabin = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cabin.name = "Cabin";
        cabin.transform.SetParent(root.transform, false);
        cabin.transform.localScale = new Vector3(width * 0.78f, height * 0.42f, length * 0.42f);
        cabin.transform.localPosition = new Vector3(0, height * 0.9f, -length * 0.08f);
        Object.DestroyImmediate(cabin.GetComponent<Collider>());

        var wheelPositions = new[]
        {
            new Vector3(-width * 0.53f, 0.35f, length * 0.32f),
            new Vector3(width * 0.53f, 0.35f, length * 0.32f),
            new Vector3(-width * 0.53f, 0.35f, -length * 0.32f),
            new Vector3(width * 0.53f, 0.35f, -length * 0.32f)
        };

        var wheelCols = new WheelCollider[4];
        for (int i = 0; i < wheelPositions.Length; i++)
        {
            var wcGo = new GameObject("WheelCollider_" + (i + 1));
            wcGo.transform.SetParent(root.transform, false);
            wcGo.transform.localPosition = wheelPositions[i];
            var wc = wcGo.AddComponent<WheelCollider>();
            wc.radius = 0.36f;
            wheelCols[i] = wc;

            var wheel = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            wheel.name = "Wheel_" + (i + 1);
            Object.DestroyImmediate(wheel.GetComponent<Collider>());
            wheel.transform.SetParent(root.transform, false);
            wheel.transform.localPosition = wheelPositions[i];
            wheel.transform.localRotation = Quaternion.Euler(0, 0, 90);
            wheel.transform.localScale = new Vector3(0.72f, 0.16f, 0.72f);
        }

        applier.wheels = wheelCols;
        string path = Root + "/Prefabs/" + name.Replace(" ", "") + "_Placeholder.prefab";
        PrefabUtility.SaveAsPrefabAsset(root, path);
        Object.DestroyImmediate(root);
    }
}
#endif

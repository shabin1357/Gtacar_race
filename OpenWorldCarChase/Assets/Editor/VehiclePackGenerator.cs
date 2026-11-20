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
        // 18 Showroom Exotics, Sports, Classics & Track Prototypes
        ("Pegassi Ignus", VehicleClass.Hypercar, 375, 3050, 4300, 28, 1520, 1.36f, 0.04f, 4.78f, 2.08f, 1.11f),
        ("Benefactor SM722", VehicleClass.Hypercar, 350, 2920, 4150, 30, 1410, 1.28f, 0.04f, 4.72f, 1.98f, 1.06f),
        ("Overflod Entity MT", VehicleClass.Hypercar, 382, 3120, 4350, 27, 1480, 1.38f, 0.02f, 4.75f, 2.06f, 1.09f),
        ("Pegassi Torero XO", VehicleClass.Hypercar, 368, 2980, 4200, 28, 1510, 1.32f, 0.03f, 4.82f, 2.08f, 1.08f),
        ("Dewbauchee Champion", VehicleClass.Supercar, 342, 2760, 4050, 29, 1580, 1.27f, 0.06f, 4.74f, 2.02f, 1.14f),
        ("Ocelot Virtue", VehicleClass.Hypercar, 365, 3200, 4300, 30, 1620, 1.35f, 0.04f, 4.65f, 2.04f, 1.10f),
        ("Overflod Zeno", VehicleClass.Hypercar, 362, 2960, 4220, 28, 1460, 1.34f, 0.03f, 4.76f, 2.05f, 1.09f),
        ("Benefactor LM87", VehicleClass.RaceCar, 372, 3040, 4400, 26, 1120, 1.44f, 0.01f, 4.75f, 2.06f, 1.01f),
        ("Grotti Itali GTO Stinger", VehicleClass.Supercar, 325, 2680, 3950, 30, 1470, 1.26f, 0.06f, 4.65f, 1.98f, 1.16f),
        ("Lampadati Corsita", VehicleClass.Supercar, 332, 2740, 4000, 30, 1420, 1.29f, 0.05f, 4.62f, 2.00f, 1.13f),
        ("Obey 10F", VehicleClass.Supercar, 326, 2690, 3980, 31, 1490, 1.28f, 0.06f, 4.56f, 1.98f, 1.15f),
        ("Pfister Comet S2 Cabrio", VehicleClass.SportsCar, 305, 2520, 3850, 32, 1430, 1.24f, 0.08f, 4.52f, 1.94f, 1.14f),
        ("Pfister Growler", VehicleClass.SportsCar, 288, 2380, 3780, 33, 1340, 1.25f, 0.10f, 4.44f, 1.90f, 1.16f),
        ("Toundra Panthere", VehicleClass.SportsCar, 268, 2240, 3650, 33, 1210, 1.23f, 0.14f, 4.35f, 1.88f, 1.15f),
        ("Bravado Buffalo EVX", VehicleClass.MuscleCar, 274, 2780, 3680, 29, 1890, 1.12f, 0.12f, 4.92f, 2.02f, 1.32f),
        ("Ubermacht Cypher", VehicleClass.SportsCar, 276, 2340, 3720, 33, 1460, 1.24f, 0.10f, 4.50f, 1.95f, 1.22f),
        ("Annis 300R", VehicleClass.SportsCar, 265, 2260, 3620, 33, 1380, 1.20f, 0.12f, 4.46f, 1.90f, 1.18f),
        ("Classique Broadway", VehicleClass.MuscleCar, 188, 1580, 3150, 31, 1840, 0.94f, 0.15f, 5.05f, 1.98f, 1.46f),

        // 20 Open-World Fleet, Off-Road, Classic & Service Vehicles
        ("Feltzer Widebody GT", VehicleClass.SportsCar, 295, 2480, 3820, 32, 1420, 1.26f, 0.08f, 4.55f, 2.02f, 1.18f),
        ("Comet Turbo GT", VehicleClass.SportsCar, 302, 2540, 3880, 32, 1370, 1.25f, 0.09f, 4.48f, 1.94f, 1.16f),
        ("Bodhi Open Top 4x4", VehicleClass.PickupTruck, 174, 1760, 3450, 34, 2150, 0.90f, 0.92f, 4.95f, 1.96f, 1.66f),
        ("Banshee V10 Coupe", VehicleClass.SportsCar, 314, 2620, 3900, 31, 1440, 1.22f, 0.07f, 4.62f, 1.98f, 1.14f),
        ("Bullet Le Mans GT", VehicleClass.Supercar, 334, 2740, 4000, 29, 1390, 1.28f, 0.05f, 4.64f, 2.02f, 1.07f),
        ("Cheetah Corsa", VehicleClass.Hypercar, 356, 2910, 4180, 29, 1410, 1.33f, 0.04f, 4.68f, 2.04f, 1.08f),
        ("Buffalo S Sport Sedan", VehicleClass.Sedan, 256, 2240, 3550, 31, 1740, 1.08f, 0.14f, 4.90f, 1.98f, 1.38f),
        ("Mesa Trail 4x4", VehicleClass.OffRoad4x4, 176, 1840, 3720, 34, 2260, 0.90f, 0.98f, 4.58f, 1.98f, 1.78f),
        ("Coastal Minivan MPV", VehicleClass.SUV, 182, 1520, 3350, 32, 1960, 0.94f, 0.22f, 4.92f, 1.96f, 1.72f),
        ("Adder W16 Hypercar", VehicleClass.Hypercar, 386, 3140, 4320, 27, 1620, 1.34f, 0.03f, 4.74f, 2.08f, 1.11f),
        ("Sabre Turbo Classic", VehicleClass.MuscleCar, 242, 2380, 3300, 29, 1690, 0.98f, 0.12f, 4.94f, 1.98f, 1.30f),
        ("Patriot H2 Tactical", VehicleClass.OffRoad4x4, 186, 1860, 3780, 31, 2680, 0.92f, 0.94f, 4.98f, 2.16f, 1.88f),
        ("VCPD Patrol Cruiser", VehicleClass.PoliceCar, 248, 2220, 3980, 33, 1720, 1.12f, 0.24f, 4.94f, 1.96f, 1.44f),
        ("Voltic EV Roadster", VehicleClass.SportsCar, 284, 2840, 3920, 34, 1180, 1.30f, 0.08f, 4.24f, 1.88f, 1.06f),
        ("Park Ranger Patrol SUV", VehicleClass.SUV, 204, 1920, 3760, 31, 2420, 0.98f, 0.78f, 5.20f, 2.04f, 1.84f),
        ("Stallion Classic Fastback", VehicleClass.MuscleCar, 234, 2290, 3250, 29, 1680, 0.96f, 0.14f, 4.92f, 1.98f, 1.29f),
        ("ZType 1938 Classic", VehicleClass.MuscleCar, 248, 2150, 3420, 30, 1640, 1.06f, 0.12f, 5.08f, 1.96f, 1.36f),
        ("Regina Woodgrain Estate", VehicleClass.Sedan, 176, 1460, 3180, 31, 1860, 0.92f, 0.20f, 5.18f, 1.98f, 1.44f),
        ("Osiris Carbon Hypercar", VehicleClass.Hypercar, 374, 3060, 4280, 28, 1440, 1.36f, 0.03f, 4.74f, 2.06f, 1.09f),
        ("Downtown City Taxi", VehicleClass.Sedan, 214, 1850, 3560, 33, 1690, 1.04f, 0.16f, 4.94f, 1.96f, 1.44f)
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
        Debug.Log($"Project Velocity: generated {Data.Length} configurable vehicles with WheelColliders and VehicleProfileLibrary.");
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

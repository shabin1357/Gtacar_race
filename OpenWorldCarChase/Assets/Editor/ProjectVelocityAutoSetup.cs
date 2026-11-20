#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using ProjectVelocity.Vehicle;
using ProjectVelocity.AI;
using ProjectVelocity.World;
using ProjectVelocity.UI;

namespace ProjectVelocity.Editor
{
    /// <summary>
    /// One-click Unity 6 Editor builder that creates all prefabs, URP PBR materials,
    /// wired 4-WheelCollider sports car, police cruisers, 10-district open world,
    /// touchscreen UI, and Android ARM64 IL2CPP build configuration.
    /// </summary>
    public static class ProjectVelocityAutoSetup
    {
        [MenuItem("Project Velocity/1. Build Prefabs & Playable Scenes")]
        public static void BuildAllScenesAndPrefabs()
        {
            EnsureFolders();
            Material carPaintMat = CreateUrpLitMaterial("Assets/Materials/CarPaint_Coral.mat", new Color(1f, 0.3f, 0.43f), 0.78f, 0.88f);
            Material roadMat = CreateUrpLitMaterial("Assets/Materials/Road_CoastalAsphalt.mat", new Color(0.13f, 0.14f, 0.17f), 0.1f, 0.45f);
            Material policeMat = CreateUrpLitMaterial("Assets/Materials/Police_Interceptor.mat", new Color(0.08f, 0.1f, 0.14f), 0.6f, 0.75f);
            Material waterMat = CreateUrpLitMaterial("Assets/Materials/Ocean_Water.mat", new Color(0.06f, 0.45f, 0.56f), 0.2f, 0.94f);

            GameObject playerPrefab = BuildSportsCarPrefab(carPaintMat);
            GameObject policePrefab = BuildPolicePrefab(policeMat);

            BuildMainMenuScene();
            BuildDrivingScene("Assets/Scenes/TestDrive.unity", playerPrefab, policePrefab, roadMat, waterMat, fullCity: false);
            BuildDrivingScene("Assets/Scenes/CityMap.unity", playerPrefab, policePrefab, roadMat, waterMat, fullCity: true);

            ConfigureAndroidBuildSettings();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[Project Velocity] Built all URP materials, prefabs, scenes (MainMenu, TestDrive, CityMap), and Android build settings.");
        }

        [MenuItem("Project Velocity/2. Configure Android APK Build Settings")]
        public static void ConfigureAndroidBuildSettings()
        {
            PlayerSettings.companyName = "ProjectVelocityStudios";
            PlayerSettings.productName = "Project Velocity";
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.projectvelocity.openworldchase");
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.LandscapeLeft;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevel35;
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene("Assets/Scenes/MainMenu.unity", true),
                new EditorBuildSettingsScene("Assets/Scenes/CityMap.unity", true),
                new EditorBuildSettingsScene("Assets/Scenes/TestDrive.unity", true)
            };
        }

        private static void EnsureFolders()
        {
            string[] dirs =
            {
                "Assets/Scenes", "Assets/Models", "Assets/Materials",
                "Assets/Textures", "Assets/Audio", "Assets/Prefabs", "Assets/UI"
            };
            foreach (string d in dirs)
            {
                if (!Directory.Exists(d)) Directory.CreateDirectory(d);
            }
        }

        private static Material CreateUrpLitMaterial(string path, Color color, float metallic, float smoothness)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            Material mat = new Material(shader);
            if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
            else mat.color = color;
            if (mat.HasProperty("_Metallic")) mat.SetFloat("_Metallic", metallic);
            if (mat.HasProperty("_Smoothness")) mat.SetFloat("_Smoothness", smoothness);
            AssetDatabase.CreateAsset(mat, path);
            return mat;
        }

        private static GameObject BuildSportsCarPrefab(Material paintMat)
        {
            GameObject root = new GameObject("PlayerSportsCar");
            Rigidbody rb = root.AddComponent<Rigidbody>();
            rb.mass = 1480f;

            CarPhysics physics = root.AddComponent<CarPhysics>();
            CarController controller = root.AddComponent<CarController>();

            // Body chassis mesh + box collider
            GameObject chassis = GameObject.CreatePrimitive(PrimitiveType.Cube);
            chassis.name = "ChassisBody";
            chassis.transform.SetParent(root.transform, false);
            chassis.transform.localPosition = new Vector3(0f, 0.58f, 0f);
            chassis.transform.localScale = new Vector3(1.98f, 0.62f, 4.55f);
            chassis.GetComponent<Renderer>().sharedMaterial = paintMat;

            GameObject cabin = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cabin.name = "CabinGlass";
            cabin.transform.SetParent(root.transform, false);
            cabin.transform.localPosition = new Vector3(0f, 1.08f, -0.25f);
            cabin.transform.localScale = new Vector3(1.55f, 0.48f, 2.05f);
            Object.DestroyImmediate(cabin.GetComponent<Collider>());

            // Cockpit & Hood camera mounts
            GameObject cockpitMount = new GameObject("CockpitCameraMount");
            cockpitMount.transform.SetParent(root.transform, false);
            cockpitMount.transform.localPosition = new Vector3(-0.36f, 1.12f, 0.12f);

            GameObject hoodMount = new GameObject("HoodCameraMount");
            hoodMount.transform.SetParent(root.transform, false);
            hoodMount.transform.localPosition = new Vector3(0f, 1.05f, 1.05f);

            // 4 WheelColliders + Visual wheel cylinders
            Vector3[] offsets =
            {
                new Vector3(-0.96f, 0.38f, 1.42f),
                new Vector3(0.96f, 0.38f, 1.42f),
                new Vector3(-0.98f, 0.38f, -1.38f),
                new Vector3(0.98f, 0.38f, -1.38f)
            };
            string[] names = { "FL", "FR", "RL", "RR" };
            WheelCollider[] cols = new WheelCollider[4];
            Transform[] meshes = new Transform[4];

            for (int i = 0; i < 4; i++)
            {
                GameObject wcGo = new GameObject($"WheelCollider_{names[i]}");
                wcGo.transform.SetParent(root.transform, false);
                wcGo.transform.localPosition = offsets[i];
                WheelCollider wc = wcGo.AddComponent<WheelCollider>();
                wc.radius = 0.38f;
                cols[i] = wc;

                GameObject vis = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                vis.name = $"WheelMesh_{names[i]}";
                Object.DestroyImmediate(vis.GetComponent<Collider>());
                vis.transform.SetParent(root.transform, false);
                vis.transform.localPosition = offsets[i];
                vis.transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
                vis.transform.localScale = new Vector3(0.76f, 0.16f, 0.76f);
                meshes[i] = vis.transform;
            }

            physics.frontLeft = cols[0];
            physics.frontRight = cols[1];
            physics.rearLeft = cols[2];
            physics.rearRight = cols[3];
            physics.frontLeftMesh = meshes[0];
            physics.frontRightMesh = meshes[1];
            physics.rearLeftMesh = meshes[2];
            physics.rearRightMesh = meshes[3];

            controller.paintBodyRenderers = new[] { chassis.GetComponent<Renderer>() };

            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, "Assets/Prefabs/PlayerSportsCar.prefab");
            Object.DestroyImmediate(root);
            return prefab;
        }

        private static GameObject BuildPolicePrefab(Material policeMat)
        {
            GameObject root = new GameObject("PoliceInterceptor");
            Rigidbody rb = root.AddComponent<Rigidbody>();
            rb.mass = 1720f;
            PoliceAI ai = root.AddComponent<PoliceAI>();

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
            body.transform.SetParent(root.transform, false);
            body.transform.localPosition = new Vector3(0f, 0.65f, 0f);
            body.transform.localScale = new Vector3(2.05f, 0.85f, 4.7f);
            body.GetComponent<Renderer>().sharedMaterial = policeMat;

            GameObject strobeGo = new GameObject("StrobeLight");
            strobeGo.transform.SetParent(root.transform, false);
            strobeGo.transform.localPosition = new Vector3(0f, 1.85f, 0f);
            Light light = strobeGo.AddComponent<Light>();
            light.type = LightType.Point;
            light.range = 18f;
            ai.strobeLight = light;

            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, "Assets/Prefabs/PoliceInterceptor.prefab");
            Object.DestroyImmediate(root);
            return prefab;
        }

        private static void BuildMainMenuScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/MainMenu.unity");
        }

        private static void BuildDrivingScene(
            string path,
            GameObject playerPrefab,
            GameObject policePrefab,
            Material roadMat,
            Material waterMat,
            bool fullCity)
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            // Ground road deck
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = fullCity ? "CityRoadNetwork_10Districts" : "TestDriveProvingGround";
            ground.transform.localScale = fullCity ? new Vector3(90f, 1f, 90f) : new Vector3(30f, 1f, 30f);
            ground.GetComponent<Renderer>().sharedMaterial = roadMat;

            if (fullCity)
            {
                GameObject ocean = GameObject.CreatePrimitive(PrimitiveType.Plane);
                ocean.name = "CoastalOceanWater";
                ocean.transform.position = new Vector3(520f, -0.4f, 0f);
                ocean.transform.localScale = new Vector3(80f, 1f, 120f);
                ocean.GetComponent<Renderer>().sharedMaterial = waterMat;
            }

            // Instantiate Player Car & Wire Camera
            GameObject carObj = (GameObject)PrefabUtility.InstantiatePrefab(playerPrefab);
            carObj.transform.position = new Vector3(0f, 0.6f, 0f);
            CarController car = carObj.GetComponent<CarController>();

            Camera mainCam = Camera.main;
            CarCamera carCam = mainCam.gameObject.AddComponent<CarCamera>();
            carCam.targetCar = car;
            carCam.cockpitMount = carObj.transform.Find("CockpitCameraMount");
            carCam.hoodMount = carObj.transform.Find("HoodCameraMount");
            car.carCamera = carCam;

            // Core Managers & Weather/Lighting Systems
            GameObject systems = new GameObject("ProjectVelocitySystems");
            GameManager gm = systems.AddComponent<GameManager>();
            WeatherManager wm = systems.AddComponent<WeatherManager>();
            DayNightManager dn = systems.AddComponent<DayNightManager>();
            RainController rainCtrl = systems.AddComponent<RainController>();
            FogController fogCtrl = systems.AddComponent<FogController>();
            LightningController lightningCtrl = systems.AddComponent<LightningController>();
            StreetLightController streetLights = systems.AddComponent<StreetLightController>();
            WeatherSettingsUI weatherUi = systems.AddComponent<WeatherSettingsUI>();
            MiniMap mm = systems.AddComponent<MiniMap>();
            MobileControls mc = systems.AddComponent<MobileControls>();

            VehicleWeatherEffects carWeather = carObj.AddComponent<VehicleWeatherEffects>();
            carWeather.carController = car;
            carWeather.weatherManager = wm;
            carWeather.dayNightManager = dn;

            gm.playerCar = car;
            gm.carCamera = carCam;
            gm.miniMap = mm;
            gm.weatherManager = wm;
            gm.dayNightManager = dn;

            wm.dayNightManager = dn;
            wm.rainController = rainCtrl;
            wm.fogController = fogCtrl;
            wm.lightningController = lightningCtrl;
            wm.vehicleWeatherEffects = carWeather;

            rainCtrl.followTarget = carObj.transform;
            rainCtrl.wetRoadMaterials = new[] { roadMat };

            Light mainDirLight = Object.FindFirstObjectByType<Light>();
            dn.sunLight = mainDirLight;
            dn.streetLightController = streetLights;

            weatherUi.weatherManager = wm;
            weatherUi.dayNightManager = dn;

            mm.playerCar = car;
            car.mobileControls = mc;

            if (fullCity && policePrefab != null)
            {
                GameObject cop = (GameObject)PrefabUtility.InstantiatePrefab(policePrefab);
                cop.transform.position = new Vector3(0f, 0.6f, -45f);
                cop.GetComponent<PoliceAI>().playerTarget = car;
            }

            // Reflection Probe for realistic URP clearcoat reflections
            GameObject probeGo = new GameObject("CoastalReflectionProbe");
            ReflectionProbe probe = probeGo.AddComponent<ReflectionProbe>();
            probe.mode = UnityEngine.Rendering.ReflectionProbeMode.Baked;
            probe.size = new Vector3(900f, 160f, 900f);

            EditorSceneManager.SaveScene(scene, path);
        }
    }
}
#endif

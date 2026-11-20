import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ProceduralAudio } from './audio';
import { ParticleSystem } from './particles';
import { loadSavedProfile, SavedProfile, writeSavedProfile } from './saveSystem';
import {
  AtmosphereState,
  createAtmosphereState,
  createOceanWater,
  createSkyDome,
  evaluateAtmosphere,
  OceanWaterSystem,
  SkySystem,
} from './skyAndWater';
import { createProceduralTextures, ProceduralTextureSet } from './textures';
import {
  BuildingCollider,
  CameraMode,
  CAR_PAINTS,
  CustomizationState,
  formatTime24,
  GameMode,
  GamePhase,
  GpsTarget,
  GraphicsQuality,
  HudSnapshot,
  MinimapUnit,
  PursuitAlert,
  RIM_FINISHES,
  TouchInputState,
  UNDERGLOW_OPTIONS,
  VEHICLE_SPECS,
  VehicleSpec,
  WEATHER_OPTIONS,
  WeatherCondition,
} from './types';
import {
  CivilianCarRig,
  createCivilianVehicle,
  createPoliceVehicle,
  createPlayerSupercar,
  createStreetRacerVehicle,
  PlayerCarRig,
  PoliceCarRig,
} from './vehicles';
import {
  buildLeonidaWorld,
  PLAYABLE_MAX_X,
  PLAYABLE_MAX_Z,
  PLAYABLE_MIN_X,
  PLAYABLE_MIN_Z,
  ROAD_COORDS,
  WorldBuildResult,
} from './world';

interface PoliceAgent {
  rig: PoliceCarRig;
  isSwat: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  rotY: number;
  speed: number;
  hp: number;
  disabledTimer: number;
  flankSide: number;
}

interface TrafficAgent {
  rig: CivilianCarRig;
  x: number;
  z: number;
  rotY: number;
  axis: 'ns' | 'ew';
  dir: 1 | -1;
  laneCoord: number;
  cruiseSpeed: number;
  currentSpeed: number;
  bumpVx: number;
  bumpVz: number;
}

interface StreetRacerAgent {
  rig: CivilianCarRig;
  x: number;
  z: number;
  rotY: number;
  speed: number;
  checkpointIndex: number;
  topSpeed: number;
  laneBias: number;
}

interface WaypointPoint {
  x: number;
  z: number;
  label: string;
}

const CIRCUIT_CHECKPOINTS: WaypointPoint[] = [
  { x: 200, z: -100, label: 'Ocean Drive North' },
  { x: 0, z: -100, label: 'Downtown Straight' },
  { x: -200, z: -100, label: 'Industrial Highway' },
  { x: -200, z: 100, label: 'Residential Curve' },
  { x: 100, z: 150, label: 'Airport Runway' },
  { x: 200, z: 100, label: 'Coastal Finish' },
];

const MISSION_WAYPOINTS: WaypointPoint[] = [
  { x: -100, z: -100, label: 'Pickup: Industrial Docks' },
  { x: 100, z: 150, label: 'Drop-off: Airport Hangar' },
  { x: 310, z: 0, label: 'Escape: Bay Bridge' },
];

const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _smoothedLookAt = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class ViceRunEngine {
  private readonly container: HTMLElement;
  private readonly onHudUpdate: (snapshot: HudSnapshot) => void;
  private readonly onContextStatus?: (lost: boolean) => void;
  private readonly isSoftwareGl: boolean;

  private renderer!: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private envRT: THREE.WebGLRenderTarget | null = null;

  // Lighting & Atmosphere
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private fog!: THREE.FogExp2;
  private atmosphere: AtmosphereState = createAtmosphereState();

  // World & Systems
  private textures!: ProceduralTextureSet;
  private sky!: SkySystem;
  private ocean!: OceanWaterSystem;
  private world!: WorldBuildResult;
  private particles!: ParticleSystem;
  private audio = new ProceduralAudio();

  // Weather Rain, Wind & Jagged Sky Lightning Bolt (Screenshot #7)
  private rainLines!: THREE.LineSegments;
  private rainPositions!: Float32Array;
  private lightningBolt!: THREE.Line;
  private lightningFlash = 0;
  private lightningCooldown = 4.5;
  private pendingThunderTimer = -1;
  private pendingThunderVol = 0.8;
  private wetness = 0.6;
  private autoWeatherTimer = 0;

  // 3D Holographic Road GPS Chevrons (Solar Crown Screenshot #4!) & Sky Beacons
  private gpsBeaconGroup!: THREE.Group;
  private checkpointBeaconGroup!: THREE.Group;
  private roadGpsChevrons: THREE.Mesh[] = [];

  // Vehicles
  private playerRig!: PlayerCarRig;
  private policePool: PoliceAgent[] = [];
  private trafficPool: TrafficAgent[] = [];
  private streetRacers: StreetRacerAgent[] = [];

  // Persistent Settings & Customization
  private savedProfile: SavedProfile;
  private timeOfDayHours = 20.4;
  private autoDayNight = false;
  private weather: WeatherCondition = 'light_rain';
  private weatherIntensity = 0.75;
  private autoWeather = false;
  private graphicsQuality: GraphicsQuality = 'high';
  private cameraMode: CameraMode = 'chase';
  private customization: CustomizationState;
  private vehicleSpec: VehicleSpec = VEHICLE_SPECS[0];
  private paused = false;

  // Game Mode & GPS State
  private gameMode: GameMode = 'freeroam';
  private activeCheckpoints: WaypointPoint[] = [];
  private checkpointIdx = 0;
  private modeTimer = 0;
  private customGps: { x: number; z: number; label: string } | null = null;

  // Player Physics State
  private phase: GamePhase = 'title';
  private px = 200;
  private py = 0;
  private pz = 110;
  private pvx = 0;
  private pvy = 0;
  private pvz = 0;
  private pRotY = Math.PI;
  private pSteer = 0;
  private pPitch = 0;
  private pRoll = 0;
  private nitro = 100;
  private health = 100;
  private isDrifting = false;
  private isBoosting = false;
  private isAirborne = false;
  private airTimer = 0;
  private airTimeBest = 0;

  // Pursuit State
  private wantedLevel = 1;
  private heatScore = 0;
  private evadeTimer = 0;
  private isEvading = false;
  private bustTimer = 0;
  private score = 0;
  private takedowns = 0;
  private topSpeedMph = 0;
  private chaseSeconds = 0;
  private driftScoreBuffer = 0;

  // Alerts & Camera
  private alertSeq = 1;
  private activeAlert: PursuitAlert | null = null;
  private alertTimer = 0;
  private lastDistrictId = '';
  private camShake = 0;
  private titleOrbitAngle = 0.26;

  // Inputs
  private keys = new Set<string>();
  private touchInput: TouchInputState = {
    throttle: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  };

  // Loop & FPS
  private frameId = 0;
  private disposed = false;
  private contextLost = false;
  private lastTimestamp = 0;
  private elapsed = 0;
  private hudEmitAccum = 0;
  private smokeAccum = 0;
  private sprayAccum = 0;
  private nitroParticleAccum = 0;
  private fpsFrames = 0;
  private fpsAccum = 0;
  private measuredFps = 60;

  private readonly handleResizeBound: () => void;
  private readonly handleKeyDownBound: (e: KeyboardEvent) => void;
  private readonly handleKeyUpBound: (e: KeyboardEvent) => void;
  private readonly handleBlurBound: () => void;
  private readonly handleContextLostBound: (e: Event) => void;
  private readonly handleContextRestoredBound: () => void;

  constructor(
    container: HTMLElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onContextStatus?: (lost: boolean) => void
  ) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.onContextStatus = onContextStatus;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.savedProfile = loadSavedProfile();
    this.customization = { ...this.savedProfile.customization };
    this.timeOfDayHours = this.savedProfile.timeOfDayHours;
    this.weather = this.savedProfile.weather;
    this.weatherIntensity = this.savedProfile.weatherIntensity;
    this.autoWeather = this.savedProfile.autoWeather;
    this.graphicsQuality = this.savedProfile.graphicsQuality;
    this.autoDayNight = this.savedProfile.autoDayNight;
    this.vehicleSpec =
      VEHICLE_SPECS.find((v) => v.id === this.customization.vehicleId) ?? VEHICLE_SPECS[1];

    const wMeta = WEATHER_OPTIONS.find((w) => w.id === this.weather) ?? WEATHER_OPTIONS[0];
    this.wetness = wMeta.wetnessTarget * this.weatherIntensity;

    this.handleResizeBound = this.handleResize.bind(this);
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleBlurBound = () => this.keys.clear();
    this.handleContextLostBound = (e: Event) => {
      e.preventDefault();
      this.contextLost = true;
      this.onContextStatus?.(true);
    };
    this.handleContextRestoredBound = () => {
      this.contextLost = false;
      this.onContextStatus?.(false);
    };

    this.initScene();
    this.bindEvents();
    this.emitHud();

    this.lastTimestamp = performance.now();
    this.tick(this.lastTimestamp);
  }

  private initScene(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !this.isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    this.container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    this.scene = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = this.envRT.texture;
    pmrem.dispose();

    evaluateAtmosphere(
      this.atmosphere,
      this.timeOfDayHours,
      this.weather,
      this.weatherIntensity,
      0
    );

    this.fog = new THREE.FogExp2(this.atmosphere.fogColor.getHex(), this.atmosphere.fogDensity);
    scene.fog = this.fog;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.2, 1200);
    camera.position.set(206, 4.4, 122);
    this.camera = camera;

    const sunLight = new THREE.DirectionalLight(
      this.atmosphere.sunLightColor,
      this.atmosphere.sunLightIntensity
    );
    sunLight.position.set(280, 90, 60);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 92;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 380;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);
    scene.add(sunLight.target);
    this.sunLight = sunLight;

    const hemiLight = new THREE.HemisphereLight(
      this.atmosphere.hemiSkyColor,
      this.atmosphere.hemiGroundColor,
      this.atmosphere.hemiIntensity
    );
    scene.add(hemiLight);
    this.hemiLight = hemiLight;

    const rimLight = new THREE.DirectionalLight(
      this.atmosphere.rimLightColor,
      this.atmosphere.rimLightIntensity
    );
    rimLight.position.set(-140, 65, 110);
    scene.add(rimLight);
    this.rimLight = rimLight;

    this.textures = createProceduralTextures(renderer);
    this.sky = createSkyDome(this.atmosphere);
    scene.add(this.sky.mesh);

    this.ocean = createOceanWater(this.atmosphere);
    scene.add(this.ocean.mesh);

    this.world = buildLeonidaWorld(this.textures);
    scene.add(this.world.group);

    this.particles = new ParticleSystem();
    scene.add(this.particles.mesh);

    this.initRainAndLightning();
    this.initGpsVisuals();

    const initialPaint =
      CAR_PAINTS.find((p) => p.id === this.customization.paintId) ?? CAR_PAINTS[0];
    this.playerRig = createPlayerSupercar(
      initialPaint,
      this.textures.contactShadow,
      this.textures.raindropGlass
    );
    this.playerRig.root.position.set(this.px, this.py, this.pz);
    this.playerRig.root.rotation.y = this.pRotY;
    scene.add(this.playerRig.root);
    _smoothedLookAt.set(this.px, 1.4, this.pz - 8);

    this.applyCustomizationVisuals();
    this.initPolicePool();
    this.initTrafficPool();
    this.initStreetRacers();
    this.syncAtmosphereToScene();

    // Default helpful GPS pin at Downtown Shopping Plaza on title so holographic chevrons shine immediately!
    this.customGps = { x: 200, z: -50, label: 'Ocean Drive Strip' };
    this.gpsBeaconGroup.position.set(200, 0, -50);
    this.gpsBeaconGroup.visible = true;

    if (!this.isSoftwareGl) {
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)),
        0.48,
        0.52,
        0.82
      );
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      this.composer = composer;
      this.bloomPass = bloom;
      renderer.compile(scene, camera);
    }

    this.applyGraphicsQuality(this.graphicsQuality, false);
  }

  private initRainAndLightning(): void {
    const dropCount = 460;
    const positions = new Float32Array(dropCount * 6);
    for (let i = 0; i < dropCount; i++) {
      const rx = (Math.random() - 0.5) * 74;
      const ry = Math.random() * 30;
      const rz = (Math.random() - 0.5) * 74;
      positions[i * 6] = rx;
      positions[i * 6 + 1] = ry;
      positions[i * 6 + 2] = rz;
      positions[i * 6 + 3] = rx - 0.22;
      positions[i * 6 + 4] = ry - 1.65;
      positions[i * 6 + 5] = rz;
    }
    this.rainPositions = positions;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xd8ecff,
      transparent: true,
      opacity: 0.45,
    });
    this.rainLines = new THREE.LineSegments(geo, mat);
    this.rainLines.frustumCulled = false;
    this.scene.add(this.rainLines);

    // Jagged 3D Sky Lightning Bolt (Thunderstorm Screenshot #7!)
    const boltPts: THREE.Vector3[] = [];
    for (let i = 0; i < 14; i++) {
      boltPts.push(new THREE.Vector3(0, 140 - i * 10, 0));
    }
    const boltGeo = new THREE.BufferGeometry().setFromPoints(boltPts);
    const boltMat = new THREE.LineBasicMaterial({
      color: 0xeef6ff,
      transparent: true,
      opacity: 0.96,
      fog: false,
    });
    this.lightningBolt = new THREE.Line(boltGeo, boltMat);
    this.lightningBolt.visible = false;
    this.lightningBolt.frustumCulled = false;
    this.scene.add(this.lightningBolt);
  }

  private triggerLightningBolt(): void {
    const fwdX = Math.sin(this.pRotY);
    const fwdZ = Math.cos(this.pRotY);
    const sideAngle = (Math.random() - 0.5) * 0.9;
    const dist = 140 + Math.random() * 140;
    const bx = this.px + (fwdX * Math.cos(sideAngle) - fwdZ * Math.sin(sideAngle)) * dist;
    const bz = this.pz + (fwdX * Math.sin(sideAngle) + fwdZ * Math.cos(sideAngle)) * dist;

    const attr = this.lightningBolt.geometry.getAttribute('position') as THREE.BufferAttribute;
    let curX = bx;
    let curZ = bz;
    for (let i = 0; i < attr.count; i++) {
      const y = 155 - i * 11.5;
      curX += (Math.random() - 0.5) * 14;
      curZ += (Math.random() - 0.5) * 14;
      attr.setXYZ(i, curX, y, curZ);
    }
    attr.needsUpdate = true;
    this.lightningBolt.visible = true;
    this.lightningFlash = 1.0;

    // Realistic speed-of-sound thunder delay (0.55s - 2.1s)
    this.pendingThunderTimer = 0.55 + (dist / 280) * 1.6;
    this.pendingThunderVol = THREE.MathUtils.clamp(1.1 - dist / 320, 0.35, 1.0) * this.weatherIntensity;
  }

  private initGpsVisuals(): void {
    this.gpsBeaconGroup = this.createBeaconMesh(0x10b981, 4.8);
    this.gpsBeaconGroup.visible = false;
    this.scene.add(this.gpsBeaconGroup);

    this.checkpointBeaconGroup = this.createBeaconMesh(0xfbbf24, 7.0);
    this.checkpointBeaconGroup.visible = false;
    this.scene.add(this.checkpointBeaconGroup);

    // Glowing Holographic Cyan Road Chevrons (Test Drive Solar Crown Screenshot #4!)
    const chevShape = new THREE.Shape();
    chevShape.moveTo(0, 1.25);
    chevShape.lineTo(1.55, -0.55);
    chevShape.lineTo(1.05, -0.95);
    chevShape.lineTo(0, 0.25);
    chevShape.lineTo(-1.05, -0.95);
    chevShape.lineTo(-1.55, -0.55);
    chevShape.closePath();

    const chevGeo = new THREE.ShapeGeometry(chevShape);
    chevGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(chevGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.roadGpsChevrons.push(mesh);
    }
  }

  private createBeaconMesh(hex: number, radius: number): THREE.Group {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.82, radius, 32),
      new THREE.MeshBasicMaterial({
        color: hex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.16;
    g.add(ring);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.14, radius * 0.45, 58, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.y = 29;
    g.add(beam);
    return g;
  }

  private initPolicePool(): void {
    for (let i = 0; i < 8; i++) {
      const isSwat = i >= 5;
      const rig = createPoliceVehicle(isSwat, this.textures.contactShadow);
      rig.root.visible = false;
      this.scene.add(rig.root);
      this.policePool.push({
        rig,
        isSwat,
        x: 0,
        z: -500,
        vx: 0,
        vz: 0,
        rotY: 0,
        speed: 0,
        hp: isSwat ? 150 : 100,
        disabledTimer: 0,
        flankSide: i % 2 === 0 ? 1 : -1,
      });
    }
  }

  private initTrafficPool(): void {
    const colors = [
      0xf8fafc, 0x38bdf8, 0xd91c2b, 0xfbbf24, 0x34d399, 0x1e293b, 0x94a3b8, 0xf97316, 0x0d74c8,
    ];
    const styles: ('coupe' | 'sedan' | 'suv')[] = ['coupe', 'sedan', 'suv'];
    for (let i = 0; i < 18; i++) {
      const axis: 'ns' | 'ew' = i % 2 === 0 ? 'ns' : 'ew';
      const dir: 1 | -1 = i % 4 < 2 ? 1 : -1;
      const roadBase = ROAD_COORDS[i % ROAD_COORDS.length];
      const laneOffset = axis === 'ns' ? (dir === 1 ? -5.2 : 5.2) : dir === 1 ? 5.2 : -5.2;
      const laneCoord = roadBase + laneOffset;
      const along = -200 + ((i * 53) % 400);

      const rig = createCivilianVehicle(
        styles[i % styles.length],
        colors[i % colors.length],
        this.textures.contactShadow
      );
      const x = axis === 'ns' ? laneCoord : along;
      const z = axis === 'ns' ? along : laneCoord;
      const rotY = axis === 'ns' ? (dir === 1 ? 0 : Math.PI) : dir === 1 ? Math.PI / 2 : -Math.PI / 2;

      rig.root.position.set(x, 0, z);
      rig.root.rotation.y = rotY;
      this.scene.add(rig.root);

      this.trafficPool.push({
        rig,
        x,
        z,
        rotY,
        axis,
        dir,
        laneCoord,
        cruiseSpeed: 13 + (i % 5) * 2.4,
        currentSpeed: 14,
        bumpVx: 0,
        bumpVz: 0,
      });
    }
  }

  private initStreetRacers(): void {
    const racerColors = [0x38bdf8, 0xd91c2b, 0x22c55e];
    const speeds = [48, 52, 56];
    for (let i = 0; i < 3; i++) {
      const rig = createStreetRacerVehicle(racerColors[i], this.textures.contactShadow);
      rig.root.visible = false;
      this.scene.add(rig.root);
      this.streetRacers.push({
        rig,
        x: 200,
        z: 100,
        rotY: Math.PI,
        speed: 0,
        checkpointIndex: 0,
        topSpeed: speeds[i],
        laneBias: (i - 1) * 4.2,
      });
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResizeBound);
    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);
    window.addEventListener('blur', this.handleBlurBound);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLostBound);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestoredBound);
  }

  private handleResize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) this.composer.setSize(width, height);
    if (this.bloomPass) {
      this.bloomPass.resolution.set(Math.floor(width / 2), Math.floor(height / 2));
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) &&
      this.phase === 'playing' &&
      !this.paused
    ) {
      e.preventDefault();
    }
    this.keys.add(code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  // --- Public Controls API ---

  public getInitialProfile(): SavedProfile {
    return this.savedProfile;
  }

  public startGame(mode: GameMode = 'freeroam'): void {
    this.audio.unlock();
    this.paused = false;
    this.resetRunState();
    this.phase = 'playing';
    this.startGameMode(mode);
    this.emitHud();
  }

  public restartGame(): void {
    this.audio.unlock();
    this.paused = false;
    this.resetRunState();
    this.phase = 'playing';
    this.startGameMode(this.gameMode);
    this.emitHud();
  }

  public startGameMode(mode: GameMode): void {
    this.gameMode = mode;
    this.checkpointIdx = 0;
    this.modeTimer = 0;
    this.paused = false;

    for (const r of this.streetRacers) r.rig.root.visible = false;
    this.checkpointBeaconGroup.visible = false;

    if (mode === 'freeroam') {
      this.activeCheckpoints = [];
      this.wantedLevel = Math.max(1, this.wantedLevel);
      this.pushAlert('Free Roam', '10 Coastal Districts Open · VCPD Active', 'cyan');
    } else if (mode === 'mission') {
      this.activeCheckpoints = MISSION_WAYPOINTS;
      this.modeTimer = 95;
      this.wantedLevel = 2;
      this.px = 200;
      this.pz = 120;
      this.pRotY = Math.PI;
      this.pvx = 0;
      this.pvz = -15;
      this.pushAlert('Getaway Contract', 'Follow holographic GPS to Industrial Docks', 'gold');
    } else if (mode === 'timetrial') {
      this.activeCheckpoints = CIRCUIT_CHECKPOINTS;
      this.modeTimer = 0;
      this.wantedLevel = 0;
      for (const c of this.policePool) c.rig.root.visible = false;
      this.px = 200;
      this.pz = 130;
      this.pRotY = Math.PI;
      this.pvx = 0;
      this.pvz = 0;
      this.nitro = 100;
      this.health = 100;
      this.pushAlert('Coastal Time Trial', 'Clear all 6 checkpoints at full throttle', 'cyan');
    } else if (mode === 'race') {
      this.activeCheckpoints = CIRCUIT_CHECKPOINTS;
      this.modeTimer = 0;
      this.wantedLevel = 1;
      this.px = 203.5;
      this.pz = 135;
      this.pRotY = Math.PI;
      this.pvx = 0;
      this.pvz = 0;
      this.nitro = 100;
      this.health = 100;
      const gridOffsets: [number, number][] = [
        [196.5, 135],
        [203.5, 126],
        [196.5, 126],
      ];
      this.streetRacers.forEach((r, idx) => {
        r.x = gridOffsets[idx][0];
        r.z = gridOffsets[idx][1];
        r.rotY = Math.PI;
        r.speed = 14;
        r.checkpointIndex = 0;
        r.rig.root.position.set(r.x, 0, r.z);
        r.rig.root.rotation.y = r.rotY;
        r.rig.root.visible = true;
      });
      this.pushAlert('Street Race Live', 'Beat 3 rival cars to the Coastal Finish', 'gold');
    }

    if (this.activeCheckpoints.length > 0) {
      const cp = this.activeCheckpoints[0];
      this.checkpointBeaconGroup.position.set(cp.x, 0, cp.z);
      this.checkpointBeaconGroup.visible = true;
    }
    this.emitHud();
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.keys.clear();
  }

  public respawnOnRoad(): void {
    if (this.phase !== 'playing') return;
    let bestX = ROAD_COORDS[0];
    let bestDist = Infinity;
    for (const rx of ROAD_COORDS) {
      const d = Math.abs(this.px - rx);
      if (d < bestDist) {
        bestDist = d;
        bestX = rx;
      }
    }
    this.px = bestX;
    this.py = 0.2;
    this.pz = THREE.MathUtils.clamp(this.pz, -210, 210);
    this.pvx = 0;
    this.pvy = 0;
    this.pvz = 0;
    this.pRotY = Math.PI;
    this.bustTimer = 0;
    this.pushAlert('Vehicle Reset', 'Cleared onto main avenue', 'cyan');
  }

  public teleportToLocation(x: number, z: number, label: string, rotY = Math.PI): void {
    this.px = THREE.MathUtils.clamp(x, PLAYABLE_MIN_X + 10, PLAYABLE_MAX_X - 10);
    this.py = 0.2;
    this.pz = THREE.MathUtils.clamp(z, PLAYABLE_MIN_Z + 10, PLAYABLE_MAX_Z - 10);
    this.pvx = 0;
    this.pvy = 0;
    this.pvz = 0;
    this.pRotY = rotY;
    this.bustTimer = 0;
    this.playerRig.root.position.set(this.px, this.py, this.pz);
    this.playerRig.root.rotation.set(0, this.pRotY, 0);
    this.pushAlert('Fast Travel', label, 'emerald');
    this.emitHud();
  }

  public setTimeOfDayHours(hours: number): void {
    this.timeOfDayHours = ((hours % 24) + 24) % 24;
    this.syncAtmosphereToScene();
    this.savedProfile.timeOfDayHours = this.timeOfDayHours;
    writeSavedProfile(this.savedProfile);
    this.emitHud();
  }

  public setAutoDayNight(enabled: boolean): void {
    this.autoDayNight = enabled;
    this.savedProfile.autoDayNight = enabled;
    writeSavedProfile(this.savedProfile);
  }

  public setWeather(condition: WeatherCondition): void {
    this.weather = condition;
    if (condition === 'clear_night' && this.timeOfDayHours > 6.5 && this.timeOfDayHours < 19.5) {
      this.timeOfDayHours = 22.0;
      this.savedProfile.timeOfDayHours = 22.0;
    }
    this.syncAtmosphereToScene();
    this.savedProfile.weather = condition;
    writeSavedProfile(this.savedProfile);
    this.emitHud();
  }

  public setWeatherIntensity(intensity: number): void {
    this.weatherIntensity = THREE.MathUtils.clamp(intensity, 0.1, 1.0);
    this.syncAtmosphereToScene();
    this.savedProfile.weatherIntensity = this.weatherIntensity;
    writeSavedProfile(this.savedProfile);
  }

  public setAutoWeather(enabled: boolean): void {
    this.autoWeather = enabled;
    this.savedProfile.autoWeather = enabled;
    writeSavedProfile(this.savedProfile);
  }

  public setGraphicsQuality(quality: GraphicsQuality): void {
    this.applyGraphicsQuality(quality, true);
  }

  private applyGraphicsQuality(quality: GraphicsQuality, persist: boolean): void {
    this.graphicsQuality = quality;
    const baseDpr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2);

    if (quality === 'low') {
      this.renderer.setPixelRatio(Math.min(1, baseDpr * 0.75));
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      if (this.bloomPass) this.bloomPass.enabled = false;
      this.trafficPool.forEach((t, i) => (t.rig.root.visible = i < 7));
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(1.35, baseDpr));
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      this.sunLight.castShadow = !this.isSoftwareGl;
      if (this.bloomPass) this.bloomPass.enabled = !this.isSoftwareGl;
      this.trafficPool.forEach((t, i) => (t.rig.root.visible = i < 12));
    } else {
      this.renderer.setPixelRatio(baseDpr);
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      this.sunLight.castShadow = !this.isSoftwareGl;
      if (this.bloomPass) this.bloomPass.enabled = !this.isSoftwareGl;
      this.trafficPool.forEach((t) => (t.rig.root.visible = true));
    }

    if (persist) {
      this.savedProfile.graphicsQuality = quality;
      writeSavedProfile(this.savedProfile);
    }
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
    this.playerRig.setCockpitViewActive(mode === 'cockpit');
  }

  public cycleCameraMode(): CameraMode {
    const order: CameraMode[] = ['chase', 'close', 'cockpit', 'hood', 'cinematic'];
    const next = order[(order.indexOf(this.cameraMode) + 1) % order.length];
    this.setCameraMode(next);
    return next;
  }

  public updateCustomization(partial: Partial<CustomizationState>): CustomizationState {
    const switchingVehicle =
      partial.vehicleId !== undefined && partial.vehicleId !== this.customization.vehicleId;
    this.customization = { ...this.customization, ...partial };
    this.vehicleSpec =
      VEHICLE_SPECS.find((v) => v.id === this.customization.vehicleId) ?? VEHICLE_SPECS[0];

    // When picking a new car in the Showroom, load its authentic factory paint color
    if (switchingVehicle && partial.paintId === undefined) {
      this.customization.paintId = this.vehicleSpec.defaultPaintId;
    }

    this.applyCustomizationVisuals();
    this.savedProfile.customization = { ...this.customization };
    writeSavedProfile(this.savedProfile);
    this.emitHud();
    return this.customization;
  }

  private applyCustomizationVisuals(): void {
    const paint = CAR_PAINTS.find((p) => p.id === this.customization.paintId) ?? CAR_PAINTS[0];
    const rim = RIM_FINISHES.find((r) => r.id === this.customization.rimId) ?? RIM_FINISHES[0];
    const underglow =
      UNDERGLOW_OPTIONS.find((u) => u.id === this.customization.underglowId) ?? UNDERGLOW_OPTIONS[0];

    this.playerRig.applyPaint(paint);
    this.playerRig.applyVehicleSpec(this.vehicleSpec);
    this.playerRig.applyRimColor(rim.hex);
    this.playerRig.setUnderglow(underglow.enabled, underglow.hex);
  }

  public setGpsWaypoint(x: number, z: number, label = 'Custom Waypoint'): void {
    this.customGps = { x, z, label };
    this.gpsBeaconGroup.position.set(x, 0, z);
    this.gpsBeaconGroup.visible = true;
    this.pushAlert('GPS Route Set', label, 'cyan');
    this.emitHud();
  }

  public clearGpsWaypoint(): void {
    this.customGps = null;
    this.gpsBeaconGroup.visible = false;
    this.emitHud();
  }

  public setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  public setTouchInput(partial: Partial<TouchInputState>): void {
    Object.assign(this.touchInput, partial);
  }

  private syncAtmosphereToScene(): void {
    evaluateAtmosphere(
      this.atmosphere,
      this.timeOfDayHours,
      this.weather,
      this.weatherIntensity,
      this.lightningFlash
    );
    const a = this.atmosphere;
    this.sky.applyAtmosphere(a);
    this.ocean.applyAtmosphere(a);
    this.fog.color.copy(a.fogColor);
    this.fog.density = a.fogDensity;

    this.sunLight.color.copy(a.sunLightColor);
    this.sunLight.intensity = a.sunLightIntensity;
    this.hemiLight.color.copy(a.hemiSkyColor);
    this.hemiLight.groundColor.copy(a.hemiGroundColor);
    this.hemiLight.intensity = a.hemiIntensity;
    this.rimLight.color.copy(a.rimLightColor);
    this.rimLight.intensity = a.rimLightIntensity;

    this.renderer.toneMappingExposure = a.exposure;
    this.world.setEmissiveScale(a.emissiveScale);
    this.world.setRoadWetness(this.wetness, a.nightFactor);

    if (this.bloomPass) {
      this.bloomPass.strength = THREE.MathUtils.lerp(0.26, 0.68, a.nightFactor) + this.lightningFlash * 0.25;
      this.bloomPass.threshold = THREE.MathUtils.lerp(0.88, 0.68, a.nightFactor);
    }
  }

  private resetRunState(): void {
    this.px = 200;
    this.py = 0;
    this.pz = 140;
    this.pvx = 0;
    this.pvy = 0;
    this.pvz = -18;
    this.pRotY = Math.PI;
    this.pSteer = 0;
    this.pPitch = 0;
    this.pRoll = 0;

    this.nitro = 100;
    this.health = 100;
    this.wantedLevel = 1;
    this.heatScore = 0;
    this.evadeTimer = 0;
    this.isEvading = false;
    this.bustTimer = 0;
    this.score = 0;
    this.takedowns = 0;
    this.topSpeedMph = 0;
    this.chaseSeconds = 0;
    this.airTimer = 0;
    this.airTimeBest = 0;
    this.driftScoreBuffer = 0;
    this.camShake = 0;

    this.playerRig.root.position.set(this.px, this.py, this.pz);
    this.playerRig.root.rotation.set(0, this.pRotY, 0);
    _smoothedLookAt.set(this.px, 1.4, this.pz - 10);

    for (const cop of this.policePool) {
      cop.rig.root.visible = false;
      cop.disabledTimer = 0;
      cop.hp = cop.isSwat ? 150 : 100;
      cop.vx = 0;
      cop.vz = 0;
      cop.speed = 0;
    }
    this.spawnPoliceUnit(this.policePool[0], 200, 195, Math.PI);
    this.spawnPoliceUnit(this.policePool[1], 200, 25, 0);

    for (const rep of this.world.repairs) rep.cooldown = 0;
    for (const pk of this.world.pickups) {
      pk.active = true;
      pk.respawnTimer = 0;
      const mesh = this.world.pickupMeshes.get(pk.id);
      if (mesh) mesh.visible = true;
    }
  }

  private bankCash(delta: number): void {
    this.score += delta;
    this.savedProfile.bankCash += delta;
    writeSavedProfile(this.savedProfile);
  }

  private pushAlert(title: string, subtitle: string, accent: PursuitAlert['accent']): void {
    this.activeAlert = { id: this.alertSeq++, title, subtitle, accent };
    this.alertTimer = 2.8;
  }

  private spawnPoliceUnit(cop: PoliceAgent, x: number, z: number, rotY: number): void {
    cop.x = x;
    cop.z = z;
    cop.rotY = rotY;
    cop.vx = Math.sin(rotY) * 18;
    cop.vz = Math.cos(rotY) * 18;
    cop.speed = 18;
    cop.hp = cop.isSwat ? 150 : 100;
    cop.disabledTimer = 0;
    cop.rig.root.position.set(x, 0, z);
    cop.rig.root.rotation.set(0, rotY, 0);
    cop.rig.root.visible = true;
  }

  private getTargetPoliceCount(): number {
    if (this.wantedLevel <= 0) return 0;
    const map = [0, 2, 3, 5, 6, 8];
    return map[Math.min(5, this.wantedLevel)];
  }

  private updatePlayerPhysics(dt: number): void {
    const throttle =
      this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.touchInput.throttle ? 1 : 0;
    const brake =
      this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.touchInput.brake ? 1 : 0;
    const steerLeft =
      this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.touchInput.left ? 1 : 0;
    const steerRight =
      this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.touchInput.right ? 1 : 0;
    const handbrake = this.keys.has('Space') || this.touchInput.drift;
    const nitroPressed =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchInput.nitro;

    const steerInput = steerLeft - steerRight;

    const fwdX = Math.sin(this.pRotY);
    const fwdZ = Math.cos(this.pRotY);
    const rightX = Math.cos(this.pRotY);
    const rightZ = -Math.sin(this.pRotY);

    let forwardSpeed = this.pvx * fwdX + this.pvz * fwdZ;
    let lateralSpeed = this.pvx * rightX + this.pvz * rightZ;

    const canBoost = nitroPressed && this.nitro > 1.5 && throttle > 0 && !this.isAirborne;
    this.isBoosting = canBoost;
    if (canBoost) {
      this.nitro = Math.max(0, this.nitro - 26 * dt);
    } else {
      const regen = this.isDrifting ? 15 : 5.5;
      this.nitro = Math.min(100, this.nitro + regen * dt);
    }

    const wMeta = WEATHER_OPTIONS.find((w) => w.id === this.weather) ?? WEATHER_OPTIONS[0];
    const engineMult = 1 + (this.customization.engineLevel - 1) * 0.12;
    const gripMult = 1 + (this.customization.gripLevel - 1) * 0.14;

    // Realistic Rain Physics: Reduced tire grip & longer braking distance on wet roads!
    const wetGripFactor = 1 - this.wetness * 0.28;
    const wetBrakeFactor = 1 - this.wetness * 0.32;
    const wetAccelFactor = 1 - this.wetness * 0.08;

    const maxSpeed =
      (canBoost ? this.vehicleSpec.boostMaxSpeedUnits : this.vehicleSpec.maxSpeedUnits) * engineMult;
    const accelRate =
      (canBoost ? this.vehicleSpec.accelUnits * 1.62 : this.vehicleSpec.accelUnits) *
      engineMult *
      wetAccelFactor;

    if (!this.isAirborne) {
      if (throttle > 0 && forwardSpeed < maxSpeed) {
        forwardSpeed += accelRate * dt;
      }
      if (brake > 0) {
        if (forwardSpeed > 2) forwardSpeed -= this.vehicleSpec.brakeUnits * wetBrakeFactor * dt;
        else if (forwardSpeed > -22) forwardSpeed -= 24 * dt;
      }
      if (handbrake && Math.abs(forwardSpeed) > 4) {
        forwardSpeed *= Math.max(0, 1 - 1.12 * wetBrakeFactor * dt);
      }

      // Off-road capability scales sand/beach resistance accurately per vehicle class!
      const onSand = this.px > 224 && Math.abs(this.pz) > 12;
      const offRoadDrag = onSand ? THREE.MathUtils.lerp(1.15, 0.36, this.vehicleSpec.offRoadCapability) : 0.4;
      forwardSpeed *= Math.max(0, 1 - offRoadDrag * dt);
    }

    this.pSteer = THREE.MathUtils.damp(this.pSteer, steerInput * 0.44, 12, dt);
    const speedAbs = Math.abs(forwardSpeed);
    if (speedAbs > 0.6 && !this.isAirborne) {
      const turnDir = forwardSpeed >= 0 ? 1 : -1;
      const lowSpeedFactor = Math.min(1, speedAbs / 12);
      const highSpeedDamp = 1 / (1 + speedAbs * 0.014);
      const driftTurnBoost = handbrake ? 1.48 : 1.0;
      const turnRate =
        this.vehicleSpec.turnRate * lowSpeedFactor * highSpeedDamp * driftTurnBoost;
      this.pRotY = normalizeAngle(this.pRotY + steerInput * turnRate * turnDir * dt);
    }

    const nFwdX = Math.sin(this.pRotY);
    const nFwdZ = Math.cos(this.pRotY);
    const nRightX = Math.cos(this.pRotY);
    const nRightZ = -Math.sin(this.pRotY);

    if (!this.isAirborne) {
      const baseGrip = handbrake ? this.vehicleSpec.driftGripUnits : this.vehicleSpec.gripUnits;
      lateralSpeed *= Math.exp(-baseGrip * gripMult * wetGripFactor * dt);

      // Subtle aerodynamic crosswind gust during Windy / Thunderstorm at high speed
      if (wMeta.windFactor > 0.6 && speedAbs > 18) {
        const gust = Math.sin(this.elapsed * 1.4) * wMeta.windFactor * this.weatherIntensity * 2.2;
        lateralSpeed += (gust / Math.max(0.8, this.vehicleSpec.ramMass)) * dt;
      }
    }

    this.isDrifting =
      !this.isAirborne &&
      speedAbs > 16 &&
      (Math.abs(lateralSpeed) > 5.0 || (handbrake && Math.abs(steerInput) > 0.1));

    if (this.isDrifting) {
      this.driftScoreBuffer += Math.abs(lateralSpeed) * 9 * dt;
      if (this.driftScoreBuffer > 150) {
        this.bankCash(Math.floor(this.driftScoreBuffer));
        this.driftScoreBuffer = 0;
      }
    } else {
      this.driftScoreBuffer = 0;
    }

    this.pvx = nFwdX * forwardSpeed + nRightX * lateralSpeed;
    this.pvz = nFwdZ * forwardSpeed + nRightZ * lateralSpeed;
    this.px += this.pvx * dt;
    this.pz += this.pvz * dt;

    const onBridgeCorridor = Math.abs(this.pz) < 8.5 && this.px > 218;
    const maxAllowedX = onBridgeCorridor ? PLAYABLE_MAX_X : 278;

    if (this.px < PLAYABLE_MIN_X) {
      this.px = PLAYABLE_MIN_X;
      this.pvx = Math.abs(this.pvx) * 0.4;
    } else if (this.px > maxAllowedX) {
      this.px = maxAllowedX;
      this.pvx = -Math.abs(this.pvx) * 0.45;
    }
    if (this.pz < PLAYABLE_MIN_Z) {
      this.pz = PLAYABLE_MIN_Z;
      this.pvz = Math.abs(this.pvz) * 0.4;
    } else if (this.pz > PLAYABLE_MAX_Z) {
      this.pz = PLAYABLE_MAX_Z;
      this.pvz = -Math.abs(this.pvz) * 0.4;
    }
    if (this.px > 282 && Math.abs(this.pz) > 7.6) {
      this.pz = Math.sign(this.pz) * 7.6;
      this.pvz *= -0.35;
    }

    let groundY = onBridgeCorridor && this.px > 224 ? 0.72 : 0;
    let onRampSlope = 0;
    for (const ramp of this.world.ramps) {
      const dx = this.px - ramp.x;
      const dz = this.pz - ramp.z;
      const cosR = Math.cos(-ramp.rotY);
      const sinR = Math.sin(-ramp.rotY);
      const localX = dx * cosR - dz * sinR;
      const localZ = dx * sinR + dz * cosR;

      if (Math.abs(localX) <= ramp.width * 0.52 && Math.abs(localZ) <= ramp.length * 0.5) {
        const t = (localZ + ramp.length * 0.5) / ramp.length;
        const rampH = t * ramp.height;
        if (rampH > groundY) {
          groundY = rampH;
          onRampSlope = Math.atan2(ramp.height, ramp.length);
          if (t > 0.78 && forwardSpeed > 22 && this.py <= rampH + 0.4) {
            const launchVy = Math.min(20, forwardSpeed * 0.34);
            if (this.pvy < launchVy) {
              this.pvy = launchVy;
              this.audio.playChime('jump');
            }
          }
        }
      }
    }

    if (this.py > groundY + 0.04 || this.pvy > 0) {
      this.pvy -= 30 * dt;
      this.py += this.pvy * dt;
      if (this.py <= groundY) {
        if (this.airTimer > 0.55) {
          const bonus = Math.round(this.airTimer * 650);
          this.bankCash(bonus);
          this.airTimeBest = Math.max(this.airTimeBest, this.airTimer);
          this.pushAlert('Stunt Jump', `+$${bonus.toLocaleString()} · ${this.airTimer.toFixed(1)}s Air`, 'gold');
          this.camShake = Math.max(this.camShake, 0.32);
        }
        this.py = groundY;
        this.pvy = 0;
        this.isAirborne = false;
        this.airTimer = 0;
      } else {
        this.isAirborne = true;
        this.airTimer += dt;
      }
    } else {
      this.py = groundY;
      this.pvy = 0;
      this.isAirborne = false;
      this.airTimer = 0;
    }

    this.resolveBuildingCollisionForPlayer(1.55);

    const targetPitch = this.isAirborne
      ? THREE.MathUtils.clamp(-this.pvy * 0.028, -0.35, 0.28)
      : onRampSlope > 0
        ? -onRampSlope
        : (brake > 0 && forwardSpeed > 3 ? 0.055 : 0) + (canBoost ? -0.055 : throttle > 0 ? -0.025 : 0);
    const targetRoll = !this.isAirborne
      ? THREE.MathUtils.clamp(-steerInput * Math.min(1, speedAbs / 32) * 0.085, -0.1, 0.1)
      : 0;

    this.pPitch = THREE.MathUtils.damp(this.pPitch, targetPitch, 10, dt);
    this.pRoll = THREE.MathUtils.damp(this.pRoll, targetRoll, 10, dt);

    this.playerRig.root.position.set(this.px, this.py, this.pz);
    this.playerRig.root.rotation.y = this.pRotY;
    this.playerRig.bodyGroup.rotation.x = this.pPitch;
    this.playerRig.bodyGroup.rotation.z = this.pRoll;
    this.playerRig.setBraking(brake > 0 || handbrake);
    this.playerRig.setNitroVisual(this.isBoosting, this.elapsed);
    this.playerRig.setSteerAndSpin(this.pSteer, (forwardSpeed * dt) / 0.39);

    // Drift tire smoke
    if (this.isDrifting) {
      this.smokeAccum += dt;
      if (this.smokeAccum > 0.03) {
        this.smokeAccum = 0;
        const rearX = this.px - nFwdX * 1.45;
        const rearZ = this.pz - nFwdZ * 1.45;
        this.particles.emitSmoke(rearX + nRightX * 0.9, this.py, rearZ + nRightZ * 0.9, this.pvx, this.pvz);
        this.particles.emitSmoke(rearX - nRightX * 0.9, this.py, rearZ - nRightZ * 0.9, this.pvx, this.pvz);
      }
    }

    // Wet Tire Water Spray Mist behind rear wheels (Screenshots #3, #10, #12!)
    if (this.wetness > 0.45 && speedAbs > 14 && !this.isAirborne) {
      this.sprayAccum += dt;
      if (this.sprayAccum > 0.045) {
        this.sprayAccum = 0;
        const rearX = this.px - nFwdX * 1.65;
        const rearZ = this.pz - nFwdZ * 1.65;
        this.particles.emitSmoke(
          rearX + nRightX * 0.95,
          this.py + 0.1,
          rearZ + nRightZ * 0.95,
          this.pvx * 0.4,
          this.pvz * 0.4
        );
        this.particles.emitSmoke(
          rearX - nRightX * 0.95,
          this.py + 0.1,
          rearZ - nRightZ * 0.95,
          this.pvx * 0.4,
          this.pvz * 0.4
        );
      }
    }

    if (this.isBoosting) {
      this.nitroParticleAccum += dt;
      if (this.nitroParticleAccum > 0.022) {
        this.nitroParticleAccum = 0;
        const tailX = this.px - nFwdX * 2.7;
        const tailZ = this.pz - nFwdZ * 2.7;
        this.particles.emitNitro(tailX + nRightX * 0.45, this.py + 0.35, tailZ + nRightZ * 0.45, -nFwdX * 8, -nFwdZ * 8);
        this.particles.emitNitro(tailX - nRightX * 0.45, this.py + 0.35, tailZ - nRightZ * 0.45, -nFwdX * 8, -nFwdZ * 8);
      }
    }

    const speedMph = Math.round(Math.hypot(this.pvx, this.pvz) * 2.75);
    if (speedMph > this.topSpeedMph) this.topSpeedMph = speedMph;
    if (speedMph > 55 && this.wantedLevel > 0) {
      this.score += Math.round(speedMph * 0.35 * dt * this.wantedLevel);
    }
  }

  private updateHolographicRoadGps(): void {
    const gps = this.computeActiveGps();
    if (!gps || gps.distanceMeters < 10) {
      for (const m of this.roadGpsChevrons) m.visible = false;
      return;
    }

    const dx = gps.x - this.px;
    const dz = gps.z - this.pz;
    const dist = Math.max(1, Math.hypot(dx, dz));
    const dirX = dx / dist;
    const dirZ = dz / dist;
    const angle = Math.atan2(dirX, dirZ);

    const pulseOffset = (this.elapsed * 14) % 7.5;
    for (let i = 0; i < this.roadGpsChevrons.length; i++) {
      const m = this.roadGpsChevrons[i];
      const stepDist = 8.5 + i * 7.5 + pulseOffset;
      if (stepDist > dist - 4) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(this.px + dirX * stepDist, 0.14, this.pz + dirZ * stepDist);
      m.rotation.y = angle;
      const fade = 1 - i / this.roadGpsChevrons.length;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.25 + fade * 0.55;
    }
  }

  private updateMissionsAndRacers(dt: number): void {
    const currentDistrict = this.world.getDistrictMeta(this.px, this.pz);
    if (this.phase === 'playing' && currentDistrict.id !== this.lastDistrictId) {
      this.lastDistrictId = currentDistrict.id;
      if (currentDistrict.restricted && currentDistrict.baseWanted && this.gameMode !== 'timetrial') {
        if (this.wantedLevel < currentDistrict.baseWanted) {
          this.wantedLevel = currentDistrict.baseWanted;
          this.audio.playChime('takedown');
          this.pushAlert(
            `Restricted Zone · ${currentDistrict.baseWanted}★`,
            `Trespassing in ${currentDistrict.name}`,
            'red'
          );
        }
      }
    }

    if (this.customGps) {
      const gd = Math.hypot(this.px - this.customGps.x, this.pz - this.customGps.z);
      this.gpsBeaconGroup.rotation.y = this.elapsed * 1.6;
      if (this.phase === 'playing' && gd < 13) {
        this.pushAlert('Arrived at GPS', this.customGps.label, 'emerald');
        this.audio.playChime('pickup');
        this.clearGpsWaypoint();
      }
    }

    if (this.gameMode === 'freeroam' || this.activeCheckpoints.length === 0) return;

    this.checkpointBeaconGroup.rotation.y = this.elapsed * 2.2;

    if (this.gameMode === 'mission') {
      this.modeTimer -= dt;
      if (this.modeTimer <= 0) {
        this.pushAlert('Contract Expired', 'Returning to Free Roam', 'red');
        this.startGameMode('freeroam');
        return;
      }
    } else {
      this.modeTimer += dt;
    }

    if (this.gameMode === 'race') {
      for (const r of this.streetRacers) {
        if (!r.rig.root.visible) continue;
        const targetCp = CIRCUIT_CHECKPOINTS[r.checkpointIndex % CIRCUIT_CHECKPOINTS.length];
        const tx = targetCp.x + r.laneBias;
        const tz = targetCp.z + r.laneBias * 0.5;
        const dx = tx - r.x;
        const dz = tz - r.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 16) {
          r.checkpointIndex = (r.checkpointIndex + 1) % CIRCUIT_CHECKPOINTS.length;
        }

        const desiredAngle = Math.atan2(dx, dz);
        const diff = normalizeAngle(desiredAngle - r.rotY);
        r.rotY = normalizeAngle(r.rotY + THREE.MathUtils.clamp(diff, -3.2 * dt, 3.2 * dt));
        const cornerSlow = Math.abs(diff) > 0.7 ? 0.65 : 1.0;
        r.speed = THREE.MathUtils.damp(r.speed, r.topSpeed * cornerSlow, 2.2, dt);
        r.x += Math.sin(r.rotY) * r.speed * dt;
        r.z += Math.cos(r.rotY) * r.speed * dt;

        r.rig.root.position.set(r.x, 0, r.z);
        r.rig.root.rotation.y = r.rotY;
        const spin = (r.speed * dt) / 0.38;
        for (const w of r.rig.wheelMeshes) w.rotation.x += spin;
      }
    }

    const currentCp = this.activeCheckpoints[this.checkpointIdx];
    const distToCp = Math.hypot(this.px - currentCp.x, this.pz - currentCp.z);
    if (distToCp < 16.5) {
      this.checkpointIdx++;
      this.audio.playChime('pickup');

      if (this.checkpointIdx >= this.activeCheckpoints.length) {
        if (this.gameMode === 'mission') {
          this.bankCash(4500);
          this.pushAlert('Contract Complete', '+$4,500 Banked', 'emerald');
          this.audio.playChime('escape');
          this.startGameMode('freeroam');
        } else if (this.gameMode === 'timetrial') {
          const finishTime = Number(this.modeTimer.toFixed(1));
          const isPb =
            this.savedProfile.bestTimeTrialSeconds === null ||
            finishTime < this.savedProfile.bestTimeTrialSeconds;
          if (isPb) {
            this.savedProfile.bestTimeTrialSeconds = finishTime;
            writeSavedProfile(this.savedProfile);
          }
          this.bankCash(3000);
          this.pushAlert(
            isPb ? 'New Track Record' : 'Time Trial Finished',
            `${finishTime}s · +$3,000 Banked`,
            'gold'
          );
          this.audio.playChime('escape');
          this.startGameMode('freeroam');
        } else if (this.gameMode === 'race') {
          const place = this.computeRacePosition();
          const purse = place === 1 ? 6000 : place === 2 ? 3000 : 1500;
          this.bankCash(purse);
          this.pushAlert(
            place === 1 ? '1st Place Victory' : `Finished #${place}`,
            `+$${purse.toLocaleString()} Street Race Purse`,
            place === 1 ? 'gold' : 'cyan'
          );
          this.audio.playChime('escape');
          this.startGameMode('freeroam');
        }
      } else {
        const nextCp = this.activeCheckpoints[this.checkpointIdx];
        this.checkpointBeaconGroup.position.set(nextCp.x, 0, nextCp.z);
        this.pushAlert(
          `Checkpoint ${this.checkpointIdx}/${this.activeCheckpoints.length}`,
          nextCp.label,
          'gold'
        );
      }
    }
  }

  private computeRacePosition(): number {
    if (this.gameMode !== 'race') return 1;
    const playerCp = this.activeCheckpoints[this.checkpointIdx];
    const playerDist = playerCp ? Math.hypot(this.px - playerCp.x, this.pz - playerCp.z) : 0;
    const playerProgress = this.checkpointIdx * 1000 - playerDist;

    let rank = 1;
    for (const r of this.streetRacers) {
      const rcp = CIRCUIT_CHECKPOINTS[r.checkpointIndex % CIRCUIT_CHECKPOINTS.length];
      const rd = Math.hypot(r.x - rcp.x, r.z - rcp.z);
      const rProgress = r.checkpointIndex * 1000 - rd;
      if (rProgress > playerProgress) rank++;
    }
    return rank;
  }

  private updateWeatherAndDayCycle(dt: number): void {
    const wMeta = WEATHER_OPTIONS.find((w) => w.id === this.weather) ?? WEATHER_OPTIONS[0];
    const rainStrength = wMeta.rainFactor * this.weatherIntensity;
    const targetWet = Math.min(1, wMeta.wetnessTarget * (0.55 + this.weatherIntensity * 0.45));

    this.wetness = THREE.MathUtils.damp(this.wetness, targetWet, 1.8, dt);

    // Rain particle streaks scaled by intensity & wind slant
    this.rainLines.visible = rainStrength > 0.04;
    if (this.rainLines.visible) {
      this.rainLines.position.set(this.px, 0, this.pz);
      (this.rainLines.material as THREE.LineBasicMaterial).opacity = Math.min(0.62, 0.2 + rainStrength * 0.42);
      const posAttr = this.rainLines.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = this.rainPositions;
      const fallSpeed = 34 + rainStrength * 22;
      const windX = wMeta.windFactor * this.weatherIntensity * 9.5;
      const slant = windX * 0.055;
      for (let i = 0; i < arr.length; i += 6) {
        arr[i] += windX * dt;
        arr[i + 1] -= fallSpeed * dt;
        arr[i + 3] = arr[i] - slant;
        arr[i + 4] = arr[i + 1] - (1.2 + rainStrength * 0.9);
        if (arr[i + 1] < 0) {
          arr[i] = (Math.random() - 0.5) * 74;
          arr[i + 1] = 28 + Math.random() * 4;
          arr[i + 3] = arr[i] - slant;
          arr[i + 4] = arr[i + 1] - 1.5;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Thunderstorm Lightning & Speed-of-Sound Delayed Thunder
    if (wMeta.hasLightning) {
      this.lightningCooldown -= dt;
      if (this.lightningCooldown <= 0) {
        this.triggerLightningBolt();
        this.lightningCooldown = THREE.MathUtils.lerp(7.5, 2.8, this.weatherIntensity) + Math.random() * 4.5;
      }
    }
    if (this.lightningFlash > 0.005) {
      this.lightningFlash *= Math.exp(-8.5 * dt);
      if (this.lightningFlash < 0.28) this.lightningBolt.visible = false;
    } else {
      this.lightningFlash = 0;
      this.lightningBolt.visible = false;
    }

    if (this.pendingThunderTimer > 0) {
      this.pendingThunderTimer -= dt;
      if (this.pendingThunderTimer <= 0) {
        this.audio.playThunder(this.pendingThunderVol);
        this.camShake = Math.max(this.camShake, 0.16 * this.pendingThunderVol);
      }
    }

    // Continuous 24-hour Auto Day/Night Cycle (1 full day ~ 96 seconds)
    if (this.autoDayNight) {
      this.timeOfDayHours = (this.timeOfDayHours + dt * 0.25) % 24;
    }

    // Optional Auto Weather Transitions every ~28s
    if (this.autoWeather && this.phase === 'playing') {
      this.autoWeatherTimer += dt;
      if (this.autoWeatherTimer > 28) {
        this.autoWeatherTimer = 0;
        const idx = WEATHER_OPTIONS.findIndex((w) => w.id === this.weather);
        const next = WEATHER_OPTIONS[(idx + 1) % WEATHER_OPTIONS.length];
        this.weather = next.id;
        this.pushAlert('Weather Shift', next.label, 'cyan');
      }
    }

    this.syncAtmosphereToScene();

    // Update vehicle headlights, fog cones, windshield wipers & raindrops
    const fog01 =
      this.weather === 'heavy_fog'
        ? this.weatherIntensity
        : this.weather === 'fog'
          ? 0.55 * this.weatherIntensity
          : 0;
    const headlightsOn =
      this.atmosphere.nightFactor > 0.35 || rainStrength > 0.25 || fog01 > 0.25 || this.weather === 'overcast';
    this.playerRig.setWeatherVisuals(rainStrength, fog01, headlightsOn, this.elapsed, dt);
    this.world.updateAmbientProps(this.elapsed, this.atmosphere.nightFactor);
  }

  private resolveBuildingCollisionForPlayer(radius: number): void {
    const buildings = this.world.buildings;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (
        this.px + radius <= b.minX ||
        this.px - radius >= b.maxX ||
        this.pz + radius <= b.minZ ||
        this.pz - radius >= b.maxZ
      ) {
        continue;
      }

      const penLeft = this.px + radius - b.minX;
      const penRight = b.maxX - (this.px - radius);
      const penTop = this.pz + radius - b.minZ;
      const penBottom = b.maxZ - (this.pz - radius);
      const minPen = Math.min(penLeft, penRight, penTop, penBottom);

      let impactSpeed = 0;
      if (minPen === penLeft) {
        this.px = b.minX - radius;
        impactSpeed = Math.abs(this.pvx);
        this.pvx = -Math.abs(this.pvx) * 0.35;
      } else if (minPen === penRight) {
        this.px = b.maxX + radius;
        impactSpeed = Math.abs(this.pvx);
        this.pvx = Math.abs(this.pvx) * 0.35;
      } else if (minPen === penTop) {
        this.pz = b.minZ - radius;
        impactSpeed = Math.abs(this.pvz);
        this.pvz = -Math.abs(this.pvz) * 0.35;
      } else {
        this.pz = b.maxZ + radius;
        impactSpeed = Math.abs(this.pvz);
        this.pvz = Math.abs(this.pvz) * 0.35;
      }

      if (impactSpeed > 12) {
        const dmg = Math.min(18, (impactSpeed - 10) * 0.32);
        this.health = Math.max(0, this.health - dmg);
        this.camShake = Math.max(this.camShake, Math.min(0.65, impactSpeed * 0.015));
        this.particles.emitSparks(this.px, this.py + 0.5, this.pz, 12, false);
        this.audio.playImpact(impactSpeed / 50);
      }
    }
  }

  private resolveBuildingCollisionForEntity(
    entity: { x: number; z: number; vx: number; vz: number },
    radius: number
  ): boolean {
    let hit = false;
    const buildings: BuildingCollider[] = this.world.buildings;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (
        entity.x + radius <= b.minX ||
        entity.x - radius >= b.maxX ||
        entity.z + radius <= b.minZ ||
        entity.z - radius >= b.maxZ
      ) {
        continue;
      }
      hit = true;
      const penLeft = entity.x + radius - b.minX;
      const penRight = b.maxX - (entity.x - radius);
      const penTop = entity.z + radius - b.minZ;
      const penBottom = b.maxZ - (entity.z - radius);
      const minPen = Math.min(penLeft, penRight, penTop, penBottom);

      if (minPen === penLeft) {
        entity.x = b.minX - radius;
        entity.vx = -Math.abs(entity.vx) * 0.3;
      } else if (minPen === penRight) {
        entity.x = b.maxX + radius;
        entity.vx = Math.abs(entity.vx) * 0.3;
      } else if (minPen === penTop) {
        entity.z = b.minZ - radius;
        entity.vz = -Math.abs(entity.vz) * 0.3;
      } else {
        entity.z = b.maxZ + radius;
        entity.vz = Math.abs(entity.vz) * 0.3;
      }
    }
    return hit;
  }

  private updatePoliceAndPursuit(dt: number): number {
    this.chaseSeconds += dt;

    if (this.wantedLevel > 0 && !this.isEvading) {
      this.heatScore += dt * 1.45;
      const thresholds = [0, 32, 72, 125, 195];
      if (this.wantedLevel < 5 && this.heatScore >= thresholds[this.wantedLevel]) {
        this.wantedLevel++;
        this.pushAlert(
          `Wanted Level ${this.wantedLevel}`,
          this.wantedLevel >= 3 ? 'VCPD SWAT units deployed' : 'Interceptor reinforcements inbound',
          'red'
        );
      }
    }

    const desiredCount = this.getTargetPoliceCount();
    let activeCount = 0;
    for (const cop of this.policePool) {
      if (cop.rig.root.visible) activeCount++;
    }

    if (activeCount < desiredCount) {
      for (const cop of this.policePool) {
        if (!cop.rig.root.visible) {
          if (cop.isSwat && this.wantedLevel < 3) continue;
          const pos = this.findSpawnPointOnRoadNearPlayer();
          this.spawnPoliceUnit(cop, pos.x, pos.z, pos.rotY);
          activeCount++;
          if (activeCount >= desiredCount) break;
        }
      }
    }

    let closestCopDist = Infinity;
    let nearbyActiveCops = 0;

    for (const cop of this.policePool) {
      if (!cop.rig.root.visible) continue;

      const copActive = cop.disabledTimer <= 0 && this.wantedLevel > 0;
      cop.rig.updateStrobe(this.elapsed + cop.flankSide * 0.25, copActive);

      if (cop.disabledTimer > 0) {
        cop.disabledTimer -= dt;
        cop.vx *= Math.exp(-3.2 * dt);
        cop.vz *= Math.exp(-3.2 * dt);
        cop.x += cop.vx * dt;
        cop.z += cop.vz * dt;
        cop.rig.root.position.set(cop.x, 0, cop.z);
        if (Math.random() < dt * 8) {
          this.particles.emitSmoke(cop.x, 0.9, cop.z, 0, 0);
        }
        if (cop.disabledTimer <= 0) {
          const pos = this.findSpawnPointOnRoadNearPlayer();
          this.spawnPoliceUnit(cop, pos.x, pos.z, pos.rotY);
        }
        continue;
      }

      const dx = this.px - cop.x;
      const dz = this.pz - cop.z;
      const dist = Math.hypot(dx, dz);

      if (dist < closestCopDist) closestCopDist = dist;
      if (dist < 130) nearbyActiveCops++;

      if (dist > 250 && this.wantedLevel > 0) {
        const pos = this.findSpawnPointOnRoadNearPlayer();
        this.spawnPoliceUnit(cop, pos.x, pos.z, pos.rotY);
        continue;
      }

      const leadTime = THREE.MathUtils.clamp(dist / 55, 0.1, 1.15);
      const flankScale = dist > 18 ? 7.5 * cop.flankSide : 0;
      const pRightX = Math.cos(this.pRotY);
      const pRightZ = -Math.sin(this.pRotY);
      const targetX = this.px + this.pvx * leadTime + pRightX * flankScale;
      const targetZ = this.pz + this.pvz * leadTime + pRightZ * flankScale;

      let desiredAngle = Math.atan2(targetX - cop.x, targetZ - cop.z);
      const probeDist = 14;
      const probeX = cop.x + Math.sin(desiredAngle) * probeDist;
      const probeZ = cop.z + Math.cos(desiredAngle) * probeDist;
      if (this.isPointInsideAnyBuilding(probeX, probeZ, 2.2)) {
        const altLeft = desiredAngle + 0.85;
        const altRight = desiredAngle - 0.85;
        const leftBlocked = this.isPointInsideAnyBuilding(
          cop.x + Math.sin(altLeft) * probeDist,
          cop.z + Math.cos(altLeft) * probeDist,
          2.2
        );
        desiredAngle = leftBlocked ? altRight : altLeft;
      }

      const angleDiff = normalizeAngle(desiredAngle - cop.rotY);
      const turnSpeed = cop.isSwat ? 2.45 : 3.05;
      cop.rotY = normalizeAngle(
        cop.rotY + THREE.MathUtils.clamp(angleDiff, -turnSpeed * dt, turnSpeed * dt)
      );

      const maxCopSpeed = (cop.isSwat ? 42 : 46) + this.wantedLevel * 2.5 + (dist > 65 ? 9 : 0);
      const targetSpeed = Math.abs(angleDiff) > 1.1 ? maxCopSpeed * 0.52 : maxCopSpeed;
      cop.speed = THREE.MathUtils.damp(cop.speed, targetSpeed, 2.6, dt);

      const fwdX = Math.sin(cop.rotY);
      const fwdZ = Math.cos(cop.rotY);
      cop.vx = THREE.MathUtils.damp(cop.vx, fwdX * cop.speed, 4.5, dt);
      cop.vz = THREE.MathUtils.damp(cop.vz, fwdZ * cop.speed, 4.5, dt);

      cop.x += cop.vx * dt;
      cop.z += cop.vz * dt;

      if (this.resolveBuildingCollisionForEntity(cop, 1.55)) {
        cop.rotY += cop.flankSide * 1.4 * dt;
      }

      for (const other of this.policePool) {
        if (other === cop || !other.rig.root.visible) continue;
        const odx = cop.x - other.x;
        const odz = cop.z - other.z;
        const od = Math.hypot(odx, odz);
        if (od > 0.01 && od < 3.6) {
          const push = (3.6 - od) * 0.5;
          cop.x += (odx / od) * push;
          cop.z += (odz / od) * push;
        }
      }

      const pdx = this.px - cop.x;
      const pdz = this.pz - cop.z;
      const pdist = Math.hypot(pdx, pdz);
      const minDist = cop.isSwat ? 3.55 : 3.35;

      if (pdist < minDist && this.py < 2.2) {
        const nx = pdist > 0.01 ? pdx / pdist : 1;
        const nz = pdist > 0.01 ? pdz / pdist : 0;
        const overlap = minDist - pdist;

        this.px += nx * overlap * 0.52;
        this.pz += nz * overlap * 0.52;
        cop.x -= nx * overlap * 0.48;
        cop.z -= nz * overlap * 0.48;

        const relVx = this.pvx - cop.vx;
        const relVz = this.pvz - cop.vz;
        const impactMag = Math.hypot(relVx, relVz);

        const playerBoostMass = (this.isBoosting ? 1.85 : 1.0) * this.vehicleSpec.ramMass;
        const copMass = cop.isSwat ? 1.45 : 1.0;
        const impulse = Math.max(8, impactMag * 0.65);

        this.pvx += (nx * impulse * copMass) / (playerBoostMass + copMass);
        this.pvz += (nz * impulse * copMass) / (playerBoostMass + copMass);
        cop.vx -= (nx * impulse * playerBoostMass * 1.35) / (playerBoostMass + copMass);
        cop.vz -= (nz * impulse * playerBoostMass * 1.35) / (playerBoostMass + copMass);

        if (impactMag > 9) {
          const playerSpeed = Math.hypot(this.pvx, this.pvz);
          const copDmg =
            (impactMag * 1.65 + (this.isBoosting ? 42 : 0)) *
            (playerSpeed > 22 ? 1.4 : 0.8) *
            this.vehicleSpec.ramMass;
          cop.hp -= copDmg;

          const playerDmg = Math.min(
            14,
            impactMag * (cop.isSwat ? 0.34 : 0.22) * (this.isBoosting ? 0.45 : 1)
          );
          this.health = Math.max(0, this.health - playerDmg);

          this.camShake = Math.max(this.camShake, Math.min(0.75, impactMag * 0.02));
          this.particles.emitSparks(
            (this.px + cop.x) * 0.5,
            0.7,
            (this.pz + cop.z) * 0.5,
            18,
            cop.hp <= 0
          );
          this.audio.playImpact(impactMag / 40);

          if (cop.hp <= 0) {
            cop.disabledTimer = 9.0;
            this.takedowns++;
            this.savedProfile.totalTakedowns++;
            const bonus = cop.isSwat ? 2500 : 1200;
            this.bankCash(bonus);
            this.nitro = Math.min(100, this.nitro + 35);
            this.heatScore += 22;
            this.pushAlert(
              cop.isSwat ? 'SWAT Takedown' : 'Police Takedown',
              `+$${bonus.toLocaleString()} · Nitro Surge`,
              'gold'
            );
            this.audio.playChime('takedown');
          }
        }
      }

      cop.rig.root.position.set(cop.x, 0, cop.z);
      cop.rig.root.rotation.y = cop.rotY;
      const wheelSpin = (Math.hypot(cop.vx, cop.vz) * dt) / 0.4;
      for (const w of cop.rig.wheelMeshes) w.rotation.x += wheelSpin;
    }

    if (this.wantedLevel > 0) {
      if (nearbyActiveCops === 0 || closestCopDist > 122) {
        this.isEvading = true;
        this.evadeTimer += dt;
        const evadeNeeded = 8.5 + this.wantedLevel * 1.5;
        if (this.evadeTimer >= evadeNeeded) {
          const escapeBonus = this.wantedLevel * 1500;
          this.bankCash(escapeBonus);
          this.wantedLevel = 0;
          this.heatScore = 0;
          this.evadeTimer = 0;
          this.isEvading = false;
          for (const cop of this.policePool) cop.rig.root.visible = false;
          this.pushAlert('Pursuit Evaded', `+$${escapeBonus.toLocaleString()} · Heat Cleared`, 'emerald');
          this.audio.playChime('escape');
        }
      } else {
        this.isEvading = false;
        this.evadeTimer = Math.max(0, this.evadeTimer - dt * 1.8);
      }
    } else if (this.gameMode === 'freeroam') {
      const speedMph = Math.hypot(this.pvx, this.pvz) * 2.75;
      if (speedMph > 125) {
        this.heatScore += dt * 4.5;
        if (this.heatScore > 12) {
          this.wantedLevel = 1;
          this.heatScore = 0;
          this.pushAlert('Speeding Warrant', 'VCPD interceptor dispatched', 'red');
        }
      }
    }

    const playerSpeedNow = Math.hypot(this.pvx, this.pvz);
    if (this.wantedLevel > 0 && closestCopDist < 10.5 && playerSpeedNow < 4.5 && !this.isAirborne) {
      this.bustTimer += dt;
      if (this.bustTimer >= 3.6) {
        this.phase = 'busted';
        this.pushAlert('Busted', 'VCPD immobilized your vehicle', 'red');
        this.emitHud();
      }
    } else {
      this.bustTimer = Math.max(0, this.bustTimer - dt * 1.5);
    }

    if (this.health <= 0 && this.phase === 'playing') {
      this.phase = 'wrecked';
      this.particles.emitSparks(this.px, 0.8, this.pz, 36, true);
      this.audio.playImpact(1.0);
      this.pushAlert('Wrecked', 'Chassis destroyed during pursuit', 'red');
      this.emitHud();
    }

    return closestCopDist;
  }

  private findSpawnPointOnRoadNearPlayer(): { x: number; z: number; rotY: number } {
    let bestX = 200;
    let bestZ = 0;
    let bestScore = -Infinity;
    const fwdX = Math.sin(this.pRotY);
    const fwdZ = Math.cos(this.pRotY);

    for (const rx of ROAD_COORDS) {
      for (const rz of ROAD_COORDS) {
        const dx = rx - this.px;
        const dz = rz - this.pz;
        const dist = Math.hypot(dx, dz);
        if (dist < 78 || dist > 195) continue;
        const aheadDot = (dx * fwdX + dz * fwdZ) / dist;
        const score = aheadDot * 50 + (150 - Math.abs(dist - 125)) + Math.random() * 25;
        if (score > bestScore) {
          bestScore = score;
          bestX = rx;
          bestZ = rz;
        }
      }
    }
    return { x: bestX, z: bestZ, rotY: Math.atan2(this.px - bestX, this.pz - bestZ) };
  }

  private isPointInsideAnyBuilding(x: number, z: number, pad: number): boolean {
    const buildings = this.world.buildings;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (x > b.minX - pad && x < b.maxX + pad && z > b.minZ - pad && z < b.maxZ + pad) {
        return true;
      }
    }
    return false;
  }

  private updateTraffic(dt: number): void {
    for (const car of this.trafficPool) {
      if (!car.rig.root.visible) continue;
      car.bumpVx *= Math.exp(-4.5 * dt);
      car.bumpVz *= Math.exp(-4.5 * dt);

      const dx = this.px - car.x;
      const dz = this.pz - car.z;
      const distToPlayer = Math.hypot(dx, dz);
      const targetSpd = distToPlayer < 16 ? 3 : car.cruiseSpeed;
      car.currentSpeed = THREE.MathUtils.damp(car.currentSpeed, targetSpd, 4, dt);

      if (car.axis === 'ns') {
        car.z += car.dir * car.currentSpeed * dt + car.bumpVz * dt;
        car.x += car.bumpVx * dt;
        if (car.z > 240) car.z = -240;
        if (car.z < -240) car.z = 240;
        car.x = THREE.MathUtils.damp(car.x, car.laneCoord, 2.2, dt);
      } else {
        car.x += car.dir * car.currentSpeed * dt + car.bumpVx * dt;
        car.z += car.bumpVz * dt;
        if (car.x > 215) car.x = -235;
        if (car.x < -235) car.x = 215;
        car.z = THREE.MathUtils.damp(car.z, car.laneCoord, 2.2, dt);
      }

      if (this.phase === 'playing' && distToPlayer < 3.1 && this.py < 2.0) {
        const nx = distToPlayer > 0.01 ? dx / distToPlayer : 1;
        const nz = distToPlayer > 0.01 ? dz / distToPlayer : 0;
        const overlap = 3.1 - distToPlayer;
        this.px += nx * overlap * 0.45;
        this.pz += nz * overlap * 0.45;
        car.x -= nx * overlap * 0.55;
        car.z -= nz * overlap * 0.55;

        const impact = Math.hypot(this.pvx, this.pvz);
        car.bumpVx = -nx * Math.max(10, impact * 0.75);
        car.bumpVz = -nz * Math.max(10, impact * 0.75);
        this.pvx *= 0.78;
        this.pvz *= 0.78;

        if (impact > 10) {
          this.health = Math.max(0, this.health - Math.min(8, impact * 0.14));
          this.camShake = Math.max(this.camShake, 0.35);
          this.particles.emitSparks(
            (this.px + car.x) * 0.5,
            0.65,
            (this.pz + car.z) * 0.5,
            10,
            false
          );
          this.audio.playImpact(impact / 50);
          if (this.wantedLevel === 0 && this.gameMode === 'freeroam') {
            this.wantedLevel = 1;
            this.pushAlert('Hit & Run', 'VCPD alerted to reckless driving', 'red');
          }
        }
      }

      car.rig.root.position.set(car.x, 0, car.z);
      car.rig.root.rotation.y = car.rotY;
      const spin = (car.currentSpeed * dt) / 0.36;
      for (const w of car.rig.wheelMeshes) w.rotation.x += spin;
    }
  }

  private updateWorldInteractables(dt: number): void {
    for (const rep of this.world.repairs) {
      if (rep.cooldown > 0) rep.cooldown = Math.max(0, rep.cooldown - dt);
      const ring = this.world.repairRings.get(rep.id);
      if (ring) {
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.color.setHex(rep.cooldown > 0 ? 0x64748b : 0x10b981);
        const pulse = rep.cooldown > 0 ? 1 : 1 + 0.08 * Math.sin(this.elapsed * 4.5);
        ring.scale.set(pulse, pulse, 1);
      }

      if (this.phase === 'playing' && rep.cooldown <= 0) {
        const dist = Math.hypot(this.px - rep.x, this.pz - rep.z);
        if (dist < rep.radius) {
          this.health = 100;
          this.nitro = 100;
          rep.cooldown = 22;
          this.bankCash(500);
          this.pushAlert('Pay & Spray', 'Chassis 100% Repaired · Full Nitro', 'emerald');
          this.audio.playChime('repair');
        }
      }
    }

    for (const pk of this.world.pickups) {
      const mesh = this.world.pickupMeshes.get(pk.id);
      if (!pk.active) {
        pk.respawnTimer -= dt;
        if (pk.respawnTimer <= 0) {
          pk.active = true;
          if (mesh) mesh.visible = true;
        }
        continue;
      }

      if (mesh) {
        mesh.rotation.y = this.elapsed * 2.2;
        mesh.position.y = 1.45 + Math.sin(this.elapsed * 3.4 + pk.x) * 0.26;
      }

      if (this.phase === 'playing') {
        const dist = Math.hypot(this.px - pk.x, this.pz - pk.z);
        if (dist < 4.2) {
          pk.active = false;
          pk.respawnTimer = 25;
          if (mesh) mesh.visible = false;
          if (pk.type === 'cash') {
            this.bankCash(1000);
            this.pushAlert('Cash Stash', '+$1,000 Banked', 'gold');
          } else {
            this.nitro = 100;
            this.bankCash(350);
            this.pushAlert('Nitro Canister', 'Boost Tank Refilled', 'cyan');
          }
          this.audio.playChime('pickup');
        }
      }
    }
  }

  private updateCamera(dt: number): void {
    if (this.phase === 'title') {
      // Dramatic Low Rear-3/4 Hero Showcase Angle matching Screenshots #1, #4, #6, #12!
      this.titleOrbitAngle += dt * 0.14;
      const swayX = Math.sin(this.titleOrbitAngle) * 2.4;
      this.camera.position.set(this.px + swayX, 2.35, this.pz + 8.4);
      this.camera.lookAt(this.px, 1.35, this.pz - 18);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 54, 4, dt);
      this.camera.updateProjectionMatrix();
      return;
    }

    const fwdX = Math.sin(this.pRotY);
    const fwdZ = Math.cos(this.pRotY);
    const rightX = Math.cos(this.pRotY);
    const rightZ = -Math.sin(this.pRotY);
    const speed = Math.hypot(this.pvx, this.pvz);

    if (this.cameraMode === 'cockpit') {
      const driverSideOffset = -0.34;
      _camTargetPos.set(
        this.px + rightX * driverSideOffset - fwdX * 0.05,
        this.py + 1.16,
        this.pz + rightZ * driverSideOffset - fwdZ * 0.05
      );
      _camLookAt.set(
        this.px + fwdX * 30 + rightX * driverSideOffset,
        this.py + 1.02 - this.pPitch * 2.0,
        this.pz + fwdZ * 30 + rightZ * driverSideOffset
      );
      this.camera.position.copy(_camTargetPos);
      _smoothedLookAt.copy(_camLookAt);
    } else if (this.cameraMode === 'hood') {
      _camTargetPos.set(this.px + fwdX * 0.65, this.py + 1.48, this.pz + fwdZ * 0.65);
      _camLookAt.set(this.px + fwdX * 26, this.py + 1.1, this.pz + fwdZ * 26);
      this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-26 * dt));
      _smoothedLookAt.lerp(_camLookAt, 1 - Math.exp(-22 * dt));
    } else if (this.cameraMode === 'cinematic') {
      const sweep = Math.sin(this.elapsed * 0.45) * 4.5;
      _camTargetPos.set(
        this.px - fwdX * 10.5 + rightX * (6.2 + sweep),
        this.py + 3.2,
        this.pz - fwdZ * 10.5 + rightZ * (6.2 + sweep)
      );
      _camLookAt.set(this.px + fwdX * 6, this.py + 1.2, this.pz + fwdZ * 6);
      this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-5.5 * dt));
      _smoothedLookAt.lerp(_camLookAt, 1 - Math.exp(-9 * dt));
    } else {
      // Low, cinematic GTA 6 / Solar Crown chase camera
      const dist = this.cameraMode === 'close' ? 6.2 : 8.2;
      const height = this.cameraMode === 'close' ? 2.15 : 2.72;
      const speedPull = Math.min(2.4, speed * 0.036);

      _camTargetPos.set(
        this.px - fwdX * (dist + speedPull) + rightX * (-this.pSteer * 1.45),
        this.py + height + Math.min(0.65, speed * 0.008),
        this.pz - fwdZ * (dist + speedPull) + rightZ * (-this.pSteer * 1.45)
      );
      _camLookAt.set(this.px + fwdX * 10, this.py + 1.25, this.pz + fwdZ * 10);

      this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-9.0 * dt));
      _smoothedLookAt.lerp(_camLookAt, 1 - Math.exp(-13 * dt));
    }

    if (this.camShake > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.camShake;
      this.camera.position.y += (Math.random() - 0.5) * this.camShake * 0.7;
      this.camShake *= Math.exp(-9.5 * dt);
    }

    this.camera.up.copy(_upVec);
    this.camera.lookAt(_smoothedLookAt);

    const baseFov = this.cameraMode === 'cockpit' ? 74 : this.cameraMode === 'hood' ? 72 : 58;
    const targetFov = baseFov + Math.min(15, speed * 0.18) + (this.isBoosting ? 9 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6.5, dt);
    this.camera.updateProjectionMatrix();
  }

  private updateSunShadowFollow(): void {
    const dir = this.atmosphere.sunDirection;
    this.sunLight.position.set(
      this.px + dir.x * 160,
      Math.max(42, dir.y * 160),
      this.pz + dir.z * 160
    );
    this.sunLight.target.position.set(this.px, 0, this.pz);
  }

  private computeActiveGps(): GpsTarget | null {
    let tx: number | null = null;
    let tz: number | null = null;
    let label = '';

    if (this.activeCheckpoints.length > 0 && this.checkpointIdx < this.activeCheckpoints.length) {
      const cp = this.activeCheckpoints[this.checkpointIdx];
      tx = cp.x;
      tz = cp.z;
      label = cp.label;
    } else if (this.customGps) {
      tx = this.customGps.x;
      tz = this.customGps.z;
      label = this.customGps.label;
    }

    if (tx === null || tz === null) return null;
    const dx = tx - this.px;
    const dz = tz - this.pz;
    const dist = Math.round(Math.hypot(dx, dz));
    const worldAngle = Math.atan2(dx, dz);
    const relativeAngleRad = normalizeAngle(worldAngle - this.pRotY);

    return { x: tx, z: tz, label, distanceMeters: dist, relativeAngleRad };
  }

  private emitHud(): void {
    const speedMps = Math.hypot(this.pvx, this.pvz);
    const speedMph = Math.round(speedMps * 2.75);
    const speedKph = Math.round(speedMph * 1.60934);

    const fwdX = Math.sin(this.pRotY);
    const fwdZ = Math.cos(this.pRotY);
    const fwdDot = this.pvx * fwdX + this.pvz * fwdZ;
    let gear = 1;
    let rpmRatio = 0.14;
    if (fwdDot < -1.5) {
      gear = 0;
      rpmRatio = Math.min(0.95, 0.25 + Math.abs(fwdDot) / 26);
    } else {
      const bands = [0, 32, 62, 95, 130, 166, 250];
      for (let g = 1; g <= 6; g++) {
        if (speedMph <= bands[g] || g === 6) {
          gear = g;
          const lo = bands[g - 1];
          const hi = bands[g];
          rpmRatio = THREE.MathUtils.clamp(0.22 + ((speedMph - lo) / (hi - lo)) * 0.76, 0.14, 1.0);
          break;
        }
      }
    }

    const units: MinimapUnit[] = [];
    let activeCops = 0;
    for (const cop of this.policePool) {
      if (!cop.rig.root.visible) continue;
      if (cop.disabledTimer <= 0) activeCops++;
      units.push({
        x: cop.x,
        z: cop.z,
        rotY: cop.rotY,
        type: cop.isSwat ? 'swat' : 'police',
        disabled: cop.disabledTimer > 0,
      });
    }
    for (const r of this.streetRacers) {
      if (!r.rig.root.visible) continue;
      units.push({ x: r.x, z: r.z, rotY: r.rotY, type: 'racer' });
    }
    for (const car of this.trafficPool) {
      if (!car.rig.root.visible) continue;
      units.push({ x: car.x, z: car.z, rotY: car.rotY, type: 'civilian' });
    }

    const thresholds = [0, 32, 72, 125, 195];
    const prevT = thresholds[Math.min(4, Math.max(0, this.wantedLevel - 1))] ?? 0;
    const nextT = thresholds[Math.min(4, this.wantedLevel)] ?? 195;
    const heatProgress =
      this.wantedLevel >= 5
        ? 1
        : THREE.MathUtils.clamp((this.heatScore - prevT) / Math.max(1, nextT - prevT), 0, 1);
    const evadeNeeded = 8.5 + this.wantedLevel * 1.5;

    const modeTitles: Record<GameMode, string> = {
      freeroam: 'Free Roam',
      mission: 'Getaway Contract',
      timetrial: 'Coastal Time Trial',
      race: 'Street Race',
    };

    const currentCp = this.activeCheckpoints[this.checkpointIdx];
    const wMeta = WEATHER_OPTIONS.find((w) => w.id === this.weather) ?? WEATHER_OPTIONS[0];

    this.onHudUpdate({
      phase: this.phase,
      vehicleName: this.vehicleSpec.name,
      speedMph,
      speedKph,
      rpmRatio,
      gear,
      nitro: Math.round(this.nitro),
      health: Math.round(this.health),
      wantedLevel: this.wantedLevel,
      heatProgress,
      evadeProgress: this.isEvading ? Math.min(1, this.evadeTimer / evadeNeeded) : 0,
      isEvading: this.isEvading,
      bustProgress: Math.min(1, this.bustTimer / 3.6),
      score: Math.floor(this.score),
      bankCash: Math.floor(this.savedProfile.bankCash),
      takedowns: this.takedowns,
      topSpeedMph: this.topSpeedMph,
      chaseSeconds: Math.floor(this.chaseSeconds),
      airTimeBest: this.airTimeBest,
      activeCops,
      district: this.world.getDistrictName(this.px, this.pz),
      weather: this.weather,
      weatherLabel: wMeta.label,
      timeOfDayHours: this.timeOfDayHours,
      timeFormatted: formatTime24(this.timeOfDayHours),
      isDrifting: this.isDrifting,
      isBoosting: this.isBoosting,
      isAirborne: this.isAirborne,
      fps: this.measuredFps,
      alert: this.activeAlert,
      playerX: this.px,
      playerZ: this.pz,
      playerRotY: this.pRotY,
      units,
      repairs: this.world.repairs.map((r) => ({ x: r.x, z: r.z, ready: r.cooldown <= 0 })),
      ramps: this.world.ramps.map((r) => ({ x: r.x, z: r.z })),
      gps: this.computeActiveGps(),
      mission: {
        mode: this.gameMode,
        title: modeTitles[this.gameMode],
        objective: currentCp ? currentCp.label : 'Explore all 10 coastal districts',
        checkpointIndex: this.checkpointIdx,
        totalCheckpoints: this.activeCheckpoints.length,
        timerSeconds: Math.max(0, this.modeTimer),
        racePosition: this.computeRacePosition(),
        totalRacers: 4,
        bestTimeTrialSeconds: this.savedProfile.bestTimeTrialSeconds,
      },
    });
  }

  private afterDraw(cb: () => void): void {
    if (this.disposed) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(now: number): void {
    if (this.disposed) return;

    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(0.05, Math.max(0.001, rawDt));

    this.fpsFrames++;
    this.fpsAccum += rawDt;
    if (this.fpsAccum >= 0.5) {
      this.measuredFps = Math.min(120, Math.round(this.fpsFrames / this.fpsAccum));
      this.fpsFrames = 0;
      this.fpsAccum = 0;
    }

    if (!this.contextLost) {
      const wMeta = WEATHER_OPTIONS.find((w) => w.id === this.weather) ?? WEATHER_OPTIONS[0];
      if (!this.paused) {
        this.elapsed += dt;
        let closestCopDist = Infinity;

        if (this.phase === 'playing') {
          this.updatePlayerPhysics(dt);
          closestCopDist = this.updatePoliceAndPursuit(dt);
          this.updateMissionsAndRacers(dt);
        } else if (this.phase === 'busted' || this.phase === 'wrecked') {
          this.pvx *= Math.exp(-4 * dt);
          this.pvz *= Math.exp(-4 * dt);
          this.px += this.pvx * dt;
          this.pz += this.pvz * dt;
          this.playerRig.root.position.set(this.px, this.py, this.pz);
          for (const cop of this.policePool) {
            if (cop.rig.root.visible) cop.rig.updateStrobe(this.elapsed, true);
          }
        }

        this.updateTraffic(dt);
        this.updateWorldInteractables(dt);
        this.updateWeatherAndDayCycle(dt);
        this.updateHolographicRoadGps();
        this.particles.update(dt);
        this.updateCamera(dt);
        this.updateSunShadowFollow();
        this.sky.update(this.elapsed, this.camera.position);
        this.ocean.update(this.elapsed);

        if (this.alertTimer > 0) {
          this.alertTimer -= dt;
          if (this.alertTimer <= 0) this.activeAlert = null;
        }

        const speedMps = Math.hypot(this.pvx, this.pvz);
        const speedRatio = Math.min(1, speedMps / 65);
        this.audio.update({
          active: this.phase === 'playing',
          speedRatio,
          rpmRatio: Math.min(1, 0.18 + (((speedMps * 2.75) % 42) / 42) * 0.72 + speedRatio * 0.25),
          drifting: this.isDrifting,
          boosting: this.isBoosting,
          closestCopDist,
          wantedLevel: this.wantedLevel,
          rainLevel: wMeta.rainFactor * this.weatherIntensity,
          windLevel: wMeta.windFactor * this.weatherIntensity,
          dt,
        });
      } else {
        this.audio.update({
          active: false,
          speedRatio: 0,
          rpmRatio: 0,
          drifting: false,
          boosting: false,
          closestCopDist: 999,
          wantedLevel: 0,
          rainLevel: 0,
          windLevel: 0,
          dt,
        });
      }

      if (this.isSoftwareGl || !this.composer || this.graphicsQuality === 'low') {
        this.renderer.render(this.scene, this.camera);
      } else {
        this.composer.render();
      }

      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.05) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }
    }

    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame((t) => this.tick(t));
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResizeBound);
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);
    window.removeEventListener('blur', this.handleBlurBound);

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLostBound);
      this.renderer.domElement.removeEventListener(
        'webglcontextrestored',
        this.handleContextRestoredBound
      );
      if (this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    this.audio.dispose();
    this.sky.dispose();
    this.ocean.dispose();
    this.particles.dispose();
    this.textures.dispose();
    this.envRT?.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
  }
}

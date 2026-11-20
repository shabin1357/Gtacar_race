import * as THREE from 'three';
import { CarPaintOption, VehicleClassId, VehicleSpec } from './types';

export interface PlayerCarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  cockpitGroup: THREE.Group;
  steeringWheel: THREE.Group;
  paintMaterial: THREE.MeshPhysicalMaterial;
  accentMaterial: THREE.MeshStandardMaterial;
  rimMaterial: THREE.MeshStandardMaterial;
  tailLightMaterial: THREE.MeshStandardMaterial;
  underglowMaterial: THREE.MeshBasicMaterial;
  underglowLight: THREE.PointLight;
  nitroFlames: THREE.Mesh[];
  frontWheelPivots: THREE.Group[];
  wheelMeshes: THREE.Group[];
  headlightSpot: THREE.PointLight;
  applyPaint: (paint: CarPaintOption) => void;
  applyRimColor: (hex: number) => void;
  setUnderglow: (enabled: boolean, hex: number) => void;
  applyVehicleSpec: (spec: VehicleSpec) => void;
  setCockpitViewActive: (active: boolean) => void;
  setBraking: (braking: boolean) => void;
  setNitroVisual: (active: boolean, time: number) => void;
  setSteerAndSpin: (steerAngle: number, spinDelta: number) => void;
  setWeatherVisuals: (
    rain01: number,
    fog01: number,
    headlightsOn: boolean,
    time: number,
    dt: number
  ) => void;
}

export interface PoliceCarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  redBarMat: THREE.MeshStandardMaterial;
  blueBarMat: THREE.MeshStandardMaterial;
  sirenLight: THREE.PointLight;
  wheelMeshes: THREE.Group[];
  updateStrobe: (time: number, active: boolean) => void;
}

export interface CivilianCarRig {
  root: THREE.Group;
  wheelMeshes: THREE.Group[];
}

function buildWheelAssembly(
  radius: number,
  width: number,
  caliperHex: number,
  sharedRimMat?: THREE.MeshStandardMaterial
): THREE.Group {
  const wheelGroup = new THREE.Group();

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x14161b,
    roughness: 0.86,
    metalness: 0.05,
  });
  const rimMat =
    sharedRimMat ??
    new THREE.MeshStandardMaterial({
      color: 0xdbe2ec,
      roughness: 0.18,
      metalness: 0.94,
    });
  const hubMat = new THREE.MeshStandardMaterial({
    color: caliperHex,
    roughness: 0.32,
    metalness: 0.65,
  });

  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 20);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rimGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.02, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  const spokeGeo = new THREE.BoxGeometry(width + 0.04, radius * 1.22, 0.06);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.x = (i * Math.PI) / 5;
    wheelGroup.add(spoke);
  }

  const hubGeo = new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, width + 0.05, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, hubMat);
  wheelGroup.add(hub);

  return wheelGroup;
}

function createContactShadowMesh(shadowTex: THREE.Texture, width: number, length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, length);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.03;
  return mesh;
}

function createLicensePlateTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, 0, 256, 20);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 90);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 46px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ZV766', 128, 58);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPlayerSupercar(
  paint: CarPaintOption,
  shadowTex: THREE.Texture,
  raindropTex: THREE.Texture
): PlayerCarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  root.add(createContactShadowMesh(shadowTex, 2.9, 5.5));

  const paintMaterial = new THREE.MeshPhysicalMaterial({
    color: paint.hex,
    metalness: paint.metalness,
    roughness: paint.roughness,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x14171f,
    roughness: 0.48,
    metalness: 0.38,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.14,
    metalness: 0.96,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: paint.accentHex,
    roughness: 0.25,
    metalness: 0.68,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xdbe2ec,
    roughness: 0.18,
    metalness: 0.94,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x070e1a,
    metalness: 0.24,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 1.0,
  });

  // 1. Primary Sculpted Sports/GT Chassis
  const sideProfile = new THREE.Shape();
  sideProfile.moveTo(-2.3, 0.24);
  sideProfile.lineTo(2.38, 0.22);
  sideProfile.lineTo(2.44, 0.44);
  sideProfile.lineTo(1.75, 0.72);
  sideProfile.lineTo(0.85, 0.84);
  sideProfile.lineTo(0.18, 1.24);
  sideProfile.lineTo(-1.05, 1.22);
  sideProfile.lineTo(-2.05, 0.88);
  sideProfile.lineTo(-2.36, 0.84);
  sideProfile.lineTo(-2.38, 0.36);
  sideProfile.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(sideProfile, {
    depth: 1.92,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.09,
    bevelSegments: 3,
  });
  bodyGeo.translate(0, 0, -0.96);
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.computeVertexNormals();

  const mainBody = new THREE.Mesh(bodyGeo, paintMaterial);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  bodyGroup.add(mainBody);

  // 2. Sculpted Haunches & Fenders
  const rearHaunches = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.48, 1.55), paintMaterial);
  rearHaunches.position.set(0, 0.62, -1.32);
  rearHaunches.castShadow = true;
  bodyGroup.add(rearHaunches);

  const frontFenders = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.42, 1.35), paintMaterial);
  frontFenders.position.set(0, 0.56, 1.44);
  frontFenders.castShadow = true;
  bodyGroup.add(frontFenders);

  // 3. Exterior Canopy Glass
  const canopyProfile = new THREE.Shape();
  canopyProfile.moveTo(-1.45, 0.88);
  canopyProfile.lineTo(0.88, 0.86);
  canopyProfile.lineTo(0.16, 1.26);
  canopyProfile.lineTo(-0.98, 1.25);
  canopyProfile.closePath();

  const canopyGeo = new THREE.ExtrudeGeometry(canopyProfile, {
    depth: 1.46,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  canopyGeo.translate(0, 0, -0.73);
  canopyGeo.rotateY(-Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.position.y = 0.02;
  bodyGroup.add(canopy);

  // 4. Dedicated 3D Cockpit Interior + Animated Windshield Wipers + Raindrop Glass Overlay
  const cockpitGroup = new THREE.Group();
  cockpitGroup.visible = false;

  const dashMat = new THREE.MeshStandardMaterial({ color: 0x12151e, roughness: 0.72, metalness: 0.15 });
  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.34, 0.65), dashMat);
  dashboard.position.set(0, 0.82, 0.72);
  cockpitGroup.add(dashboard);

  const clusterScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.14, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  clusterScreen.position.set(-0.34, 0.94, 0.52);
  clusterScreen.rotation.x = -0.22;
  cockpitGroup.add(clusterScreen);

  for (const sx of [-0.74, 0.74]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 0.09), dashMat);
    pillar.position.set(sx, 1.15, 0.62);
    pillar.rotation.x = -0.68;
    cockpitGroup.add(pillar);
  }
  const roofHeader = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.07, 0.16), dashMat);
  roofHeader.position.set(0, 1.38, 0.34);
  cockpitGroup.add(roofHeader);

  // Animated 3D Windshield Wipers (visible in cockpit & exterior)
  const wiperGroup = new THREE.Group();
  const wiperPivots: THREE.Group[] = [];
  for (const wx of [-0.46, 0.08]) {
    const pivot = new THREE.Group();
    pivot.position.set(wx, 0.94, 0.86);
    pivot.rotation.x = -0.78;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.52, 0.024), carbonMat);
    arm.position.set(0, 0.24, 0);
    pivot.add(arm);
    wiperGroup.add(pivot);
    wiperPivots.push(pivot);
  }
  bodyGroup.add(wiperGroup);

  // Translucent Cockpit Windshield Raindrop Overlay
  const raindropGlassMat = new THREE.MeshBasicMaterial({
    map: raindropTex,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const windshieldRainPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.62), raindropGlassMat);
  windshieldRainPlane.position.set(0, 1.13, 0.63);
  windshieldRainPlane.rotation.x = -0.68;
  cockpitGroup.add(windshieldRainPlane);

  // Rotating 3D Racing Steering Wheel
  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(-0.34, 0.91, 0.36);
  steeringWheel.rotation.x = -0.25;

  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.024, 10, 24), dashMat);
  steeringWheel.add(wheelRing);

  const topMarker = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.055), accentMaterial);
  topMarker.position.set(0, 0.17, 0);
  steeringWheel.add(topMarker);

  steeringWheel.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.038, 0.025), rimMaterial));
  const spokeVert = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.025), rimMaterial);
  spokeVert.position.set(0, -0.08, 0);
  steeringWheel.add(spokeVert);
  cockpitGroup.add(steeringWheel);
  bodyGroup.add(cockpitGroup);

  // 5. Carbon Aero Kit
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.09, 0.52), carbonMat);
  splitter.position.set(0, 0.22, 2.26);
  bodyGroup.add(splitter);

  const sideSkirts = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.14, 2.6), carbonMat);
  sideSkirts.position.set(0, 0.24, 0.05);
  bodyGroup.add(sideSkirts);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.28, 0.36), carbonMat);
  diffuser.position.set(0, 0.32, -2.28);
  bodyGroup.add(diffuser);

  // 6. Standard Sport Wing (toggled per class)
  const gtWingGroup = new THREE.Group();
  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.07, 0.42), carbonMat);
  wingBlade.position.set(0, 1.18, -2.14);
  wingBlade.rotation.x = 0.14;
  wingBlade.castShadow = true;
  gtWingGroup.add(wingBlade);

  const endplateGeo = new THREE.BoxGeometry(0.05, 0.24, 0.5);
  for (const sx of [-1.08, 1.08]) {
    const plate = new THREE.Mesh(endplateGeo, accentMaterial);
    plate.position.set(sx, 1.16, -2.14);
    gtWingGroup.add(plate);

    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.24), carbonMat);
    pylon.position.set(sx * 0.52, 1.0, -2.08);
    gtWingGroup.add(pylon);
  }
  bodyGroup.add(gtWingGroup);

  // --- PER-VEHICLE-CLASS 3D ACCESSORY KITS (All 10 All-Cars-Pack Classes!) ---

  // A. MuscleCar Chrome Supercharger Blower Scoop
  const muscleKit = new THREE.Group();
  const blowerBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.26, 0.72), chromeMat);
  blowerBase.position.set(0, 0.94, 1.32);
  const blowerIntake = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.22), accentMaterial);
  blowerIntake.position.set(0, 1.04, 1.64);
  muscleKit.add(blowerBase, blowerIntake);
  muscleKit.visible = false;
  bodyGroup.add(muscleKit);

  // B. SUV / Sedan Roof Rack & Extended Cabin
  const suvKit = new THREE.Group();
  const suvCabin = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.48, 2.35), paintMaterial);
  suvCabin.position.set(0, 1.24, -0.58);
  const rackLeft = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 2.0), carbonMat);
  rackLeft.position.set(-0.74, 1.52, -0.55);
  const rackRight = rackLeft.clone();
  rackRight.position.x = 0.74;
  suvKit.add(suvCabin, rackLeft, rackRight);
  suvKit.visible = false;
  bodyGroup.add(suvKit);

  // C. OffRoad4x4 Bullbar + Roof LED Lightbar + Spare Tire
  const offRoadKit = new THREE.Group();
  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.22), carbonMat);
  bullbar.position.set(0, 0.54, 2.48);
  const roofBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.12, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8dc, emissiveIntensity: 3.5 })
  );
  roofBar.position.set(0, 1.56, 0.32);
  const spareWheel = buildWheelAssembly(0.38, 0.26, 0x334155, rimMaterial);
  spareWheel.rotation.y = Math.PI / 2;
  spareWheel.position.set(0, 0.85, -2.42);
  offRoadKit.add(bullbar, roofBar, spareWheel);
  offRoadKit.visible = false;
  bodyGroup.add(offRoadKit);

  // D. PickupTruck Open Cargo Bed + Rollbar
  const pickupKit = new THREE.Group();
  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.14, 1.85), carbonMat);
  bedFloor.position.set(0, 0.76, -1.52);
  const bedSideL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 1.9), paintMaterial);
  bedSideL.position.set(-0.96, 0.94, -1.52);
  const bedSideR = bedSideL.clone();
  bedSideR.position.x = 0.96;
  const rollBar = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.06, 8, 16, Math.PI), carbonMat);
  rollBar.position.set(0, 0.96, -0.78);
  pickupKit.add(bedFloor, bedSideL, bedSideR, rollBar);
  pickupKit.visible = false;
  bodyGroup.add(pickupKit);

  // E. PoliceCar Player VCPD Interceptor Kit (Active Flashing Red/Blue Bar + Pushbar)
  const policeKit = new THREE.Group();
  const pPushbar = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.22), carbonMat);
  pPushbar.position.set(0, 0.52, 2.46);
  const pBarBase = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.1, 0.28), carbonMat);
  pBarBase.position.set(0, 1.32, -0.2);
  const playerRedMat = new THREE.MeshStandardMaterial({
    color: 0xff2233,
    emissive: 0xff1122,
    emissiveIntensity: 5.5,
  });
  const playerBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2288ff,
    emissive: 0x1166ff,
    emissiveIntensity: 5.5,
  });
  const pRed = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.26), playerRedMat);
  pRed.position.set(-0.34, 1.38, -0.2);
  const pBlue = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.26), playerBlueMat);
  pBlue.position.set(0.34, 1.38, -0.2);
  const pSirenLight = new THREE.PointLight(0xff2233, 0, 22, 1.5);
  pSirenLight.position.set(0, 1.9, -0.2);
  policeKit.add(pPushbar, pBarBase, pRed, pBlue, pSirenLight);
  policeKit.visible = false;
  bodyGroup.add(policeKit);

  // F. RaceCar / Hypercar Shark Fin + Wide Swan-Neck GT3 Wing
  const raceKit = new THREE.Group();
  const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 1.25), accentMaterial);
  sharkFin.position.set(0, 1.32, -1.25);
  const bigWing = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.08, 0.52), carbonMat);
  bigWing.position.set(0, 1.38, -2.26);
  bigWing.rotation.x = 0.18;
  raceKit.add(sharkFin, bigWing);
  raceKit.visible = false;
  bodyGroup.add(raceKit);

  // 7. Side Mirrors & Illuminated License Plate (ZV766 — Screenshot #1!)
  const mirrorGeo = new THREE.BoxGeometry(0.28, 0.11, 0.18);
  for (const sx of [-1.06, 1.06]) {
    const mirror = new THREE.Mesh(mirrorGeo, paintMaterial);
    mirror.position.set(sx, 0.94, 0.62);
    bodyGroup.add(mirror);
  }

  const plateMat = new THREE.MeshBasicMaterial({ map: createLicensePlateTexture() });
  const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.19), plateMat);
  plateMesh.position.set(0, 0.48, -2.41);
  plateMesh.rotation.y = Math.PI;
  bodyGroup.add(plateMesh);

  // 8. Neon Underglow
  const underglowMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });
  const underglowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.05, 3.3), underglowMaterial);
  underglowMesh.position.set(0, 0.18, 0);
  bodyGroup.add(underglowMesh);

  const underglowLight = new THREE.PointLight(0x38bdf8, 4.5, 9, 1.6);
  underglowLight.position.set(0, 0.26, 0);
  bodyGroup.add(underglowLight);

  // 9. Headlights, Volumetric Fog Cones, & Sharp Dual-Signature LED Taillights (Screenshots #1, #4, #6, #12)
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xeef8ff,
    emissive: 0xd8f3ff,
    emissiveIntensity: 3.4,
    roughness: 0.1,
  });
  const hlGeo = new THREE.BoxGeometry(0.52, 0.1, 0.22);
  for (const sx of [-0.74, 0.74]) {
    const hl = new THREE.Mesh(hlGeo, headMat);
    hl.position.set(sx, 0.56, 2.34);
    hl.rotation.y = sx > 0 ? -0.18 : 0.18;
    bodyGroup.add(hl);
  }

  // Volumetric Headlight Fog Beam Cones (Illuminate Dense Fog & Heavy Rain!)
  const fogConeMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const fogCones: THREE.Mesh[] = [];
  const coneGeo = new THREE.ConeGeometry(2.1, 14, 14, 1, true);
  coneGeo.translate(0, -7, 0);
  coneGeo.rotateX(Math.PI / 2);
  for (const sx of [-0.74, 0.74]) {
    const cone = new THREE.Mesh(coneGeo, fogConeMat);
    cone.position.set(sx, 0.56, 2.4);
    bodyGroup.add(cone);
    fogCones.push(cone);
  }

  const headlightSpot = new THREE.PointLight(0xe0f2fe, 5.0, 28, 1.5);
  headlightSpot.position.set(0, 0.8, 3.6);
  bodyGroup.add(headlightSpot);

  const tailLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff1a3c,
    emissive: 0xff0d33,
    emissiveIntensity: 3.2,
    roughness: 0.12,
  });
  // Dual aggressive LED blades + thin center light bar (Solar Crown / GTA 6 style)
  for (const sx of [-0.72, 0.72]) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.15, 0.11), tailLightMaterial);
    pod.position.set(sx, 0.72, -2.38);
    bodyGroup.add(pod);
  }
  const tailCenterLine = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 0.09), tailLightMaterial);
  tailCenterLine.position.set(0, 0.72, -2.38);
  bodyGroup.add(tailCenterLine);

  // 10. Exhausts & Nitro Flames
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.95, roughness: 0.18 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
  const nitroFlames: THREE.Mesh[] = [];
  const exhaustGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.25, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const flameGeo = new THREE.ConeGeometry(0.14, 1.25, 10);
  flameGeo.rotateX(-Math.PI / 2);

  for (const sx of [-0.46, 0.46]) {
    const pipe = new THREE.Mesh(exhaustGeo, exhaustMat);
    pipe.position.set(sx, 0.34, -2.42);
    bodyGroup.add(pipe);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(sx, 0.34, -3.08);
    flame.visible = false;
    bodyGroup.add(flame);
    nitroFlames.push(flame);
  }

  // 11. Four Steering & Spinning Wheels
  const wheelRadius = 0.39;
  const wheelPositions: [number, number, number, boolean][] = [
    [-1.02, wheelRadius, 1.44, true],
    [1.02, wheelRadius, 1.44, true],
    [-1.05, wheelRadius, -1.38, false],
    [1.05, wheelRadius, -1.38, false],
  ];

  const frontWheelPivots: THREE.Group[] = [];
  const wheelMeshes: THREE.Group[] = [];

  for (const [wx, wy, wz, isFront] of wheelPositions) {
    const pivot = new THREE.Group();
    pivot.position.set(wx, wy, wz);
    const wheel = buildWheelAssembly(wheelRadius, isFront ? 0.3 : 0.35, paint.accentHex, rimMaterial);
    pivot.add(wheel);
    root.add(pivot);
    wheelMeshes.push(wheel);
    if (isFront) frontWheelPivots.push(pivot);
  }

  let currentClassId: VehicleClassId = 'Supercar';
  let wiperPhase = 0;

  return {
    root,
    bodyGroup,
    cockpitGroup,
    steeringWheel,
    paintMaterial,
    accentMaterial,
    rimMaterial,
    tailLightMaterial,
    underglowMaterial,
    underglowLight,
    nitroFlames,
    frontWheelPivots,
    wheelMeshes,
    headlightSpot,
    applyPaint: (nextPaint: CarPaintOption) => {
      paintMaterial.color.setHex(nextPaint.hex);
      paintMaterial.metalness = nextPaint.metalness;
      paintMaterial.roughness = nextPaint.roughness;
      accentMaterial.color.setHex(nextPaint.accentHex);
    },
    applyRimColor: (hex: number) => {
      rimMaterial.color.setHex(hex);
    },
    setUnderglow: (enabled: boolean, hex: number) => {
      underglowMesh.visible = enabled;
      underglowLight.visible = enabled;
      if (enabled) {
        underglowMaterial.color.setHex(hex);
        underglowLight.color.setHex(hex);
      }
    },
    applyVehicleSpec: (spec: VehicleSpec) => {
      currentClassId = spec.id;
      const sx = spec.width / 2.0;
      const sy = spec.height / 1.15;
      const sz = spec.length / 4.6;
      bodyGroup.scale.set(sx, sy, sz);

      // Lifted suspension clearance for OffRoad4x4, SUV, PickupTruck
      const liftY =
        spec.id === 'OffRoad4x4' ? 0.22 : spec.id === 'PickupTruck' || spec.id === 'SUV' ? 0.14 : 0;
      bodyGroup.position.y = liftY;

      gtWingGroup.visible =
        spec.id === 'SportsCar' || spec.id === 'Supercar' || spec.id === 'Hypercar';
      muscleKit.visible = spec.id === 'MuscleCar';
      suvKit.visible = spec.id === 'SUV' || spec.id === 'OffRoad4x4';
      offRoadKit.visible = spec.id === 'OffRoad4x4';
      pickupKit.visible = spec.id === 'PickupTruck';
      policeKit.visible = spec.id === 'PoliceCar';
      raceKit.visible = spec.id === 'RaceCar' || spec.id === 'Hypercar';

      // Larger off-road tires for 4x4 / SUV / Pickup
      const wheelScale =
        spec.id === 'OffRoad4x4' ? 1.24 : spec.id === 'SUV' || spec.id === 'PickupTruck' ? 1.14 : 1.0;
      for (const w of wheelMeshes) {
        w.scale.set(wheelScale, wheelScale, wheelScale);
      }
    },
    setCockpitViewActive: (active: boolean) => {
      canopy.visible = !active;
      cockpitGroup.visible = active;
    },
    setBraking: (braking: boolean) => {
      tailLightMaterial.emissiveIntensity = braking ? 6.4 : 2.8;
    },
    setNitroVisual: (active: boolean, time: number) => {
      for (const flame of nitroFlames) {
        flame.visible = active;
        if (active) {
          const pulse = 0.82 + 0.38 * Math.sin(time * 48);
          flame.scale.set(1, 1, pulse);
        }
      }
    },
    setSteerAndSpin: (steerAngle: number, spinDelta: number) => {
      for (const p of frontWheelPivots) {
        p.rotation.y = steerAngle;
      }
      for (const w of wheelMeshes) {
        w.rotation.x += spinDelta;
      }
      steeringWheel.rotation.z = steerAngle * 2.6;
    },
    setWeatherVisuals: (
      rain01: number,
      fog01: number,
      headlightsOn: boolean,
      time: number,
      dt: number
    ) => {
      // Headlight emission & Volumetric Fog Cones (Screenshots #7 & #10)
      headMat.emissiveIntensity = headlightsOn ? 4.4 : 1.2;
      headlightSpot.intensity = headlightsOn ? 11.5 : 1.2;
      const coneOpacity = headlightsOn ? Math.min(0.24, 0.04 + fog01 * 0.16 + rain01 * 0.06) : 0;
      fogConeMat.opacity = coneOpacity;
      for (const c of fogCones) c.visible = coneOpacity > 0.01;

      // Windshield Wiper Sweep + Raindrop Glass Texture Scroll
      if (rain01 > 0.06) {
        const speed = 2.6 + rain01 * 3.8;
        wiperPhase += dt * speed;
        const sweep = Math.sin(wiperPhase) * 0.62 - 0.15;
        for (const wp of wiperPivots) {
          wp.rotation.z = sweep;
        }
        raindropGlassMat.opacity = Math.min(0.68, rain01 * 0.62);
        raindropTex.offset.y = (raindropTex.offset.y + dt * (0.22 + rain01 * 0.45)) % 1;
      } else {
        for (const wp of wiperPivots) {
          wp.rotation.z = THREE.MathUtils.damp(wp.rotation.z, -0.75, 6, dt);
        }
        raindropGlassMat.opacity = THREE.MathUtils.damp(raindropGlassMat.opacity, 0, 4, dt);
      }

      // Active PoliceCar player strobe when driving PoliceCar class
      if (currentClassId === 'PoliceCar') {
        const phase = Math.floor(time * 9.5) % 4;
        const isRed = phase < 2;
        const pulse = phase % 2 === 0 ? 1.0 : 0.35;
        playerRedMat.emissiveIntensity = isRed ? 6.5 * pulse : 0.25;
        playerBlueMat.emissiveIntensity = !isRed ? 6.5 * pulse : 0.25;
        pSirenLight.color.setHex(isRed ? 0xff2233 : 0x2277ff);
        pSirenLight.intensity = 9.0 * pulse;
      } else {
        pSirenLight.intensity = 0;
      }
    },
  };
}

export function createStreetRacerVehicle(
  colorHex: number,
  shadowTex: THREE.Texture
): CivilianCarRig {
  const root = new THREE.Group();
  root.add(createContactShadowMesh(shadowTex, 2.65, 5.1));

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.78,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 0.5, metalness: 0.4 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1322,
    roughness: 0.06,
    metalness: 0.2,
    clearcoat: 1.0,
  });

  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.52, 4.55), paintMat);
  lower.position.set(0, 0.56, 0);
  lower.castShadow = true;
  root.add(lower);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.44, 1.92), glassMat);
  cabin.position.set(0, 1.0, -0.22);
  root.add(cabin);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.07, 0.38), carbonMat);
  wing.position.set(0, 1.12, -2.05);
  root.add(wing);

  const tailBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.11, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 3.2 })
  );
  tailBar.position.set(0, 0.68, -2.29);
  root.add(tailBar);

  const wheelMeshes: THREE.Group[] = [];
  for (const [wx, wz] of [
    [-1.02, 1.4],
    [1.02, 1.4],
    [-1.02, -1.35],
    [1.02, -1.35],
  ]) {
    const w = buildWheelAssembly(0.38, 0.3, colorHex);
    w.position.set(wx, 0.38, wz);
    root.add(w);
    wheelMeshes.push(w);
  }

  return { root, wheelMeshes };
}

export function createPoliceVehicle(isSwat: boolean, shadowTex: THREE.Texture): PoliceCarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const scaleX = isSwat ? 1.12 : 1.0;
  const scaleZ = isSwat ? 1.08 : 1.0;
  root.add(createContactShadowMesh(shadowTex, 2.75 * scaleX, 5.2 * scaleZ));

  const blackPaint = new THREE.MeshPhysicalMaterial({
    color: isSwat ? 0x11141c : 0x12151f,
    metalness: 0.55,
    roughness: 0.24,
    clearcoat: 0.85,
  });
  const whiteDoors = new THREE.MeshPhysicalMaterial({
    color: isSwat ? 0x1e2536 : 0xf1f5f9,
    metalness: 0.25,
    roughness: 0.26,
    clearcoat: 0.8,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1422,
    metalness: 0.2,
    roughness: 0.08,
    clearcoat: 1.0,
  });
  const bullbarMat = new THREE.MeshStandardMaterial({ color: 0x262b36, roughness: 0.62, metalness: 0.72 });

  const hullH = isSwat ? 0.72 : 0.58;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.06 * scaleX, hullH, 4.72 * scaleZ), blackPaint);
  hull.position.set(0, 0.34 + hullH * 0.5, 0);
  hull.castShadow = true;
  hull.receiveShadow = true;
  bodyGroup.add(hull);

  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.1 * scaleX, hullH * 0.84, 2.18 * scaleZ), whiteDoors);
  doorPanel.position.set(0, 0.36 + hullH * 0.5, -0.04);
  bodyGroup.add(doorPanel);

  const cabinH = isSwat ? 0.72 : 0.56;
  const cabinLen = isSwat ? 3.1 : 2.3;
  const cabinZ = isSwat ? -0.35 : -0.18;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8 * scaleX, cabinH, cabinLen), glassMat);
  cabin.position.set(0, 0.34 + hullH + cabinH * 0.46, cabinZ);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.74 * scaleX, 0.1, cabinLen * 0.82), whiteDoors);
  roofCap.position.set(0, 0.34 + hullH + cabinH * 0.94, cabinZ);
  bodyGroup.add(roofCap);

  const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.55 * scaleX, 0.42, 0.22), bullbarMat);
  pushBar.position.set(0, 0.54, 2.44 * scaleZ);
  bodyGroup.add(pushBar);

  const barY = 0.34 + hullH + cabinH + 0.08;
  const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.1, 0.28), bullbarMat);
  barBase.position.set(0, barY - 0.04, 0.08);
  bodyGroup.add(barBase);

  const redBarMat = new THREE.MeshStandardMaterial({
    color: 0xff2233,
    emissive: 0xff1122,
    emissiveIntensity: 4.5,
    roughness: 0.15,
  });
  const blueBarMat = new THREE.MeshStandardMaterial({
    color: 0x2288ff,
    emissive: 0x1166ff,
    emissiveIntensity: 4.5,
    roughness: 0.15,
  });

  const redLens = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.26), redBarMat);
  redLens.position.set(-0.34, barY + 0.04, 0.08);
  bodyGroup.add(redLens);

  const blueLens = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.26), blueBarMat);
  blueLens.position.set(0.34, barY + 0.04, 0.08);
  bodyGroup.add(blueLens);

  const sirenLight = new THREE.PointLight(0xff1e38, 0, 24, 1.5);
  sirenLight.position.set(0, barY + 0.75, 0.08);
  bodyGroup.add(sirenLight);

  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d8, emissiveIntensity: 2.8 });
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xff2030, emissive: 0xff1020, emissiveIntensity: 2.4 });

  for (const sx of [-0.7, 0.7]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), hlMat);
    hl.position.set(sx * scaleX, 0.64, 2.38 * scaleZ);
    bodyGroup.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.08), tlMat);
    tl.position.set(sx * scaleX, 0.68, -2.38 * scaleZ);
    bodyGroup.add(tl);
  }

  const wheelRadius = isSwat ? 0.44 : 0.39;
  const wheelMeshes: THREE.Group[] = [];
  const coords: [number, number][] = [
    [-1.02 * scaleX, 1.48 * scaleZ],
    [1.02 * scaleX, 1.48 * scaleZ],
    [-1.02 * scaleX, -1.42 * scaleZ],
    [1.02 * scaleX, -1.42 * scaleZ],
  ];
  for (const [wx, wz] of coords) {
    const w = buildWheelAssembly(wheelRadius, 0.3, 0x3b82f6);
    w.position.set(wx, wheelRadius, wz);
    root.add(w);
    wheelMeshes.push(w);
  }

  return {
    root,
    bodyGroup,
    redBarMat,
    blueBarMat,
    sirenLight,
    wheelMeshes,
    updateStrobe: (time: number, active: boolean) => {
      if (!active) {
        redBarMat.emissiveIntensity = 0.25;
        blueBarMat.emissiveIntensity = 0.25;
        sirenLight.intensity = 0;
        return;
      }
      const phase = Math.floor(time * 9.5) % 4;
      const isRed = phase === 0 || phase === 1;
      const pulse = phase % 2 === 0 ? 1.0 : 0.35;
      redBarMat.emissiveIntensity = isRed ? 6.5 * pulse : 0.25;
      blueBarMat.emissiveIntensity = !isRed ? 6.5 * pulse : 0.25;
      sirenLight.color.setHex(isRed ? 0xff2233 : 0x2277ff);
      sirenLight.intensity = 10.0 * pulse;
    },
  };
}

export function createCivilianVehicle(
  style: 'coupe' | 'sedan' | 'suv',
  colorHex: number,
  shadowTex: THREE.Texture
): CivilianCarRig {
  const root = new THREE.Group();
  const isSuv = style === 'suv';
  const isCoupe = style === 'coupe';

  root.add(createContactShadowMesh(shadowTex, isSuv ? 2.65 : 2.4, isSuv ? 4.9 : 4.55));

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.48,
    roughness: 0.24,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d1624,
    roughness: 0.08,
    metalness: 0.2,
    clearcoat: 1.0,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1f242e, roughness: 0.65, metalness: 0.25 });

  const bodyH = isSuv ? 0.68 : isCoupe ? 0.48 : 0.56;
  const bodyLen = isSuv ? 4.45 : isCoupe ? 4.15 : 4.35;
  const bodyW = isSuv ? 2.04 : 1.92;

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyLen), bodyMat);
  lowerBody.position.set(0, 0.34 + bodyH * 0.5, 0);
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  root.add(lowerBody);

  const cabinH = isSuv ? 0.66 : isCoupe ? 0.44 : 0.52;
  const cabinLen = isSuv ? 2.75 : isCoupe ? 1.85 : 2.18;
  const cabinZ = isSuv ? -0.25 : -0.18;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.86, cabinH, cabinLen), glassMat);
  cabin.position.set(0, 0.34 + bodyH + cabinH * 0.44, cabinZ);
  cabin.castShadow = true;
  root.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.82, 0.09, cabinLen * 0.84), bodyMat);
  roof.position.set(0, 0.34 + bodyH + cabinH * 0.9, cabinZ);
  root.add(roof);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.96, 0.18, 0.16), trimMat);
  frontBumper.position.set(0, 0.36, bodyLen * 0.5 + 0.02);
  root.add(frontBumper);

  const hlMat = new THREE.MeshStandardMaterial({ color: 0xfffbe6, emissive: 0xfff3cc, emissiveIntensity: 2.2 });
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xff2233, emissive: 0xff1122, emissiveIntensity: 2.2 });
  for (const sx of [-0.66, 0.66]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.06), hlMat);
    hl.position.set(sx, 0.6, bodyLen * 0.5 + 0.02);
    root.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), tlMat);
    tl.position.set(sx, 0.62, -bodyLen * 0.5 - 0.02);
    root.add(tl);
  }

  const wheelRadius = isSuv ? 0.41 : 0.36;
  const wheelMeshes: THREE.Group[] = [];
  const wz = bodyLen * 0.31;
  for (const [wx, z] of [
    [-bodyW * 0.5, wz],
    [bodyW * 0.5, wz],
    [-bodyW * 0.5, -wz],
    [bodyW * 0.5, -wz],
  ]) {
    const w = buildWheelAssembly(wheelRadius, 0.26, 0x64748b);
    w.position.set(wx, wheelRadius, z);
    root.add(w);
    wheelMeshes.push(w);
  }

  return { root, wheelMeshes };
}

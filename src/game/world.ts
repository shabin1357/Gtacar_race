import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';
import { BuildingCollider, JumpRamp, PickupItem, RepairStation } from './types';

export const ROAD_SPACING = 100;
export const ROAD_WIDTH = 22;
export const ROAD_COORDS = [-200, -100, 0, 100, 200];
export const PLAYABLE_MIN_X = -245;
export const PLAYABLE_MAX_X = 355;
export const PLAYABLE_MIN_Z = -245;
export const PLAYABLE_MAX_Z = 245;

export interface DistrictMarker {
  id: string;
  name: string;
  gridSector: string;
  biome: string;
  summary: string;
  x: number;
  z: number;
  radius: number;
  wantedMultiplier: number;
  restricted?: boolean;
  baseWanted?: number;
}

export interface PlayerSpawnPoint {
  id: string;
  name: string;
  x: number;
  z: number;
  rotY: number;
}

export const WORLD_DISTRICTS: DistrictMarker[] = [
  {
    id: 'redrock_badlands',
    name: 'Redrock Badlands & Mirage Sea',
    gridSector: 'D1–F3',
    biome: 'Arid Desert & Salt Lake',
    summary: 'Mirage Sea shoreline, ochre mesas, off-road trails & desert airstrip',
    x: 40,
    z: -195,
    radius: 72,
    wantedMultiplier: 0.8,
  },
  {
    id: 'fort_vespera',
    name: 'Fort Vespera Airbase',
    gridSector: 'B3–C3',
    biome: 'Restricted Military Base',
    summary: 'Heavy radar perimeter & fighter hangars — instant 4★ alert',
    x: -165,
    z: -155,
    radius: 56,
    wantedMultiplier: 1.6,
    restricted: true,
    baseWanted: 4,
  },
  {
    id: 'verona_hills',
    name: 'Verona Hills & Estates',
    gridSector: 'B4–C5',
    biome: 'Luxury Hillside Canyon',
    summary: 'Winding hillside drives, palm villas & exotic car spawns',
    x: -155,
    z: -20,
    radius: 64,
    wantedMultiplier: 1.2,
  },
  {
    id: 'coral_cove',
    name: 'Coral Cove Boardwalk',
    gridSector: 'B6–C7',
    biome: 'Coastal Canals & Pier',
    summary: 'Waterfront promenade, marina slips & stunt jump ramps',
    x: -150,
    z: 135,
    radius: 62,
    wantedMultiplier: 1.0,
  },
  {
    id: 'solara_metro',
    name: 'Solara Metropolis Core',
    gridSector: 'D5–E7',
    biome: 'High-Density Financial Core',
    summary: 'Neon skyscraper canyon, elevated loops & high pursuit heat',
    x: 10,
    z: 10,
    radius: 78,
    wantedMultiplier: 1.5,
  },
  {
    id: 'port_meridian',
    name: 'Port Meridian Docks',
    gridSector: 'D8–E8',
    biome: 'Heavy Industrial Harbor',
    summary: 'Container terminals, cargo cranes & dry-dock getaway alleys',
    x: -55,
    z: 195,
    radius: 58,
    wantedMultiplier: 1.1,
  },
  {
    id: 'solara_airport',
    name: 'Solara Intl Airport',
    gridSector: 'E8–F8',
    biome: 'Restricted Aviation Hub',
    summary: 'Dual commercial runways & jet hangars — 3★ tarmac security alert',
    x: 115,
    z: 205,
    radius: 60,
    wantedMultiplier: 1.4,
    restricted: true,
    baseWanted: 3,
  },
  {
    id: 'neon_cay',
    name: 'Neon Cay & Lighthouse Pt',
    gridSector: 'G6–G7',
    biome: 'Tropical Barrier Resort',
    summary: 'Ocean Drive neon strip, golden sands & coastal lighthouse',
    x: 245,
    z: 75,
    radius: 68,
    wantedMultiplier: 1.2,
  },
  {
    id: 'bay_causeway',
    name: 'Emerald Bay Causeway',
    gridSector: 'G5–H5',
    biome: 'Over-Water Suspension Bridge',
    summary: 'High-speed ocean suspension span linking Solara & outer keys',
    x: 310,
    z: 0,
    radius: 48,
    wantedMultiplier: 1.3,
  },
  {
    id: 'solar_ridge',
    name: 'Mt. Calavera Ridge',
    gridSector: 'C1–E1',
    biome: 'Northern Alpine Peaks',
    summary: 'Scenic summit overlook & northern perimeter expressway',
    x: -215,
    z: -60,
    radius: 60,
    wantedMultiplier: 0.9,
  },
];

export const PLAYER_SPAWNS: PlayerSpawnPoint[] = [
  { id: 'neon_cay_strip', name: 'Neon Cay Boulevard', x: 200, z: 110, rotY: Math.PI },
  { id: 'coral_safehouse', name: 'Coral Cove Safehouse', x: -100, z: 100, rotY: Math.PI },
  { id: 'redrock_airstrip', name: 'Redrock Desert Loop', x: 0, z: -200, rotY: Math.PI / 2 },
  { id: 'metro_plaza', name: 'Solara Metropolis Plaza', x: 0, z: 0, rotY: Math.PI },
];

export interface WorldBuildResult {
  group: THREE.Group;
  buildings: BuildingCollider[];
  ramps: JumpRamp[];
  repairs: RepairStation[];
  pickups: PickupItem[];
  pickupMeshes: Map<string, THREE.Group>;
  repairRings: Map<string, THREE.Mesh>;
  emissiveMaterials: THREE.MeshStandardMaterial[];
  neonTrimMaterials: THREE.MeshStandardMaterial[];
  roadMaterials: THREE.MeshPhysicalMaterial[];
  streetLampMaterial: THREE.MeshStandardMaterial;
  setEmissiveScale: (scale: number) => void;
  setRoadWetness: (wetness01: number, nightFactor: number) => void;
  updateAmbientProps: (elapsed: number, nightFactor: number) => void;
  getDistrictName: (x: number, z: number) => string;
  getDistrictMeta: (x: number, z: number) => DistrictMarker;
}

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildLeonidaWorld(textures: ProceduralTextureSet): WorldBuildResult {
  const group = new THREE.Group();
  const buildings: BuildingCollider[] = [];
  const ramps: JumpRamp[] = [];
  const repairs: RepairStation[] = [];
  const pickups: PickupItem[] = [];
  const pickupMeshes = new Map<string, THREE.Group>();
  const repairRings = new Map<string, THREE.Mesh>();
  const emissiveMaterials: THREE.MeshStandardMaterial[] = [];
  const neonTrimMaterials: THREE.MeshStandardMaterial[] = [];
  const storefrontSignMaterials: THREE.MeshStandardMaterial[] = [];
  const roadMaterials: THREE.MeshPhysicalMaterial[] = [];
  const wetNeonPoolMats: THREE.MeshBasicMaterial[] = [];
  const rand = createRng(6062026);

  // 1. Extended natural base ground
  const baseGroundMat = new THREE.MeshStandardMaterial({
    color: 0x26382b,
    roughness: 0.92,
    metalness: 0.02,
  });
  const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(1700, 1800), baseGroundMat);
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.set(-240, -0.08, 0);
  baseGround.receiveShadow = true;
  group.add(baseGround);

  // Urban concrete foundation slab
  const citySlabMat = new THREE.MeshStandardMaterial({
    map: textures.sidewalkAlbedo,
    roughness: 0.8,
    metalness: 0.05,
  });
  const citySlab = new THREE.Mesh(new THREE.PlaneGeometry(490, 520), citySlabMat);
  citySlab.rotation.x = -Math.PI / 2;
  citySlab.position.set(-12, 0.0, 0);
  citySlab.receiveShadow = true;
  group.add(citySlab);

  // 2. Golden Beachfront Sand
  const sandMat = new THREE.MeshStandardMaterial({
    map: textures.sandAlbedo,
    roughness: 0.9,
    metalness: 0.02,
  });
  const beachMesh = new THREE.Mesh(new THREE.PlaneGeometry(115, 1600), sandMat);
  beachMesh.rotation.x = -Math.PI / 2;
  beachMesh.position.set(276, -0.02, 0);
  beachMesh.receiveShadow = true;
  group.add(beachMesh);

  // Ocean Drive Promenade Boardwalk
  const boardwalkMat = new THREE.MeshStandardMaterial({
    color: 0xd6c7b2,
    roughness: 0.72,
    metalness: 0.05,
  });
  const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(10, 0.24, 560), boardwalkMat);
  boardwalk.position.set(218, 0.12, 0);
  boardwalk.receiveShadow = true;
  group.add(boardwalk);

  // 3. Connected High-Gloss Wet-Capable Road Network (MeshPhysicalMaterial with dynamic clearcoat puddles!)
  const roadMatNS = new THREE.MeshPhysicalMaterial({
    map: textures.roadAlbedo.clone(),
    roughnessMap: textures.roadRoughness.clone(),
    roughness: 0.52,
    metalness: 0.18,
    clearcoat: 0.28,
    clearcoatRoughness: 0.16,
    reflectivity: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  roadMatNS.map!.repeat.set(1, 24);
  roadMatNS.roughnessMap!.repeat.set(1, 24);
  roadMatNS.map!.needsUpdate = true;
  roadMatNS.roughnessMap!.needsUpdate = true;

  const roadMatEW = new THREE.MeshPhysicalMaterial({
    map: textures.roadAlbedo.clone(),
    roughnessMap: textures.roadRoughness.clone(),
    roughness: 0.52,
    metalness: 0.18,
    clearcoat: 0.28,
    clearcoatRoughness: 0.16,
    reflectivity: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  roadMatEW.map!.repeat.set(1, 24);
  roadMatEW.roughnessMap!.repeat.set(1, 24);
  roadMatEW.map!.needsUpdate = true;
  roadMatEW.roughnessMap!.needsUpdate = true;

  // Zebra-crosswalk intersections (Screenshots #5 & #9)
  const intersectionMat = new THREE.MeshPhysicalMaterial({
    map: textures.intersectionAlbedo,
    roughnessMap: textures.roadRoughness,
    roughness: 0.48,
    metalness: 0.2,
    clearcoat: 0.3,
    clearcoatRoughness: 0.15,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });

  roadMaterials.push(roadMatNS, roadMatEW, intersectionMat);

  const nsGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 560);
  nsGeo.rotateX(-Math.PI / 2);
  for (const x of ROAD_COORDS) {
    const road = new THREE.Mesh(nsGeo, roadMatNS);
    road.position.set(x, 0.03, 0);
    road.receiveShadow = true;
    group.add(road);
  }

  const ewGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 490);
  ewGeo.rotateX(-Math.PI / 2);
  ewGeo.rotateY(Math.PI / 2);
  for (const z of ROAD_COORDS) {
    const road = new THREE.Mesh(ewGeo, roadMatEW);
    road.position.set(-10, 0.045, z);
    road.receiveShadow = true;
    group.add(road);
  }

  const interGeo = new THREE.PlaneGeometry(ROAD_WIDTH + 0.6, ROAD_WIDTH + 0.6);
  interGeo.rotateX(-Math.PI / 2);
  for (const x of ROAD_COORDS) {
    for (const z of ROAD_COORDS) {
      const pad = new THREE.Mesh(interGeo, intersectionMat);
      pad.position.set(x, 0.06, z);
      pad.receiveShadow = true;
      group.add(pad);
    }
  }

  // 4. Shared Building, Neon & Foliage Materials
  const facadeMaterials = textures.buildingFacades.map((f) => {
    const mat = new THREE.MeshStandardMaterial({
      map: f.albedo,
      emissiveMap: f.emissive,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.0,
      roughness: f.roughness,
      metalness: f.metalness,
    });
    emissiveMaterials.push(mat);
    return mat;
  });

  const neonColors = [0xff2e93, 0x06d6a0, 0xffbe0b, 0x38bdf8, 0xf97316, 0xc026d3];
  for (const hex of neonColors) {
    const nMat = new THREE.MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: 2.6,
      roughness: 0.18,
    });
    neonTrimMaterials.push(nMat);
  }

  // Street-level illuminated neon storefront marquee materials (Screenshots #3, #4, #6, #12)
  for (const tex of textures.neonSignTextures) {
    const sMat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.9,
      roughness: 0.25,
    });
    storefrontSignMaterials.push(sMat);
  }

  // Wet street neon reflection shimmer decals along main boulevards (Screenshots #3, #4, #6, #12)
  const puddleColors = [0xec4899, 0x38bdf8, 0xf59e0b, 0xa855f7, 0x10b981];
  for (const hex of puddleColors) {
    const pm = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    wetNeonPoolMats.push(pm);
  }

  const puddleStripGeo = new THREE.PlaneGeometry(5.6, 16);
  puddleStripGeo.rotateX(-Math.PI / 2);
  for (const x of [0, 100, 200]) {
    for (let z = -180; z <= 180; z += 26) {
      if (Math.abs(z % 100) < 16) continue;
      for (const side of [-7.4, 7.4]) {
        const pm = wetNeonPoolMats[Math.floor(rand() * wetNeonPoolMats.length)];
        const strip = new THREE.Mesh(puddleStripGeo, pm);
        strip.position.set(x + side, 0.068, z);
        group.add(strip);
      }
    }
  }

  const roofMat = new THREE.MeshStandardMaterial({ color: 0x262b36, roughness: 0.85, metalness: 0.12 });
  const villaWallMat = new THREE.MeshStandardMaterial({ color: 0xf4e8d8, roughness: 0.78, metalness: 0.04 });
  const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xc2593f, roughness: 0.82, metalness: 0.04 });
  const industrialSteelMat = new THREE.MeshStandardMaterial({ color: 0x3b4454, roughness: 0.62, metalness: 0.55 });
  const craneYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45, metalness: 0.35 });
  const containerColors = [0xdc2626, 0x2563eb, 0x059669, 0xd97706];

  // 5. Build 10 Distinct Open-World Districts
  const blockCenters = [-150, -50, 50, 150];
  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      const isAirportBlock = (bx === 50 || bx === 150) && bz === 150;
      const isIndustrial = bx === -150 && bz <= -50;
      const isResidential = bx === -150 && bz >= 50;
      const isCountryside = bx === 150 && bz === -150;
      const isShopping = bx === 150 && (bz === -50 || bz === 50);
      const isCentralPlaza = bx === 50 && bz === 50;
      const isDowntown = (bx === -50 && bz <= 50) || (bx === 50 && bz === -50);

      // AIRPORT DISTRICT
      if (isAirportBlock) {
        if (bx === 150) {
          const runway = new THREE.Mesh(new THREE.PlaneGeometry(178, 72), intersectionMat);
          runway.rotation.x = -Math.PI / 2;
          runway.position.set(100, 0.07, 150);
          runway.receiveShadow = true;
          group.add(runway);

          const dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
          const edgeLightMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x38bdf8,
            emissiveIntensity: 3.0,
          });
          for (let rx = 25; rx <= 175; rx += 16) {
            const dash = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 1.2), dashMat);
            dash.position.set(rx, 0.09, 150);
            group.add(dash);

            for (const ez of [124, 176]) {
              const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.7), edgeLightMat);
              bulb.position.set(rx, 0.25, ez);
              group.add(bulb);
            }
          }

          const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.8, 28, 10), facadeMaterials[5]);
          towerBase.position.set(174, 14, 126);
          towerBase.castShadow = true;
          group.add(towerBase);
          const towerCab = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 5.2, 5.5, 10), facadeMaterials[3]);
          towerCab.position.set(174, 30.5, 126);
          group.add(towerCab);
          buildings.push({ minX: 168, maxX: 180, minZ: 120, maxZ: 132, height: 34, district: 'Airport' });

          const hangar = new THREE.Mesh(
            new THREE.CylinderGeometry(14, 14, 36, 16, 1, false, 0, Math.PI),
            industrialSteelMat
          );
          hangar.rotation.z = Math.PI / 2;
          hangar.position.set(55, 0.1, 124);
          hangar.castShadow = true;
          group.add(hangar);
          buildings.push({ minX: 37, maxX: 73, minZ: 112, maxZ: 136, height: 15, district: 'Airport' });
        }
        continue;
      }

      const curbMesh = new THREE.Mesh(new THREE.BoxGeometry(74, 0.22, 74), citySlabMat);
      curbMesh.position.set(bx, 0.11, bz);
      curbMesh.receiveShadow = true;
      group.add(curbMesh);

      if (isCountryside) {
        const grassPad = new THREE.Mesh(
          new THREE.BoxGeometry(72, 0.28, 72),
          new THREE.MeshStandardMaterial({ color: 0x356b3f, roughness: 0.9 })
        );
        grassPad.position.set(bx, 0.14, bz);
        grassPad.receiveShadow = true;
        group.add(grassPad);

        const ranch = new THREE.Mesh(new THREE.BoxGeometry(16, 6.5, 12), villaWallMat);
        ranch.position.set(bx - 12, 3.4, bz - 10);
        ranch.castShadow = true;
        group.add(ranch);
        const ranchRoof = new THREE.Mesh(new THREE.ConeGeometry(12, 4.2, 4), terracottaMat);
        ranchRoof.position.set(bx - 12, 8.7, bz - 10);
        ranchRoof.rotation.y = Math.PI / 4;
        group.add(ranchRoof);
        buildings.push({ minX: bx - 20, maxX: bx - 4, minZ: bz - 16, maxZ: bz - 4, height: 10, district: 'Countryside' });
        continue;
      }

      if (isCentralPlaza) {
        const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(8, 9.2, 1.4, 24), boardwalkMat);
        fountainBase.position.set(bx, 0.8, bz);
        fountainBase.castShadow = true;
        group.add(fountainBase);

        const waterPool = new THREE.Mesh(
          new THREE.CylinderGeometry(7.2, 7.2, 1.48, 24),
          new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.08, clearcoat: 1.0 })
        );
        waterPool.position.set(bx, 0.82, bz);
        group.add(waterPool);

        buildings.push({ minX: bx - 9.2, maxX: bx + 9.2, minZ: bz - 9.2, maxZ: bz + 9.2, height: 2, district: 'Shopping District' });
        continue;
      }

      if (isIndustrial) {
        const wh = new THREE.Mesh(new THREE.BoxGeometry(36, 13, 24), industrialSteelMat);
        wh.position.set(bx - 10, 6.7, bz - 12);
        wh.castShadow = true;
        wh.receiveShadow = true;
        group.add(wh);
        buildings.push({ minX: bx - 28, maxX: bx + 8, minZ: bz - 24, maxZ: bz, height: 14, district: 'Industrial' });

        for (let c = 0; c < 4; c++) {
          const cMat = new THREE.MeshStandardMaterial({
            color: containerColors[c % containerColors.length],
            roughness: 0.65,
            metalness: 0.3,
          });
          const cx = bx - 16 + c * 11;
          const cz = bz + 16;
          const box = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 18), cMat);
          box.position.set(cx, 2.3, cz);
          box.castShadow = true;
          group.add(box);
          buildings.push({ minX: cx - 4.5, maxX: cx + 4.5, minZ: cz - 9, maxZ: cz + 9, height: 4.5, district: 'Industrial' });
        }

        const craneLeg1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 30, 1.6), craneYellowMat);
        craneLeg1.position.set(bx + 22, 15, bz - 16);
        const craneLeg2 = craneLeg1.clone();
        craneLeg2.position.set(bx + 22, 15, bz - 2);
        const craneBoom = new THREE.Mesh(new THREE.BoxGeometry(28, 2.2, 3.2), craneYellowMat);
        craneBoom.position.set(bx + 15, 29, bz - 9);
        group.add(craneLeg1, craneLeg2, craneBoom);
        continue;
      }

      if (isResidential) {
        const villaCoords: [number, number][] = [
          [-18, -18],
          [18, -18],
          [-18, 18],
          [18, 18],
        ];
        for (const [vx, vz] of villaCoords) {
          const cx = bx + vx;
          const cz = bz + vz;
          const lawn = new THREE.Mesh(
            new THREE.BoxGeometry(28, 0.25, 28),
            new THREE.MeshStandardMaterial({ color: 0x3b7a4a, roughness: 0.92 })
          );
          lawn.position.set(cx, 0.24, cz);
          group.add(lawn);

          const houseH = 6.5 + rand() * 3.5;
          const house = new THREE.Mesh(new THREE.BoxGeometry(15, houseH, 13), villaWallMat);
          house.position.set(cx, houseH * 0.5 + 0.35, cz);
          house.castShadow = true;
          house.receiveShadow = true;
          group.add(house);

          const roof = new THREE.Mesh(new THREE.ConeGeometry(12.2, 4.2, 4), terracottaMat);
          roof.position.set(cx, houseH + 2.4, cz);
          roof.rotation.y = Math.PI / 4;
          roof.castShadow = true;
          group.add(roof);

          buildings.push({
            minX: cx - 7.8,
            maxX: cx + 7.8,
            minZ: cz - 6.8,
            maxZ: cz + 6.8,
            height: houseH + 4,
            district: 'Residential',
          });
        }
        continue;
      }

      // DOWNTOWN SKYSCRAPERS & SHOPPING / NIGHTLIFE NEON AVENUES
      const subOffsets: [number, number][] = [
        [-17.5, -17.5],
        [17.5, -17.5],
        [-17.5, 17.5],
        [17.5, 17.5],
      ];

      for (const [ox, oz] of subOffsets) {
        const w = 22 + rand() * 6;
        const d = 22 + rand() * 6;
        const cx = bx + ox;
        const cz = bz + oz;

        let height: number;
        let facadeIdx: number;
        let districtName: string;
        if (isShopping) {
          height = 16 + rand() * 17;
          facadeIdx = Math.floor(rand() * 3);
          districtName = 'Shopping District';
        } else if (isDowntown) {
          height = 48 + rand() * 56;
          facadeIdx = rand() > 0.25 ? (rand() > 0.5 ? 3 : 4) : 5;
          districtName = 'Downtown';
        } else {
          height = 24 + rand() * 28;
          facadeIdx = Math.floor(rand() * facadeMaterials.length);
          districtName = 'Downtown';
        }

        const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), facadeMaterials[facadeIdx]);
        bldg.position.set(cx, height * 0.5 + 0.22, cz);
        bldg.castShadow = true;
        bldg.receiveShadow = true;
        group.add(bldg);

        const crownW = w * 0.72;
        const crownD = d * 0.72;
        const crownH = isDowntown ? 7 + rand() * 8 : 3.2 + rand() * 2.5;
        const crown = new THREE.Mesh(
          new THREE.BoxGeometry(crownW, crownH, crownD),
          isDowntown ? facadeMaterials[facadeIdx] : roofMat
        );
        crown.position.set(cx, height + crownH * 0.5 + 0.22, cz);
        crown.castShadow = true;
        group.add(crown);

        // Rooftop neon trims + Street-level illuminated Neon Marquee Signs (Screenshots #3, #4, #6, #12!)
        if (isShopping || rand() > 0.35) {
          const neonMat = neonTrimMaterials[Math.floor(rand() * neonTrimMaterials.length)];
          const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.45, 0.55, d + 0.45), neonMat);
          trim.position.set(cx, height - 0.6, cz);
          group.add(trim);

          // Ground-floor glowing awning canopy & marquee sign facing the street
          const signMat = storefrontSignMaterials[Math.floor(rand() * storefrontSignMaterials.length)];
          const facingEast = ox > 0;
          const signBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.8, 11.5), signMat);
          signBox.position.set(cx + (facingEast ? w * 0.5 + 0.35 : -w * 0.5 - 0.35), 4.8, cz);
          group.add(signBox);

          // Glowing neon vertical blade sign
          const blade = new THREE.Mesh(new THREE.BoxGeometry(1.1, 7.5, 0.32), neonMat);
          blade.position.set(cx + (facingEast ? w * 0.5 + 0.8 : -w * 0.5 - 0.8), 8.2, cz + (oz > 0 ? 5 : -5));
          group.add(blade);
        }

        if (isDowntown && height > 65) {
          const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 16, 8), roofMat);
          spire.position.set(cx, height + crownH + 8, cz);
          group.add(spire);
        }

        buildings.push({
          minX: cx - w * 0.5,
          maxX: cx + w * 0.5,
          minZ: cz - d * 0.5,
          maxZ: cz + d * 0.5,
          height,
          district: districtName,
        });
      }
    }
  }

  // 6. COASTAL MOUNTAINS
  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x32404d,
    roughness: 0.94,
    metalness: 0.04,
    flatShading: true,
  });
  for (let i = 0; i < 16; i++) {
    const mz = -380 + i * 52 + (rand() - 0.5) * 20;
    const mx = -345 - rand() * 85;
    const mRad = 52 + rand() * 44;
    const mHeight = 68 + rand() * 88;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(mRad, mHeight, 7), mountainMat);
    peak.position.set(mx, mHeight * 0.46, mz);
    peak.rotation.y = rand() * Math.PI;
    group.add(peak);
  }

  // 7. EXPRESS HIGHWAY GANTRY ARCHES & GUARDRAILS (Screenshot #1)
  const gantrySignMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    emissive: 0x047857,
    emissiveIntensity: 0.75,
    roughness: 0.4,
  });
  for (const gz of [-150, -50, 50, 150]) {
    const gGroup = new THREE.Group();
    gGroup.position.set(-200, 0, gz);
    for (const sx of [-12.5, 12.5]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.5, 0.8), industrialSteelMat);
      leg.position.set(sx, 4.75, 0);
      gGroup.add(leg);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(25.8, 0.8, 0.8), industrialSteelMat);
    cross.position.set(0, 9.2, 0);
    gGroup.add(cross);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.4, 0.35), gantrySignMat);
    sign.position.set(0, 9.2, 0.3);
    gGroup.add(sign);
    group.add(gGroup);
  }

  // 8. OVERHEAD SUSPENDED TRAFFIC LIGHTS AT KEY INTERSECTIONS (Screenshots #7 & #9)
  const signalPoleMat = new THREE.MeshStandardMaterial({ color: 0x222732, metalness: 0.75, roughness: 0.35 });
  const redSignalMat = new THREE.MeshStandardMaterial({
    color: 0xff2233,
    emissive: 0xff1e2d,
    emissiveIntensity: 3.4,
  });
  const greenSignalMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 3.0,
  });
  for (const ix of [-100, 0, 100, 200]) {
    for (const iz of [-100, 0, 100]) {
      const sigGroup = new THREE.Group();
      sigGroup.position.set(ix, 0, iz);
      // Corner mast poles + overhead cable span
      for (const [px, pz] of [
        [-12, -12],
        [12, 12],
      ]) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 8.2, 6), signalPoleMat);
        mast.position.set(px, 4.1, pz);
        sigGroup.add(mast);
      }
      const wire = new THREE.Mesh(new THREE.BoxGeometry(33.5, 0.08, 0.08), signalPoleMat);
      wire.position.set(0, 7.8, 0);
      wire.rotation.y = Math.PI / 4;
      sigGroup.add(wire);

      // Suspended traffic signal box
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.85, 0.7), signalPoleMat);
      box.position.set(0, 7.1, 0);
      sigGroup.add(box);

      const activeMat = (ix + iz) % 200 === 0 ? redSignalMat : greenSignalMat;
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.76), activeMat);
      lens.position.set(0, 7.42, 0);
      sigGroup.add(lens);
      group.add(sigGroup);
    }
  }

  // 9. BAYSIDE STEEL-ARCH CAUSEWAY BRIDGE
  const bridgeGroup = new THREE.Group();
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(150, 0.85, 18), intersectionMat);
  bridgeDeck.position.set(286, 0.32, 0);
  bridgeDeck.receiveShadow = true;
  bridgeGroup.add(bridgeDeck);

  const bridgeArchMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.78, roughness: 0.25 });
  const archGlowMat = neonTrimMaterials[3];
  for (const bz of [-8.8, 8.8]) {
    const archCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(235, 0.8, bz),
      new THREE.Vector3(295, 22, bz),
      new THREE.Vector3(355, 0.8, bz)
    );
    const archMesh = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 22, 0.55, 8, false), bridgeArchMat);
    bridgeGroup.add(archMesh);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(148, 1.1, 0.5), bridgeArchMat);
    rail.position.set(286, 1.1, bz);
    bridgeGroup.add(rail);

    const railGlow = new THREE.Mesh(new THREE.BoxGeometry(146, 0.22, 0.56), archGlowMat);
    railGlow.position.set(286, 1.55, bz);
    bridgeGroup.add(railGlow);
  }
  group.add(bridgeGroup);

  // 10. Beachfront Lifeguard Huts
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x7c5a40, roughness: 0.85 });
  const hutColors = [0xff4d6d, 0x06d6a0, 0x38bdf8, 0xf59e0b];
  for (let i = 0; i < 4; i++) {
    const hz = -170 + i * 115;
    if (Math.abs(hz) < 28) continue;
    const hutGroup = new THREE.Group();
    hutGroup.position.set(255, 0, hz);
    const stilts = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3.2), pierMat);
    stilts.position.y = 1.1;
    hutGroup.add(stilts);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.4, 3.8),
      new THREE.MeshStandardMaterial({ color: hutColors[i], roughness: 0.5 })
    );
    cabin.position.y = 3.2;
    cabin.castShadow = true;
    hutGroup.add(cabin);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.3, 1.4, 4),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
    );
    roof.position.y = 5.1;
    roof.rotation.y = Math.PI / 4;
    hutGroup.add(roof);
    group.add(hutGroup);
  }

  // 11. Instanced Curved Palm Trees + Lush Roadside Hedge Planters (Screenshots #4, #8, #9)
  const palmPositions: { x: number; z: number; scale: number; rotY: number }[] = [];
  for (let z = -230; z <= 230; z += 18) {
    if (Math.abs(z % 100) < 18) continue;
    palmPositions.push({ x: 214, z, scale: 0.92 + rand() * 0.34, rotY: rand() * Math.PI * 2 });
    palmPositions.push({ x: 226, z: z + 7, scale: 0.88 + rand() * 0.35, rotY: rand() * Math.PI * 2 });
  }
  for (const x of ROAD_COORDS) {
    if (x === 200) continue;
    for (let z = -220; z <= 220; z += 32) {
      if (Math.abs(z % 100) < 18) continue;
      palmPositions.push({ x: x + 13.5, z, scale: 0.86 + rand() * 0.3, rotY: rand() * Math.PI * 2 });
      palmPositions.push({ x: x - 13.5, z: z + 14, scale: 0.86 + rand() * 0.3, rotY: rand() * Math.PI * 2 });
    }
  }
  for (let i = 0; i < 75; i++) {
    const px = i < 20 ? 120 + rand() * 60 : -260 + rand() * 500;
    const pz = i < 20 ? -185 + rand() * 60 : rand() > 0.5 ? 255 + rand() * 28 : -255 - rand() * 28;
    palmPositions.push({ x: px, z: pz, scale: 0.95 + rand() * 0.4, rotY: rand() * Math.PI * 2 });
  }

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.35, 3.2, 0.1),
    new THREE.Vector3(0.95, 6.4, 0.25),
    new THREE.Vector3(1.25, 9.2, 0.3),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 10, 0.26, 7, false);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5c43, roughness: 0.92, metalness: 0.02 });
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, palmPositions.length);
  trunkInst.castShadow = true;

  const frondShape = new THREE.Shape();
  frondShape.moveTo(0, 0);
  frondShape.quadraticCurveTo(1.6, 0.55, 3.8, -0.45);
  frondShape.quadraticCurveTo(1.8, -0.05, 0, -0.2);
  const frondGeo = new THREE.ShapeGeometry(frondShape, 5);
  frondGeo.rotateX(0.32);

  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x2d8a4e,
    roughness: 0.72,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const FRONDS_PER_PALM = 7;
  const frondInst = new THREE.InstancedMesh(frondGeo, frondMat, palmPositions.length * FRONDS_PER_PALM);
  frondInst.castShadow = true;

  const dummy = new THREE.Object3D();
  const tintColor = new THREE.Color();
  let fIdx = 0;

  palmPositions.forEach((p, idx) => {
    dummy.position.set(p.x, 0, p.z);
    dummy.rotation.set(0, p.rotY, 0);
    dummy.scale.set(p.scale, p.scale, p.scale);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    const cosR = Math.cos(p.rotY);
    const sinR = Math.sin(p.rotY);
    const tipX = p.x + (1.25 * cosR + 0.3 * sinR) * p.scale;
    const tipZ = p.z + (-1.25 * sinR + 0.3 * cosR) * p.scale;
    const tipY = 9.15 * p.scale;

    for (let f = 0; f < FRONDS_PER_PALM; f++) {
      dummy.position.set(tipX, tipY, tipZ);
      dummy.rotation.set(
        (rand() - 0.5) * 0.25,
        p.rotY + (f / FRONDS_PER_PALM) * Math.PI * 2,
        -0.18 - rand() * 0.22
      );
      const fs = p.scale * (0.9 + rand() * 0.25);
      dummy.scale.set(fs, fs, fs);
      dummy.updateMatrix();
      frondInst.setMatrixAt(fIdx, dummy.matrix);

      tintColor.setHSL(0.36 + (rand() - 0.5) * 0.06, 0.52, 0.3 + rand() * 0.14);
      frondInst.setColorAt(fIdx, tintColor);
      fIdx++;
    }
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  frondInst.instanceMatrix.needsUpdate = true;
  if (frondInst.instanceColor) frondInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  frondInst.computeBoundingSphere();
  group.add(trunkInst, frondInst);

  // Roadside manicured tropical hedges (Screenshots #4, #8, #9)
  const hedgeCoords: { x: number; z: number }[] = [];
  for (const x of [-100, 0, 100, 200]) {
    for (let z = -180; z <= 180; z += 28) {
      if (Math.abs(z % 100) < 20) continue;
      hedgeCoords.push({ x: x + 12.8, z });
      hedgeCoords.push({ x: x - 12.8, z });
    }
  }
  const hedgeGeo = new THREE.BoxGeometry(1.1, 0.85, 8.5);
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x266337, roughness: 0.88 });
  const hedgeInst = new THREE.InstancedMesh(hedgeGeo, hedgeMat, hedgeCoords.length);
  hedgeCoords.forEach((h, i) => {
    dummy.position.set(h.x, 0.52, h.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 0.9 + (i % 3) * 0.12, 1);
    dummy.updateMatrix();
    hedgeInst.setMatrixAt(i, dummy.matrix);
  });
  hedgeInst.instanceMatrix.needsUpdate = true;
  hedgeInst.computeBoundingSphere();
  group.add(hedgeInst);

  // 12. Instanced Streetlamps
  const lampCoords: { x: number; z: number; rotY: number }[] = [];
  for (const x of ROAD_COORDS) {
    for (let z = -220; z <= 220; z += 40) {
      if (Math.abs(z % 100) < 16) continue;
      lampCoords.push({ x: x - 12.2, z, rotY: 0 });
      lampCoords.push({ x: x + 12.2, z: z + 20, rotY: Math.PI });
    }
  }
  const poleGeo = new THREE.CylinderGeometry(0.11, 0.16, 7.6, 8);
  poleGeo.translate(0, 3.8, 0);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a3140, metalness: 0.72, roughness: 0.35 });
  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, lampCoords.length);

  const bulbGeo = new THREE.BoxGeometry(1.4, 0.22, 0.45);
  bulbGeo.translate(0.7, 7.55, 0);
  const streetLampMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe4b5,
    emissive: 0xffb766,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
  const bulbInst = new THREE.InstancedMesh(bulbGeo, streetLampMaterial, lampCoords.length);

  lampCoords.forEach((l, i) => {
    dummy.position.set(l.x, 0, l.z);
    dummy.rotation.set(0, l.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    bulbInst.setMatrixAt(i, dummy.matrix);
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  bulbInst.computeBoundingSphere();
  group.add(poleInst, bulbInst);

  // 13. High-Altitude Coastal Airliner + Twin Contrails (Screenshot #1 signature sky detail!)
  const jetGroup = new THREE.Group();
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.6, roughness: 0.3 });
  const jetFuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 9.5, 8), jetMat);
  jetFuselage.rotation.x = Math.PI / 2;
  const jetWings = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.18, 2.2), jetMat);
  const jetTail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 1.6), jetMat);
  jetTail.position.set(0, 1.1, -4.1);
  const contrailMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const trailL = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 95), contrailMat);
  trailL.rotation.x = -Math.PI / 2;
  trailL.position.set(-1.6, 0, -52);
  const trailR = trailL.clone();
  trailR.position.set(1.6, 0, -52);
  jetGroup.add(jetFuselage, jetWings, jetTail, trailL, trailR);
  jetGroup.position.set(80, 145, -180);
  jetGroup.rotation.y = -0.38;
  group.add(jetGroup);

  // 14. Stunt Jump Ramps
  const rampSpecs: JumpRamp[] = [
    { x: 200, z: -42, rotY: 0, width: 7.4, length: 14, height: 3.2 },
    { x: 100, z: 150, rotY: Math.PI / 2, width: 8.6, length: 15, height: 3.5 },
    { x: 0, z: -48, rotY: 0, width: 7.4, length: 14, height: 3.3 },
    { x: -100, z: 52, rotY: 0, width: 7.4, length: 14, height: 3.3 },
    { x: 100, z: -150, rotY: 0, width: 7.4, length: 14, height: 3.2 },
    { x: 335, z: 0, rotY: -Math.PI / 2, width: 7.6, length: 14, height: 3.4 },
    { x: 245, z: -85, rotY: 0, width: 8.2, length: 15, height: 3.6 },
  ];

  const rampMat = new THREE.MeshStandardMaterial({ map: textures.rampAlbedo, roughness: 0.45, metalness: 0.35 });
  const rampSideMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.65,
    roughness: 0.35,
  });

  for (const r of rampSpecs) {
    ramps.push(r);
    const wedgeShape = new THREE.Shape();
    wedgeShape.moveTo(-r.length * 0.5, 0);
    wedgeShape.lineTo(r.length * 0.5, 0);
    wedgeShape.lineTo(r.length * 0.5, r.height);
    wedgeShape.closePath();

    const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: r.width, bevelEnabled: false });
    wedgeGeo.translate(0, 0, -r.width * 0.5);
    wedgeGeo.rotateY(-Math.PI / 2);

    const rampGroup = new THREE.Group();
    rampGroup.position.set(r.x, 0.05, r.z);
    rampGroup.rotation.y = r.rotY;

    const baseWedge = new THREE.Mesh(wedgeGeo, rampSideMat);
    baseWedge.castShadow = true;
    baseWedge.receiveShadow = true;
    rampGroup.add(baseWedge);

    const slopeLen = Math.hypot(r.length, r.height);
    const slopeAngle = Math.atan2(r.height, r.length);
    const deckGeo = new THREE.PlaneGeometry(r.width - 0.1, slopeLen);
    deckGeo.rotateX(-Math.PI / 2 + slopeAngle);
    const deck = new THREE.Mesh(deckGeo, rampMat);
    deck.position.set(0, r.height * 0.5 + 0.04, 0);
    rampGroup.add(deck);
    group.add(rampGroup);
  }

  // 15. Pay'n'Spray Repair Arches
  const repairCoords = [
    { id: 'rep-ocean', x: 200, z: 50, rotY: 0 },
    { id: 'rep-downtown', x: -100, z: -50, rotY: 0 },
    { id: 'rep-airport', x: 50, z: 100, rotY: Math.PI / 2 },
    { id: 'rep-highway', x: -200, z: 100, rotY: 0 },
  ];
  const archPillarMat = new THREE.MeshStandardMaterial({ color: 0x161b26, metalness: 0.7, roughness: 0.3 });

  for (const rc of repairCoords) {
    repairs.push({ id: rc.id, x: rc.x, z: rc.z, rotY: rc.rotY, radius: 7.2, cooldown: 0 });
    const archGroup = new THREE.Group();
    archGroup.position.set(rc.x, 0, rc.z);
    archGroup.rotation.y = rc.rotY;

    for (const sx of [-5.2, 5.2]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.6, 1.2), archPillarMat);
      pillar.position.set(sx, 2.8, 0);
      pillar.castShadow = true;
      archGroup.add(pillar);
    }
    const header = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.9, 1.4), archPillarMat);
    header.position.set(0, 5.6, 0);
    archGroup.add(header);

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });
    const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.35, 1.52), glowMat);
    neonStrip.position.set(0, 5.3, 0);
    archGroup.add(neonStrip);

    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 4.6, 28),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = 0.09;
    archGroup.add(padRing);
    repairRings.set(rc.id, padRing);
    group.add(archGroup);
  }

  // 16. Cash & Nitro Pickups
  const pickupSpecs: { x: number; z: number; type: 'cash' | 'nitro' }[] = [
    { x: 200, z: -150, type: 'nitro' },
    { x: 295, z: 0, type: 'cash' },
    { x: 140, z: 150, type: 'nitro' },
    { x: 250, z: -140, type: 'cash' },
    { x: 100, z: 50, type: 'nitro' },
    { x: 0, z: 50, type: 'cash' },
    { x: 0, z: -150, type: 'nitro' },
    { x: -100, z: 150, type: 'cash' },
    { x: -100, z: -150, type: 'nitro' },
    { x: -200, z: 0, type: 'cash' },
    { x: -200, z: -100, type: 'nitro' },
    { x: 50, z: 50, type: 'cash' },
  ];

  const cashGeo = new THREE.OctahedronGeometry(1.05, 0);
  const cashMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.6,
    metalness: 0.85,
    roughness: 0.15,
  });
  const nitroGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.8, 12);
  const nitroMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.2,
    metalness: 0.7,
    roughness: 0.18,
  });

  pickupSpecs.forEach((ps, idx) => {
    const id = `pk-${idx}`;
    pickups.push({ id, x: ps.x, z: ps.z, type: ps.type, active: true, respawnTimer: 0 });
    const pGroup = new THREE.Group();
    pGroup.position.set(ps.x, 1.45, ps.z);
    const core = new THREE.Mesh(
      ps.type === 'cash' ? cashGeo : nitroGeo,
      ps.type === 'cash' ? cashMat : nitroMat
    );
    if (ps.type === 'nitro') core.rotation.z = 0.35;
    pGroup.add(core);
    group.add(pGroup);
    pickupMeshes.set(id, pGroup);
  });

  // 17. Original Solara State & Redrock County 3D Landmarks
  // A. Mirage Sea Inland Saltwater Lake & Redrock Desert Mesas (North)
  const desertFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(360, 145),
    new THREE.MeshStandardMaterial({ color: 0x9c7648, roughness: 0.94, metalness: 0.02 })
  );
  desertFloor.rotation.x = -Math.PI / 2;
  desertFloor.position.set(20, 0.02, -255);
  group.add(desertFloor);

  const mirageSea = new THREE.Mesh(
    new THREE.CircleGeometry(52, 28),
    new THREE.MeshPhysicalMaterial({
      color: 0x0ea5a8,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 1.0,
    })
  );
  mirageSea.rotation.x = -Math.PI / 2;
  mirageSea.scale.set(1.8, 0.85, 1);
  mirageSea.position.set(45, 0.06, -242);
  group.add(mirageSea);

  const mesaMat = new THREE.MeshStandardMaterial({ color: 0x8f5534, roughness: 0.92 });
  for (const [mx, mz, mr, mh] of [
    [-85, -275, 28, 36],
    [145, -278, 32, 42],
    [35, -315, 44, 54],
  ]) {
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(mr * 0.62, mr, mh, 7), mesaMat);
    mesa.position.set(mx, mh * 0.5, mz);
    group.add(mesa);
  }

  // B. Fort Vespera Restricted Military Airbase (Northwest: radar dome, hangars & red beacons)
  const milConcreteMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.86 });
  const fortTarmac = new THREE.Mesh(new THREE.PlaneGeometry(78, 64), milConcreteMat);
  fortTarmac.rotation.x = -Math.PI / 2;
  fortTarmac.position.set(-155, 0.04, -155);
  group.add(fortTarmac);

  const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 16, 10), milConcreteMat);
  radarBase.position.set(-178, 8, -172);
  group.add(radarBase);
  const radarDome = new THREE.Mesh(
    new THREE.SphereGeometry(4.8, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
  );
  radarDome.position.set(-178, 18.5, -172);
  group.add(radarDome);

  const redBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xff2244,
    emissive: 0xff1133,
    emissiveIntensity: 4.0,
  });
  for (const [bx, bz] of [
    [-190, -125],
    [-120, -125],
    [-190, -185],
    [-120, -185],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 6.5, 8), milConcreteMat);
    post.position.set(bx, 3.25, bz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), redBeaconMat);
    bulb.position.set(bx, 6.8, bz);
    group.add(post, bulb);
  }

  // C. Port Meridian Industrial Container Cranes (Southwest Harbor)
  const craneRedMat = new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.45, metalness: 0.5 });
  const containerBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.55 });
  const containerAmberMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
  for (const cx of [-78, -32]) {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 24, 1.4), craneRedMat);
    legL.position.set(cx - 5, 12, 224);
    const legR = legL.clone();
    legR.position.x = cx + 5;
    const boom = new THREE.Mesh(new THREE.BoxGeometry(14, 1.8, 22), craneRedMat);
    boom.position.set(cx, 23.5, 228);
    group.add(legL, legR, boom);

    const box1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.0, 9.2), containerBlueMat);
    box1.position.set(cx, 1.5, 212);
    const box2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.0, 9.2), containerAmberMat);
    box2.position.set(cx + 3.6, 1.5, 212);
    group.add(box1, box2);
  }

  // D. Neon Cay Coastal Lighthouse with Rotating Warm Beam (Southeast Point)
  const lhGroup = new THREE.Group();
  lhGroup.position.set(275, 0, 178);
  const lhTowerWhite = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.8, 28, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  lhTowerWhite.position.y = 14;
  const lhStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(2.75, 3.25, 7, 16),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
  );
  lhStripe.position.y = 16;
  const lhLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.9, 3.4, 14),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 4.5,
    })
  );
  lhLantern.position.y = 29.5;
  const lhBeamPivot = new THREE.Group();
  lhBeamPivot.position.y = 29.5;
  const lhBeamGeo = new THREE.ConeGeometry(8.5, 75, 14, 1, true);
  lhBeamGeo.translate(0, -37.5, 0);
  lhBeamGeo.rotateX(Math.PI / 2);
  const lhBeamMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lhBeam = new THREE.Mesh(lhBeamGeo, lhBeamMat);
  lhBeamPivot.add(lhBeam);
  lhGroup.add(lhTowerWhite, lhStripe, lhLantern, lhBeamPivot);
  group.add(lhGroup);

  const setEmissiveScale = (scale: number) => {
    for (const m of emissiveMaterials) m.emissiveIntensity = scale;
    for (const n of neonTrimMaterials) n.emissiveIntensity = Math.max(0.55, scale * 2.1);
    for (const s of storefrontSignMaterials) s.emissiveIntensity = Math.max(0.45, scale * 1.65);
    streetLampMaterial.emissiveIntensity = scale > 0.35 ? scale * 2.3 : 0.15;
  };

  const setRoadWetness = (wetness01: number, nightFactor: number) => {
    const w = THREE.MathUtils.clamp(wetness01, 0, 1);
    for (const rm of roadMaterials) {
      rm.roughness = THREE.MathUtils.lerp(0.58, 0.11, w);
      rm.metalness = THREE.MathUtils.lerp(0.14, 0.46, w);
      rm.clearcoat = THREE.MathUtils.lerp(0.22, 1.0, w);
      rm.clearcoatRoughness = THREE.MathUtils.lerp(0.25, 0.04, w);
    }
    const neonReflectionOpacity = w * (0.04 + nightFactor * 0.24);
    for (const pm of wetNeonPoolMats) {
      pm.opacity = neonReflectionOpacity;
    }
  };

  const updateAmbientProps = (elapsed: number, nightFactor: number) => {
    const loopT = (elapsed * 0.014) % 1;
    jetGroup.position.set(220 - loopT * 520, 145, -240 + loopT * 420);
    jetGroup.visible = nightFactor < 0.72;

    // Rotating Neon Cay Lighthouse beam
    lhBeamPivot.rotation.y = elapsed * 0.65;
    lhBeamMat.opacity = 0.05 + nightFactor * 0.22;
    redBeaconMat.emissiveIntensity = 2.0 + Math.abs(Math.sin(elapsed * 4.5)) * 4.5;
  };

  const getDistrictMeta = (x: number, z: number): DistrictMarker => {
    if (x > 240 && Math.abs(z) < 28) return WORLD_DISTRICTS[8]; // Emerald Bay Causeway
    if (x > 195) return WORLD_DISTRICTS[7]; // Neon Cay & Lighthouse Pt
    if (x > 40 && z > 130) return WORLD_DISTRICTS[6]; // Solara Intl Airport (Restricted 3★)
    if (x <= 40 && x > -115 && z > 135) return WORLD_DISTRICTS[5]; // Port Meridian Docks
    if (x < -115 && z < -105) return WORLD_DISTRICTS[1]; // Fort Vespera Airbase (Restricted 4★)
    if (z < -130) return WORLD_DISTRICTS[0]; // Redrock Badlands & Mirage Sea
    if (x < -195) return WORLD_DISTRICTS[9]; // Mt. Calavera Ridge
    if (x < -95 && z >= 60) return WORLD_DISTRICTS[3]; // Coral Cove Boardwalk
    if (x < -95) return WORLD_DISTRICTS[2]; // Verona Hills & Estates
    return WORLD_DISTRICTS[4]; // Solara Metropolis Core
  };

  const getDistrictName = (x: number, z: number): string => getDistrictMeta(x, z).name;

  return {
    group,
    buildings,
    ramps,
    repairs,
    pickups,
    pickupMeshes,
    repairRings,
    emissiveMaterials,
    neonTrimMaterials,
    roadMaterials,
    streetLampMaterial,
    setEmissiveScale,
    setRoadWetness,
    updateAmbientProps,
    getDistrictName,
    getDistrictMeta,
  };
}

import * as THREE from 'three';

type ParticleKind = 'smoke' | 'spark' | 'nitro';

interface ParticleSlot {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  maxAge: number;
  startScale: number;
  endScale: number;
  color: THREE.Color;
}

const MAX_PARTICLES = 320;

// Reusable scratch math objects (zero GC in loop)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export class ParticleSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly slots: ParticleSlot[] = [];
  private cursor = 0;

  constructor() {
    const geo = new THREE.DodecahedronGeometry(0.28, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.slots.push({
        active: false,
        kind: 'smoke',
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        maxAge: 1,
        startScale: 0.1,
        endScale: 0.1,
        color: new THREE.Color(0xffffff),
      });
      _dummy.position.set(0, -100, 0);
      _dummy.scale.set(0.001, 0.001, 0.001);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private alloc(): ParticleSlot {
    const slot = this.slots[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    return slot;
  }

  public emitSmoke(x: number, y: number, z: number, vx: number, vz: number): void {
    const p = this.alloc();
    p.active = true;
    p.kind = 'smoke';
    p.x = x + (Math.random() - 0.5) * 0.35;
    p.y = y + 0.12;
    p.z = z + (Math.random() - 0.5) * 0.35;
    p.vx = vx * 0.25 + (Math.random() - 0.5) * 1.4;
    p.vy = 0.8 + Math.random() * 1.1;
    p.vz = vz * 0.25 + (Math.random() - 0.5) * 1.4;
    p.age = 0;
    p.maxAge = 0.45 + Math.random() * 0.28;
    p.startScale = 0.55;
    p.endScale = 2.1;
    p.color.setHex(0xd8dde8);
  }

  public emitNitro(x: number, y: number, z: number, vx: number, vz: number): void {
    const p = this.alloc();
    p.active = true;
    p.kind = 'nitro';
    p.x = x + (Math.random() - 0.5) * 0.16;
    p.y = y;
    p.z = z + (Math.random() - 0.5) * 0.16;
    p.vx = vx + (Math.random() - 0.5) * 0.8;
    p.vy = (Math.random() - 0.3) * 0.6;
    p.vz = vz + (Math.random() - 0.5) * 0.8;
    p.age = 0;
    p.maxAge = 0.16 + Math.random() * 0.12;
    p.startScale = 0.72;
    p.endScale = 0.12;
    p.color.setHex(Math.random() > 0.35 ? 0x38bdf8 : 0xf472b6);
  }

  public emitSparks(x: number, y: number, z: number, count = 16, intense = false): void {
    for (let i = 0; i < count; i++) {
      const p = this.alloc();
      p.active = true;
      p.kind = 'spark';
      p.x = x + (Math.random() - 0.5) * 0.6;
      p.y = y + 0.4 + Math.random() * 0.5;
      p.z = z + (Math.random() - 0.5) * 0.6;
      const angle = Math.random() * Math.PI * 2;
      const spd = (intense ? 9 : 5) + Math.random() * (intense ? 14 : 9);
      p.vx = Math.cos(angle) * spd;
      p.vy = 3.5 + Math.random() * (intense ? 9.5 : 5.5);
      p.vz = Math.sin(angle) * spd;
      p.age = 0;
      p.maxAge = 0.35 + Math.random() * 0.35;
      p.startScale = intense ? 0.65 : 0.42;
      p.endScale = 0.05;
      p.color.setHex(Math.random() > 0.4 ? 0xffbe0b : 0xff5a36);
    }
  }

  public update(dt: number): void {
    let dirty = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.slots[i];
      if (!p.active) continue;
      dirty = true;

      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        _dummy.position.set(0, -100, 0);
        _dummy.scale.set(0.001, 0.001, 0.001);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      const t = p.age / p.maxAge;
      if (p.kind === 'spark') {
        p.vy -= 22 * dt;
      } else if (p.kind === 'smoke') {
        p.vx *= 1 - Math.min(1, dt * 2.5);
        p.vz *= 1 - Math.min(1, dt * 2.5);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.08 && p.kind === 'spark') {
        p.y = 0.08;
        p.vy *= -0.45;
      }

      const s = THREE.MathUtils.lerp(p.startScale, p.endScale, t);
      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.age * 4, p.age * 3, 0);
      _dummy.scale.set(s, s, s);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);

      // Fade color intensity slightly toward end of life
      const fade = 1 - t * 0.55;
      _color.copy(p.color).multiplyScalar(fade);
      this.mesh.setColorAt(i, _color);
    }

    if (dirty) {
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

import * as THREE from 'three';

export interface ProceduralTextureSet {
  roadAlbedo: THREE.CanvasTexture;
  roadRoughness: THREE.CanvasTexture;
  intersectionAlbedo: THREE.CanvasTexture;
  sidewalkAlbedo: THREE.CanvasTexture;
  sandAlbedo: THREE.CanvasTexture;
  rampAlbedo: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  raindropGlass: THREE.CanvasTexture;
  neonSignTextures: THREE.CanvasTexture[];
  buildingFacades: {
    albedo: THREE.CanvasTexture;
    emissive: THREE.CanvasTexture;
    roughness: number;
    metalness: number;
  }[];
  dispose: () => void;
}

function configureTexture(
  tex: THREE.CanvasTexture,
  maxAnisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createRoadTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  // Rich dark coastal asphalt base
  ctx.fillStyle = '#1b1e25';
  ctx.fillRect(0, 0, size, size);

  // Fine asphalt aggregate grain
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 22 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Realistic darker tire-wear tracks along all 4 lanes
  const lanes = [88, 184, 328, 424];
  ctx.fillStyle = 'rgba(8, 10, 14, 0.4)';
  for (const lx of lanes) {
    ctx.fillRect(lx - 20, 0, 40, size);
  }

  // Crisp edge solid white lines + red/white shoulder rumble dashes
  ctx.fillStyle = '#edf2f7';
  ctx.fillRect(20, 0, 7, size);
  ctx.fillRect(size - 27, 0, 7, size);

  // Double amber center divider
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(size / 2 - 10, 0, 6, size);
  ctx.fillRect(size / 2 + 4, 0, 6, size);

  // Dashed lane separators
  ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
  for (let y = 16; y < size; y += 64) {
    ctx.fillRect(size * 0.27, y, 5, 34);
    ctx.fillRect(size * 0.73 - 5, y, 5, 34);
  }

  // Painted highway speed stencil ("60") inspired by coastal highway reference
  ctx.save();
  ctx.fillStyle = 'rgba(235, 240, 248, 0.52)';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('60', 376, 175);
  ctx.translate(136, 355);
  ctx.rotate(Math.PI);
  ctx.fillText('60', 0, 0);
  ctx.restore();

  // High-contrast puddle roughness map (near-black puddles = mirror reflections!)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;
  rctx.fillStyle = '#b4b4b4';
  rctx.fillRect(0, 0, size, size);

  // Crisp organic reflective water puddles
  for (let i = 0; i < 18; i++) {
    const px = 45 + Math.random() * (size - 90);
    const py = Math.random() * size;
    const rx = 28 + Math.random() * 58;
    const ry = 42 + Math.random() * 90;
    rctx.save();
    rctx.translate(px, py);
    rctx.scale(1, ry / rx);
    const grad = rctx.createRadialGradient(0, 0, 4, 0, 0, rx);
    grad.addColorStop(0, 'rgba(12, 12, 12, 0.92)');
    grad.addColorStop(0.65, 'rgba(28, 28, 28, 0.65)');
    grad.addColorStop(1, 'rgba(180, 180, 180, 0)');
    rctx.fillStyle = grad;
    rctx.beginPath();
    rctx.arc(0, 0, rx, 0, Math.PI * 2);
    rctx.fill();
    rctx.restore();
  }

  const albedo = configureTexture(new THREE.CanvasTexture(albedoCanvas), maxAnisotropy, true);
  const roughness = configureTexture(new THREE.CanvasTexture(roughCanvas), maxAnisotropy, false);
  return { albedo, roughness };
}

function createIntersectionTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c2028';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 14000; i++) {
    const v = 22 + Math.floor(Math.random() * 22);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  // Zebra crosswalk bars on all 4 sides of every intersection
  ctx.fillStyle = 'rgba(238, 242, 248, 0.82)';
  const stripeW = 16;
  const stripeGap = 16;
  const barLen = 42;
  for (let p = 52; p < size - 52; p += stripeW + stripeGap) {
    ctx.fillRect(p, 10, stripeW, barLen);
    ctx.fillRect(p, size - 10 - barLen, stripeW, barLen);
    ctx.fillRect(10, p, barLen, stripeW);
    ctx.fillRect(size - 10 - barLen, p, barLen, stripeW);
  }

  // Stop lines
  ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
  ctx.fillRect(46, 62, size - 92, 6);
  ctx.fillRect(46, size - 68, size - 92, 6);
  ctx.fillRect(62, 46, 6, size - 92);
  ctx.fillRect(size - 68, 46, 6, size - 92);

  return configureTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, true, 1, 1);
}

function createSidewalkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c5bdb0';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3500; i++) {
    const delta = Math.floor(Math.random() * 18) - 9;
    ctx.fillStyle = `rgb(${197 + delta}, ${189 + delta}, ${176 + delta})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  ctx.strokeStyle = 'rgba(70, 64, 58, 0.34)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  return configureTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, true, 6, 6);
}

function createSandTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e7cfa9';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 6) {
    const alpha = 0.04 + 0.03 * Math.sin(y * 0.12);
    ctx.fillStyle = `rgba(176, 134, 84, ${alpha})`;
    ctx.fillRect(0, y, size, 3);
  }

  for (let i = 0; i < 14000; i++) {
    const bright = Math.random() > 0.5 ? 245 : 210;
    ctx.fillStyle = `rgba(${bright}, ${bright - 24}, ${bright - 58}, 0.45)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  return configureTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, true, 12, 48);
}

function createRampTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b202b';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 18, h);
  ctx.fillRect(w - 18, 0, 18, h);

  ctx.strokeStyle = '#ffbe0b';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let y = 70; y < h; y += 95) {
    ctx.beginPath();
    ctx.moveTo(46, y + 36);
    ctx.lineTo(w / 2, y - 14);
    ctx.lineTo(w - 46, y + 36);
    ctx.stroke();
  }

  return configureTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, true);
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(3, 5, 10, 0.9)');
  grad.addColorStop(0.55, 'rgba(3, 5, 10, 0.58)');
  grad.addColorStop(0.85, 'rgba(3, 5, 10, 0.16)');
  grad.addColorStop(1, 'rgba(3, 5, 10, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createRaindropGlassTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < 110; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1.6 + Math.random() * 4.2;
    const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 0.4, x, y, r);
    grad.addColorStop(0, 'rgba(230, 246, 255, 0.85)');
    grad.addColorStop(0.65, 'rgba(140, 195, 240, 0.28)');
    grad.addColorStop(1, 'rgba(140, 195, 240, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.72, r * 1.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createNeonStorefrontSign(
  title: string,
  subtitle: string,
  bgHex: string,
  borderHex: string,
  textHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  ctx.fillStyle = textHex;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, h * 0.42);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 22px sans-serif';
  ctx.fillText(subtitle, w / 2, h * 0.78);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

interface FacadeStyle {
  baseColor: string;
  trimColor: string;
  windowDark: string;
  litColors: string[];
  cols: number;
  rows: number;
  glassTower: boolean;
  roughness: number;
  metalness: number;
}

function createBuildingFacade(
  style: FacadeStyle,
  maxAnisotropy: number
): { albedo: THREE.CanvasTexture; emissive: THREE.CanvasTexture; roughness: number; metalness: number } {
  const w = 512;
  const h = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d')!;

  const emCanvas = document.createElement('canvas');
  emCanvas.width = w;
  emCanvas.height = h;
  const ectx = emCanvas.getContext('2d')!;

  ctx.fillStyle = style.baseColor;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  const padX = style.glassTower ? 8 : 16;
  const padY = style.glassTower ? 10 : 18;
  const cellW = w / style.cols;
  const cellH = h / style.rows;

  ctx.fillStyle = style.trimColor;
  for (let r = 0; r < style.rows; r++) {
    ctx.fillRect(0, r * cellH, w, style.glassTower ? 4 : 7);
  }

  let seed = style.cols * 97 + style.rows * 31 + style.baseColor.charCodeAt(1) * 13;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let r = 0; r < style.rows; r++) {
    for (let c = 0; c < style.cols; c++) {
      const wx = c * cellW + padX * 0.5;
      const wy = r * cellH + padY * 0.65;
      const ww = cellW - padX;
      const wh = cellH - padY;

      const lit = rand() < (style.glassTower ? 0.38 : 0.46);
      if (lit) {
        const litColor = style.litColors[Math.floor(rand() * style.litColors.length)];
        const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        grad.addColorStop(0, litColor);
        grad.addColorStop(1, '#3b2e35');
        ctx.fillStyle = grad;
        ctx.fillRect(wx, wy, ww, wh);

        ectx.fillStyle = litColor;
        ectx.fillRect(wx + 1, wy + 1, ww - 2, wh - 2);
      } else {
        const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        grad.addColorStop(0, style.windowDark);
        grad.addColorStop(1, '#111827');
        ctx.fillStyle = grad;
        ctx.fillRect(wx, wy, ww, wh);
      }

      if (!style.glassTower) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(wx + ww * 0.5 - 1, wy, 2, wh);
      }
    }
  }

  const albedo = configureTexture(new THREE.CanvasTexture(albedoCanvas), maxAnisotropy, true);
  const emissive = configureTexture(new THREE.CanvasTexture(emCanvas), maxAnisotropy, true);

  return {
    albedo,
    emissive,
    roughness: style.roughness,
    metalness: style.metalness,
  };
}

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const road = createRoadTextures(maxAniso);
  const intersectionAlbedo = createIntersectionTexture(maxAniso);
  const sidewalkAlbedo = createSidewalkTexture(maxAniso);
  const sandAlbedo = createSandTexture(maxAniso);
  const rampAlbedo = createRampTexture(maxAniso);
  const contactShadow = createContactShadowTexture();
  const raindropGlass = createRaindropGlassTexture();

  const neonSignTextures = [
    createNeonStorefrontSign('MALIBU CLUB', 'OCEAN DRIVE NIGHTS', '#1f0828', '#ec4899', '#f472b6', maxAniso),
    createNeonStorefrontSign('HOTEL DIXON', 'LUXURY SUITES', '#0c1830', '#38bdf8', '#7dd3fc', maxAniso),
    createNeonStorefrontSign('PALM PLAZA', 'CAFE & LOUNGE', '#231407', '#f59e0b', '#fcd34d', maxAniso),
    createNeonStorefrontSign('VICE ARCADE', 'OPEN 24 HOURS', '#07221d', '#10b981', '#6ee7b7', maxAniso),
    createNeonStorefrontSign('SOLAR MOTOR', 'CUSTOM TUNING', '#1e1033', '#a855f7', '#e9d5ff', maxAniso),
  ];

  const facadeStyles: FacadeStyle[] = [
    {
      baseColor: '#f0ddd1',
      trimColor: '#ff7b89',
      windowDark: '#1c2b3a',
      litColors: ['#ffd699', '#ff9ecd', '#ffe8b6'],
      cols: 6,
      rows: 7,
      glassTower: false,
      roughness: 0.6,
      metalness: 0.08,
    },
    {
      baseColor: '#d7f0eb',
      trimColor: '#2ec4b6',
      windowDark: '#172a36',
      litColors: ['#ffe2a8', '#72efdd', '#ffd1a3'],
      cols: 5,
      rows: 6,
      glassTower: false,
      roughness: 0.56,
      metalness: 0.1,
    },
    {
      baseColor: '#f6d5c3',
      trimColor: '#f4a261',
      windowDark: '#21263a',
      litColors: ['#ffdca2', '#ffb5a7', '#ffecc7'],
      cols: 6,
      rows: 8,
      glassTower: false,
      roughness: 0.62,
      metalness: 0.06,
    },
    {
      baseColor: '#1a2738',
      trimColor: '#364f6b',
      windowDark: '#0f2036',
      litColors: ['#ffe4b5', '#90e0ef', '#ffd8a8'],
      cols: 8,
      rows: 10,
      glassTower: true,
      roughness: 0.16,
      metalness: 0.82,
    },
    {
      baseColor: '#191b24',
      trimColor: '#5c5346',
      windowDark: '#141926',
      litColors: ['#ffcf86', '#f4b9b8', '#fff0cc'],
      cols: 8,
      rows: 12,
      glassTower: true,
      roughness: 0.15,
      metalness: 0.86,
    },
    {
      baseColor: '#e5e7eb',
      trimColor: '#94a3b8',
      windowDark: '#1e293b',
      litColors: ['#fde68a', '#bae6fd', '#fed7aa'],
      cols: 7,
      rows: 9,
      glassTower: false,
      roughness: 0.4,
      metalness: 0.28,
    },
  ];

  const buildingFacades = facadeStyles.map((s) => createBuildingFacade(s, maxAniso));

  return {
    roadAlbedo: road.albedo,
    roadRoughness: road.roughness,
    intersectionAlbedo,
    sidewalkAlbedo,
    sandAlbedo,
    rampAlbedo,
    contactShadow,
    raindropGlass,
    neonSignTextures,
    buildingFacades,
    dispose: () => {
      road.albedo.dispose();
      road.roughness.dispose();
      intersectionAlbedo.dispose();
      sidewalkAlbedo.dispose();
      sandAlbedo.dispose();
      rampAlbedo.dispose();
      contactShadow.dispose();
      raindropGlass.dispose();
      for (const s of neonSignTextures) s.dispose();
      for (const f of buildingFacades) {
        f.albedo.dispose();
        f.emissive.dispose();
      }
    },
  };
}

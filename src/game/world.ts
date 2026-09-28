import * as THREE from 'three';
import { StageInfo } from '../types/game';

export interface PlatformBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  mesh: THREE.Mesh;
  isHazard?: boolean;
  isBouncePad?: boolean;
  isFinish?: boolean;
  isCheckpoint?: boolean;
  checkpointId?: number;
  stageId?: number;
  slideHazard?: boolean;
}

export interface MovingHazard {
  mesh: THREE.Mesh;
  axis: 'x' | 'y' | 'z' | 'rotY';
  speed: number;
  center: THREE.Vector3;
  radius: number;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export const STAGES_DATA: StageInfo[] = [
  { id: 1, name: 'Roblox Warmup', subtitle: 'Plataformas amplas de salto', difficulty: 'Fácil', checkpointsCount: 1, color: '#38bdf8' },
  { id: 2, name: 'Truss & Vigas Espaçosas', subtitle: 'Equilíbrio e passadiços confortáveis', difficulty: 'Fácil', checkpointsCount: 1, color: '#4ade80' },
  { id: 3, name: 'Arena Lasers & Spinners', subtitle: 'Arena ampla com lava rotativa', difficulty: 'Médio', checkpointsCount: 1, color: '#f87171' },
  { id: 4, name: 'Ponte de Vidro Ampliada', subtitle: 'Plataformas largas transparentes', difficulty: 'Médio', checkpointsCount: 1, color: '#a78bfa' },
  { id: 5, name: 'Bhop Slopes Confortáveis', subtitle: 'Rampas largas para saltos fluídos', difficulty: 'Médio', checkpointsCount: 1, color: '#facc15' },
  { id: 6, name: 'Super Launch Pads', subtitle: 'Ilhas amplas e molas de impulso', difficulty: 'Médio', checkpointsCount: 1, color: '#06b6d4' },
  { id: 7, name: 'Pista de Slide [C]', subtitle: 'Corredor largo com barras aéreas', difficulty: 'Difícil', checkpointsCount: 1, color: '#f97316' },
  { id: 8, name: 'Hexágonos Espaçosos', subtitle: 'Ilhas amplas e seguras', difficulty: 'Difícil', checkpointsCount: 1, color: '#ec4899' },
  { id: 9, name: 'Rampas de Surf Largas', subtitle: 'Surfe suave em rampas ampliadas', difficulty: 'Difícil', checkpointsCount: 1, color: '#818cf8' },
  { id: 10, name: 'Torre Apex Global Elite', subtitle: 'O topo glorioso com pódio gigante', difficulty: 'Global Elite', checkpointsCount: 1, color: '#eab308' },
];

export class ObbyWorld {
  public scene: THREE.Scene;
  public platforms: PlatformBox[] = [];
  public movingHazards: MovingHazard[] = [];
  public checkpointMeshes: Map<number, THREE.Mesh> = new Map();
  public checkpointPositions: Map<number, THREE.Vector3> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupLightingAndAtmosphere();
    this.buildWorld();
  }

  private setupLightingAndAtmosphere() {
    this.scene.background = new THREE.Color(0x70b5ff);
    this.scene.fog = new THREE.FogExp2(0x70b5ff, 0.0045);

    // Sun Key Light
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(50, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    const d = 80;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Soft Ambient fill
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.75);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 0.55);
    this.scene.add(hemiLight);

    this.buildClouds();
  }

  private buildClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 30; i++) {
      const cloudGroup = new THREE.Group();
      const numBlobs = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numBlobs; j++) {
        const r = 10 + Math.random() * 10;
        const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 7), cloudMat);
        blob.position.set(j * 10 - 15, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 10);
        cloudGroup.add(blob);
      }
      const angle = (i / 30) * Math.PI * 2;
      const dist = 180 + Math.random() * 80;
      cloudGroup.position.set(
        Math.cos(angle) * dist,
        40 + Math.random() * 35,
        Math.sin(angle) * dist
      );
      cloudGroup.scale.set(1, 0.45, 1);
      this.scene.add(cloudGroup);
    }
  }

  private addPlatform(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number | string,
    options: {
      isHazard?: boolean;
      isBouncePad?: boolean;
      isFinish?: boolean;
      isCheckpoint?: boolean;
      checkpointId?: number;
      stageId?: number;
      neon?: boolean;
      slideHazard?: boolean;
      transparent?: boolean;
      opacity?: number;
    } = {}
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, d);
    let mat: THREE.Material;

    if (options.isHazard) {
      mat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.85,
        roughness: 0.3,
      });
    } else if (options.isBouncePad) {
      mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
    } else if (options.isFinish) {
      mat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
      });
    } else if (options.transparent) {
      mat = new THREE.MeshStandardMaterial({
        color: typeof color === 'string' ? new THREE.Color(color) : color,
        transparent: true,
        opacity: options.opacity || 0.45,
        roughness: 0.1,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: typeof color === 'string' ? new THREE.Color(color) : color,
        roughness: 0.4,
        metalness: 0.1,
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = !options.isHazard;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Subtle crisp neon edge lines for clean visual separation
    if (options.neon && !options.isHazard) {
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(wireframe);
    }

    const min = new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2);
    const max = new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2);

    this.platforms.push({
      min,
      max,
      mesh,
      isHazard: options.isHazard,
      isBouncePad: options.isBouncePad,
      isFinish: options.isFinish,
      isCheckpoint: options.isCheckpoint,
      checkpointId: options.checkpointId,
      stageId: options.stageId,
      slideHazard: options.slideHazard,
    });

    return mesh;
  }

  private addCheckpoint(id: number, x: number, y: number, z: number, stageName: string) {
    this.checkpointPositions.set(id, new THREE.Vector3(x, y + 1.2, z));

    // Large, spacious Checkpoint Pad (7x7)
    const padMesh = this.addPlatform(x, y, z, 7, 0.8, 7, 0xf59e0b, {
      isCheckpoint: true,
      checkpointId: id,
      neon: true,
    });
    this.checkpointMeshes.set(id, padMesh);

    // Flagpole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 5.0, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 })
    );
    pole.position.set(x + 2.8, y + 2.8, z + 2.8);
    this.scene.add(pole);

    // Flag banner
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
    );
    flag.position.set(x + 1.8, y + 4.7, z + 2.8);
    this.scene.add(flag);

    // Floating Stage billboard text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 152);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`STAGE ${id}`, 256, 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '24px Plus Jakarta Sans, sans-serif';
    ctx.fillText(stageName, 256, 115);

    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.3),
      new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
    );
    bannerMesh.position.set(x, y + 5.8, z);
    this.scene.add(bannerMesh);
  }

  public activateCheckpoint(id: number) {
    const mesh = this.checkpointMeshes.get(id);
    if (mesh) {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e); // Neon Green
      (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x16a34a);
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.85;
    }
  }

  private buildWorld() {
    // -------------------------------------------------------------
    // STAGE 1: Roblox Classic Steps (Spawn Platform) - Bem Amplo
    // -------------------------------------------------------------
    this.addPlatform(0, 0, 0, 14, 1.2, 14, 0x2563eb, { neon: true });
    this.addCheckpoint(1, 0, 0, 0, 'Roblox Warmup');

    // Stepping stones - Bem mais largas e confortáveis (6x6 cada)
    const s1Colors = [0x38bdf8, 0x0284c7, 0x38bdf8, 0x0284c7];
    for (let i = 0; i < 4; i++) {
      this.addPlatform(0, 0.4 + i * 0.4, 12 + i * 6.5, 6, 0.8, 5.5, s1Colors[i], { neon: true });
    }

    // Mid platform
    this.addPlatform(0, 2.2, 42, 10, 1.0, 10, 0x1e293b);

    // -------------------------------------------------------------
    // STAGE 2: Truss & Vigas Espaçosas (Passadiços bem mais largos)
    // -------------------------------------------------------------
    this.addCheckpoint(2, 0, 2.2, 42, 'Truss & Vigas Espaçosas');

    // Balance beam 1 - Largura aumentada de 0.8 para 2.4 (muito mais estável!)
    this.addPlatform(0, 2.6, 54, 2.4, 0.8, 12, 0xfacc15, { neon: true });
    // Mid support
    this.addPlatform(0, 3.0, 65, 7, 0.8, 7, 0x4ade80, { neon: true });
    // Balance beam 2
    this.addPlatform(3.5, 3.4, 76, 2.4, 0.8, 13, 0xfacc15, { neon: true });
    // Intermediate step
    this.addPlatform(3.5, 3.8, 88, 7, 0.8, 7, 0x4ade80, { neon: true });

    // -------------------------------------------------------------
    // STAGE 3: Arena Lasers & Spinners (Arena Ampla e Aberta)
    // -------------------------------------------------------------
    this.addCheckpoint(3, 3.5, 3.8, 100, 'Lasers & Spinners');
    this.addPlatform(3.5, 3.8, 100, 10, 1.0, 10, 0x1e293b);

    // Central circular/square arena (15x15 gigante)
    this.addPlatform(3.5, 4.2, 118, 15, 1.0, 15, 0x334155, { neon: true });

    // Rotating Laser Bar (com rotação suave para salto fácil)
    const laserMesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.45, 0.45),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.95,
      })
    );
    laserMesh1.position.set(3.5, 5.2, 118);
    this.scene.add(laserMesh1);
    this.movingHazards.push({
      mesh: laserMesh1,
      axis: 'rotY',
      speed: 1.2, // Rotação mais calma e amigável
      center: new THREE.Vector3(3.5, 5.2, 118),
      radius: 7.0,
      min: new THREE.Vector3(),
      max: new THREE.Vector3(),
    });

    // Lava pit floor below
    this.addPlatform(3.5, -4, 118, 28, 1, 32, 0xdc2626, { isHazard: true });

    // Exit step
    this.addPlatform(3.5, 4.8, 135, 8, 1.0, 8, 0x1e293b);

    // -------------------------------------------------------------
    // STAGE 4: Ponte de Vidro Ampliada (Painéis 5x6 bem espaçosos)
    // -------------------------------------------------------------
    this.addCheckpoint(4, 3.5, 4.8, 148, 'Ponte de Vidro Ampliada');
    this.addPlatform(3.5, 4.8, 148, 10, 1.0, 10, 0x1e293b);

    for (let i = 0; i < 5; i++) {
      const zPos = 160 + i * 7.5;
      const safeLeft = i % 2 === 0;

      // Left panel (largo: 4.8 x 6.5)
      this.addPlatform(0.5, 5.2, zPos, 4.8, 0.3, 6.5, 0x38bdf8, {
        transparent: true,
        opacity: safeLeft ? 0.75 : 0.2,
        isHazard: !safeLeft,
        neon: safeLeft,
      });

      // Right panel (largo: 4.8 x 6.5)
      this.addPlatform(6.5, 5.2, zPos, 4.8, 0.3, 6.5, 0x38bdf8, {
        transparent: true,
        opacity: !safeLeft ? 0.75 : 0.2,
        isHazard: safeLeft,
        neon: !safeLeft,
      });
    }

    // -------------------------------------------------------------
    // STAGE 5: Bhop Slopes Confortáveis (Plataformas 8x8)
    // -------------------------------------------------------------
    this.addCheckpoint(5, 3.5, 5.4, 206, 'Bhop Slopes Confortáveis');
    this.addPlatform(3.5, 5.4, 206, 10, 1.0, 10, 0x1e293b);

    // Rampas de salto largas e generosas
    const bhopPads = [
      { x: 3.5, y: 5.6, z: 220, w: 8.5, h: 0.8, d: 8.5, col: 0xfacc15 },
      { x: 6.5, y: 6.2, z: 234, w: 8.0, h: 0.8, d: 8.0, col: 0xfacc15 },
      { x: 0.5, y: 6.8, z: 248, w: 8.0, h: 0.8, d: 8.0, col: 0xfacc15 },
      { x: 3.5, y: 7.4, z: 262, w: 8.5, h: 0.8, d: 8.5, col: 0xfacc15 },
    ];
    bhopPads.forEach(p => {
      this.addPlatform(p.x, p.y, p.z, p.w, p.h, p.d, p.col, { neon: true });
    });

    // -------------------------------------------------------------
    // STAGE 6: Super Launch Pads & Ilhas Amplas (12x12)
    // -------------------------------------------------------------
    this.addCheckpoint(6, 3.5, 8.0, 278, 'Super Launch Pads');
    this.addPlatform(3.5, 8.0, 278, 10, 1.0, 10, 0x1e293b);

    // Bounce Pad 1 (Grande: 6.0 x 6.0)
    this.addPlatform(3.5, 8.3, 290, 6.0, 0.8, 6.0, 0x06b6d4, { isBouncePad: true });

    // Mid-air landing island (12x12 gigante)
    this.addPlatform(3.5, 14.0, 324, 12, 1.0, 12, 0x1e293b, { neon: true });

    // Bounce Pad 2 (6.0 x 6.0)
    this.addPlatform(3.5, 14.3, 338, 6.0, 0.8, 6.0, 0x06b6d4, { isBouncePad: true });

    // Landing 2 (12x12 gigante)
    this.addPlatform(3.5, 20.0, 372, 12, 1.0, 12, 0x1e293b, { neon: true });

    // -------------------------------------------------------------
    // STAGE 7: Pista de Slide [C] (Larga: 9.0 unidades)
    // -------------------------------------------------------------
    this.addCheckpoint(7, 3.5, 20.0, 390, 'Pista de Slide [C]');
    this.addPlatform(3.5, 20.0, 390, 10, 1.0, 10, 0x1e293b);

    // Runway platform larga (9m de largura)
    this.addPlatform(3.5, 20.0, 414, 9, 1.0, 36, 0x475569);

    // Barras laser aéreas a altura segura com slide
    for (let i = 0; i < 3; i++) {
      const barZ = 404 + i * 8;
      this.addPlatform(3.5, 21.4, barZ, 9.5, 0.5, 0.5, 0xef4444, {
        isHazard: true,
        slideHazard: true,
      });
    }

    // -------------------------------------------------------------
    // STAGE 8: Hexágonos Espaçosos (Ilhas 7x7)
    // -------------------------------------------------------------
    this.addCheckpoint(8, 3.5, 20.0, 442, 'Hexágonos Espaçosos');
    this.addPlatform(3.5, 20.0, 442, 10, 1.0, 10, 0x1e293b);

    const hexOffsets = [
      { dx: -3.5, dz: 10, dy: 0.4, col: 0xec4899 },
      { dx: 3.5, dz: 20, dy: 0.9, col: 0xa855f7 },
      { dx: -3.0, dz: 30, dy: 1.5, col: 0xec4899 },
      { dx: 3.0, dz: 40, dy: 2.0, col: 0xa855f7 },
      { dx: 0, dz: 50, dy: 2.6, col: 0xec4899 },
    ];

    hexOffsets.forEach(h => {
      this.addPlatform(3.5 + h.dx, 20.0 + h.dy, 442 + h.dz, 7.0, 0.8, 7.0, h.col, { neon: true });
    });

    // -------------------------------------------------------------
    // STAGE 9: Rampas de Surf Largas (Largura 8.5)
    // -------------------------------------------------------------
    this.addCheckpoint(9, 3.5, 23.2, 506, 'Rampas de Surf Largas');
    this.addPlatform(3.5, 23.2, 506, 10, 1.0, 10, 0x1e293b);

    // Ramp 1 (tilted surf wedge bem mais larga)
    const surfGeo1 = new THREE.BoxGeometry(8.5, 0.8, 22);
    const surfMat1 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      roughness: 0.1,
      metalness: 0.3,
    });
    const surfMesh1 = new THREE.Mesh(surfGeo1, surfMat1);
    surfMesh1.position.set(0.5, 22.8, 524);
    surfMesh1.rotation.z = 0.45;
    this.scene.add(surfMesh1);
    this.platforms.push({
      min: new THREE.Vector3(-4, 21.0, 513),
      max: new THREE.Vector3(5, 25.0, 535),
      mesh: surfMesh1,
    });

    // Surf transfer pad ampla
    this.addPlatform(3.5, 21.5, 544, 8, 1.0, 8, 0x4f46e5, { neon: true });

    // Ramp 2
    const surfMesh2 = new THREE.Mesh(surfGeo1, surfMat1);
    surfMesh2.position.set(6.5, 21.0, 562);
    surfMesh2.rotation.z = -0.45;
    this.scene.add(surfMesh2);
    this.platforms.push({
      min: new THREE.Vector3(2, 19.5, 551),
      max: new THREE.Vector3(11, 23.5, 573),
      mesh: surfMesh2,
    });

    // -------------------------------------------------------------
    // STAGE 10: Torre Apex Global Elite (Pódio 15x15)
    // -------------------------------------------------------------
    this.addCheckpoint(10, 3.5, 20.0, 584, 'Torre Global Elite');
    this.addPlatform(3.5, 20.0, 584, 12, 1.2, 12, 0x1e293b);

    // Final stair ascent
    for (let i = 0; i < 6; i++) {
      this.addPlatform(3.5, 20.6 + i * 0.7, 594 + i * 4.5, 7, 0.8, 3.8, 0xfbbf24, { neon: true });
    }

    // Apex Victory Pedestal (15x15 gigante)
    this.addPlatform(3.5, 25.0, 626, 15, 1.4, 15, 0xfacc15, {
      isFinish: true,
      neon: true,
    });

    // Golden Trophy on Apex
    const trophyBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, 1.0, 20),
      new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.95, roughness: 0.1 })
    );
    trophyBase.position.set(3.5, 26.2, 626);
    this.scene.add(trophyBase);

    const trophyCup = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.6),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.6,
        metalness: 0.98,
        roughness: 0.1,
      })
    );
    trophyCup.position.set(3.5, 27.6, 626);
    trophyCup.rotation.x = Math.PI;
    this.scene.add(trophyCup);

    // Rotating golden star above trophy
    const starGeo = new THREE.OctahedronGeometry(1.0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfef08a,
      emissiveIntensity: 0.9,
      metalness: 0.9,
    });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(3.5, 30.0, 626);
    this.scene.add(star);
    this.movingHazards.push({
      mesh: star,
      axis: 'rotY',
      speed: 1.2,
      center: new THREE.Vector3(3.5, 30.0, 626),
      radius: 0,
      min: new THREE.Vector3(),
      max: new THREE.Vector3(),
    });
  }

  public update(delta: number) {
    this.movingHazards.forEach(h => {
      if (h.axis === 'rotY') {
        h.mesh.rotation.y += h.speed * delta;
        const box = new THREE.Box3().setFromObject(h.mesh);
        h.min.copy(box.min);
        h.max.copy(box.max);
      }
    });
  }
}

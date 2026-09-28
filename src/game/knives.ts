import * as THREE from 'three';
import { KnifeType, KnifeSkinId } from '../types/game';
import { getKnifeTexture, getG10HandleTexture } from './textures';
import { sound } from './audio';

export interface KnifeAnimationState {
  isInspecting: boolean;
  inspectProgress: number; // 0 to 1
  isSlashing: boolean;
  slashProgress: number; // 0 to 1
  idleTimer: number;
}

export class KnifeManager {
  public group: THREE.Group;
  public knifeMeshGroup: THREE.Group;
  public armMeshGroup: THREE.Group;
  public animationState: KnifeAnimationState = {
    isInspecting: false,
    inspectProgress: 0,
    isSlashing: false,
    slashProgress: 0,
    idleTimer: 0,
  };

  private currentType: KnifeType = 'karambit';
  private currentSkin: KnifeSkinId = 'fade';

  // Sub-parts for complex animations (like Butterfly flipping handles)
  private butterflyBlade: THREE.Mesh | null = null;
  private butterflyHandle1: THREE.Group | null = null;
  private butterflyHandle2: THREE.Group | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.knifeMeshGroup = new THREE.Group();
    this.armMeshGroup = new THREE.Group();

    this.group.add(this.armMeshGroup);
    this.group.add(this.knifeMeshGroup);

    this.buildArm();
    this.rebuildKnife(this.currentType, this.currentSkin);

    // Authentic CS:GO viewmodel position (lower-right, natural hand posture)
    this.group.position.set(0.22, -0.21, -0.38);
    this.group.rotation.set(0.06, -0.15, 0.04);
  }

  public rebuildKnife(type: KnifeType, skin: KnifeSkinId) {
    this.currentType = type;
    this.currentSkin = skin;

    // Clear previous knife parts
    while (this.knifeMeshGroup.children.length > 0) {
      const child = this.knifeMeshGroup.children[0];
      this.knifeMeshGroup.remove(child);
    }
    this.butterflyBlade = null;
    this.butterflyHandle1 = null;
    this.butterflyHandle2 = null;

    const knifeObject = createKnifeModel(type, skin);
    this.knifeMeshGroup.add(knifeObject.root);

    if (type === 'butterfly' && knifeObject.extras) {
      this.butterflyBlade = knifeObject.extras.blade;
      this.butterflyHandle1 = knifeObject.extras.handle1 ?? null;
      this.butterflyHandle2 = knifeObject.extras.handle2 ?? null;
    }

    // Default positioning in hand
    this.knifeMeshGroup.position.set(0.04, 0.03, -0.05);
    this.knifeMeshGroup.rotation.set(0, 0, 0);
  }

  private buildArm() {
    // 1. Forearm Tactical Sleeve with fabric crease
    const sleeveGeo = new THREE.CylinderGeometry(0.048, 0.042, 0.38, 16);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Tactical midnight slate
      roughness: 0.85,
      metalness: 0.05,
    });
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.rotation.x = Math.PI / 2.25;
    sleeve.rotation.z = -0.18;
    sleeve.position.set(0.06, -0.16, 0.18);
    this.armMeshGroup.add(sleeve);

    // Sleeve Cuff Hem Ring
    const cuffGeo = new THREE.TorusGeometry(0.044, 0.005, 8, 20);
    const cuffMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const cuff = new THREE.Mesh(cuffGeo, cuffMat);
    cuff.rotation.x = Math.PI / 2.25;
    cuff.rotation.z = -0.18;
    cuff.position.set(0.05, -0.04, 0.05);
    this.armMeshGroup.add(cuff);

    // 2. High-Detail Tactical Combat Glove (Specialist / Hand Wrap look)
    const gloveBodyGeo = new THREE.BoxGeometry(0.058, 0.07, 0.082);
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Carbon black leather
      roughness: 0.55,
      metalness: 0.25,
    });
    const gloveBody = new THREE.Mesh(gloveBodyGeo, gloveMat);
    gloveBody.position.set(0.038, -0.015, 0.01);
    this.armMeshGroup.add(gloveBody);

    // Molded Carbon Fiber Knuckle Guard
    const knuckleGeo = new THREE.BoxGeometry(0.052, 0.02, 0.035);
    const knuckleMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const knuckleGuard = new THREE.Mesh(knuckleGeo, knuckleMat);
    knuckleGuard.position.set(0.038, 0.015, 0.012);
    knuckleGuard.rotation.x = 0.25;
    this.armMeshGroup.add(knuckleGuard);

    // 4 Articulated Wrapped Fingers around Handle
    const fingerMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
      metalness: 0.2,
    });

    for (let i = 0; i < 4; i++) {
      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(0.018 + (i * 0.014 - 0.021), 0.02, -0.015);

      // Proximal phalanx
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.016, 0.03), fingerMat);
      f1.rotation.x = 0.55;
      fingerGroup.add(f1);

      // Distal phalanx (curling around handle)
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.024), fingerMat);
      f2.position.set(0, -0.016, -0.018);
      f2.rotation.x = 1.35;
      fingerGroup.add(f2);

      this.armMeshGroup.add(fingerGroup);
    }

    // Opposing Thumb
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.018, 0.036), fingerMat);
    thumb.position.set(0.068, 0.005, -0.01);
    thumb.rotation.set(-0.2, -0.4, 0.6);
    this.armMeshGroup.add(thumb);
  }

  public inspect() {
    if (this.animationState.isInspecting || this.animationState.isSlashing) return;
    this.animationState.isInspecting = true;
    this.animationState.inspectProgress = 0;

    if (this.currentType === 'butterfly') {
      sound.playKnifeInspect('butterfly');
    } else if (this.currentType === 'karambit') {
      sound.playKnifeInspect('karambit');
    } else {
      sound.playKnifeInspect('other');
    }
  }

  public slash() {
    if (this.animationState.isSlashing) return;
    this.animationState.isSlashing = true;
    this.animationState.slashProgress = 0;
    this.animationState.isInspecting = false;
    sound.playKnifeSlash();
  }

  public update(delta: number, isMoving: boolean, currentSpeed: number) {
    this.animationState.idleTimer += delta * (isMoving ? 3.5 : 1.8);

    // Natural CS:GO weapon breathing sway
    const bobAmp = isMoving ? 0.009 : 0.0025;
    const bobX = Math.sin(this.animationState.idleTimer) * bobAmp;
    const bobY = Math.abs(Math.cos(this.animationState.idleTimer)) * (bobAmp * 1.3);
    const speedTilt = Math.min(currentSpeed / 25, 0.08);

    const basePosX = 0.22 + bobX;
    const basePosY = -0.21 + bobY - speedTilt * 0.03;
    const basePosZ = -0.38;

    const baseRotX = 0.06 + speedTilt * 0.06;
    const baseRotY = -0.15 + bobX * 1.5;
    const baseRotZ = 0.04;

    // Handle Attack Slash Animation
    if (this.animationState.isSlashing) {
      this.animationState.slashProgress += delta * 4.4; // ~0.22s snappy slash
      if (this.animationState.slashProgress >= 1) {
        this.animationState.isSlashing = false;
        this.animationState.slashProgress = 0;
      } else {
        const p = this.animationState.slashProgress;
        const slashPhase = Math.sin(p * Math.PI);
        this.group.position.set(
          basePosX - slashPhase * 0.18,
          basePosY + slashPhase * 0.06,
          basePosZ + slashPhase * 0.12
        );
        this.group.rotation.set(
          baseRotX + slashPhase * 0.5,
          baseRotY - slashPhase * 0.7,
          baseRotZ - slashPhase * 0.75
        );
        return;
      }
    }

    // Handle Authentic CS:GO Inspect Animation
    if (this.animationState.isInspecting) {
      const inspectSpeed = this.currentType === 'butterfly' ? 0.42 : 0.5;
      this.animationState.inspectProgress += delta * inspectSpeed;

      if (this.animationState.inspectProgress >= 1) {
        this.animationState.isInspecting = false;
        this.animationState.inspectProgress = 0;
        this.resetTransforms();
      } else {
        const p = this.animationState.inspectProgress;
        this.applyInspectAnimation(p);
        return;
      }
    }

    // Default resting state
    this.group.position.set(basePosX, basePosY, basePosZ);
    this.group.rotation.set(baseRotX, baseRotY, baseRotZ);
    this.knifeMeshGroup.rotation.set(0, 0, 0);
  }

  private applyInspectAnimation(p: number) {
    if (this.currentType === 'karambit') {
      // Iconic Karambit finger spin: spins smoothly around the ring hole!
      const spinAngle = p * Math.PI * 4; // 2 full spins
      const lift = Math.sin(p * Math.PI) * 0.08;

      this.group.position.set(0.18, -0.17 + lift, -0.34);
      this.group.rotation.set(0.08, -0.06, 0);

      this.knifeMeshGroup.rotation.z = spinAngle;
      this.knifeMeshGroup.rotation.x = Math.sin(p * Math.PI * 2) * 0.25;
    } else if (this.currentType === 'butterfly') {
      // Iconic Balisong flips
      const lift = Math.sin(p * Math.PI) * 0.07;
      this.group.position.set(0.19, -0.18 + lift, -0.34);

      if (this.butterflyHandle1 && this.butterflyHandle2) {
        const flipPhase = Math.sin(p * Math.PI * 3.5);
        this.butterflyHandle1.rotation.z = flipPhase * 1.5;
        this.butterflyHandle2.rotation.z = -flipPhase * 1.5;
      }

      this.knifeMeshGroup.rotation.y = Math.sin(p * Math.PI * 2) * 1.1;
      this.knifeMeshGroup.rotation.z = p * Math.PI * 2;
    } else {
      // Tactical twirl & gleam inspection
      const lift = Math.sin(p * Math.PI) * 0.08;
      this.group.position.set(0.18, -0.17 + lift, -0.33);
      this.group.rotation.set(0.18, Math.sin(p * Math.PI * 2) * 0.7, Math.sin(p * Math.PI) * 0.35);
      this.knifeMeshGroup.rotation.y = p * Math.PI * 2;
    }
  }

  private resetTransforms() {
    this.knifeMeshGroup.rotation.set(0, 0, 0);
    if (this.butterflyHandle1 && this.butterflyHandle2) {
      this.butterflyHandle1.rotation.set(0, 0, 0);
      this.butterflyHandle2.rotation.set(0, 0, 0);
    }
  }
}

/**
 * Creates photorealistic 3D procedural CS:GO knife models
 */
export function createKnifeModel(
  type: KnifeType,
  skin: KnifeSkinId
): {
  root: THREE.Group;
  extras?: {
    blade: THREE.Mesh;
    handle1?: THREE.Group;
    handle2?: THREE.Group;
  };
} {
  const root = new THREE.Group();
  const bladeTex = getKnifeTexture(skin);
  const g10Tex = getG10HandleTexture();

  // High-fidelity PBR metallic blade material
  const bladeMat = new THREE.MeshStandardMaterial({
    map: bladeTex,
    metalness: 0.94,
    roughness: 0.16,
  });

  // Carbon / G10 textured handle scales
  const g10Mat = new THREE.MeshStandardMaterial({
    map: g10Tex,
    roughness: 0.75,
    metalness: 0.2,
  });

  // Stainless steel screws & pivot pins
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.98,
    roughness: 0.1,
  });

  // Full-tang core steel
  const tangMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.3,
  });

  switch (type) {
    case 'karambit': {
      // 1. Chamfered Finger Ring
      const ringOuter = new THREE.Mesh(
        new THREE.TorusGeometry(0.024, 0.0075, 16, 32),
        screwMat
      );
      ringOuter.position.set(0, -0.075, 0);
      root.add(ringOuter);

      // Inner ring comfort bevel
      const ringInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.012, 24, 1, true),
        screwMat
      );
      ringInner.position.set(0, -0.075, 0);
      root.add(ringInner);

      // 2. Full-Tang Spine & Handle Core
      const tangGeo = new THREE.BoxGeometry(0.026, 0.1, 0.014);
      const tangMesh = new THREE.Mesh(tangGeo, tangMat);
      tangMesh.position.set(0, -0.015, 0);
      root.add(tangMesh);

      // 3. Ergonomic G10 Handle Scales (Left & Right with 3 finger grooves)
      [-0.009, 0.009].forEach(z => {
        const scaleGeo = new THREE.BoxGeometry(0.027, 0.094, 0.005);
        const scaleMesh = new THREE.Mesh(scaleGeo, g10Mat);
        scaleMesh.position.set(0, -0.015, z);
        root.add(scaleMesh);

        // 3 Stainless Steel Torx Screws
        [-0.045, -0.015, 0.015].forEach(y => {
          const screw = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 12),
            screwMat
          );
          screw.rotation.x = Math.PI / 2;
          screw.position.set(0, y, z > 0 ? 0.012 : -0.012);
          root.add(screw);
        });
      });

      // 4. Thumb Jimping (Grip grooves on spine)
      for (let i = 0; i < 4; i++) {
        const jimp = new THREE.Mesh(
          new THREE.BoxGeometry(0.006, 0.002, 0.014),
          tangMat
        );
        jimp.position.set(-0.013, 0.038 + i * 0.005, 0);
        root.add(jimp);
      }

      // 5. Authentic Curved Talon Blade Profile
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(-0.012, 0.035);
      // Outer curved spine
      bladeShape.bezierCurveTo(0.01, 0.07, 0.05, 0.11, 0.105, 0.13);
      // Needle-sharp claw tip
      bladeShape.lineTo(0.108, 0.126);
      // Razor-sharp inner cutting edge
      bladeShape.bezierCurveTo(0.065, 0.095, 0.025, 0.065, 0.008, 0.035);
      bladeShape.closePath();

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.005,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.0025,
        bevelThickness: 0.0025,
      };

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      bladeGeo.center();
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.position.set(0.042, 0.082, 0);
      bladeMesh.rotation.z = -0.22;
      root.add(bladeMesh);

      return { root, extras: { blade: bladeMesh } };
    }

    case 'butterfly': {
      // Authentic Balisong: Bowie Clip-Point Blade + 2 Skeletonized Channel Handles
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(-0.012, 0);
      bladeShape.lineTo(-0.012, 0.155);
      // Swedge / Bowie clip point
      bladeShape.lineTo(0.005, 0.185); // Spear tip
      bladeShape.lineTo(0.012, 0.145); // Belly
      bladeShape.lineTo(0.012, 0.02);  // Choil
      bladeShape.lineTo(0.016, 0.01);  // Tang pin stop
      bladeShape.lineTo(-0.016, 0.01);
      bladeShape.closePath();

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.004,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.002,
        bevelThickness: 0.002,
      };

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.position.set(0, 0.01, 0);
      root.add(bladeMesh);

      // Tang Pins (Stop pins that collide with handles)
      const tangPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.014, 12),
        screwMat
      );
      tangPin.rotation.x = Math.PI / 2;
      tangPin.position.set(0, 0.025, 0);
      root.add(tangPin);

      // Realistic Pivot Screws with Washers
      [-0.01, 0.01].forEach(x => {
        const pivotScrew = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 16),
          screwMat
        );
        pivotScrew.rotation.x = Math.PI / 2;
        pivotScrew.position.set(x, 0.012, 0);
        root.add(pivotScrew);
      });

      // Handle 1 (Safe handle) with Skeletonized Speed Holes
      const handle1 = new THREE.Group();
      handle1.position.set(-0.01, 0.012, 0);

      const hMesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.16, 0.011),
        tangMat
      );
      hMesh1.position.set(0, -0.08, 0);
      handle1.add(hMesh1);

      // Speed hole cutouts
      for (let i = 0; i < 4; i++) {
        const hole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.003, 0.013, 12),
          new THREE.MeshBasicMaterial({ color: 0x09090b })
        );
        hole.rotation.x = Math.PI / 2;
        hole.position.set(0, -0.04 - i * 0.026, 0);
        handle1.add(hole);
      }
      root.add(handle1);

      // Handle 2 (Bite handle) with T-Latch
      const handle2 = new THREE.Group();
      handle2.position.set(0.01, 0.012, 0);

      const hMesh2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.16, 0.011),
        tangMat
      );
      hMesh2.position.set(0, -0.08, 0);
      handle2.add(hMesh2);

      for (let i = 0; i < 4; i++) {
        const hole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.003, 0.013, 12),
          new THREE.MeshBasicMaterial({ color: 0x09090b })
        );
        hole.rotation.x = Math.PI / 2;
        hole.position.set(0, -0.04 - i * 0.026, 0);
        handle2.add(hole);
      }

      // Balisong T-Latch at handle base
      const latch = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.022, 0.008),
        screwMat
      );
      latch.position.set(0, -0.17, 0);
      handle2.add(latch);

      root.add(handle2);

      return {
        root,
        extras: { blade: bladeMesh, handle1, handle2 },
      };
    }

    case 'm9_bayonet': {
      // 1. Ergonomic Ribbed Polymer Handle
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.13, 16);
      const handleMesh = new THREE.Mesh(handleGeo, g10Mat);
      handleMesh.position.set(0, -0.055, 0);
      root.add(handleMesh);

      // Handle Ribs
      for (let y = -0.1; y < -0.01; y += 0.016) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(0.0155, 0.002, 8, 20),
          tangMat
        );
        rib.rotation.x = Math.PI / 2;
        rib.position.set(0, y, 0);
        root.add(rib);
      }

      // Stainless Steel Pommel Cap
      const pommel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.012, 16),
        screwMat
      );
      pommel.position.set(0, -0.125, 0);
      root.add(pommel);

      // 2. Tactical Crossguard with Muzzle Ring
      const guardMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.009, 0.018),
        tangMat
      );
      guardMesh.position.set(0, 0.015, 0);
      root.add(guardMesh);

      // Muzzle attachment ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.012, 0.0035, 12, 24),
        tangMat
      );
      ring.position.set(-0.025, 0.028, 0);
      root.add(ring);

      // 3. Precision Sawback Blade with Fuller Groove
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(-0.015, 0.02);
      // Milled sawteeth along upper spine
      for (let y = 0.035; y < 0.15; y += 0.016) {
        bladeShape.lineTo(-0.021, y + 0.007);
        bladeShape.lineTo(-0.015, y + 0.014);
      }
      bladeShape.lineTo(-0.015, 0.19);
      bladeShape.lineTo(0.008, 0.225); // Spear tip
      bladeShape.lineTo(0.018, 0.155); // Cutting belly
      bladeShape.lineTo(0.018, 0.02);
      bladeShape.closePath();

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.006,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.0025,
        bevelThickness: 0.0025,
      };

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      root.add(bladeMesh);

      // Fuller (Blood Groove) along blade center
      const fuller = new THREE.Mesh(
        new THREE.BoxGeometry(0.005, 0.12, 0.008),
        tangMat
      );
      fuller.position.set(0, 0.09, 0);
      root.add(fuller);

      return { root, extras: { blade: bladeMesh } };
    }

    case 'skeleton': {
      // Skeleton Knife: Skeletonized Dagger with Center Hole & Grip Tape
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(-0.013, 0);
      bladeShape.lineTo(-0.013, 0.17);
      bladeShape.lineTo(0, 0.21); // Spear point dagger
      bladeShape.lineTo(0.013, 0.17);
      bladeShape.lineTo(0.013, 0);
      bladeShape.lineTo(0.016, -0.11);
      bladeShape.lineTo(-0.016, -0.11);
      bladeShape.closePath();

      // Precision center ring hole
      const ringHole = new THREE.Path();
      ringHole.absarc(0, -0.045, 0.011, 0, Math.PI * 2, true);
      bladeShape.holes.push(ringHole);

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.005,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.002,
        bevelThickness: 0.002,
      });

      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      root.add(bladeMesh);

      // Handle Paracord Wrap Bands
      for (let y = -0.095; y < -0.06; y += 0.009) {
        const wrap = new THREE.Mesh(
          new THREE.BoxGeometry(0.034, 0.006, 0.0075),
          g10Mat
        );
        wrap.position.set(0, y, 0);
        root.add(wrap);
      }

      return { root, extras: { blade: bladeMesh } };
    }

    case 'gut_knife':
    default: {
      // Gut Knife: Rounded deep cutting belly with iconic gut hook
      const handleGeo = new THREE.BoxGeometry(0.026, 0.115, 0.018);
      const handleMesh = new THREE.Mesh(handleGeo, g10Mat);
      handleMesh.position.set(0, -0.045, 0);
      root.add(handleMesh);

      // Contoured handle pins
      [-0.07, -0.04, -0.01].forEach(y => {
        const pin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0035, 0.0035, 0.02, 12),
          screwMat
        );
        pin.rotation.x = Math.PI / 2;
        pin.position.set(0, y, 0);
        root.add(pin);
      });

      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(-0.014, 0.02);
      bladeShape.lineTo(-0.016, 0.145);
      // Realistic sharp gut hook curve
      bladeShape.bezierCurveTo(-0.032, 0.155, -0.028, 0.175, -0.012, 0.17);
      bladeShape.lineTo(0.01, 0.19); // Hook tip
      bladeShape.bezierCurveTo(0.032, 0.13, 0.024, 0.06, 0.018, 0.02); // Deep curved cutting belly
      bladeShape.closePath();

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.005,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.0025,
        bevelThickness: 0.0025,
      });

      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      root.add(bladeMesh);

      return { root, extras: { blade: bladeMesh } };
    }
  }
}

import * as THREE from 'three';
import { PlayerCustomization } from '../types/game';
import { getRobloxFaceTexture, getShirtTexture } from './textures';
import { createKnifeModel } from './knives';

export class RobloxCharacter {
  public group: THREE.Group;
  public head: THREE.Mesh;
  public torso: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public hatGroup: THREE.Group;
  public handKnifeGroup: THREE.Group;

  private animTimer: number = 0;
  private customization: PlayerCustomization;

  constructor(customization: PlayerCustomization) {
    this.customization = customization;
    this.group = new THREE.Group();

    // Roblox blocky scale: 1 unit ~ 1 meter (approx 1.8 units tall)
    const skinColor = new THREE.Color(customization.skinTone || '#facc15');

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.6,
      metalness: 0.05,
    });

    // 1. Torso (0.5w x 0.5h x 0.25d)
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.5, 0.25);
    const shirtTex = getShirtTexture(customization.shirt);
    const torsoMat = new THREE.MeshStandardMaterial({
      map: shirtTex,
      roughness: 0.7,
    });
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 0.75;
    this.group.add(this.torso);

    // 2. Head (0.28w x 0.28h x 0.28d)
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const faceTex = getRobloxFaceTexture(customization.face);

    // Multi-material for head: face texture on front (+Z), skin color on others
    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.5,
      transparent: true,
      color: skinColor,
    });
    const headMaterials = [
      skinMat, // +X
      skinMat, // -X
      skinMat, // +Y
      skinMat, // -Y
      faceMat, // +Z (Front face)
      skinMat, // -Z
    ];
    this.head = new THREE.Mesh(headGeo, headMaterials);
    this.head.position.y = 0.4;
    this.torso.add(this.head);

    // 3. Hat & Accessories
    this.hatGroup = new THREE.Group();
    this.head.add(this.hatGroup);
    this.buildHat(customization.hat);

    // 4. Left Arm (pivot at shoulder)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 0.18, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), skinMat);
    leftArmMesh.position.y = -0.22;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    // 5. Right Arm (pivot at shoulder)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 0.18, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), skinMat);
    rightArmMesh.position.y = -0.22;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    // 6. Right Hand Knife
    this.handKnifeGroup = new THREE.Group();
    this.handKnifeGroup.position.set(0, -0.42, 0.08);
    this.handKnifeGroup.rotation.set(Math.PI / 2, 0, 0);
    this.handKnifeGroup.scale.set(1.4, 1.4, 1.4);
    this.rightArm.add(this.handKnifeGroup);
    this.updateKnifeInHand(customization.knife, customization.knifeSkin);

    // 7. Legs (pivot at hips)
    const pantsColor = new THREE.Color(customization.pants || '#1e3a8a');
    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColor,
      roughness: 0.7,
    });

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.13, 0.5, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.5, 0.23), pantsMat);
    leftLegMesh.position.y = -0.25;
    this.leftLeg.add(leftLegMesh);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.13, 0.5, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.5, 0.23), pantsMat);
    rightLegMesh.position.y = -0.25;
    this.rightLeg.add(rightLegMesh);
    this.group.add(this.rightLeg);
  }

  public updateCustomization(customization: PlayerCustomization) {
    this.customization = customization;
    // Update skin tone
    const skinCol = new THREE.Color(customization.skinTone || '#facc15');
    // Torso shirt
    this.torso.material = new THREE.MeshStandardMaterial({
      map: getShirtTexture(customization.shirt),
      roughness: 0.7,
    });
    // Head face
    const headMats = this.head.material as THREE.MeshStandardMaterial[];
    if (Array.isArray(headMats)) {
      headMats[4] = new THREE.MeshStandardMaterial({
        map: getRobloxFaceTexture(customization.face),
        roughness: 0.5,
        transparent: true,
        color: skinCol,
      });
    }
    // Update hat
    this.buildHat(customization.hat);
    // Update knife
    this.updateKnifeInHand(customization.knife, customization.knifeSkin);
    // Update pants
    const pantsCol = new THREE.Color(customization.pants || '#1e3a8a');
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsCol, roughness: 0.7 });
    if (this.leftLeg.children[0]) (this.leftLeg.children[0] as THREE.Mesh).material = pantsMat;
    if (this.rightLeg.children[0]) (this.rightLeg.children[0] as THREE.Mesh).material = pantsMat;
  }

  private buildHat(hatId: string) {
    while (this.hatGroup.children.length > 0) {
      this.hatGroup.remove(this.hatGroup.children[0]);
    }

    switch (hatId) {
      case 'roblox_cap': {
        // Classic Red Roblox Baseball Cap
        const capCrown = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.16, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
        );
        capCrown.position.y = 0.16;
        this.hatGroup.add(capCrown);

        const capBrim = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.02, 0.14),
          new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
        );
        capBrim.position.set(0, 0.13, 0.14);
        capBrim.rotation.x = 0.1;
        this.hatGroup.add(capBrim);
        break;
      }

      case 'halo': {
        // Golden Angelic Halo
        const haloMesh = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.025, 12, 24),
          new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            emissive: 0xfef08a,
            emissiveIntensity: 0.7,
            metalness: 0.9,
            roughness: 0.1,
          })
        );
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.position.y = 0.28;
        this.hatGroup.add(haloMesh);
        break;
      }

      case 'valkyrie': {
        // Valkyrie Wings Helm
        const helmBase = new THREE.Mesh(
          new THREE.SphereGeometry(0.17, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
        );
        helmBase.position.y = 0.06;
        this.hatGroup.add(helmBase);

        // Wing left & right
        [-1, 1].forEach(dir => {
          const wing = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.22, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.3 })
          );
          wing.position.set(dir * 0.18, 0.18, -0.02);
          wing.rotation.z = dir * -0.3;
          this.hatGroup.add(wing);
        });
        break;
      }

      case 'headphones': {
        // Tactical Gaming Headset
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(0.16, 0.02, 8, 16, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 })
        );
        band.position.y = 0.12;
        this.hatGroup.add(band);

        [-0.16, 0.16].forEach(x => {
          const cup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12),
            new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 }) // Neon green accent
          );
          cup.rotation.z = Math.PI / 2;
          cup.position.set(x, 0, 0);
          this.hatGroup.add(cup);
        });
        break;
      }

      case 'horns': {
        // Demon horns
        [-0.1, 0.1].forEach(x => {
          const horn = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, 0.18, 8),
            new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.3 })
          );
          horn.position.set(x, 0.22, -0.02);
          horn.rotation.z = x > 0 ? -0.35 : 0.35;
          horn.rotation.x = -0.2;
          this.hatGroup.add(horn);
        });
        break;
      }

      default:
        // No hat
        break;
    }
  }

  private updateKnifeInHand(knife: string, skin: string) {
    while (this.handKnifeGroup.children.length > 0) {
      this.handKnifeGroup.remove(this.handKnifeGroup.children[0]);
    }
    const model = createKnifeModel(knife as any, skin as any);
    this.handKnifeGroup.add(model.root);
  }

  public updateAnimation(delta: number, isMoving: boolean, speed: number, isGrounded: boolean) {
    if (!isGrounded) {
      // In-air jump pose (arms back/up, legs forward)
      this.leftArm.rotation.x = -0.7;
      this.rightArm.rotation.x = -0.7;
      this.leftLeg.rotation.x = 0.5;
      this.rightLeg.rotation.x = -0.3;
      return;
    }

    if (isMoving && speed > 0.5) {
      // Running animation with 1.25x speed multiplier
      this.animTimer += delta * speed * 0.45;
      const legAngle = Math.sin(this.animTimer) * 0.75;
      const armAngle = -Math.sin(this.animTimer) * 0.65;

      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = armAngle;
      // Right arm holds knife slightly forward while swinging
      this.rightArm.rotation.x = -armAngle * 0.6 + 0.3;
      // Subtle torso bob
      this.torso.position.y = 0.75 + Math.abs(Math.sin(this.animTimer * 2)) * 0.04;
    } else {
      // Idle standing
      this.animTimer += delta * 2;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0.2;
      this.torso.position.y = 0.75 + Math.sin(this.animTimer) * 0.01;
    }
  }
}

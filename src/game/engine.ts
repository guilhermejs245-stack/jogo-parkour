import * as THREE from 'three';
import { GameStats, PlayerCustomization } from '../types/game';
import { ObbyWorld } from './world';
import { KnifeManager } from './knives';
import { RobloxCharacter } from './character';
import { sound } from './audio';
import { createRealisticEnvironment } from './environment';
import { ParticleSystem } from './particles';

export interface EngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onVictory: (totalTime: number, deaths: number, maxSpeed: number) => void;
  onCheckpointTrigger: (checkpointId: number, stageName: string) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public world: ObbyWorld;
  public knifeManager: KnifeManager;
  public character: RobloxCharacter;
  public particles: ParticleSystem;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private callbacks: EngineCallbacks;

  // Player Physics & State
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public isGrounded: boolean = false;
  public isSliding: boolean = false;
  public slideTimer: number = 0;
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private bhopCombo: number = 0;
  private lastGroundedTime: number = 0;
  private footstepTimer: number = 0;
  private footstepLeft: boolean = true;

  // Camera & Controls
  public cameraMode: 'first_person' | 'third_person' = 'first_person';
  public yaw: number = 0;
  public pitch: number = 0;
  private keys: Record<string, boolean> = {};
  public isPointerLocked: boolean = false;

  // Viewmodel inertia lag
  private viewmodelSwayX: number = 0;
  private viewmodelSwayY: number = 0;

  // Mobile virtual inputs
  public mobileMoveX: number = 0;
  public mobileMoveY: number = 0;

  // Stats
  public stats: GameStats = {
    elapsedSeconds: 0,
    currentStage: 1,
    currentCheckpoint: 1,
    totalCheckpoints: 10,
    deaths: 0,
    currentSpeed: 0,
    maxSpeed: 0,
    bhopStreak: 0,
    rankPoints: 1200, // Starts at Gold Nova I
    isInspecting: false,
    isSlashing: false,
    isGrounded: false,
    cameraMode: 'first_person',
    gameCompleted: false,
  };

  private lastTime: number = performance.now();
  private statsThrottle: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    customization: PlayerCustomization,
    callbacks: EngineCallbacks
  ) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      72, // Authentic CS:GO viewmodel FOV
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );

    // 2. Renderer with High Dynamic Range & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 3. PBR Environment Reflections (Gives knife blades mirror shine!)
    createRealisticEnvironment(this.scene, this.renderer);

    // 4. Obby World
    this.world = new ObbyWorld(this.scene);

    // 5. Particle System
    this.particles = new ParticleSystem(this.scene);

    // 6. Knife Manager (1st Person)
    this.knifeManager = new KnifeManager();
    this.camera.add(this.knifeManager.group);
    this.scene.add(this.camera);

    // 7. Roblox Character (3rd Person)
    this.character = new RobloxCharacter(customization);
    this.scene.add(this.character.group);
    this.updateCameraVisibility();

    // 8. Bind Event Listeners
    this.bindEvents();

    // Start at Stage 1 Checkpoint
    this.respawnAtCurrentCheckpoint();
  }

  public updateCustomization(c: PlayerCustomization) {
    this.character.updateCustomization(c);
    this.knifeManager.rebuildKnife(c.knife, c.knifeSkin);
  }

  public toggleCameraMode() {
    this.cameraMode =
      this.cameraMode === 'first_person' ? 'third_person' : 'first_person';
    this.stats.cameraMode = this.cameraMode;
    this.updateCameraVisibility();
  }

  private updateCameraVisibility() {
    if (this.cameraMode === 'first_person') {
      this.knifeManager.group.visible = true;
      this.character.group.visible = false;
    } else {
      this.knifeManager.group.visible = false;
      this.character.group.visible = true;
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
  }

  public requestPointerLock() {
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock().catch(() => {});
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      return;
    }
    if (e.button === 0) {
      // Left Click: Slash knife!
      this.knifeManager.slash();
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    const sens = 0.0022;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;

    // Clamp pitch
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));

    // Dynamic CS:GO viewmodel inertia lag
    this.viewmodelSwayX = THREE.MathUtils.clamp(this.viewmodelSwayX + e.movementX * 0.0004, -0.04, 0.04);
    this.viewmodelSwayY = THREE.MathUtils.clamp(this.viewmodelSwayY + e.movementY * 0.0004, -0.03, 0.03);
  };

  public handleTouchLook(deltaX: number, deltaY: number) {
    const sens = 0.0035;
    this.yaw -= deltaX * sens;
    this.pitch -= deltaY * sens;
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
    this.viewmodelSwayX = THREE.MathUtils.clamp(this.viewmodelSwayX + deltaX * 0.0005, -0.04, 0.04);
    this.viewmodelSwayY = THREE.MathUtils.clamp(this.viewmodelSwayY + deltaY * 0.0005, -0.03, 0.03);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyF') {
      // Inspect Knife!
      this.knifeManager.inspect();
    } else if (e.code === 'KeyV') {
      // Toggle 1st / 3rd Person
      this.toggleCameraMode();
    } else if (e.code === 'Space') {
      // Buffer jump
      this.jumpBufferTimer = 0.15;
    } else if (e.code === 'KeyC') {
      // Slide
      this.startSlide();
    } else if (e.code === 'KeyR') {
      // Reset to checkpoint
      this.triggerDeath();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onResize = () => {
    if (!this.canvas) return;
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  };

  public inspectKnife() {
    this.knifeManager.inspect();
  }

  public slashKnife() {
    this.knifeManager.slash();
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const slashOrigin = this.camera.position.clone().addScaledVector(forward, 0.5);
    this.particles.spawnKnifeSparks(slashOrigin, forward, 14);
  }

  public triggerJump() {
    this.jumpBufferTimer = 0.15;
  }

  public startSlide() {
    if (this.isSliding) return;
    this.isSliding = true;
    this.slideTimer = 0.45; // 0.45s slide duration
    sound.playKnifeSlash(); // Fast swoosh
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const delta = Math.min(rawDelta, 0.05); // Cap delta to avoid physics tunneling

    if (!this.stats.gameCompleted) {
      this.stats.elapsedSeconds += delta;
    }

    this.updatePhysics(delta);
    this.world.update(delta);
    this.particles.update(delta);

    // Realistic CS:GO viewmodel sway decay
    this.viewmodelSwayX = THREE.MathUtils.lerp(this.viewmodelSwayX, 0, delta * 7);
    this.viewmodelSwayY = THREE.MathUtils.lerp(this.viewmodelSwayY, 0, delta * 7);
    this.knifeManager.group.position.x += this.viewmodelSwayX;
    this.knifeManager.group.position.y -= this.viewmodelSwayY;

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Throttle stats updates to UI (every ~50ms)
    this.statsThrottle += delta;
    if (this.statsThrottle >= 0.05) {
      this.statsThrottle = 0;
      this.updateStatsUI();
    }
  };

  private updatePhysics(delta: number) {
    // 1. Process Timers
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;
    if (this.coyoteTimer > 0) this.coyoteTimer -= delta;

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 2. Input Vectors (WASD + Mobile)
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;

    // Mobile joystick overlay
    moveForward += this.mobileMoveY;
    moveRight += this.mobileMoveX;

    const inputLen = Math.hypot(moveForward, moveRight);
    if (inputLen > 1) {
      moveForward /= inputLen;
      moveRight /= inputLen;
    }

    // 3. Movement Speed with Controlled 1.25x Multiplier
    // Standard Roblox walk is ~12 u/s -> 1.25x speed is 15.0 u/s!
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const baseTargetSpeed = isSprinting ? 17.5 : 15.0; // Balanced, comfortable 1.25x speed
    const targetSpeed = this.isSliding ? 20.0 : baseTargetSpeed;

    // Calculate forward & right directions relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const wishDir = new THREE.Vector3()
      .addScaledVector(forward, moveForward)
      .addScaledVector(right, moveRight);

    if (wishDir.lengthSq() > 0.0001) {
      wishDir.normalize();
    }

    // 4. Ground vs Air Acceleration (Precise & Responsive Control)
    if (this.isGrounded) {
      // Ground friction - firm stop so player doesn't slide off platforms
      const friction = 15.0;
      const curSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
      if (curSpeed > 0) {
        const drop = curSpeed * friction * delta;
        const newSpeed = Math.max(0, curSpeed - drop);
        this.playerVelocity.x *= newSpeed / curSpeed;
        this.playerVelocity.z *= newSpeed / curSpeed;
      }

      // Ground Acceleration
      const accel = 12.0;
      const currentDirSpeed = this.playerVelocity.x * wishDir.x + this.playerVelocity.z * wishDir.z;
      const addSpeed = targetSpeed - currentDirSpeed;
      if (addSpeed > 0) {
        const accelSpeed = Math.min(accel * targetSpeed * delta, addSpeed);
        this.playerVelocity.x += wishDir.x * accelSpeed;
        this.playerVelocity.z += wishDir.z * accelSpeed;
      }

      this.coyoteTimer = 0.15;
    } else {
      // Air acceleration (Precise air strafe)
      const airCap = 12.0;
      const airAccel = 18.0;
      const currentDirSpeed = this.playerVelocity.x * wishDir.x + this.playerVelocity.z * wishDir.z;
      const addSpeed = airCap - currentDirSpeed;
      if (addSpeed > 0) {
        const accelSpeed = Math.min(airAccel * targetSpeed * delta, addSpeed);
        this.playerVelocity.x += wishDir.x * accelSpeed;
        this.playerVelocity.z += wishDir.z * accelSpeed;
      }
    }

    // 5. Jump & Bunny Hop Mechanics
    const canJump = this.isGrounded || this.coyoteTimer > 0;
    if (this.jumpBufferTimer > 0 && canJump) {
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.playerVelocity.y = 11.4; // Controlled, comfortable jump height

      // Check for bunny hop combo (timing jump within 0.18s of landing)
      const timeSinceGrounded = performance.now() - this.lastGroundedTime;
      if (timeSinceGrounded < 200) {
        this.bhopCombo++;
        const bhopBoost = 1.05;
        const curHorizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
        if (curHorizSpeed < 24.0) {
          this.playerVelocity.x *= bhopBoost;
          this.playerVelocity.z *= bhopBoost;
        }
        sound.playBhop(this.bhopCombo);
        this.stats.bhopStreak = Math.max(this.stats.bhopStreak, this.bhopCombo);
        this.stats.rankPoints += 25;
      } else {
        this.bhopCombo = 1;
        sound.playJump();
      }

      this.isGrounded = false;
    }

    // 6. Gravity
    const gravity = 32.0;
    this.playerVelocity.y -= gravity * delta;

    // Terminal velocity
    if (this.playerVelocity.y < -50) {
      this.playerVelocity.y = -50;
    }

    // 7. Integrate Position & Check Collisions
    const nextPos = this.playerPos.clone().addScaledVector(this.playerVelocity, delta);
    this.resolveCollisions(nextPos);

    // 8. Pit / Void Death
    if (this.playerPos.y < -12) {
      this.triggerDeath();
      return;
    }

    // 9. Update Knife & Character Animations
    const horizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
    this.stats.currentSpeed = Math.round(horizSpeed * 10) / 10;
    if (this.stats.currentSpeed > this.stats.maxSpeed) {
      this.stats.maxSpeed = this.stats.currentSpeed;
    }

    const isMoving = horizSpeed > 1.0;
    // Authentic tactical boot footsteps on platforms
    if (this.isGrounded && isMoving) {
      this.footstepTimer += delta * (horizSpeed / 9.0);
      if (this.footstepTimer >= 0.38) {
        this.footstepTimer = 0;
        this.footstepLeft = !this.footstepLeft;
        sound.playFootstep(this.footstepLeft ? 'left' : 'right');
      }
    } else {
      this.footstepTimer = 0.2;
    }

    this.knifeManager.update(delta, isMoving, horizSpeed);
    this.character.updateAnimation(delta, isMoving, horizSpeed, this.isGrounded);

    // 10. Position Character & Camera
    this.character.group.position.copy(this.playerPos);
    this.character.group.rotation.y = this.yaw + Math.PI;

    if (this.cameraMode === 'first_person') {
      const eyeHeight = this.isSliding ? 0.9 : 1.65;
      this.camera.position.set(this.playerPos.x, this.playerPos.y + eyeHeight, this.playerPos.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    } else {
      // Third Person (Over the shoulder / Roblox chase cam)
      const dist = 3.6;
      const eyeHeight = 1.6;
      const targetPos = this.playerPos.clone().add(new THREE.Vector3(0, eyeHeight, 0));

      const camOffset = new THREE.Vector3(
        Math.sin(this.yaw) * dist * Math.cos(this.pitch),
        dist * Math.sin(-this.pitch) + 0.5,
        Math.cos(this.yaw) * dist * Math.cos(this.pitch)
      );

      this.camera.position.copy(targetPos).add(camOffset);
      this.camera.lookAt(targetPos);
    }
  }

  private resolveCollisions(nextPos: THREE.Vector3) {
    const playerRadius = 0.42;
    const playerHeight = this.isSliding ? 0.95 : 1.8;

    let onGround = false;

    // Platform & Hazard checks
    for (const plat of this.world.platforms) {
      // Check collision with player AABB
      const minX = plat.min.x - playerRadius;
      const maxX = plat.max.x + playerRadius;
      const minZ = plat.min.z - playerRadius;
      const maxZ = plat.max.z + playerRadius;
      const minY = plat.min.y - playerHeight;
      const maxY = plat.max.y;

      const collides =
        nextPos.x >= minX &&
        nextPos.x <= maxX &&
        nextPos.z >= minZ &&
        nextPos.z <= maxZ &&
        nextPos.y >= minY &&
        nextPos.y <= maxY;

      if (collides) {
        // 1. Hazard (Lava / Lasers)
        if (plat.isHazard) {
          if (plat.slideHazard && this.isSliding) {
            // Player successfully crouched under laser bar!
            continue;
          }
          this.triggerDeath();
          return;
        }

        // 2. Bounce Pad
        if (plat.isBouncePad) {
          this.playerVelocity.y = 26.0; // Launch high into the air!
          this.playerVelocity.z += 12.0; // Forward momentum
          sound.playBhop(4);
          this.isGrounded = false;
          continue;
        }

        // 3. Finish Pad
        if (plat.isFinish && !this.stats.gameCompleted) {
          this.triggerVictory();
          return;
        }

        // 4. Checkpoint Trigger
        if (plat.isCheckpoint && plat.checkpointId) {
          if (plat.checkpointId > this.stats.currentCheckpoint) {
            this.stats.currentCheckpoint = plat.checkpointId;
            this.stats.currentStage = plat.checkpointId;
            this.stats.rankPoints += 150;
            this.world.activateCheckpoint(plat.checkpointId);
            this.particles.spawnCheckpointBurst(plat.mesh.position);
            sound.playCheckpoint();
            this.callbacks.onCheckpointTrigger(
              plat.checkpointId,
              `Stage ${plat.checkpointId}`
            );
          }
        }

        // 5. Solid Platform Landing (Top surface)
        if (this.playerPos.y >= plat.max.y - 0.25 && this.playerVelocity.y <= 0) {
          nextPos.y = plat.max.y;
          this.playerVelocity.y = 0;
          onGround = true;
        } else {
          // Push out horizontally
          const overlapLeft = Math.abs(nextPos.x - minX);
          const overlapRight = Math.abs(maxX - nextPos.x);
          const overlapNear = Math.abs(nextPos.z - minZ);
          const overlapFar = Math.abs(maxZ - nextPos.z);
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapNear, overlapFar);

          if (minOverlap === overlapLeft) nextPos.x = minX;
          else if (minOverlap === overlapRight) nextPos.x = maxX;
          else if (minOverlap === overlapNear) nextPos.z = minZ;
          else nextPos.z = maxZ;
        }
      }
    }

    if (onGround && !this.isGrounded) {
      sound.playLand();
      this.particles.spawnLandingDust(nextPos, 16);
      this.lastGroundedTime = performance.now();
    }

    this.isGrounded = onGround;
    this.playerPos.copy(nextPos);
  }

  public triggerDeath() {
    this.stats.deaths++;
    this.bhopCombo = 0;
    this.stats.rankPoints = Math.max(0, this.stats.rankPoints - 30);
    sound.playDeath();
    this.respawnAtCurrentCheckpoint();
  }

  public respawnAtCurrentCheckpoint() {
    const cpPos = this.world.checkpointPositions.get(this.stats.currentCheckpoint);
    if (cpPos) {
      this.playerPos.copy(cpPos);
    } else {
      this.playerPos.set(0, 2, 0);
    }
    this.playerVelocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isSliding = false;
  }

  private triggerVictory() {
    this.stats.gameCompleted = true;
    this.stats.rankPoints += 1500; // Big bonus for completion!
    sound.playVictory();
    this.callbacks.onVictory(
      this.stats.elapsedSeconds,
      this.stats.deaths,
      this.stats.maxSpeed
    );
  }

  private updateStatsUI() {
    this.stats.isInspecting = this.knifeManager.animationState.isInspecting;
    this.stats.isSlashing = this.knifeManager.animationState.isSlashing;
    this.stats.isGrounded = this.isGrounded;
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  public restartGame() {
    this.stats.elapsedSeconds = 0;
    this.stats.currentStage = 1;
    this.stats.currentCheckpoint = 1;
    this.stats.deaths = 0;
    this.stats.maxSpeed = 0;
    this.stats.bhopStreak = 0;
    this.stats.gameCompleted = false;
    this.respawnAtCurrentCheckpoint();
  }
}

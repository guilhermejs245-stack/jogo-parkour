import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public scene: THREE.Scene;
  private particles: Particle[] = [];
  private pointsMesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  private maxParticles = 600;
  private positions: Float32Array;
  private colors: Float32Array;

  // Floating ambient atmospheric dust motes
  private dustPointsMesh: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Circle texture for soft volumetric particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.35,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.pointsMesh);

    // Floating ambient atmospheric sunbeam motes
    const dustCount = 300;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 80;
      dustPositions[i + 1] = Math.random() * 40;
      dustPositions[i + 2] = Math.random() * 600;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xfef08a,
      map: pTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dustPointsMesh = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustPointsMesh);
  }

  public spawnLandingDust(pos: THREE.Vector3, count = 16) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        position: new THREE.Vector3(pos.x, pos.y + 0.05, pos.z),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.4 + Math.random() * 1.2,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color(0xd4d4d8), // Concrete smoke dust
        size: 0.25 + Math.random() * 0.25,
        alpha: 0.7,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
      });
    }
  }

  public spawnKnifeSparks(pos: THREE.Vector3, dir: THREE.Vector3, count = 12) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const spread = (Math.random() - 0.5) * 1.5;
      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          dir.x * 4 + (Math.random() - 0.5) * 3,
          dir.y * 3 + Math.random() * 3,
          dir.z * 4 + (Math.random() - 0.5) * 3
        ),
        color: new THREE.Color(0xfef08a), // Golden friction sparks
        size: 0.18 + Math.random() * 0.15,
        alpha: 1.0,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
      });
    }
  }

  public spawnCheckpointBurst(pos: THREE.Vector3) {
    for (let i = 0; i < 40; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const up = 1.5 + Math.random() * 4.0;
      const rad = 2.0 + Math.random() * 3.5;
      this.particles.push({
        position: new THREE.Vector3(pos.x, pos.y + 0.5, pos.z),
        velocity: new THREE.Vector3(
          Math.cos(angle) * rad,
          up,
          Math.sin(angle) * rad
        ),
        color: new THREE.Color(0x34d399), // Emerald checkpoint glow
        size: 0.35 + Math.random() * 0.25,
        alpha: 0.9,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.5,
      });
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 7.0 * delta; // Gravity
      p.alpha = 1.0 - (p.life / p.maxLife);
    }

    // Update BufferGeometry
    let idx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.positions[idx * 3] = p.position.x;
      this.positions[idx * 3 + 1] = p.position.y;
      this.positions[idx * 3 + 2] = p.position.z;

      this.colors[idx * 3] = p.color.r * p.alpha;
      this.colors[idx * 3 + 1] = p.color.g * p.alpha;
      this.colors[idx * 3 + 2] = p.color.b * p.alpha;
      idx++;
    }

    // Clear unused buffer vertices
    for (let i = idx; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -9999;
      this.positions[i * 3 + 2] = 0;
      this.colors[i * 3] = 0;
      this.colors[i * 3 + 1] = 0;
      this.colors[i * 3 + 2] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}

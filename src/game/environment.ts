import * as THREE from 'three';

/**
 * Generates a realistic atmospheric sky & environment reflection map
 * with Rayleigh atmospheric gradient, warm golden sun glow, and ground bounce.
 * This gives all metal knife blades (Fade, Doppler, Tiger Tooth, Case Hardened)
 * authentic CS2-level reflections and specular glints!
 */
export function createRealisticEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Sky atmospheric gradient (deep cobalt zenith down to warm golden sunset horizon)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
  skyGrad.addColorStop(0.0, '#0c4a6e'); // Deep high-altitude cyan/slate
  skyGrad.addColorStop(0.3, '#0284c7'); // Azure sky
  skyGrad.addColorStop(0.6, '#38bdf8'); // Bright sky blue
  skyGrad.addColorStop(0.85, '#bae6fd'); // Atmospheric haze
  skyGrad.addColorStop(1.0, '#fed7aa'); // Warm sunset horizon amber
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1024, 320);

  // 2. Sun Glow & Corona
  const sunX = 720;
  const sunY = 160;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 260);
  sunGrad.addColorStop(0.0, '#ffffff');
  sunGrad.addColorStop(0.15, '#fef08a');
  sunGrad.addColorStop(0.4, 'rgba(251, 146, 60, 0.45)');
  sunGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0.15)');
  sunGrad.addColorStop(1.0, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, 1024, 320);

  // 3. Ground / Horizon reflection bounce
  const groundGrad = ctx.createLinearGradient(0, 320, 0, 512);
  groundGrad.addColorStop(0.0, '#1e293b'); // Horizon line
  groundGrad.addColorStop(0.2, '#0f172a'); // Distant mountains
  groundGrad.addColorStop(0.6, '#020617'); // Dark abyss floor
  groundGrad.addColorStop(1.0, '#000000');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 320, 1024, 192);

  // 4. Distant mountain silhouette along the horizon
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, 320);
  for (let x = 0; x <= 1024; x += 32) {
    const h = Math.sin(x * 0.015) * 22 + Math.cos(x * 0.035) * 14 + 312;
    ctx.lineTo(x, h);
  }
  ctx.lineTo(1024, 350);
  ctx.lineTo(0, 350);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  scene.environment = texture;
  return texture;
}

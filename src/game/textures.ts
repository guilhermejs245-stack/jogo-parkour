import * as THREE from 'three';
import { KnifeSkinId } from '../types/game';

// Cache generated textures so we don't recreate them every frame
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getKnifeTexture(skinId: KnifeSkinId): THREE.CanvasTexture {
  if (textureCache.has(skinId)) {
    return textureCache.get(skinId)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  switch (skinId) {
    case 'fade': {
      // Authentic CS:GO Fade finish (80-100% Fade: Amber Yellow -> Vivid Pink/Magenta -> Deep Purple -> Royal Blue/Cyan tip)
      const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
      grad.addColorStop(0.0, '#fef08a');   // Pure bright gold highlight
      grad.addColorStop(0.2, '#f59e0b');   // Warm amber
      grad.addColorStop(0.42, '#e11d48');  // Carmine rose
      grad.addColorStop(0.62, '#db2777');  // Deep magenta
      grad.addColorStop(0.78, '#9333ea');  // Imperial purple
      grad.addColorStop(0.92, '#2563eb');  // Royal blue
      grad.addColorStop(1.0, '#06b6d4');   // Pure cyan tip
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Micro-finish horizontal directional brushed satin steel grain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 1024; i += 2) {
        ctx.fillRect(0, i, 1024, 1);
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      for (let i = 1; i < 1024; i += 4) {
        ctx.fillRect(0, i, 1024, 1);
      }

      // Mirror-finish cutting edge highlight
      const edgeGrad = ctx.createLinearGradient(0, 950, 0, 1024);
      edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      edgeGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.85)');
      edgeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(0, 950, 1024, 74);
      break;
    }

    case 'doppler': {
      // Doppler Phase 2 ("Pink Galaxy" / Ruby nebula gloss)
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 1024, 1024);

      // Deep galactic smoke nebula
      const rad1 = ctx.createRadialGradient(450, 480, 50, 450, 480, 550);
      rad1.addColorStop(0.0, '#f43f5e');  // Ruby pink
      rad1.addColorStop(0.35, '#9f1239'); // Wine ruby
      rad1.addColorStop(0.7, '#1e1b4b');  // Deep cosmic indigo
      rad1.addColorStop(1.0, '#09090b');  // Void black
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, 1024, 1024);

      // Swirling marble nebula filaments
      for (let i = 0; i < 24; i++) {
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(251, 113, 133, 0.28)' : 'rgba(168, 85, 247, 0.22)';
        ctx.lineWidth = 14 + (i % 5) * 8;
        ctx.beginPath();
        const startX = Math.sin(i) * 350 + 512;
        const startY = Math.cos(i * 1.3) * 350 + 512;
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
          startX + 180, startY - 120,
          startX - 180, startY + 220,
          startX + (i * 30 - 250), startY + 400
        );
        ctx.stroke();
      }

      // Chrome edge bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 980, 1024, 44);
      break;
    }

    case 'tiger_tooth': {
      // Metallic 24K yellow gold with dark hand-cut tiger scratch stripes
      const baseGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
      baseGrad.addColorStop(0, '#fef08a'); // High luster gold
      baseGrad.addColorStop(0.3, '#f59e0b');
      baseGrad.addColorStop(0.7, '#d97706');
      baseGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Anodized circular micro-brush reflections
      for (let r = 200; r < 900; r += 80) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(512, 512, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Realistic sharp tiger stripes
      ctx.fillStyle = '#171717';
      const stripeCount = 10;
      for (let i = 0; i < stripeCount; i++) {
        const startX = 80 + i * 95;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.quadraticCurveTo(startX + 60, 300, startX + 25, 550);
        ctx.quadraticCurveTo(startX + 80, 800, startX + 40, 1024);
        ctx.lineTo(startX + 18, 1024);
        ctx.quadraticCurveTo(startX + 45, 800, startX, 550);
        ctx.quadraticCurveTo(startX + 35, 300, startX - 25, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Polished bevel cutting edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(0, 970, 1024, 54);
      break;
    }

    case 'crimson_web': {
      // Deep lacquer carmine-red
      const redGrad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
      redGrad.addColorStop(0, '#dc2626');
      redGrad.addColorStop(0.65, '#991b1b');
      redGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = redGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Realistic high-density cobwebs
      const webCenters = [
        { x: 300, y: 320, rings: 10 },
        { x: 780, y: 680, rings: 12 },
        { x: 180, y: 840, rings: 8 },
      ];

      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.8;

      webCenters.forEach(c => {
        // Spokes
        const numSpokes = 16;
        for (let i = 0; i < numSpokes; i++) {
          const angle = (i / numSpokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x + Math.cos(angle) * 520, c.y + Math.sin(angle) * 520);
          ctx.stroke();
        }

        // Web spiral threads
        for (let r = 25; r < 480; r += 36) {
          ctx.beginPath();
          for (let i = 0; i <= numSpokes; i++) {
            const angle = (i / numSpokes) * Math.PI * 2;
            const rx = c.x + Math.cos(angle) * r;
            const ry = c.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.stroke();
        }
      });

      // Subtle edge wear
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(0, 985, 1024, 39);
      break;
    }

    case 'case_hardened': {
      // Golden brass tempered steel base with Tier-1 Blue Gem patches
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, 0, 1024, 1024);

      // Golden heat stain
      const brassGrad = ctx.createLinearGradient(0, 0, 1024, 0);
      brassGrad.addColorStop(0, '#ca8a04');
      brassGrad.addColorStop(0.5, '#eab308');
      brassGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = brassGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // High-grade electric blue temper spots (Blue Gem)
      const patches = [
        { x: 420, y: 340, r: 360, col: '#0284c7' },
        { x: 560, y: 460, r: 280, col: '#38bdf8' },
        { x: 740, y: 780, r: 320, col: '#0369a1' },
        { x: 220, y: 820, r: 240, col: '#2563eb' },
      ];

      patches.forEach(p => {
        const patchGrad = ctx.createRadialGradient(p.x, p.y, p.r * 0.15, p.x, p.y, p.r);
        patchGrad.addColorStop(0, p.col);
        patchGrad.addColorStop(0.55, '#2563eb');
        patchGrad.addColorStop(0.75, '#7c3aed'); // Purple heat edge
        patchGrad.addColorStop(0.9, '#ca8a04');  // Golden transition
        patchGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = patchGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Brushed chrome edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(0, 975, 1024, 49);
      break;
    }

    case 'hyper_beast': {
      // Cyberpunk psychedelic monster mouth
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1024, 1024);

      // Fluorescent stripes
      const colors = ['#06b6d4', '#ec4899', '#a855f7', '#22c55e', '#f97316'];
      colors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(idx * 210, 0);
        ctx.lineTo(idx * 210 + 260, 0);
        ctx.lineTo(idx * 160, 1024);
        ctx.lineTo(idx * 160 - 260, 1024);
        ctx.closePath();
        ctx.fill();
      });

      // Monster teeth / sharp cuts
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(90 + i * 105, 380);
        ctx.lineTo(135 + i * 105, 620);
        ctx.lineTo(180 + i * 105, 380);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'asiimov': {
      // Clean sci-fi white with orange and black accents
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1024, 1024);

      // Hi-vis safety orange diagonal bands
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(220, 0);
      ctx.lineTo(500, 0);
      ctx.lineTo(300, 1024);
      ctx.lineTo(0, 1024);
      ctx.closePath();
      ctx.fill();

      // Black tech stripes
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(560, 0);
      ctx.lineTo(660, 0);
      ctx.lineTo(460, 1024);
      ctx.lineTo(360, 1024);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(720, 240, 240, 32);
      ctx.fillRect(720, 320, 160, 32);
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(skinId, texture);
  return texture;
}

// Procedural Carbon Fiber / G10 Handle Texture for extreme knife realism
export function getG10HandleTexture(): THREE.CanvasTexture {
  const cacheKey = 'handle_g10_carbon';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b'; // Charcoal base
  ctx.fillRect(0, 0, 512, 512);

  // Carbon weave twill pattern
  const tileSize = 16;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#27272a' : '#1c1917';
      ctx.fillRect(x, y, tileSize, tileSize);

      // Diagonal weave threads
      ctx.fillStyle = isAlt ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + tileSize, y + tileSize);
      ctx.lineTo(x + tileSize - 3, y + tileSize);
      ctx.lineTo(x, y + 3);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getRobloxFaceTexture(faceType: string): THREE.CanvasTexture {
  const cacheKey = `face_${faceType}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  if (faceType === 'epic') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(128, 140, 60, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(128, 175, 30, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(85, 90, 18, 0, Math.PI * 2);
    ctx.arc(171, 90, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 85, 6, 0, Math.PI * 2);
    ctx.arc(166, 85, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (faceType === 'chill') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(50, 75, 70, 36);
    ctx.fillRect(136, 75, 70, 36);
    ctx.fillRect(115, 85, 26, 8);

    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(55, 80, 20, 24);
    ctx.fillRect(141, 80, 20, 24);

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(140, 150, 32, 0.1, Math.PI * 0.7);
    ctx.stroke();
  } else if (faceType === 'determined') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(60, 85);
    ctx.lineTo(105, 98);
    ctx.lineTo(65, 105);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(196, 85);
    ctx.lineTo(151, 98);
    ctx.lineTo(191, 105);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(100, 160);
    ctx.lineTo(156, 160);
    ctx.stroke();
  } else {
    // Classic Roblox Smile
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(82, 92, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(174, 92, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 126, 45, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getShirtTexture(shirtId: string): THREE.CanvasTexture {
  const cacheKey = `shirt_${shirtId}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  switch (shirtId) {
    case 'guest666':
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('666', 128, 140);
      break;

    case 'csgo_t':
      ctx.fillStyle = '#3f4f34';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#22281e';
      ctx.fillRect(30, 20, 50, 216);
      ctx.fillRect(176, 20, 50, 216);
      ctx.fillRect(70, 110, 116, 30);
      break;

    case 'csgo_ct':
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 40, 176, 176);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POLICE', 128, 140);
      break;

    case 'hyper_beast_shirt':
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#ec4899');
      grad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      break;

    case 'gold_vip':
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 36px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIP ★', 128, 140);
      break;

    default:
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(100, 90, 56, 76);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(116, 106, 24, 24);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

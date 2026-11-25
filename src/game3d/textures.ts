import * as THREE from 'three';

export function createGroundTextures(maxAnisotropy: number) {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base dark Scosglen peat/moss earth
  cCtx.fillStyle = '#1b1d17';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#707070';
  bCtx.fillRect(0, 0, size, size);

  // Deterministic pseudo-random mottling for moss, damp soil, and slate pebbles
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 2400; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 3 + rand() * 14;
    const pick = rand();
    if (pick < 0.45) {
      cCtx.fillStyle = `rgba(34, 42, 26, ${0.15 + rand() * 0.25})`; // damp forest moss
      bCtx.fillStyle = `rgba(160, 160, 160, 0.18)`;
    } else if (pick < 0.8) {
      cCtx.fillStyle = `rgba(22, 18, 15, ${0.2 + rand() * 0.3})`; // dark mud
      bCtx.fillStyle = `rgba(60, 60, 60, 0.22)`;
    } else {
      cCtx.fillStyle = `rgba(54, 53, 50, ${0.14 + rand() * 0.2})`; // weathered stone fleck
      bCtx.fillStyle = `rgba(215, 215, 215, 0.22)`;
    }
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Subtle carved stone ritual ring grooves
  cCtx.strokeStyle = 'rgba(70, 74, 65, 0.22)';
  cCtx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const x1 = rand() * size;
    const y1 = rand() * size;
    cCtx.beginPath();
    cCtx.moveTo(x1, y1);
    cCtx.lineTo(x1 + (rand() - 0.5) * 40, y1 + (rand() - 0.5) * 40);
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 14);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(14, 14);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createStoneTexture(maxAnisotropy: number) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#383633';
  ctx.fillRect(0, 0, size, size);

  let seed = 4201;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 2 + rand() * 8;
    const shade = Math.floor(38 + rand() * 42);
    ctx.fillStyle = `rgba(${shade}, ${shade - 2}, ${shade - 4}, 0.35)`;
    ctx.fillRect(x, y, w, w * 0.7);
  }

  // Carved glowing teal/amber hairline rune cracks
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(32, 40);
  ctx.lineTo(72, 110);
  ctx.lineTo(54, 180);
  ctx.moveTo(160, 20);
  ctx.lineTo(190, 95);
  ctx.lineTo(145, 210);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

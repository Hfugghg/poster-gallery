import * as THREE from 'three';
import type { FrameDefinition } from './frameCatalog';

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), u), THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}

function canvasTexture(pixels: Uint8ClampedArray, size: number, color: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器无法创建边框纹理。');
  const image = ctx.createImageData(size, size);
  image.data.set(pixels);
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return texture;
}

/** Generate only the selected material; no remote images or per-frame work. */
export function makeFrameTextures(frame: FrameDefinition) {
  const size = frame.id === 'bronze' ? 1024 : 512;
  const color = new Uint8ClampedArray(size * size * 4);
  const bump = new Uint8ClampedArray(size * size * 4);
  const rough = new Uint8ClampedArray(size * size * 4);
  // Read CSS channels directly: CanvasTexture expects sRGB-encoded bytes.
  const rgb = [1, 3, 5].map(start => parseInt(frame.color.slice(start, start + 2), 16));
  const wood = frame.id === 'walnut' || frame.id === 'oak';
  for (let y = 0; y < size; y++) {
    const stripHeight = size/4;
    const rail = Math.floor(y/stripHeight);
    const across = (y%stripHeight)*512/stripHeight;
    // Each atlas strip is an independently seeded, non-repeating rail.
    const seed = rail*97.31 + (frame.id === 'walnut' ? 17 : 53);
    for (let x = 0; x < size; x++) {
      const fine = hash(x, y) - .5;
      let shade = 1, height = .5, roughness = .91;
      if (wood) {
        // Irregular long fibres, not periodic stripes: slow domain warping
        // changes growth direction while higher octaves add restrained pores.
        const warp = (noise(x/230 + seed,across/130) - .5)*43
          + (noise(x/105 + seed,across/68) - .5)*12;
        const grainY = across + warp;
        const growth = noise(x/300 + seed,grainY/19);
        const fibres = noise(x/155 + seed,grainY/3.3);
        const pores = Math.max(0,noise(x/95 + seed,grainY/1.5) - .77);
        const cloud = noise(x/190 + seed,across/135) - .5;
        const contrast = frame.id === 'walnut' ? .16 : .11;
        shade = .985 + (growth - .5)*contrast + (fibres - .5)*.052 + cloud*.04 - pores*.07 + fine*.012;
        height = .5 + (fibres - .5)*.035 - pores*.035 + fine*.012;
        roughness = .89 + (growth - .5)*.035 + pores*.04;
      } else if (frame.id === 'travertine') {
        const warp = noise(x/160+seed,across/95)*17;
        const layers = noise(x/170+seed,(across+warp)/28);
        const pore = Math.max(0, (noise(x/6+seed,across/6) - .7)/.3);
        shade = .95 + (layers-.5)*.11 - pore*.2 + fine*.018;
        height = .55 + (layers-.5)*.025 - pore*.24 + fine*.025;
        roughness = .89 + pore*.07;
      } else if (frame.id === 'marble') {
        const flow = noise(x/150+seed,across/140)*74;
        const stone = noise(x/115+seed,(across+flow)/125);
        const vein = Math.exp(-Math.pow((stone-.47)*42,2));
        const faint = noise(x/65+seed,across/90);
        shade = .985 + (faint-.5)*.045 - vein*.17;
        height = .5 + fine*.012 - vein*.015;
        roughness = .86 + vein*.055;
      } else if (frame.id === 'bronze') {
        const hammer = noise(x/10+seed,across/9);
        const chasing = noise(x/2.8+seed,across/2.4)-.5;
        const patina = Math.max(0,noise(x/125+seed,across/45)-.56);
        shade = 1.04 + (hammer-.5)*.14 - patina*.5 + chasing*.035;
        height = .5 + (hammer-.5)*.2 + chasing*.09;
        roughness = .8 + patina*.32 + (hammer-.5)*.07;
      } else {
        const warp = noise(x/190+seed,across/80)*5;
        const brush = noise(x/100+seed,(across+warp)/2.4)-.5;
        const cloud = noise(x/140+seed,across/100)-.5;
        shade = 1 + brush*(frame.id === 'silver' ? .027 : .014) + cloud*.018 + fine*.008;
        height = .5 + brush*.06 + fine*.012;
        roughness = .9 + brush*.04 + cloud*.025;
      }
      const offset = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        color[offset + channel] = THREE.MathUtils.clamp(rgb[channel] * shade, 0, 255);
        bump[offset + channel] = THREE.MathUtils.clamp(height * 255, 0, 255);
        rough[offset + channel] = THREE.MathUtils.clamp(roughness * 255, 0, 255);
      }
      color[offset + 3] = bump[offset + 3] = rough[offset + 3] = 255;
    }
  }
  const map = canvasTexture(color, size, true);
  const bumpMap = canvasTexture(bump, size, false);
  const roughnessMap = canvasTexture(rough, size, false);
  return { map, bumpMap, roughnessMap, dispose() { map.dispose(); bumpMap.dispose(); roughnessMap.dispose(); } };
}

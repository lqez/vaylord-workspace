/**
 * Headless three.js 3D renderer for vaylord-world-creator worlds.
 *
 * Produces real WebGL renders WITHOUT a GPU — software rendering via `gl`
 * (headless-gl) under a virtual X display (`Xvfb`). three is pinned to r149
 * because headless-gl only provides a WebGL1 context (three >= r163 requires
 * WebGL2). It draws the *actual* generated terrain (height mesh + per-vertex
 * biome colour, with roads darkened from world.roadField) so we can attach
 * verification screenshots to workspace issues even in a browserless session.
 *
 * Usage (from this directory), with a vaylord-world-creator checkout as a sibling
 * of the vaylord-workspace clone (the default session layout):
 *   npm install
 *   npm run render -- 42 7 99
 *
 * The world-creator source is bundled by esbuild at build time from the relative
 * path below; point it elsewhere by editing these two imports or adding an
 * esbuild alias. Output: ./out/scene3d_<seed>.png
 */
import * as THREE from "three";
import createGL from "gl";
import * as zlib from "node:zlib";
import * as fs from "node:fs";
import { generateWorld, DEFAULT_PARAMS } from "../../../vaylord-world-creator/src/core/world";
import { BIOME_COLORS } from "../../../vaylord-world-creator/src/core/biome";

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b: Buffer): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function writePNG(file: string, W: number, H: number, rgba: Uint8Array): void {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) { raw[y * (1 + W * 3)] = 0; for (let x = 0; x < W; x++) { const s = (y * W + x) * 4, d = y * (1 + W * 3) + 1 + x * 3; raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2]; } }
  const idat = zlib.deflateSync(raw); const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const mk = (t: string, dz: Buffer): Buffer => { const l = Buffer.alloc(4); l.writeUInt32BE(dz.length); const ty = Buffer.from(t); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([ty, dz]))); return Buffer.concat([l, ty, dz, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([sig, mk("IHDR", ihdr), mk("IDAT", idat), mk("IEND", Buffer.alloc(0))]));
}

function renderSeed(seed: number, outfile: string): void {
  const N = 512;
  const w = generateWorld({ ...DEFAULT_PARAMS, seed, gridW: N, gridH: N, cellSize: 4096 / (N - 1) });
  const h = w.height.data, b = w.biome, rf = w.roadField!, sea = w.params.seaLevel, hs = w.params.heightScale, cs = w.params.cellSize;
  const W = 960, H = 600;
  const gl = createGL(W, H, { preserveDrawingBuffer: true });
  const canvas: any = { width: W, height: H, addEventListener() {}, removeEventListener() {}, getContext() { return gl; }, style: {} };
  const renderer = new THREE.WebGLRenderer({ context: gl as any, canvas, antialias: true });
  renderer.setSize(W, H, false); renderer.shadowMap.enabled = false;
  (renderer as any).outputEncoding = (THREE as any).sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9ec7e8);

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * N * 3), col = new Float32Array(N * N * 3);
  const c = new THREE.Color();
  for (let gy = 0, vi = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++, vi++) {
    const i = gy * N + gx;
    pos[vi * 3] = gx * cs; pos[vi * 3 + 1] = h[i] * hs; pos[vi * 3 + 2] = gy * cs;
    c.setHex(BIOME_COLORS[b[i]] ?? 0x808080); c.convertSRGBToLinear();
    let r = c.r, g = c.g, bl = c.b; const rd = rf[i];
    if (rd > 0.01) { const m = Math.min(1, rd * 1.15); r = r * (1 - m) + 0.32 * m; g = g * (1 - m) + 0.26 * m; bl = bl * (1 - m) + 0.19 * m; }
    col[vi * 3] = r; col[vi * 3 + 1] = g; col[vi * 3 + 2] = bl;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const idx: number[] = [];
  for (let r = 0; r < N - 1; r++) for (let cc = 0; cc < N - 1; cc++) { const a = r * N + cc, bb = a + 1, d = a + N, e = d + 1; idx.push(a, d, bb, bb, d, e); }
  geo.setIndex(idx); geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })));

  const ext = 4096;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(ext * 1.3, ext * 1.3), new THREE.MeshStandardMaterial({ color: 0x2b6c8f, transparent: true, opacity: 0.72, roughness: 0.3, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(ext / 2, sea * hs + 0.5, ext / 2); scene.add(water);
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.7); sun.position.set(-1, 1.4, 0.6); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8aa6c4, 0.28));
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x4a3e2c, 0.35));

  const cam = new THREE.PerspectiveCamera(42, W / H, 1, 20000);
  const ctr = ext / 2;
  cam.position.set(ctr - ext * 0.18, hs * 1.5 + ext * 0.55, ctr + ext * 0.92);
  cam.lookAt(ctr, hs * 0.25, ctr);
  renderer.render(scene, cam);

  const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const flip = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) flip.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
  writePNG(outfile, W, H, flip);
  console.log("wrote", outfile);
}

fs.mkdirSync("out", { recursive: true });
const seeds = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
for (const s of (seeds.length ? seeds : [42])) renderSeed(s, `out/scene3d_${s}.png`);

#!/usr/bin/env node
// Converts selected .glb models (single node, single embedded PNG texture)
// into .obj + .png pairs under labsim/assets/<outdir>/, ready for
// build-assets.mjs. Usage:
//   node labsim/tools/convert-glb.mjs <outdir> <file.glb> [more.glb ...]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

// minimal N×1 RGB PNG encoder (for baking material colors into a palette)
function palettePng(colors) {
  const n = colors.length;
  const crcTable = [...Array(256)].map((_, k) => {
    let c = k;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4);
    data.copy(out, 8);
    out.writeUInt32BE(crc(Buffer.concat([Buffer.from(type), data])), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0); ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; ihdr[9] = 2;                       // 8-bit RGB
  const raw = Buffer.alloc(1 + n * 3);            // filter byte + pixels
  colors.forEach((c, i) => { raw[1 + i * 3] = c[0]; raw[2 + i * 3] = c[1]; raw[3 + i * 3] = c[2]; });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [outdir, ...files] = process.argv.slice(2);
if (!outdir || !files.length) { console.error('usage: convert-glb.mjs <outdir> <file.glb>...'); process.exit(1); }
const out = join(root, 'assets', outdir);
mkdirSync(out, { recursive: true });

function readGlb(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('not glb: ' + path);
  const jlen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jlen).toString());
  let bin = null, off = 20 + jlen;
  while (off < buf.length) {
    const clen = buf.readUInt32LE(off), ctype = buf.readUInt32LE(off + 4);
    if (ctype === 0x004E4942) bin = buf.slice(off + 8, off + 8 + clen);
    off += 8 + clen;
  }
  return { json, bin };
}
function accessor(j, bin, i) {
  const a = j.accessors[i], bv = j.bufferViews[a.bufferView];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const n = { VEC3: 3, VEC2: 2, SCALAR: 1 }[a.type];
  const Arr = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array }[a.componentType];
  const stride = bv.byteStride || n * Arr.BYTES_PER_ELEMENT;
  const outArr = new (a.componentType === 5126 ? Float32Array : Uint32Array)(a.count * n);
  for (let e = 0; e < a.count; e++) {
    const view = new Arr(bin.buffer, bin.byteOffset + start + e * stride, n);
    for (let c = 0; c < n; c++) outArr[e * n + c] = view[c];
  }
  return outArr;
}
// column-major 4x4 from TRS
function nodeMatrix(nd) {
  const t = nd.translation || [0, 0, 0], s = nd.scale || [1, 1, 1], q = nd.rotation || [0, 0, 0, 1];
  const [x, y, z, w] = q;
  const r = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w),
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w),
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)];
  return v => [
    r[0] * s[0] * v[0] + r[3] * s[1] * v[1] + r[6] * s[2] * v[2] + t[0],
    r[1] * s[0] * v[0] + r[4] * s[1] * v[1] + r[7] * s[2] * v[2] + t[1],
    r[2] * s[0] * v[0] + r[5] * s[1] * v[1] + r[8] * s[2] * v[2] + t[2]];
}

for (const f of files) {
  const { json: j, bin } = readGlb(f);
  const name = basename(f, '.glb').replace(/\s+/g, '_');
  const nImages = (j.images || []).length;
  let baked = null;                 // material index -> palette slot, when baking colors
  if (nImages === 1) {
    const iv = j.bufferViews[j.images[0].bufferView];
    writeFileSync(join(out, name + '.png'), bin.slice(iv.byteOffset || 0, (iv.byteOffset || 0) + iv.byteLength));
  } else if (nImages === 0) {
    // untextured: bake each material's baseColorFactor into an N×1 palette PNG
    const mats = j.materials || [{}];
    const colors = mats.map(m => {
      const c = (m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorFactor) || [1, 1, 1, 1];
      const srgb = v => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2));
      return [srgb(c[0]), srgb(c[1]), srgb(c[2])];
    });
    writeFileSync(join(out, name + '.png'), palettePng(colors));
    baked = colors.length;
  } else { console.error(`SKIP ${name}: ${nImages} images (need 0 or 1)`); continue; }
  let obj = '', vBase = 1;
  for (const nd of j.nodes) {
    if (nd.mesh === undefined) continue;
    const xf = nodeMatrix(nd);
    for (const prim of j.meshes[nd.mesh].primitives) {
      const pos = accessor(j, bin, prim.attributes.POSITION);
      const uv = !baked && prim.attributes.TEXCOORD_0 !== undefined ? accessor(j, bin, prim.attributes.TEXCOORD_0) : null;
      const ix = prim.indices !== undefined ? accessor(j, bin, prim.indices) : null;
      const nv = pos.length / 3;
      const slotU = baked ? ((prim.material || 0) + 0.5) / baked : 0;
      for (let v = 0; v < nv; v++) {
        const p = xf([pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]);
        obj += `v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}\n`;
        obj += baked ? `vt ${slotU.toFixed(4)} 0.5\n`
          : uv ? `vt ${uv[v * 2].toFixed(4)} ${(1 - uv[v * 2 + 1]).toFixed(4)}\n` : 'vt 0 0\n';
      }
      const idx = ix || Uint32Array.from({ length: nv }, (_, k) => k);
      for (let t = 0; t < idx.length; t += 3)
        obj += `f ${vBase + idx[t]}/${vBase + idx[t]} ${vBase + idx[t + 1]}/${vBase + idx[t + 1]} ${vBase + idx[t + 2]}/${vBase + idx[t + 2]}\n`;
      vBase += nv;
    }
  }
  writeFileSync(join(out, name + '.obj'), obj);
  console.log(`ok ${name}${baked ? ' (baked ' + baked + ' colors)' : ''} (${(obj.length / 1024).toFixed(0)} KB obj)`);
}

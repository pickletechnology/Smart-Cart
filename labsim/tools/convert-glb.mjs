#!/usr/bin/env node
// Converts selected .glb models (single node, single embedded PNG texture)
// into .obj + .png pairs under labsim/assets/<outdir>/, ready for
// build-assets.mjs. Usage:
//   node labsim/tools/convert-glb.mjs <outdir> <file.glb> [more.glb ...]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  if ((j.images || []).length !== 1) { console.error(`SKIP ${name}: ${j.images ? j.images.length : 0} images (need 1)`); continue; }
  const iv = j.bufferViews[j.images[0].bufferView];
  writeFileSync(join(out, name + '.png'), bin.slice(iv.byteOffset || 0, (iv.byteOffset || 0) + iv.byteLength));
  let obj = '', vBase = 1;
  for (const nd of j.nodes) {
    if (nd.mesh === undefined) continue;
    const xf = nodeMatrix(nd);
    for (const prim of j.meshes[nd.mesh].primitives) {
      const pos = accessor(j, bin, prim.attributes.POSITION);
      const uv = prim.attributes.TEXCOORD_0 !== undefined ? accessor(j, bin, prim.attributes.TEXCOORD_0) : null;
      const ix = prim.indices !== undefined ? accessor(j, bin, prim.indices) : null;
      const nv = pos.length / 3;
      for (let v = 0; v < nv; v++) {
        const p = xf([pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]);
        obj += `v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}\n`;
        obj += uv ? `vt ${uv[v * 2].toFixed(4)} ${(1 - uv[v * 2 + 1]).toFixed(4)}\n` : 'vt 0 0\n';
      }
      const idx = ix || Uint32Array.from({ length: nv }, (_, k) => k);
      for (let t = 0; t < idx.length; t += 3)
        obj += `f ${vBase + idx[t]}/${vBase + idx[t]} ${vBase + idx[t + 1]}/${vBase + idx[t + 1]} ${vBase + idx[t + 2]}/${vBase + idx[t + 2]}\n`;
      vBase += nv;
    }
  }
  writeFileSync(join(out, name + '.obj'), obj);
  console.log(`ok ${name} (${(obj.length / 1024).toFixed(0)} KB obj)`);
}

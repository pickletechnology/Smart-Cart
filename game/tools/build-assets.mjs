#!/usr/bin/env node
// Build tool: parses the OBJ assets in game/assets/ into compact quantized
// mesh data + base64 textures, and splices the result into game/index.html
// between the ASSETS_START/ASSETS_END markers. Re-run after adding assets:
//   node game/tools/build-assets.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseObj(path) {
  const src = readFileSync(path, 'utf8');
  const vs = [], vts = [];
  const key2idx = new Map();
  const p = [], uv = [], ix = [];
  let bb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  const vert = (vi, ti) => {
    const k = vi + '/' + ti;
    let idx = key2idx.get(k);
    if (idx === undefined) {
      idx = p.length / 3;
      key2idx.set(k, idx);
      const v = vs[vi];
      p.push(Math.round(v[0] * 1000), Math.round(v[1] * 1000), Math.round(v[2] * 1000));
      const t = ti >= 0 && vts[ti] ? vts[ti] : [0, 0];
      uv.push(Math.round(t[0] * 10000), Math.round(t[1] * 10000));
    }
    return idx;
  };
  for (const line of src.split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') {
      const v = [ +parts[1], +parts[2], +parts[3] ];
      vs.push(v);
      for (let i = 0; i < 3; i++) { bb[i] = Math.min(bb[i], v[i]); bb[i + 3] = Math.max(bb[i + 3], v[i]); }
    } else if (parts[0] === 'vt') {
      vts.push([ +parts[1], +parts[2] ]);
    } else if (parts[0] === 'f') {
      const refs = parts.slice(1).map(r => {
        const bits = r.split('/');
        let vi = +bits[0]; vi = vi < 0 ? vs.length + vi : vi - 1;
        let ti = bits[1] ? +bits[1] : 0; ti = ti < 0 ? vts.length + ti : ti - 1;
        return [vi, ti];
      });
      for (let i = 2; i < refs.length; i++) { // fan triangulation
        ix.push(vert(...refs[0]), vert(...refs[i - 1]), vert(...refs[i]));
      }
    }
  }
  bb = bb.map(v => Math.round(v * 1000));
  return { p, uv, ix, bb };
}

const b64 = path => 'data:image/png;base64,' + readFileSync(path).toString('base64');

const meshes = {}, tex = {};

// ── KayKit pack: one shared atlas ──
const kk = join(root, 'assets/kaykit');
tex.kaykit = b64(join(kk, 'citybits_texture.png'));
for (const f of readdirSync(kk).filter(f => f.endsWith('.obj')).sort()) {
  const name = basename(f, '.obj');
  meshes[name] = { ...parseObj(join(kk, f)), tex: 'kaykit' };
}

// ── Voxel buildings: per-model palette textures ──
const vx = join(root, 'assets/voxel');
for (const f of readdirSync(vx).filter(f => f.endsWith('.obj')).sort()) {
  const name = 'vox_' + basename(f, '.obj');
  tex[name] = b64(join(vx, basename(f, '.obj') + '.png'));
  meshes[name] = { ...parseObj(join(vx, f)), tex: name };
}

const totalTris = Object.values(meshes).reduce((a, m) => a + m.ix.length / 3, 0);
const payload = 'const ASSETS = ' + JSON.stringify({ tex, meshes }) + ';';
console.log(`assets: ${Object.keys(meshes).length} meshes, ${Math.round(totalTris)} tris, payload ${(payload.length / 1e6).toFixed(2)} MB`);

// ── Splice into index.html ──
const htmlPath = join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const START = '/*ASSETS_START*/', END = '/*ASSETS_END*/';
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) { console.error('markers not found in index.html'); process.exit(1); }
writeFileSync(htmlPath, html.slice(0, a + START.length) + '\n' + payload + '\n' + html.slice(b));
console.log('spliced into game/index.html');

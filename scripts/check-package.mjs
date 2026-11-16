import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const kit = path.join(root, 'package-kit');
const manifest = JSON.parse(await readFile(path.join(kit, 'package.json'), 'utf8'));
assert.equal(manifest.license,'MIT','Component package must declare its license.');
for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md']){
  const original=await readFile(path.join(root,name),'utf8');
  assert.equal(await readFile(path.join(kit,name),'utf8'),original,`Package must preserve ${name} verbatim.`);
}
function resolveEntry(relative) {
  assert.equal(typeof relative, 'string', 'Package entry must be declared.');
  const resolved = path.resolve(kit, relative);
  assert.ok(resolved.startsWith(`${kit}${path.sep}`), 'Package entry must remain within package-kit/.');
  return resolved;
}
const entry = resolveEntry(manifest.exports?.['.']?.import);
const types = resolveEntry(manifest.exports?.['.']?.types);
for (const target of [entry, types, resolveEntry(manifest.main), resolveEntry(manifest.types)]) assert.ok((await stat(target)).isFile(), `Missing package entry: ${target}`);
assert.equal(entry, resolveEntry(manifest.main));
assert.equal(types, resolveEntry(manifest.types));
const code = await readFile(entry, 'utf8');
assert.ok(Buffer.byteLength(code) < 200_000, 'Library bundle unexpectedly includes large runtime dependencies.');
assert.ok(!/data:image\/|generatePosters|\bmakeArt\s*\(|from\s*["'][^"']*artworks/.test(code), 'Library entry includes demo images or their browser-only generator.');
const imports = [...code.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map(match => match[1]);
const declared = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})]);
const packageName = name => name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0];
for (const dependency of ['react', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing']) {
  assert.ok(imports.some(name => packageName(name) === dependency), `Runtime dependency must stay external: ${dependency}`);
}
for (const name of imports) assert.ok(declared.has(packageName(name)), `Undeclared runtime import: ${name}`);
for (const name of await readdir(path.join(kit, 'lib'))) assert.ok(!/\.(?:png|jpe?g|webp|gif|svg|hdr|exr|glb|gltf)$/i.test(name), `Unexpected image or model asset in library output: ${name}`);

// Import and render in plain Node: no window/document/Image shims and no browser.
assert.equal(typeof globalThis.window, 'undefined');
assert.equal(typeof globalThis.document, 'undefined');
assert.equal(typeof globalThis.Image, 'undefined');
const library = await import(pathToFileURL(entry).href);
assert.equal(library.frames.length, 8, 'All eight frame styles must be exported.');
assert.equal(library.qualityPresets.length, 3, 'All quality presets must be exported.');
const html = renderToString(createElement(library.PosterFrame, { posterSrc: '/ssr-check.png', defaultFrame: 'bronze', showControls: true }));
assert.ok(html.includes('3D 海报展框'), 'SSR must render the component container.');
assert.ok(!html.includes('<canvas'), 'SSR must defer WebGL creation until client mount.');
assert.ok(html.includes('bronze'), 'SSR controls must include the configured frame.');
assert.equal(typeof globalThis.window, 'undefined');
assert.equal(typeof globalThis.document, 'undefined');
console.log('PASS: package entries/types, external dependencies, no demo assets, Node import and React SSR.');

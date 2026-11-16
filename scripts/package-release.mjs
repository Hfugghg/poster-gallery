import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createLitePackage } from './package-lite.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'package-kit/package.json'), 'utf8'));
const tag = process.env.RELEASE_TAG ?? (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined);
if (tag) assert.equal(tag, `v${manifest.version}`, 'Release tag must match package-kit/package.json version.');

function findNpmCli() {
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) return process.env.npm_execpath;
  const directories = [path.dirname(process.execPath), ...(process.env.PATH ?? '').split(path.delimiter)];
  for (const directory of directories) {
    const candidate = path.join(directory, 'node_modules/npm/bin/npm-cli.js');
    if (existsSync(candidate)) return candidate;
    const executable = path.join(directory, 'npm');
    if (existsSync(executable)) {
      const resolved = realpathSync(executable);
      if (resolved.endsWith('.js')) return resolved;
    }
  }
  const globalCli = path.resolve(path.dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js');
  if (existsSync(globalCli)) return globalCli;
  throw new Error('Cannot locate npm-cli.js. Run through npm run package:release or install Node.js with npm.');
}

const lite = await createLitePackage({ staging: true });
const releases = path.join(root, 'releases');
await mkdir(releases,{recursive:true});
const packed = JSON.parse(execFileSync(process.execPath, [findNpmCli(), 'pack', '--ignore-scripts', '--json', '--pack-destination', releases], {
  cwd: lite,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
  env: { ...process.env, npm_config_cache: process.env.npm_config_cache ?? path.join(root, '.package-check/npm-cache') },
}));
assert.equal(packed.length, 1, 'Expected one npm archive.');
for (const file of packed[0].files) {
  assert.ok(['package.json','README.md','LICENSE','THIRD_PARTY_NOTICES.md','lib/poster-frame.js'].includes(file.path) || /^types\/[^/]+\.d\.ts$/.test(file.path), `Unexpected npm archive content: ${file.path}`);
}
for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md'])assert.ok(packed[0].files.some(file=>file.path===name),`Release archive is missing ${name}.`);
const tgz = path.resolve(releases, packed[0].filename);
assert.equal(path.dirname(tgz), path.resolve(releases), 'Archive must be written directly into releases/.');

async function verifySourceDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `Linked release source is not allowed: ${entry.name}`);
    const file = path.join(directory, entry.name);
    assert.ok(entry.name !== 'node_modules', 'Release must not contain installed dependencies.');
    if (entry.isDirectory()) await verifySourceDirectory(file);
    else assert.ok(!/\.(?:png|jpe?g|webp|gif|hdr|exr|tgz|zip)$/i.test(entry.name), `Unexpected binary in source release: ${file}`);
  }
}
await verifySourceDirectory(lite);
const zip = path.join(releases, `poster-frame-lite-${manifest.version}.zip`);
if (process.platform === 'win32') {
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "$ErrorActionPreference='Stop'; Compress-Archive -LiteralPath $env:POSTER_RELEASE_SOURCE -DestinationPath $env:POSTER_RELEASE_ZIP -CompressionLevel Optimal -Force"], {
    cwd: releases,
    stdio: 'inherit',
    env: { ...process.env, POSTER_RELEASE_SOURCE: lite, POSTER_RELEASE_ZIP: zip },
  });
} else {
  execFileSync('zip', ['-q', '-r', '-FS', zip, path.basename(lite)], { cwd: path.dirname(lite), stdio: 'inherit' });
}
for (const archive of [tgz, zip]) assert.ok((await stat(archive)).size > 0, `Release archive is empty: ${archive}`);
console.log(JSON.stringify({ version: manifest.version, npm: path.relative(root, tgz), sourceZip: path.relative(root, zip) }, null, 2));

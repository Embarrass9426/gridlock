#!/usr/bin/env node
/**
 * Builds the fully portable single-file edition from the web build.
 *
 *   node tools/build-standalone.mjs
 *
 * index.html is the source: music is referenced as assets/music/<track>.mp3.
 * This inlines those five files as base64 so gridlock.html runs from a USB
 * stick, an email attachment or file:// -- no server, no sibling folder.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tracks = ['menu', 'easy', 'normal', 'hard', 'extreme'];

let html = readFileSync(join(root, 'index.html'), 'utf8');
const mb = (bytes) => (bytes / 1048576).toFixed(2) + ' MB';

for (const key of tracks) {
  const rel = `assets/music/${key}.mp3`;
  const needle = `"${rel}"`;
  if (!html.includes(needle)) throw new Error(`index.html no longer references ${rel}`);
  const b64 = readFileSync(join(root, rel)).toString('base64');
  html = html.split(needle).join(`"data:audio/mpeg;base64,${b64}"`);
  console.log('  inlined', rel, mb(b64.length));
}

const out = join(root, 'gridlock.html');
writeFileSync(out, html);
console.log('wrote gridlock.html', mb(statSync(out).size));

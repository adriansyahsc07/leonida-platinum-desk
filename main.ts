// Leonida Platinum Desk — hand-in program for the gta6-trophy-guide-01 bounty.
//
// The guide itself is a static web app under app/ (open app/index.html in a
// browser; serve.ts serves it locally). This program is only the courier:
// it copies app/ and screenshots/ into the output directory and writes the
// dossier the judges read, using the kit's own vendored library so the
// dossier matches byte for byte what the scorer builds from the same files.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts     # /output is the default
//
// Node 22, standard library only.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the bounty's gate states: dossier text at most 160 KiB, up to 4
// screenshots of at most 256 KiB each, app/ at most 993 entries and 48 MiB.
const CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
};

function stage(name) {
  const from = join(root, name);
  const to = join(outDir, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ beside main.ts`);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
stage('app');
stage('screenshots');

const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Leonida Platinum Desk: app/ + screenshots/ staged, dossier.json written (${dossier.length} bytes) to ${outDir}`);

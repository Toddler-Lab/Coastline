/**
 * Copies the MapLibre GL JS web worker into `public/` so the map can boot it.
 *
 * MapLibre resolves its worker from `import.meta.url`. Once the library is bundled by
 * Next.js/Turbopack that URL points at a chunk path where the worker file does not exist,
 * so the worker fails to load. Pointing `setWorkerUrl()` at a file that is actually served
 * keeps the map worker alive in dev and in production builds.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(appDir, 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl-worker.mjs');
const targetDir = join(appDir, 'public');
const target = join(targetDir, 'maplibre-gl-worker.mjs');

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);

console.log(`Synced maplibre-gl worker -> ${target}`);

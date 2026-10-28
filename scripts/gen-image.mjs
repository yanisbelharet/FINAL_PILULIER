// Génère les images d'ambiance de la landing /lp/pigma-stop-fuites avec Cloudflare Workers AI (Flux schnell).
// Usage :
//   node scripts/gen-image.mjs              -> génère toutes les images manquantes
//   node scripts/gen-image.mjs --force      -> régénère tout
//   node scripts/gen-image.mjs hero-rain    -> génère seulement les id indiqués
// Les identifiants sont lus dans .env (jamais commité, jamais envoyé au client).
// Les images servent UNIQUEMENT d'ambiance : ce ne sont ni des résultats réels, ni des photos de clients, ni des avant/après.
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!ACCOUNT_ID || !TOKEN) {
  console.error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN manquants dans .env');
  process.exit(1);
}

const OUT_DIR = path.resolve('public/images/pigma');
// Liste des images réellement générées, lue par la page (évite de demander des fichiers absents)
const MANIFEST = path.resolve('src/pigma-ambiance.json');
const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

const STYLE = 'realistic documentary photograph, natural light, 35mm, high detail, no text, no logos, no people faces';

// 12 images maximum
export const IMAGES = [
  { id: 'hero-rain-roof', prompt: `Flat concrete rooftop terrace of a white Algerian house during light rain, dark Mediterranean storm clouds, puddles reflecting the sky, satellite dishes and water tanks typical of Algeria, ${STYLE}` },
  { id: 'damp-ceiling', prompt: `Close-up of an interior white ceiling corner with a brown water stain and humidity damage from roof leak, in a modest Algerian home, soft window light, ${STYLE}` },
  { id: 'peeling-paint', prompt: `Interior wall with blistering and peeling paint bubbles caused by humidity infiltration, cracked plaster, close-up, ${STYLE}` },
  { id: 'terrace-tiles-rain', prompt: `White ceramic tiled terrace of an Algerian house just after rain, small water beads on the glossy tiles, low angle, cloudy Mediterranean sky, ${STYLE}` },
  { id: 'roof-tiles-rain', prompt: `Red clay roof tiles of a house in Kabylie Algeria under rain, water droplets, green hills in the background, moody clouds, ${STYLE}` },
  { id: 'roller-apply', prompt: `Hands applying a clear transparent liquid coating with a paint roller on a clean grey concrete rooftop, sunny dry day, close-up on the roller, ${STYLE}` },
  { id: 'house-after-storm', prompt: `Two-storey white Algerian house with a flat roof terrace at golden hour after a storm, clearing sky, wet street, calm atmosphere, ${STYLE}` },
];

const run = async (img) => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: img.prompt, steps: 8 }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new Error(`HTTP ${res.status} ${JSON.stringify(json?.errors || json)}`);
  const b64 = json?.result?.image || json?.image;
  if (!b64) throw new Error('Pas d\'image dans la réponse');
  const file = path.join(OUT_DIR, `${img.id}.webp`);
  await sharp(Buffer.from(b64, 'base64')).resize({ width: 1024, withoutEnlargement: true }).webp({ quality: 75 }).toFile(file);
  return file;
};

const main = async () => {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter(a => !a.startsWith('--'));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const exists = async (id) => fs.access(path.join(OUT_DIR, `${id}.webp`)).then(() => true, () => false);
  for (const img of IMAGES) {
    if (only.length && !only.includes(img.id)) continue;
    if (!force && await exists(img.id)) { console.log(`= ${img.id} (déjà présent)`); continue; }
    try {
      const file = await run(img);
      console.log(`✓ ${img.id} -> ${path.relative(process.cwd(), file)}`);
    } catch (e) {
      console.error(`✗ ${img.id}: ${e.message}`);
    }
  }

  const generated = [];
  for (const img of IMAGES) if (await exists(img.id)) generated.push(img.id);
  await fs.writeFile(MANIFEST, JSON.stringify(generated, null, 2) + '\n');
  console.log(`Manifeste mis à jour (${generated.length} images) : ${path.relative(process.cwd(), MANIFEST)}`);
};

main();

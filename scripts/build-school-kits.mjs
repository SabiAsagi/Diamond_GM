import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import sharp from 'sharp';
import { recolourFabric } from './kit-colours.mjs';
import { LETTERING_FITS, registerKitFont, getKitLetteringSvg } from './kit-lettering.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'diamond-kit-data-'));
try {
  for (const name of ['highSchools', 'schoolKits']) {
    const text = await fs.readFile(path.join(root, 'src/data', name + '.ts'), 'utf8');
    await fs.writeFile(path.join(temporary, name + '.js'), ts.transpileModule(text, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText);
  }
  const require = createRequire(import.meta.url);
  const { HIGH_SCHOOLS_DATA } = require(path.join(temporary, 'highSchools.js'));
  const { getSchoolKit } = require(path.join(temporary, 'schoolKits.js'));
  const presets = Object.keys(LETTERING_FITS);
  const styles = ['classic', 'pinstripe', 'solid', 'raglan'];
  const sourceDir = path.join(root, 'public/assets/kit-sources');
  const outputDir = path.join(root, 'public/assets/school-kits');
  await fs.mkdir(outputDir, { recursive: true });
  const sourceNames = presets.flatMap(id => styles.map(style => `${id}-${style}.webp`));
  const sources = await Promise.all(sourceNames.map(name => fs.readFile(path.join(sourceDir, name))));
  const hash = crypto.createHash('sha256');
  for (const buffer of sources) hash.update(buffer);
  for (const name of ['src/data/highSchools.ts', 'src/data/schoolKits.ts', 'scripts/build-school-kits.mjs',
    'scripts/kit-colours.mjs', 'scripts/kit-lettering.mjs', 'scripts/fonts/NotoSansKR-kit-subset.ttf']) {
    hash.update(await fs.readFile(path.join(root, name)));
  }
  const fingerprint = hash.digest('hex');
  const kits = [...HIGH_SCHOOLS_DATA.map(s => getSchoolKit(s.name)), getSchoolKit('')];
  const jobs = kits.flatMap(kit => presets.map(preset => ({ kit, preset, name: `${kit.id}-${preset}.webp` })));
  const manifestPath = path.join(outputDir, 'manifest.json');
  const old = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(() => '{}'));
  if (old.fingerprint === fingerprint && await Promise.all(jobs.map(j => fs.access(path.join(outputDir, j.name)).then(() => true, () => false))).then(v => v.every(Boolean))) {
    console.log(`학교 키트 ${jobs.length}장 최신 상태`);
  } else {
    await registerKitFont();
    const plates = new Map();
    for (let i = 0; i < sourceNames.length; i++) {
      const raw = await sharp(sources[i]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (raw.info.width !== 640 || raw.info.height !== 960 || raw.info.channels !== 4) throw Error(`잘못된 원화 크기: ${sourceNames[i]}`);
      plates.set(sourceNames[i], raw.data);
    }
    let index = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      for (;;) {
        const job = jobs[index++]; if (!job) return;
        const { kit, preset, name } = job;
        const plate = plates.get(`${preset}-${kit.style}.webp`);
        const pixels = recolourFabric(plate, kit.primary, kit.secondary, { width: 640, ...LETTERING_FITS[preset], ...kit });
        const letters = await sharp(Buffer.from(getKitLetteringSvg(kit, preset))).png().toBuffer();
        const buffer = await sharp(pixels, { raw: { width: 640, height: 960, channels: 4 } })
          .composite([{ input: letters }]).resize(512, 768).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
        const final = path.join(outputDir, name);
        const temp = final + '.' + crypto.randomUUID() + '.tmp';
        await fs.writeFile(temp, buffer); await fs.rename(temp, final);
      }
    }));
    const temp = manifestPath + '.' + crypto.randomUUID() + '.tmp';
    await fs.writeFile(temp, JSON.stringify({ fingerprint, count: jobs.length, sourceCount: sourceNames.length }, null, 2));
    await fs.rename(temp, manifestPath);
    console.log(`학교 키트 ${jobs.length}장 생성 완료 (원화 ${sourceNames.length}장)`);
  }
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}

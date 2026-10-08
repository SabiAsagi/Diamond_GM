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
  const sourceResults = await Promise.all(sourceNames.map(async name => {
    try { return { name, buffer: await fs.readFile(path.join(sourceDir, name)) }; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return { name };
    }
  }));
  const missing = sourceResults.filter(source => !source.buffer).map(source => source.name);
  if (missing.length) throw new Error(
    `학교 키트 원화 ${sourceNames.length - missing.length}/${sourceNames.length}장 준비됨. 누락 ${missing.length}장:\n${missing.join('\n')}`
  );
  const sources = sourceResults.map(source => source.buffer);
  const hash = crypto.createHash('sha256');
  for (const buffer of sources) hash.update(buffer);
  for (const name of ['src/data/highSchools.ts', 'src/data/schoolKits.ts', 'scripts/build-school-kits.mjs',
    'scripts/kit-colours.mjs', 'scripts/kit-lettering.mjs', 'scripts/fonts/NotoSansKR-kit-subset.ttf', 'scripts/fonts/Bevan-Regular.ttf']) {
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
      const metadata = await sharp(sources[i]).metadata();
      if (!metadata.hasAlpha) throw Error(`투명 배경이 없는 원화: ${sourceNames[i]}`);
      const raw = await sharp(sources[i]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (raw.info.width !== 640 || raw.info.height !== 960 || raw.info.channels !== 4) throw Error(`잘못된 원화 크기: ${sourceNames[i]}`);
      plates.set(sourceNames[i], raw.data);
    }
    const checkpointPath = path.join(outputDir, 'checkpoint.json');
    const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf8').catch(() => '{}'));
    const finished = new Set(checkpoint.fingerprint === fingerprint && Array.isArray(checkpoint.completed)
      ? checkpoint.completed.filter(name => jobs.some(job => job.name === name)) : []);
    const pending = [];
    for (const job of jobs) {
      if (finished.has(job.name) && await fs.access(path.join(outputDir, job.name)).then(() => true, () => false)) continue;
      finished.delete(job.name);
      pending.push(job);
    }
    console.log(`학교 키트 ${finished.size}/${jobs.length}장 확인, ${pending.length}장 이어서 생성`);
    // Serialize writes so parallel workers cannot replace newer progress.
    let checkpointWrites = Promise.resolve();
    const saveCheckpoint = () => {
      const content = JSON.stringify({ fingerprint, completed: [...finished].sort() }, null, 2);
      checkpointWrites = checkpointWrites.then(async () => {
        const temp = checkpointPath + '.' + crypto.randomUUID() + '.tmp';
        await fs.writeFile(temp, content);
        await fs.rename(temp, checkpointPath);
      });
      return checkpointWrites;
    };
    await saveCheckpoint();
    let index = 0;
    const workers = await Promise.allSettled(Array.from({ length: 4 }, async () => {
      for (;;) {
        const job = pending[index++]; if (!job) return;
        const { kit, preset, name } = job;
        const plate = plates.get(`${preset}-${kit.style}.webp`);
        const pixels = recolourFabric(plate, kit.primary, kit.secondary, { width: 640, ...LETTERING_FITS[preset], ...kit });
        const letters = await sharp(Buffer.from(getKitLetteringSvg(kit, preset))).png().toBuffer();
        // Sharp applies resize before composite, regardless of call order.
        // Complete lettering on the original canvas before shrinking it.
        const composited = await sharp(pixels, { raw: { width: 640, height: 960, channels: 4 } })
          .composite([{ input: letters }]).raw().toBuffer();
        const buffer = await sharp(composited, { raw: { width: 640, height: 960, channels: 4 } })
          .resize(512, 768).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
        const final = path.join(outputDir, name);
        const temp = final + '.' + crypto.randomUUID() + '.tmp';
        await fs.writeFile(temp, buffer); await fs.rename(temp, final);
        finished.add(name);
        await saveCheckpoint();
        if (finished.size % 32 === 0 || finished.size === jobs.length)
          console.log(`학교 키트 ${finished.size}/${jobs.length}장 저장`);
      }
    }));
    await checkpointWrites;
    const failure = workers.find(worker => worker.status === 'rejected');
    if (failure) throw failure.reason;
    const temp = manifestPath + '.' + crypto.randomUUID() + '.tmp';
    await fs.writeFile(temp, JSON.stringify({ fingerprint, count: jobs.length, sourceCount: sourceNames.length }, null, 2));
    await fs.rename(temp, manifestPath);
    console.log(`학교 키트 ${jobs.length}장 생성 완료 (원화 ${sourceNames.length}장)`);
  }
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}

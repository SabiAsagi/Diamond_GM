import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { LETTERING_FITS } from './kit-lettering.mjs';

const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const preset = args.includes('--preset') ? option('--preset') : '';
const input = args.includes('--input') ? option('--input') : '';
if (!Object.hasOwn(LETTERING_FITS, preset) || !input) {
  throw Error('사용법: node scripts/import-kit-atlas.mjs --preset male_wavy --input 원화.png [--single classic]');
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadata = await sharp(input).metadata();
if (!metadata.hasAlpha) throw Error('실제 투명 배경이 없는 원화입니다: ' + input);
const single = args.includes('--single') ? option('--single') : undefined;
const styles = ['classic', 'pinstripe', 'solid', 'raglan'];
if (single && !styles.includes(single)) throw Error('알 수 없는 유니폼 유형: ' + single);
if (!single && (metadata.width % 2 || metadata.height % 2))
  throw Error('2×2 원화 시트의 가로와 세로는 짝수여야 합니다.');
const directory = path.join(root, 'public/assets/kit-sources');
await fs.mkdir(directory, { recursive: true });
for (const style of single ? [single] : styles) {
  const destination = path.join(directory, preset + '-' + style + '.webp');
  if (await fs.access(destination).then(() => true, () => false)) {
    console.log('기존 원화 유지: ' + path.basename(destination));
    continue;
  }
  const index = styles.indexOf(style);
  const image = single ? sharp(input) : sharp(input).extract({
    left: (index % 2) * metadata.width / 2, top: Math.floor(index / 2) * metadata.height / 2,
    width: metadata.width / 2, height: metadata.height / 2,
  });
  const pixels = await image.resize(640, 960, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  let transparent = 0, opaque = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) transparent++;
    if (pixels[i] === 255) opaque++;
  }
  if (transparent < 640 * 960 * .02 || opaque < 640 * 960 * .25)
    throw Error('배경 또는 인물 알파 검수 실패: ' + style);
  const buffer = await sharp(pixels, { raw: { width: 640, height: 960, channels: 4 } })
    .webp({ quality: 96, alphaQuality: 100, effort: 5 }).toBuffer();
  const file = await fs.open(destination, 'wx');
  try { await file.writeFile(buffer); } finally { await file.close(); }
  console.log('원화 저장: ' + path.basename(destination));
}

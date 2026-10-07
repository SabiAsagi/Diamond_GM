import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const LETTERING_FITS = {
  male_spiky: { capX: 100, forehead: 55, chestY: 189, seam: 100, chestLeft: 40, chestRight: 160 },
  male_buzz: { capX: 99, forehead: 43, chestY: 164, seam: 99, chestLeft: 40, chestRight: 160 },
  male_parted: { capX: 98, forehead: 45, chestY: 170, seam: 101, chestLeft: 40, chestRight: 160 },
  male_wavy: { capX: 97, forehead: 45, chestY: 170, seam: 100, chestLeft: 40, chestRight: 160 },
  female_short: { capX: 98, forehead: 48, chestY: 170, seam: 103, chestLeft: 48, chestRight: 152 },
  female_bob: { capX: 100, forehead: 48, chestY: 171, seam: 103, chestLeft: 48, chestRight: 154 },
  female_long: { capX: 100, forehead: 54, chestY: 189, seam: 104, chestLeft: 48, chestRight: 154 },
  female_ponytail: { capX: 95, forehead: 57, chestY: 180, seam: 98, chestLeft: 44, chestRight: 156 },
};
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
let registered;
export function registerKitFont() {
  return registered ||= Promise.all([sharp({ text: {
    text: '서울', font: 'Noto Sans KR Heavy 16',
    fontfile: path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts/NotoSansKR-kit-subset.ttf'), rgba: true,
  } }).png().toBuffer(), sharp({ text: {
    text: 'DUKSOO', font: 'Bevan 20',
    fontfile: path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts/Bevan-Regular.ttf'), rgba: true,
  } }).png().toBuffer(), sharp({ text: {
    text: 'DUKSOO', font: 'Anton 32',
    fontfile: path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts/Anton-Regular.ttf'), rgba: true,
  } }).png().toBuffer()]);
}

export const PLACKET_GAP = 20;
const widths = new Map();
async function wordWidth(word, family) {
  const key = family + ':' + word;
  if (!widths.has(key)) widths.set(key, sharp({ text: {
    text: escape(word), font: `${family} ${family === 'Noto Sans KR' ? 'Heavy ' : ''}100`, dpi: 72, rgba: true,
  } }).metadata().then(meta => meta.width / 100));
  return widths.get(key);
}

/** Keep all lettering on visible fabric, including antialiased garment edges. */
export function maskLetteringToFabric(letters, plate, { width = 640, chestY = 175 } = {}) {
  const out = Buffer.from(letters);
  for (let i = 0; i < out.length; i += 4) {
    if (!out[i + 3]) continue;
    out[i + 3] = Math.min(out[i + 3], plate[i + 3]);
    const y = Math.floor(i / 4 / width) / (plate.length / 4 / width) * 300;
    if (y < chestY - 45) continue; // Cap lettering uses its own placement.
    const [r, g, b] = plate.subarray(i, i + 3);
    const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
    const fabric = (hi - lo < 32 && lo > 105)
      || (Math.min(r, b) - g > Math.max(r, b) * .16 && Math.min(r, b) > Math.max(r, b) * .5)
      || (Math.min(g, b) - r > Math.max(g, b) * .16 && Math.min(g, b) > Math.max(g, b) * .72);
    if (!fabric) out[i + 3] = 0;
  }
  return out;
}

/** Whole words are measured, aligned, and clipped to bounded chest panels. */
export async function getKitLetteringSvg(kit, preset, { cap = true } = {}) {
  await registerKitFont();
  const f = LETTERING_FITS[preset];
  const text = [...kit.wordmark];
  const leftEdge = f.seam - PLACKET_GAP / 2, rightEdge = f.seam + PLACKET_GAP / 2;
  const latin = /^[A-Z0-9]+$/.test(kit.wordmark);
  const family = latin ? 'Anton' : 'Noto Sans KR';
  const trim = kit.letteringTrim ?? (kit.ink === kit.primary ? kit.secondary : kit.primary);
  const textEl = (word, x, y, size, clip, anchor, scaleX) => {
    const shape = `<text x="0" y="0" font-family="${family}" font-weight="${latin ? 400 : 900}" font-size="${size}" text-anchor="${anchor}" paint-order="stroke" stroke-linejoin="round"`;
    return `<g clip-path="url(#${clip})"><g transform="translate(${x} ${y}) scale(${scaleX} 1)">${shape} fill="${kit.ink}" stroke="#faf7ed" stroke-width="1.7">${escape(word)}</text>${shape} fill="${kit.ink}" stroke="${trim}" stroke-width=".7">${escape(word)}</text></g></g>`;
  };
  let chest;
  if (kit.placement === 'chest') {
    const mid = Math.ceil(text.length / 2);
    const lines = text.length > 3 ? [text.slice(0, mid).join(''), text.slice(mid).join('')] : [text.join('')];
    const measured = await Promise.all(lines.map(word => wordWidth(word, family)));
    const available = f.chestRight - rightEdge - 6;
    const size = Math.min(latin ? 34 : 30, available / Math.max(...measured) / .8);
    const scaleX = Math.min(1, available / Math.max(...measured) / size);
    chest = lines.map((word, i) => textEl(word, (rightEdge + f.chestRight) / 2, f.chestY + 3 + i * (size * 1.15), size, 'right', 'middle', scaleX)).join('');
  } else {
    const mid = Math.ceil(text.length / 2);
    const left = text.slice(0, mid).join(''), right = text.slice(mid).join('');
    const [lw, rw] = await Promise.all([wordWidth(left, family), right ? wordWidth(right, family) : Promise.resolve(0)]);
    const widthRatio = Math.min((leftEdge - f.chestLeft - 5) / lw, rw ? (f.chestRight - rightEdge - 5) / rw : Infinity);
    const size = Math.min(latin ? 34 : 30, widthRatio / .8), scaleX = Math.min(1, widthRatio / size);
    chest = textEl(left, leftEdge - 2, f.chestY + 7, size, 'left', 'end', scaleX)
      + (right ? textEl(right, rightEdge + 2, f.chestY + 7, size, 'right', 'start', scaleX) : '');
  }
  const capLatin = /^[A-Z0-9]+$/.test(kit.symbol);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="960" viewBox="0 0 200 300"><defs><clipPath id="left"><rect x="${f.chestLeft}" y="${f.chestY - 32}" width="${leftEdge - f.chestLeft}" height="76"/></clipPath><clipPath id="right"><rect x="${rightEdge}" y="${f.chestY - 32}" width="${f.chestRight - rightEdge}" height="76"/></clipPath></defs><g font-family="Noto Sans KR" font-weight="900">${cap ? `<text x="${f.capX}" y="${f.forehead - 17}" font-family="${capLatin ? 'Bevan' : 'Noto Sans KR'}" font-weight="${capLatin ? 400 : 900}" text-anchor="middle" font-size="15" fill="${kit.capText}" stroke="${kit.capPrimary}" stroke-width=".5" paint-order="stroke">${escape(kit.symbol)}</text>` : ''}${chest}</g></svg>`;
}

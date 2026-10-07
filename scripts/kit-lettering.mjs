import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const LETTERING_FITS = {
  male_spiky: { capX: 100, forehead: 55, chestY: 189, seam: 100 },
  male_buzz: { capX: 99, forehead: 43, chestY: 164, seam: 99 },
  male_parted: { capX: 98, forehead: 45, chestY: 170, seam: 101 },
  male_wavy: { capX: 97, forehead: 45, chestY: 170, seam: 100 },
  female_short: { capX: 98, forehead: 48, chestY: 170, seam: 103 },
  female_bob: { capX: 100, forehead: 48, chestY: 171, seam: 103 },
  female_long: { capX: 100, forehead: 54, chestY: 189, seam: 104 },
  female_ponytail: { capX: 95, forehead: 57, chestY: 180, seam: 98 },
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
  } }).png().toBuffer()]);
}

/** Lettering is clipped to separate chest panels: the central 26px placket stays blank. */
export function getKitLetteringSvg(kit, preset, { cap = true } = {}) {
  const f = LETTERING_FITS[preset];
  const text = [...kit.wordmark];
  const leftEdge = f.seam - 13, rightEdge = f.seam + 13;
  const latin = /^[A-Z0-9]+$/.test(kit.wordmark);
  const family = latin ? 'Bevan' : 'Noto Sans KR';
  const trim = kit.letteringTrim ?? (kit.ink === kit.primary ? kit.secondary : kit.primary);
  const textEl = (word, x, y, size, clip, angle = 0) => {
    const shape = `<text x="${x}" y="${y}" font-family="${family}" font-weight="${latin ? 400 : 900}" font-size="${size}" text-anchor="middle" transform="rotate(${angle} ${x} ${y})" paint-order="stroke" stroke-linejoin="round"`;
    return `<g clip-path="url(#${clip})">${shape} fill="${kit.ink}" stroke="#faf7ed" stroke-width="1.7">${escape(word)}</text>${shape} fill="${kit.ink}" stroke="${trim}" stroke-width=".7">${escape(word)}</text></g>`;
  };
  // Separate glyphs follow the chest arch without stretching the typeface.
  const panel = (letters, side, size) => {
    const advance = size * (latin ? .9 : 1.02);
    return letters.map((letter, i) => {
      const distance = side === 'left' ? letters.length - i - .5 : i + .5;
      const x = side === 'left' ? leftEdge - 3 - distance * advance : rightEdge + 3 + distance * advance;
      const progress = letters.length > 1 ? (distance - .5) / (letters.length - 1) : 0;
      const y = f.chestY - 3 + progress * 5;
      return textEl(letter, x, y, size, side, (side === 'left' ? -1 : 1) * progress * 8);
    }).join('');
  };
  let chest;
  if (kit.placement === 'chest' || preset === 'female_long') {
    const size = Math.min(21, (158 - rightEdge - 7) / Math.max(1, text.length) / (latin ? .9 : 1.02));
    chest = panel(text, 'right', size);
  } else {
    const mid = Math.ceil(text.length / 2);
    const size = Math.min(latin ? 22 : 21, 48 / Math.max(1, mid) / (latin ? .9 : 1.02));
    chest = panel(text.slice(0, mid), 'left', size) + panel(text.slice(mid), 'right', size);
  }
  const capLatin = /^[A-Z0-9]+$/.test(kit.symbol);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="960" viewBox="0 0 200 300"><defs><clipPath id="left"><rect width="${leftEdge}" height="300"/></clipPath><clipPath id="right"><rect x="${rightEdge}" width="${200 - rightEdge}" height="300"/></clipPath></defs><g font-family="Noto Sans KR" font-weight="900">${cap ? `<text x="${f.capX}" y="${f.forehead - 17}" font-family="${capLatin ? 'Bevan' : 'Noto Sans KR'}" font-weight="${capLatin ? 400 : 900}" text-anchor="middle" font-size="15" fill="${kit.capText}" stroke="${kit.capPrimary}" stroke-width=".5" paint-order="stroke">${escape(kit.symbol)}</text>` : ''}${chest}</g></svg>`;
}

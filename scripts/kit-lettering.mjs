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
  return registered ||= sharp({ text: {
    text: '서울', font: 'Noto Sans KR Heavy 16',
    fontfile: path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts/NotoSansKR-kit-subset.ttf'), rgba: true,
  } }).png().toBuffer();
}

/** Lettering is clipped to separate chest panels: the central 26px placket stays blank. */
export function getKitLetteringSvg(kit, preset, { cap = true } = {}) {
  const f = LETTERING_FITS[preset];
  const text = [...kit.wordmark];
  const leftEdge = f.seam - 13, rightEdge = f.seam + 13;
  const stroke = kit.style === 'solid' ? '#ffffff' : kit.baseFabric;
  const textEl = (word, x, y, size, anchor, clip, angle = 0) =>
    `<g clip-path="url(#${clip})"><text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" transform="rotate(${angle} ${x} ${y})" fill="${kit.ink}" stroke="${stroke}" stroke-width=".8" paint-order="stroke">${escape(word)}</text></g>`;
  let chest;
  if (kit.placement === 'chest' || preset === 'female_long') {
    const size = Math.min(18, (158 - rightEdge - 2) / Math.max(1, text.length));
    chest = textEl(text.join(''), rightEdge + 2, f.chestY, size, 'start', 'right');
  } else {
    const mid = Math.ceil(text.length / 2);
    const size = Math.min(18, 52 / Math.max(1, mid));
    chest = textEl(text.slice(0, mid).join(''), leftEdge - 1, f.chestY, size, 'end', 'left', -4)
      + textEl(text.slice(mid).join(''), rightEdge + 1, f.chestY, size, 'start', 'right', 4);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="960" viewBox="0 0 200 300"><defs><clipPath id="left"><rect width="${leftEdge}" height="300"/></clipPath><clipPath id="right"><rect x="${rightEdge}" width="${200 - rightEdge}" height="300"/></clipPath></defs><g font-family="Noto Sans KR" font-weight="900">${cap ? `<text x="${f.capX}" y="${f.forehead - 17}" text-anchor="middle" font-size="15" fill="${kit.capText}" stroke="${kit.capPrimary}" stroke-width=".5" paint-order="stroke">${escape(kit.symbol)}</text>` : ''}${chest}</g></svg>`;
}

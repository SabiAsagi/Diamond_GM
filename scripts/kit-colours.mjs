const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** Recolour painted fabric markers, retaining neutral ink, skin and source alpha. */
export function recolourFabric(source, primary, secondary, options = {}) {
  const out = Buffer.from(source);
  const body = [rgb(primary), rgb(secondary)];
  const cap = [rgb(options.capPrimary || primary), rgb(options.capSecondary || secondary)];
  const { width = 640, forehead = 50, chestY = 175, baseFabric = '#ffffff' } = options;
  const height = source.length / 4 / width;
  const base = rgb(baseFabric);
  for (let i = 0; i < source.length; i += 4) {
    if (!source[i + 3]) continue;
    const [r, g, b] = source.subarray(i, i + 3);
    const x = (i / 4 % width) / width;
    const y = Math.floor(i / 4 / width) / height * 300;
    const isCap = y < forehead + 13 || (y < forehead + 25 && (x < .36 || x > .64));
    const targets = isCap ? cap : body;
    const magenta = Math.min(r, b) - g;
    const cyan = Math.min(g, b) - r;
    let target, shade;
    if (magenta > Math.max(r, b) * .16 && Math.min(r, b) > Math.max(r, b) * .5) {
      target = targets[0]; shade = Math.max(r, b) / 255;
    } else if (cyan > Math.max(g, b) * .16 && Math.min(g, b) > Math.max(g, b) * .72) {
      target = targets[1]; shade = Math.max(g, b) / 255;
    } else if (baseFabric !== '#ffffff' && y > chestY - 70 && Math.max(r, g, b) - Math.min(r, g, b) < 28 && Math.min(r, g, b) > 95) {
      target = base; shade = Math.max(r, g, b) / 255;
    }
    if (target) for (let c = 0; c < 3; c++) out[i + c] = Math.round(target[c] * shade);
  }
  return out;
}

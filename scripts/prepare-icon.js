const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const SRC_DIR = 'C:/Users/Lenovo/OneDrive/Desktop/MarketApp/vibe_images';
const ASSETS = path.join(__dirname, '..', 'assets');

const NAVY = { r: 11, g: 17, b: 32 };

function findSource(prefix) {
  const file = fs
    .readdirSync(SRC_DIR)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.png'))
    .sort()
    .pop();
  if (!file) throw new Error(`Missing generated icon: ${prefix}`);
  return path.join(SRC_DIR, file);
}

async function main() {
  const src = findSource('koo-app-icon');
  const base = sharp(src).resize(1024, 1024, { fit: 'cover' });
  const raw = await base.png().toBuffer();

  // Play store / launcher icon.
  await sharp(raw).png({ compressionLevel: 9 }).toFile(path.join(ASSETS, 'icon.png'));

  // Adaptive foreground: the mark must sit inside the ~66% safe zone.
  const foreground = await sharp(raw)
    .resize(680, 680, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 172,
      bottom: 172,
      left: 172,
      right: 172,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();
  await sharp(foreground).toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  // Monochrome layer: reuse the transparent-background mark so only the shape
  // carries alpha; Android tints the opaque pixels.
  await sharp(foreground).grayscale().linear([1.15], [-8]).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));

  // Flat background layer.
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: NAVY } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));

  console.log('wrote icon.png, android-icon-foreground.png, android-icon-monochrome.png, android-icon-background.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

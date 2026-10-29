const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const SRC_DIR = 'C:/Users/Lenovo/OneDrive/Desktop/MarketApp/vibe_images';
const OUT_DIR = path.join(__dirname, '..', 'assets', 'products');

// asset key -> generated image filename prefix
const MAP = {
  headphones: 'aurora-headphones',
  earbuds: 'pulse-earbuds',
  sneakers: 'koo-runner-sneakers',
  watch: 'meridian-watch',
  backpack: 'summit-backpack',
  lamp: 'halo-desk-lamp',
  mugs: 'terra-mug-set',
  jacket: 'nimbus-puffer-jacket',
  keyboard: 'volt-keyboard',
  speaker: 'drift-speaker',
  yogamat: 'zen-yoga-mat',
  sunglasses: 'lumen-sunglasses',
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.png'));
  for (const [key, prefix] of Object.entries(MAP)) {
    const match = files.find((f) => f.startsWith(prefix + '_'));
    if (!match) {
      console.log('MISSING', prefix);
      continue;
    }
    const out = path.join(OUT_DIR, `${key}.jpg`);
    await sharp(path.join(SRC_DIR, match))
      .resize(700, 700, { fit: 'cover' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(out);
    console.log('wrote', path.relative(process.cwd(), out));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

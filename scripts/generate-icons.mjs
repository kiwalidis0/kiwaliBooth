import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/kiwaliBooth.svg');
const svg = readFileSync(svgPath);

const outputDir = resolve(__dirname, '../public');

const icons = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 512, name: 'icon-maskable-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32.png' },
];

for (const { size, name } of icons) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(outputDir, name));
  console.log(`✅ Generated ${name} (${size}×${size})`);
}

console.log('\n🎉 All icons generated successfully!');

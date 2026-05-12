#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function writePng(url, outPath, size=800) {
  const buf = await QRCode.toBuffer(url, { type: 'png', width: size, margin: 1 });
  await fs.promises.writeFile(outPath, buf);
}

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const outDir = argv['out-dir'] || argv.o || path.join(process.cwd(), 'tools', 'qr_images');
  const size = Number(argv.size || argv.s || 800);
  const urls = argv._.length ? argv._ : (argv.urls ? argv.urls.split(',') : []);

  if (!urls.length) {
    console.error('Usage: generate_qr_pngs.js [--out-dir DIR] [--size PIXELS] <url> [<url> ...]');
    process.exit(2);
  }

  await fs.promises.mkdir(outDir, { recursive: true });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const safeName = url.replace(/[:\\/\\?&=#%]+/g, '_').slice(0, 200);
    const fileName = `qr_${i+1}.png`;
    const outPath = path.join(outDir, fileName);
    process.stdout.write(`Writing ${outPath} for ${url}\n`);
    try {
      await writePng(url, outPath, size);
    } catch (err) {
      console.error('Failed to write', outPath, err);
      process.exitCode = 1;
    }
  }
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function makeQrPdf(opts) {
  const count = opts.count || 12;
  const out = opts.out || path.join(process.cwd(), 'qr_codes.pdf');
  const host = opts.host || 'http://localhost:8000';
  const stations = opts.stations || ['1','2','3','4','5'];

  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(out);
  doc.pipe(stream);

  const perPage = opts.perPage || 6; // number of QR per page
  const cols = opts.cols || 2;
  const rows = Math.ceil(perPage / cols);
  const pageMargin = 48;
  const qrSize = 180;
  const gapX = 40;
  const gapY = 40;

  for (let i = 0; i < count; i++) {
    // generate a randomized order
    const orderArr = shuffle(stations.slice()).join(',');
    const b64 = Buffer.from(orderArr).toString('base64');
    const url = host.replace(/\/$/, '') + '/?order=' + encodeURIComponent(b64);

    // build page when needed
    if (i % perPage === 0) {
      doc.addPage({ size: 'A4', margin: pageMargin });
    }

    // compute position
    const indexOnPage = i % perPage;
    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    const pageWidth = doc.page.width - pageMargin * 2;
    const startX = pageMargin + col * (qrSize + gapX);
    const startY = pageMargin + row * (qrSize + 60 + gapY);

    // draw a label box
    doc.rect(startX - 8, startY - 8, qrSize + 16, qrSize + 60 + 16).stroke();

    // generate QR buffer
    const qrBuffer = await QRCode.toBuffer(url, { type: 'png', margin: 1, width: qrSize });

    // draw image
    doc.image(qrBuffer, startX, startY, { width: qrSize, height: qrSize });

    // add link and small label (do NOT print the plain order)
    doc.fontSize(10).fillColor('#000000');
    const labelY = startY + qrSize + 8;
    doc.text('Link: ' + url, startX, labelY, { width: qrSize, height: 40 });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(out));
    stream.on('error', reject);
  });
}

if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2));
  const count = Number(argv.count || argv.c || 12);
  const out = argv.out || argv.o || path.join(process.cwd(), 'qr_codes.pdf');
  const host = argv.host || argv.h || 'http://localhost:8000';
  const cols = Number(argv.cols || 2);
  makeQrPdf({ count, out, host, cols }).then(p => console.log('Wrote', p)).catch(err => { console.error(err); process.exit(1); });
}

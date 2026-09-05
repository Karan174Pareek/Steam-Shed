import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, _colorRgb) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type: 2 (RGB)
  ihdrData.writeUInt8(0, 10); // compression method
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines: filter byte 0, then 3 bytes per pixel
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;

      // Draw a subtle border and locomotive icon silhouette
      const isBorder = x < 6 || x >= width - 6 || y < 6 || y >= height - 6;
      const relX = x / width;
      const relY = y / height;

      // Center train motif
      const inBoiler = relX >= 0.3 && relX <= 0.7 && relY >= 0.35 && relY <= 0.65;
      const inCab = relX >= 0.6 && relX <= 0.82 && relY >= 0.25 && relY <= 0.65;
      const inChimney = relX >= 0.36 && relX <= 0.44 && relY >= 0.2 && relY <= 0.35;
      const inLamp = Math.hypot(relX - 0.28, relY - 0.48) < 0.05;
      const inWheel1 = Math.hypot(relX - 0.4, relY - 0.75) < 0.09;
      const inWheel2 = Math.hypot(relX - 0.62, relY - 0.75) < 0.09;

      if (inLamp) {
        // Brass #9C7A3C -> [156, 122, 60]
        rawData[pxOffset] = 156;
        rawData[pxOffset + 1] = 122;
        rawData[pxOffset + 2] = 60;
      } else if (inBoiler || inCab || inChimney || inWheel1 || inWheel2) {
        // Iron #3A3530 -> [58, 53, 48]
        rawData[pxOffset] = 58;
        rawData[pxOffset + 1] = 53;
        rawData[pxOffset + 2] = 48;
      } else if (isBorder) {
        // Shadow dark #A89A7C -> [168, 154, 124]
        rawData[pxOffset] = 168;
        rawData[pxOffset + 1] = 154;
        rawData[pxOffset + 2] = 124;
      } else {
        // Base Raised #EDE6D6 -> [237, 230, 214]
        rawData[pxOffset] = 237;
        rawData[pxOffset + 1] = 230;
        rawData[pxOffset + 2] = 214;
      }
    }
  }

  // Deflate compressed IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512));
console.log('PWA icons created successfully in public/icons/');

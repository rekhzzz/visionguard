const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Custom 16x16 green eye pixel art layout
// T = Transparent, K = Dark lash/border, W = White eyeball, G = Mint iris, D = Dark green iris outline, P = Pupil
const pixelMap = [
  'T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T',
  'T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T',
  'T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T',
  'T','T','T','T','T','K','K','K','K','K','K','T','T','T','T','T',
  'T','T','T','K','K','W','W','W','W','W','W','K','K','T','T','T',
  'T','T','K','W','W','W','D','D','D','D','W','W','W','K','T','T',
  'T','K','W','W','D','D','G','G','G','G','D','D','W','W','K','T',
  'K','W','W','D','G','G','P','P','P','P','G','G','D','W','W','K',
  'K','W','W','D','G','G','P','P','P','P','G','G','D','W','W','K',
  'T','K','W','W','D','D','G','G','G','G','D','D','W','W','K','T',
  'T','T','K','W','W','W','D','D','D','D','W','W','W','K','T','T',
  'T','T','T','K','K','W','W','W','W','W','W','K','K','T','T','T',
  'T','T','T','T','T','K','K','K','K','K','K','T','T','T','T','T',
  'T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T',
  'T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T',
  'T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T'
];

// Color definitions (RGBA)
const colors = {
  'T': [0, 0, 0, 0],
  'K': [15, 23, 42, 255],     // Dark Slate border
  'W': [255, 255, 255, 255], // White sclera
  'G': [52, 211, 153, 255],  // Mint Green iris
  'D': [16, 185, 129, 255],  // Emerald Green outline
  'P': [15, 23, 42, 255]     // Dark Pupil
};

// Generate raw RGBA data
const rawData = Buffer.alloc(16 * 16 * 4);
for (let i = 0; i < pixelMap.length; i++) {
  const color = colors[pixelMap[i]];
  rawData[i * 4] = color[0];
  rawData[i * 4 + 1] = color[1];
  rawData[i * 4 + 2] = color[2];
  rawData[i * 4 + 3] = color[3];
}

// Convert raw RGBA data into PNG scanlines (each scanline begins with a filter type byte: 0)
const scanlines = Buffer.alloc(16 * (16 * 4 + 1));
for (let y = 0; y < 16; y++) {
  scanlines[y * (64 + 1)] = 0; // Filter byte 0
  rawData.copy(scanlines, y * 65 + 1, y * 64, (y + 1) * 64);
}

// Compress scanlines with standard zlib deflate
const compressedData = zlib.deflateSync(scanlines);

// CRC32 Calculation helper
function crc32(buf) {
  let c = 0xffffffff;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let k = n;
    for (let j = 0; j < 8; j++) {
      if (k & 1) {
        k = 0xedb88320 ^ (k >>> 1);
      } else {
        k = k >>> 1;
      }
    }
    table[n] = k;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Construct PNG Chunks
// 1. IHDR Chunk (13 bytes)
const ihdrLength = Buffer.alloc(4);
ihdrLength.writeUInt32BE(13, 0);

const ihdrType = Buffer.from('IHDR');
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(16, 0);  // Width = 16
ihdrData.writeUInt32BE(16, 4);  // Height = 16
ihdrData[8] = 8;                // Bit depth = 8
ihdrData[9] = 6;                // Color type = 6 (RGBA)
ihdrData[10] = 0;               // Compression = 0 (Deflate)
ihdrData[11] = 0;               // Filter = 0
ihdrData[12] = 0;               // Interlace = 0

const ihdrCrc = Buffer.alloc(4);
ihdrCrc.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])), 0);

const ihdrChunk = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);

// 2. IDAT Chunk
const idatLength = Buffer.alloc(4);
idatLength.writeUInt32BE(compressedData.length, 0);

const idatType = Buffer.from('IDAT');
const idatCrc = Buffer.alloc(4);
idatCrc.writeUInt32BE(crc32(Buffer.concat([idatType, compressedData])), 0);

const idatChunk = Buffer.concat([idatLength, idatType, compressedData, idatCrc]);

// 3. IEND Chunk
const iendLength = Buffer.alloc(4);
iendLength.writeUInt32BE(0, 0);

const iendType = Buffer.from('IEND');
const iendCrc = Buffer.alloc(4);
iendCrc.writeUInt32BE(crc32(iendType), 0);

const iendChunk = Buffer.concat([iendLength, iendType, iendCrc]);

// Concat Full PNG Buffer
const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // Signature
  ihdrChunk,
  idatChunk,
  iendChunk
]);

const pngSize = pngBuffer.length;

// Create 22-byte ICO Directory Header
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type = 1 (Icon)
icoHeader.writeUInt16LE(1, 4); // Count = 1

// Image Entry
icoHeader.writeUInt8(16, 6); // Width = 16px
icoHeader.writeUInt8(16, 7); // Height = 16px
icoHeader.writeUInt8(0, 8);  // Colors = 0 (No palette)
icoHeader.writeUInt8(0, 9);  // Reserved = 0
icoHeader.writeUInt16LE(1, 10); // Color Planes = 1
icoHeader.writeUInt16LE(32, 12); // Bits per Pixel = 32
icoHeader.writeUInt32LE(pngSize, 14); // Size of PNG data
icoHeader.writeUInt32LE(22, 18); // Offset to PNG data = 22

// Concatenate Header + PNG data to create ICO
const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);

// Target Paths
const sharedDir = __dirname;
const pngPath = path.join(sharedDir, 'icon.png');
const icoPath = path.join(sharedDir, 'icon.ico');

try {
  fs.writeFileSync(pngPath, pngBuffer);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('SUCCESS: programmatically generated green eye pixel art icons!');
  console.log(`- PNG written to: ${pngPath}`);
  console.log(`- ICO written to: ${icoPath}`);
} catch (err) {
  console.error('Failed to write icons:', err);
  process.exit(1);
}

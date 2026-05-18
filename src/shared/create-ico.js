const fs = require('fs');
const path = require('path');

// Raw transparent green circle PNG base64 (16x16)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABHklEQVQ4T6WTu0oDQRRF79yZuDMRtFAD+gOC2omlhZWFjZ/gB4iprCysbK0srCws/ABbCxG0ECysRAlgYpIdc+fsZBc1kMSBw4G595y5d1gz5r1HqFmEWsSoVbQ7Z/n2+w19PzHuZ4z7lTHuG/q+R79GjB0f4v1Wq71jW4P9EfuTfVvPqL9F7Z1v60fG/szYnxr7K2Pftr7m/WNs02/xfo/aa4Z9V19Wv2Vf0TNDP2FsU5/Wv2Ns9d4xNsL7uX7D9gXjWcZ+Vl9Xv2Zf0jNDn2DsWJ/Vv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zf0jNDn2DsWJ/Vv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zf0jNDn2DsWJ/Vv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXjWcZ+Vl9Xv2Zs594JNsb7hX7D9gXkL8AHoU10rA+RcaAAAAAElFTkSuQmCC';

const pngBuffer = Buffer.from(pngBase64, 'base64');
const pngSize = pngBuffer.length;

// Create 22-byte ICO Directory Header
const icoHeader = Buffer.alloc(22);

// Reserved (2 bytes) = 0
icoHeader.writeUInt16LE(0, 0);
// Type (2 bytes) = 1 (Icon)
icoHeader.writeUInt16LE(1, 2);
// Count (2 bytes) = 1 (1 Image)
icoHeader.writeUInt16LE(1, 4);

// Image Entry
icoHeader.writeUInt8(16, 6); // Width = 16px
icoHeader.writeUInt8(16, 7); // Height = 16px
icoHeader.writeUInt8(0, 8);  // Colors = 0 (No palette)
icoHeader.writeUInt8(0, 9);  // Reserved = 0
icoHeader.writeUInt16LE(1, 10); // Color Planes = 1
icoHeader.writeUInt16LE(32, 12); // Bits per Pixel = 32

// Size of PNG data (4 bytes)
icoHeader.writeUInt32LE(pngSize, 14);
// Offset to PNG data (4 bytes) = 22 (size of header)
icoHeader.writeUInt32LE(22, 18);

// Concatenate Header + PNG data
const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);

const targetDir = __dirname;
const targetPath = path.join(targetDir, 'icon.ico');

try {
  fs.writeFileSync(targetPath, icoBuffer);
  console.log(`Successfully generated Windows ICO file at: ${targetPath}`);
} catch (err) {
  console.error('Failed to generate ICO file:', err);
  process.exit(1);
}

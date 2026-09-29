import fs from 'fs';

function getPngDimensions(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function getJpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }
    const len = buffer.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return null;
}

try {
  const pngBuf = fs.readFileSync('./public/media_1789481415425.png');
  console.log('Logo PNG:', getPngDimensions(pngBuf));
} catch (e) {
  console.log('PNG error:', e.message);
}

try {
  const jpgBuf = fs.readFileSync('./public/media_1789481347631.jpg');
  console.log('Mockup JPEG:', getJpegDimensions(jpgBuf));
} catch (e) {
  console.log('JPEG error:', e.message);
}

const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

function crc32(buf) {
  return zlib.crc32(buf) >>> 0;
}

function readVarInt(buf, state) {
  let data = 0;
  let shift = 1;
  while (true) {
    if (state.offset >= buf.length) throw new Error('Unexpected EOF in readVarInt');
    const byte = buf[state.offset++];
    data += (byte & 0x7f) * shift;
    if (byte & 0x80) break;
    shift <<= 7;
    data += shift;
  }
  return data;
}

function applyUps(inputBuf, patchBuf, isReverse = false) {
  if (patchBuf.subarray(0, 4).toString('ascii') !== 'UPS1') {
    throw new Error('Not a valid UPS patch (missing UPS1)');
  }

  const patchLength = patchBuf.length;
  const expectedSrcCrc = patchBuf.readUInt32LE(patchLength - 12);
  const expectedDstCrc = patchBuf.readUInt32LE(patchLength - 8);
  const expectedPatchCrc = patchBuf.readUInt32LE(patchLength - 4);

  const calcPatchCrc = crc32(patchBuf.subarray(0, patchLength - 4));
  if (calcPatchCrc !== expectedPatchCrc) {
    throw new Error(`Corrupted patch CRC: expected 0x${expectedPatchCrc.toString(16)}, got 0x${calcPatchCrc.toString(16)}`);
  }

  const state = { offset: 4 };
  const srcSize = readVarInt(patchBuf, state);
  const dstSize = readVarInt(patchBuf, state);

  console.log(`UPS Header: srcSize=${srcSize}, dstSize=${dstSize}, isReverse=${isReverse}`);

  const expectedInputCrc = isReverse ? expectedDstCrc : expectedSrcCrc;
  const expectedOutputCrc = isReverse ? expectedSrcCrc : expectedDstCrc;
  const targetOutputSize = isReverse ? srcSize : dstSize;

  const actualInputCrc = crc32(inputBuf);
  console.log(`Input CRC32: 0x${actualInputCrc.toString(16).padStart(8, '0')} (expected 0x${expectedInputCrc.toString(16).padStart(8, '0')})`);
  if (actualInputCrc !== expectedInputCrc) {
    throw new Error(`Input CRC mismatch: expected 0x${expectedInputCrc.toString(16)}, got 0x${actualInputCrc.toString(16)}`);
  }

  const outBuf = Buffer.alloc(targetOutputSize, 0);
  const copyLen = Math.min(inputBuf.length, targetOutputSize);
  inputBuf.copy(outBuf, 0, 0, copyLen);

  let relative = 0;
  const patchDataEnd = patchLength - 12;

  while (state.offset < patchDataEnd) {
    relative += readVarInt(patchBuf, state);
    while (state.offset < patchDataEnd) {
      const x = patchBuf[state.offset++];
      if (relative < outBuf.length) {
        outBuf[relative] ^= x;
      }
      relative++;
      if (x === 0) break;
    }
  }

  const actualOutputCrc = crc32(outBuf);
  console.log(`Generated Output CRC32: 0x${actualOutputCrc.toString(16).padStart(8, '0')}`);
  console.log(`Expected Output CRC32:  0x${expectedOutputCrc.toString(16).padStart(8, '0')}`);

  if (actualOutputCrc !== expectedOutputCrc) {
    throw new Error(`Output CRC mismatch: expected 0x${expectedOutputCrc.toString(16)}, got 0x${actualOutputCrc.toString(16)}`);
  }

  return outBuf;
}

module.exports = { applyUps, crc32 };

if (require.main === module) {
  const mode = process.argv[2];
  if (mode === 'unpatch') {
    console.log('--- STEP 1: Unpatching pokemonHnS.clean.gba -> Emerald 1986 Clean Base ---');
    const input = fs.readFileSync('public/roms/pokemonHnS.clean.gba');
    const patch = fs.readFileSync('pokemonHnS_v1.2.1.ups');
    const emerald = applyUps(input, patch, true);
    fs.writeFileSync('clean_emerald.gba', emerald);
    console.log('SUCCESS: clean_emerald.gba generated!');
    console.log('SHA1:', crypto.createHash('sha1').update(emerald).digest('hex'));
  } else if (mode === 'patch-v2') {
    console.log('--- STEP 2: Patching Emerald Clean Base -> Pokemon Heart & Soul v2.0.6 ---');
    const input = fs.readFileSync('clean_emerald.gba');
    const patch = fs.readFileSync('pokemonHnS_v2.0.6.ups');
    const hns2 = applyUps(input, patch, false);
    fs.writeFileSync('public/roms/pokemonHnS.gba', hns2);
    console.log('SUCCESS: public/roms/pokemonHnS.gba (v2.0.6) generated!');
    console.log('SHA1:', crypto.createHash('sha1').update(hns2).digest('hex'));
  }
}

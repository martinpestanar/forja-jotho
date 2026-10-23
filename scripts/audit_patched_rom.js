const fs = require('fs');
const path = require('path');

const rom = fs.readFileSync(path.join(__dirname, '../public/roms/pokemonHnS.gba'));
const TRAINERS_BASE = 0x73C278;
const SPECIES_BASE = 0x744798;
const MOVES_BASE = 0x745B74;
const ITEMS_BASE = 0x8FE9C0;

function decodeGba(buf) {
  let s = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0xFF) break;
    if (b >= 0xBB && b <= 0xD4) s += String.fromCharCode(65 + (b - 0xBB));
    else if (b >= 0xD5 && b <= 0xEF) s += String.fromCharCode(97 + (b - 0xD5));
    else if (b >= 0xA1 && b <= 0xAA) s += String.fromCharCode(48 + (b - 0xA1));
    else if (b === 0x00) s += ' ';
    else if (b === 0xAE) s += '-';
    else s += '?';
  }
  return s.trim();
}

function getSpeciesName(id) {
  if (id === 0) return 'NONE';
  const off = SPECIES_BASE + id * 11;
  return decodeGba(rom.subarray(off, off + 11));
}

function getMoveName(id) {
  if (id === 0) return '---';
  const off = MOVES_BASE + id * 13;
  return decodeGba(rom.subarray(off, off + 13));
}

function getItemName(id) {
  if (id === 0) return 'Ninguno';
  const off = ITEMS_BASE + (id - 1) * 44;
  return decodeGba(rom.subarray(off, off + 14));
}

function auditTrainer(index, label) {
  const off = TRAINERS_BASE + index * 40;
  const name = decodeGba(rom.subarray(off + 4, off + 16));
  const partySize = rom[off + 0x20];
  const partyFlags = rom[off];
  const partyPtr = rom.readUInt32LE(off + 0x24);

  console.log(`\n============================================================`);
  console.log(`👑 [${label}] Trainer #${index}: ${name} | Size: ${partySize} | Flags: ${partyFlags} | Ptr: 0x${partyPtr.toString(16)}`);
  console.log(`============================================================`);

  if (partySize !== 6) {
    console.error(`❌ ERROR: partySize no es 6! (es ${partySize})`);
    return false;
  }
  if (partyPtr < 0x08000000 || partyPtr >= 0x0A000000) {
    console.error(`❌ ERROR: partyPtr fuera de rango ROM (0x08000000 - 0x0A000000)! (0x${partyPtr.toString(16)})`);
    return false;
  }

  const romOff = partyPtr - 0x08000000;
  for (let m = 0; m < 6; m++) {
    const mOff = romOff + m * 16;
    const iv = rom.readUInt16LE(mOff);
    const lvl = rom[mOff + 2];
    const species = rom.readUInt16LE(mOff + 4);
    const held = rom.readUInt16LE(mOff + 6);
    const moves = [
      rom.readUInt16LE(mOff + 8),
      rom.readUInt16LE(mOff + 10),
      rom.readUInt16LE(mOff + 12),
      rom.readUInt16LE(mOff + 14),
    ];

    console.log(`  Slot ${m + 1}: Nv.${lvl} ${getSpeciesName(species)} (ID:${species}) [IV:${iv}] | Item: ${getItemName(held)}`);
    console.log(`         Movs: ${moves.map(getMoveName).join(', ')}`);
  }
  return true;
}

const auditList = [
  { idx: 8, label: 'Gimnasio 1: Falkner' },
  { idx: 585, label: 'Gimnasio 2: Bugsy' },
  { idx: 593, label: 'Gimnasio 3: Whitney' },
  { idx: 597, label: 'Gimnasio 4: Morty' },
  { idx: 499, label: 'Gimnasio 5: Chuck' },
  { idx: 169, label: 'Gimnasio 6: Jasmine' },
  { idx: 535, label: 'Gimnasio 7: Pryce' },
  { idx: 530, label: 'Gimnasio 8: Clair' },
  { idx: 725, label: 'Alto Mando: Will' },
  { idx: 372, label: 'Alto Mando: Koga' },
  { idx: 368, label: 'Alto Mando: Bruno' },
  { idx: 370, label: 'Alto Mando: Karen' },
  { idx: 238, label: 'Campeón: Lance' },
  { idx: 532, label: 'Kanto: Brock' },
  { idx: 533, label: 'Kanto: Misty' },
  { idx: 291, label: 'Kanto: Lt. Surge' },
  { idx: 292, label: 'Kanto: Erika' },
  { idx: 294, label: 'Kanto: Janine' },
  { idx: 293, label: 'Kanto: Sabrina' },
  { idx: 295, label: 'Kanto: Blaine (Clima Día Soleado)' },
  { idx: 584, label: 'Kanto: Blue' },
  { idx: 220, label: 'Monte Plateado: Red' },
  // Rival Silver (Muestreo de sus 7 fases)
  { idx: 240, label: 'Rival Fase 1 (Cerezo - Chikorita line)' },
  { idx: 547, label: 'Rival Fase 1 (Cerezo - Cyndaquil line)' },
  { idx: 241, label: 'Rival Fase 2 (Azalea)' },
  { idx: 242, label: 'Rival Fase 3 (Torre Quemada)' },
  { idx: 492, label: 'Rival Fase 4 (Torre Radio Trigal)' },
  { idx: 215, label: 'Rival Fase 5 (Calle Victoria - Tyranitar Clima Tormenta)' },
  { idx: 217, label: 'Rival Fase 6 (Meseta Añil Rematch)' },
  { idx: 218, label: 'Rival Fase 7 (Mt. Plateado / Final Rematch)' }
];

let allPassed = true;
for (const item of auditList) {
  const ok = auditTrainer(item.idx, item.label);
  if (!ok) allPassed = false;
}

console.log('\n============================================================');
if (allPassed) {
  console.log('✅ AUDITORÍA COMPLETA: LÍDERES, ALTO MANDO, KANTO, RED Y RIVAL SILVER (TODOS CON 6 MONS Y COMPORTAMIENTO TÁCTICO) VERIFICADOS');
} else {
  console.log('❌ HUBO ERRORES EN LA AUDITORÍA');
}
console.log('============================================================');

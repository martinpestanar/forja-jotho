const fs = require('fs');
const path = require('path');

const ROM_PATH = path.join(__dirname, '../public/roms/pokemonHnS.gba');
const BACKUP_PATH = path.join(__dirname, '../public/roms/pokemonHnS.clean.gba');

console.log('=== HACKROM MASTER OVERHAUL PATCHER ===');

if (!fs.existsSync(BACKUP_PATH)) {
  console.log('Creando respaldo inmutable:', BACKUP_PATH);
  fs.copyFileSync(ROM_PATH, BACKUP_PATH);
}

// Cargar la ROM limpia base
const rom = fs.readFileSync(BACKUP_PATH);
console.log('ROM size:', (rom.length / 1024 / 1024).toFixed(2), 'MB');

// Base de la tabla gTrainers
const TRAINERS_BASE = 0x73C278;
// Base para inyección en el espacio libre (10.54 MB contiguos disponibles)
let freeSpaceOffset = 0x1580000;

function createMon({ iv = 25, lvl, species, heldItem = 0, moves = [0, 0, 0, 0] }) {
  const buf = Buffer.alloc(16);
  buf.writeUInt16LE(iv, 0);
  buf.writeUInt8(lvl, 2);
  buf.writeUInt8(0, 3); // padding
  buf.writeUInt16LE(species, 4);
  buf.writeUInt16LE(heldItem, 6);
  buf.writeUInt16LE(moves[0] || 0, 8);
  buf.writeUInt16LE(moves[1] || 0, 10);
  buf.writeUInt16LE(moves[2] || 0, 12);
  buf.writeUInt16LE(moves[3] || 0, 14);
  return buf;
}

function injectParty(monList) {
  const currentOffset = freeSpaceOffset;
  const partyBuf = Buffer.concat(monList.map(createMon));
  partyBuf.copy(rom, currentOffset);
  freeSpaceOffset += partyBuf.length;
  // Alinear a 4 bytes
  if (freeSpaceOffset % 4 !== 0) {
    freeSpaceOffset += (4 - (freeSpaceOffset % 4));
  }
  return 0x08000000 + currentOffset; // Puntero GBA en ROM
}

function updateTrainer(index, { partySize = 6, partyPtr, aiFlags = 0x07 }) {
  const offset = TRAINERS_BASE + index * 40;
  rom[offset] = 3; // partyFlags = F_TRAINER_PARTY_CUSTOM_MOVES | F_TRAINER_PARTY_HELD_ITEM
  rom[offset + 0x18] = 0; // doubleBattle = false
  rom.writeUInt32LE(aiFlags, offset + 0x1C); // aiFlags u32 alineado en 0x1C (CHECK_BAD_MOVE | TRY_TO_FAINT | CHECK_VIABILITY)
  rom[offset + 0x20] = partySize; // partySize
  rom.writeUInt32LE(partyPtr, offset + 0x24); // partyPtr
}

// ============================================================================
// 1. LÍDERES DE JOHTO (8 LÍDERES - 6 POKÉMON EVOLUCIONADOS C/U)
// ============================================================================
console.log('Inyectando los 8 Líderes de Johto...');

// LÍDER 1: FALKNER (Volador) - Nv 15 - 16
const falknerParty = [
  { lvl: 15, species: 17, moves: [16, 189, 98, 17] },              // Pidgeotto (Gust, Mud-Slap, Quick Attack, Wing Attack)
  { lvl: 15, species: 305, moves: [17, 98, 116, 104] },            // Swellow (Wing Attack, Quick Attack, Focus Energy, Double Team)
  { lvl: 15, species: 310, moves: [55, 17, 54, 48] },              // Pelipper (Water Gun, Wing Attack, Mist, Supersonic)
  { lvl: 15, species: 164, moves: [93, 64, 95, 115] },             // Noctowl (Confusion, Peck, Hypnosis, Reflect)
  { lvl: 15, species: 22, moves: [64, 17, 43, 98] },               // Fearow (Peck, Wing Attack, Leer, Quick Attack)
  { lvl: 16, species: 446, heldItem: 173, moves: [314, 246, 273, 118] } // Togekiss As (Air Cutter, AncientPower, Wish, Metronome) + Sitrus Berry
];
const falknerPtr = injectParty(falknerParty);
[8, 15].forEach(idx => updateTrainer(idx, { partyPtr: falknerPtr }));

// LÍDER 2: BUGSY (Bicho) - Nv 21 - 23
const bugsyParty = [
  { lvl: 21, species: 12, moves: [93, 16, 78, 147] },              // Butterfree (Confusion, Gust, Stun Spore, Spore)
  { lvl: 21, species: 15, moves: [41, 116, 31, 98] },              // Beedrill (Twineedle, Focus Energy, Fury Attack, Quick Attack)
  { lvl: 21, species: 302, moves: [17, 141, 98, 104] },            // Ninjask (Wing Attack, Leech Life, Quick Attack, Double Team)
  { lvl: 22, species: 391, moves: [157, 318, 189, 28] },           // Armaldo (Rock Slide, Silver Wind, Mud-Slap, Sand-Attack)
  { lvl: 22, species: 123, heldItem: 185, moves: [98, 210, 332, 228] }, // Scyther (Quick Attack, Fury Cutter, Aerial Ace, Pursuit) + SilverPowder
  { lvl: 23, species: 448, heldItem: 173, moves: [318, 314, 324, 98] } // Yanmega As (Silver Wind, Air Cutter, Signal Beam, Quick Attack) + Sitrus Berry
];
const bugsyPtr = injectParty(bugsyParty);
[585, 686].forEach(idx => updateTrainer(idx, { partyPtr: bugsyPtr }));

// LÍDER 3: WHITNEY (Normal) - Nv 27 - 29
const whitneyParty = [
  { lvl: 27, species: 36, moves: [118, 34, 213, 94] },             // Clefable (Metronome, Body Slam, Attract, Psychic)
  { lvl: 27, species: 40, moves: [34, 107, 102, 111] },            // Wigglytuff (Body Slam, Minimize, Mimic, Defense Curl)
  { lvl: 27, species: 372, moves: [304, 23, 238, 189] },           // Exploud (Hyper Voice, Stomp, Cross Chop, Mud-Slap)
  { lvl: 28, species: 380, moves: [163, 98, 280, 14] },            // Zangoose (Slash, Quick Attack, Brick Break, Swords Dance)
  { lvl: 28, species: 412, moves: [10, 98, 252, 280] },            // Ambipom (Scratch/Double Hit, Quick Attack, Fake Out, Brick Break)
  { lvl: 29, species: 241, heldItem: 138, moves: [205, 208, 213, 23] } // Miltank As (Rollout, Milk Drink, Attract, Stomp) + Lum Berry
];
const whitneyPtr = injectParty(whitneyParty);
[593, 596].forEach(idx => updateTrainer(idx, { partyPtr: whitneyPtr }));

// LÍDER 4: MORTY (Fantasma) - Nv 33 - 35
const mortyParty = [
  { lvl: 33, species: 93, moves: [247, 95, 138, 101] },            // Haunter (Shadow Ball, Hypnosis, Dream Eater, Night Shade)
  { lvl: 33, species: 322, moves: [247, 185, 280, 261] },          // Sableye (Shadow Ball, Faint Attack, Brick Break, Will-O-Wisp)
  { lvl: 33, species: 378, moves: [247, 261, 109, 185] },          // Banette (Shadow Ball, Will-O-Wisp, Confuse Ray, Faint Attack)
  { lvl: 34, species: 362, moves: [247, 261, 101, 109] },          // Dusclops (Shadow Ball, Will-O-Wisp, Night Shade, Confuse Ray)
  { lvl: 34, species: 434, heldItem: 210, moves: [247, 94, 261, 105] }, // Mismagius (Shadow Ball, Psychic, Will-O-Wisp, Recover) + Spell Tag
  { lvl: 35, species: 94, heldItem: 173, moves: [247, 188, 95, 138] } // Gengar As (Shadow Ball, Sludge Bomb, Hypnosis, Dream Eater) + Sitrus Berry
];
const mortyPtr = injectParty(mortyParty);
[597, 598].forEach(idx => updateTrainer(idx, { partyPtr: mortyPtr }));

// LÍDER 5: CHUCK (Lucha) - Nv 39 - 41
const chuckParty = [
  { lvl: 39, species: 57, moves: [238, 183, 184, 99] },            // Primeape (Cross Chop, Mach Punch, Scary Face, Rage)
  { lvl: 39, species: 106, moves: [136, 26, 252, 280] },           // Hitmonlee (High Jump Kick, Jump Kick, Fake Out, Brick Break)
  { lvl: 39, species: 107, moves: [7, 8, 9, 280] },                 // Hitmonchan (Fire/Ice/Thunder Punch, Brick Break)
  { lvl: 40, species: 336, moves: [252, 264, 339, 189] },           // Hariyama (Fake Out, Focus Punch, Bulk Up, Mud-Slap)
  { lvl: 40, species: 307, moves: [147, 238, 331, 183] },           // Breloom (Spore, Cross Chop, Bullet Seed, Mach Punch)
  { lvl: 41, species: 62, heldItem: 204, moves: [223, 57, 339, 95] } // Poliwrath As (DynamicPunch, Surf, Bulk Up, Hypnosis) + Black Belt
];
const chuckPtr = injectParty(chuckParty);
[499, 431, 527, 391].forEach(idx => updateTrainer(idx, { partyPtr: chuckPtr }));

// LÍDER 6: JASMINE (Acero) - Nv 44 - 46 (Clima: Tormenta de Arena con Skarmory)
const jasmineParty = [
  { lvl: 44, species: 227, moves: [201, 191, 12, 104] },           // Skarmory (Sandstorm, Spikes, Guillotine, Double Team)
  { lvl: 44, species: 384, moves: [231, 89, 157, 182] },           // Aggron (Iron Tail, Earthquake, Rock Slide, Protect)
  { lvl: 44, species: 399, moves: [232, 94, 129, 211] },           // Metang (Metal Claw, Psychic, Swift, Steel Wing)
  { lvl: 45, species: 431, heldItem: 205, moves: [85, 232, 86, 103] }, // Magnezone (Thunderbolt, Metal Claw, Thunder Wave, Screech) + Magnet
  { lvl: 45, species: 212, moves: [232, 318, 98, 14] },            // Scizor (Metal Claw, Silver Wind, Quick Attack, Swords Dance)
  { lvl: 46, species: 208, heldItem: 197, moves: [231, 89, 157, 182] } // Steelix As (Iron Tail, Earthquake, Rock Slide, Protect) + Leftovers
];
const jasminePtr = injectParty(jasmineParty);
[169, 502, 640, 416].forEach(idx => updateTrainer(idx, { partyPtr: jasminePtr }));

// LÍDER 7: PRYCE (Hielo) - Nv 49 - 51 (Clima: Granizo con Dewgong)
const pryceParty = [
  { lvl: 49, species: 87, moves: [258, 57, 156, 58] },             // Dewgong (Hail, Surf, Rest, Ice Beam)
  { lvl: 49, species: 347, moves: [58, 184, 153, 104] },           // Glalie (Ice Beam, Scary Face, Explosion, Double Team)
  { lvl: 49, species: 343, moves: [58, 57, 258, 34] },             // Walrein (Ice Beam, Surf, Hail, Body Slam)
  { lvl: 50, species: 422, moves: [58, 247, 109, 104] },           // Froslass (Ice Beam, Shadow Ball, Confuse Ray, Double Team)
  { lvl: 50, species: 447, heldItem: 180, moves: [185, 232, 98, 14] }, // Weavile (Faint Attack, Metal Claw, Quick Attack, Swords Dance) + Quick Claw
  { lvl: 51, species: 432, heldItem: 209, moves: [59, 89, 36, 189] } // Mamoswine As (Blizzard, Earthquake, Take Down, Mud-Slap) + NeverMeltIce
];
const prycePtr = injectParty(pryceParty);
[535, 567, 696, 233].forEach(idx => updateTrainer(idx, { partyPtr: prycePtr }));

// LÍDER 8: CLAIR (Dragón) - Nv 54 - 56 (Clima: Danza Lluvia con Dragonair)
const clairParty = [
  { lvl: 54, species: 148, moves: [240, 57, 85, 86] },             // Dragonair (Rain Dance, Surf, Thunderbolt, Thunder Wave)
  { lvl: 54, species: 130, moves: [56, 127, 89, 19] },             // Gyarados (Hydro Pump, Waterfall, Earthquake, Fly/Bite)
  { lvl: 54, species: 359, moves: [225, 332, 349, 105] },          // Altaria (Dragonbreath, Aerial Ace, Dragon Dance, Recover)
  { lvl: 55, species: 334, moves: [89, 337, 318, 104] },           // Flygon (Earthquake, Dragon Claw, Silver Wind, Double Team)
  { lvl: 55, species: 397, heldItem: 213, moves: [337, 53, 332, 349] }, // Salamence (Dragon Claw, Flamethrower, Aerial Ace, Dragon Dance) + Dragon Fang
  { lvl: 56, species: 230, heldItem: 173, moves: [56, 58, 225, 349] } // Kingdra As (Hydro Pump, Ice Beam, Dragonbreath, Dragon Dance) + Sitrus Berry (Swift Swim en Lluvia!)
];
const clairPtr = injectParty(clairParty);
[530, 531].forEach(idx => updateTrainer(idx, { partyPtr: clairPtr }));

// ============================================================================
// 2. LIGA POKÉMON (MESETA AÑIL - ALTO MANDO & CAMPEÓN LANCE) - Nv 58 - 68
// ============================================================================
console.log('Inyectando Alto Mando y Campeón Lance...');

// WILL (Psíquico) - Nv 58 - 60
const willParty = [
  { lvl: 58, species: 178, moves: [94, 109, 105, 332] },           // Xatu (Psychic, Confuse Ray, Recover, Aerial Ace)
  { lvl: 58, species: 124, moves: [58, 94, 142, 112] },            // Jynx (Ice Beam, Psychic, Lovely Kiss, Reflect)
  { lvl: 59, species: 80, moves: [57, 94, 250, 111] },             // Slowbro (Surf, Psychic, Rest, Amnesia)
  { lvl: 59, species: 103, moves: [94, 76, 73, 113] },             // Exeggutor (Psychic, Solarbeam, Leech Seed, Light Screen)
  { lvl: 59, species: 282, moves: [94, 85, 100, 104] },            // Gardevoir (Psychic, Thunderbolt, Teleport/Calm Mind, Double Team)
  { lvl: 60, species: 423, heldItem: 173, moves: [94, 238, 14, 246] } // Gallade As (Psychic, Cross Chop, Swords Dance, AncientPower) + Sitrus Berry
];
const willPtr = injectParty(willParty);
[725, 365].forEach(idx => updateTrainer(idx, { partyPtr: willPtr }));

// KOGA (Veneno) - Nv 60 - 62
const kogaParty = [
  { lvl: 60, species: 168, moves: [188, 41, 109, 169] },           // Ariados (Sludge Bomb, Twineedle, Confuse Ray, Spider Web)
  { lvl: 60, species: 89, moves: [188, 124, 151, 107] },            // Muk (Sludge Bomb, Acid Armor, Minimize, Toxic)
  { lvl: 61, species: 205, moves: [191, 153, 182, 106] },          // Forretress (Spikes, Explosion, Protect, Harden)
  { lvl: 61, species: 368, moves: [188, 151, 105, 189] },          // Swalot (Sludge Bomb, Acid Armor, Recover, Mud-Slap)
  { lvl: 61, species: 443, moves: [188, 76, 147, 105] },           // Roserade (Sludge Bomb, Solarbeam/Giga Drain, Stun Spore, Synthesize)
  { lvl: 62, species: 169, heldItem: 180, moves: [188, 332, 109, 141] } // Crobat As (Sludge Bomb, Aerial Ace, Confuse Ray, Leech Life) + Quick Claw
];
const kogaPtr = injectParty(kogaParty);
[372, 193].forEach(idx => updateTrainer(idx, { partyPtr: kogaPtr }));

// BRUNO (Lucha) - Nv 62 - 64
const brunoParty = [
  { lvl: 62, species: 106, moves: [136, 26, 252, 280] },           // Hitmonlee (High Jump Kick, Jump Kick, Fake Out, Brick Break)
  { lvl: 62, species: 107, moves: [7, 8, 9, 280] },                 // Hitmonchan (Fire/Ice/Thunder Punch, Brick Break)
  { lvl: 63, species: 237, moves: [238, 229, 98, 104] },           // Hitmontop (Cross Chop, Rapid Spin, Quick Attack, Double Team)
  { lvl: 63, species: 336, moves: [252, 264, 339, 89] },           // Hariyama (Fake Out, Focus Punch, Bulk Up, Earthquake)
  { lvl: 63, species: 357, moves: [136, 94, 339, 105] },           // Medicham (High Jump Kick, Psychic, Bulk Up, Recover)
  { lvl: 64, species: 68, heldItem: 204, moves: [238, 89, 157, 339] } // Machamp As (Cross Chop, Earthquake, Rock Slide, Bulk Up) + Black Belt
];
const brunoPtr = injectParty(brunoParty);
[368, 369].forEach(idx => updateTrainer(idx, { partyPtr: brunoPtr }));

// KAREN (Siniestro) - Nv 64 - 66
const karenParty = [
  { lvl: 64, species: 197, moves: [185, 109, 105, 104] },          // Umbreon (Faint Attack, Confuse Ray, Moonlight, Double Team)
  { lvl: 64, species: 45, moves: [188, 76, 147, 105] },            // Vileplume (Sludge Bomb, Petal Dance, Sleep Powder, Moonlight)
  { lvl: 65, species: 376, moves: [185, 163, 14, 98] },            // Absol (Faint Attack, Slash, Swords Dance, Quick Attack)
  { lvl: 65, species: 300, moves: [185, 76, 252, 104] },           // Shiftry (Faint Attack, Giga Drain, Fake Out, Double Team)
  { lvl: 65, species: 427, moves: [185, 332, 109, 14] },           // Honchkrow (Faint Attack, Aerial Ace, Confuse Ray, Swords Dance)
  { lvl: 66, species: 229, heldItem: 212, moves: [53, 185, 188, 261] } // Houndoom As (Flamethrower, Crunch/Faint Attack, Sludge Bomb, Will-O-Wisp) + Charcoal
];
const karenPtr = injectParty(karenParty);
[370, 371].forEach(idx => updateTrainer(idx, { partyPtr: karenPtr }));

// LANCE (Campeón) - Nv 66 - 68
const lanceParty = [
  { lvl: 66, species: 130, moves: [56, 89, 127, 19] },             // Gyarados (Hydro Pump, Earthquake, Waterfall, Bite)
  { lvl: 66, species: 6, moves: [53, 332, 163, 89] },              // Charizard (Flamethrower, Aerial Ace, Slash, Earthquake)
  { lvl: 67, species: 142, moves: [157, 332, 89, 104] },           // Aerodactyl (Rock Slide, Aerial Ace, Earthquake, Double Team)
  { lvl: 67, species: 359, moves: [225, 332, 349, 105] },          // Altaria (Dragonbreath, Aerial Ace, Dragon Dance, Recover)
  { lvl: 67, species: 397, moves: [337, 53, 332, 349] },           // Salamence (Dragon Claw, Flamethrower, Aerial Ace, Dragon Dance)
  { lvl: 68, species: 149, heldItem: 173, moves: [337, 53, 85, 58] } // Dragonite As (Dragon Claw, Flamethrower, Thunderbolt, Ice Beam) + Sitrus Berry
];
const lancePtr = injectParty(lanceParty);
[238, 239].forEach(idx => updateTrainer(idx, { partyPtr: lancePtr }));

// ============================================================================
// 3. LÍDERES DE KANTO Y RED (MONTE PLATEADO) - Nv 69 - 88
// ============================================================================
console.log('Inyectando Líderes de Kanto y Red...');

// BROCK - Nv 69 - 71
const brockParty = [
  { lvl: 69, species: 76, moves: [157, 89, 153, 106] },            // Golem
  { lvl: 69, species: 208, moves: [231, 89, 157, 182] },           // Steelix
  { lvl: 70, species: 369, moves: [57, 157, 36, 111] },            // Relicanth
  { lvl: 70, species: 391, moves: [157, 318, 89, 28] },            // Armaldo
  { lvl: 70, species: 442, moves: [89, 157, 189, 182] },           // Rhyperior
  { lvl: 71, species: 248, heldItem: 173, moves: [157, 89, 242, 225] } // Tyranitar As + Sitrus Berry
];
updateTrainer(532, { partyPtr: injectParty(brockParty) });

// MISTY - Nv 70 - 72
const mistyParty = [
  { lvl: 70, species: 55, moves: [57, 94, 58, 93] },               // Golduck
  { lvl: 70, species: 195, moves: [57, 89, 105, 106] },            // Quagsire
  { lvl: 71, species: 131, moves: [57, 58, 34, 109] },             // Lapras
  { lvl: 71, species: 297, moves: [57, 76, 252, 104] },            // Ludicolo
  { lvl: 71, species: 329, moves: [57, 58, 105, 109] },            // Milotic
  { lvl: 72, species: 121, heldItem: 197, moves: [57, 94, 85, 58] } // Starmie As + Leftovers
];
updateTrainer(533, { partyPtr: injectParty(mistyParty) });

// LT. SURGE - Nv 71 - 73
const surgeParty = [
  { lvl: 71, species: 26, moves: [85, 98, 86, 104] },              // Raichu
  { lvl: 71, species: 82, moves: [85, 86, 153, 103] },             // Magneton
  { lvl: 72, species: 101, moves: [85, 153, 103, 104] },           // Electrode
  { lvl: 72, species: 338, moves: [85, 98, 184, 104] },            // Manectric
  { lvl: 72, species: 431, moves: [85, 232, 86, 103] },            // Magnezone
  { lvl: 73, species: 421, heldItem: 205, moves: [85, 238, 7, 8] } // Electivire As + Magnet
];
updateTrainer(291, { partyPtr: injectParty(surgeParty) });

// ERIKA - Nv 72 - 74
const erikaParty = [
  { lvl: 72, species: 182, moves: [76, 147, 105, 104] },           // Bellossom
  { lvl: 72, species: 71, moves: [188, 76, 147, 105] },            // Victreebel
  { lvl: 73, species: 300, moves: [76, 185, 252, 104] },           // Shiftry
  { lvl: 73, species: 389, moves: [157, 76, 105, 106] },           // Cradily
  { lvl: 73, species: 445, moves: [76, 188, 105, 111] },           // Tangrowth
  { lvl: 74, species: 443, heldItem: 202, moves: [188, 76, 147, 105] } // Roserade As + Miracle Seed
];
updateTrainer(292, { partyPtr: injectParty(erikaParty) });

// JANINE - Nv 73 - 75
const janineParty = [
  { lvl: 73, species: 168, moves: [188, 41, 109, 169] },           // Ariados
  { lvl: 73, species: 110, moves: [188, 153, 109, 106] },          // Weezing
  { lvl: 74, species: 379, moves: [188, 185, 109, 104] },          // Seviper
  { lvl: 74, species: 443, moves: [188, 76, 147, 105] },           // Roserade
  { lvl: 74, species: 89, moves: [188, 124, 151, 107] },            // Muk
  { lvl: 75, species: 169, heldItem: 180, moves: [188, 332, 109, 141] } // Crobat As + Quick Claw
];
updateTrainer(294, { partyPtr: injectParty(janineParty) });

// SABRINA - Nv 74 - 76
const sabrinaParty = [
  { lvl: 74, species: 122, moves: [94, 113, 115, 102] },           // Mr. Mime
  { lvl: 74, species: 196, moves: [94, 109, 105, 98] },            // Espeon
  { lvl: 75, species: 319, moves: [94, 89, 157, 106] },            // Claydol
  { lvl: 75, species: 400, moves: [232, 94, 89, 182] },            // Metagross
  { lvl: 75, species: 423, moves: [94, 238, 14, 246] },            // Gallade
  { lvl: 76, species: 65, heldItem: 173, moves: [94, 247, 105, 104] } // Alakazam As + Sitrus Berry
];
updateTrainer(293, { partyPtr: injectParty(sabrinaParty) });

// BLAINE - Nv 75 - 77 (Clima: Día Soleado con Ninetales)
const blaineParty = [
  { lvl: 75, species: 38, moves: [241, 53, 109, 261] },             // Ninetales (Sunny Day, Flamethrower, Confuse Ray, Will-O-Wisp)
  { lvl: 75, species: 78, moves: [53, 23, 98, 104] },              // Rapidash
  { lvl: 76, species: 321, moves: [53, 189, 106, 111] },           // Torkoal
  { lvl: 76, species: 340, moves: [53, 89, 157, 182] },            // Camerupt
  { lvl: 76, species: 229, moves: [53, 185, 188, 261] },           // Houndoom
  { lvl: 77, species: 430, heldItem: 212, moves: [126, 53, 85, 109] } // Magmortar As + Charcoal
];
updateTrainer(295, { partyPtr: injectParty(blaineParty) });

// BLUE (Campeón Rival) - Nv 77 - 79
const blueParty = [
  { lvl: 77, species: 18, moves: [332, 98, 14, 104] },             // Pidgeot
  { lvl: 77, species: 65, moves: [94, 247, 105, 104] },            // Alakazam
  { lvl: 78, species: 442, moves: [89, 157, 189, 182] },           // Rhyperior
  { lvl: 78, species: 130, moves: [56, 89, 127, 19] },             // Gyarados
  { lvl: 78, species: 59, moves: [53, 98, 242, 109] },             // Arcanine
  { lvl: 79, species: 248, heldItem: 197, moves: [157, 89, 242, 225] } // Tyranitar As + Leftovers
];
const bluePtr = injectParty(blueParty);
[584, 271].forEach(idx => updateTrainer(idx, { partyPtr: bluePtr }));

// RED (Monte Plateado) - Nv 85 - 88
const redParty = [
  { lvl: 88, species: 25, heldItem: 221, moves: [85, 98, 231, 86] },     // Pikachu (Thunderbolt, Quick Attack, Iron Tail, Thunder Wave) + Light Ball
  { lvl: 86, species: 131, heldItem: 197, moves: [58, 57, 34, 109] },    // Lapras (Ice Beam, Surf, Body Slam, Confuse Ray) + Leftovers
  { lvl: 86, species: 143, heldItem: 197, moves: [34, 250, 156, 89] },   // Snorlax (Body Slam, Snore/Rest, Rest, Earthquake) + Leftovers
  { lvl: 86, species: 3, heldItem: 202, moves: [76, 188, 73, 147] },     // Venusaur (Solarbeam, Sludge Bomb, Leech Seed, Sleep Powder) + Miracle Seed
  { lvl: 86, species: 9, heldItem: 206, moves: [56, 58, 89, 111] },      // Blastoise (Hydro Pump, Ice Beam, Earthquake, Skull Bash) + Mystic Water
  { lvl: 87, species: 6, heldItem: 212, moves: [53, 332, 163, 89] }      // Charizard (Flamethrower, Aerial Ace, Slash, Earthquake) + Charcoal
];
updateTrainer(220, { partyPtr: injectParty(redParty) });

// ============================================================================
// 4. RIVAL SILVER COMPETITIVO (7 ENCUENTROS - 21 ENTRENADORES - 6 MONS ESCALABLES)
// ============================================================================
console.log('Inyectando Rival Silver competitivo (7 Fases, 6 Pokémon c/u)...');

// Helper para crear parties del rival compartiendo los 5 miembros principales + starter correspondiente
function createRivalParty(coreMons, starterMon) {
  return [...coreMons, starterMon];
}

// FASE 1: CIUDAD CEREZO (Nv. 11 - 12)
const rivalF1Core = [
  { lvl: 11, species: 41, moves: [141, 48, 109, 44] },             // Zubat (Leech Life, Supersonic, Confuse Ray, Bite)
  { lvl: 11, species: 92, moves: [122, 95, 180, 101] },            // Gastly (Lick, Hypnosis, Spite, Night Shade)
  { lvl: 11, species: 215, moves: [98, 10, 43, 44] },              // Sneasel (Quick Attack, Scratch, Leer, Bite)
  { lvl: 11, species: 81, moves: [84, 86, 48, 104] },              // Magnemite (Thundershock, Thunder Wave, Supersonic, Double Team)
  { lvl: 11, species: 246, moves: [44, 201, 88, 43] }              // Larvitar (Bite, Sandstorm 201, Rock Throw, Leer)
];
const rival240Ptr = injectParty(createRivalParty(rivalF1Core, { lvl: 12, species: 152, heldItem: 173, moves: [71, 74, 73, 113] })); // Chikorita
const rival547Ptr = injectParty(createRivalParty(rivalF1Core, { lvl: 12, species: 155, heldItem: 173, moves: [52, 98, 108, 43] })); // Cyndaquil
const rival594Ptr = injectParty(createRivalParty(rivalF1Core, { lvl: 12, species: 158, heldItem: 173, moves: [55, 44, 184, 43] })); // Totodile
updateTrainer(240, { partyPtr: rival240Ptr });
updateTrainer(547, { partyPtr: rival547Ptr });
updateTrainer(594, { partyPtr: rival594Ptr });

// FASE 2: PUEBLO AZALEA (Nv. 18 - 20)
const rivalF2Core = [
  { lvl: 18, species: 41, moves: [17, 44, 109, 92] },              // Zubat (Wing Attack, Bite, Confuse Ray, Toxic)
  { lvl: 18, species: 93, moves: [247, 95, 174, 101] },            // Haunter (Shadow Ball, Hypnosis, Curse, Night Shade)
  { lvl: 19, species: 215, moves: [185, 98, 196, 43] },            // Sneasel (Faint Attack, Quick Attack, Icy Wind, Leer)
  { lvl: 19, species: 82, moves: [85, 86, 48, 103] },              // Magneton (Thunderbolt, Thunder Wave, Supersonic, Screech)
  { lvl: 19, species: 246, moves: [157, 44, 201, 184] }            // Larvitar (Rock Slide, Bite, Sandstorm 201, Scary Face)
];
const rival241Ptr = injectParty(createRivalParty(rivalF2Core, { lvl: 20, species: 153, heldItem: 173, moves: [75, 73, 115, 34] })); // Bayleef
const rival340Ptr = injectParty(createRivalParty(rivalF2Core, { lvl: 20, species: 156, heldItem: 173, moves: [53, 98, 108, 189] })); // Quilava
const rival614Ptr = injectParty(createRivalParty(rivalF2Core, { lvl: 20, species: 159, heldItem: 173, moves: [57, 44, 184, 163] })); // Croconaw
updateTrainer(241, { partyPtr: rival241Ptr });
updateTrainer(340, { partyPtr: rival340Ptr });
updateTrainer(614, { partyPtr: rival614Ptr });

// FASE 3: TORRE QUEMADA (Nv. 26 - 28)
const rivalF3Core = [
  { lvl: 26, species: 42, moves: [17, 188, 109, 44] },             // Golbat (Wing Attack, Sludge Bomb, Confuse Ray, Bite)
  { lvl: 26, species: 93, moves: [247, 95, 138, 109] },            // Haunter (Shadow Ball, Hypnosis, Dream Eater, Confuse Ray)
  { lvl: 27, species: 215, moves: [185, 163, 196, 14] },           // Sneasel (Faint Attack, Slash, Icy Wind, Swords Dance)
  { lvl: 27, species: 82, moves: [85, 86, 232, 103] },             // Magneton (Thunderbolt, Thunder Wave, Metal Claw, Screech)
  { lvl: 27, species: 247, moves: [157, 89, 201, 184] }            // Pupitar (Rock Slide, Earthquake, Sandstorm 201, Scary Face)
];
const rival242Ptr = injectParty(createRivalParty(rivalF3Core, { lvl: 28, species: 153, heldItem: 173, moves: [76, 73, 113, 34] })); // Bayleef
const rival738Ptr = injectParty(createRivalParty(rivalF3Core, { lvl: 28, species: 156, heldItem: 173, moves: [53, 98, 163, 189] })); // Quilava
const rival315Ptr = injectParty(createRivalParty(rivalF3Core, { lvl: 28, species: 159, heldItem: 173, moves: [57, 242, 163, 184] })); // Croconaw
updateTrainer(242, { partyPtr: rival242Ptr });
updateTrainer(738, { partyPtr: rival738Ptr });
updateTrainer(315, { partyPtr: rival315Ptr });

// FASE 4: TORRE RADIO TRIGAL (Nv. 42 - 44)
const rivalF4Core = [
  { lvl: 42, species: 42, moves: [188, 332, 109, 141] },           // Golbat (Sludge Bomb, Aerial Ace, Confuse Ray, Leech Life)
  { lvl: 42, species: 94, moves: [247, 188, 95, 85] },             // Gengar (Shadow Ball, Sludge Bomb, Hypnosis, Thunderbolt)
  { lvl: 43, species: 447, heldItem: 180, moves: [185, 58, 14, 280] }, // Weavile (Faint Attack, Ice Beam, Swords Dance, Brick Break) + Quick Claw
  { lvl: 43, species: 431, heldItem: 205, moves: [85, 232, 86, 103] }, // Magnezone (Thunderbolt, Metal Claw, Thunder Wave, Screech) + Magnet
  { lvl: 43, species: 247, moves: [157, 89, 201, 349] }            // Pupitar (Rock Slide, Earthquake, Sandstorm 201, Dragon Dance)
];
const rival541Ptr = injectParty(createRivalParty(rivalF4Core, { lvl: 44, species: 154, heldItem: 173, moves: [76, 188, 73, 113] })); // Meganium
const rival610Ptr = injectParty(createRivalParty(rivalF4Core, { lvl: 44, species: 157, heldItem: 173, moves: [53, 85, 89, 98] }));   // Typhlosion
const rival492Ptr = injectParty(createRivalParty(rivalF4Core, { lvl: 44, species: 160, heldItem: 173, moves: [56, 58, 89, 242] }));  // Feraligatr
updateTrainer(541, { partyPtr: rival541Ptr });
updateTrainer(610, { partyPtr: rival610Ptr });
updateTrainer(492, { partyPtr: rival492Ptr });

// FASE 5: CALLE VICTORIA (Nv. 54 - 56 - Clima Tormenta de Arena con Tyranitar)
const rivalF5Core = [
  { lvl: 54, species: 169, heldItem: 180, moves: [188, 332, 109, 92] }, // Crobat (Sludge Bomb, Aerial Ace, Confuse Ray, Toxic) + Quick Claw
  { lvl: 54, species: 94, moves: [247, 85, 94, 194] },             // Gengar (Shadow Ball, Thunderbolt, Psychic, Destiny Bond)
  { lvl: 55, species: 447, heldItem: 173, moves: [185, 58, 14, 280] }, // Weavile (Faint Attack, Ice Beam, Swords Dance, Brick Break) + Sitrus Berry
  { lvl: 55, species: 431, heldItem: 205, moves: [85, 232, 86, 112] }, // Magnezone (Thunderbolt, Metal Claw, Thunder Wave, Reflect) + Magnet
  { lvl: 56, species: 248, heldItem: 197, moves: [157, 89, 201, 242] } // Tyranitar (Rock Slide, Earthquake, Sandstorm 201, Crunch) + Leftovers
];
const rival544Ptr = injectParty(createRivalParty(rivalF5Core, { lvl: 56, species: 154, heldItem: 173, moves: [76, 188, 105, 339] })); // Meganium
const rival611Ptr = injectParty(createRivalParty(rivalF5Core, { lvl: 56, species: 157, heldItem: 173, moves: [53, 85, 89, 241] }));   // Typhlosion
const rival215Ptr = injectParty(createRivalParty(rivalF5Core, { lvl: 56, species: 160, heldItem: 173, moves: [56, 58, 89, 349] }));  // Feraligatr
updateTrainer(544, { partyPtr: rival544Ptr });
updateTrainer(611, { partyPtr: rival611Ptr });
updateTrainer(215, { partyPtr: rival215Ptr });

// FASE 6: MESETA AÑIL REMATCH (Nv. 66 - 68)
const rivalF6Core = [
  { lvl: 66, species: 169, heldItem: 180, moves: [188, 332, 109, 141] }, // Crobat + Quick Claw
  { lvl: 66, species: 94, moves: [247, 85, 94, 194] },             // Gengar
  { lvl: 67, species: 454, heldItem: 204, moves: [89, 163, 339, 157] }, // Ursaluna + Black Belt
  { lvl: 67, species: 421, heldItem: 205, moves: [85, 238, 7, 8] },    // Electivire + Magnet
  { lvl: 68, species: 248, heldItem: 197, moves: [157, 89, 349, 242] } // Tyranitar + Leftovers
];
const rival545Ptr = injectParty(createRivalParty(rivalF6Core, { lvl: 68, species: 154, heldItem: 173, moves: [76, 188, 105, 339] }));
const rival612Ptr = injectParty(createRivalParty(rivalF6Core, { lvl: 68, species: 157, heldItem: 173, moves: [53, 85, 89, 241] }));
const rival217Ptr = injectParty(createRivalParty(rivalF6Core, { lvl: 68, species: 160, heldItem: 173, moves: [56, 58, 89, 349] }));
updateTrainer(545, { partyPtr: rival545Ptr });
updateTrainer(612, { partyPtr: rival612Ptr });
updateTrainer(217, { partyPtr: rival217Ptr });

// FASE 7: MONTE PLATEADO / REMATCH FINAL (Nv. 76 - 78)
const rivalF7Core = [
  { lvl: 76, species: 169, heldItem: 180, moves: [188, 332, 109, 92] }, // Crobat + Quick Claw
  { lvl: 76, species: 94, moves: [247, 85, 94, 188] },             // Gengar
  { lvl: 77, species: 454, heldItem: 197, moves: [89, 339, 157, 304] }, // Ursaluna + Leftovers
  { lvl: 77, species: 397, heldItem: 213, moves: [337, 53, 89, 349] }, // Salamence + Dragon Fang
  { lvl: 78, species: 248, heldItem: 197, moves: [157, 89, 242, 201] } // Tyranitar + Leftovers
];
const rival546Ptr = injectParty(createRivalParty(rivalF7Core, { lvl: 78, species: 154, heldItem: 138, moves: [76, 188, 105, 339] }));
const rival613Ptr = injectParty(createRivalParty(rivalF7Core, { lvl: 78, species: 157, heldItem: 138, moves: [53, 85, 89, 241] }));
const rival218Ptr = injectParty(createRivalParty(rivalF7Core, { lvl: 78, species: 160, heldItem: 138, moves: [56, 58, 89, 349] }));
updateTrainer(546, { partyPtr: rival546Ptr });
updateTrainer(613, { partyPtr: rival613Ptr });
updateTrainer(218, { partyPtr: rival218Ptr });

// ============================================================================
// 5. HIERBA ALTA (WILD ENCOUNTERS BOOST) - RUTAS 29, 30, 31, 32...
// ============================================================================
console.log('Rebalanceando hierba alta (Wild Encounters)...');

// Header de rutas tempranas: tabla de 12 slots
// Buscamos todas las tablas de encuentros terrestres y elevamos el nivel mínimo y máximo
// para que el alumno pueda farmear experiencia con mayor rapidez y entrenar para Falkner
let boostedTables = 0;
for (let off = 0x300000; off < rom.length - 48; off += 4) {
  let isEarlyWild = true;
  for (let s = 0; s < 12; s++) {
    const min = rom[off + s * 4];
    const max = rom[off + s * 4 + 1];
    const sp = rom.readUInt16LE(off + s * 4 + 2);
    if (!(min >= 1 && min <= 5 && max >= min && max <= 7 && sp >= 1 && sp <= 450)) {
      isEarlyWild = false;
      break;
    }
  }
  if (isEarlyWild) {
    // Es una tabla de ruta temprana (niveles 2-5). La subimos a nivel 6 - 10!
    for (let s = 0; s < 12; s++) {
      rom[off + s * 4] = Math.min(10, rom[off + s * 4] + 5);     // minLevel + 5
      rom[off + s * 4 + 1] = Math.min(12, rom[off + s * 4 + 1] + 5); // maxLevel + 5
    }
    boostedTables++;
  }
}
console.log('Tablas de hierba alta temprana potenciadas a Nv.6-12:', boostedTables);

// ============================================================================
// 6. ESCALADO DE ENTRENADORES DE RUTA (Curva continua Nv.7 - 50)
// ============================================================================
console.log('Ajustando entrenadores de ruta...');
let routeTrainersCount = 0;
// Modificamos entrenadores comunes (evitando tocar a los líderes y rivales que acabamos de repuntear)
const protectedIndices = new Set([
  8, 15, 585, 686, 593, 596, 597, 598, 499, 431, 527, 391,
  169, 502, 640, 416, 535, 567, 696, 233, 530, 531,
  725, 365, 372, 193, 368, 369, 370, 371, 238, 239,
  532, 533, 291, 292, 294, 293, 295, 584, 271, 220,
  // 21 Entrenadores del Rival Silver (7 Fases)
  240, 547, 594, 241, 340, 614, 242, 738, 315, 541, 610, 492,
  544, 611, 215, 545, 612, 217, 546, 613, 218
]);

for (let i = 1; i < 700; i++) {
  if (protectedIndices.has(i)) continue;
  const off = TRAINERS_BASE + i * 40;
  const pSize = rom[off + 0x20];
  const pPtr = rom.readUInt32LE(off + 0x24);
  const pFlags = rom[off];

  if (pPtr >= 0x08000000 && pPtr < 0x08000000 + rom.length && pSize > 0 && pSize <= 6) {
    const romOff = pPtr - 0x08000000;
    // Si es un entrenador con partyFlags == 0 (struct TrainerMonNoItemDefaultMoves: iv: u16, lvl: u8, species: u16)
    // El tamaño de cada mon es 8 bytes
    if (pFlags === 0) {
      for (let m = 0; m < pSize; m++) {
        const monOff = romOff + m * 8;
        const currentLvl = rom[monOff + 2];
        if (currentLvl >= 1 && currentLvl <= 12) {
          // Subir niveles bajos a rango 8-14
          rom[monOff + 2] = currentLvl + 6;
          routeTrainersCount++;
        }
      }
    }
  }
}
console.log('Entrenadores de ruta rebalanceados con curva desafiante:', routeTrainersCount);

// ============================================================================
// 7. BYPASS DEL MENÚ DE PERSONALIZACIÓN INICIAL (DIFICULTAD / RETOS / RANDOMIZER)
// ============================================================================
console.log('Aplicando bypass al menú de personalización inicial (Oak/Elm Speech)...');
// En 0x144920: cambiamos el puntero de la siguiente tarea tras elegir Chico/Chica
// Original: 0x08144b49 (llama al menú de Dificultad, Nuzlocke y Randomizer)
// Nuevo:    0x08144be1 (salta directo a pedir el Nombre del jugador y arrancar la partida limpia)
rom.writeUInt32LE(0x08144be1, 0x144920);
console.log('✅ Bypass aplicado: el alumno pasa directamente de Chico/Chica -> Nombre -> Pueblo Primavera.');

// ============================================================================
// 8. ECONOMÍA DE ESCASEZ MÉDICA: PRECIOS PROHIBITIVOS EN POKÉ MARTS (gItems)
// ============================================================================
console.log('Ajustando economía médica prohibitiva en gItems (Poké Marts)...');
const ITEMS_BASE = 0x8FE9C0;
const LUXURY_PRICES = {
  18: 1200,   // Potion (Cura 20 PS) - De ₽300 a ₽1,200
  27: 3500,   // Super Potion (Cura 50 PS) - De ₽700 a ₽3,500
  26: 8000,   // Hyper Potion (Cura 200 PS) - De ₽1,200 a ₽8,000
  25: 12000,  // Max Potion (Cura todo) - De ₽2,500 a ₽12,000
  24: 25000,  // Full Restore - De ₽3,000 a ₽25,000
  29: 15000,  // Revive - De ₽1,500 a ₽15,000 (¡Comprar cuesta 200+ batallas!)
  30: 35000,  // Max Revive - De ₽4,000 a ₽35,000
  28: 2000,   // Full Heal - De ₽600 a ₽2,000
  19: 1000,   // Antidote
  20: 1000,   // Burn Heal
  21: 1000,   // Ice Heal
  22: 1000,   // Awakening
  23: 1000,   // Parlyz Heal
  31: 800,    // Fresh Water
  32: 1200,   // Soda Pop
  33: 1600,   // Lemonade
  34: 2500,   // Moomoo Milk
  38: 20000,  // Revival Herb
};

let patchedItemsCount = 0;
Object.entries(LUXURY_PRICES).forEach(([idStr, newPrice]) => {
  const itemId = Number(idStr);
  const itemOffset = ITEMS_BASE + (itemId - 1) * 44;
  rom.writeUInt16LE(newPrice, itemOffset + 16);
  patchedItemsCount++;
});
console.log(`✅ ${patchedItemsCount} Medicinas calibradas a precios de lujo en la ROM para blindar el valor de las tareas.`);

// ============================================================================
// GUARDAR LA ROM PARCHEADA
// ============================================================================
fs.writeFileSync(ROM_PATH, rom);
console.log('✅ ROM Guardada con éxito en:', ROM_PATH);
console.log('Espacio libre utilizado:', ((freeSpaceOffset - 0x1580000) / 1024).toFixed(2), 'KB de 10.54 MB disponibles.');

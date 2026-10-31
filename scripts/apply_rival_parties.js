const fs = require('fs');
const path = require('path');

const PARTY_FILE = path.join(__dirname, '../pokehns-expansion/src/data/trainers_hns.party');
let content = fs.readFileSync(PARTY_FILE, 'utf8');

console.log('--- Applying Custom Rival Silver Parties (7 Phases, 6 mons c/u) ---');

// FASE 1: CIUDAD CEREZO (Nv. 11 - 12)
const rivalF1Core = `Zubat
Level: 11
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Leech Life
- Supersonic
- Confuse Ray
- Bite

Gastly
Level: 11
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Lick
- Hypnosis
- Spite
- Night Shade

Sneasel
Level: 11
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Quick Attack
- Scratch
- Leer
- Bite

Magnemite
Level: 11
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunder Shock
- Thunder Wave
- Supersonic
- Double Team

Larvitar
Level: 11
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Bite
- Sandstorm
- Rock Throw
- Leer`;

// FASE 2: PUEBLO AZALEA (Nv. 18 - 20)
const rivalF2Core = `Zubat
Level: 18
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Wing Attack
- Bite
- Confuse Ray
- Toxic

Haunter
Level: 18
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Hypnosis
- Curse
- Night Shade

Sneasel
Level: 19
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Quick Attack
- Icy Wind
- Leer

Magneton
Level: 19
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Thunder Wave
- Supersonic
- Screech

Larvitar
Level: 19
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Bite
- Sandstorm
- Scary Face`;

// FASE 3: TORRE QUEMADA (Nv. 26 - 28)
const rivalF3Core = `Golbat
Level: 26
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Wing Attack
- Sludge Bomb
- Confuse Ray
- Bite

Haunter
Level: 26
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Hypnosis
- Dream Eater
- Confuse Ray

Sneasel
Level: 27
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Slash
- Icy Wind
- Swords Dance

Magneton
Level: 27
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Thunder Wave
- Metal Claw
- Screech

Pupitar
Level: 27
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Sandstorm
- Scary Face`;

// FASE 4: TORRE RADIO TRIGAL (Nv. 42 - 44)
const rivalF4Core = `Golbat
Level: 42
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Aerial Ace
- Confuse Ray
- Leech Life

Gengar
Level: 42
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Sludge Bomb
- Hypnosis
- Thunderbolt

Weavile @ Quick Claw
Level: 43
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Ice Beam
- Swords Dance
- Brick Break

Magnezone @ Magnet
Level: 43
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Metal Claw
- Thunder Wave
- Screech

Pupitar
Level: 43
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Sandstorm
- Dragon Dance`;

// FASE 5: CALLE VICTORIA (Nv. 54 - 56)
const rivalF5Core = `Crobat @ Quick Claw
Level: 54
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Aerial Ace
- Confuse Ray
- Toxic

Gengar
Level: 54
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Thunderbolt
- Psychic
- Destiny Bond

Weavile @ Sitrus Berry
Level: 55
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Ice Beam
- Swords Dance
- Brick Break

Magnezone @ Magnet
Level: 55
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Metal Claw
- Thunder Wave
- Reflect

Tyranitar @ Leftovers
Level: 56
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Sandstorm
- Crunch`;

// FASE 6: MESETA AÑIL REMATCH (Nv. 66 - 68)
const rivalF6Core = `Crobat @ Quick Claw
Level: 66
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Aerial Ace
- Confuse Ray
- Leech Life

Gengar
Level: 66
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Thunderbolt
- Psychic
- Destiny Bond

Ursaluna @ Black Belt
Level: 67
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Earthquake
- Slash
- Bulk Up
- Rock Slide

Electivire @ Magnet
Level: 67
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Cross Chop
- Fire Punch
- Ice Punch

Tyranitar @ Leftovers
Level: 68
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Dragon Dance
- Crunch`;

// FASE 7: MONTE PLATEADO / FINAL (Nv. 76 - 78)
const rivalF7Core = `Crobat @ Quick Claw
Level: 76
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Aerial Ace
- Confuse Ray
- Toxic

Gengar
Level: 76
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Thunderbolt
- Psychic
- Sludge Bomb

Ursaluna @ Leftovers
Level: 77
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Earthquake
- Bulk Up
- Rock Slide
- Hyper Voice

Salamence @ Dragon Fang
Level: 77
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dragon Claw
- Flamethrower
- Earthquake
- Dragon Dance

Tyranitar @ Leftovers
Level: 78
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Crunch
- Sandstorm`;

const STARTER_DATA = {
  CHIKORITA: [
    { name: 'Chikorita', lvl: 12, moves: ['Synthesis', 'Growl', 'Leech Seed', 'Light Screen'], item: 'Sitrus Berry' },
    { name: 'Bayleef', lvl: 20, moves: ['Magical Leaf', 'Leech Seed', 'Reflect', 'Body Slam'], item: 'Sitrus Berry' },
    { name: 'Bayleef', lvl: 28, moves: ['Solar Beam', 'Leech Seed', 'Light Screen', 'Body Slam'], item: 'Sitrus Berry' },
    { name: 'Meganium', lvl: 44, moves: ['Solar Beam', 'Sludge Bomb', 'Leech Seed', 'Light Screen'], item: 'Sitrus Berry' },
    { name: 'Meganium', lvl: 56, moves: ['Solar Beam', 'Sludge Bomb', 'Recover', 'Bulk Up'], item: 'Sitrus Berry' },
    { name: 'Meganium', lvl: 68, moves: ['Solar Beam', 'Sludge Bomb', 'Recover', 'Bulk Up'], item: 'Sitrus Berry' },
    { name: 'Meganium', lvl: 78, moves: ['Solar Beam', 'Sludge Bomb', 'Recover', 'Bulk Up'], item: 'Lum Berry' },
  ],
  CYNDAQUIL: [
    { name: 'Cyndaquil', lvl: 12, moves: ['Ember', 'Quick Attack', 'Smokescreen', 'Leer'], item: 'Sitrus Berry' },
    { name: 'Quilava', lvl: 20, moves: ['Flamethrower', 'Quick Attack', 'Smokescreen', 'Mud Slap'], item: 'Sitrus Berry' },
    { name: 'Quilava', lvl: 28, moves: ['Flamethrower', 'Quick Attack', 'Slash', 'Mud Slap'], item: 'Sitrus Berry' },
    { name: 'Typhlosion', lvl: 44, moves: ['Flamethrower', 'Thunderbolt', 'Earthquake', 'Quick Attack'], item: 'Sitrus Berry' },
    { name: 'Typhlosion', lvl: 56, moves: ['Flamethrower', 'Thunderbolt', 'Earthquake', 'Sunny Day'], item: 'Sitrus Berry' },
    { name: 'Typhlosion', lvl: 68, moves: ['Flamethrower', 'Thunderbolt', 'Earthquake', 'Sunny Day'], item: 'Sitrus Berry' },
    { name: 'Typhlosion', lvl: 78, moves: ['Flamethrower', 'Thunderbolt', 'Earthquake', 'Sunny Day'], item: 'Lum Berry' },
  ],
  TOTODILE: [
    { name: 'Totodile', lvl: 12, moves: ['Water Gun', 'Bite', 'Scary Face', 'Leer'], item: 'Sitrus Berry' },
    { name: 'Croconaw', lvl: 20, moves: ['Surf', 'Bite', 'Scary Face', 'Slash'], item: 'Sitrus Berry' },
    { name: 'Croconaw', lvl: 28, moves: ['Surf', 'Crunch', 'Slash', 'Scary Face'], item: 'Sitrus Berry' },
    { name: 'Feraligatr', lvl: 44, moves: ['Hydro Pump', 'Ice Beam', 'Earthquake', 'Crunch'], item: 'Sitrus Berry' },
    { name: 'Feraligatr', lvl: 56, moves: ['Hydro Pump', 'Ice Beam', 'Earthquake', 'Dragon Dance'], item: 'Sitrus Berry' },
    { name: 'Feraligatr', lvl: 68, moves: ['Hydro Pump', 'Ice Beam', 'Earthquake', 'Dragon Dance'], item: 'Sitrus Berry' },
    { name: 'Feraligatr', lvl: 78, moves: ['Hydro Pump', 'Ice Beam', 'Earthquake', 'Dragon Dance'], item: 'Lum Berry' },
  ]
};

const CORES = [rivalF1Core, rivalF2Core, rivalF3Core, rivalF4Core, rivalF5Core, rivalF6Core, rivalF7Core];

let rivalReplaced = 0;
for (const starter of ['CHIKORITA', 'CYNDAQUIL', 'TOTODILE']) {
  for (let phase = 1; phase <= 7; phase++) {
    const id = `TRAINER_RIVAL_${starter}_${phase}_HNS`;
    const sData = STARTER_DATA[starter][phase - 1];
    const core = CORES[phase - 1];

    const starterBlock = `${sData.name} @ ${sData.item}
Level: ${sData.lvl}
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
${sData.moves.map(m => '- ' + m).join('\n')}`;

    const newBlock = `=== ${id} ===
Name: SILVER
Class: Rival Hns
Pic: Silver Hns
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Dark Red

${core}

${starterBlock}`;

    const pattern = new RegExp(`=== ${id} ===[\\s\\S]*?(?=(?:\\r?\\n=== |$))`, 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, newBlock + '\n');
      rivalReplaced++;
    } else {
      console.warn(`Could not find ${id}`);
    }
  }
}

fs.writeFileSync(PARTY_FILE, content, 'utf8');
console.log(`Successfully updated ${rivalReplaced} Rival Silver encounters (21 parties)!`);

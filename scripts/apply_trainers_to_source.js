const fs = require('fs');
const path = require('path');

const PARTY_FILE = path.join(__dirname, '../pokehns-expansion/src/data/trainers_hns.party');
let content = fs.readFileSync(PARTY_FILE, 'utf8');

console.log('--- Applying Custom Trainers (6 mons, tactical items, competitive AI) ---');

// Format of each trainer in .party format:
// === TRAINER_ID ===
// Name: NAME
// Class: CLASS
// Pic: PIC
// Gender: GENDER
// Music: MUSIC
// Double Battle: No
// AI: Check Bad Move / Try To Faint / Check Viability
// Mugshot: ...
// Items: ...
//
// Mon1
// Level: L
// IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
// - Move1
// - Move2...

const TRAINER_REPLACEMENTS = {
  // =========================================================================
  // 1. LÍDERES DE JOHTO
  // =========================================================================
  TRAINER_FALKNER_1_HNS: `=== TRAINER_FALKNER_1_HNS ===
Name: FALKNER
Class: Leader Hns
Pic: Leader Falkner Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Light Blue

Pidgeotto
Level: 15
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Gust
- Mud Slap
- Quick Attack
- Wing Attack

Swellow
Level: 15
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Wing Attack
- Quick Attack
- Focus Energy
- Double Team

Pelipper
Level: 15
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Water Gun
- Wing Attack
- Mist
- Supersonic

Noctowl
Level: 15
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Confusion
- Peck
- Hypnosis
- Reflect

Fearow
Level: 15
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Peck
- Wing Attack
- Leer
- Quick Attack

Togekiss @ Sitrus Berry
Level: 16
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Air Cutter
- Ancient Power
- Wish
- Metronome`,

  TRAINER_BUGSY_1_HNS: `=== TRAINER_BUGSY_1_HNS ===
Name: BUGSY
Class: Leader Hns
Pic: Leader Bugsy Hns
Gender: Female
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Green

Butterfree
Level: 21
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Confusion
- Gust
- Stun Spore
- Spore

Beedrill
Level: 21
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Twineedle
- Focus Energy
- Fury Attack
- Quick Attack

Ninjask
Level: 21
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Wing Attack
- Leech Life
- Quick Attack
- Double Team

Armaldo
Level: 22
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Silver Wind
- Mud Slap
- Sand Attack

Scyther @ Silver Powder
Level: 22
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Quick Attack
- Fury Cutter
- Aerial Ace
- Pursuit

Yanmega @ Sitrus Berry
Level: 23
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Silver Wind
- Air Cutter
- Signal Beam
- Quick Attack`,

  TRAINER_WHITNEY_1_HNS: `=== TRAINER_WHITNEY_1_HNS ===
Name: WHITNEY
Class: Leader Hns
Pic: Leader Whitney Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Pink

Clefable
Level: 27
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Metronome
- Body Slam
- Attract
- Psychic

Wigglytuff
Level: 27
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Body Slam
- Minimize
- Mimic
- Defense Curl

Exploud
Level: 27
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Hyper Voice
- Stomp
- Cross Chop
- Mud Slap

Zangoose
Level: 28
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Slash
- Quick Attack
- Brick Break
- Swords Dance

Ambipom
Level: 28
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Scratch
- Quick Attack
- Fake Out
- Brick Break

Miltank @ Lum Berry
Level: 29
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rollout
- Milk Drink
- Attract
- Stomp`,

  TRAINER_MORTY_1_HNS: `=== TRAINER_MORTY_1_HNS ===
Name: MORTY
Class: Leader Hns
Pic: Leader Morty Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Purple

Haunter
Level: 33
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Hypnosis
- Dream Eater
- Night Shade

Sableye
Level: 33
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Faint Attack
- Brick Break
- Will O Wisp

Banette
Level: 33
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Will O Wisp
- Confuse Ray
- Faint Attack

Dusclops
Level: 34
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Will O Wisp
- Night Shade
- Confuse Ray

Mismagius @ Spell Tag
Level: 34
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Psychic
- Will O Wisp
- Recover

Gengar @ Sitrus Berry
Level: 35
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Shadow Ball
- Sludge Bomb
- Hypnosis
- Dream Eater`,

  TRAINER_CHUCK_1_HNS: `=== TRAINER_CHUCK_1_HNS ===
Name: CHUCK
Class: Leader Hns
Pic: Leader Chuck Hns
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Orange

Primeape
Level: 39
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Cross Chop
- Mach Punch
- Scary Face
- Rage

Hitmonlee
Level: 39
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- High Jump Kick
- Jump Kick
- Fake Out
- Brick Break

Hitmonchan
Level: 39
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Fire Punch
- Ice Punch
- Thunder Punch
- Brick Break

Hariyama
Level: 40
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Fake Out
- Focus Punch
- Bulk Up
- Mud Slap

Breloom
Level: 40
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Spore
- Cross Chop
- Bullet Seed
- Mach Punch

Poliwrath @ Black Belt
Level: 41
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dynamic Punch
- Surf
- Bulk Up
- Hypnosis`,

  TRAINER_JASMINE_1_HNS: `=== TRAINER_JASMINE_1_HNS ===
Name: JASMINE
Class: Leader Hns
Pic: Leader Jasmine Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Yellow

Skarmory
Level: 44
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sandstorm
- Spikes
- Guillotine
- Double Team

Aggron
Level: 44
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Iron Tail
- Earthquake
- Rock Slide
- Protect

Metang
Level: 44
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Metal Claw
- Psychic
- Swift
- Steel Wing

Magnezone @ Magnet
Level: 45
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Metal Claw
- Thunder Wave
- Screech

Scizor
Level: 45
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Metal Claw
- Silver Wind
- Quick Attack
- Swords Dance

Steelix @ Leftovers
Level: 46
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Iron Tail
- Earthquake
- Rock Slide
- Protect`,

  TRAINER_PRYCE_1_HNS: `=== TRAINER_PRYCE_1_HNS ===
Name: PRYCE
Class: Leader Hns
Pic: Leader Pryce Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Light Blue

Dewgong
Level: 49
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Hail
- Surf
- Rest
- Ice Beam

Glalie
Level: 49
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Ice Beam
- Scary Face
- Explosion
- Double Team

Walrein
Level: 49
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Ice Beam
- Surf
- Hail
- Body Slam

Froslass
Level: 50
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Ice Beam
- Shadow Ball
- Confuse Ray
- Double Team

Weavile @ Quick Claw
Level: 50
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Metal Claw
- Quick Attack
- Swords Dance

Mamoswine @ Never Melt Ice
Level: 51
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Blizzard
- Earthquake
- Take Down
- Mud Slap`,

  TRAINER_CLAIR_1_HNS: `=== TRAINER_CLAIR_1_HNS ===
Name: CLAIR
Class: Leader Hns
Pic: Leader Clair Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Blue

Dragonair
Level: 54
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rain Dance
- Surf
- Thunderbolt
- Thunder Wave

Gyarados
Level: 54
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Hydro Pump
- Waterfall
- Earthquake
- Bite

Altaria
Level: 54
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dragon Breath
- Aerial Ace
- Dragon Dance
- Recover

Flygon
Level: 55
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Earthquake
- Dragon Claw
- Silver Wind
- Double Team

Salamence @ Dragon Fang
Level: 55
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dragon Claw
- Flamethrower
- Aerial Ace
- Dragon Dance

Kingdra @ Sitrus Berry
Level: 56
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Hydro Pump
- Ice Beam
- Dragon Breath
- Dragon Dance`,

  // =========================================================================
  // 2. ALTO MANDO & CAMPEÓN LANCE
  // =========================================================================
  TRAINER_WILL_1_HNS: `=== TRAINER_WILL_1_HNS ===
Name: WILL
Class: Elite Four Hns
Pic: Elite Four Will Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Purple

Xatu
Level: 58
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Confuse Ray
- Recover
- Aerial Ace

Jynx
Level: 58
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Ice Beam
- Psychic
- Lovely Kiss
- Reflect

Slowbro
Level: 59
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Psychic
- Rest
- Amnesia

Exeggutor
Level: 59
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Solar Beam
- Leech Seed
- Light Screen

Gardevoir
Level: 59
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Thunderbolt
- Calm Mind
- Double Team

Gallade @ Sitrus Berry
Level: 60
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Cross Chop
- Swords Dance
- Ancient Power`,

  TRAINER_KOGA_1_HNS: `=== TRAINER_KOGA_1_HNS ===
Name: KOGA
Class: Elite Four Hns
Pic: Elite Four Koga Hns
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Purple

Ariados
Level: 60
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Twineedle
- Confuse Ray
- Spider Web

Muk
Level: 60
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Acid Armor
- Minimize
- Toxic

Forretress
Level: 61
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Spikes
- Explosion
- Protect
- Harden

Swalot
Level: 61
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Acid Armor
- Recover
- Mud Slap

Roserade
Level: 61
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Giga Drain
- Stun Spore
- Synthesis

Crobat @ Quick Claw
Level: 62
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Aerial Ace
- Confuse Ray
- Leech Life`,

  TRAINER_BRUNO_1_HNS: `=== TRAINER_BRUNO_1_HNS ===
Name: BRUNO
Class: Elite Four Hns
Pic: Elite Four Bruno Hns
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Orange

Hitmonlee
Level: 62
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- High Jump Kick
- Jump Kick
- Fake Out
- Brick Break

Hitmonchan
Level: 62
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Fire Punch
- Ice Punch
- Thunder Punch
- Brick Break

Hitmontop
Level: 63
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Cross Chop
- Rapid Spin
- Quick Attack
- Double Team

Hariyama
Level: 63
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Fake Out
- Focus Punch
- Bulk Up
- Earthquake

Medicham
Level: 63
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- High Jump Kick
- Psychic
- Bulk Up
- Recover

Machamp @ Black Belt
Level: 64
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Cross Chop
- Earthquake
- Rock Slide
- Bulk Up`,

  TRAINER_KAREN_1_HNS: `=== TRAINER_KAREN_1_HNS ===
Name: KAREN
Class: Elite Four Hns
Pic: Elite Four Karen Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Yellow

Umbreon
Level: 64
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Confuse Ray
- Moonlight
- Double Team

Vileplume
Level: 64
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Petal Dance
- Sleep Powder
- Moonlight

Absol
Level: 65
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Slash
- Swords Dance
- Quick Attack

Shiftry
Level: 65
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Giga Drain
- Fake Out
- Double Team

Honchkrow
Level: 65
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Faint Attack
- Aerial Ace
- Confuse Ray
- Swords Dance

Houndoom @ Charcoal
Level: 66
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Faint Attack
- Sludge Bomb
- Will O Wisp`,

  TRAINER_LANCE_1_HNS: `=== TRAINER_LANCE_1_HNS ===
Name: LANCE
Class: Champion Hns
Pic: Champion Lance Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Dark Red

Gyarados
Level: 66
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Hydro Pump
- Earthquake
- Waterfall
- Bite

Charizard
Level: 66
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Aerial Ace
- Slash
- Earthquake

Aerodactyl
Level: 67
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Aerial Ace
- Earthquake
- Double Team

Altaria
Level: 67
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dragon Breath
- Aerial Ace
- Dragon Dance
- Recover

Salamence
Level: 67
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dragon Claw
- Flamethrower
- Aerial Ace
- Dragon Dance

Dragonite @ Sitrus Berry
Level: 68
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Dragon Claw
- Flamethrower
- Thunderbolt
- Ice Beam`,

  // =========================================================================
  // 3. LÍDERES DE KANTO
  // =========================================================================
  TRAINER_BROCK_HNS: `=== TRAINER_BROCK_HNS ===
Name: BROCK
Class: Leader Hns
Pic: Leader Brock Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Orange

Golem
Level: 69
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Explosion
- Defense Curl

Steelix
Level: 69
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Iron Tail
- Earthquake
- Rock Slide
- Protect

Relicanth
Level: 70
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Rock Slide
- Take Down
- Amnesia

Armaldo
Level: 70
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Silver Wind
- Earthquake
- Sand Attack

Rhyperior
Level: 70
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Earthquake
- Rock Slide
- Mud Slap
- Protect

Tyranitar @ Sitrus Berry
Level: 71
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Crunch
- Dragon Breath`,

  TRAINER_MISTY_HNS: `=== TRAINER_MISTY_HNS ===
Name: MISTY
Class: Leader Hns
Pic: Leader Misty Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Light Blue

Golduck
Level: 70
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Psychic
- Ice Beam
- Confusion

Quagsire
Level: 70
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Earthquake
- Recover
- Defense Curl

Lapras
Level: 71
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Ice Beam
- Body Slam
- Confuse Ray

Ludicolo
Level: 71
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Giga Drain
- Fake Out
- Double Team

Milotic
Level: 71
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Ice Beam
- Recover
- Confuse Ray

Starmie @ Leftovers
Level: 72
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Surf
- Psychic
- Thunderbolt
- Ice Beam`,

  TRAINER_LTSURGE_HNS: `=== TRAINER_LTSURGE_HNS ===
Name: LT. SURGE
Class: Leader Hns
Pic: Leader Surge Hns
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Yellow

Raichu
Level: 71
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Quick Attack
- Thunder Wave
- Double Team

Magneton
Level: 71
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Thunder Wave
- Explosion
- Screech

Electrode
Level: 72
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Explosion
- Screech
- Double Team

Manectric
Level: 72
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Quick Attack
- Scary Face
- Double Team

Magnezone
Level: 72
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Metal Claw
- Thunder Wave
- Screech

Electivire @ Magnet
Level: 73
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Thunderbolt
- Cross Chop
- Fire Punch
- Ice Punch`,

  TRAINER_ERIKA_HNS: `=== TRAINER_ERIKA_HNS ===
Name: ERIKA
Class: Leader Hns
Pic: Leader Erika Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Green

Bellossom
Level: 72
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Giga Drain
- Stun Spore
- Synthesis
- Double Team

Victreebel
Level: 72
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Giga Drain
- Stun Spore
- Synthesis

Shiftry
Level: 73
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Giga Drain
- Faint Attack
- Fake Out
- Double Team

Cradily
Level: 73
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Giga Drain
- Recover
- Defense Curl

Tangrowth
Level: 73
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Giga Drain
- Sludge Bomb
- Synthesis
- Amnesia

Roserade @ Miracle Seed
Level: 74
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Giga Drain
- Stun Spore
- Synthesis`,

  TRAINER_JANINE_HNS: `=== TRAINER_JANINE_HNS ===
Name: JANINE
Class: Leader Hns
Pic: Leader Janine Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Purple

Ariados
Level: 73
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Twineedle
- Confuse Ray
- Spider Web

Weezing
Level: 73
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Explosion
- Confuse Ray
- Defense Curl

Seviper
Level: 74
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Faint Attack
- Confuse Ray
- Double Team

Roserade
Level: 74
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Giga Drain
- Stun Spore
- Synthesis

Muk
Level: 74
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Acid Armor
- Minimize
- Toxic

Crobat @ Quick Claw
Level: 75
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sludge Bomb
- Aerial Ace
- Confuse Ray
- Leech Life`,

  TRAINER_SABRINA_HNS: `=== TRAINER_SABRINA_HNS ===
Name: SABRINA
Class: Leader Hns
Pic: Leader Sabrina Hns
Gender: Female
Music: Hg Girl 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Purple

Mr Mime
Level: 74
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Light Screen
- Reflect
- Mimic

Espeon
Level: 74
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Confuse Ray
- Morning Sun
- Quick Attack

Claydol
Level: 75
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Earthquake
- Rock Slide
- Defense Curl

Metagross
Level: 75
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Metal Claw
- Psychic
- Earthquake
- Protect

Gallade
Level: 75
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Cross Chop
- Swords Dance
- Ancient Power

Alakazam @ Sitrus Berry
Level: 76
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Shadow Ball
- Recover
- Double Team`,

  TRAINER_BLAINE_HNS: `=== TRAINER_BLAINE_HNS ===
Name: BLAINE
Class: Leader Hns
Pic: Leader Blaine Hns
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Dark Red

Ninetales
Level: 75
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Sunny Day
- Flamethrower
- Confuse Ray
- Will O Wisp

Rapidash
Level: 75
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Stomp
- Quick Attack
- Double Team

Torkoal
Level: 76
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Mud Slap
- Defense Curl
- Amnesia

Camerupt
Level: 76
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Earthquake
- Rock Slide
- Protect

Houndoom
Level: 76
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Faint Attack
- Sludge Bomb
- Will O Wisp

Magmortar @ Charcoal
Level: 77
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Fire Blast
- Flamethrower
- Thunderbolt
- Confuse Ray`,

  TRAINER_BLUE_HNS: `=== TRAINER_BLUE_HNS ===
Name: BLUE
Class: Leader Hns
Pic: Leader Blue Hns
Gender: Male
Music: Hg Boy 1
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Light Blue

Pidgeot
Level: 77
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Aerial Ace
- Quick Attack
- Swords Dance
- Double Team

Alakazam
Level: 77
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Psychic
- Shadow Ball
- Recover
- Double Team

Rhyperior
Level: 78
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Earthquake
- Rock Slide
- Mud Slap
- Protect

Gyarados
Level: 78
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Hydro Pump
- Earthquake
- Waterfall
- Bite

Arcanine
Level: 78
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Flamethrower
- Quick Attack
- Crunch
- Confuse Ray

Tyranitar @ Leftovers
Level: 79
IVs: 25 HP / 25 Atk / 25 Def / 25 SpA / 25 SpD / 25 Spe
- Rock Slide
- Earthquake
- Crunch
- Dragon Breath`,

  // =========================================================================
  // 4. RED (MONTE PLATEADO)
  // =========================================================================
  TRAINER_RED_HNS: `=== TRAINER_RED_HNS ===
Name: RED
Class: Pkmn Trainer 1 Hns
Pic: Red Hns
Gender: Male
Music: Hg Champion
Double Battle: No
AI: Check Bad Move / Try To Faint / Check Viability
Mugshot: Dark Red

Pikachu @ Light Ball
Level: 88
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Thunderbolt
- Quick Attack
- Iron Tail
- Thunder Wave

Lapras @ Leftovers
Level: 86
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Ice Beam
- Surf
- Body Slam
- Confuse Ray

Snorlax @ Leftovers
Level: 86
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Body Slam
- Snore
- Rest
- Earthquake

Venusaur @ Miracle Seed
Level: 86
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Solar Beam
- Sludge Bomb
- Leech Seed
- Sleep Powder

Blastoise @ Mystic Water
Level: 86
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Hydro Pump
- Ice Beam
- Earthquake
- Skull Bash

Charizard @ Charcoal
Level: 87
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
- Flamethrower
- Aerial Ace
- Slash
- Earthquake`,
};

// Regex replacement: replace each trainer block from `=== ID ===` to the next `=== `
let replacedCount = 0;
for (const [id, block] of Object.entries(TRAINER_REPLACEMENTS)) {
  const pattern = new RegExp(`=== ${id} ===[\\s\\S]*?(?=(?:\\r?\\n=== |$))`, 'g');
  if (pattern.test(content)) {
    content = content.replace(pattern, block + '\n');
    replacedCount++;
  } else {
    console.warn(`Could not find ${id} in party file!`);
  }
}

fs.writeFileSync(PARTY_FILE, content, 'utf8');
console.log(`Successfully updated ${replacedCount} key trainers to 6 evolved Pokémon, items & competitive AI!`);

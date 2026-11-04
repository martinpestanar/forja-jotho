-- Expand starter_pokemon_enum to support all 9 starters (Kanto, Johto, Hoenn)
ALTER TYPE starter_pokemon_enum ADD VALUE IF NOT EXISTS 'bulbasaur';
ALTER TYPE starter_pokemon_enum ADD VALUE IF NOT EXISTS 'charmander';
ALTER TYPE starter_pokemon_enum ADD VALUE IF NOT EXISTS 'squirtle';
ALTER TYPE starter_pokemon_enum ADD VALUE IF NOT EXISTS 'treecko';
ALTER TYPE starter_pokemon_enum ADD VALUE IF NOT EXISTS 'torchic';
ALTER TYPE starter_pokemon_enum ADD VALUE IF NOT EXISTS 'mudkip';

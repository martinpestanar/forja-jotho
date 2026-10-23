import { GbaSaveManipulator, HNS_ITEM_IDS, BagPocketType } from '@/lib/gba/gbaSaveEngine';

/**
 * Script de Verificación Rápida y Autotest de Partida GBA (.sav)
 * Valida integridad de sectores, checksums oficiales, encriptación y ranuras disponibles.
 */
export function auditGbaSaveBinary(savBuffer: Uint8Array): {
  isValid: boolean;
  activeSlot: 'A' | 'B';
  trainerName: string;
  money: number;
  partyCount: number;
  pcBox1Count: number;
  encryptionKey: string;
  warnings: string[];
} {
  const manipulator = new GbaSaveManipulator(savBuffer);
  const warnings: string[] = [];

  if (!manipulator.isValid()) {
    warnings.push('Fallo de integridad general: checksums o firmas de sectores inválidas.');
  }

  const { slotName, sectorMap } = manipulator.getActiveSlotMap();
  const sec0 = sectorMap.get(0)! * 0x1000;
  const sec1 = sectorMap.get(1)! * 0x1000;
  const sec5 = sectorMap.get(5);

  const view = new DataView(savBuffer.buffer, savBuffer.byteOffset, savBuffer.byteLength);
  const encKey = view.getUint32(sec0 + 0x00BC, true);

  const { party, money, trainerName } = manipulator.extractPlayerProfileAndTeam();

  // Contar Pokémon en PC Box 1
  let pcBox1Count = 0;
  if (sec5 !== undefined) {
    const sec5Base = sec5 * 0x1000;
    for (let i = 0; i < 30; i++) {
      const pid = view.getUint32(sec5Base + 0x0004 + i * 80, true);
      const otid = view.getUint32(sec5Base + 0x0004 + i * 80 + 4, true);
      if (pid !== 0 || otid !== 0) {
        pcBox1Count++;
      }
    }
  } else {
    warnings.push('Sector 5 (PokemonStorage) no encontrado en el slot activo.');
  }

  return {
    isValid: warnings.length === 0,
    activeSlot: slotName,
    trainerName,
    money,
    partyCount: party.length,
    pcBox1Count,
    encryptionKey: `0x${encKey.toString(16).toUpperCase()}`,
    warnings,
  };
}

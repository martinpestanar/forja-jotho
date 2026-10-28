/**
 * @file src/lib/gba/PokemonMemoryBridge.ts
 * @description Puente bidireccional entre el emulador mGBA-wasm, Supabase Storage (gba-saves)
 * y la tabla profiles (gba_party_json). Maneja:
 *   1. Descarga del .sav desde Supabase Storage al arrancar
 *   2. Subida del .sav con validación de integridad (shadow backups)
 *   3. Extracción del equipo de hasta 6 Pokémon → profiles.gba_party_json
 *   4. Inyección segura de ítems/dinero directamente en la mochila GBA
 */

import {
  GbaSaveManipulator,
  InjectionPayload,
  PartyPokemonSummary,
  HNS_ITEM_IDS,
  type BagPocketType,
  type PokemonInjectionOptions,
  type PokemonInjectionResult,
} from './gbaSaveEngine';
import { supabase } from '@/lib/supabase';

const SAV_BUCKET = 'gba-saves';
const SAV_FILENAME = 'savegame.sav';

// ============================================================================
// Interfaz del emulador (abstracción sobre mGBA-wasm o cualquier core WASM)
// ============================================================================

export interface EmulatorInterface {
  /** Lee un archivo del sistema de archivos virtual (Emscripten FS) */
  readSaveFile: () => Uint8Array | null;
  /** Escribe un archivo al FS virtual del emulador */
  writeSaveFile: (data: Uint8Array) => void;
  /** Pausa el bucle del emulador */
  pause: () => void;
  /** Reanuda el bucle del emulador */
  resume: () => void;
  /** Lee un byte de la EWRAM del emulador (para lectura en vivo) */
  readMemory8?: (address: number) => number;
  /** Lee un u16 de la EWRAM */
  readMemory16?: (address: number) => number;
  /** Escribe un u16 en la EWRAM */
  writeMemory16?: (address: number, value: number) => void;
}

// ============================================================================
// PokemonMemoryBridge
// ============================================================================

export class PokemonMemoryBridge {
  private userId: string;
  private emulator: EmulatorInterface | null = null;
  private isSyncing = false;
  private _activeSlot: string = 'slot_1.sav';

  constructor(userId: string) {
    this.userId = userId;
  }

  /** Actualiza el identificador de usuario activo */
  public setUserId(newUserId: string): void {
    this.userId = newUserId;
  }

  /** Actualiza el nombre del slot activo para sincronizar con Supabase Storage */
  public setActiveSlot(slotName: string): void {
    this._activeSlot = slotName;
  }

  /** Ruta del slot activo en el bucket: {userId}/{slot_X.sav} */
  private get activeSlotPath(): string {
    return `${this.userId}/${this._activeSlot}`;
  }

  /** Vincula la instancia del emulador al puente */
  public bindEmulator(emu: EmulatorInterface): void {
    this.emulator = emu;
  }

  /** Ruta en el bucket: {userId}/savegame.sav */
  private get storagePath(): string {
    return `${this.userId}/${SAV_FILENAME}`;
  }

  // --------------------------------------------------------------------------
  // 1. Descarga del .sav desde Supabase Storage
  // --------------------------------------------------------------------------

  /**
   * Descarga el .sav previo del bucket gba-saves.
   * Intenta el slot activo primero (${userId}/${activeSlot}) y si no existe, hace fallback a savegame.sav.
   * Retorna Uint8Array si existe, o null si es la primera sesión.
   */
  public async downloadSaveFromCloud(slotName?: string): Promise<Uint8Array | null> {
    try {
      const primaryPath = `${this.userId}/${slotName || this._activeSlot}`;
      let data: Blob | null = null;
      let error: any = null;

      const res = await supabase.storage.from(SAV_BUCKET).download(primaryPath);
      data = res.data;
      error = res.error;

      // Fallback a savegame.sav si el slot principal no existe
      if ((error || !data) && primaryPath !== this.storagePath) {
        const fallbackRes = await supabase.storage.from(SAV_BUCKET).download(this.storagePath);
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      // Fallback a guest-trainer-id si el usuario recién se autenticó y aún no tiene .sav en su carpeta
      if ((error || !data) && this.userId !== 'guest-trainer-id') {
        const guestPath = `guest-trainer-id/${slotName || this._activeSlot}`;
        const guestRes = await supabase.storage.from(SAV_BUCKET).download(guestPath);
        if (!guestRes.error && guestRes.data) {
          data = guestRes.data;
          error = null;
        } else {
          const guestFallback = await supabase.storage.from(SAV_BUCKET).download('guest-trainer-id/slot_1.sav');
          if (!guestFallback.error && guestFallback.data) {
            data = guestFallback.data;
            error = null;
          }
        }
      }

      if (error || !data) {
        console.info('[MemoryBridge] No save file found in cloud (first session).');
        return null;
      }

      const bytes = new Uint8Array(await data.arrayBuffer());

      // Validar integridad antes de inyectar al emulador
      const manipulator = new GbaSaveManipulator(bytes);
      if (!manipulator.isValid()) {
        console.warn('[MemoryBridge] Cloud save failed integrity check. Skipping load.');
        return null;
      }

      console.info(`[MemoryBridge] Cloud save loaded (${bytes.byteLength} bytes) from ${primaryPath}`);
      return bytes;
    } catch (err) {
      console.error('[MemoryBridge] Error downloading save:', err);
      return null;
    }
  }

  /**
   * Inyecta el .sav descargado en la SRAM del emulador (antes de arrancar)
   */
  public injectSaveToEmulator(savData: Uint8Array): void {
    if (!this.emulator) {
      console.warn('[MemoryBridge] No emulator bound. Cannot inject save.');
      return;
    }
    this.emulator.writeSaveFile(savData);
    console.info('[MemoryBridge] Save injected into emulator SRAM.');
  }

  // --------------------------------------------------------------------------
  // 2. Subida del .sav a Supabase Storage (con validación)
  // --------------------------------------------------------------------------

  /**
   * Extrae el .sav actual del emulador, valida integridad, sube a Supabase Storage
   * sincronizando AMBOS archivos (${userId}/${activeSlot} y ${userId}/savegame.sav)
   * y sincroniza el equipo Pokémon en profiles.gba_party_json.
   * Retorna el equipo extraído o null en caso de error.
   */
  public async syncSaveToCloud(): Promise<PartyPokemonSummary[] | null> {
    if (this.isSyncing || !this.emulator) return null;
    this.isSyncing = true;

    try {
      // 1. Extraer binario .sav del FS virtual del emulador
      const rawSav = this.emulator.readSaveFile();
      if (!rawSav || rawSav.byteLength < 0x1C000) {
        console.warn('[MemoryBridge] Save file too small or missing from emulator.');
        return null;
      }

      // 2. Validar integridad (no subir un .sav corrupto)
      const manipulator = new GbaSaveManipulator(rawSav);
      if (!manipulator.isValid()) {
        console.warn('[MemoryBridge] Save failed integrity check. Aborting cloud sync to protect cloud copy.');
        return null;
      }

      // 3. Extraer equipo y metadata del jugador
      const { party, money, trainerName } = manipulator.extractPlayerProfileAndTeam();

      // 4. Subir .sav al bucket bajo AMBOS nombres (slot activo + savegame.sav)
      const uploadTargets = Array.from(new Set([this.activeSlotPath, this.storagePath]));
      for (const target of uploadTargets) {
        const { error: uploadError } = await supabase.storage
          .from(SAV_BUCKET)
          .upload(target, rawSav, {
            contentType: 'application/octet-stream',
            upsert: true,
          });

        if (uploadError) {
          console.error(`[MemoryBridge] Upload error (${target}):`, uploadError.message);
        }
      }

      // 5. Actualizar profiles.gba_party_json e in_game_money (NUNCA pokedollars)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.userId);
      if (isUuid) {
        // El dinero del cartucho vive aparte de la wallet de SynDex.
        const { error: syncError } = await supabase.rpc('rpc_economy_sync_game_money', {
          p_in_game_money: money,
        });
        if (syncError) {
          console.warn('[MemoryBridge] Economy sync error:', syncError.message);
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            gba_party_json: party,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.userId);

        if (updateError) {
          console.error('[MemoryBridge] Profile update error:', updateError.message);
        }
      }

      console.info(
        `[MemoryBridge] Cloud sync complete. Team: ${party.length} Pokémon, ₽${money}, Trainer: ${trainerName}`
      );
      return party;
    } catch (err) {
      console.error('[MemoryBridge] syncSaveToCloud error:', err);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Lectura del equipo y dinero desde el buffer RAM (sin guardar)
  // --------------------------------------------------------------------------

  /**
   * Lee el equipo actual directamente desde el .sav en memoria del emulador
   * sin necesidad de hacer cloud sync. Útil para actualización rápida del UI.
   */
  public readPartyFromEmulator(): PartyPokemonSummary[] | null {
    const data = this.readTrainerDataFromEmulator();
    return data ? data.party : null;
  }

  /**
   * Lee el equipo, dinero y nombre del entrenador en tiempo real desde el emulador.
   */
  public readTrainerDataFromEmulator(): { party: PartyPokemonSummary[]; money: number; trainerName: string } | null {
    if (!this.emulator) return null;

    try {
      const rawSav = this.emulator.readSaveFile();
      if (!rawSav || rawSav.byteLength < 0x1C000) return null;

      const manipulator = new GbaSaveManipulator(rawSav);
      if (!manipulator.isValid()) return null;

      const { party, money, trainerName } = manipulator.extractPlayerProfileAndTeam();
      return { party, money, trainerName };
    } catch (err) {
      console.error('[MemoryBridge] Error reading trainer data from emulator:', err);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // 4. Inyección de recompensas en la mochila GBA
  // --------------------------------------------------------------------------

  /**
   * Inyecta un ítem directamente en la mochila del .sav activo del emulador.
   * Pausa brevemente el emulador, modifica el .sav, recalcula checksum,
   * lo reescribe en el FS virtual y opcionalmente sincroniza en la nube.
   */
  public async injectItemToGbaRam(
    itemId: number,
    quantity: number,
    pocket: BagPocketType = 'ITEMS',
    syncAfter = true
  ): Promise<{ success: boolean; updatedSav?: Uint8Array }> {
    if (!this.emulator) {
      console.warn('[MemoryBridge] No emulator bound. Cannot inject item.');
      return { success: false };
    }

    try {
      // 1. Pausar para exclusión mutua
      this.emulator.pause();

      // 2. Leer .sav actual
      const rawSav = this.emulator.readSaveFile();
      if (!rawSav || rawSav.byteLength < 0x1C000) {
        this.emulator.resume();
        return { success: false };
      }

      // 3. Inyectar con GbaSaveManipulator
      const manipulator = new GbaSaveManipulator(rawSav);
      const payload: InjectionPayload = {
        itemsToInject: [{ pocket, itemId, quantity }],
      };
      const updatedSav = manipulator.injectRewards(payload);

      // 4. Escribir de vuelta al FS virtual
      this.emulator.writeSaveFile(updatedSav);

      // 5. Reanudar
      this.emulator.resume();

      // 6. Sincronizar en la nube si se solicita
      if (syncAfter) {
        await this.syncSaveToCloud();
      }

      console.info(
        `[MemoryBridge] Item injected: 0x${itemId.toString(16)} x${quantity} in ${pocket}`
      );
      return { success: true, updatedSav };
    } catch (err) {
      console.error('[MemoryBridge] Error injecting item:', err);
      this.emulator.resume();
      return { success: false };
    }
  }

  /**
   * Inyecta dinero directamente en el .sav del emulador.
   */
  public async injectMoneyToGba(amount: number, syncAfter = true): Promise<boolean> {
    if (!this.emulator) return false;

    try {
      this.emulator.pause();
      const rawSav = this.emulator.readSaveFile();
      if (!rawSav || rawSav.byteLength < 0x1C000) {
        this.emulator.resume();
        return false;
      }

      const manipulator = new GbaSaveManipulator(rawSav);
      const updatedSav = manipulator.injectRewards({ addMoney: amount });
      this.emulator.writeSaveFile(updatedSav);
      this.emulator.resume();

      if (syncAfter) {
        await this.syncSaveToCloud();
      }

      console.info(`[MemoryBridge] Money injected: +₽${amount}`);
      return true;
    } catch (err) {
      console.error('[MemoryBridge] Error injecting money:', err);
      this.emulator.resume();
      return false;
    }
  }

  /**
   * Procesa ítems pendientes de inyección desde shop_inventory
   * (Patrón "Buzón de Correo de Ciudad Trigal")
   */
  public async processPendingInjections(): Promise<number> {
    try {
      const { data: pending, error } = await supabase
        .from('shop_inventory')
        .select('id, item_id')
        .eq('user_id', this.userId);

      if (error || !pending || pending.length === 0) return 0;

      let injectedCount = 0;
      for (const item of pending) {
        // Determinar pocket y gba_item_id basado en item_id string
        const mapping = this.resolveItemMapping(item.item_id);
        if (mapping) {
          const injection = await this.injectItemToGbaRam(
            mapping.gbaItemId,
            mapping.quantity,
            mapping.pocket,
            false // No sync individual, sync al final
          );
          if (injection.success) injectedCount++;
        }
      }

      if (injectedCount > 0) {
        await this.syncSaveToCloud();
      }

      console.info(`[MemoryBridge] Processed ${injectedCount} pending injections.`);
      return injectedCount;
    } catch (err) {
      console.error('[MemoryBridge] Error processing pending injections:', err);
      return 0;
    }
  }

  /** Mapea item_id de la tienda web a parámetros de inyección GBA */
  /**
   * Inyecta un Pokémon completo directamente en el equipo del jugador en el .sav.
   * Pausa el emulador, inyecta con GbaSaveManipulator, recalcula el checksum,
   * actualiza en VFS y sincroniza con Supabase.
   */
  public async injectPokemonToGbaParty(
    options: PokemonInjectionOptions,
    syncAfter = true
  ): Promise<PokemonInjectionResult | null> {
    if (!this.emulator) {
      console.warn('[MemoryBridge] No emulator bound.');
      return null;
    }

    try {
      this.emulator.pause();
      const rawSav = this.emulator.readSaveFile();
      if (!rawSav || rawSav.byteLength < 0x1C000) {
        this.emulator.resume();
        return null;
      }

      const manipulator = new GbaSaveManipulator(rawSav);
      const result = manipulator.injectPokemonToParty(options);

      if (!result.success) {
        this.emulator.resume();
        return result;
      }

      this.emulator.writeSaveFile(manipulator.getBuffer());
      this.emulator.resume();

      if (syncAfter) {
        await this.syncSaveToCloud();
      }

      console.info(
        `[MemoryBridge] Pokémon injected: ${result.nickname} (Lv. ${result.level}) Slot #${result.slot}${result.isShiny ? ' [SHINY]' : ''}`
      );
      return result;
    } catch (err) {
      console.error('[MemoryBridge] Error injecting pokemon:', err);
      this.emulator.resume();
      return null;
    }
  }

  private resolveItemMapping(
    itemId: string
  ): { gbaItemId: number; quantity: number; pocket: BagPocketType } | null {
    const mappings: Record<string, { gbaItemId: number; quantity: number; pocket: BagPocketType }> = {
      'GBA_MASTER_BALL': { gbaItemId: HNS_ITEM_IDS.MASTER_BALL, quantity: 1, pocket: 'POKEBALLS' },
      'GBA_ULTRA_BALL': { gbaItemId: HNS_ITEM_IDS.ULTRA_BALL, quantity: 5, pocket: 'POKEBALLS' },
      'GBA_RARE_CANDY': { gbaItemId: HNS_ITEM_IDS.RARE_CANDY, quantity: 1, pocket: 'ITEMS' },
      'GBA_RARE_CANDY_5': { gbaItemId: HNS_ITEM_IDS.RARE_CANDY, quantity: 5, pocket: 'ITEMS' },
      'GBA_MAX_REVIVE': { gbaItemId: HNS_ITEM_IDS.MAX_REVIVE, quantity: 1, pocket: 'ITEMS' },
      'GBA_FULL_RESTORE': { gbaItemId: HNS_ITEM_IDS.FULL_RESTORE, quantity: 3, pocket: 'ITEMS' },
      'GBA_SACRED_ASH': { gbaItemId: HNS_ITEM_IDS.SACRED_ASH, quantity: 1, pocket: 'ITEMS' },
    };
    return mappings[itemId] ?? null;
  }
}

/**
 * Disparador global para inyectar ítems a la partida GBA desde cualquier pantalla
 */
export function triggerGbaItemInjection(
  itemId: number,
  quantity: number,
  pocket: BagPocketType = 'ITEMS',
  name?: string
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('syndex:inject-item', {
        detail: { itemId, quantity, pocket, name: name || 'Ítem' },
      })
    );
  }
}

/**
 * Disparador global para inyectar Pokémon de recompensa al equipo GBA
 */
export function triggerGbaPokemonInjection(options: PokemonInjectionOptions) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('syndex:inject-pokemon', {
        detail: options,
      })
    );
  }
}

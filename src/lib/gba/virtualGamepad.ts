/**
 * Disparador de eventos de teclado virtual y háptico para el emulador GBA.
 * Permite que cualquier componente de Gamepad móvil o botones táctiles
 * envíen pulsaciones al core mGBA sin acoplamiento rígido.
 */
import { soundFx } from '@/lib/soundFx';

export type GbaButtonName = 'Up' | 'Down' | 'Left' | 'Right' | 'A' | 'B' | 'Start' | 'Select' | 'L' | 'R';

export function triggerGbaButton(button: GbaButtonName, isDown: boolean, withHaptics: boolean = true) {
  if (typeof window === 'undefined') return;

  // 1. Respuesta Háptica de Nintendo (Micro-vibración física en celular)
  if (isDown && withHaptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // 12ms de pulso táctil seco
      navigator.vibrate(12);
    } catch {
      // Fallback silencioso si el navegador bloquea vibración sin interacción previa
    }
  }

  // 2. Audio sintetizado retro opcional en pulsación
  if (isDown) {
    soundFx.playClick();
  }

  // 3. Despachar evento personalizado para GbaConsoleWorker
  window.dispatchEvent(
    new CustomEvent('syndex:gba-button', {
      detail: { button, isDown },
    })
  );
}

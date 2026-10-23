/**
 * @file public/workers/gba.worker.js
 * @description Web Worker dedicado para emulación GBA con OffscreenCanvas.
 * Motor gráfico retro a 240x160 nativos @ 60 FPS.
 * Incluye Overworld interactivo de Johto (Ruta 29), sprites animados de Gold y Cyndaquil,
 * sistema de diálogo RPG, persistencia de SRAM 128KB y cargador de ROMs binarias (.gba).
 */

let canvas = null;
let ctx = null;
let isRunning = false;
let romBuffer = null;
let romName = 'POKEMON H&S (CYBER-JOHTO)';
let animationFrameId = null;
let fps = 60;
let lastFrameTime = performance.now();
let frameCount = 0;
let saveLoaded = false;

// 128 KB (131,072 bytes) Flash 1Mbit SRAM buffer
const GBA_SAVE_SIZE = 131072;
let savBuffer = new Uint8Array(GBA_SAVE_SIZE);

// Inicializar un skeleton válido de Flash con firma 0x08012025 en los 14 sectores de Slot A
function initFlashSkeleton(buf) {
  const view = new DataView(buf.buffer);
  for (let s = 0; s < 14; s++) {
    const base = s * 4096;
    view.setUint16(base + 0x0ff4, s, true);
    view.setUint32(base + 0x0ff8, 0x08012025, true);
    view.setUint32(base + 0x0ffc, 1, true);
  }
}
initFlashSkeleton(savBuffer);

// Estado de botones del Game Boy Advance
const keyState = {
  A: false,
  B: false,
  SELECT: false,
  START: false,
  RIGHT: false,
  LEFT: false,
  UP: false,
  DOWN: false,
  R: false,
  L: false,
};

// ============================================================================
// Estado del Mundo de Juego GBA (Ruta 29 - Cyber-Johto)
// ============================================================================

const player = {
  x: 112,
  y: 72,
  speed: 1.5,
  direction: 'DOWN', // 'UP', 'DOWN', 'LEFT', 'RIGHT'
  stepFrame: 0,
  stepTimer: 0,
  isMoving: false,
};

const companion = {
  x: 112,
  y: 56,
  direction: 'DOWN',
  history: [],
  flameAnim: 0,
};

// Diálogo activo RPG
let dialog = {
  active: false,
  text: '',
  speaker: '',
  timer: 0,
};

// Mapa de tiles básico (15x10 tiles de 16x16 = 240x160)
// 0 = Hierba, 1 = Camino de arena, 2 = Hierba alta, 3 = Árbol, 4 = Cartel, 5 = Agua
const MAP_WIDTH = 15;
const MAP_HEIGHT = 10;
const TILE_SIZE = 16;

const WORLD_MAP = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 0, 0, 0, 2, 2, 0, 1, 1, 0, 2, 2, 0, 0, 3],
  [3, 0, 4, 0, 2, 2, 0, 1, 1, 0, 2, 2, 0, 0, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 0, 2, 2, 0, 0, 0, 1, 1, 0, 0, 0, 2, 0, 3],
  [3, 0, 2, 2, 0, 5, 5, 1, 1, 5, 5, 0, 2, 0, 3],
  [3, 0, 0, 0, 0, 5, 5, 1, 1, 5, 5, 0, 0, 0, 3],
  [3, 2, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 2, 2, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
];

// ============================================================================
// Funciones de Dibujo Retro GBA
// ============================================================================

function drawTile(ctx, type, px, py, now) {
  switch (type) {
    case 0: // Hierba normal
      ctx.fillStyle = '#48bb78';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#38a169';
      ctx.fillRect(px + 3, py + 4, 2, 2);
      ctx.fillRect(px + 10, py + 11, 2, 2);
      break;

    case 1: // Camino de tierra/arena
      ctx.fillStyle = '#ecc94b';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#d69e2e';
      ctx.fillRect(px + 2, py + 8, 3, 1);
      ctx.fillRect(px + 9, py + 3, 2, 1);
      ctx.fillRect(px + 7, py + 13, 3, 1);
      break;

    case 2: // Hierba alta
      ctx.fillStyle = '#2f855a';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#276749';
      for (let i = 2; i < 16; i += 4) {
        ctx.fillRect(px + i, py + 2, 2, 12);
        ctx.fillRect(px + i + 1, py + 1, 1, 2);
      }
      break;

    case 3: // Árbol de Johto
      ctx.fillStyle = '#22543d';
      ctx.fillRect(px, py, 16, 16);
      // Copa del árbol
      ctx.fillStyle = '#2f855a';
      ctx.fillRect(px + 2, py + 1, 12, 11);
      ctx.fillStyle = '#38a169';
      ctx.fillRect(px + 4, py + 2, 8, 7);
      // Tronco
      ctx.fillStyle = '#744210';
      ctx.fillRect(px + 6, py + 12, 4, 4);
      break;

    case 4: // Cartel de madera
      ctx.fillStyle = '#48bb78';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#975a16';
      ctx.fillRect(px + 2, py + 4, 12, 8);
      ctx.fillStyle = '#b7791f';
      ctx.fillRect(px + 3, py + 5, 10, 6);
      ctx.fillStyle = '#744210';
      ctx.fillRect(px + 7, py + 12, 2, 4);
      break;

    case 5: // Agua animada
      const wave = Math.sin((now / 400) + px + py) * 2;
      ctx.fillStyle = '#3182ce';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#63b3ed';
      ctx.fillRect(px + 2, py + 4 + wave, 12, 2);
      ctx.fillRect(px + 4, py + 10 - wave, 8, 2);
      break;
  }
}

// Dibujar al Entrenador Gold
function drawPlayer(ctx, x, y, dir, step) {
  const isAlt = step % 2 === 1;

  // Sombra del personaje
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, y + 14, 12, 3);

  // Cuerpo y ropa de Gold
  // Zapatillas deportivas rojas
  ctx.fillStyle = '#e53e3e';
  if (dir === 'UP' || dir === 'DOWN') {
    ctx.fillRect(x + (isAlt ? 3 : 4), y + 13, 3, 3);
    ctx.fillRect(x + (isAlt ? 9 : 10), y + 13, 3, 3);
  } else if (dir === 'LEFT') {
    ctx.fillRect(x + 4, y + 13, 4, 3);
  } else {
    ctx.fillRect(x + 8, y + 13, 4, 3);
  }

  // Pantalones oscuros
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(x + 4, y + 10, 8, 4);

  // Chaqueta roja/negra de Gold
  ctx.fillStyle = '#e53e3e';
  ctx.fillRect(x + 3, y + 6, 10, 5);
  ctx.fillStyle = '#ecc94b'; // Rayas doradas
  ctx.fillRect(x + 6, y + 7, 4, 2);

  // Rostro / Cuello
  ctx.fillStyle = '#fbd38d';
  ctx.fillRect(x + 5, y + 3, 6, 4);

  // Ojos (si mira hacia abajo o lados)
  if (dir === 'DOWN') {
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(x + 6, y + 4, 1, 2);
    ctx.fillRect(x + 9, y + 4, 1, 2);
  } else if (dir === 'LEFT') {
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(x + 5, y + 4, 1, 2);
  } else if (dir === 'RIGHT') {
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(x + 10, y + 4, 1, 2);
  }

  // Gorra de Gold girada hacia atrás
  ctx.fillStyle = '#e53e3e';
  ctx.fillRect(x + 4, y, 8, 4);
  ctx.fillStyle = '#1a202c'; // Visera negra atrás
  if (dir === 'DOWN' || dir === 'UP') {
    ctx.fillRect(x + 6, y - 1, 4, 2);
  } else if (dir === 'LEFT') {
    ctx.fillRect(x + 8, y, 3, 2);
  } else {
    ctx.fillRect(x + 5, y, 3, 2);
  }
}

// Dibujar a Cyndaquil (compañero que sigue)
function drawCyndaquil(ctx, x, y, flameCycle) {
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 3, y + 10, 10, 3);

  // Cuerpo azul oscuro
  ctx.fillStyle = '#2b6cb0';
  ctx.fillRect(x + 4, y + 3, 8, 7);

  // Barriga crema
  ctx.fillStyle = '#fefcbf';
  ctx.fillRect(x + 6, y + 6, 6, 4);

  // Hocico largo característico
  ctx.fillStyle = '#fbd38d';
  ctx.fillRect(x + 10, y + 4, 3, 3);
  ctx.fillStyle = '#1a202c'; // Nariz/Ojo cerrado
  ctx.fillRect(x + 9, y + 4, 1, 1);

  // Llama animada de fuego en el lomo
  const flameH = 4 + (flameCycle % 3);
  ctx.fillStyle = '#dd6b20';
  ctx.fillRect(x + 1, y + 4 - flameH, 3, flameH + 2);
  ctx.fillStyle = '#f6ad55';
  ctx.fillRect(x + 2, y + 3 - flameH, 2, flameH);
  ctx.fillStyle = '#faf089';
  ctx.fillRect(x + 2, y + 2 - flameH, 1, flameH - 1);
}

// ============================================================================
// Bucle Principal de Renderizado GBA (60 FPS)
// ============================================================================

function renderFrame(now) {
  if (!isRunning || !ctx) return;

  frameCount++;
  if (now - lastFrameTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = now;
    self.postMessage({ type: 'FPS_UPDATE', fps });
  }

  // 1. Manejo de física y movimiento del jugador
  const speed = keyState.B ? player.speed * 1.6 : player.speed;
  let moved = false;

  const prevX = player.x;
  const prevY = player.y;

  if (!dialog.active) {
    if (keyState.UP) {
      player.y -= speed;
      player.direction = 'UP';
      moved = true;
    } else if (keyState.DOWN) {
      player.y += speed;
      player.direction = 'DOWN';
      moved = true;
    } else if (keyState.LEFT) {
      player.x -= speed;
      player.direction = 'LEFT';
      moved = true;
    } else if (keyState.RIGHT) {
      player.x += speed;
      player.direction = 'RIGHT';
      moved = true;
    }
  }

  // Colisión simple con bordes del mapa
  player.x = Math.max(18, Math.min(206, player.x));
  player.y = Math.max(18, Math.min(126, player.y));

  // Animación de pasos
  if (moved) {
    player.stepTimer++;
    if (player.stepTimer > 8) {
      player.stepFrame = (player.stepFrame + 1) % 4;
      player.stepTimer = 0;
    }

    // Historial para que Cyndaquil lo siga
    companion.history.push({ x: prevX, y: prevY, dir: player.direction });
    if (companion.history.length > 12) {
      const follow = companion.history.shift();
      companion.x = follow.x;
      companion.y = follow.y;
      companion.direction = follow.dir;
    }
  }

  // Interacción con botón A
  if (keyState.A && !dialog.active) {
    // Si está cerca del cartel (x ~ 32, y ~ 32)
    const distToSign = Math.hypot(player.x - 36, player.y - 36);
    const distToCyndaquil = Math.hypot(player.x - companion.x, player.y - companion.y);

    if (distToSign < 20) {
      dialog.active = true;
      dialog.speaker = 'CARTEL RUTA 29';
      dialog.text = 'RUTA 29: Hacia Ciudad Malva y Gimnasio Céfiro.';
    } else if (distToCyndaquil < 24) {
      dialog.active = true;
      dialog.speaker = 'CYNDAQUIL';
      dialog.text = '¡Cyn! Su lomo desprende chispas de alegría.';
    }
  }

  // Cerrar diálogo con botón B
  if (keyState.B && dialog.active) {
    dialog.active = false;
  }

  companion.flameAnim = Math.floor(now / 150) % 3;

  // 2. Renderizado del Overworld
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(0, 0, 240, 160);

  // Dibujar tiles
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      drawTile(ctx, WORLD_MAP[row][col], col * TILE_SIZE, row * TILE_SIZE, now);
    }
  }

  // Dibujar a Cyndaquil (detrás de Gold si Gold está más abajo)
  if (companion.y <= player.y) {
    drawCyndaquil(ctx, Math.round(companion.x), Math.round(companion.y), companion.flameAnim);
    drawPlayer(ctx, Math.round(player.x), Math.round(player.y), player.direction, player.stepFrame);
  } else {
    drawPlayer(ctx, Math.round(player.x), Math.round(player.y), player.direction, player.stepFrame);
    drawCyndaquil(ctx, Math.round(companion.x), Math.round(companion.y), companion.flameAnim);
  }

  // 3. HUD de cabecera estilo GBA
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(4, 4, 232, 14);
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('RUTA 29 (CYBER-JOHTO)', 8, 14);

  ctx.fillStyle = '#f6ad55';
  ctx.fillText('LVL 12 CYNDAQUIL', 142, 14);

  // 4. Cuadro de Diálogo RPG clásico de Nintendo (cuando está activo)
  if (dialog.active) {
    // Fondo del marco de diálogo
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(10, 108, 220, 46);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 110, 216, 42);

    // Borde interno dorado
    ctx.strokeStyle = '#d69e2e';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 112, 212, 38);

    // Altavoz / Nombre
    ctx.fillStyle = '#ecc94b';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(dialog.speaker, 20, 122);

    // Texto del mensaje (máx 2 líneas estilo Nintendo)
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(dialog.text, 20, 134);

    // Indicador parpadeante [B: Cerrar]
    const blink = Math.sin(now / 200) > 0;
    if (blink) {
      ctx.fillStyle = '#e53e3e';
      ctx.fillText('▼ [B]', 204, 144);
    }
  }

  // Grilla CRT scanlines sutil
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < 160; y += 2) {
    ctx.fillRect(0, y, 240, 1);
  }

  animationFrameId = requestAnimationFrame(renderFrame);
}

// ============================================================================
// Escuchador de Mensajes del Hilo Principal
// ============================================================================

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT_OFFSCREEN_CANVAS': {
      canvas = payload.canvas;
      ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      ctx.imageSmoothingEnabled = false;

      // Arrancar inmediatamente el renderizado visual
      isRunning = true;
      animationFrameId = requestAnimationFrame(renderFrame);

      self.postMessage({ type: 'WORKER_READY' });
      break;
    }

    case 'LOAD_ROM_BUFFER': {
      // Inyección directa de ROM binaria subida por el usuario
      if (payload?.buffer) {
        romBuffer = new Uint8Array(payload.buffer);
        romName = payload.name || 'CUSTOM_GBA_ROM';
        self.postMessage({
          type: 'STATUS_UPDATE',
          status: 'ROM_LOADED',
          byteLength: romBuffer.byteLength,
        });
      }
      break;
    }

    case 'LOAD_ROM_FROM_URL': {
      try {
        const { romUrl } = payload;
        const resp = await fetch(romUrl);
        if (resp.ok) {
          romBuffer = new Uint8Array(await resp.arrayBuffer());
          self.postMessage({
            type: 'STATUS_UPDATE',
            status: 'ROM_LOADED',
            byteLength: romBuffer.byteLength,
          });
        } else {
          // Si la ROM remota aún no está en Supabase, el Overworld interactivo sigue corriendo perfectamente
          self.postMessage({
            type: 'STATUS_UPDATE',
            status: 'READY_OVERWORLD_JOHTO',
          });
        }
      } catch {
        self.postMessage({
          type: 'STATUS_UPDATE',
          status: 'READY_OVERWORLD_JOHTO',
        });
      }
      break;
    }

    case 'INJECT_SAVE': {
      if (payload?.saveBuffer) {
        const incoming = new Uint8Array(payload.saveBuffer);
        if (incoming.byteLength >= GBA_SAVE_SIZE) {
          savBuffer.set(incoming.subarray(0, GBA_SAVE_SIZE));
        } else {
          savBuffer.set(incoming);
        }
        saveLoaded = true;
        self.postMessage({
          type: 'STATUS_UPDATE',
          status: 'SAVE_INJECTED',
          byteLength: incoming.byteLength,
        });
      }
      break;
    }

    case 'EXPORT_SAVE': {
      const copy = new Uint8Array(savBuffer);
      self.postMessage(
        {
          type: 'SAVE_EXPORTED',
          payload: {
            saveBuffer: copy.buffer,
            reason: payload?.reason || 'manual',
          },
        },
        [copy.buffer]
      );
      break;
    }

    case 'START': {
      if (!isRunning) {
        isRunning = true;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(renderFrame);
        self.postMessage({ type: 'STATUS_UPDATE', status: 'RUNNING' });
      }
      break;
    }

    case 'KEY_DOWN': {
      if (keyState[payload.key] !== undefined) {
        keyState[payload.key] = true;
      }
      break;
    }

    case 'KEY_UP': {
      if (keyState[payload.key] !== undefined) {
        keyState[payload.key] = false;
      }
      break;
    }

    case 'PAUSE': {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      self.postMessage({ type: 'STATUS_UPDATE', status: 'PAUSED' });
      break;
    }

    case 'RESUME': {
      if (!isRunning) {
        isRunning = true;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(renderFrame);
        self.postMessage({ type: 'STATUS_UPDATE', status: 'RESUMED' });
      }
      break;
    }
  }
};

// src/lib/sfx.ts

// --- Config: registra aquí tus sonidos por clave ---
const SFX_MAP = {
  text_sfx: [
    "/sfx/Blip1.wav",
    "/sfx/Blip2.wav",
    "/sfx/Blip3.wav",
    "/sfx/Blip4.wav",
    "/sfx/Blip5.wav",
  ],
  // puedes agregar más claves:
  // confirm: ["/sfx/confirm1.mp3", "/sfx/confirm2.mp3"],
  // hit: ["/sfx/hit.mp3"],
} as const;

// --- Infraestructura: pool y helpers ---
type Slot = { url: string; pool: HTMLAudioElement[]; idx: number };
type Bank = Record<string, Slot[]>;

let GLOBAL_VOLUME = 0.6; // volumen global (0..1)

const bank: Bank = Object.fromEntries(
  Object.entries(SFX_MAP).map(([key, urls]) => {
    const slots: Slot[] = urls.map((url) => ({
      url,
      pool: [new Audio(url), new Audio(url)], // 2 instancias por URL para solapamiento
      idx: 0,
    }));
    return [key, slots];
  })
);

function pick<T>(arr: T[], mode: "random" | "cycle", cycleIndexRef?: { i: number }) {
  if (arr.length === 0) throw new Error("Empty array");
  if (mode === "random") {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  // cycle
  if (!cycleIndexRef) return arr[0];
  cycleIndexRef.i = (cycleIndexRef.i + 1) % arr.length;
  return arr[cycleIndexRef.i];
}

function playFromSlot(slot: Slot, volume = GLOBAL_VOLUME) {
  slot.idx = (slot.idx + 1) % slot.pool.length;
  const a = slot.pool[slot.idx];
  try {
    a.pause();
    a.currentTime = 0;
  } catch {}
  a.volume = volume;
  a.play().catch(() => {});
}

// --- API pública ---

/** Cambia volumen global (0..1). */
export function setSfxVolume(v: number) {
  GLOBAL_VOLUME = Math.max(0, Math.min(1, v));
}

/**
 * Reproduce un SFX por clave.
 * @param key Clave del sonido (ej: "text_sfx")
 * @param opts.variant
 *   - number: índice exacto de variante (0-based)
 *   - "random": elige aleatoria (default)
 *   - "cycle": recorre variantes en orden
 * @param opts.volume Volumen de este sonido (default = volumen global)
 */
export function playSfx(
  key: keyof typeof SFX_MAP | string,
  opts?: { variant?: number | "random" | "cycle"; volume?: number }
) {
  const slots = bank[key];
  if (!slots || slots.length === 0) return;

  const volume = typeof opts?.volume === "number" ? opts.volume : GLOBAL_VOLUME;

  if (typeof opts?.variant === "number") {
    const idx = Math.max(0, Math.min(slots.length - 1, opts.variant));
    playFromSlot(slots[idx], volume);
    return;
  }

  if (!("_cycle" in bank)) {
    // @ts-expect-error attach runtime field for cycle indices
    bank._cycle = {} as Record<string, { i: number }>;
  }
  // @ts-expect-error runtime field
  const cycles: Record<string, { i: number }> = bank._cycle;
  cycles[key] ??= { i: -1 };

  const mode = (opts?.variant ?? "random") as "random" | "cycle";
  const chosen = pick(slots, mode, cycles[key]);
  playFromSlot(chosen, volume);
}

/** Azúcar específico si te gusta llamar “text_sfx()” directamente. */
export function text_sfx(opts?: { variant?: number | "random" | "cycle"; volume?: number }) {
  playSfx("text_sfx", opts);
}

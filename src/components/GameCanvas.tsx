// src/components/GameCanvas.tsx
"use client";
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// ---------------- util ruido/biomas (igual que antes) ----------------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const mod = (n: number, m: number) => ((n % m) + m) % m;

function valueNoise(rx: number, ry: number, scale = 0.08, seed = 1337) {
  const rand = (x: number, y: number) => {
    let n = x * 374761393 + y * 668265263 + seed * 2654435761;
    n = (n ^ (n >> 13)) * 1274126177;
    n = (n ^ (n >> 16)) >>> 0;
    return (n % 10_000) / 10_000;
  };
  const x = rx * scale, y = ry * scale;
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = smooth(xf), v = smooth(yf);
  const v00 = rand(xi, yi);
  const v10 = rand(xi + 1, yi);
  const v01 = rand(xi, yi + 1);
  const v11 = rand(xi + 1, yi + 1);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

type Biome = "water" | "shore" | "prairie" | "forest" | "rock" | "snow";
const biomeAt = (tx: number, ty: number): Biome => {
  const h = valueNoise(tx, ty, 0.08);
  const m = valueNoise(tx + 999, ty - 999, 0.12);
  if (h < 0.36) return "water";
  if (h < 0.42) return "shore";
  if (h < 0.62) return m < 0.5 ? "prairie" : "forest";
  if (h < 0.80) return "rock";
  return "snow";
};

// ---------------- tamaños canvas ----------------
const CANVAS_W = 1080;
const CANVAS_H = 720;
const TILE      = 40;

// ---------------- tipos app/enemigos ----------------
type EncounterInfo = { kind: string; tx: number; ty: number };
type AppWithCleanup = PIXI.Application & { _cleanup?: () => void };

// ---------------- persistencia de enemigo ----------------
function loadEnemyPos(): { tx: number; ty: number } {
  try {
    const raw = sessionStorage.getItem("enemyPos");
    if (raw) {
      const p = JSON.parse(raw);
      if (Number.isFinite(p?.tx) && Number.isFinite(p?.ty)) return { tx: p.tx, ty: p.ty };
    }
  } catch {}
  return { tx: 5, ty: 3 };
}
function saveEnemyPos(pos: { tx: number; ty: number }) {
  try { sessionStorage.setItem("enemyPos", JSON.stringify(pos)); } catch {}
}

// ---------------- NUEVO: texturas por bioma ----------------
const TILE_PATHS: Record<Biome, string[]> = {
  prairie: ["/tiles/meadow/1.png","/tiles/meadow/2.png","/tiles/meadow/3.png"],
  forest:  ["/tiles/forest/1.png","/tiles/forest/2.png","/tiles/forest/3.png"],
  rock:    ["/tiles/rock/1.png","/tiles/rock/2.png","/tiles/rock/3.png"],
  shore:   ["/tiles/shore/1.png","/tiles/shore/2.png","/tiles/shore/3.png"],
  snow:    ["/tiles/snow/1.png","/tiles/snow/2.png","/tiles/snow/3.png"],
  water:   ["/tiles/water/1.png","/tiles/water/2.png","/tiles/water/3.png"],
};

// caché de Textures en GPU
const TILE_TEX: Partial<Record<Biome, PIXI.Texture[]>> = {};

// hash determinístico para escoger variante estable por (tx,ty)
function hash2(x: number, y: number, seed = 1013904223) {
  let n = x * 374761393 + y * 668265263 + seed;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = (n ^ (n >>> 16)) >>> 0;
  return n;
}
function textureFor(biome: Biome, tx: number, ty: number): PIXI.Texture {
  const arr = TILE_TEX[biome]!;
  const idx = hash2(tx, ty) % arr.length;
  return arr[idx];
}

// =====================================================================
export default function GameCanvas({ onPos, onEncounter }: {
  onPos?: (tx: number, ty: number) => void;
  onEncounter?: (info: EncounterInfo) => void;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<AppWithCleanup | null>(null);

  const onPosRef = useRef<((tx: number, ty: number) => void) | null>(null);
  onPosRef.current = onPos ?? null;

  const onEncounterRef = useRef<((info: EncounterInfo) => void) | null>(null);
  onEncounterRef.current = onEncounter ?? null;

  const wasCollidingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // destruye app previa si existe
      if (appRef.current) {
        try { appRef.current.ticker?.stop(); } catch {}
        try { appRef.current.destroy(true); } catch {}
        appRef.current = null;
      }

      // crea PIXI app
      const app = new PIXI.Application() as AppWithCleanup;
      await app.init({
        width: CANVAS_W,
        height: CANVAS_H,
        background: "#e6f0ff",
        antialias: false,
      });
      if (cancelled) { try { app.destroy(true); } catch {}; return; }
      appRef.current = app;

      // monta canvas
      const holder = holderRef.current!;
      holder.innerHTML = "";
      holder.appendChild(app.canvas as HTMLCanvasElement);

      // --- NUEVO: precarga texturas ---
      const allUrls = Object.values(TILE_PATHS).flat();
      await PIXI.Assets.load(allUrls);
      for (const [b, urls] of Object.entries(TILE_PATHS) as [Biome, string[]][]) {
        TILE_TEX[b] = urls.map((u) => PIXI.Texture.from(u));
      }

      // medidas
      const tile = TILE;
      const playerSize = Math.floor(tile * 0.5);
      const enemySize  = Math.floor(tile * 0.5);
      const tilesX = Math.ceil(app.renderer.width  / tile) + 3;
      const tilesY = Math.ceil(app.renderer.height / tile) + 3;

      // cargar pos jugador
      let player = { tx: 0, ty: 0 };
      try {
        const saved = sessionStorage.getItem("playerPos");
        if (saved) {
          const pos = JSON.parse(saved);
          if (Number.isFinite(pos?.tx) && Number.isFinite(pos?.ty)) player = { tx: pos.tx, ty: pos.ty };
        }
      } catch {}

      // enemigo persistente
      const enemy = { ...loadEnemyPos(), kind: "slime" as const };

      // capas
      const layerWorld = new PIXI.Container(); // sprites de tiles
      const layerGrid  = new PIXI.Graphics();
      const layerEnemy = new PIXI.Graphics();
      const layerActor = new PIXI.Graphics();
      app.stage.addChild(layerWorld, layerGrid, layerEnemy, layerActor);

      // caché de sprites para tiles visibles
      const spriteCache = new Map<string, PIXI.Sprite>(); // key "tx,ty"

      // ------------ reposicionar enemigo tras batalla ------------
      type RepositionMode = "random" | "adjacent";
      function repositionEnemy(mode: RepositionMode = "random") {
        let nx = enemy.tx, ny = enemy.ty;

        if (mode === "adjacent") {
          const candidates = [
            { x: player.tx + 1, y: player.ty },
            { x: player.tx - 1, y: player.ty },
            { x: player.tx,     y: player.ty + 1 },
            { x: player.tx,     y: player.ty - 1 },
          ];
          for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
          }
          nx = candidates[0]!.x; ny = candidates[0]!.y;
        } else {
          let tries = 0;
          do {
            const dx = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.floor(Math.random() * 4));
            const dy = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.floor(Math.random() * 4));
            nx = player.tx + dx;
            ny = player.ty + dy;
            tries++;
          } while ((nx === player.tx && ny === player.ty) && tries < 6);
        }

        enemy.tx = nx; enemy.ty = ny;
        saveEnemyPos({ tx: enemy.tx, ty: enemy.ty });
        wasCollidingRef.current = false;
        draw();
      }

      const onAfterBattle = (ev?: Event) => {
        try { sessionStorage.removeItem("afterBattle"); } catch {}
        const mode = (ev instanceof CustomEvent && ev.detail?.mode) as RepositionMode | undefined;
        repositionEnemy(mode ?? "random");
      };

      window.addEventListener("afterbattle", onAfterBattle as EventListener);
      try { if (sessionStorage.getItem("afterBattle") === "1") onAfterBattle(); } catch {}

      // ------------------- draw -------------------
      const draw = () => {
        const camX = player.tx * tile + tile / 2;
        const camY = player.ty * tile + tile / 2;

        const baseX = Math.floor((camX - app.renderer.width  / 2) / tile);
        const baseY = Math.floor((camY - app.renderer.height / 2) / tile);
        const offX  = -mod((camX - app.renderer.width  / 2), tile);
        const offY  = -mod((camY - app.renderer.height / 2), tile);

        // --- tiles como sprites ---
        const visible = new Set<string>();
        for (let y = -1; y < tilesY; y++) {
          for (let x = -1; x < tilesX; x++) {
            const tx = baseX + x, ty = baseY + y;
            const sx = Math.floor(offX + x * tile);
            const sy = Math.floor(offY + y * tile);
            const biome = biomeAt(tx, ty);
            const key = `${tx},${ty}`;
            visible.add(key);

            const tex = textureFor(biome, tx, ty);
            let spr = spriteCache.get(key);
            if (!spr) {
              spr = new PIXI.Sprite({ texture: tex });
              spr.width = tile; spr.height = tile;
              spriteCache.set(key, spr);
              layerWorld.addChild(spr);
            } else if (spr.texture !== tex) {
              spr.texture = tex;
            }
            spr.x = sx;
            spr.y = sy;
          }
        }
        // reciclar los que salieron de pantalla
        for (const [key, spr] of spriteCache) {
          if (!visible.has(key)) {
            spr.parent?.removeChild(spr);
            spriteCache.delete(key);
          }
        }

        // --- grilla (igual que antes) ---
        layerGrid.clear();
        const dash = 6, gap = 6;
        const drawDashed = (x1:number, y1:number, x2:number, y2:number) => {
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const ux = dx / len,  uy = dy / len;
          let d = 0;
          while (d < len) {
            const seg = Math.min(dash, len - d);
            const sx = x1 + ux * d, sy = y1 + uy * d;
            layerGrid.moveTo(sx, sy).lineTo(sx + ux * seg, sy + uy * seg)
              .stroke({ color: 0x000000, alpha: 0.12, width: 1 });
            d += dash + gap;
          }
        };
        const gridOX = mod(offX, tile);
        const gridOY = mod(offY, tile);
        for (let x = gridOX; x <= app.renderer.width; x += tile) drawDashed(x, 0, x, app.renderer.height);
        for (let y = gridOY; y <= app.renderer.height; y += tile) drawDashed(0, y, app.renderer.width, y);

        // --- enemigo ---
        layerEnemy.clear();
        const enemyScreenX = Math.floor(offX + (enemy.tx - baseX) * tile + (tile - enemySize) / 2);
        const enemyScreenY = Math.floor(offY + (enemy.ty - baseY) * tile + (tile - enemySize) / 2);
        layerEnemy.rect(enemyScreenX, enemyScreenY, enemySize, enemySize).fill({ color: 0xef4444 });

        // --- jugador ---
        layerActor.clear();
        const px = Math.floor(app.renderer.width  / 2 - playerSize / 2);
        const py = Math.floor(app.renderer.height / 2 - playerSize / 2);
        layerActor.rect(px, py, playerSize, playerSize).fill({ color: 0x111827 });
      };

      const tryEncounter = () => {
        const isColliding = player.tx === enemy.tx && player.ty === enemy.ty;
        if (isColliding && !wasCollidingRef.current) {
          wasCollidingRef.current = true;
          const info = { kind: enemy.kind, tx: enemy.tx, ty: enemy.ty };
          onEncounterRef.current?.(info);
        }
        if (!isColliding && wasCollidingRef.current) {
          wasCollidingRef.current = false;
        }
      };

      const savePos = () => {
        try { sessionStorage.setItem("playerPos", JSON.stringify(player)); } catch {}
      };

      // input
      const keys = new Set<string>();
      const onDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (keys.has(k)) return;
        keys.add(k);

        let moved = false;
        if (k === "w" || k === "arrowup")    { player.ty -= 1; moved = true; }
        if (k === "s" || k === "arrowdown")  { player.ty += 1; moved = true; }
        if (k === "a" || k === "arrowleft")  { player.tx -= 1; moved = true; }
        if (k === "d" || k === "arrowright") { player.tx += 1; moved = true; }

        if (moved) {
          draw();
          savePos();
          onPosRef.current?.(player.tx, player.ty);
          tryEncounter();
        }
      };
      const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);

      // primer render
      draw();
      savePos();
      onPosRef.current?.(player.tx, player.ty);

      // cleanup
      const cleanup = () => {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("keyup", onUp);
        window.removeEventListener("afterbattle", onAfterBattle as EventListener);
        try { app.ticker?.stop(); } catch {}
        try { app.destroy(true); } catch {}
        appRef.current = null;
      };
      app._cleanup = cleanup;
    })();

    return () => {
      cancelled = true;
      const app = appRef.current;
      const cleanup = app?._cleanup;
      cleanup?.();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={holderRef}
        className="rounded-xl border p-0 mx-auto"
        style={{ lineHeight: 0, width: CANVAS_W }}
      />
      <p className="text-sm text-zinc-700 dark:text-zinc-300 text-center">
        Moverse: <b>WASD</b> / flechas. La grilla es referencia; el jugador (cuadrado negro) es más chico que cada celda.
      </p>
    </div>
  );
}

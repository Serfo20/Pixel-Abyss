"use client";
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

/** --- utilidades --- */
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
const colorOf: Record<Biome, number> = {
  water: 0x8ecae6, shore: 0xade8f4, prairie: 0xa7d948,
  forest: 0x70b652, rock: 0xb9b7a7, snow: 0xffffff
};
const biomeAt = (tx: number, ty: number): Biome => {
  const h = valueNoise(tx, ty, 0.08);
  const m = valueNoise(tx + 999, ty - 999, 0.12);
  if (h < 0.36) return "water";
  if (h < 0.42) return "shore";
  if (h < 0.62) return m < 0.5 ? "prairie" : "forest";
  if (h < 0.80) return "rock";
  return "snow";
};

// Tamaños
const CANVAS_W = 1080;
const CANVAS_H = 720;
const TILE      = 40;

type EncounterInfo = { kind: string; tx: number; ty: number };

export default function GameCanvas({
  onPos,
  onEncounter,
}: {
  onPos?: (tx: number, ty: number) => void;
  onEncounter?: (info: EncounterInfo) => void;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // Refs para callbacks + estado: evitan re-montajes del efecto
  const onPosRef = useRef<((tx: number, ty: number) => void) | null>(null);
  onPosRef.current = onPos ?? null;

  const onEncounterRef = useRef<((info: EncounterInfo) => void) | null>(null);
  onEncounterRef.current = onEncounter ?? null;

  const wasCollidingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (appRef.current) {
        try { appRef.current.ticker?.stop(); } catch {}
        try { appRef.current.destroy(true); } catch {}
        appRef.current = null;
      }

      const app = new PIXI.Application();
      await app.init({ width: CANVAS_W, height: CANVAS_H, background: "#e6f0ff", antialias: false });
      if (cancelled) { try { app.destroy(true); } catch {} return; }
      appRef.current = app;

      const holder = holderRef.current!;
      holder.innerHTML = "";
      holder.appendChild(app.canvas as HTMLCanvasElement);

      // Parámetros visuales
      const tile = TILE;
      const playerSize = Math.floor(tile * 0.5);
      const enemySize  = Math.floor(tile * 0.5);
      const tilesX = Math.ceil(app.renderer.width  / tile) + 3;
      const tilesY = Math.ceil(app.renderer.height / tile) + 3;

      // Estado
      const player = { tx: 0, ty: 0 };
      const enemy  = { tx: 5, ty: 3, kind: "slime" as const };

      // Capas
      const layerWorld = new PIXI.Graphics();
      const layerGrid  = new PIXI.Graphics();
      const layerEnemy = new PIXI.Graphics();
      const layerActor = new PIXI.Graphics();
      app.stage.addChild(layerWorld, layerGrid, layerEnemy, layerActor);

      const draw = () => {
        const camX = player.tx * tile + tile / 2;
        const camY = player.ty * tile + tile / 2;

        const baseX = Math.floor((camX - app.renderer.width  / 2) / tile);
        const baseY = Math.floor((camY - app.renderer.height / 2) / tile);
        const offX  = -mod((camX - app.renderer.width  / 2), tile);
        const offY  = -mod((camY - app.renderer.height / 2), tile);

        // Fondo
        layerWorld.clear();
        for (let y = -1; y < tilesY; y++) {
          for (let x = -1; x < tilesX; x++) {
            const tx = baseX + x, ty = baseY + y;
            const sx = Math.floor(offX + x * tile);
            const sy = Math.floor(offY + y * tile);
            const biome = biomeAt(tx, ty);
            layerWorld.rect(sx, sy, tile, tile).fill({ color: colorOf[biome] });
          }
        }

        // Grilla
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

        // Enemigo
        layerEnemy.clear();
        const enemyScreenX = Math.floor(offX + (enemy.tx - baseX) * tile + (tile - enemySize) / 2);
        const enemyScreenY = Math.floor(offY + (enemy.ty - baseY) * tile + (tile - enemySize) / 2);
        layerEnemy.rect(enemyScreenX, enemyScreenY, enemySize, enemySize).fill({ color: 0xef4444 });

        // Jugador
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

      // Input
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
          onPosRef.current?.(player.tx, player.ty);
          tryEncounter();
        }
      };
      const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);

      // Primer render
      draw();
      onPosRef.current?.(player.tx, player.ty);
      tryEncounter();

      // Cleanup
      const cleanup = () => {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("keyup", onUp);
        try { app.ticker?.stop(); } catch {}
        try { app.destroy(true); } catch {}
        appRef.current = null;
      };
      (app as any)._cleanup = cleanup;
    })();

    return () => {
      const app = appRef.current as any;
      const cleanup = app?._cleanup as (() => void) | undefined;
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

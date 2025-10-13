"use client";
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

/** --- utilidades --- */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const mod = (n: number, m: number) => ((n % m) + m) % m; // resto siempre positivo

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

// --- Tamaños “grandes”: cambia estos 3 números y el resto se adapta ---
const CANVAS_W = 1080;
const CANVAS_H = 720;
const TILE     = 40;   // tamaño de celda en píxeles

export default function GameCanvas({ onPos }: { onPos?: (tx: number, ty: number) => void }) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // mantener onPos en un ref para no depender de su identidad (no reinicia el efecto)
  const onPosRef = useRef<((tx: number, ty: number) => void) | null>(null);
  onPosRef.current = onPos ?? null;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // limpiar instancias previas en hot-reload
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

      // --- parámetros visuales ---
      const tile = TILE;                                // tamaño de cada celda
      const playerSize = Math.floor(tile * 0.5);        // jugador más pequeño que la celda
      const tilesX = Math.ceil(app.renderer.width  / tile) + 3; // colchón extra
      const tilesY = Math.ceil(app.renderer.height / tile) + 3;

      // estado mínimo
      const player = { tx: 0, ty: 0 };  // posición en tiles

      // capas
      const layerWorld = new PIXI.Graphics(); // biomas
      const layerGrid  = new PIXI.Graphics(); // grilla sutil
      const layerActor = new PIXI.Graphics(); // jugador
      app.stage.addChild(layerWorld, layerGrid, layerActor);

      const draw = () => {
        // cámara centrada al centro de la celda del jugador
        const camX = player.tx * tile + tile / 2;
        const camY = player.ty * tile + tile / 2;

        // tiles-base visibles y offset en píxeles, con módulo POSITIVO (evita “fila/columna cortada”)
        const baseX = Math.floor((camX - app.renderer.width  / 2) / tile);
        const baseY = Math.floor((camY - app.renderer.height / 2) / tile);
        const offX  = -mod((camX - app.renderer.width  / 2), tile);
        const offY  = -mod((camY - app.renderer.height / 2), tile);

        // --- fondo/biomas: cubre todo el canvas con colchón ---
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

        // --- grilla sutil en TODO el rectángulo, con desplazamiento correcto ---
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
            layerGrid
              .moveTo(sx, sy)
              .lineTo(sx + ux * seg, sy + uy * seg)
              .stroke({ color: 0x000000, alpha: 0.12, width: 1 });
            d += dash + gap;
          }
        };

        // posiciones iniciales de líneas (modulo tile) para cubrir todo el canvas
        const gridOX = mod(offX, tile);
        const gridOY = mod(offY, tile);

        // verticales
        for (let x = gridOX; x <= app.renderer.width; x += tile) {
          drawDashed(x, 0, x, app.renderer.height);
        }
        // horizontales
        for (let y = gridOY; y <= app.renderer.height; y += tile) {
          drawDashed(0, y, app.renderer.width, y);
        }

        // --- jugador: centrado dentro de SU celda en pantalla ---
        layerActor.clear();
        const px = Math.floor(app.renderer.width  / 2 - playerSize / 2);
        const py = Math.floor(app.renderer.height / 2 - playerSize / 2);
        layerActor.rect(px, py, playerSize, playerSize).fill({ color: 0x111827 });
      };

      // input: moverse 1 celda por pulsación
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
        }
      };
      const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);

      // primer render
      draw();
      onPosRef.current?.(player.tx, player.ty);

      // cleanup seguro
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
  }, []); // deps vacías: no reinicia Pixi

  return (
    <div className="space-y-3">
      {/* Centramos el canvas con mx-auto (sin tocar Pixi) */}
      <div
        ref={holderRef}
        className="rounded-xl border p-0 mx-auto"
        style={{ lineHeight: 0, width: CANVAS_W }}
      />
      <p className="text-sm text-slate-700 text-center">
        Moverse: <b>WASD</b> / flechas. La grilla es referencia; el jugador (cuadrado negro) es más chico que cada celda.
      </p>
    </div>
  );
}

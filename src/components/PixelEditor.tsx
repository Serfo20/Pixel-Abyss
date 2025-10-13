"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  width: number;
  height: number;
  scale?: number;
  exportScale?: number;
  minCells?: number;
  palette: string[];
  advanced?: boolean;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function PixelEditor({
  width,
  height,
  scale = 12,
  exportScale = 12,
  minCells = 0,
  palette,
  advanced = false,
}: Props) {
  // -1 = transparente (vacío)
  const [pixels, setPixels] = useState<number[]>(
    () => Array(width * height).fill(-1)
  );
  const [colorIndex, setColorIndex] = useState<number>(1); // índice de la paleta; usa -1 para "borrar"
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [eyedropper, setEyedropper] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // reset al cambiar tamaño
  useEffect(() => {
    setPixels(Array(width * height).fill(-1));
  }, [width, height]);

  // dibujar
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    cvs.width = width * scale;
    cvs.height = height * scale;
    const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;

    // fondo checkerboard
    const cs = scale;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const even = ((x + y) & 1) === 0;
        ctx.fillStyle = even ? "#f1f5f9" : "#e2e8f0"; // slate-100/200
        ctx.fillRect(x * cs, y * cs, cs, cs);
      }
    }

    // píxeles pintados (idx >= 0)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = pixels[y * width + x] ?? -1;
        if (idx >= 0) {
          ctx.fillStyle = palette[idx] || "#000";
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    // grilla suave
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, height * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(width * scale, y * scale);
      ctx.stroke();
    }
  }, [pixels, palette, width, height, scale]);

  const setPixel = (x: number, y: number, idx: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    setPixels((prev) => {
      const i = y * width + x;
      if (prev[i] === idx) return prev;
      const copy = prev.slice();
      copy[i] = idx; // puede ser -1 (borrar)
      return copy;
    });
  };

  const onPointer = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const px = Math.floor((e.clientX - rect.left) / scale);
    const py = Math.floor((e.clientY - rect.top) / scale);

    if (eyedropper) {
      const idx = pixels[py * width + px] ?? -1;
      if (idx >= 0) setColorIndex(clamp(idx, 0, palette.length - 1));
      return;
    }
    if (isMouseDown) setPixel(px, py, colorIndex);
  };

  const handleDown = (e: React.PointerEvent) => {
    setIsMouseDown(true);
    onPointer(e);
  };
  const handleUp = () => setIsMouseDown(false);
  const handleLeave = () => setIsMouseDown(false);

  // cargar y pixelar imagen externa con la paleta activa
  async function loadAndPixelate(url: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = url;
    });

    // dibuja en canvas temporal a resolución objetivo
    const tmp = document.createElement("canvas");
    tmp.width = width;
    tmp.height = height;
    const ictx = tmp.getContext("2d", { willReadFrequently: true })!;
    ictx.imageSmoothingEnabled = false;
    ictx.drawImage(img, 0, 0, width, height);
    const data = ictx.getImageData(0, 0, width, height).data;

    // cuantización a paleta
    const toRGB = (hex: string) => {
      const v = hex.startsWith("#") ? hex.slice(1) : hex;
      return [
        parseInt(v.slice(0, 2), 16),
        parseInt(v.slice(2, 4), 16),
        parseInt(v.slice(4, 6), 16),
      ] as const;
    };
    const palRGB = palette.map(toRGB);

    const nearest = (r: number, g: number, b: number) => {
      let best = 0,
        bestD = 1e9;
      for (let i = 0; i < palRGB.length; i++) {
        const [pr, pg, pb] = palRGB[i];
        const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    };

    const out: number[] = new Array(width * height).fill(-1);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3];
      out[i] = a === 0 ? -1 : nearest(r, g, b);
    }
    setPixels(out);
  }

  // exportar PNG (transparente donde idx = -1)
  async function exportPNG() {
    const out = document.createElement("canvas");
    out.width = width * exportScale;
    out.height = height * exportScale;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = pixels[y * width + x] ?? -1;
        if (idx >= 0) {
          ctx.fillStyle = palette[idx] || "#000";
          ctx.fillRect(
            x * exportScale,
            y * exportScale,
            exportScale,
            exportScale
          );
        }
      }
    }

    const blob = await new Promise<Blob | null>((res) =>
      out.toBlob(res, "image/png")
    );
    if (!blob) return;
    const filename =
      window.prompt("Nombre para guardar (sin .png):", `pixel_${Date.now()}`) ??
      `pixel_${Date.now()}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.png`;
    a.click();
  }

  // generar por prompt (API → guarda en /public/gens → pixelar)
  async function generateFromPrompt(promptText: string) {
    if (!promptText.trim()) {
      alert("Escribe un prompt 🙂");
      return;
    }
    const res = await fetch("/api/prompt-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, filename: `gen_${Date.now()}` }),
    });
    const j = await res.json();
    if (!res.ok) {
      const txt = await res.text();
      console.error("prompt-image error:", txt);
      alert("Error IA");
      return;
    }
    await loadAndPixelate(j.url);
  }

  // métricas UI
  const painted = useMemo(
    () => pixels.reduce((a, v) => a + (v >= 0 ? 1 : 0), 0),
    [pixels]
  );

  // “swatch” para borrar (transparente)
  const EraserSwatch = (
    <button
      className={`w-6 h-6 border ${
        colorIndex === -1 ? "ring-2 ring-black" : ""
      }`}
      style={{
        background:
          "repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%) 50% / 8px 8px",
      }}
      title="Borrar (transparente)"
      onClick={() => setColorIndex(-1)}
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <div>
          {width}×{height} · zoom {scale}× · export {exportScale}×
        </div>
        <div className="ml-auto">
          pintado: {painted}/{width * height}
          {minCells > 0 && (
            <span className="ml-2 text-xs">
              (mín. {minCells} · {painted >= minCells ? "ok" : "incompleto"})
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-wrap max-w-[520px] gap-1">
          {EraserSwatch}
          {palette.map((c, i) => (
            <button
              key={i}
              className={`w-6 h-6 border ${
                i === colorIndex ? "ring-2 ring-black" : ""
              }`}
              style={{ background: c }}
              onClick={() => setColorIndex(i)}
              title={`${i} ${c}`}
            />
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant={eyedropper ? "default" : "outline"}
            onClick={() => setEyedropper((v) => !v)}
            title="Cuentagotas"
          >
            Cuentagotas
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const url = window.prompt("URL de imagen a pixelar:", "");
              if (url) loadAndPixelate(url);
            }}
          >
            Cargar & Pixelar
          </Button>
          <Button size="sm" onClick={exportPNG}>
            Exportar PNG
          </Button>
        </div>
      </div>

      <div className="rounded-lg border inline-block">
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={onPointer}
          onPointerUp={handleUp}
          onPointerLeave={handleLeave}
          style={{
            imageRendering: "pixelated",
            cursor: eyedropper ? "crosshair" : "pointer",
            touchAction: "none",
          }}
        />
      </div>

      {advanced && <PromptBox onGenerate={generateFromPrompt} />}
    </div>
  );
}

function PromptBox({ onGenerate }: { onGenerate: (t: string) => void }) {
  const [genPrompt, setGenPrompt] = useState("");
  return (
    <div className="flex gap-2 items-center">
      <input
        value={genPrompt}
        onChange={(e) => setGenPrompt(e.target.value)}
        placeholder="tiny wizard, pixel art..."
        className="border rounded px-3 py-2 w-full"
      />
      <Button onClick={() => onGenerate(genPrompt)}>
        Generar por prompt (IA) y pixelar
      </Button>
    </div>
  );
}

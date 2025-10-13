"use client";
import { useMemo, useState } from "react";
import PixelEditor from "@/components/PixelEditor";
import { DB16_BW, RGB332 } from "@/lib/palette";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const SIZE_PRESETS = [
  { label: "32×24", w: 32, h: 24 },
  { label: "64×48", w: 64, h: 48 },
  { label: "96×72", w: 96, h: 72 },
  { label: "256×192 (fondo)", w: 256, h: 192 },
];

export default function Page() {
  const [size, setSize] = useState({ w: 64, h: 48 });
  const [scale, setScale] = useState(12);
  const [exportScale, setExportScale] = useState(12);

  const [customPalette, setCustomPalette] = useState<string[]>(DB16_BW);
  const [picker, setPicker] = useState("#ff00ff");
  const [useRGB332, setUseRGB332] = useState(false);
  const palette = useMemo(()=> useRGB332 ? RGB332 : customPalette, [useRGB332, customPalette]);

  const minCells = Math.ceil(size.w * size.h * 0.1);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pixel Abyss — Editor</h1>

      <div className="flex flex-wrap items-center gap-2">
        {SIZE_PRESETS.map(p=>(
          <Button key={p.label}
            variant={p.w===size.w && p.h===size.h ? "default":"outline"}
            size="sm"
            onClick={()=>setSize({ w:p.w, h:p.h })}
          >{p.label}</Button>
        ))}

        <Separator orientation="vertical" className="h-6" />

        <label className="text-sm flex items-center gap-2">
          Zoom
          <input type="number" className="w-16 border rounded px-2 py-1"
            value={scale} min={6} max={24}
            onChange={(e)=>setScale(Number(e.target.value)||12)} />×
        </label>

        <label className="text-sm flex items-center gap-2">
          Export
          <input type="number" className="w-16 border rounded px-2 py-1"
            value={exportScale} min={6} max={24}
            onChange={(e)=>setExportScale(Number(e.target.value)||12)} />×
        </label>

        <Separator orientation="vertical" className="h-6" />

        <input type="color" value={picker} onChange={e=>setPicker(e.target.value)} />
        <Button size="sm" variant="secondary" onClick={()=>setCustomPalette(p=>[...p, picker])}>+ color</Button>
        <Button size="sm" variant="outline" onClick={()=>setCustomPalette(DB16_BW)}>Reset paleta</Button>

        <Separator orientation="vertical" className="h-6" />
        <Button size="sm" variant={useRGB332?"default":"outline"} onClick={()=>setUseRGB332(v=>!v)}>
          {useRGB332 ? "Paleta 256 (RGB332)" : "Paleta limitada"}
        </Button>
      </div>

      <PixelEditor
        width={size.w}
        height={size.h}
        scale={scale}
        exportScale={exportScale}
        minCells={minCells}
        palette={palette}
        advanced
      />
    </div>
  );
}

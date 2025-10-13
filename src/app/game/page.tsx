"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/store/game";
import GameCanvas from "@/components/GameCanvas";

export default function GamePage() {
  const startRun = useGame(s=>s.startRun);
  const pixels   = useGame(s=>s.player.pixels);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(()=>{ startRun(); }, [startRun]);

  // Memoriza la función para que no cambie su identidad (opcional)
  const handlePos = useCallback((tx: number, ty: number) => {
    setPos({ x: tx, y: ty });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pixel Abyss — Aventura</h1>
        <div className="flex items-center gap-4 text-sm">
          <span>Posición: <b>({pos.x}, {pos.y})</b></span>
          <span>Píxeles: <b>{pixels}</b></span>
        </div>
      </div>

      <GameCanvas onPos={handlePos} />
    </div>
  );
}


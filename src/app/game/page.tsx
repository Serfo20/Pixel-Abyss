"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/store/game";
import GameCanvas from "@/components/GameCanvas";

type EncounterInfo = { kind: string; tx: number; ty: number };

export default function GamePage() {
  const router = useRouter();
  const startRun = useGame(s => s.startRun);
  const pixels   = useGame(s => s.player.pixels);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => { startRun(); }, [startRun]);

  const handlePos = useCallback((tx: number, ty: number) => {
    setPos({ x: tx, y: ty });
  }, []);

  const handleEncounter = useCallback((info: EncounterInfo) => {
    // yo: redirijo a la página de batalla con los datos del encuentro
    const qs = new URLSearchParams({
      kind: info.kind,
      tx: String(info.tx),
      ty: String(info.ty),
    }).toString();
    router.push(`/battle?${qs}`);
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pixel Abyss — Aventura</h1>
        <div className="flex items-center gap-4 text-sm">
          <span>Posición: <b>({pos.x}, {pos.y})</b></span>
          <span>Píxeles: <b>{pixels}</b></span>
        </div>
      </div>

      {/* Mapa */}
      <GameCanvas onPos={handlePos} onEncounter={handleEncounter} />
    </div>
  );
}

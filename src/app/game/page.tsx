//game/page.tsx

"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useGame } from "@/store/game";
import GameCanvas from "@/components/GameCanvas";
import type { BattleInfo } from "@/components/battle/BattleModal";

const BattleModal = dynamic(() => import("@/components/battle/BattleModal"), { ssr: false });

type EncounterInfo = BattleInfo;

export default function GamePage() {
  const startRun = useGame(s => s.startRun);
  const pixels   = useGame(s => s.player.pixels);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [encounter, setEncounter] = useState<EncounterInfo | null>(null);

  useEffect(() => { startRun(); }, [startRun]);

  const handlePos = useCallback((tx: number, ty: number) => setPos({ x: tx, y: ty }), []);

  const handleEncounter = useCallback((info: EncounterInfo) => {
    setEncounter(info);
  }, []);

  const endBattleAndRepositionEnemy = useCallback(() => {
    try { sessionStorage.setItem("afterBattle", "1"); } catch {}
    window.dispatchEvent(new CustomEvent("afterbattle")); // avisa al canvas
    setEncounter(null);
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

      <GameCanvas onPos={handlePos} onEncounter={handleEncounter} />

      {encounter && (
        <BattleModal info={encounter} onClose={endBattleAndRepositionEnemy} />
      )}
    </div>
  );
}

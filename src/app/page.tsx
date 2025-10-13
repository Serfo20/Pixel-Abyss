"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useGame } from "@/store/game";
import GameCanvas from "@/components/GameCanvas";

type EncounterInfo = { kind: string; tx: number; ty: number };

export default function GamePage() {
  const startRun = useGame(s => s.startRun);
  const pixels   = useGame(s => s.player.pixels);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [encounter, setEncounter] = useState<EncounterInfo | null>(null);

  useEffect(() => { startRun(); }, [startRun]);

  const handlePos = useCallback((tx: number, ty: number) => {
    setPos({ x: tx, y: ty });
  }, []);

  const handleEncounter = useCallback((info: EncounterInfo) => {
    setEncounter(info);
  }, []);

  const closeEncounter = () => setEncounter(null);

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

      {/* Acciones */}
      <div className="flex gap-2">
        <Button onClick={() => startRun()}>Nueva partida</Button>
        <Link className="underline" href="/">Abrir editor</Link>
      </div>

      <p className="text-sm text-muted-foreground">
        Muévete con WASD/Flechas. Entra en la misma celda del cuadrado rojo para iniciar un encuentro.
      </p>

      {/* Modal de batalla */}
      {encounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeEncounter} />
          {/* Card */}
          <div className="relative w-full max-w-md mx-4 rounded-xl border bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-2">¡Encuentro!</h2>
            <p className="text-sm mb-4">
              Te has encontrado con un <b>{encounter.kind}</b> en la celda{" "}
              <code>({encounter.tx}, {encounter.ty})</code>.
            </p>
            <div className="rounded-md border p-4 mb-4 text-sm">
              Esta es la <b>ventana de batalla</b> (placeholder). Aquí irán animaciones y acciones.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeEncounter}>Huir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

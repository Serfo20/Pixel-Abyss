"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Enemy = { kind: string; hp: number };

export default function BattlePage() {
  const router = useRouter();
  const sp = useSearchParams();

  const enemyInit: Enemy = useMemo(() => {
    const kind = sp.get("kind") ?? "enemigo";
    return { kind, hp: 1 };
  }, [sp]);

  const tx = sp.get("tx") ?? "?";
  const ty = sp.get("ty") ?? "?";

  const [enemy, setEnemy] = useState<Enemy>(enemyInit);
  const [phase, setPhase] = useState<"intro" | "won">("intro");

  const onAttack = () => {
    setEnemy(e => ({ ...e, hp: 0 }));
    setPhase("won");
  };

    const goBackToMap = () => {
    try { sessionStorage.setItem("afterBattle", "1"); } catch {}
    // además pasamos un query explícito
    router.push("/game?after=1");
    };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-xl p-6 space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">¡Encuentro!</h1>
          <p className="text-sm">
            Celda <code>({tx}, {ty})</code> — aparece un <b>{enemy.kind}</b>.
          </p>
        </header>

        {phase === "intro" && (
          <>
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>HP enemigo</span>
                <span className="font-mono">{enemy.hp}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={goBackToMap}>Huir</Button>
              <Button onClick={onAttack}>Atacar</Button>
            </div>
          </>
        )}

        {phase === "won" && (
          <>
            <div className="rounded-md border p-4 text-sm space-y-2">
              <p><b>¡Victoria!</b> Derrotaste al {enemy.kind}.</p>
              <p>Ganaste <i>experiencia</i> y <i>ítems</i>.</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={goBackToMap}>Volver al mapa</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

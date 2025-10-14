//src/components/battle/BattleModal.tsx

"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
//sfx
import { text_sfx } from "@/lib/sfx";

export type BattleInfo = { kind: string; tx: number; ty: number };

export default function BattleModal({
  info,
  onClose,
}: {
  info: BattleInfo;
  onClose: () => void;
}) {
  // Fases: intro -> won1 -> won2
  const [phase, setPhase] = useState<"intro" | "won1" | "won2">("intro");

  const msgs = useMemo(
    () => [
      `¡Victoria! Ganaste al ${info.kind}.`,
      `Ganaste experiencia e ítems.`,
    ],
    [info.kind]
  );

  const [msgIndex, setMsgIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // --- CONTROL SÓLIDO DEL TYPEWRITER (sin carreras) ---
  const rafRef = useRef<number | null>(null);
  const typingTokenRef = useRef(0); // incrementa al iniciar un tipeo

  const CHARS_PER_SEC = 70;
  const STEP_MS = Math.max(6, 1000 / CHARS_PER_SEC);

  const stopTyping = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const startTyping = useCallback((index: number) => {
    // invalida cualquier bucle previo
    stopTyping();
    typingTokenRef.current += 1;
    const token = typingTokenRef.current;

    setMsgIndex(index);
    setVisibleChars(0);
    setIsTyping(true);

    const text = msgs[index] ?? "";
    let last = performance.now();

    const loop = (t: number) => {
      // si cambió el token, este bucle queda inválido
      if (token !== typingTokenRef.current) return;

      if (t - last >= STEP_MS) {
        last = t;
        setVisibleChars((v) => {
          // si cambió el token entre renders, aborta
          if (token !== typingTokenRef.current) return v;
          const nv = v + 1;
          if (nv >= text.length) {
            setIsTyping(false);
            return text.length;
          }
          rafRef.current = requestAnimationFrame(loop);
          return nv;
        });
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [msgs, STEP_MS]);

  useEffect(() => () => stopTyping(), []);

  // --- AVANZAR ESTADO (click o barra) ---
  const advance = useCallback(() => {
    if (isTyping) {
      // completar mensaje actual instantáneamente
      setVisibleChars((msgs[msgIndex] ?? "").length);
      setIsTyping(false);
      return;
    }

    text_sfx({ variant: 1, volume: 0.2 });

    if (phase === "intro") {
      setPhase("won1");
      startTyping(0);
      return;
    }
    if (phase === "won1") {
      setPhase("won2");
      startTyping(1);
      return;
    }
    if (phase === "won2") {
      onClose();
    }
  }, [isTyping, msgs, msgIndex, phase, startTyping, onClose]);

  // --- TECLADO en el contenedor del modal (sin listeners globales) ---
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { modalRef.current?.focus(); }, []);

  const spaceHeldRef = useRef(false);
  const onModalKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const k = e.key.toLowerCase();
    if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) {
      e.preventDefault(); e.stopPropagation(); return;
    }
    if (k === " " || e.code === "Space") {
      if (spaceHeldRef.current) return; // antirepeat
      spaceHeldRef.current = true;
      e.preventDefault(); e.stopPropagation();
      advance();
    }
    if (k === "enter") { // QoL: Enter también avanza
      e.preventDefault(); e.stopPropagation();
      advance();
    }
  };
  const onModalKeyUp: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === " " || e.code === "Space") {
      spaceHeldRef.current = false;
      e.preventDefault(); e.stopPropagation();
    }
  };

  const shownText = (msgs[msgIndex] ?? "").slice(0, visibleChars);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={modalRef}
        tabIndex={0}
        onKeyDown={onModalKeyDown}
        onKeyUp={onModalKeyUp}
        className="relative w-full max-w-md mx-4 rounded-xl border bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-xl p-6 space-y-4 outline-none"
      >
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">¡Encuentro!</h2>
          <p className="text-sm">
            Celda <code>({info.tx}, {info.ty})</code> — {info.kind}.
          </p>
        </header>

        {/* ÚNICO panel: evita “doble caja” y mantiene altura fija */}
        <div className="rounded-md border p-4 text-sm leading-6">
          {phase === "intro" ? (
            <div className="flex items-center justify-between min-h-[40px] text-base md:text-lg">
              <span>HP enemigo</span>
              <span className="font-mono">1</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap items-center font-medium m-0 min-h-[40px] text-base md:text-lg">{shownText}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={advance}>
            {phase === "intro" ? "Atacar" : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

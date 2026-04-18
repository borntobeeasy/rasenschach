import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

import { DrawingLayer } from "@/components/DrawingLayer";
import { Player } from "@/components/Player";
import { useTacticsStore } from "@/store/useTacticsStore";

type DragState = {
  playerId: string;
};

function toPercentages(element: HTMLDivElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100
  };
}

export function Pitch() {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const {
    activeTeam,
    arrows,
    createArrow,
    createZone,
    movePlayer,
    players,
    selectPlayer,
    selectedPlayerId,
    setActiveTeam,
    simulation,
    toolMode,
    zones
  } = useTacticsStore();

  const handlePitchClick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pitchRef.current || dragState) {
      return;
    }

    const nextPoint = toPercentages(pitchRef.current, event.clientX, event.clientY);

    if (toolMode === "arrow") {
      createArrow(nextPoint);
      return;
    }

    if (toolMode === "zone") {
      createZone(nextPoint);
    }
  };

  const handlePointerDown = (playerId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (toolMode === "move") {
      setDragState({ playerId });
    }

    const player = players.find((entry) => entry.id === playerId);
    if (player) {
      setActiveTeam(player.team);
    }

    selectPlayer(playerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || !pitchRef.current || toolMode !== "move") {
      return;
    }

    const next = toPercentages(pitchRef.current, event.clientX, event.clientY);
    movePlayer(dragState.playerId, next.x, next.y);
  };

  return (
    <section className="panel rounded-[28px] p-4 shadow-glow">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">Tactical Board</p>
          <h2 className="mt-1 text-2xl font-semibold">Shape the next sequence</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Simulation</p>
          <p className="text-sm font-semibold text-accent">
            {simulation.outcome} · {simulation.confidence}%
          </p>
        </div>
      </div>
      <div
        ref={pitchRef}
        className="pitch-grid relative aspect-[5/7] w-full overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-pitch-700 via-pitch-600 to-pitch-800 shadow-2xl md:aspect-[13/8]"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragState(null)}
        onPointerLeave={() => setDragState(null)}
        onPointerCancel={() => setDragState(null)}
        onPointerDown={handlePitchClick}
      >
        <div className="absolute inset-[3%] rounded-[20px] border border-white/20" />
        <div className="absolute inset-y-[3%] left-1/2 w-px -translate-x-1/2 bg-white/20" />
        <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
        <div className="absolute left-[3%] top-1/2 h-[34%] w-[14%] -translate-y-1/2 rounded-r-[18px] border border-white/20" />
        <div className="absolute right-[3%] top-1/2 h-[34%] w-[14%] -translate-y-1/2 rounded-l-[18px] border border-white/20" />
        <div className="absolute left-[3%] top-1/2 h-[15%] w-[5%] -translate-y-1/2 rounded-r-[12px] border border-white/20" />
        <div className="absolute right-[3%] top-1/2 h-[15%] w-[5%] -translate-y-1/2 rounded-l-[12px] border border-white/20" />

        <DrawingLayer arrows={arrows} zones={zones} players={players} />

        {players.map((player) => (
          <Player
            key={player.id}
            player={player}
            selected={player.id === selectedPlayerId}
            dragging={dragState?.playerId === player.id}
            onPointerDown={handlePointerDown}
            onSelect={selectPlayer}
          />
        ))}

        <div className="absolute bottom-3 left-3 rounded-full bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/65">
          Active team: {activeTeam}
        </div>
      </div>
    </section>
  );
}

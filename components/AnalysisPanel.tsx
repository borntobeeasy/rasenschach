import { useMemo } from "react";

import { useTacticsStore } from "@/store/useTacticsStore";

export function AnalysisPanel() {
  const { players, selectedPlayerId, simulation } = useTacticsStore();

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  return (
    <section className="panel rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">Analysis</p>
          <h3 className="mt-1 text-lg font-semibold">Read the position</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-accent">
          {simulation.confidence}% edge
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white/90">{simulation.outcome}</p>
        <p className="mt-2 text-sm text-white/60">
          {selectedPlayer
            ? `${selectedPlayer.role} is selected and ready to anchor the next action.`
            : "Select a player to inspect the current move platform."}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Strengths</p>
          <div className="mt-3 space-y-2">
            {simulation.strengths.map((item) => (
              <p
                key={item}
                className="rounded-2xl border border-accent/15 bg-accent/10 px-4 py-3 text-sm text-white/80"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Weaknesses</p>
          <div className="mt-3 space-y-2">
            {simulation.weaknesses.map((item) => (
              <p
                key={item}
                className="rounded-2xl border border-coral/15 bg-coral/10 px-4 py-3 text-sm text-white/80"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Notes</p>
        <div className="mt-3 space-y-2">
          {simulation.notes.map((note) => (
            <p key={note} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
              {note}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

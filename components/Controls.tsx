import type { ChangeEvent } from "react";

import { useTacticsStore } from "@/store/useTacticsStore";
import { formations } from "@/utils/formations";

type ControlsProps = {
  shareUrl: string;
  onShare: () => void;
};

const toolLabels = [
  { value: "move", label: "Move" },
  { value: "arrow", label: "Arrow" },
  { value: "zone", label: "Zone" }
] as const;

export function Controls({ shareUrl, onShare }: ControlsProps) {
  const {
    activeTeam,
    applyFormation,
    clearDrawings,
    deleteTactic,
    formation,
    future,
    loadTactic,
    name,
    past,
    redo,
    rename,
    resetBoard,
    saveTactic,
    savedTactics,
    setActiveTeam,
    setToolMode,
    toolMode,
    undo
  } = useTacticsStore();

  return (
    <aside className="space-y-4">
      <section className="panel rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-white/45">Control Room</p>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-white/70">Scenario name</span>
            <input
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => rename(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
              placeholder="Pressing trap left side"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {toolLabels.map((tool) => (
              <button
                key={tool.value}
                type="button"
                onClick={() => setToolMode(tool.value)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  toolMode === tool.value
                    ? "bg-accent text-surface"
                    : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTeam("home")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                activeTeam === "home"
                  ? "bg-accent text-surface"
                  : "border border-white/10 bg-white/5 text-white/75"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTeam("away")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                activeTeam === "away"
                  ? "bg-cyan text-surface"
                  : "border border-white/10 bg-white/5 text-white/75"
              }`}
            >
              Away
            </button>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm text-white/70">Formation preset</span>
            <select
              value={formation}
              onChange={(event) => applyFormation(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              {Object.entries(formations).map(([key, value]) => (
                <option key={key} value={key}>
                  {key} · {value.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!past.length}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!future.length}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Redo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clearDrawings}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
            >
              Clear layer
            </button>
            <button
              type="button"
              onClick={resetBoard}
              className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="panel rounded-[24px] p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Save & Share</p>
          <button
            type="button"
            onClick={saveTactic}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-surface"
          >
            Save
          </button>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85"
        >
          Generate share link
        </button>
        <input
          readOnly
          value={shareUrl}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60 outline-none"
          placeholder="Share URL appears here"
        />
        <div className="mt-4 space-y-2">
          {savedTactics.length ? (
            savedTactics.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-xs text-white/45">
                      {new Date(entry.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadTactic(entry.id)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTactic(entry.id)}
                      className="rounded-full border border-coral/20 px-3 py-1 text-xs text-coral"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/45">
              No saved tactics yet. Create one once the shape feels right.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}

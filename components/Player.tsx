import clsx from "clsx";
import type { PointerEvent } from "react";

import { PlayerModel } from "@/types/tactics";

type PlayerProps = {
  player: PlayerModel;
  selected: boolean;
  dragging: boolean;
  onPointerDown: (playerId: string, event: PointerEvent<HTMLButtonElement>) => void;
  onSelect: (playerId: string) => void;
};

export function Player({ player, selected, dragging, onPointerDown, onSelect }: PlayerProps) {
  const palette =
    player.team === "home"
      ? "border-accent/40 bg-accent text-surface"
      : "border-cyan/40 bg-cyan text-surface";

  return (
    <button
      type="button"
      className={clsx(
        "absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-semibold shadow-lg transition duration-150",
        palette,
        selected && "scale-110 ring-4 ring-white/15",
        dragging && "cursor-grabbing"
      )}
      style={{ left: `${player.x}%`, top: `${player.y}%` }}
      onClick={() => onSelect(player.id)}
      onPointerDown={(event) => onPointerDown(player.id, event)}
    >
      <span className="flex flex-col leading-none">
        <span>{player.role}</span>
        <span className="mt-1 text-[8px] opacity-70">{player.team === "home" ? "Home" : "Away"}</span>
      </span>
    </button>
  );
}

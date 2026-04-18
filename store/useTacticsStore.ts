import { create } from "zustand";

import {
  ArrowModel,
  PlayerModel,
  SavedTactic,
  SimulationResult,
  TacticSnapshot,
  Team,
  ToolMode,
  ZoneModel
} from "@/types/tactics";
import { createPlayersForFormation } from "@/utils/formations";
import { evaluateSimulation } from "@/utils/simulation";

type HistoryState = {
  past: TacticSnapshot[];
  future: TacticSnapshot[];
};

type TacticsState = TacticSnapshot &
  HistoryState & {
    arrows: ArrowModel[];
    zones: ZoneModel[];
    players: PlayerModel[];
    pendingArrowFromId: string | null;
    simulation: SimulationResult;
    savedTactics: SavedTactic[];
    setToolMode: (mode: ToolMode) => void;
    setActiveTeam: (team: Team) => void;
    selectPlayer: (playerId: string | null) => void;
    movePlayer: (playerId: string, x: number, y: number) => void;
    createArrow: (to: { x: number; y: number }) => void;
    createZone: (position: { x: number; y: number }) => void;
    resetBoard: () => void;
    applyFormation: (formation: string) => void;
    saveTactic: () => void;
    loadTactic: (id: string) => void;
    deleteTactic: (id: string) => void;
    rename: (name: string) => void;
    undo: () => void;
    redo: () => void;
    hydrate: (snapshot: TacticSnapshot) => void;
    clearDrawings: () => void;
  };

const HOME_FORMATION = "4-3-3";
const AWAY_FORMATION = "4-4-2";
const STORAGE_KEY = "rasenschach-saves";

const uid = () => Math.random().toString(36).slice(2, 10);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createInitialSnapshot(): TacticSnapshot {
  return {
    players: [
      ...createPlayersForFormation(HOME_FORMATION, "home"),
      ...createPlayersForFormation(AWAY_FORMATION, "away")
    ],
    arrows: [],
    zones: [],
    selectedPlayerId: "home-10",
    activeTeam: "home",
    toolMode: "move",
    formation: HOME_FORMATION,
    name: "Training Ground"
  };
}

function snapshotFromState(state: TacticsState): TacticSnapshot {
  return {
    players: state.players,
    arrows: state.arrows,
    zones: state.zones,
    selectedPlayerId: state.selectedPlayerId,
    activeTeam: state.activeTeam,
    toolMode: state.toolMode,
    formation: state.formation,
    name: state.name
  };
}

function readSavedTactics(): SavedTactic[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedTactic[];
  } catch {
    return [];
  }
}

function persistSavedTactics(savedTactics: SavedTactic[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTactics));
  }
}

function recompute(
  partial: Partial<TacticsState> & Pick<TacticsState, "players" | "arrows" | "zones" | "activeTeam">
) {
  return {
    ...partial,
    simulation: evaluateSimulation({
      players: partial.players,
      arrows: partial.arrows,
      zones: partial.zones,
      activeTeam: partial.activeTeam
    })
  };
}

export const useTacticsStore = create<TacticsState>((set) => {
  const initialSnapshot = createInitialSnapshot();

  return {
    ...initialSnapshot,
    past: [],
    future: [],
    pendingArrowFromId: null,
    simulation: evaluateSimulation({
      players: initialSnapshot.players,
      arrows: initialSnapshot.arrows,
      zones: initialSnapshot.zones,
      activeTeam: initialSnapshot.activeTeam
    }),
    savedTactics: [],
    setToolMode: (toolMode) =>
      set((state) => ({
        toolMode,
        pendingArrowFromId: toolMode === "arrow" ? state.selectedPlayerId : null
      })),
    setActiveTeam: (activeTeam) =>
      set((state) => recompute({ ...state, activeTeam }) as TacticsState),
    selectPlayer: (selectedPlayerId) =>
      set((state) => ({
        selectedPlayerId,
        pendingArrowFromId: state.toolMode === "arrow" ? selectedPlayerId : state.pendingArrowFromId
      })),
    movePlayer: (playerId, x, y) =>
      set((state) => {
        const current = snapshotFromState(state);
        const players = state.players.map((player) =>
          player.id === playerId ? { ...player, x: clamp(x, 4, 96), y: clamp(y, 6, 94) } : player
        );

        return recompute({
          ...state,
          players,
          past: [...state.past, current],
          future: []
        }) as TacticsState;
      }),
    createArrow: (to) =>
      set((state) => {
        if (!state.pendingArrowFromId) {
          return state;
        }

        const origin = state.players.find((player) => player.id === state.pendingArrowFromId);
        if (!origin) {
          return state;
        }

        const current = snapshotFromState(state);
        const arrows: ArrowModel[] = [
          ...state.arrows,
          {
            id: uid(),
            team: origin.team,
            fromPlayerId: origin.id,
            to,
            kind: "pass"
          }
        ];

        return recompute({
          ...state,
          arrows,
          past: [...state.past, current],
          future: [],
          pendingArrowFromId: state.selectedPlayerId
        }) as TacticsState;
      }),
    createZone: (position) =>
      set((state) => {
        const current = snapshotFromState(state);
        const zones = [
          ...state.zones,
          {
            id: uid(),
            team: state.activeTeam,
            x: clamp(position.x - 8, 6, 82),
            y: clamp(position.y - 10, 6, 78),
            width: 16,
            height: 20
          }
        ];

        return recompute({
          ...state,
          zones,
          past: [...state.past, current],
          future: []
        }) as TacticsState;
      }),
    resetBoard: () => {
      const snapshot = createInitialSnapshot();
      set((state) => ({
        ...state,
        ...snapshot,
        past: [...state.past, snapshotFromState(state)],
        future: [],
        pendingArrowFromId: null,
        simulation: evaluateSimulation({
          players: snapshot.players,
          arrows: snapshot.arrows,
          zones: snapshot.zones,
          activeTeam: snapshot.activeTeam
        })
      }));
    },
    applyFormation: (formation) =>
      set((state) => {
        const current = snapshotFromState(state);
        const home = createPlayersForFormation(formation, "home");
        const away = createPlayersForFormation(AWAY_FORMATION, "away");
        return recompute({
          ...state,
          formation,
          players: [...home, ...away],
          arrows: [],
          zones: [],
          selectedPlayerId: home[9]?.id ?? null,
          pendingArrowFromId: null,
          past: [...state.past, current],
          future: []
        }) as TacticsState;
      }),
    saveTactic: () =>
      set((state) => {
        const savedTactics = [
          {
            id: uid(),
            name: state.name || `Tactic ${state.savedTactics.length + 1}`,
            createdAt: new Date().toISOString(),
            snapshot: snapshotFromState(state)
          },
          ...state.savedTactics
        ].slice(0, 8);
        persistSavedTactics(savedTactics);
        return { savedTactics };
      }),
    loadTactic: (id) =>
      set((state) => {
        const selected = state.savedTactics.find((entry) => entry.id === id);
        if (!selected) {
          return state;
        }
        return {
          ...state,
          ...selected.snapshot,
          pendingArrowFromId: null,
          past: [...state.past, snapshotFromState(state)],
          future: [],
          simulation: evaluateSimulation({
            players: selected.snapshot.players,
            arrows: selected.snapshot.arrows,
            zones: selected.snapshot.zones,
            activeTeam: selected.snapshot.activeTeam
          })
        };
      }),
    deleteTactic: (id) =>
      set((state) => {
        const savedTactics = state.savedTactics.filter((entry) => entry.id !== id);
        persistSavedTactics(savedTactics);
        return { savedTactics };
      }),
    rename: (name) => set(() => ({ name })),
    undo: () =>
      set((state) => {
        const previous = state.past[state.past.length - 1];
        if (!previous) {
          return state;
        }
        return {
          ...state,
          ...previous,
          past: state.past.slice(0, -1),
          future: [snapshotFromState(state), ...state.future],
          pendingArrowFromId: null,
          simulation: evaluateSimulation({
            players: previous.players,
            arrows: previous.arrows,
            zones: previous.zones,
            activeTeam: previous.activeTeam
          })
        };
      }),
    redo: () =>
      set((state) => {
        const next = state.future[0];
        if (!next) {
          return state;
        }
        return {
          ...state,
          ...next,
          past: [...state.past, snapshotFromState(state)],
          future: state.future.slice(1),
          pendingArrowFromId: null,
          simulation: evaluateSimulation({
            players: next.players,
            arrows: next.arrows,
            zones: next.zones,
            activeTeam: next.activeTeam
          })
        };
      }),
    hydrate: (snapshot) =>
      set((state) => ({
        ...state,
        ...snapshot,
        pendingArrowFromId: null,
        simulation: evaluateSimulation({
          players: snapshot.players,
          arrows: snapshot.arrows,
          zones: snapshot.zones,
          activeTeam: snapshot.activeTeam
        }),
        savedTactics: readSavedTactics()
      })),
    clearDrawings: () =>
      set((state) => {
        const current = snapshotFromState(state);
        return recompute({
          ...state,
          arrows: [],
          zones: [],
          past: [...state.past, current],
          future: []
        }) as TacticsState;
      })
  };
});

if (typeof window !== "undefined") {
  useTacticsStore.setState({ savedTactics: readSavedTactics() });
}

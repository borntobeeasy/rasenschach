export type Team = "home" | "away";
export type ToolMode = "move" | "arrow" | "zone";

export type Point = {
  x: number;
  y: number;
};

export type Role =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "DM"
  | "CM"
  | "AM"
  | "LW"
  | "RW"
  | "ST";

export type PlayerModel = {
  id: string;
  team: Team;
  label: string;
  role: Role;
  x: number;
  y: number;
};

export type ArrowModel = {
  id: string;
  team: Team;
  fromPlayerId: string;
  to: Point;
  kind: "pass" | "run";
};

export type ZoneModel = {
  id: string;
  team: Team;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TacticSnapshot = {
  players: PlayerModel[];
  arrows: ArrowModel[];
  zones: ZoneModel[];
  selectedPlayerId: string | null;
  activeTeam: Team;
  toolMode: ToolMode;
  formation: string;
  name: string;
};

export type SavedTactic = {
  id: string;
  name: string;
  createdAt: string;
  snapshot: TacticSnapshot;
};

export type SimulationResult = {
  outcome: string;
  confidence: number;
  notes: string[];
  strengths: string[];
  weaknesses: string[];
};

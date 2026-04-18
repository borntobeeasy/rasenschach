import { PlayerModel, Team } from "@/types/tactics";

type FormationDefinition = {
  label: string;
  layout: Array<{ role: PlayerModel["role"]; x: number; y: number }>;
};

export const formations: Record<string, FormationDefinition> = {
  "4-3-3": {
    label: "4-3-3 Control",
    layout: [
      { role: "GK", x: 8, y: 50 },
      { role: "LB", x: 22, y: 16 },
      { role: "CB", x: 18, y: 38 },
      { role: "CB", x: 18, y: 62 },
      { role: "RB", x: 22, y: 84 },
      { role: "DM", x: 34, y: 50 },
      { role: "CM", x: 46, y: 32 },
      { role: "CM", x: 46, y: 68 },
      { role: "LW", x: 64, y: 18 },
      { role: "ST", x: 71, y: 50 },
      { role: "RW", x: 64, y: 82 }
    ]
  },
  "3-2-4-1": {
    label: "3-2-4-1 Box",
    layout: [
      { role: "GK", x: 8, y: 50 },
      { role: "CB", x: 18, y: 28 },
      { role: "CB", x: 15, y: 50 },
      { role: "CB", x: 18, y: 72 },
      { role: "DM", x: 30, y: 40 },
      { role: "DM", x: 30, y: 60 },
      { role: "LW", x: 48, y: 16 },
      { role: "AM", x: 49, y: 40 },
      { role: "AM", x: 49, y: 60 },
      { role: "RW", x: 48, y: 84 },
      { role: "ST", x: 70, y: 50 }
    ]
  },
  "4-4-2": {
    label: "4-4-2 Compact",
    layout: [
      { role: "GK", x: 8, y: 50 },
      { role: "LB", x: 22, y: 16 },
      { role: "CB", x: 18, y: 38 },
      { role: "CB", x: 18, y: 62 },
      { role: "RB", x: 22, y: 84 },
      { role: "LW", x: 38, y: 20 },
      { role: "CM", x: 37, y: 40 },
      { role: "CM", x: 37, y: 60 },
      { role: "RW", x: 38, y: 80 },
      { role: "ST", x: 60, y: 42 },
      { role: "ST", x: 60, y: 58 }
    ]
  }
};

const suffixForTeam = (team: Team) => (team === "home" ? "A" : "B");
const mirrorX = (x: number) => 100 - x;

export function createPlayersForFormation(formationKey: string, team: Team): PlayerModel[] {
  const formation = formations[formationKey] ?? formations["4-3-3"];

  return formation.layout.map((slot, index) => ({
    id: `${team}-${index + 1}`,
    team,
    role: slot.role,
    label: `${slot.role}${suffixForTeam(team)}${index + 1}`,
    x: team === "home" ? slot.x : mirrorX(slot.x),
    y: slot.y
  }));
}

import { ArrowModel, PlayerModel, SimulationResult, Team, ZoneModel } from "@/types/tactics";

type EvaluateParams = {
  players: PlayerModel[];
  arrows: ArrowModel[];
  zones: ZoneModel[];
  activeTeam: Team;
};

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function countCentralOccupancy(players: PlayerModel[], team: Team) {
  return players.filter(
    (player) =>
      player.team === team && player.x >= 38 && player.x <= 72 && player.y >= 30 && player.y <= 70
  ).length;
}

function countFinalThird(players: PlayerModel[], team: Team) {
  return players.filter((player) => player.team === team && (team === "home" ? player.x >= 67 : player.x <= 33))
    .length;
}

function passingLaneRisk(arrow: ArrowModel, players: PlayerModel[]) {
  const origin = players.find((player) => player.id === arrow.fromPlayerId);
  if (!origin) {
    return 0;
  }

  const opponents = players.filter((player) => player.team !== origin.team);
  const laneLength = distance(origin, arrow.to);

  return opponents.reduce((score, opponent) => {
    const laneDistance =
      Math.abs(
        (arrow.to.y - origin.y) * opponent.x -
          (arrow.to.x - origin.x) * opponent.y +
          arrow.to.x * origin.y -
          arrow.to.y * origin.x
      ) / Math.max(laneLength, 1);

    const withinSegment =
      opponent.x >= Math.min(origin.x, arrow.to.x) - 3 &&
      opponent.x <= Math.max(origin.x, arrow.to.x) + 3 &&
      opponent.y >= Math.min(origin.y, arrow.to.y) - 3 &&
      opponent.y <= Math.max(origin.y, arrow.to.y) + 3;

    return score + (withinSegment && laneDistance < 5 ? 1 : 0);
  }, 0);
}

export function evaluateSimulation({
  players,
  arrows,
  zones,
  activeTeam
}: EvaluateParams): SimulationResult {
  const ownPlayers = players.filter((player) => player.team === activeTeam);
  const centralControl = countCentralOccupancy(players, activeTeam);
  const finalThirdPresence = countFinalThird(players, activeTeam);
  const supportDistances = ownPlayers.map((player) => {
    const teammates = ownPlayers.filter((mate) => mate.id !== player.id);
    return Math.min(...teammates.map((mate) => distance(player, mate)));
  });
  const spacingScore = Math.max(0, 100 - average(supportDistances) * 2.1);
  const laneRisk = average(arrows.map((arrow) => passingLaneRisk(arrow, players)));
  const zoneAdvantage = zones.filter((zone) => zone.team === activeTeam).length * 7;

  const rawScore = spacingScore + centralControl * 9 + finalThirdPresence * 8 + zoneAdvantage - laneRisk * 12;
  const confidence = Math.max(18, Math.min(93, Math.round(rawScore)));

  let outcome = "Balanced circulation";
  if (confidence >= 75) {
    outcome = laneRisk > 1.1 ? "Dangerous attack with interception risk" : "High-value chance creation";
  } else if (confidence <= 42) {
    outcome = laneRisk > 1 ? "Likely interception" : "Low-threat possession";
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const notes: string[] = [];

  if (centralControl >= 4) strengths.push("Strong central occupation between the lines");
  if (finalThirdPresence >= 3) strengths.push("Multiple players threaten the final third");
  if (zoneAdvantage > 0) strengths.push("Marked zones reinforce the intended attack space");
  if (spacingScore > 62) strengths.push("Good support distances for combinations");

  if (laneRisk >= 1.2) weaknesses.push("Passing lane is crowded by defenders");
  if (finalThirdPresence <= 1) weaknesses.push("Too few runners ahead of the ball");
  if (spacingScore < 46) weaknesses.push("Players are either too flat or disconnected");
  if (!arrows.length) weaknesses.push("No programmed actions to destabilize the block");

  notes.push(`${centralControl} central players are available for progression.`);
  notes.push(`${finalThirdPresence} players attack the last third.`);
  notes.push(`${Math.round(laneRisk * 10) / 10} average blockers are close to the active passing lanes.`);

  return {
    outcome,
    confidence,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    notes
  };
}

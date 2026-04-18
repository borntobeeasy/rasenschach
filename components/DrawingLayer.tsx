import { ArrowModel, PlayerModel, ZoneModel } from "@/types/tactics";

type DrawingLayerProps = {
  arrows: ArrowModel[];
  zones: ZoneModel[];
  players: PlayerModel[];
};

export function DrawingLayer({ arrows, zones, players }: DrawingLayerProps) {
  return (
    <>
      {zones.map((zone) => (
        <div
          key={zone.id}
          className="absolute rounded-3xl border border-dashed"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
            backgroundColor: zone.team === "home" ? "rgba(217,255,102,0.12)" : "rgba(98,210,255,0.12)",
            borderColor: zone.team === "home" ? "rgba(217,255,102,0.6)" : "rgba(98,210,255,0.55)"
          }}
        />
      ))}
      <svg className="absolute inset-0 z-10 h-full w-full overflow-visible">
        <defs>
          <marker id="arrowhead-home" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="#d9ff66" />
          </marker>
          <marker id="arrowhead-away" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="#62d2ff" />
          </marker>
        </defs>
        {arrows.map((arrow) => {
          const origin = players.find((player) => player.id === arrow.fromPlayerId);
          if (!origin) return null;

          return (
            <line
              key={arrow.id}
              x1={`${origin.x}%`}
              y1={`${origin.y}%`}
              x2={`${arrow.to.x}%`}
              y2={`${arrow.to.y}%`}
              stroke={arrow.team === "home" ? "#d9ff66" : "#62d2ff"}
              strokeWidth="2.4"
              strokeDasharray="8 6"
              markerEnd={`url(#${arrow.team === "home" ? "arrowhead-home" : "arrowhead-away"})`}
              opacity="0.9"
            />
          );
        })}
      </svg>
    </>
  );
}

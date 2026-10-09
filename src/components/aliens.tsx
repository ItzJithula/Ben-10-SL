/**
 * The classic Omnitrix roster.
 *
 * Every alien is drawn as a flat, single-colour silhouette out of primitive
 * shapes (this file is the only place the geometry lives). Shapes tagged with
 * `cut` punch a hole in the silhouette — eyes, visors, mouths — so the icons
 * stay readable at 24px on the watch dial and at 300px on the hero.
 *
 * Keeping the art as data (instead of hand-written JSX) means the exact same
 * geometry can be rendered anywhere, and a build-time script can rasterise it
 * to check how it looks.
 */

export type AlienShape =
  | { t: "path"; d: string; cut?: boolean }
  | { t: "circle"; cx: number; cy: number; r: number; cut?: boolean }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number; rot?: number; cut?: boolean }
  | { t: "poly"; points: number[]; cut?: boolean }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number; cut?: boolean };

export interface Alien {
  id: string;
  /** Display name on the dial. */
  name: string;
  /** Home world species, shown under the name in the transformed state. */
  species: string;
  /** Short power blurb for the transformed state. */
  powers: string;
  /** Accent colour used in the transformed state. */
  accent: string;
  shapes: AlienShape[];
}

export const ALIENS: Alien[] = [
  {
    id: "heatblast",
    name: "Heatblast",
    species: "Pyronite",
    powers: "Fire blasts, flight and melting heat.",
    accent: "#ff7a00",
    shapes: [
      { t: "poly", points: [15, 40, 21, 16, 27, 30, 32, 8, 37, 30, 43, 16, 49, 40] },
      { t: "path", d: "M15 38 h34 a4 4 0 0 1 4 4 v6 a10 10 0 0 1 -10 10 h-22 a10 10 0 0 1 -10 -10 v-6 a4 4 0 0 1 4 -4 z" },
      { t: "circle", cx: 25, cy: 46, r: 3.4, cut: true },
      { t: "circle", cx: 39, cy: 46, r: 3.4, cut: true },
    ],
  },
  {
    id: "wildmutt",
    name: "Wildmutt",
    species: "Vulpimancer",
    powers: "Super senses, claws and raw strength.",
    accent: "#ff3b3b",
    shapes: [
      { t: "poly", points: [14, 30, 8, 12, 24, 22] },
      { t: "poly", points: [50, 30, 56, 12, 40, 22] },
      { t: "path", d: "M18 30 h28 a6 6 0 0 1 6 6 v10 a12 12 0 0 1 -12 12 h-16 a12 12 0 0 1 -12 -12 v-10 a6 6 0 0 1 6 -6 z" },
      { t: "path", d: "M20 48 h24 v3 h-24 z", cut: true },
      { t: "poly", points: [22, 48, 24, 54, 26, 48], cut: true },
      { t: "poly", points: [30, 48, 32, 54, 34, 48], cut: true },
      { t: "poly", points: [38, 48, 40, 54, 42, 48], cut: true },
    ],
  },
  {
    id: "diamondhead",
    name: "Diamondhead",
    species: "Petrosapien",
    powers: "Crystal shards and bullet-proof armour.",
    accent: "#00e5ff",
    shapes: [
      { t: "poly", points: [32, 2, 42, 20, 32, 34, 22, 20] },
      { t: "poly", points: [8, 58, 18, 30, 28, 44, 32, 36, 36, 44, 46, 30, 56, 58] },
      { t: "poly", points: [20, 52, 30, 44, 32, 58], cut: true },
      { t: "poly", points: [44, 52, 34, 44, 32, 58], cut: true },
    ],
  },
  {
    id: "xlr8",
    name: "XLR8",
    species: "Kineceleran",
    powers: "300 mph sprint and tornado spins.",
    accent: "#39ff14",
    shapes: [
      { t: "poly", points: [32, 4, 42, 26, 22, 26] },
      { t: "ellipse", cx: 32, cy: 38, rx: 16, ry: 15 },
      { t: "ellipse", cx: 32, cy: 36, rx: 13, ry: 4.5, cut: true },
      { t: "poly", points: [18, 44, 24, 56, 12, 56] },
      { t: "poly", points: [46, 44, 52, 56, 40, 56] },
    ],
  },
  {
    id: "grey-matter",
    name: "Grey Matter",
    species: "Galvan",
    powers: "Genius intellect and tiny size.",
    accent: "#aaff7d",
    shapes: [
      { t: "ellipse", cx: 32, cy: 56, rx: 11, ry: 6 },
      { t: "ellipse", cx: 32, cy: 32, rx: 21, ry: 17 },
      { t: "circle", cx: 22, cy: 16, r: 7 },
      { t: "circle", cx: 42, cy: 16, r: 7 },
      { t: "circle", cx: 22, cy: 16, r: 4, cut: true },
      { t: "circle", cx: 42, cy: 16, r: 4, cut: true },
      { t: "path", d: "M20 34 h24 a6 6 0 0 1 0 4 h-24 a6 6 0 0 1 0 -4 z", cut: true },
    ],
  },
  {
    id: "four-arms",
    name: "Four Arms",
    species: "Tetramand",
    powers: "Four fists and shockwave claps.",
    accent: "#ff2e88",
    shapes: [
      { t: "poly", points: [8, 34, 16, 18, 22, 24, 16, 40] },
      { t: "poly", points: [56, 34, 48, 18, 42, 24, 48, 40] },
      { t: "poly", points: [4, 50, 14, 42, 18, 50, 8, 58] },
      { t: "poly", points: [60, 50, 50, 42, 46, 50, 56, 58] },
      { t: "path", d: "M26 8 h12 a6 6 0 0 1 6 6 v8 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 v-8 a6 6 0 0 1 6 -6 z" },
      { t: "poly", points: [16, 36, 48, 36, 52, 60, 12, 60] },
      { t: "poly", points: [22, 40, 28, 40, 28, 52, 22, 52], cut: true },
      { t: "poly", points: [42, 40, 36, 40, 36, 52, 42, 52], cut: true },
    ],
  },
  {
    id: "stinkfly",
    name: "Stinkfly",
    species: "Lepidopterran",
    powers: "Flight, goo and stink gas.",
    accent: "#ffc400",
    shapes: [
      { t: "ellipse", cx: 16, cy: 26, rx: 12, ry: 5, rot: -30 },
      { t: "ellipse", cx: 48, cy: 26, rx: 12, ry: 5, rot: 30 },
      { t: "ellipse", cx: 13, cy: 38, rx: 11, ry: 4, rot: -8 },
      { t: "ellipse", cx: 51, cy: 38, rx: 11, ry: 4, rot: 8 },
      { t: "poly", points: [29, 52, 35, 52, 32, 62] },
      { t: "ellipse", cx: 32, cy: 40, rx: 9, ry: 15 },
      { t: "ellipse", cx: 32, cy: 19, rx: 11, ry: 10 },
      { t: "circle", cx: 26, cy: 17, r: 3.6, cut: true },
      { t: "circle", cx: 38, cy: 17, r: 3.6, cut: true },
    ],
  },
  {
    id: "ripjaws",
    name: "Ripjaws",
    species: "Piscciss Volann",
    powers: "Deep-sea swimming and crushing jaws.",
    accent: "#00e5ff",
    shapes: [
      { t: "circle", cx: 32, cy: 5, r: 4 },
      { t: "line", x1: 32, y1: 9, x2: 32, y2: 20, w: 2 },
      { t: "poly", points: [10, 34, 30, 22, 56, 26, 56, 44, 30, 58, 10, 44] },
      { t: "poly", points: [12, 44, 56, 44, 50, 56, 22, 56], cut: true },
      { t: "circle", cx: 24, cy: 34, r: 4.5, cut: true },
      { t: "poly", points: [6, 34, 14, 30, 14, 38], cut: true },
    ],
  },
  {
    id: "upgrade",
    name: "Upgrade",
    species: "Galvanic Mechamorph",
    powers: "Merges with and upgrades any machine.",
    accent: "#7dff3d",
    shapes: [
      { t: "path", d: "M32 4 a22 20 0 0 1 22 20 v16 a10 10 0 0 1 -10 10 h-24 a10 10 0 0 1 -10 -10 v-16 a22 20 0 0 1 22 -20 z" },
      { t: "ellipse", cx: 32, cy: 28, rx: 10, ry: 8, cut: true },
      { t: "path", d: "M14 44 h36 v2 h-36 z", cut: true },
      { t: "path", d: "M20 50 h24 v2 h-24 z", cut: true },
      { t: "poly", points: [26, 4, 30, 4, 30, 12, 26, 12], cut: true },
      { t: "poly", points: [34, 4, 38, 4, 38, 12, 34, 12], cut: true },
    ],
  },
  {
    id: "ghostfreak",
    name: "Ghostfreak",
    species: "Ectonurite",
    powers: "Invisibility, phasing and possession.",
    accent: "#b026ff",
    shapes: [
      { t: "poly", points: [20, 14, 25, 2, 29, 12, 32, 0, 35, 12, 39, 2, 44, 14] },
      { t: "path", d: "M32 8 L50 24 L54 60 L10 60 L14 24 Z" },
      { t: "circle", cx: 32, cy: 32, r: 6, cut: true },
      { t: "poly", points: [8, 46, 16, 38, 20, 44, 12, 54] },
      { t: "poly", points: [56, 46, 48, 38, 44, 44, 52, 54] },
    ],
  },
];

export function alienById(id: string): Alien | undefined {
  return ALIENS.find((alien) => alien.id === id);
}

/* ------------------------------------------------------------------ */
/* React rendering                                                     */
/* ------------------------------------------------------------------ */

type ShapeProps = { cut: boolean; accent: string };

function Shape({ shape, cut, accent }: { shape: AlienShape } & ShapeProps) {
  const fill = cut ? "rgba(2,6,3,0.62)" : accent;
  switch (shape.t) {
    case "path":
      return <path d={shape.d} fill={fill} />;
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={fill} />;
    case "ellipse":
      return (
        <ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={fill}
          transform={shape.rot ? `rotate(${shape.rot} ${shape.cx} ${shape.cy})` : undefined}
        />
      );
    case "poly":
      return <polygon points={shape.points.join(" ")} fill={fill} />;
    case "line":
      return (
        <line
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          stroke={fill}
          strokeWidth={shape.w}
          strokeLinecap="round"
        />
      );
  }
}

/**
 * One alien drawn on a 64×64 grid.
 *
 * `accent` overrides the alien's own colour (the watch dial paints every alien
 * in Omnitrix green, the transformed state uses the alien's real colour).
 */
export function AlienSilhouette({
  alien,
  accent,
  className,
}: {
  alien: Alien;
  accent?: string;
  className?: string;
}) {
  const colour = accent ?? alien.accent;
  return (
    <g className={className}>
      {alien.shapes.map((shape, index) => (
        <Shape key={index} shape={shape} cut={shape.cut === true} accent={colour} />
      ))}
    </g>
  );
}

/** Stand-alone alien icon (own svg canvas) — used in cards, lists and buttons. */
export function AlienIcon({
  alien,
  size = 32,
  accent,
  className,
  title,
}: {
  alien: Alien;
  size?: number;
  accent?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <AlienSilhouette alien={alien} accent={accent} />
    </svg>
  );
}

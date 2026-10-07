import { RevealGroup, RevealItem } from "./Reveal";

/**
 * Ben 10 flavour section — the Omnitrix roster.
 * Alien names stay exactly as they are in the show, with short English notes.
 */
const ALIENS = [
  { name: "Heatblast", role: "Pyronite", power: "Throws fire and heat blasts", color: "#FF7A00" },
  { name: "XLR8", role: "Kineceleran", power: "Moves at lightning speed", color: "#00E5FF" },
  { name: "Four Arms", role: "Tetramand", power: "Crushing brute strength", color: "#FF2E88" },
  { name: "Diamondhead", role: "Petrosapien", power: "Diamond-hard armour", color: "#7DDAFF" },
  { name: "Upgrade", role: "Galvanic Mechamorph", power: "Merges with any machine", color: "#39FF14" },
  { name: "Ghostfreak", role: "Ectonurite", power: "Invisible and intangible", color: "#B026FF" },
];

export default function AlienStrip() {
  return (
    <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {ALIENS.map((alien) => (
        <RevealItem key={alien.name}>
          <div
            className="panel group relative flex h-full flex-col items-center gap-3 overflow-hidden p-5 text-center transition-transform duration-500 hover:-translate-y-2"
            style={{ borderColor: `${alien.color}33` }}
          >
            <span
              className="absolute -top-10 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
              style={{ background: alien.color }}
            />
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 font-display text-lg font-black"
              style={{ borderColor: `${alien.color}88`, color: alien.color }}
            >
              {alien.name.slice(0, 1)}
              <span
                className="absolute inset-0 rounded-full border animate-pulse-ring"
                style={{ borderColor: `${alien.color}55` }}
              />
            </span>
            <div>
              <p className="font-display text-xs font-black tracking-wider text-white uppercase">
                {alien.name}
              </p>
              <p className="mt-1 text-[0.68rem] font-bold text-void-200">{alien.role}</p>
            </div>
            <p className="text-[0.7rem] leading-relaxed text-void-100">{alien.power}</p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

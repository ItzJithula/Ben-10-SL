import { ALIENS, AlienIcon } from "./aliens";
import { RevealGroup, RevealItem } from "./Reveal";

/**
 * Ben 10 flavour section — a slice of the Omnitrix roster.
 * The silhouettes and blurbs come from the single roster in `aliens.tsx`,
 * so this section can never drift out of sync with the watch dial.
 */
const FEATURED = ["heatblast", "xlr8", "four-arms", "diamondhead", "upgrade", "ghostfreak"];

export default function AlienStrip() {
  const aliens = FEATURED.map((id) => ALIENS.find((alien) => alien.id === id)).filter(
    (alien) => alien !== undefined,
  );

  return (
    <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {aliens.map((alien) => (
        <RevealItem key={alien.id}>
          <div
            className="panel group relative flex h-full flex-col items-center gap-3 overflow-hidden p-5 text-center transition-transform duration-500 hover:-translate-y-2"
            style={{ borderColor: `${alien.accent}33` }}
          >
            <span
              className="absolute -top-10 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
              style={{ background: alien.accent }}
            />
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-full border-2"
              style={{ borderColor: `${alien.accent}88` }}
            >
              <AlienIcon alien={alien} size={38} accent={alien.accent} title={alien.name} />
              <span
                className="absolute inset-0 rounded-full border animate-pulse-ring"
                style={{ borderColor: `${alien.accent}55` }}
              />
            </span>
            <div>
              <p className="font-display text-xs font-black tracking-wider text-white uppercase">
                {alien.name}
              </p>
              <p className="mt-1 text-[0.68rem] font-bold text-void-200">{alien.species}</p>
            </div>
            <p className="text-[0.7rem] leading-relaxed text-void-100">{alien.powers}</p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

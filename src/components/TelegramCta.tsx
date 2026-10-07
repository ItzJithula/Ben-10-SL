import Reveal from "./Reveal";

export default function TelegramCta({
  telegramUrl,
  members,
  requestsUrl,
}: {
  telegramUrl: string;
  members: string;
  requestsUrl?: string;
}) {
  return (
    <Reveal direction="scale">
      <div className="panel scanlines relative isolate overflow-hidden px-6 py-12 text-center sm:px-14">
        <div className="hex-grid absolute inset-0 -z-10 opacity-50" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-omni-400 to-transparent" />

        <p className="mb-3 text-[0.68rem] font-black tracking-[0.34em] text-omni-300 uppercase">
          Our community
        </p>
        <h2 className="mx-auto max-w-2xl font-display text-2xl font-black text-white sm:text-3xl">
          Never miss a new Sinhala episode
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-void-100">
          Every new release lands on our Telegram channel first. Join in — it is completely free.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="group inline-flex items-center gap-3 rounded-full bg-linear-to-r from-omni-300 via-omni-400 to-omni-600 px-7 py-3.5 font-display text-sm font-black tracking-wider text-void-950 uppercase shadow-omni-lg transition-transform hover:scale-[1.04]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M21.9 4.3 19 19.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5 8.3-7.5c.4-.3-.1-.5-.6-.2L7.5 12.4l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.6 1.3Z" />
            </svg>
            Join the channel
          </a>
          {requestsUrl ? (
            <a
              href={requestsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-omni-400/40 px-7 py-3.5 font-display text-sm font-black tracking-wider text-omni-200 uppercase transition-colors hover:border-omni-400 hover:bg-omni-400/10"
            >
              Request an episode
            </a>
          ) : null}
        </div>

        <p className="mt-6 text-xs font-bold tracking-[0.22em] text-void-200 uppercase">
          {members}+ members · updated daily
        </p>
      </div>
    </Reveal>
  );
}

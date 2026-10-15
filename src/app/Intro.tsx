import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

// Shown once, the first time the installed app opens; ?intro=1 shows it again.
const KEY = 'mo_app_intro_done';

// Photos from Unsplash (free licence), cropped to 900×1600 in public/intro.
const SLIDES = [
  {
    img: '/intro/gateway.webp',
    alt: 'The Gateway of India under pink evening clouds',
    kicker: 'Devcon 8 week · 3–6 Nov',
    title: 'Welcome to Mumbai Onchain',
    body: 'The whole Devcon 8 week in Mumbai, in one app.',
  },
  {
    img: '/intro/taxis.webp',
    alt: 'Kaali-peeli taxis passing the lit-up BMC building at night',
    kicker: 'Schedule',
    title: 'Every event, one plan',
    body: 'Side events, hackathons and parties across the city. Save the ones you want.',
  },
  {
    img: '/intro/market.webp',
    alt: 'A busy market street in south Mumbai',
    kicker: 'People',
    title: 'Meet who’s building onchain',
    body: 'Builders, founders and students from India and the world. Scan a badge to connect.',
  },
  {
    img: '/intro/marine-drive.webp',
    alt: 'Marine Drive lit up at dusk along the sea',
    kicker: 'Your badge',
    title: 'Your pass to the week',
    body: 'Show your QR, check in and find your way around Mumbai.',
  },
];

function shouldShow(): boolean {
  try {
    if (new URLSearchParams(location.search).get('intro') === '1') return true;
    return localStorage.getItem(KEY) !== '1';
  } catch {
    return false;
  }
}

/** First-launch walkthrough: full-bleed Mumbai photos with a frosted-glass card. */
export function Intro() {
  const [open, setOpen] = useState(shouldShow);
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const last = index === SLIDES.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // private mode: shows again next launch
    }
    setLeaving(true);
    window.setTimeout(() => setOpen(false), 320);
  };

  const next = () => {
    if (last) return finish();
    const el = track.current;
    el?.scrollTo({ left: (index + 1) * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Mumbai Onchain"
      className={`app fixed inset-0 z-[90] bg-black text-white transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <div ref={track} onScroll={onScroll} className="app-scroll-x h-full flex overflow-x-auto snap-x snap-mandatory">
        {SLIDES.map((s, i) => (
          <section key={s.img} aria-label={`${i + 1} of ${SLIDES.length}`} className="relative shrink-0 w-full h-full snap-start overflow-hidden">
            <img
              src={s.img}
              alt={s.alt}
              className={`intro-photo absolute inset-0 w-full h-full object-cover ${i === index ? 'is-active' : ''}`}
              // Not lazy: iOS Safari doesn't reliably load lazy images off to the
              // side in a horizontal scroller, and these are precached anyway.
              decoding="async"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_22%,transparent_45%,rgba(0,0,0,0.65)_100%)]" aria-hidden="true" />
          </section>
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 pt-[calc(env(safe-area-inset-top)+12px)] px-4 flex items-center justify-between pointer-events-none">
        <span className="h-9 pl-1 pr-3 rounded-full bg-white/15 border border-white/25 backdrop-blur-xl flex items-center gap-2 text-[13px] font-bold">
          <img src="/brand/logo.webp" alt="" className="w-7 h-7 rounded-full" />
          Mumbai Onchain
        </span>
        {!last && (
          <button type="button" onClick={finish} className="app-press pointer-events-auto h-9 px-4 rounded-full bg-white/15 border border-white/25 backdrop-blur-xl text-[14px] font-semibold">
            Skip
          </button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div key={index} className="intro-card rounded-[28px] p-5 bg-white/12 border border-white/25 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <p className="app-mono text-[12px] font-semibold text-white/80">{SLIDES[index].kicker}</p>
          <h1 className="app-title mt-1.5 text-[32px] leading-[1.05]">{SLIDES[index].title}</h1>
          <p className="mt-2 text-[15px] leading-snug text-white/85">{SLIDES[index].body}</p>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {SLIDES.map((s, i) => (
                <span key={s.img} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              aria-label={last ? 'Start using the app' : 'Next'}
              className={`app-press h-14 rounded-full bg-white text-[#111317] flex items-center justify-center gap-2 font-bold text-[15px] transition-all duration-300 ${last ? 'px-6' : 'w-14'}`}
            >
              {last && 'Let’s go'}
              <ArrowRight className="w-6 h-6" strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

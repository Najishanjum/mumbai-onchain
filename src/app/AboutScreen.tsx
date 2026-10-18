import { useEffect, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useBackToClose } from '../lib/useBackToClose';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="app-label px-1">{title}</h2>
      <div className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4 flex flex-col gap-2.5 text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--app-primary)] underline underline-offset-2">
      {children}
    </a>
  );
}

function Maker({ name, role, handle }: { name: string; role: string; handle: string }) {
  return (
    <a
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="app-press flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-bg)] border border-[var(--app-line)]"
    >
      <span className="w-10 h-10 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] flex items-center justify-center font-extrabold shrink-0">
        {name[0]}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold">{name}</span>
        <span className="block text-[13px] text-[var(--app-muted)]">{role}</span>
      </span>
      <span className="text-[14px] font-semibold text-[var(--app-primary)] shrink-0">@{handle}</span>
    </a>
  );
}

/**
 * Me → About: who made the app, that it's an unofficial community project,
 * and credit for the design inspiration, places and photos.
 */
export function AboutScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackToClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="About" className="app fixed inset-0 z-[60] flex flex-col bg-[var(--app-bg)]">
      <header className="shrink-0 pt-[calc(env(safe-area-inset-top)+8px)] px-3 pb-2 flex items-center gap-1 border-b border-[var(--app-line)]">
        <button type="button" onClick={onClose} aria-label="Back" className="app-press w-11 h-11 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        <h1 className="app-title text-[20px]">About</h1>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+32px)] flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl" />
          <p className="app-title text-[24px]">Mumbai Onchain</p>
          <p className="text-[15px] text-[var(--app-muted)] max-w-[32ch]">An unofficial, community-made app for the onchain week in Mumbai.</p>
        </div>

        <Section title="What this is">
          <p>
            This November, Mumbai hosts Devcon 8, India Blockchain Week, ETHGlobal Mumbai and dozens of side events. This app puts them in
            one place so you can plan your days, meet people and find your way around the city.
          </p>
          <p>
            “Mumbai Onchain Week” is our own nickname for this stretch of events. It isn’t an official event, brand or organiser.
          </p>
        </Section>

        <Section title="Who made it">
          <p>Independent builders who wanted one place for the whole week.</p>
          <Maker name="Najish" role="Idea and website" handle="najish_anjum" />
          <Maker name="Nimsara" role="App design and development" handle="nimsaraonline" />
          <Maker name="Moinuddin" role="PR and editing" handle="md_moinuddin1" />
        </Section>

        <Section title="Not affiliated">
          <p>
            Mumbai Onchain is not affiliated with, endorsed by or sponsored by the Ethereum Foundation, Devcon, India Blockchain Week,
            ETHGlobal or any organiser of the events listed here.
          </p>
          <p>Event names belong to their owners and are used only to say which event is which.</p>
        </Section>

        <Section title="Design credits">
          <p>
            To match the spirit of the week, the app’s look takes inspiration from the visual worlds of Devcon 8, India Blockchain Week and
            Mumbai itself: mandalas, twilight colours and glowing city maps. Full credit to the designers behind those identities.
          </p>
          <p>The mandala, colours, badges and map styling in this app are our own drawings and code, made for this community project.</p>
        </Section>

        <Section title="Places, photos and maps">
          <p>
            Hostel and café picks by Nidhi from the India Blockchain Week team. Read her{' '}
            <Link href="https://x.com/IBWofficial/status/2109986968021147833">hostel thread</Link> and{' '}
            <Link href="https://x.com/IBWofficial/status/2098393891930284485">café thread</Link>.
          </p>
          <p>
            Intro photos from Unsplash. Jio World Centre photo by DesiBoy101 (CC BY 4.0). Map data © OpenStreetMap contributors, map tiles by
            OpenFreeMap.
          </p>
        </Section>

        <Section title="Check before you go">
          <p>
            Times, venues and prices change. We do our best to keep things right, but always confirm with the official organiser before you
            travel or book. The app is provided as is, without guarantees.
          </p>
          <p>Your profile is visible to other people using the app, so only add what you’re happy to share.</p>
        </Section>

        <Section title="Get in touch">
          <p>
            Something wrong, or want your event, photo or brand changed or removed? Message <Link href="https://x.com/nimsaraonline">@nimsaraonline</Link>{' '}
            on X and we’ll sort it out.
          </p>
        </Section>
      </div>
    </div>
  );
}

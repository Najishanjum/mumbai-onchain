import { useEffect, useRef, useState } from 'react';
import { keyboardFit, useKeyboardViewport } from '../lib/useKeyboardViewport';
import { ArrowUp, ChevronLeft, Loader2, MapPin, RotateCcw } from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import type { ChatMessage, QueryContext } from '../lib/assistant/types';
import { processUserQuery } from '../lib/assistant/queryEngine';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, type SupportedLanguage } from '../lib/assistant/translations';
import { PersonAvatar } from '../components/PersonAvatar';
import { dayLabel } from './time';
import { useBackToClose } from '../lib/useBackToClose';

// Same keys as the website's assistant, so the chat and language carry over.
const STORAGE_CHAT_KEY = 'mumbai_onchain_ai_chat_history_v2';
const STORAGE_LANG_KEY = 'mumbai_onchain_ai_lang_pref_v1';

interface AskScreenProps {
  open: boolean;
  onClose: () => void;
  events: EventItem[];
  people: PersonProfile[];
  myProfile: PersonProfile | null;
  connections: Record<string, string>;
  notes: Record<string, unknown>;
  onSelectEvent: (id: string) => void;
  onSelectPerson: (id: string) => void;
}

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function welcome(lang: SupportedLanguage): ChatMessage {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return { id: `msg-welcome-${Date.now()}`, sender: 'assistant', content: t.welcomeGreeting, timestamp: nowLabel() };
}

function loadLang(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) return saved as SupportedLanguage;
  } catch {
    // default below
  }
  return 'en';
}

function loadChat(lang: SupportedLanguage): ChatMessage[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_CHAT_KEY) || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // start fresh
  }
  return [welcome(lang)];
}

/** Answers use **bold** for names; show that, and keep line breaks. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
      )}
    </>
  );
}

/** The assistant as a native screen: opened from the logo button in the tab bar. */
export function AskScreen({ open, onClose, events, people, myProfile, connections, notes, onSelectEvent, onSelectPerson }: AskScreenProps) {
  const [lang, setLang] = useState<SupportedLanguage>(loadLang);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat(loadLang()));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useBackToClose(open, onClose);
  // While typing, the screen fits above the keyboard (header still showing).
  const kb = useKeyboardViewport(open);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const onlyWelcome = messages.length === 1 && messages[0].id.startsWith('msg-welcome');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // history just won't survive a reload
    }
  }, [messages]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' });
  }, [open, messages, busy, kb?.height]);

  // Stop the page behind from scrolling while Ask is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function pickLang(code: SupportedLanguage) {
    setLang(code);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, code);
    } catch {
      // fine for this session
    }
    if (onlyWelcome) setMessages([welcome(code)]);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { id: `user-${Date.now()}`, sender: 'user', content: q, timestamp: nowLabel() }]);
    setInput('');
    setBusy(true);
    try {
      const context: QueryContext = { events, people, myProfile, connections, notes: notes as QueryContext['notes'] };
      const r = await processUserQuery(q, context, lang);
      setMessages((m) => [
        ...m,
        { id: `asst-${Date.now()}`, sender: 'assistant', content: r.content, timestamp: nowLabel(), events: r.events, people: r.people },
      ]);
    } catch {
      setMessages((m) => [...m, { id: `asst-err-${Date.now()}`, sender: 'assistant', content: t.unknownAnswer, timestamp: nowLabel() }]);
    } finally {
      setBusy(false);
    }
  }

  const prompts = [t.suggestedPrompt1, t.suggestedPrompt2, t.suggestedPrompt3, t.suggestedPrompt4, t.suggestedPrompt5];

  return (
    <div role="dialog" aria-modal="true" aria-label={t.assistantName} className="app fixed inset-0 z-[60] flex flex-col bg-[var(--app-bg)] [background-image:var(--app-glow)] bg-no-repeat" style={keyboardFit(kb, 'var(--app-bg)')}>
      <header className="shrink-0 pt-[calc(env(safe-area-inset-top)+8px)] px-3 pb-2 flex items-center gap-2 border-b border-[var(--app-line)]">
        <button type="button" onClick={onClose} aria-label="Back" className="app-press w-11 h-11 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
        <img src="/icons/icon-192.png" alt="" className="w-9 h-9 rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-extrabold leading-tight truncate">{t.assistantName}</div>
          <div className="app-label">{busy ? t.searching : t.onlineStatus}</div>
        </div>
        <label className="sr-only" htmlFor="ask-lang">Language</label>
        <select
          id="ask-lang"
          value={lang}
          onChange={(e) => pickLang(e.target.value as SupportedLanguage)}
          className="h-9 max-w-[92px] rounded-full px-2.5 bg-[var(--app-surface)] border border-[var(--app-line)] text-[13px] font-semibold text-[var(--app-ink)]"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setMessages([welcome(lang)])}
          aria-label={t.clearChat}
          className="app-press w-11 h-11 rounded-full flex items-center justify-center text-[var(--app-muted)]"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.map((m) =>
          m.sender === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[82%] rounded-[20px] rounded-br-md px-4 py-2.5 bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[16px] leading-snug whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-full shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="rounded-[20px] rounded-tl-md px-4 py-3 bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] leading-relaxed whitespace-pre-wrap">
                  <RichText text={m.content} />
                </div>
                {m.events && m.events.length > 0 && (
                  <div className="space-y-2">
                    {m.events.slice(0, 5).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onSelectEvent(e.id)}
                        className="app-press w-full text-left rounded-2xl px-4 py-3 bg-[var(--app-surface)] border border-[var(--app-line)]"
                      >
                        <div className="app-mono text-[12px] text-[var(--app-primary)]">
                          {dayLabel(e.startDate)} · {e.startTime === 'TBA' ? 'Time TBA' : e.startTime}
                        </div>
                        <div className="mt-0.5 text-[15px] font-bold leading-snug">{e.title}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--app-muted)]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{e.location}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {m.people && m.people.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.people.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectPerson(p.id)}
                        className="app-press h-10 pl-1 pr-3 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center gap-2 text-[14px] font-semibold"
                      >
                        <PersonAvatar name={p.name} avatarUrl={p.avatar} size="sm" className="rounded-full! border-0! w-8! h-8!" />
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {busy && (
          <div className="flex items-center gap-2 pl-11 text-[14px] text-[var(--app-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.searching}
          </div>
        )}
        {onlyWelcome && (
          <div className="pl-11 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                className="app-press min-h-10 px-3.5 py-2 rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] text-[14px] font-semibold text-left"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={kb ? { paddingBottom: 10 } : undefined}
        className="shrink-0 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] border-t border-[var(--app-line)] bg-[var(--app-bg)] flex items-center gap-2"
      >
        <label htmlFor="ask-input" className="sr-only">
          {t.placeholder}
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          autoComplete="off"
          enterKeyHint="send"
          className="flex-1 min-w-0 h-12 px-4 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          aria-label="Send"
          className="app-press w-12 h-12 shrink-0 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center disabled:opacity-40"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Clock,
  MapPin,
  ArrowUpRight,
  Globe,
  Loader2,
  ChevronDown
} from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import type { ChatMessage, QueryContext } from '../lib/assistant/types';
import { processUserQuery } from '../lib/assistant/queryEngine';
import {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type SupportedLanguage
} from '../lib/assistant/translations';

interface AskMumbaiAssistantProps {
  events: EventItem[];
  people: PersonProfile[];
  myProfile: PersonProfile | null;
  connections: Record<string, string>;
  notes: Record<string, any>;
  onSelectEvent: (eventId: string) => void;
  onSelectPerson: (personId: string) => void;
}

const STORAGE_CHAT_KEY = 'mumbai_onchain_ai_chat_history_v2';
const STORAGE_LANG_KEY = 'mumbai_onchain_ai_lang_pref_v1';

export const AskMumbaiAssistant: React.FC<AskMumbaiAssistantProps> = ({
  events,
  people,
  myProfile,
  connections,
  notes,
  onSelectEvent,
  onSelectPerson,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);

  // Selected language state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        return savedLang as SupportedLanguage;
      }
    } catch {}
    return 'en';
  });

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Load chat history or create clean initial welcome message in selected language
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        content: t.welcomeGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isSearching]);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save chat history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Save language preference
  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setCurrentLang(langCode);
    setIsLangMenuOpen(false);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, langCode);
    } catch {}

    // If chat only has the initial greeting, update it to the new language
    if (messages.length === 1 && messages[0].id.startsWith('msg-welcome')) {
      const newT = TRANSLATIONS[langCode] || TRANSLATIONS.en;
      setMessages([
        {
          id: 'msg-welcome',
          sender: 'assistant',
          content: newT.welcomeGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isSearching) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSearching(true);

    try {
      const context: QueryContext = {
        events,
        people,
        myProfile,
        connections,
        notes,
      };

      const response = await processUserQuery(textToSend, context, currentLang);

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        events: response.events,
        people: response.people,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Assistant error:', err);
      const fallbackMessage: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        content: t.unknownAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearChat = () => {
    const resetMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      sender: 'assistant',
      content: t.welcomeGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([resetMsg]);
    try {
      localStorage.removeItem(STORAGE_CHAT_KEY);
    } catch {}
  };

  const quickPrompts = [
    t.suggestedPrompt1,
    t.suggestedPrompt2,
    t.suggestedPrompt3,
    t.suggestedPrompt4,
    t.suggestedPrompt5,
  ];

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────────
          1. SLEEK FLOATING TRIGGER BUTTON (Bottom-Right)
          ──────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-xs font-semibold transition-all duration-200 shadow-xl active:scale-95 cursor-pointer border ${
            isOpen
              ? 'bg-[#000000] text-[#FFFFFF] border-[#333333]'
              : 'bg-[#0A0A0A] hover:bg-[#161616] text-[#FFFFFF] border-[#2E2E2E] hover:border-[#555555]'
          }`}
          aria-label="Toggle Ask Mumbai Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F97316] group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">✦ {t.assistantName.split(' ')[0]}</span>
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          2. MINIMALIST PROFESSIONAL CHAT PANEL
          ──────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-2 sm:bottom-20 sm:right-6 w-[calc(100vw-1rem)] sm:w-[420px] md:w-[450px] h-[560px] max-h-[82vh] z-50 bg-[#0F0F0F] border border-[#262626] text-[#F3F3F3] shadow-2xl rounded-2xl flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="Ask Mumbai AI Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-b border-[#222222] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#1C1C1C] border border-[#2D2D2D] flex items-center justify-center text-[#F97316]">
                <Sparkles className="w-3.5 h-3.5 fill-[#F97316]" />
              </div>
              <div>
                <div className="font-heading font-bold text-xs text-[#FFFFFF] tracking-tight uppercase flex items-center gap-1.5">
                  <span>Ask Mumbai</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                </div>
                <div className="font-mono text-[10px] text-[#666666]">
                  {t.onlineStatus}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher Dropdown */}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] hover:bg-[#242424] border border-[#333333] rounded text-[11px] font-mono text-[#CCCCCC] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                  title="Switch Language"
                  aria-label="Switch Language"
                >
                  <Globe className="w-3 h-3 text-[#888888]" />
                  <span className="font-bold">{currentLangObj.flag} {currentLangObj.code.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 text-[#666666]" />
                </button>

                {isLangMenuOpen && (
                  <div className="absolute right-0 top-8 w-44 bg-[#141414] border border-[#2A2A2A] rounded-lg shadow-2xl py-1 z-50 text-xs font-mono max-h-64 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                          currentLang === lang.code
                            ? 'bg-[#F97316]/10 text-[#F97316] font-bold'
                            : 'text-[#AAAAAA] hover:bg-[#1E1E1E] hover:text-[#FFFFFF]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] text-[#666666]">{lang.code.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear chat */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-[#666666] hover:text-[#FFFFFF] hover:bg-[#222222] rounded transition-colors cursor-pointer"
                title={t.clearChat}
                aria-label={t.clearChat}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#666666] hover:text-[#FFFFFF] hover:bg-[#222222] rounded transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 font-sans text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-3 rounded-xl leading-relaxed text-[12.5px] ${
                      isUser
                        ? 'bg-[#1F1F1F] text-[#FFFFFF] border border-[#333333]'
                        : 'bg-[#141414] text-[#E0E0E0] border border-[#222222]'
                    }`}
                  >
                    <div className="whitespace-pre-line space-y-1.5">
                      {msg.content}
                    </div>

                    {/* Compact Event Cards */}
                    {msg.events && msg.events.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#222222] space-y-1.5">
                        {msg.events.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => onSelectEvent(evt.id)}
                            className="group p-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#444444] rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#777777]">
                                <Clock className="w-2.5 h-2.5 text-[#F97316]" />
                                <span>{evt.startDate.slice(5)} • {evt.startTime} IST</span>
                              </div>
                              <div className="font-heading font-bold text-xs text-[#FFFFFF] truncate group-hover:text-[#F97316] transition-colors">
                                {evt.title}
                              </div>
                              <div className="font-mono text-[9.5px] text-[#666666] flex items-center gap-1 truncate">
                                <MapPin className="w-2.5 h-2.5 text-[#888888]" />
                                <span className="truncate">{evt.location}</span>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#666666] group-hover:text-[#FFFFFF] transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Compact People Cards */}
                    {msg.people && msg.people.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#222222] space-y-1.5">
                        {msg.people.map((person) => (
                          <div
                            key={person.id}
                            onClick={() => onSelectPerson(person.id)}
                            className="group p-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#444444] rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {person.avatar ? (
                                <img
                                  src={person.avatar}
                                  alt={person.name}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#333333]"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center font-bold text-[10px] text-[#FFFFFF] shrink-0">
                                  {person.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-heading font-bold text-xs text-[#FFFFFF] truncate group-hover:text-[#22C55E] transition-colors">
                                  {person.name}
                                </div>
                                <div className="font-mono text-[9.5px] text-[#666666] truncate">
                                  {person.category} • {person.city}
                                </div>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#666666] group-hover:text-[#FFFFFF] transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Searching indicator */}
            {isSearching && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#222222] rounded-xl text-xs text-[#888888] font-mono">
                <Loader2 className="w-3.5 h-3.5 text-[#F97316] animate-spin" />
                <span>{t.searching}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (Single clean horizontal row) */}
          <div className="px-3 py-1.5 bg-[#121212] border-t border-[#1E1E1E] flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[10px] shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#262626] text-[#888888] hover:text-[#FFFFFF] border border-[#2B2B2B] rounded-full transition-colors cursor-pointer shrink-0"
              >
                ✦ {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-[#141414] border-t border-[#222222] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 bg-[#1A1A1A] border border-[#2C2C2C] focus:border-[#555555] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#FFFFFF] placeholder-[#666666] transition-colors"
              disabled={isSearching}
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isSearching}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                inputValue.trim() && !isSearching
                  ? 'bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5] active:scale-95'
                  : 'bg-[#222222] text-[#444444] cursor-not-allowed'
              }`}
              aria-label="Send"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

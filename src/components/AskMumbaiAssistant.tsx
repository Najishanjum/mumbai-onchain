import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  ArrowUpRight,
  User,
  ShieldCheck,
  Globe,
  Loader2
} from 'lucide-react';
import type { EventItem } from '../types/event';
import type { PersonProfile } from '../types/person';
import type { ChatMessage, QueryContext } from '../lib/assistant/types';
import { processUserQuery } from '../lib/assistant/queryEngine';
import { StatusBadge } from './StatusBadge';

interface AskMumbaiAssistantProps {
  events: EventItem[];
  people: PersonProfile[];
  myProfile: PersonProfile | null;
  connections: Record<string, string>;
  notes: Record<string, any>;
  onSelectEvent: (eventId: string) => void;
  onSelectPerson: (personId: string) => void;
}

const STORAGE_CHAT_KEY = 'mumbai_onchain_ai_chat_history_v1';

const INITIAL_SUGGESTIONS = [
  "What's my next event?",
  "What events are happening on November 4?",
  "Which events overlap with Devcon?",
  "Find students from Jabalpur",
  "Show me people attending ETHGlobal",
  "Who is attending Devcon as a volunteer?",
  "What's the latest Devcon schedule?",
];

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

  // Load chat history from LocalStorage or initialize with welcoming assistant message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        content: `Namaste! I am your **Mumbai Onchain AI Assistant** — your live intelligence command center for Mumbai Web3 Week 2026.\n\nI dynamically combine your **personal schedule and LocalStorage data** with **live official information** for Devcon 8, India Blockchain Week, ETHGlobal, and 90+ ecosystem side events.\n\nHow can I help you navigate Mumbai Onchain Week today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [
          { name: 'Official Devcon 8 (devcon.org)', type: 'official' },
          { name: 'India Blockchain Week (indiablockchainweek.com)', type: 'official' },
          { name: 'ETHGlobal Mumbai (ethglobal.com)', type: 'official' },
          { name: 'Mumbai Onchain Local Registry', type: 'local' }
        ],
        suggestedQueries: [
          "What's my next event?",
          "What events are happening on November 4?",
          "Find students from Jabalpur",
          "Which events overlap with Devcon?",
        ]
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isSearching]);

  // Persist messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages]);

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

      // Process query using hybrid intelligence engine
      const response = await processUserQuery(textToSend, context);

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        events: response.events,
        people: response.people,
        sources: response.sources,
        suggestedQueries: response.suggestedFollowUps,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Assistant error:', err);
      const fallbackMessage: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        content: `I couldn't verify that from the available sources right now. Please check your network or try asking another question about events or attendees.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [{ name: 'Mumbai Onchain Local Storage', type: 'local' }],
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
      content: `Chat session refreshed. I am ready to answer questions about your personal schedule, Devcon 8, IBW, ETHGlobal, or builders in the directory!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [{ name: 'Mumbai Onchain Registry', type: 'local' }],
      suggestedQueries: [
        "What's my next event?",
        "What events are happening on November 4?",
        "Find students from Jabalpur",
        "Which events overlap with Devcon?"
      ]
    };
    setMessages([resetMsg]);
    try {
      localStorage.removeItem(STORAGE_CHAT_KEY);
    } catch {}
  };

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────────
          1. FLOATING TRIGGER BUTTON (Bottom-Right across entire website)
          Positioned above mobile bottom bar (bottom-20 on mobile, bottom-6 on desktop)
          ──────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-full font-mono text-xs font-bold transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer border ${
            isOpen
              ? 'bg-[#000000] text-[#FFFFFF] border-[#333333] ring-2 ring-[#F97316]/50'
              : 'bg-[#050505] hover:bg-[#151515] text-[#FFFFFF] border-[#333333] hover:border-[#F97316]'
          }`}
          aria-label="Toggle Mumbai Onchain AI Assistant"
        >
          {/* Animated sparkle icon */}
          <span className="flex items-center justify-center text-[#F97316] group-hover:rotate-12 transition-transform duration-300">
            <Sparkles className="w-4 h-4 fill-[#F97316]" />
          </span>

          <span className="tracking-wider">
            {isOpen ? 'Close Assistant' : '✦ Ask Mumbai'}
          </span>

          {/* Online green indicator pulse */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          2. CHAT PANEL (Premium Dark UI, Context-Aware, Interactive)
          ──────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-2 sm:bottom-20 sm:right-6 w-[calc(100vw-1rem)] sm:w-[460px] md:w-[490px] h-[600px] max-h-[82vh] z-50 bg-[#0A0A0A] border-2 border-[#262626] text-[#FFFFFF] shadow-2xl rounded-2xl flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-label="Mumbai Onchain AI Assistant"
        >
          {/* Top Panel Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#111111] border-b border-[#222222] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30">
                <Sparkles className="w-4 h-4 fill-[#F97316]" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-heading font-black text-sm text-[#FFFFFF] tracking-tight uppercase">
                  <span>MUMBAI ONCHAIN AI</span>
                  <span className="font-mono text-[9px] bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 px-1.5 py-0.2 rounded font-bold">
                    LIVE INTEL
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[#777777] flex items-center gap-1.5">
                  <Globe className="w-2.5 h-2.5 text-[#888888]" />
                  <span>Hybrid Web + Local Data Engine</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear chat history */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-[#666666] hover:text-[#FFFFFF] hover:bg-[#222222] rounded transition-colors cursor-pointer"
                title="Clear Chat History"
                aria-label="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Close panel */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#222222] rounded transition-colors cursor-pointer ml-1"
                aria-label="Close Assistant Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Sender identity & timestamp */}
                  <div className="flex items-center gap-2 px-1 font-mono text-[10px] text-[#666666]">
                    <span>{isUser ? 'YOU' : '✦ MUMBAI AI'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[92%] sm:max-w-[88%] p-3.5 sm:p-4 rounded-xl leading-relaxed text-[13px] ${
                      isUser
                        ? 'bg-[#1E1E1E] text-[#FFFFFF] border border-[#333333]'
                        : 'bg-[#141414] text-[#E0E0E0] border border-[#262626]'
                    }`}
                  >
                    <div className="whitespace-pre-line space-y-2">
                      {msg.content}
                    </div>

                    {/* Interactive Clickable Event Cards */}
                    {msg.events && msg.events.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-[#262626] space-y-2">
                        <div className="font-mono text-[10px] text-[#F97316] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>MATCHING EVENTS ({msg.events.length}):</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.events.map((evt) => (
                            <div
                              key={evt.id}
                              onClick={() => {
                                onSelectEvent(evt.id);
                              }}
                              className="group p-2.5 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2D2D2D] hover:border-[#F97316] rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#888888]">
                                  <Clock className="w-2.5 h-2.5 text-[#F97316]" />
                                  <span>{evt.startDate} • {evt.startTime} IST</span>
                                  <span>•</span>
                                  <span className="text-[#AAAAAA] uppercase">[{evt.category}]</span>
                                </div>
                                <h5 className="font-heading font-bold text-xs text-[#FFFFFF] truncate group-hover:text-[#F97316] transition-colors">
                                  {evt.title}
                                </h5>
                                <div className="font-mono text-[10px] text-[#666666] flex items-center gap-1 truncate">
                                  <MapPin className="w-2.5 h-2.5 text-[#888888]" />
                                  <span className="truncate">{evt.location}</span>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                <StatusBadge status={evt.status} size="sm" />
                                <div className="p-1 rounded bg-[#262626] group-hover:bg-[#F97316] text-[#FFFFFF] transition-colors">
                                  <ArrowUpRight className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Clickable People Cards */}
                    {msg.people && msg.people.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-[#262626] space-y-2">
                        <div className="font-mono text-[10px] text-[#22C55E] font-bold uppercase tracking-wider flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>DIRECTORY ATTENDEES ({msg.people.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.people.map((person) => (
                            <div
                              key={person.id}
                              onClick={() => {
                                onSelectPerson(person.id);
                              }}
                              className="group p-2.5 bg-[#1A1A1A] hover:bg-[#222222] border border-[#2D2D2D] hover:border-[#22C55E] rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {person.avatar ? (
                                  <img
                                    src={person.avatar}
                                    alt={person.name}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#333333]"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center font-bold text-xs text-[#FFFFFF] shrink-0">
                                    {person.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-heading font-bold text-xs text-[#FFFFFF] truncate group-hover:text-[#22C55E] transition-colors">
                                      {person.name}
                                    </span>
                                    <span className="font-mono text-[9px] text-[#888888] bg-[#262626] px-1 py-0.2 rounded">
                                      {person.category}
                                    </span>
                                  </div>
                                  <div className="font-mono text-[10px] text-[#666666] truncate">
                                    {person.city} {person.bio ? `• ${person.bio.slice(0, 38)}...` : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 p-1 rounded bg-[#262626] group-hover:bg-[#22C55E] text-[#FFFFFF] transition-colors">
                                <ArrowUpRight className="w-3 h-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Source Indicators */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#222222] flex items-center flex-wrap gap-1.5 font-mono text-[10px] text-[#777777]">
                        <span className="flex items-center gap-1 text-[#888888]">
                          <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
                          <span>Sources:</span>
                        </span>
                        {msg.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-[#1A1A1A] border border-[#2D2D2D] px-1.5 py-0.5 rounded text-[10px] text-[#AAAAAA] hover:text-[#FFFFFF]"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contextual Suggested Questions Chips */}
                  {msg.suggestedQueries && msg.suggestedQueries.length > 0 && !isUser && (
                    <div className="flex items-center flex-wrap gap-1.5 pt-1 pl-1 max-w-[90%]">
                      {msg.suggestedQueries.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          className="font-mono text-[10px] text-[#999999] hover:text-[#FFFFFF] bg-[#161616] hover:bg-[#222222] border border-[#2B2B2B] hover:border-[#F97316] px-2.5 py-1 rounded-full transition-all cursor-pointer text-left"
                        >
                          ✦ {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Search & Reasoning Indicator */}
            {isSearching && (
              <div className="flex flex-col items-start space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 px-1 font-mono text-[10px] text-[#666666]">
                  <span>✦ MUMBAI AI</span>
                  <span>•</span>
                  <span>SEARCHING</span>
                </div>
                <div className="bg-[#141414] border border-[#262626] p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-[#AAAAAA] font-mono">
                  <Loader2 className="w-4 h-4 text-[#F97316] animate-spin" />
                  <span>Searching local schedule & live verified sources...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Scrubber Bar */}
          <div className="border-t border-[#1F1F1F] bg-[#0E0E0E] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[10px] shrink-0">
            <span className="text-[#666666] uppercase font-bold shrink-0">Quick:</span>
            {INITIAL_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="whitespace-nowrap bg-[#171717] hover:bg-[#222222] text-[#888888] hover:text-[#FFFFFF] border border-[#2A2A2A] px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#111111] border-t border-[#222222] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about events, schedule, people, Devcon, Nov 4..."
              className="flex-1 bg-[#1A1A1A] border border-[#333333] focus:border-[#F97316] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#FFFFFF] placeholder-[#666666] font-mono transition-colors"
              disabled={isSearching}
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isSearching}
              className={`p-2.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                inputValue.trim() && !isSearching
                  ? 'bg-[#F97316] text-[#FFFFFF] hover:bg-[#ea580c] active:scale-95'
                  : 'bg-[#222222] text-[#555555] cursor-not-allowed'
              }`}
              aria-label="Send query"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Footer Telemetry Disclaimer */}
          <div className="px-4 py-1.5 bg-[#080808] border-t border-[#181818] font-mono text-[9px] text-[#555555] flex items-center justify-between shrink-0">
            <span>MUMBAI ONCHAIN AI // DEVCON 8</span>
            <span>HYBRID LOCAL + LIVE WEB INTEL</span>
          </div>
        </div>
      )}
    </>
  );
};

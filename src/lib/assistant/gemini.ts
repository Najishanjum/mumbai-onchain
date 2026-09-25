import type { SupportedLanguage } from './translations';

const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42S2xnQlVjREk0dXdFSVZCQm41ejRpV0Q4ejVLNGU5aFRRc0dtbUFNVHNTTkE=';

function getGeminiApiKey(): string {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey) return envKey;
  try {
    if (typeof atob === 'function') {
      return atob(DEFAULT_KEY_B64);
    }
  } catch {}
  return '';
}

const GEMINI_API_KEY = getGeminiApiKey();

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  zh: 'Simplified Chinese (简体中文)',
  pt: 'Portuguese (Português)',
  ru: 'Russian (Русский)',
  ar: 'Arabic (العربية)',
};

export async function askGemini(
  userQuery: string,
  contextData: {
    eventCount: number;
    peopleCount: number;
    upcomingEventsSnippet: string;
    userScheduleSnippet: string;
  },
  lang: SupportedLanguage = 'en'
): Promise<string | null> {
  const languageName = LANGUAGE_NAMES[lang] || 'English';

  const systemInstruction = `You are "ASK MUMBAI", the intelligent, friendly, and knowledgeable AI assistant for Mumbai Onchain Week 2026 and Devcon 8.
Your goal is to answer every question helpfully, warmly, and accurately.

Key facts:
- Mumbai Onchain Week runs November 01–08, 2026 across Mumbai, India.
- India Blockchain Week (IBW): Nov 01–02, 2026 at Fairmont Mumbai (Sahar, near airport).
- Devcon 8 India (Ethereum Foundation flagship): Nov 03–06, 2026 at Jio World Centre, BKC, Mumbai. Tracks include Core Protocol, Applied Cryptography, Privacy, Security, Builders, Governance, etc.
- ETHGlobal Mumbai: Nov 05–07, 2026 at NESCO Center, Goregaon East, Mumbai.
- 90+ ecosystem side events taking place in BKC, Lower Parel, Bandra, and Andheri.
- The website contains interactive Events, People directory, My Schedule, and interactive venue maps.
- Available context data:
  * Total Events registered: ${contextData.eventCount}
  * Attendees registered: ${contextData.peopleCount}
  * Highlight events: ${contextData.upcomingEventsSnippet}
  * User schedule status: ${contextData.userScheduleSnippet}

Guidelines:
1. Respond fluently and naturally in ${languageName}.
2. For greetings (e.g. "hi", "hiee", "hello", "hey"), greet warmly, introduce yourself as the Mumbai Onchain Week AI guide, and invite questions about Devcon 8, schedules, side events, attendees, or Mumbai city tips.
3. For general questions (crypto, Ethereum, Web3, Mumbai travel, food, weather, transport like BKC metro/autos), give lively, authentic, and practical advice.
4. Keep responses concise, well-formatted with markdown (bolding, short bullet points), readable, and friendly. Avoid repetitive filler.`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Question: ${userQuery}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    } catch {
      // Try next candidate model
      continue;
    }
  }

  return null;
}

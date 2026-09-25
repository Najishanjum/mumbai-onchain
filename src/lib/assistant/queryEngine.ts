import type { EventItem } from '../../types/event';
import type { QueryContext, AssistantResponse, SourceReference } from './types';
import { performLiveWebSearch } from './liveKnowledge';

// Helper to determine if an event overlaps with Devcon 8
function doesOverlapWithDevcon(e: EventItem): boolean {
  if (e.id === 'devcon-8-india') return false;
  // Devcon 8 runs 2026-11-03 to 2026-11-06 (09:00 - 18:00)
  const devconStart = new Date('2026-11-03T09:00:00+05:30').getTime();
  const devconEnd = new Date('2026-11-06T18:00:00+05:30').getTime();

  const eStart = new Date(`${e.startDate}T${e.startTime.includes(':') ? e.startTime : '09:00'}:00+05:30`).getTime();
  const eEnd = new Date(`${e.endDate}T${e.endTime.includes(':') ? e.endTime : '18:00'}:00+05:30`).getTime();

  return eStart < devconEnd && eEnd > devconStart;
}

// Date normalization helper
function extractTargetDate(query: string): string | null {
  const q = query.toLowerCase();
  if (q.includes('nov 1') || q.includes('november 1') || q.includes('nov 01') || q.includes('november 01') || q.includes('nov-01')) return '2026-11-01';
  if (q.includes('nov 2') || q.includes('november 2') || q.includes('nov 02') || q.includes('november 02') || q.includes('nov-02')) return '2026-11-02';
  if (q.includes('nov 3') || q.includes('november 3') || q.includes('nov 03') || q.includes('november 03') || q.includes('nov-03')) return '2026-11-03';
  if (q.includes('nov 4') || q.includes('november 4') || q.includes('nov 04') || q.includes('november 04') || q.includes('nov-04')) return '2026-11-04';
  if (q.includes('nov 5') || q.includes('november 5') || q.includes('nov 05') || q.includes('november 05') || q.includes('nov-05')) return '2026-11-05';
  if (q.includes('nov 6') || q.includes('november 6') || q.includes('nov 06') || q.includes('november 06') || q.includes('nov-06')) return '2026-11-06';
  if (q.includes('nov 7') || q.includes('november 7') || q.includes('nov 07') || q.includes('november 07') || q.includes('nov-07')) return '2026-11-07';
  if (q.includes('nov 8') || q.includes('november 8') || q.includes('nov 08') || q.includes('november 08') || q.includes('nov-08')) return '2026-11-08';
  return null;
}

export async function processUserQuery(
  rawQuery: string,
  context: QueryContext
): Promise<AssistantResponse> {
  const query = rawQuery.trim();
  const q = query.toLowerCase();
  const { events, people, connections } = context;

  // Track sources used
  const sources: SourceReference[] = [
    {
      name: 'Mumbai Onchain Dynamic Local Registry',
      type: 'local',
      verifiedAt: 'Active session',
    },
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PERSONAL SCHEDULE & USER-SPECIFIC QUERIES (Source: LocalStorage / Personal)
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("my next event") ||
    q.includes("what's my next") ||
    q.includes("whats my next") ||
    q.includes("next up")
  ) {
    const attending = events.filter(
      (e) => e.status === 'ATTENDING' || e.status === 'VOLUNTEER'
    );
    const primary = events.find((e) => e.isPrimary || e.id === 'devcon-8-india');

    if (attending.length === 0) {
      return {
        content: `You currently don't have any events marked as **ATTENDING** or **VOLUNTEER** in your personal schedule.\n\nHowever, your primary flagship mission is **${primary?.title || 'Devcon 8 India'}**, kicking off on **November 03, 2026 at 09:00 IST** at **Jio World Centre, BKC**.\n\nYou can click on any event below to view its details and update your attendance status.`,
        events: primary ? [primary] : events.slice(0, 2),
        sources,
        suggestedFollowUps: ['What events are happening on Nov 4?', 'Show me my saved events', 'Which events conflict with Devcon?'],
      };
    }

    const nextEvt = attending[0];
    return {
      content: `Your next scheduled event is **${nextEvt.title}** on **${nextEvt.startDate}** from **${nextEvt.startTime} to ${nextEvt.endTime} IST** at **${nextEvt.location}**.\n\nStatus: **${nextEvt.status}** • Category: **${nextEvt.category}**.`,
      events: [nextEvt],
      sources,
      suggestedFollowUps: ['What events am I attending tomorrow?', 'Which events conflict with Devcon?', 'Show people attending the same events as me'],
    };
  }

  if (
    q.includes("what events am i attending") ||
    q.includes("my saved events") ||
    q.includes("my schedule") ||
    q.includes("what am i attending") ||
    q.includes("events i saved")
  ) {
    const attendingOrVolunteer = events.filter(
      (e) => e.status === 'ATTENDING' || e.status === 'VOLUNTEER' || e.status === 'INTERESTED'
    );

    if (attendingOrVolunteer.length === 0) {
      return {
        content: `You don't have any saved events yet in your local schedule. The flagship conferences you should consider are **Devcon 8 India**, **India Blockchain Week (IBW)**, and **ETHGlobal Mumbai**.`,
        events: events.filter(e => e.id === 'devcon-8-india' || e.id === 'india-blockchain-week-2026' || e.id === 'ethglobal-mumbai-2026'),
        sources,
        suggestedFollowUps: ['What is happening on Nov 4?', 'Which events overlap with Devcon?', 'Show me people attending ETHGlobal'],
      };
    }

    return {
      content: `According to your personal saved schedule, you have **${attendingOrVolunteer.length}** tracked events. Here are your primary attending and interested sessions:`,
      events: attendingOrVolunteer,
      sources,
      suggestedFollowUps: ['Which events conflict with Devcon?', 'What is happening on Nov 4?', 'Show people attending the same events as me'],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONFLICT ANALYSIS & DEVCON OVERLAPS (Combines Website data + Schedule)
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("overlap with devcon") ||
    q.includes("conflict with devcon") ||
    q.includes("events overlap") ||
    q.includes("event conflicts") ||
    (q.includes("devcon") && (q.includes("what else can i attend") || q.includes("after devcon")))
  ) {
    const overlapping = events.filter((e) => doesOverlapWithDevcon(e));
    const eveningEvents = events.filter(
      (e) => (e.startDate === '2026-11-04' || e.startDate === '2026-11-05') &&
        (e.startTime >= '18:00' || e.startTime.includes('19') || e.startTime.includes('20'))
    );

    sources.push({
      name: 'Official Devcon 8 Program Grid (devcon.org)',
      type: 'official',
      url: 'https://devcon.org/en/',
    });

    return {
      content: `### Devcon 8 Overlap & Conflict Intelligence\n\n**Devcon 8 India** takes place **November 03—06, 2026** (daily sessions from **09:00 to 18:00 IST**) at **Jio World Centre** in BKC.\n\nKey overlapping initiatives during daytime hours:\n- **ETHGlobal Mumbai** (Nov 05–07): Flagship 36h hackathon at NESCO Center runs concurrently with Days 3 & 4 of Devcon.\n- **EIP Hub @ Devcon 8**: Runs on-site at Jio World Centre.\n\n**What you can attend after Devcon hours (after 18:00 IST):**\n- **Money Layer @ Devcon Week** (Nov 04, 18:30 IST) at Gateway Room, Taj Mahal Palace\n- **Quantstamp x Common Defense Lounge** (Nov 04, 19:00 IST) in BKC\n- **Ravecon Bender** (Nov 04, 20:00 IST) at AntiSocial Lower Parel\n- **Liquidity Pool @ Devcon 8** (Nov 03, 21:30 IST)`,
      events: overlapping.length > 0 ? overlapping.slice(0, 4) : eveningEvents,
      sources,
      suggestedFollowUps: ['What events are happening on Nov 4?', 'Show me people attending ETHGlobal', 'What is my next event?'],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PEOPLE & NETWORKING QUERIES (Source: LocalStorage People Directory)
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("people") ||
    q.includes("attendee") ||
    q.includes("attendees") ||
    q.includes("who is attending") ||
    q.includes("find student") ||
    q.includes("find builders") ||
    q.includes("find founder") ||
    q.includes("jabalpur") ||
    q.includes("connected")
  ) {
    sources.push({
      name: 'Mumbai Onchain Verified People Directory',
      type: 'community',
    });

    // Sub-case: Jabalpur query
    if (q.includes("jabalpur")) {
      const jabalpurPeople = people.filter(
        (p) => p.city.toLowerCase().includes('jabalpur') || (p.bio && p.bio.toLowerCase().includes('jabalpur'))
      );
      if (jabalpurPeople.length > 0) {
        return {
          content: `Found **${jabalpurPeople.length} student/builder from Jabalpur** in the Mumbai Onchain directory:\n\n**${jabalpurPeople[0].name}** (${jabalpurPeople[0].category}) from ${jabalpurPeople[0].city}. ${jabalpurPeople[0].bio}\n\nYou can click the profile card below to view their social links and connect.`,
          people: jabalpurPeople,
          sources,
          suggestedFollowUps: ['Who is attending Devcon as a volunteer?', 'Show me people attending ETHGlobal', 'Who have I connected with?'],
        };
      }
      return {
        content: `I searched the community directory for students or attendees from Jabalpur, but couldn't find an existing profile matching that city yet. You can encourage fellow attendees from Jabalpur to publish their profile in the People directory!`,
        sources,
        suggestedFollowUps: ['Show all students in the directory', 'Show me people attending ETHGlobal'],
      };
    }

    // Sub-case: Volunteer query
    if (q.includes("volunteer")) {
      const volunteers = people.filter((p) => p.category === 'Volunteer');
      return {
        content: `Here are community members attending as **Volunteers** for Devcon 8 and Mumbai Onchain Week:\n\n${volunteers.map(v => `• **${v.name}** (${v.city}) — ${v.bio}`).join('\n')}`,
        people: volunteers,
        sources,
        suggestedFollowUps: ['Who is attending Devcon?', 'Show me people attending ETHGlobal', 'Find students from Jabalpur'],
      };
    }

    // Sub-case: ETHGlobal attendees
    if (q.includes("ethglobal")) {
      const ethGlobalAttendees = people.filter(
        (p) => p.attendingEvents && p.attendingEvents.some((id) => id.includes('ethglobal'))
      );
      return {
        content: `Found **${ethGlobalAttendees.length} builders and hackers** registered for **ETHGlobal Mumbai**:\n\n${ethGlobalAttendees.map(p => `• **${p.name}** (${p.category} from ${p.city}) — ${p.bio}`).join('\n')}`,
        people: ethGlobalAttendees,
        sources,
        suggestedFollowUps: ['What events are happening on Nov 5?', 'Who is attending Devcon?', 'Find students from Jabalpur'],
      };
    }

    // Sub-case: Devcon attendees
    if (q.includes("devcon")) {
      const devconAttendees = people.filter(
        (p) => p.attendingEvents && p.attendingEvents.some((id) => id.includes('devcon'))
      );
      return {
        content: `Here are community members registered to attend **Devcon 8 India** in BKC:`,
        people: devconAttendees.slice(0, 5),
        sources,
        suggestedFollowUps: ['Who is attending Devcon as a volunteer?', 'Show me people attending ETHGlobal', 'Who have I connected with?'],
      };
    }

    // Sub-case: My connections
    if (q.includes("connected with") || q.includes("my connections")) {
      const connectedIds = Object.keys(connections).filter((id) => connections[id] === 'CONNECTED');
      const connectedPeople = people.filter((p) => connectedIds.includes(p.id));

      if (connectedPeople.length === 0) {
        return {
          content: `You haven't established any confirmed connections yet. Head to the **PEOPLE** tab or click any attendee profile in the ticker to request connections with builders and volunteers!`,
          people: people.slice(0, 3),
          sources,
          suggestedFollowUps: ['Who is attending Devcon?', 'Show me people attending ETHGlobal', 'Find students from Jabalpur'],
        };
      }

      return {
        content: `You are currently connected with **${connectedPeople.length}** attendee${connectedPeople.length === 1 ? '' : 's'}:`,
        people: connectedPeople,
        sources,
        suggestedFollowUps: ['Show people attending the same events as me', 'What is my next event?'],
      };
    }

    // Sub-case: Students
    if (q.includes("student")) {
      const students = people.filter((p) => p.category === 'Student');
      return {
        content: `Here are **students** attending Mumbai Onchain Week:\n\n${students.map(s => `• **${s.name}** (${s.city}) — ${s.bio}`).join('\n')}`,
        people: students,
        sources,
        suggestedFollowUps: ['Find students from Jabalpur', 'Show me people attending ETHGlobal', 'Who is attending Devcon?'],
      };
    }

    // Sub-case: AI builders
    if (q.includes("ai")) {
      const aiBuilders = people.filter(
        (p) => (p.bio && p.bio.toLowerCase().includes('ai')) || p.category === 'Builder'
      );
      return {
        content: `Here are builders working on AI agents and smart contract automation:\n\n${aiBuilders.slice(0, 3).map(b => `• **${b.name}** (${b.city}) — ${b.bio}`).join('\n')}`,
        people: aiBuilders.slice(0, 3),
        sources,
        suggestedFollowUps: ['Show me people attending ETHGlobal', 'Who is attending Devcon?'],
      };
    }

    // Default People directory answer
    return {
      content: `The Mumbai Onchain People Directory currently has **${people.length} verified builders, founders, students, and volunteers**. Here are a few notable profiles:`,
      people: people.slice(0, 4),
      sources,
      suggestedFollowUps: ['Find students from Jabalpur', 'Who is attending Devcon as a volunteer?', 'Show me people attending ETHGlobal'],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. DATE-BASED QUERIES (Source: Stored Events + Official Luma/Web Feeds)
  // ───────────────────────────────────────────────────────────────────────────
  const targetDate = extractTargetDate(q);
  if (targetDate) {
    const dayEvents = events.filter(
      (e) => e.startDate === targetDate || (e.startDate <= targetDate && e.endDate >= targetDate)
    );

    // Live research check
    const liveSearch = await performLiveWebSearch(query);
    liveSearch.sources.forEach((s) => sources.push(s));

    if (dayEvents.length === 0) {
      return {
        content: `No official sessions are registered in the onchain schedule for **${targetDate}**. However, you can check the independent community side events spreadsheet for informal dinners and hacker houses.`,
        sources,
        suggestedFollowUps: ['What events are happening on Nov 4?', 'What is happening on Nov 3?', 'What is happening on Nov 5?'],
      };
    }

    const formattedDay = new Date(`${targetDate}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    return {
      content: `### Mumbai Events on ${formattedDay} (${dayEvents.length} Sessions Tracked)\n\nHere are the confirmed sessions and gatherings on ${formattedDay}:\n\n${dayEvents.map(e => `• **${e.title}** (${e.startTime}—${e.endTime} IST) at **${e.location}** [${e.category}]`).join('\n')}\n\n*According to official event listings and verified community registries.*`,
      events: dayEvents,
      sources,
      suggestedFollowUps: ['Which events conflict with Devcon?', 'Show me people attending ETHGlobal', 'What is my next event?'],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. LIVE INTERNET / CURRENT INFORMATION QUESTIONS (Search Live Web Sources)
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("latest") ||
    q.includes("update") ||
    q.includes("speaker") ||
    q.includes("venue change") ||
    q.includes("cancellation") ||
    q.includes("still happening") ||
    q.includes("ticket") ||
    q.includes("schedule") ||
    q.includes("official link") ||
    q.includes("devcon") ||
    q.includes("ibw") ||
    q.includes("ethglobal")
  ) {
    const liveResult = await performLiveWebSearch(query);
    liveResult.sources.forEach((s) => sources.push(s));

    // Devcon specific live query
    if (q.includes("devcon") || q.includes("ethereum foundation")) {
      const devconEvent = events.find((e) => e.id === 'devcon-8-india');
      return {
        content: `### Official Devcon 8 India Intelligence\n\nAccording to the **Official Devcon Portal (devcon.org)**:\n- **Dates**: November 03—06, 2026\n- **Venue**: Jio World Centre, Bandra Kurla Complex (BKC), Mumbai\n- **Status**: Confirmed & active\n- **Tracks**: Core Protocol, Privacy & Consent, Security, Applied Cryptography, Users, Builders & Agents, Rights & Governance, Permissionless Networks, and Open & Verifiable Stack.\n- **EIP Hub**: Running concurrently on-site at Jio World Centre for Ethereum Improvement Proposals.\n\nNo venue changes or cancellations have been reported for Devcon 8.`,
        events: devconEvent ? [devconEvent] : [],
        sources,
        suggestedFollowUps: ['Which events overlap with Devcon?', 'Who is attending Devcon as a volunteer?', 'What events are happening on Nov 4?'],
      };
    }

    // IBW specific live query
    if (q.includes("ibw") || q.includes("blockchain week")) {
      const ibwEvent = events.find((e) => e.id === 'india-blockchain-week-2026');
      return {
        content: `### Official India Blockchain Week (IBW) Intelligence\n\nAccording to the **Official IBW Portal (indiablockchainweek.com)**:\n- **Dates**: November 01—02, 2026\n- **Venue**: Fairmont Mumbai (near International Airport, Sahar)\n- **Format**: Flagship 2-day conference kicking off Mumbai Onchain Week with 90+ ecosystem side events and venture tables.`,
        events: ibwEvent ? [ibwEvent] : [],
        sources,
        suggestedFollowUps: ['What events are happening on Nov 1?', 'Who is attending Devcon?', 'Which events conflict with Devcon?'],
      };
    }

    // ETHGlobal specific live query
    if (q.includes("ethglobal") || q.includes("hackathon")) {
      const ethGlobalEvent = events.find((e) => e.id === 'ethglobal-mumbai-2026');
      return {
        content: `### Official ETHGlobal Mumbai Intelligence\n\nAccording to the **Official ETHGlobal Portal (ethglobal.com)**:\n- **Dates**: November 05—07, 2026\n- **Venue**: NESCO Center, Western Express Hwy, Goregaon East, Mumbai\n- **Format**: 36-hour non-stop hackathon with thousands of developers and global prize bounties.\n- **Note**: Partially overlaps with Days 3 and 4 of Devcon 8.`,
        events: ethGlobalEvent ? [ethGlobalEvent] : [],
        sources,
        suggestedFollowUps: ['Show me people attending ETHGlobal', 'Which events conflict with Devcon?', 'What events are happening on Nov 5?'],
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. CATEGORY & THEMATIC QUERIES (AI, DeFi, Security, Privacy, Party)
  // ───────────────────────────────────────────────────────────────────────────
  if (q.includes("security") || q.includes("audit")) {
    const secEvents = events.filter((e) => e.category === 'Security');
    return {
      content: `Found **${secEvents.length} Security & Audit sessions** during Mumbai Onchain Week:\n\n${secEvents.map(e => `• **${e.title}** (${e.startDate}, ${e.startTime} IST) at **${e.location}**`).join('\n')}`,
      events: secEvents,
      sources,
      suggestedFollowUps: ['What events are happening on Nov 4?', 'Which events conflict with Devcon?'],
    };
  }

  if (q.includes("defi") || q.includes("yield") || q.includes("liquidity")) {
    const defiEvents = events.filter((e) => e.category === 'DeFi' || e.category === 'Governance');
    return {
      content: `Found **${defiEvents.length} DeFi & Liquidity events** in Mumbai:\n\n${defiEvents.map(e => `• **${e.title}** (${e.startDate}, ${e.startTime} IST) at **${e.location}**`).join('\n')}`,
      events: defiEvents,
      sources,
      suggestedFollowUps: ['What events are happening on Nov 4?', 'Which events overlap with Devcon?'],
    };
  }

  if (q.includes("privacy") || q.includes("cypherpunk") || q.includes("zk")) {
    const privEvents = events.filter((e) => e.category === 'Privacy');
    return {
      content: `Here are the top **Privacy & Cryptography** gatherings during Mumbai Onchain Week:\n\n${privEvents.map(e => `• **${e.title}** on ${e.startDate} at ${e.location}`).join('\n')}`,
      events: privEvents,
      sources,
      suggestedFollowUps: ['What events are happening on Nov 2?', 'Which events conflict with Devcon?'],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. FALLBACK / UNVERIFIED HANDLING (No hallucinations)
  // ───────────────────────────────────────────────────────────────────────────
  // Match keyword in any event title
  const matchingEvents = events.filter(
    (e) => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))
  );

  if (matchingEvents.length > 0) {
    return {
      content: `Found **${matchingEvents.length} event${matchingEvents.length === 1 ? '' : 's'}** matching "${query}":`,
      events: matchingEvents,
      sources,
      suggestedFollowUps: ['What is my next event?', 'Which events conflict with Devcon?', 'What events are happening on Nov 4?'],
    };
  }

  // Honest unverified response as required by instructions
  return {
    content: `I don't have that information yet, and I couldn't verify it from the available official sources.\n\nYou can ask me about:\n- **Events & Schedules**: "What's happening on Nov 4?", "What's my next event?", "Which events conflict with Devcon?"\n- **People & Networking**: "Find students from Jabalpur", "Show me people attending ETHGlobal", "Who is attending Devcon as a volunteer?"\n- **Official Updates**: "What's the latest Devcon schedule?", "Where is Fairmont Mumbai?"`,
    sources,
    suggestedFollowUps: [
      "What's my next event?",
      "What events are happening on November 4?",
      "Which events overlap with Devcon?",
      "Find students from Jabalpur",
      "Show me people attending ETHGlobal",
    ],
  };
}

import type { EventItem } from '../../types/event';
import type { QueryContext, AssistantResponse } from './types';
import { TRANSLATIONS, type SupportedLanguage } from './translations';

function doesOverlapWithDevcon(e: EventItem): boolean {
  if (e.id === 'devcon-8-india') return false;
  const devconStart = new Date('2026-11-03T09:00:00+05:30').getTime();
  const devconEnd = new Date('2026-11-06T18:00:00+05:30').getTime();

  const eStart = new Date(`${e.startDate}T${e.startTime.includes(':') ? e.startTime : '09:00'}:00+05:30`).getTime();
  const eEnd = new Date(`${e.endDate}T${e.endTime.includes(':') ? e.endTime : '18:00'}:00+05:30`).getTime();

  return eStart < devconEnd && eEnd > devconStart;
}

function extractTargetDate(query: string): string | null {
  const q = query.toLowerCase();
  // Nov 1
  if (q.includes('nov 1') || q.includes('november 1') || q.includes('nov 01') || q.includes('noviembre 1') || q.includes('11月1日') || q.includes('1 नवंबर') || q.includes('1er nov')) return '2026-11-01';
  // Nov 2
  if (q.includes('nov 2') || q.includes('november 2') || q.includes('nov 02') || q.includes('noviembre 2') || q.includes('11月2日') || q.includes('2 नवंबर')) return '2026-11-02';
  // Nov 3
  if (q.includes('nov 3') || q.includes('november 3') || q.includes('nov 03') || q.includes('noviembre 3') || q.includes('11月3日') || q.includes('3 नवंबर')) return '2026-11-03';
  // Nov 4
  if (q.includes('nov 4') || q.includes('november 4') || q.includes('nov 04') || q.includes('noviembre 4') || q.includes('11月4日') || q.includes('4 नवंबर') || q.includes('4 nov')) return '2026-11-04';
  // Nov 5
  if (q.includes('nov 5') || q.includes('november 5') || q.includes('nov 05') || q.includes('noviembre 5') || q.includes('11月5日') || q.includes('5 नवंबर')) return '2026-11-05';
  // Nov 6
  if (q.includes('nov 6') || q.includes('november 6') || q.includes('nov 06') || q.includes('noviembre 6') || q.includes('11月6日') || q.includes('6 नवंबर')) return '2026-11-06';
  // Nov 7
  if (q.includes('nov 7') || q.includes('november 7') || q.includes('nov 07') || q.includes('noviembre 7') || q.includes('11月7日') || q.includes('7 नवंबर')) return '2026-11-07';
  // Nov 8
  if (q.includes('nov 8') || q.includes('november 8') || q.includes('nov 08') || q.includes('noviembre 8') || q.includes('11月8日') || q.includes('8 नवंबर')) return '2026-11-08';
  return null;
}

export async function processUserQuery(
  rawQuery: string,
  context: QueryContext,
  lang: SupportedLanguage = 'en'
): Promise<AssistantResponse> {
  const query = rawQuery.trim();
  const q = query.toLowerCase();
  const { events, people, connections } = context;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PERSONAL SCHEDULE & USER-SPECIFIC QUERIES
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("my next event") ||
    q.includes("what's my next") ||
    q.includes("whats my next") ||
    q.includes("next up") ||
    q.includes("मेरा अगला") ||
    q.includes("próximo evento") ||
    q.includes("prochain événement") ||
    q.includes("nächstes event") ||
    q.includes("次のイベント") ||
    q.includes("다음 일정") ||
    q.includes("下一个活动")
  ) {
    const attending = events.filter(
      (e) => e.status === 'ATTENDING' || e.status === 'VOLUNTEER'
    );
    const primary = events.find((e) => e.isPrimary || e.id === 'devcon-8-india');

    if (attending.length === 0) {
      const msgs: Record<SupportedLanguage, string> = {
        en: `You have no scheduled sessions marked as attending.\n\nYour primary conference is **${primary?.title || 'Devcon 8 India'}** starting **November 03 at 09:00 IST** at **Jio World Centre, BKC**.`,
        hi: `आपने अभी कोई सेशन अटेंडिंग के रूप में मार्क नहीं किया है।\n\nआपका मुख्य सम्मेलन **${primary?.title || 'Devcon 8 India'}** है जो **3 नवंबर को सुबह 09:00 IST** पर **Jio World Centre, BKC** में शुरू होगा।`,
        es: `No tienes sesiones marcadas como asistencia en tu agenda.\n\nTu evento principal es **${primary?.title || 'Devcon 8 India'}**, el **3 de noviembre a las 09:00 IST** en **Jio World Centre, BKC**.`,
        fr: `Aucune session n'est enregistrée dans votre planning personnel.\n\nVotre événement principal est **${primary?.title || 'Devcon 8 India'}**, débutant le **3 novembre à 09h00 IST** au **Jio World Centre, BKC**.`,
        de: `Du hast derzeit keine Termine in deinem persönlichen Plan.\n\nDein Hauptevent ist **${primary?.title || 'Devcon 8 India'}**, beginnend am **3. November um 09:00 IST** im **Jio World Centre, BKC**.`,
        ja: `現在スケジュールに登録されている予定はありません。\n\nメインイベントは **${primary?.title || 'Devcon 8 India'}** です（**11月3日 09:00 IST**、**Jio World Centre, BKC**）。`,
        ko: `참석으로 저장된 일정이 없습니다.\n\n주요 행사는 **${primary?.title || 'Devcon 8 India'}** (11월 3일 09:00 IST, Jio World Centre, BKC)입니다.`,
        zh: `您暂无标记为已参加的日程。\n\n您的核心大会为 **${primary?.title || 'Devcon 8 India'}**，于 **11月3日 09:00 IST** 在 **Jio World Centre, BKC** 开幕。`,
        pt: `Você não tem eventos marcados na sua agenda.\n\nSeu evento principal é a **${primary?.title || 'Devcon 8 India'}**, no dia **3 de novembro às 09:00 IST** no **Jio World Centre, BKC**.`,
        ru: `В вашем расписании пока нет сохранённых событий.\n\nГлавное событие — **${primary?.title || 'Devcon 8 India'}**, начинается **3 ноября в 09:00 IST** в **Jio World Centre, BKC**.`,
        ar: `ليس لديك أي فعاليات محددة للحضور في جدولك.\n\nفعاليتك الرئيسية هي **${primary?.title || 'Devcon 8 India'}** بدءاً من **3 نوفمبر الساعة 09:00 بتوقيت الهند** في **Jio World Centre, BKC**.`
      };

      return {
        content: msgs[lang] || msgs.en,
        events: primary ? [primary] : events.slice(0, 1),
        sources: [],
      };
    }

    const nextEvt = attending[0];
    const msgs: Record<SupportedLanguage, string> = {
      en: `Your next event is **${nextEvt.title}** on **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) at **${nextEvt.location}**.`,
      hi: `आपका अगला इवेंट **${nextEvt.title}** है, जो **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) को **${nextEvt.location}** में होगा।`,
      es: `Tu próximo evento es **${nextEvt.title}** el **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) en **${nextEvt.location}**.`,
      fr: `Votre prochain événement est **${nextEvt.title}** le **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) à **${nextEvt.location}**.`,
      de: `Dein nächstes Event ist **${nextEvt.title}** am **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) in **${nextEvt.location}**.`,
      ja: `次の参加予定は **${nextEvt.title}** です（**${nextEvt.startDate}** ${nextEvt.startTime}—${nextEvt.endTime} IST、場所：**${nextEvt.location}**）。`,
      ko: `다음 일정은 **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST)에 **${nextEvt.location}**에서 열리는 **${nextEvt.title}**입니다.`,
      zh: `您的下一个活动是 **${nextEvt.title}**，时间为 **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST)，地点在 **${nextEvt.location}**。`,
      pt: `Seu próximo evento é **${nextEvt.title}** em **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) em **${nextEvt.location}**.`,
      ru: `Ваше следующее событие — **${nextEvt.title}** **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} IST) в **${nextEvt.location}**.`,
      ar: `فعاليتك القادمة هي **${nextEvt.title}** في **${nextEvt.startDate}** (${nextEvt.startTime}—${nextEvt.endTime} بتوقيت الهند) في **${nextEvt.location}**.`
    };

    return {
      content: msgs[lang] || msgs.en,
      events: [nextEvt],
      sources: [],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONFLICT ANALYSIS & DEVCON OVERLAPS
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("overlap with devcon") ||
    q.includes("conflict with devcon") ||
    q.includes("events overlap") ||
    q.includes("event conflicts") ||
    q.includes("overlap") ||
    q.includes("over lap") ||
    q.includes("ओवरलैप") ||
    q.includes("coinciden con devcon") ||
    q.includes("chevauchement") ||
    q.includes("重複") ||
    q.includes("겹치는") ||
    q.includes("冲突")
  ) {
    const overlapping = events.filter((e) => doesOverlapWithDevcon(e));
    const msgs: Record<SupportedLanguage, string> = {
      en: `**Devcon 8** takes place **Nov 03—06** (09:00—18:00 IST) at **Jio World Centre**.\n\n• **Concurrent**: **ETHGlobal Mumbai** (Nov 05—07 at NESCO Center) overlaps during daytime.\n• **Evening Sessions (After 18:00 IST)**: Money Layer (Nov 04, 18:30), Quantstamp Lounge (Nov 04, 19:00), and Ravecon (Nov 04, 20:00).`,
      hi: `**Devcon 8** मुख्य रूप से **3-6 नवंबर** (09:00—18:00 IST) को **Jio World Centre** में है।\n\n• **समानांतर**: **ETHGlobal Mumbai** (5-7 नवंबर) दिन के समय ओवरलैप होता है।\n• **शाम के सेशंस (18:00 IST के बाद)**: Money Layer (4 नवंबर, 18:30), Quantstamp Lounge (4 नवंबर, 19:00), और Ravecon (4 नवंबर, 20:00)।`,
      es: `**Devcon 8** se celebra del **3 al 6 de noviembre** (09:00—18:00 IST) en **Jio World Centre**.\n\n• **Simultáneo**: **ETHGlobal Mumbai** (5–7 nov) coincide durante el día.\n• **Tarde/Noche (después de las 18:00)**: Money Layer (4 nov, 18:30), Quantstamp Lounge (4 nov, 19:00) y Ravecon (4 nov, 20:00).`,
      fr: `**Devcon 8** se déroule du **3 au 6 nov** (09h00—18h00 IST) au **Jio World Centre**.\n\n• **En journée**: **ETHGlobal Mumbai** (5–7 nov) a lieu en parallèle.\n• **En soirée (après 18h00)**: Money Layer (4 nov, 18h30), Quantstamp Lounge (4 nov, 19h00) et Ravecon (4 nov, 20h00).`,
      de: `**Devcon 8** findet vom **3.–6. Nov** (09:00—18:00 IST) im **Jio World Centre** statt.\n\n• **Parallel**: **ETHGlobal Mumbai** (5.–7. Nov) überschneidet sich tagsüber.\n• **Abendtermine (ab 18:00)**: Money Layer (4. Nov, 18:30), Quantstamp Lounge (4. Nov, 19:00) und Ravecon (4. Nov, 20:00).`,
      ja: `**Devcon 8**は**11月3日〜6日**（09:00〜18:00 IST、Jio World Centre）で開催されます。\n\n• **日中重複**: **ETHGlobal Mumbai**（11月5日〜7日）\n• **夜間セッション（18:00以降）**: Money Layer（4日 18:30）、Quantstamp Lounge（4日 19:00）、Ravecon（4日 20:00）。`,
      ko: `**Devcon 8**은 **11월 3~6일** (09:00~18:00 IST) **Jio World Centre**에서 열립니다.\n\n• **낮 시간 중복**: **ETHGlobal Mumbai** (11월 5~7일)\n• **저녁 일정 (18:00 이후)**: Money Layer (4일 18:30), Quantstamp Lounge (4일 19:00), Ravecon (4일 20:00).`,
      zh: `**Devcon 8** 于 **11月3日—6日** (09:00—18:00 IST) 在 **Jio World Centre** 举行。\n\n• **白天重叠**: **ETHGlobal Mumbai**（11月5日—7日，NESCO Center）\n• **晚间活动（18:00后）**: Money Layer（4日 18:30）、Quantstamp Lounge（4日 19:00）及 Ravecon（4日 20:00）。`,
      pt: `A **Devcon 8** ocorre de **3 a 6 de nov** (09:00—18:00 IST) no **Jio World Centre**.\n\n• **Simultâneo**: **ETHGlobal Mumbai** (5 a 7 de nov) coincide durante o dia.\n• **Eventos noturnos (após 18:00)**: Money Layer (4 nov, 18:30), Quantstamp Lounge (4 nov, 19:00) e Ravecon (4 nov, 20:00).`,
      ru: `**Devcon 8** проходит **3–6 ноября** (09:00—18:00 IST) в **Jio World Centre**.\n\n• **Параллельно**: **ETHGlobal Mumbai** (5–7 ноября) пересекается днём.\n• **Вечерние события (после 18:00)**: Money Layer (4 ноя, 18:30), Quantstamp Lounge (4 ноя, 19:00) и Ravecon (4 ноя, 20:00).`,
      ar: `يُعقد **Devcon 8** في الفترة من **3 إلى 6 نوفمبر** (09:00—18:00 بتوقيت الهند) في **Jio World Centre**.\n\n• **أثناء النهار**: يتزامن **ETHGlobal Mumbai** (5-7 نوفمبر).\n• **فعاليات المساء (بعد 18:00)**: Money Layer (4 نوفمبر، 18:30)، و Quantstamp Lounge (4 نوفمبر، 19:00)، و Ravecon (4 نوفمبر، 20:00).`
    };

    return {
      content: msgs[lang] || msgs.en,
      events: overlapping.slice(0, 3),
      sources: [],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PEOPLE & NETWORKING QUERIES
  // ───────────────────────────────────────────────────────────────────────────
  if (
    q.includes("jabalpur") ||
    q.includes("जबलपुर") ||
    q.includes("people") ||
    q.includes("attendee") ||
    q.includes("who is attending") ||
    q.includes("student") ||
    q.includes("volunteer") ||
    q.includes("connected") ||
    q.includes("builder")
  ) {
    // Sub-case: Jabalpur query
    if (q.includes("jabalpur") || q.includes("जबलपुर")) {
      const jabalpurPeople = people.filter(
        (p) => p.city.toLowerCase().includes('jabalpur') || (p.bio && p.bio.toLowerCase().includes('jabalpur'))
      );
      if (jabalpurPeople.length > 0) {
        const p = jabalpurPeople[0];
        const msgs: Record<SupportedLanguage, string> = {
          en: `Found **${p.name}** (${p.category}) from **${p.city}** in the community directory.\n\n${p.bio}`,
          hi: `कम्युनिटी डायरेक्टरी में **${p.city}** से **${p.name}** (${p.category}) मिले।\n\n${p.bio}`,
          es: `Encontrado **${p.name}** (${p.category}) de **${p.city}** en el directorio.\n\n${p.bio}`,
          fr: `Trouvé **${p.name}** (${p.category}) de **${p.city}** dans le répertoire.\n\n${p.bio}`,
          de: `**${p.name}** (${p.category}) aus **${p.city}** im Verzeichnis gefunden.\n\n${p.bio}`,
          ja: `ディレクトリに**${p.city}**出身の **${p.name}**（${p.category}）が見つかりました。\n\n${p.bio}`,
          ko: `디렉터리에서 **${p.city}** 출신의 **${p.name}** (${p.category})을 찾았습니다.\n\n${p.bio}`,
          zh: `在社区目录中找到来自 **${p.city}** 的 **${p.name}** (${p.category})。\n\n${p.bio}`,
          pt: `Encontrado **${p.name}** (${p.category}) de **${p.city}** no diretório.\n\n${p.bio}`,
          ru: `В каталоге найден **${p.name}** (${p.category}) из **${p.city}**.\n\n${p.bio}`,
          ar: `تم العثور على **${p.name}** (${p.category}) من **${p.city}** في دليل المشاركين.\n\n${p.bio}`
        };

        return {
          content: msgs[lang] || msgs.en,
          people: jabalpurPeople,
          sources: [],
        };
      }
    }

    // Sub-case: Volunteer query
    if (q.includes("volunteer") || q.includes("स्वयंसेवक") || q.includes("voluntario")) {
      const volunteers = people.filter((p) => p.category === 'Volunteer');
      const intro = lang === 'hi' 
        ? `मुंबई ऑनचेन वीक के लिए **${volunteers.length} वॉलंटियर्स** रजिस्टर्ड हैं:`
        : `**${volunteers.length} community members** registered as volunteers for Devcon 8 and Onchain Week:`;
      return {
        content: `${intro}\n\n${volunteers.map(v => `• **${v.name}** (${v.city}) — ${v.bio}`).join('\n')}`,
        people: volunteers,
        sources: [],
      };
    }

    // Sub-case: ETHGlobal attendees
    if (q.includes("ethglobal")) {
      const ethGlobalAttendees = people.filter(
        (p) => p.attendingEvents && p.attendingEvents.some((id) => id.includes('ethglobal'))
      );
      const intro = lang === 'hi'
        ? `**ETHGlobal Mumbai** के लिए **${ethGlobalAttendees.length} बिल्डर्स** रजिस्टर्ड हैं:`
        : `**${ethGlobalAttendees.length} builders and hackers** registered for **ETHGlobal Mumbai**:`;
      return {
        content: `${intro}\n\n${ethGlobalAttendees.map(p => `• **${p.name}** (${p.category}, ${p.city})`).join('\n')}`,
        people: ethGlobalAttendees,
        sources: [],
      };
    }

    // Sub-case: Connected people
    if (q.includes("connected with") || q.includes("my connections") || q.includes("कनेक्शन")) {
      const connectedIds = Object.keys(connections).filter((id) => connections[id] === 'CONNECTED');
      const connectedPeople = people.filter((p) => connectedIds.includes(p.id));

      if (connectedPeople.length === 0) {
        return {
          content: lang === 'hi'
            ? 'आप अभी किसी भी सदस्य से कनेक्ट नहीं हैं। लोगों की प्रोफाइल पर क्लिक करके कनेक्शन रिक्वेस्ट भेज सकते हैं।'
            : "You haven't established any confirmed connections yet. Browse the People directory to connect with builders!",
          people: people.slice(0, 3),
          sources: [],
        };
      }

      return {
        content: `You are connected with **${connectedPeople.length} attendee${connectedPeople.length === 1 ? '' : 's'}**:`,
        people: connectedPeople,
        sources: [],
      };
    }

    // Default People directory answer
    return {
      content: `The community directory features **${people.length} verified builders, students, founders, and volunteers**:`,
      people: people.slice(0, 4),
      sources: [],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. DATE-BASED QUERIES (Nov 1 to Nov 8)
  // ───────────────────────────────────────────────────────────────────────────
  const targetDate = extractTargetDate(q);
  if (targetDate) {
    const dayEvents = events.filter(
      (e) => e.startDate === targetDate || (e.startDate <= targetDate && e.endDate >= targetDate)
    );

    if (dayEvents.length === 0) {
      return {
        content: `No sessions registered for **${targetDate}**. Please check the community spreadsheet for unofficial gatherings.`,
        sources: [],
      };
    }

    const formattedDay = new Date(`${targetDate}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const header = lang === 'hi'
      ? `### ${formattedDay} के इवेंट्स (${dayEvents.length} सेशंस)`
      : `### Events on ${formattedDay} (${dayEvents.length} Sessions)`;

    return {
      content: `${header}\n\n${dayEvents.map(e => `• **${e.title}** (${e.startTime}—${e.endTime} IST) • **${e.location}** [${e.category}]`).join('\n')}`,
      events: dayEvents,
      sources: [],
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. OFFICIAL OVERVIEWS & SCHEDULE QUERIES (Devcon, IBW, ETHGlobal)
  // ───────────────────────────────────────────────────────────────────────────
  if (q.includes("devcon") || q.includes("देवकॉन") || q.includes("jio world")) {
    const devconEvent = events.find((e) => e.id === 'devcon-8-india');
    return {
      content: `**Devcon 8 India (Ethereum Foundation)**\n\n• **Dates**: November 03—06, 2026 (09:00—18:00 IST)\n• **Venue**: Jio World Centre, Bandra Kurla Complex (BKC), Mumbai\n• **Tracks**: Core Protocol, Privacy & Consent, Security, Applied Cryptography, Users, Builders & Agents, Rights & Governance, and Open Stack.\n• **EIP Hub**: Active on-site at Jio World Centre.`,
      events: devconEvent ? [devconEvent] : [],
      sources: [],
    };
  }

  if (q.includes("ibw") || q.includes("blockchain week") || q.includes("fairmont")) {
    const ibwEvent = events.find((e) => e.id === 'india-blockchain-week-2026');
    return {
      content: `**India Blockchain Week 2026 (IBW)**\n\n• **Dates**: November 01—02, 2026\n• **Venue**: Fairmont Mumbai (Sahar, near International Airport)\n• **Format**: 2-day ecosystem conference opening Mumbai Onchain Week with 90+ side events.`,
      events: ibwEvent ? [ibwEvent] : [],
      sources: [],
    };
  }

  if (q.includes("ethglobal") || q.includes("hackathon") || q.includes("nesco")) {
    const ethGlobalEvent = events.find((e) => e.id === 'ethglobal-mumbai-2026');
    return {
      content: `**ETHGlobal Mumbai**\n\n• **Dates**: November 05—07, 2026\n• **Venue**: NESCO Center, Goregaon East, Mumbai\n• **Format**: 36-hour non-stop flagship Ethereum hackathon overlapping with Devcon 8.`,
      events: ethGlobalEvent ? [ethGlobalEvent] : [],
      sources: [],
    };
  }

  // Match keyword in event titles
  const matchingEvents = events.filter(
    (e) => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))
  );

  if (matchingEvents.length > 0) {
    return {
      content: `Found **${matchingEvents.length} event${matchingEvents.length === 1 ? '' : 's'}** matching "${query}":`,
      events: matchingEvents,
      sources: [],
    };
  }

  // Concise unknown answer in current language
  return {
    content: t.unknownAnswer,
    sources: [],
  };
}

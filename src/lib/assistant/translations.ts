export type SupportedLanguage = 
  | 'en' 
  | 'hi' 
  | 'es' 
  | 'fr' 
  | 'de' 
  | 'ja' 
  | 'ko' 
  | 'zh' 
  | 'pt' 
  | 'ru' 
  | 'ar';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
];

export interface UiTranslations {
  assistantName: string;
  onlineStatus: string;
  placeholder: string;
  welcomeGreeting: string;
  clearChat: string;
  searching: string;
  matchingEvents: string;
  directoryAttendees: string;
  suggestedPrompt1: string;
  suggestedPrompt2: string;
  suggestedPrompt3: string;
  suggestedPrompt4: string;
  suggestedPrompt5: string;
  unknownAnswer: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, UiTranslations> = {
  en: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'AI Online',
    placeholder: 'Ask about schedule, Devcon, events, people...',
    welcomeGreeting: "Hello! I'm your Mumbai Onchain AI assistant. Ask me about Devcon 8, side events, your personal schedule, or people in the community.",
    clearChat: 'Clear conversation',
    searching: 'Searching schedule & live data...',
    matchingEvents: 'Events',
    directoryAttendees: 'Attendees',
    suggestedPrompt1: "What's my next event?",
    suggestedPrompt2: 'Events on Nov 4',
    suggestedPrompt3: 'Events overlapping with Devcon',
    suggestedPrompt4: 'Students from Jabalpur',
    suggestedPrompt5: 'Latest Devcon schedule',
    unknownAnswer: "I don't have that information yet. Please check the official portal or try asking about another event or attendee.",
  },
  hi: {
    assistantName: 'आस्क मुंबई (Ask Mumbai)',
    onlineStatus: 'ऑनलाइन',
    placeholder: 'शेड्यूल, देवकॉन, इवेंट्स या लोगों के बारे में पूछें...',
    welcomeGreeting: 'नमस्ते! मैं आपका मुंबई ऑनचेन AI असिस्टेंट हूँ। देवकॉन 8, साइड इवेंट्स, अपने शेड्यूल या डायरेक्टरी के लोगों के बारे में कुछ भी पूछें।',
    clearChat: 'चैट साफ करें',
    searching: 'शेड्यूल और डेटा खोजा जा रहा है...',
    matchingEvents: 'संबंधित इवेंट्स',
    directoryAttendees: 'सदस्य',
    suggestedPrompt1: 'मेरा अगला इवेंट कौन सा है?',
    suggestedPrompt2: '4 नवंबर के इवेंट्स',
    suggestedPrompt3: 'देवकॉन के साथ ओवरलैप होने वाले इवेंट्स',
    suggestedPrompt4: 'जबलपुर के छात्र',
    suggestedPrompt5: 'नवीनतम देवकॉन शेड्यूल',
    unknownAnswer: 'मेरे पास अभी यह जानकारी उपलब्ध नहीं है। कृपया आधिकारिक पोर्टल देखें या किसी अन्य इवेंट के बारे में पूछें।',
  },
  es: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'En línea',
    placeholder: 'Pregunta sobre horarios, Devcon, eventos o personas...',
    welcomeGreeting: '¡Hola! Soy tu asistente de IA para Mumbai Onchain. Pregúntame sobre Devcon 8, eventos paralelos, tu agenda o participantes.',
    clearChat: 'Borrar chat',
    searching: 'Buscando agenda y datos...',
    matchingEvents: 'Eventos',
    directoryAttendees: 'Participantes',
    suggestedPrompt1: '¿Cuál es mi próximo evento?',
    suggestedPrompt2: 'Eventos del 4 de noviembre',
    suggestedPrompt3: 'Eventos que coinciden con Devcon',
    suggestedPrompt4: 'Estudiantes de Jabalpur',
    suggestedPrompt5: 'Último programa de Devcon',
    unknownAnswer: 'Aún no dispongo de esa información. Por favor consulta la página oficial o prueba con otra pregunta.',
  },
  fr: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'En ligne',
    placeholder: 'Posez une question sur le planning, Devcon, les événements...',
    welcomeGreeting: "Bonjour ! Je suis votre assistant IA Mumbai Onchain. Posez-moi des questions sur Devcon 8, les side events ou les participants.",
    clearChat: 'Effacer la conversation',
    searching: 'Recherche en cours...',
    matchingEvents: 'Événements',
    directoryAttendees: 'Participants',
    suggestedPrompt1: 'Quel est mon prochain événement ?',
    suggestedPrompt2: 'Événements du 4 novembre',
    suggestedPrompt3: 'Événements en chevauchement avec Devcon',
    suggestedPrompt4: 'Étudiants de Jabalpur',
    suggestedPrompt5: 'Dernier programme de Devcon',
    unknownAnswer: "Je n'ai pas encore cette information. Veuillez vérifier les annonces officielles.",
  },
  de: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'Online',
    placeholder: 'Frage nach Zeitplan, Devcon, Events oder Teilnehmern...',
    welcomeGreeting: 'Hallo! Ich bin dein Mumbai Onchain KI-Assistent. Frage mich nach Devcon 8, Side-Events, deinem Zeitplan oder Kontakten.',
    clearChat: 'Chat löschen',
    searching: 'Suche Zeitplan & Live-Daten...',
    matchingEvents: 'Events',
    directoryAttendees: 'Teilnehmer',
    suggestedPrompt1: 'Was ist mein nächstes Event?',
    suggestedPrompt2: 'Events am 4. November',
    suggestedPrompt3: 'Events parallel zu Devcon',
    suggestedPrompt4: 'Studenten aus Jabalpur',
    suggestedPrompt5: 'Aktueller Devcon Zeitplan',
    unknownAnswer: 'Diese Information liegt mir noch nicht vor. Bitte prüfe die offizielle Website.',
  },
  ja: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'オンライン',
    placeholder: 'スケジュール、Devcon、イベント、参加者について質問...',
    welcomeGreeting: 'こんにちは！Mumbai Onchain AIアシスタントです。Devcon 8、サイドイベント、スケジュール、参加者についてお気軽にお尋ねください。',
    clearChat: 'チャット履歴を消去',
    searching: 'データとスケジュールを検索中...',
    matchingEvents: '該当イベント',
    directoryAttendees: '参加者',
    suggestedPrompt1: '次の参加予定イベントは？',
    suggestedPrompt2: '11月4日のイベント一覧',
    suggestedPrompt3: 'Devconと重複するイベント',
    suggestedPrompt4: 'ジャバルプルの学生',
    suggestedPrompt5: '最新のDevconスケジュール',
    unknownAnswer: 'その情報はまだ確認できていません。公式発表をご確認いただくか、他の質問をお試しください。',
  },
  ko: {
    assistantName: 'Ask Mumbai',
    onlineStatus: '온라인',
    placeholder: '일정, 데브콘, 사이드 이벤트, 참가자에 대해 질문하세요...',
    welcomeGreeting: '안녕하세요! Mumbai Onchain AI 어시스턴트입니다. Devcon 8, 사이드 이벤트, 개인 일정, 참가자 목록에 대해 질문해 주세요.',
    clearChat: '대화 삭제',
    searching: '일정 및 라이브 정보 검색 중...',
    matchingEvents: '이벤트 목록',
    directoryAttendees: '참가자',
    suggestedPrompt1: '내 다음 일정은?',
    suggestedPrompt2: '11월 4일 이벤트',
    suggestedPrompt3: 'Devcon과 겹치는 이벤트',
    suggestedPrompt4: '자발푸르 출신 학생',
    suggestedPrompt5: '최신 Devcon 일정',
    unknownAnswer: '아직 해당 정보를 찾을 수 없습니다. 공식 페이지를 확인해 주세요.',
  },
  zh: {
    assistantName: 'Ask Mumbai',
    onlineStatus: '在线',
    placeholder: '咨询日程、Devcon、周边活动或参会人员...',
    welcomeGreeting: '您好！我是您的 Mumbai Onchain AI 助手。欢迎咨询关于 Devcon 8、周边活动、个人日程或社区人员的任何问题。',
    clearChat: '清空聊天',
    searching: '正在查询日程与最新数据...',
    matchingEvents: '相关活动',
    directoryAttendees: '参会人员',
    suggestedPrompt1: '我的下一个活动是什么？',
    suggestedPrompt2: '11月4日有哪些活动？',
    suggestedPrompt3: '哪些活动与 Devcon 时间冲突？',
    suggestedPrompt4: '来自贾巴尔普尔的学生',
    suggestedPrompt5: '最新的 Devcon 日程安排',
    unknownAnswer: '我暂时没有该信息。请查看官方页面或尝试询问其他活动。',
  },
  pt: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'Online',
    placeholder: 'Pergunte sobre agenda, Devcon, eventos ou participantes...',
    welcomeGreeting: 'Olá! Sou seu assistente de IA para a Mumbai Onchain Week. Pergunte-me sobre a Devcon 8, eventos paralelos ou sua programação.',
    clearChat: 'Limpar conversa',
    searching: 'Buscando agenda e dados...',
    matchingEvents: 'Eventos',
    directoryAttendees: 'Participantes',
    suggestedPrompt1: 'Qual é o meu próximo evento?',
    suggestedPrompt2: 'Eventos em 4 de novembro',
    suggestedPrompt3: 'Eventos simultâneos à Devcon',
    suggestedPrompt4: 'Estudantes de Jabalpur',
    suggestedPrompt5: 'Programação mais recente da Devcon',
    unknownAnswer: 'Ainda não tenho essa informação. Por favor, consulte as fontes oficiais.',
  },
  ru: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'В сети',
    placeholder: 'Спросите о расписании, Devcon, событиях или участниках...',
    welcomeGreeting: 'Здравствуйте! Я ваш ИИ-ассистент Mumbai Onchain. Задавайте вопросы о Devcon 8, сайд-ивентах, вашем расписании и участниках.',
    clearChat: 'Очистить чат',
    searching: 'Поиск расписания и данных...',
    matchingEvents: 'События',
    directoryAttendees: 'Участники',
    suggestedPrompt1: 'Какое моё следующее событие?',
    suggestedPrompt2: 'События на 4 ноября',
    suggestedPrompt3: 'События, совпадающие с Devcon',
    suggestedPrompt4: 'Студенты из Джабалпура',
    suggestedPrompt5: 'Последнее расписание Devcon',
    unknownAnswer: 'У меня пока нет этой информации. Пожалуйста, проверьте официальный портал.',
  },
  ar: {
    assistantName: 'Ask Mumbai',
    onlineStatus: 'متصل',
    placeholder: 'اسأل عن الجدول الزمني، Devcon، الفعاليات، أو المشاركين...',
    welcomeGreeting: 'مرحباً! أنا مساعد الذكاء الاصطناعي لأسبوع Mumbai Onchain. يمكنك سؤالي عن Devcon 8، والفعاليات الجانبية، وجدولك الشخصي.',
    clearChat: 'مسح المحادثة',
    searching: 'جارٍ البحث في الجدول والبيانات...',
    matchingEvents: 'الفعاليات',
    directoryAttendees: 'المشاركون',
    suggestedPrompt1: 'ما هي فعاليتي القادمة؟',
    suggestedPrompt2: 'فعاليات 4 نوفمبر',
    suggestedPrompt3: 'فعاليات تتعارض مع Devcon',
    suggestedPrompt4: 'طلاب من جابالبور',
    suggestedPrompt5: 'أحدث جدول لـ Devcon',
    unknownAnswer: 'ليس لدي هذه المعلومات بعد. يُرجى التحقق من الموقع الرسمي.',
  }
};

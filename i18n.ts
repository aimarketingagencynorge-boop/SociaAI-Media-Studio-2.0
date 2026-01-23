
import { Language } from './types';

// Define translations for all supported languages
export const translations: Record<Language, any> = {
  PL: {
    heroTitle: "SociAI MediA Studio",
    heroSubtitle: "Twoja Autonomiczna Stacja Zarządzania Social Media. Niech AI będzie z Tobą.",
    startBtn: "ROZPOCZNIJ MISJĘ",
    continueBtn: "KONTYNUUJ MISJĘ",
    newMissionBtn: "NOWA MISJA",
    loginBtn: "ZALOGUJ SIĘ",
    startBadge: "🎁 500 kredytów ForceCredits na start",
    onboarding: {
      step1: "Skanowanie Portalu",
      step1Desc: "Podaj URL swojej strony, abyśmy mogli poznać DNA Twojej marki.",
      scanBtn: "SCAN UNIVERSE",
      scanPlaceholder: "https://twoja-strona.pl",
      scanning: [
        "Wysyłanie dronów skanujących...",
        "Ekstrakcja Meta-DNA...",
        "Analiza częstotliwości marki...",
        "Odkodowywanie wizualnego sygnatury..."
      ],
      confidence: "Confidence Score",
      step2: "DNA Marki",
      step3: "Tożsamość Wizualna",
      step4: "Głos Marki",
      step5: "Węzły Komunikacyjne",
      next: "DALEJ: DNA MARKI",
      finish: "URUCHOM SILNIKI",
    },
    nav: {
      dashboard: "Centrum Dowodzenia",
      planner: "Planer Misji",
      studio: "AI Studio",
      lab: "Media Lab",
      analytics: "Holograficzna Analityka",
      brandKit: "DNA Marki",
      store: "Fuel Station",
      settings: "Ustawienia Satelity"
    },
    planner: {
      title: "Kalendarz Operacji",
      planFirst: "Zaplanuj swoją pierwszą transmisję",
      month: "Miesiąc",
      week: "Tydzień",
      scheduled: "Zaplanowano",
      draft: "Szkic",
      failed: "Błąd"
    },
    settings: {
      title: "Łączność Satelitarna",
      zapierTitle: "Integracja Zapier (Webhook)",
      signalStrong: "Siła Sygnału: Silny",
      signalNone: "Brak Połączenia",
      linkSatellite: "Połącz Satelitę",
      disconnect: "Odłącz"
    },
    billing: {
      terminalTitle: "Bezpieczny Terminal Płatniczy",
      recent: "Ostatnie Transmisje",
      invoice: "Faktura",
      secureMsg: "Szyfrowanie Kwantowe: Aktywne"
    },
    studio: {
      title: "Transmiter AI Studio",
      platform: "Platforma",
      topic: "Temat / Cel Postu",
      yodaToggle: "TON MISTRZA YODY",
      generate: "GENERUJ TRANSMISJĘ",
      transmit: "TRANSMITUJ DO WSZECHŚWIATA",
      refine: "DOSTOSUJ",
      success: "Transmisja udana! Sygnał wysłany do Zapier.",
      costMsg: "Koszt: 10 FC"
    },
    lab: {
      title: "Media Lab",
      veoTitle: "Google Veo: Cinematic Engine",
      veoDesc: "Opisz swoją kinową reklamę",
      generateVeo: "GENERATE VEO AD",
      refine: "Dostosuj wizję (Refine)",
      refinePlaceholder: "Np: Zmień oświetlenie na neonowy fiolet...",
      nanoTitle: "Nano Banana: Brand Style",
      styleTransfer: "Zmień Styl Marki",
      actions: {
        removeBg: "Usuń Tło",
        neonGlow: "Dodaj Neon",
        cyberpunk: "Filtr Cyberpunk"
      },
      history: "Historia Wersji",
      success: "Transmisja wideo przygotowana do hiperprzestrzeni."
    },
    analytics: {
      title: "Misja: Logi Wyników",
      reach: "Zasięg Kwantowy",
      engagement: "Aktywność Załogi",
      status: "AI Analysis: Operational",
      caseStudy: "Case Study: DROPTREND",
      improvement: "+220% więcej zasięgów w 30 dni"
    },
    brandKit: {
      title: "Ship's DNA: Brand Kit",
      palette: "Ekstraktor Palety",
      logoVault: "Przechowalnia Logo",
      voiceProfile: "Profil Głosu",
      yodaActive: "Master Yoda: AKTYWNY"
    },
    store: {
      title: "Fuel Station",
      subtitle: "Doładuj swoje ForceCredits, aby kontynuować ekspansję.",
      buy: "KUP TERAZ"
    },
    dashboard: {
      missionControl: "MISJA TYGODNIA",
      genWeek: "GENERUJ PLAN TYGODNIOWY",
      cost: "Koszt: 50 FC",
      addPost: "Dodaj Post"
    },
    footer: "Powered by usetheforce.ai & Gemini",
    slogan: "May the AI be with you."
  },
  EN: {
    heroTitle: "SociAI MediA Studio",
    heroSubtitle: "Your Autonomous Social Media Control Station. May the AI be with you.",
    startBtn: "START MISSION",
    continueBtn: "CONTINUE MISSION",
    newMissionBtn: "NEW MISSION",
    loginBtn: "LOGIN",
    startBadge: "🎁 500 ForceCredits for start",
    onboarding: {
      step1: "Website Scan",
      step1Desc: "Enter your URL so we can discover your Brand DNA.",
      scanBtn: "SCAN UNIVERSE",
      scanPlaceholder: "https://your-site.com",
      scanning: ["Deploying drones...", "Extracting Meta-DNA...", "Analyzing Brand Frequency...", "Decoding visual signature..."],
      confidence: "Confidence Score",
      step2: "Brand DNA",
      step3: "Visual Identity",
      step4: "Brand Voice",
      step5: "Communication Hubs",
      next: "NEXT: BRAND DNA",
      finish: "IGNITE ENGINES",
    },
    nav: {
      dashboard: "Mission Control",
      planner: "Mission Planner",
      studio: "AI Studio",
      lab: "Media Lab",
      analytics: "Holographic Analytics",
      brandKit: "Brand DNA",
      store: "Fuel Station",
      settings: "Satellite Settings"
    },
    planner: {
      title: "Operation Calendar",
      planFirst: "Plan your first transmission",
      month: "Month",
      week: "Week",
      scheduled: "Scheduled",
      draft: "Draft",
      failed: "Failed"
    },
    settings: {
      title: "Satellite Connectivity",
      zapierTitle: "Zapier Integration (Webhook)",
      signalStrong: "Signal Strength: Strong",
      signalNone: "Disconnected",
      linkSatellite: "Link Satellite",
      disconnect: "Disconnect"
    },
    billing: {
      terminalTitle: "Secure Payment Terminal",
      recent: "Recent Transmissions",
      invoice: "Invoice",
      secureMsg: "Quantum Encryption: Active"
    },
    studio: {
      title: "AI Studio Transmitter",
      platform: "Platform",
      topic: "Topic / Goal",
      yodaToggle: "YODA TONE",
      generate: "GENERATE TRANSMISSION",
      transmit: "TRANSMIT TO UNIVERSE",
      refine: "REFINE",
      success: "Transmission Successful! Signal sent to Zapier.",
      costMsg: "Cost: 10 FC"
    },
    lab: {
      title: "Media Lab",
      veoTitle: "Google Veo: Cinematic Engine",
      veoDesc: "Describe your cinematic ad",
      generateVeo: "GENERATE VEO AD",
      refine: "Refine Vision",
      refinePlaceholder: "E.g.: Change lighting to neon purple...",
      nanoTitle: "Nano Banana: Brand Style",
      styleTransfer: "Style Transfer",
      actions: {
        removeBg: "Remove Background",
        neonGlow: "Add Neon",
        cyberpunk: "Cyberpunk Filter"
      },
      history: "Version History",
      success: "Video transmission prepared for hyperspace."
    },
    analytics: {
      title: "Mission: Result Logs",
      reach: "Quantum Reach",
      engagement: "Crew Engagement",
      status: "AI Analysis: Operational",
      caseStudy: "Case Study: DROPTREND",
      improvement: "+220% more reach in 30 days"
    },
    brandKit: {
      title: "Ship's DNA: Brand Kit",
      palette: "Palette Extractor",
      logoVault: "Logo Vault",
      voiceProfile: "Voice Profile",
      yodaActive: "Master Yoda: ACTIVE"
    },
    store: {
      title: "Fuel Station",
      subtitle: "Refuel your ForceCredits to continue your expansion.",
      buy: "BUY NOW"
    },
    dashboard: {
      missionControl: "WEEKLY MISSION",
      genWeek: "GENERATE WEEKLY PLAN",
      cost: "Cost: 50 FC",
      addPost: "Add Post"
    },
    footer: "Powered by usetheforce.ai & Gemini",
    slogan: "May the AI be with you."
  },
  // Adding NO as a placeholder/copy of EN to satisfy type Record<Language, any>
  NO: {
    heroTitle: "SociAI MediA Studio",
    heroSubtitle: "Din autonome kontrollstasjon for sosiale medier. Måtte AI være med deg.",
    startBtn: "START MISJON",
    continueBtn: "FORTSETT MISJON",
    newMissionBtn: "NY MISJON",
    loginBtn: "LOGG INN",
    startBadge: "🎁 500 ForceCredits for start",
    onboarding: {
      step1: "Nettstedsskanning",
      step1Desc: "Skriv inn din URL slik at vi kan oppdage din merkevare-DNA.",
      scanBtn: "SCAN UNIVERSE",
      scanPlaceholder: "https://ditt-nettsted.no",
      scanning: ["Distribuerer droner...", "Ekstraherer Meta-DNA...", "Analyserer merkevarefrekvens...", "Dekoder visuell signatur..."],
      confidence: "Confidence Score",
      step2: "Brand DNA",
      step3: "Visuell Identitet",
      step4: "Brand Voice",
      step5: "Kommunikasjonssentre",
      next: "NESTE: BRAND DNA",
      finish: "TENN MOTORER",
    },
    nav: {
      dashboard: "Misjonskontroll",
      planner: "Misjonsplanlegger",
      studio: "AI Studio",
      lab: "Media Lab",
      analytics: "Holografisk Analyse",
      brandKit: "Brand DNA",
      store: "Drivstoffstasjon",
      settings: "Satellittinnstillinger"
    },
    planner: {
      title: "Operasjonskalender",
      planFirst: "Planlegg din første sending",
      month: "Måned",
      week: "Uke",
      scheduled: "Planlagt",
      draft: "Utkast",
      failed: "Mislyktes"
    },
    settings: {
      title: "Satellitt-tilkobling",
      zapierTitle: "Zapier-integrasjon (Webhook)",
      signalStrong: "Signalstyrke: Sterk",
      signalNone: "Frakoblet",
      linkSatellite: "Koble til satellitt",
      disconnect: "Koble fra"
    },
    billing: {
      terminalTitle: "Sikker betalingsterminal",
      recent: "Nylige sendinger",
      invoice: "Faktura",
      secureMsg: "Kvante-kryptering: Aktiv"
    },
    studio: {
      title: "AI Studio-sender",
      platform: "Plattform",
      topic: "Emne / Mål",
      yodaToggle: "YODA TONE",
      generate: "GENERER SENDING",
      transmit: "SEND TIL UNIVERSET",
      refine: "FORBEDRE",
      success: "Sending vellykket! Signal sendt til Zapier.",
      costMsg: "Kostnad: 10 FC"
    },
    lab: {
      title: "Media Lab",
      veoTitle: "Google Veo: Cinematic Engine",
      veoDesc: "Beskriv din filmatiske annonse",
      generateVeo: "GENERER VEO-ANNONSE",
      refine: "Forbedre visjon",
      refinePlaceholder: "F.eks.: Endre belysning til neon-lilla...",
      nanoTitle: "Nano Banana: Brand Style",
      styleTransfer: "Stiloverføring",
      actions: {
        removeBg: "Fjern bakgrunn",
        neonGlow: "Legg til neon",
        cyberpunk: "Cyberpunk-filter"
      },
      history: "Versjonshistorikk",
      success: "Videosending forberedt for hyperrommet."
    },
    analytics: {
      title: "Misjon: Resultatlogger",
      reach: "Kvanterekkevidde",
      engagement: "Mannskapsengasjement",
      status: "AI-analyse: Operativ",
      caseStudy: "Case Study: DROPTREND",
      improvement: "+220% mer rekkevidde på 30 dager"
    },
    brandKit: {
      title: "Skipets DNA: Brand Kit",
      palette: "Palett-ekstraktor",
      logoVault: "Logohvelv",
      voiceProfile: "Stemmeprofil",
      yodaActive: "Mester Yoda: AKTIV"
    },
    store: {
      title: "Drivstoffstasjon",
      subtitle: "Fyll på ForceCredits for å fortsette utvidelsen.",
      buy: "KJØP NÅ"
    },
    dashboard: {
      missionControl: "UKENTLIG MISJON",
      genWeek: "GENERER UKEPLAN",
      cost: "Kostnad: 50 FC",
      addPost: "Legg til innlegg"
    },
    footer: "Drevet av usetheforce.ai & Gemini",
    slogan: "May the AI be with you."
  },
  // Adding RU as a placeholder/copy of EN to satisfy type Record<Language, any>
  RU: {
    heroTitle: "SociAI MediA Studio",
    heroSubtitle: "Ваша автономная станция управления социальными сетями. Да пребудет с вами ИИ.",
    startBtn: "НАЧАТЬ МИССИЮ",
    continueBtn: "ПРОДОЛЖИТЬ МИССИЮ",
    newMissionBtn: "НОВАЯ МИССИЯ",
    loginBtn: "ВОЙТИ",
    startBadge: "🎁 500 ForceCredits на старт",
    onboarding: {
      step1: "Сканирование сайта",
      step1Desc: "Введите ваш URL, чтобы мы могли определить ДНК вашего бренда.",
      scanBtn: "SCAN UNIVERSE",
      scanPlaceholder: "https://vash-sayt.ru",
      scanning: ["Развертывание дронов...", "Извлечение Мета-ДНК...", "Анализ частоты бренда...", "Декодирование визуальной подписи..."],
      confidence: "Confidence Score",
      step2: "ДНК бренда",
      step3: "Визуальная идентичность",
      step4: "Голос бренда",
      step5: "Коммуникационные узлы",
      next: "ДАЛЕЕ: ДНК БРЕНДА",
      finish: "ЗАПУСТИТЬ ДВИГАТЕЛИ",
    },
    nav: {
      dashboard: "Центр управления",
      planner: "Планировщик миссий",
      studio: "AI Studio",
      lab: "Media Lab",
      analytics: "Голографическая аналитика",
      brandKit: "ДНК бренда",
      store: "Заправочная станция",
      settings: "Настройки спутника"
    },
    planner: {
      title: "Календарь операций",
      planFirst: "Запланируйте свою первую трансляцию",
      month: "Месяц",
      week: "Неделя",
      scheduled: "Запланировано",
      draft: "Черновик",
      failed: "Ошибка"
    },
    settings: {
      title: "Спутниковая связь",
      zapierTitle: "Интеграция с Zapier (Webhook)",
      signalStrong: "Сила сигнала: Сильный",
      signalNone: "Отключено",
      linkSatellite: "Связать спутник",
      disconnect: "Отключить"
    },
    billing: {
      terminalTitle: "Безопасный платежный терминал",
      recent: "Последние трансляции",
      invoice: "Счет-фактура",
      secureMsg: "Квантовое шифрование: Активно"
    },
    studio: {
      title: "Передатчик AI Studio",
      platform: "Платформа",
      topic: "Тема / Цель",
      yodaToggle: "ТОН ЙОДЫ",
      generate: "ГЕНЕРИРОВАТЬ ТРАНСЛЯЦИЮ",
      transmit: "ПЕРЕДАТЬ ВО ВСЕЛЕННУЮ",
      refine: "УЛУЧШИТЬ",
      success: "Трансляция успешна! Сигнал отправлен в Zapier.",
      costMsg: "Стоимость: 10 FC"
    },
    lab: {
      title: "Media Lab",
      veoTitle: "Google Veo: Cinematic Engine",
      veoDesc: "Опишите вашу кинематографичную рекламу",
      generateVeo: "СОЗДАТЬ VEO РЕКЛАМУ",
      refine: "Улучшить видение",
      refinePlaceholder: "Напр.: Изменить освещение на неоновый фиолетовый...",
      nanoTitle: "Nano Banana: Brand Style",
      styleTransfer: "Перенос стиля",
      actions: {
        removeBg: "Удалить фон",
        neonGlow: "Добавить неон",
        cyberpunk: "Фильтр Киберпанк"
      },
      history: "История версий",
      success: "Видеопередача подготовлена к гиперпространству."
    },
    analytics: {
      title: "Миссия: Журналы результатов",
      reach: "Квантовый охват",
      engagement: "Вовлеченность экипажа",
      status: "ИИ-анализ: Работает",
      caseStudy: "Кейс: DROPTREND",
      improvement: "+220% охвата за 30 дней"
    },
    brandKit: {
      title: "ДНК корабля: Brand Kit",
      palette: "Извлечение палитры",
      logoVault: "Хранилище логотипов",
      voiceProfile: "Профиль голоса",
      yodaActive: "Мастер Йода: АКТИВЕН"
    },
    store: {
      title: "Заправочная станция",
      subtitle: "Пополните свои ForceCredits, чтобы продолжить расширение.",
      buy: "КУПИТЬ СЕЙЧАС"
    },
    dashboard: {
      missionControl: "НЕДЕЛЬНАЯ МИССИЯ",
      genWeek: "СОЗДАТЬ НЕДЕЛЬНЫЙ ПЛАН",
      cost: "Стоимость: 50 FC",
      addPost: "Добавить пост"
    },
    footer: "Работает на usetheforce.ai и Gemini",
    slogan: "May the AI be with you."
  }
};

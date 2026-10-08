# 🇮🇳 MUMBAI ONCHAIN — Devcon 8 & Web3 Ecosystem Command Center

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **01 — 08 NOVEMBER 2026 // MUMBAI, INDIA**  
> **ONE WEEK. ONE CITY. MULTIPLE ECOSYSTEMS.**

**Mumbai Onchain** is the premier personal Web3 command center, community directory, and live event navigator for **Devcon 8**, **India Blockchain Week (IBW)**, **ETHGlobal Mumbai**, hackathons, and side events across Mumbai.

Designed with a high-contrast editorial cyber-industrial aesthetic, Mumbai Onchain unites builders, founders, researchers, and creators worldwide with real-time schedule tracking, on-site QR networking, interactive map exploration, and an AI-powered assistant.

---

## 🌟 Key Highlights & Features

### 1. 📅 Master Schedule & Event Directory
- **Comprehensive Event Index**: Curated catalog of conferences, hackathons, demo days, dinners, and ecosystem side events (Ethereum, Solana, Polygon, Base, Arbitrum, Bitcoin, and more).
- **Interactive Multi-Filter System**: Filter by date (01–08 Nov), category, attendance status, and free-text search across titles, organizers, and locations.
- **Detailed Event Drawer**: Slide-out event dossier featuring exact IST timings, venue address, entry requirements, ticket links, and organizers.
- **Personal Status Tracking**: Mark events as *Attending*, *Interested*, or *Attended* with immediate local persistence.
- **Private Notes & Log**: Write personal agendas, notes, and key takeaways directly attached to any event.
- **One-Click Calendar Sync**: Export any session to Google Calendar, Apple iCal, or Microsoft Outlook with precise IST timezone conversion.

### 2. ⚡ Live Today Mode & Timeline
- **Real-Time IST Command Strip**: Live IST clock with dynamic indicators showing happening-now and upcoming events.
- **Day-by-Day Visual Timeline**: Chronological schedule blocks highlighting primary sessions and side events.
- **Conflict & Overlap Alerts**: Automatic detection and visual alerts when attending multiple overlapping events.
- **Marquee Telemetry Streams**: Real-time ticker streaming event headlines, speakers, and ecosystem news across the viewport.

### 3. 👥 People & Connect (Community Hub)
- **Global Attendee Directory**: Discover builders, core devs, founders, investors, and researchers attending Mumbai Onchain Week.
- **Custom Builder Profiles**: Create and edit your attendee profile with role, bios, ecosystem tags, X handle, Telegram, GitHub, and personal links.
- **Instant QR Profile Pass**: Generate your personal high-resolution QR profile card for instant physical networking at venues.
- **Live In-App Camera Scanner**: Built-in camera scanner (`jsQR`) to scan other attendees' QR passes instantly without leaving the app.
- **Connection Pipeline**: Manage your network with status badges (*Connected*, *Pending*, *Follow-up*) and quick access to social profiles.
- **People Marquee**: Live animated ticker featuring active community profiles directly on the home page.

### 4. 🗺️ Multi-Mode Interactive Map
- **Interactive Venue Locations**: Explore key event hubs across Mumbai (BKC, Lower Parel, Powai, Andheri, South Mumbai).
- **3D & 2D Visualization**: Switch between 3D Shining India Map, 3D Planet Globe, and 2D states map projections.
- **Venue Directions & Clusters**: Direct links to Google Maps navigation for each venue.

### 5. 🤖 "Ask Mumbai" Multilingual AI Assistant
- **Floating Intelligent Assistant**: Quick-access AI assistant floating throughout the platform.
- **Real-Time Knowledge Retrieval**: Instantly answer queries regarding schedules, speaker sessions, side events, venue directions, and attendees.
- **Multilingual Support**: Full support for 11 languages:
  - English (`en`), हिन्दी / Hindi (`hi`), Español (`es`), Français (`fr`), Deutsch (`de`), 日本語 / Japanese (`ja`), 한국어 / Korean (`ko`), 中文 / Chinese (`zh`), Português (`pt`), Русский (`ru`), العربية (`ar`).
- **Quick Query Prompts**: Instant one-tap suggestion chips for fast discovery.

### 6. 🪪 Devcon 8 ID Generator Integration
- Seamless navigation and deep-linking to the official [Devcon 8 ID Generator](https://devcon8-id.vercel.app/) web application.

### 7. 📓 My Mumbai (Personal Dashboard)
- **Personalized Schedule**: View only the events you have RSVP'd or saved.
- **Post-Event Recap**: Dedicated networking logs, contacts made, and follow-ups.
- **Export & Backup**: Export your customized itinerary and notes.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) | Component architecture & modern state primitives |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) | Strict static typing and interface definitions |
| **Build Tool** | [Vite 8](https://vite.dev/) | Lightning-fast development & production bundling |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS design tokens, tech-grid aesthetic, typography |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth UI transitions, drawer slides, and micro-interactions |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent SVG icon set |
| **QR Code Engine** | [qrcode](https://www.npmjs.com/package/qrcode) & [jsQR](https://github.com/cozmo/jsQR) | Generating profile QR passes and live camera scanning |
| **Timezone & Dates** | [date-fns](https://date-fns.org/) & `date-fns-tz` | Accurate Indian Standard Time (IST / UTC+5:30) calculations |
| **Database / Sync** | [Supabase](https://supabase.com/) (`@supabase/supabase-js`) | Cloud persistence readiness + LocalStorage offline-first fallback |
| **Linter** | [Oxlint](https://oxc.rs/) | Blazing-fast Rust-based JavaScript/TypeScript linter |

---

## 📁 Project Directory Structure

```text
mumbai-onchain/
├── public/
│   ├── assets/              # Static branding and media assets
│   ├── videos/              # Intro video streams
│   └── favicon.ico          # Platform favicon
├── src/
│   ├── components/          # Reusable React components
│   │   ├── AskMumbaiAssistant.tsx   # Floating AI assistant chatbot
│   │   ├── CalendarButton.tsx       # Export to Google/iCal/Outlook
│   │   ├── ConflictAlert.tsx        # Event schedule overlap detector
│   │   ├── Countdown.tsx            # Live event countdown ticker
│   │   ├── EditProfileModal.tsx     # Profile creation and editing
│   │   ├── EventCard.tsx            # Standard grid event card
│   │   ├── EventDrawer.tsx          # Comprehensive event details drawer
│   │   ├── EventFilters.tsx         # Date, ecosystem, and category filters
│   │   ├── Footer.tsx               # Platform footer & social links
│   │   ├── Hero.tsx                 # Home hero section & primary CTAs
│   │   ├── MapView.tsx              # Interactive 2D/3D map & globe
│   │   ├── MarqueeTicker.tsx        # Top telemetry broadcast stream
│   │   ├── MobileNav.tsx            # Mobile responsive bottom navigation bar
│   │   ├── MyMumbai.tsx             # Personal itinerary & notes dashboard
│   │   ├── Navbar.tsx               # Desktop header navigation
│   │   ├── NextEvent.tsx            # Next upcoming event spotlight
│   │   ├── NotesPanel.tsx           # Private event note-taking interface
│   │   ├── OnchainIntroVideo.tsx    # Official Mumbai Onchain video player
│   │   ├── PeopleDirectory.tsx      # Community attendees catalog & search
│   │   ├── PeopleMarquee.tsx        # Animated attendee ticker
│   │   ├── PersonCard.tsx           # Attendee card with connect options
│   │   ├── ProfileDrawer.tsx        # Slide-out attendee profile dossier
│   │   ├── ProfileQrModal.tsx       # User's sharable QR digital pass
│   │   ├── ProfileScannerModal.tsx  # In-browser QR camera scanner
│   │   ├── SideEvents.tsx           # Curated side events catalog
│   │   ├── Timeline.tsx             # Interactive chronological timeline
│   │   └── TodayMode.tsx            # Dynamic "Today in Mumbai" schedule view
│   ├── data/
│   │   ├── events.ts        # Comprehensive database of Devcon 8 & side events
│   │   └── people.ts        # Initial community members and attendee profiles
│   ├── lib/
│   │   ├── assistant/       # AI Assistant query engine, Gemini client & translations
│   │   ├── store.ts         # Global app state management (tabs, filters, notes)
│   │   ├── usePeopleStore.ts# Profile state, networking connections & local storage
│   │   ├── calendar.ts      # .ics file generator and calendar URI builders
│   │   └── supabaseClient.ts# Supabase database client
│   ├── types/
│   │   ├── event.ts         # Event data structures, filters & statuses
│   │   └── person.ts        # Person profile, social handles & connections
│   ├── App.tsx              # Application root & view switcher
│   ├── main.tsx             # Vite React entrypoint
│   └── index.css            # Tailwind directives, fonts & custom utilities
├── package.json             # Project dependencies & scripts
├── vite.config.ts           # Vite configuration
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** (v9+) or **pnpm** or **yarn**
- **Git**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Najishanjum/mumbai-onchain.git
   cd mumbai-onchain
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 📦 Build & Deployment

### Production Build

To compile TypeScript and create an optimized production build:

```bash
npm run build
```

The compiled assets will be output to the `dist/` folder.

### Local Preview

To preview the production build locally:

```bash
npm run preview
```

### Linting & Code Quality

Run the high-performance Oxlint checker:

```bash
npm run lint
```

---

## 🌐 Community & Links

- **Devcon 8 Official**: [devcon.org](https://devcon.org/)
- **Devcon 8 ID Generator**: [devcon8-id.vercel.app](https://devcon8-id.vercel.app/)
- **Repository**: [github.com/Najishanjum/mumbai-onchain](https://github.com/Najishanjum/mumbai-onchain)

---

## 🤝 Contributing

Contributions to event listings, features, and optimizations are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>Built with ❤️ for the Global Web3 Community & Mumbai Onchain Week 2026</b>
</p>

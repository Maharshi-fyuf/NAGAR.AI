<div align="center">

# 🏙️ NagarAI

### AI-Powered Civic Issue Reporting Platform

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Google Maps](https://img.shields.io/badge/Google_Maps-34A853?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

**Vibe2Ship Hackathon 2026 · Coding Ninjas × Google for Developers**

[🌐 Live App](https://vibe2ship-94a7e.web.app) · [📋 Report an Issue](https://vibe2ship-94a7e.web.app/report) · [🗺️ View Map](https://vibe2ship-94a7e.web.app/map)

</div>

---

## 🚨 The Problem

India's cities face a massive civic infrastructure crisis — potholes, broken streetlights, garbage overflow, water leaks — yet reporting these issues requires navigating complex bureaucratic channels that most citizens never bother with. Issues go unreported, unverified, and unfixed.

**NagarAI solves this with a 3-step AI agent: photograph → analyze → act.**

---

## ✨ What NagarAI Does

A citizen photographs a civic problem. In seconds:

1. **Gemini Vision** identifies the issue type, severity, and responsible authority
2. **Google Maps** pins it on the live city map for the community to see
3. **Community verifies** via upvotes — 3 verifications auto-escalates the status
4. **AI drafts** a formal complaint letter ready to send to the municipal authority
5. **Duplicate detection** prevents spam by identifying similar nearby reports

---

## 🤖 The AI Agent Architecture

NagarAI runs a 3-step civic intelligence agent:

```
📸 PERCEIVE          🧠 REASON              📨 ACT
─────────────        ──────────────         ──────────────────
Gemini Vision   →    Route to authority  →  Generate complaint
analyzes photo       Geocode location        letter + map pin
identify type,       Check for duplicates    Community verify
severity             Spatial dedup           Auto-escalate
```

### Agentic Depth
- **Perception** — Gemini 2.5 Flash Vision analyzes uploaded civic issue photos
- **Reasoning** — AI determines issue category, severity, and the correct municipal authority
- **Spatial Intelligence** — Haversine distance algorithm + Gemini semantic comparison for duplicate detection
- **Action** — Generates formal complaint letters addressed to the correct authority
- **Community Loop** — Upvote verification system with auto-status escalation at 3 verifications

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| AI Vision | Gemini 2.5 Flash (image analysis + duplicate detection + complaint generation) |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Auth (Google Sign-In) |
| Maps | Google Maps JavaScript API |
| Geocoding | Google Geocoding API |
| Image Upload | imgBB API |
| Hosting | Firebase Hosting |

### Google Technologies Used
- ✅ **Gemini 2.5 Flash** — Vision analysis, duplicate detection, complaint letter generation
- ✅ **Firebase Firestore** — Real-time issue database
- ✅ **Firebase Auth** — Google Sign-In authentication
- ✅ **Firebase Hosting** — Production deployment
- ✅ **Google Maps JavaScript API** — Live issue map with custom markers
- ✅ **Google Geocoding API** — Reverse geocoding for issue addresses

---

## 🚀 Key Features

- **📸 AI Photo Analysis** — Upload any civic issue photo, Gemini identifies it in ~2 seconds
- **🗺️ Live City Map** — All reported issues pinned on Google Maps with category-colored markers
- **🔍 Duplicate Detection** — AI checks new reports against existing nearby issues to prevent spam
- **✅ Community Verification** — Upvote system; 3 upvotes auto-escalates issue status
- **📨 Complaint Letter Generator** — Formal letters drafted for the correct municipal authority
- **📊 City Dashboard** — Analytics showing issue distribution by category and status
- **🏆 Gamification** — Points system rewarding active citizens
- **🔒 Secure** — Firestore rules enforce auth, field validation, and category whitelisting

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Navbar.tsx
│   └── IssueCard.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── firebase.ts        # Firebase init + env validation
│   ├── gemini.ts          # Gemini Vision, duplicate check, complaint generation
│   ├── firestore.ts       # CRUD, spatial search, image upload
│   └── seedData.ts        # Demo data seeder
├── pages/
│   ├── LandingPage.tsx    # Parallax hero with animated city grid
│   ├── MapPage.tsx        # Google Maps with issue markers
│   ├── ReportPage.tsx     # 3-step report flow with AI analysis
│   ├── IssuePage.tsx      # Issue detail + complaint letter
│   ├── DashboardPage.tsx  # Analytics + charts
│   └── ProfilePage.tsx    # User stats + history
└── types/
    └── index.ts
```

---

## ⚙️ Local Setup

```bash
# Clone
git clone https://github.com/Maharshi-fyuf/NAGAR.AI.git
cd NAGAR.AI

# Install
npm install

# Environment variables
cp .env.example .env.local
# Fill in your keys (see below)

# Run
npm run dev
```

### Required Environment Variables

```env
VITE_GEMINI_API_KEY=          # Google AI Studio
VITE_GOOGLE_MAPS_API_KEY=     # Google Cloud Console (Maps + Geocoding APIs enabled)
VITE_FIREBASE_API_KEY=        # Firebase Console
VITE_FIREBASE_AUTH_DOMAIN=    # Firebase Console
VITE_FIREBASE_PROJECT_ID=     # Firebase Console
VITE_FIREBASE_STORAGE_BUCKET= # Firebase Console
VITE_FIREBASE_MESSAGING_SENDER_ID= # Firebase Console
VITE_FIREBASE_APP_ID=         # Firebase Console
VITE_IMGBB_API_KEY=           # api.imgbb.com
```

---

## 🔐 Security

- Firestore rules enforce authentication on all writes
- Field-level validation (type, length, category/severity whitelist) on `create`
- Input sanitization (HTML stripping + length caps) before Firestore writes
- Image compression before upload
- `.env.local` excluded from all commits

---

## 👨‍💻 Built By

**Maharshi** — First Year B.Tech Cybersecurity, Indus University, Ahmedabad

---

<div align="center">
Built with ❤️ for Ahmedabad · Vibe2Ship Hackathon 2026
</div>

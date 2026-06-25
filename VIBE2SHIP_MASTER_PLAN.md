# VIBE2SHIP — MASTER PLAN
## Problem Statement 2: Community Hero — Hyperlocal Problem Solver
### Project: NagarAI 🏙️
> *AI-powered civic issue reporting, verification, and resolution platform*

---

## CRITICAL CONSTRAINTS (READ FIRST)

| Constraint | Detail |
|---|---|
| Build Window | 22nd June 3PM → 29th June 2PM (6.5 days remaining as of 10PM June 22) |
| Submission Deadline | 29th June 2026, 2:00 PM — NO LATE ENTRIES |
| Deployment | **MUST be deployed via Google AI Studio / Firebase Hosting** |
| Mentor Session | 24th June 4PM–6PM — attend this, take notes |
| AI Mandatory | Gemini API (via Google AI Studio) must be core |
| Submission Links | Deployed App + GitHub Repo + Google Doc description |

---

## EVALUATION MATRIX (BUILD STRATEGY)

| Criteria | Weight | Our Strategy |
|---|---|---|
| Problem Solving & Impact | 20% | Real civic problem, affects every Indian city — demo with real Ahmedabad data |
| Agentic Depth | 20% | 3-step agent: Vision Analysis → Complaint Generation → Authority Routing |
| Innovation & Creativity | 20% | Gemini Vision on civic photos is unexplored; auto-complaint letter is unique |
| Usage of Google Technologies | 15% | Gemini + Maps + Firebase + Google Auth = max score |
| Product Experience & Design | 10% | Dark theme, glassmorphism, mobile-first — your strength |
| Technical Implementation | 10% | Clean architecture, Firestore schema, type-safe |
| Completeness & Usability | 5% | All core flows must work end-to-end |

**Insight:** Top 3 criteria = 60% of score. We win there, we win the hackathon.

---

## PRD — PRODUCT REQUIREMENTS DOCUMENT

### Problem Statement
Communities in India face broken streetlights, potholes, water leakages, garbage dumping, and infrastructure failures daily. Current reporting is fragmented — WhatsApp forwards, random phone calls, ignored complaints. There is no unified, trackable, AI-assisted system.

### Solution
**NagarAI** — A mobile-first web platform where citizens photograph civic issues, AI instantly categorizes and assesses severity, issues are pinned on a live Google Map, the community verifies them, and an AI agent automatically drafts a formal complaint letter ready to send to the relevant authority.

### Core User Personas
- **The Citizen Reporter** — sees a pothole, snaps a photo, reports in under 60 seconds
- **The Community Verifier** — validates existing reports by upvoting, adds photos
- **The Dashboard Viewer** — sees impact stats, most problematic zones, resolution rates

### Core User Journeys

#### Journey 1: Report an Issue (PRIMARY FLOW)
1. Open NagarAI → tap "Report Issue"
2. Upload/take photo
3. Gemini Vision analyzes: category + severity + description auto-filled
4. User confirms/edits, location auto-detected
5. Issue submitted → appears on map immediately

#### Journey 2: Browse the Map
1. Open map view → see colored markers by category
2. Tap marker → see issue card (photo, AI analysis, votes, status)
3. Upvote to verify → "I've seen this too"
4. Share via WhatsApp/link

#### Journey 3: Generate Complaint Letter (AGENTIC SHOWSTOPPER)
1. Open any verified issue
2. Tap "Generate Complaint" 
3. Gemini drafts a formal letter: issue details + location + severity + request for action
4. User can copy/download → send to authority email
5. Letter is stored against the issue

#### Journey 4: Impact Dashboard
1. See total issues reported, resolved, pending
2. Top 3 most-reported areas on map (heatmap)
3. Category breakdown chart
4. Resolution rate by category

### Feature Priority Matrix

#### P0 — Must Ship (Core MVP)
- [ ] Photo upload + Gemini Vision analysis (category, severity, description)
- [ ] Google Maps with issue markers (color-coded by severity)
- [ ] Issue reporting form (auto-filled by AI)
- [ ] Google Auth (sign in)
- [ ] Community upvoting / verification
- [ ] Issue status tracking (Reported → Verified → In Progress → Resolved)
- [ ] AI-generated formal complaint letter

#### P1 — Ship If Time Allows
- [ ] Impact dashboard with charts
- [ ] Hotspot detection ("3+ issues in 500m radius → High Priority Zone")
- [ ] User profile + points system (gamification lite)
- [ ] Filter/search on map

#### P2 — Mention in Doc, Don't Build
- [ ] Authority portal
- [ ] Push notifications
- [ ] SMS alerts

---

## TRD — TECHNICAL REQUIREMENTS DOCUMENT

### Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | You know this cold from Enchantment |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, dark theme |
| AI | **Gemini 1.5 Flash** via Google AI Studio API | Mandatory, Vision + Text |
| Maps | **Google Maps JavaScript API** | Mandatory Google tech, geo features |
| Backend | **Firebase Firestore** | Real-time, Google ecosystem, no server needed |
| Auth | **Firebase Auth** (Google Sign-In) | One-click, Google tech |
| Storage | **Firebase Storage** | Image uploads |
| Hosting | **Firebase Hosting** | Mandatory Google deployment |
| State | React Context + useState | Simple enough, no Redux needed |

### Why Firebase over Hono/Vercel this time
Firebase Hosting = Google ecosystem = counts toward "Google Technologies" score. Also no serverless cold start issues, real-time listeners built in, and easier deployment in 7 days.

### API Integrations

#### Gemini Vision (Image Analysis)
```typescript
// Input: base64 image
// Output: { category, severity, title, description, suggestedAuthority }

const analyzeIssue = async (imageBase64: string) => {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: `Analyze this civic issue image. Respond ONLY in JSON:
          {
            "category": "pothole|streetlight|garbage|water|drainage|other",
            "severity": "low|medium|high|critical",
            "title": "Brief issue title",
            "description": "2-3 sentence description of the issue",
            "suggestedAuthority": "Municipal Corporation|PWD|BRTS|Water Board|Other"
          }` }
        ]
      }]
    })
  });
};
```

#### Gemini Text (Complaint Letter Generation)
```typescript
// Input: issue object
// Output: formal complaint letter string

const generateComplaintLetter = async (issue: Issue) => {
  const prompt = `Write a formal complaint letter to ${issue.suggestedAuthority} about:
  Issue: ${issue.title}
  Location: ${issue.address}
  Description: ${issue.description}
  Severity: ${issue.severity}
  Reported: ${issue.reportedAt}
  Verified by ${issue.verificationCount} citizens
  
  Keep it professional, concise, and include a clear request for action within 7 days.`;
};
```

#### Google Maps Integration
```typescript
// Issue markers with severity colors
const SEVERITY_COLORS = {
  low: '#4ADE80',      // green
  medium: '#FACC15',   // yellow  
  high: '#FB923C',     // orange
  critical: '#EF4444'  // red
};
```

### Environment Variables Required
```
VITE_GEMINI_API_KEY=          # From Google AI Studio
VITE_GOOGLE_MAPS_API_KEY=     # From Google Cloud Console
VITE_FIREBASE_API_KEY=        # From Firebase project
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> ⚠️ SECURITY NOTE: All VITE_ env vars are client-exposed. For this hackathon, restrict Gemini API key by HTTP referrer in Google Cloud Console. Maps key restrict by referrer. Firebase has its own rules.

---

## DATABASE SCHEMA — FIRESTORE

### Collection: `issues`
```typescript
interface Issue {
  id: string;                    // auto-generated
  
  // Content
  title: string;                 // AI-generated or user-edited
  description: string;           // AI-generated or user-edited
  photoURL: string;              // Firebase Storage URL
  
  // AI Analysis
  category: 'pothole' | 'streetlight' | 'garbage' | 'water' | 'drainage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  aiConfidence: number;          // 0-1
  suggestedAuthority: string;    // AI-suggested authority
  complaintLetter?: string;      // Gemini-generated letter (lazy generated)
  
  // Location
  location: {
    lat: number;
    lng: number;
    address: string;             // Reverse geocoded
    ward?: string;               // City ward if available
    city: string;
  };
  
  // Status
  status: 'reported' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
  timeline: Array<{
    status: string;
    timestamp: Timestamp;
    note?: string;
  }>;
  
  // Community
  reportedBy: string;            // userId
  reportedAt: Timestamp;
  upvotes: string[];             // array of userIds
  verificationCount: number;     // = upvotes.length (denormalized for query)
  
  // Meta
  updatedAt: Timestamp;
}
```

### Collection: `users`
```typescript
interface User {
  id: string;                    // = Firebase Auth UID
  displayName: string;
  email: string;
  photoURL: string;
  
  // Gamification
  points: number;                // +10 report, +2 verify, +50 resolved
  reportCount: number;
  verifyCount: number;
  
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}
```

### Firestore Security Rules (Basic)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /issues/{issueId} {
      allow read: if true;  // public read
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.reportedBy ||
         onlyUpdatingVotes(request));
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### Firestore Indexes Required
- `issues` → `location.city` ASC + `reportedAt` DESC
- `issues` → `category` ASC + `severity` DESC
- `issues` → `status` ASC + `verificationCount` DESC

---

## UI/UX DESIGN DIRECTION

### Visual Identity
- **Theme:** Dark glassmorphism — dark navy/slate base, frosted glass cards
- **Accent:** Civic orange (#F97316) + Electric blue (#3B82F6)
- **Severity colors:** Green → Yellow → Orange → Red (consistent across map and UI)
- **Font:** Inter (system) for body, slightly heavier weight for headings
- **Feel:** Mobile-first, Instagram-like simplicity meets government seriousness

### Screen Architecture

```
App
├── / (Landing)              → Map view (public, no auth)
├── /report                  → Report flow (auth required)
│   ├── Step 1: Upload photo
│   ├── Step 2: AI analysis preview + confirm
│   └── Step 3: Location confirm + submit
├── /issue/:id               → Issue detail page
│   ├── Photo
│   ├── AI analysis badge
│   ├── Map mini-view
│   ├── Upvote button
│   ├── Status timeline
│   └── Generate Complaint button
├── /dashboard               → Impact stats
└── /profile                 → User reports + points
```

### Key Component: Report Step 2 (AI Analysis Preview)
This is the WOW moment. After photo upload:
- Show photo on left
- Show animated AI scanning effect (2 seconds)
- Reveal: Category badge, Severity badge, AI-written description
- User can edit any field
- CTA: "Confirm & Add Location"

This is where judges will say "damn, that's smooth."

### Map View Design
- Full-screen Google Map, dark mode map style
- Colored circle markers by severity
- Bottom sheet slides up on marker tap (mobile pattern)
- FAB (floating button) bottom-right: "+" to report
- Filter chips at top: All / Pothole / Streetlight / Garbage / Water

---

## APP FLOW DIAGRAM

```
[Landing - Map View]
        |
        ├── [Browse Issues] → tap marker → [Issue Detail]
        │                                       |
        │                                  [Upvote]
        │                                  [Generate Letter] → Gemini → [Letter Modal]
        │
        └── [Report Issue] → [Auth Check]
                                   |
                          [Google Sign In]
                                   |
                          [Upload Photo]
                                   |
                     [Gemini Vision Analysis]
                                   |
                     [Preview + Edit Form]
                                   |
                     [Location Pick (Maps)]
                                   |
                          [Submit → Firestore]
                                   |
                       [Success + Points Toast]
                                   |
                    [Issue visible on Map]


[Dashboard]
   ├── Total Issues / Resolved / Pending
   ├── Category Breakdown (Recharts pie)
   ├── Severity Heatmap
   └── Top 3 Hot Zones
```

---

## 7-DAY IMPLEMENTATION PLAN

### Day 1 — Tonight + Tomorrow (June 22 PM → June 23)
**Goal: Working scaffold + AI proof of concept**

Tonight (June 22, now → sleep):
- [ ] `npm create vite@latest nagarai -- --template react-ts`
- [ ] Install: tailwindcss, firebase, @googlemaps/js-api-loader, recharts, shadcn/ui
- [ ] Setup Firebase project (Firestore, Auth, Storage, Hosting)
- [ ] Get Gemini API key from AI Studio
- [ ] Test Gemini Vision with ONE hardcoded image → confirm it returns correct JSON
- [ ] Commit baseline

June 23 Full Day:
- [ ] Firebase Auth (Google Sign-In) working
- [ ] File upload → Firebase Storage → get URL working
- [ ] Gemini Vision integration complete (real endpoint, real response parsing)
- [ ] Firestore: write first issue document
- [ ] Basic routing (React Router): `/`, `/report`, `/issue/:id`
- [ ] Checkpoint: Can upload photo, AI analyzes it, stores in Firestore ✅

### Day 2 — June 23 (cont.) / June 24 morning
**Goal: Maps + Full Report Flow**

- [ ] Google Maps loaded with dark style
- [ ] Fetch issues from Firestore → render markers on map
- [ ] Tap marker → bottom sheet with issue preview
- [ ] Report flow Steps 1-3 fully working (photo → AI → location → submit)
- [ ] Issue appears on map immediately after submit
- [ ] Checkpoint: Full report → appears on map flow works end-to-end ✅

### Day 3 — June 24 (Mentor Session 4-6PM)
**Goal: Issue Detail + Upvoting + Attend Session**

Morning:
- [ ] `/issue/:id` page complete
- [ ] Upvote functionality (Firestore arrayUnion)
- [ ] Status timeline component
- [ ] User profile page (basic)

4-6 PM: **ATTEND MENTOR SESSION** — listen for Google tech recommendations, adjust plan if needed

Evening (after session):
- [ ] Apply any feedback from mentor session
- [ ] Complaint Letter generation (Gemini text) — modal with copy button
- [ ] Checkpoint: Full loop works: Report → View → Upvote → Generate Letter ✅

### Day 4 — June 25
**Goal: Dashboard + Polish Pass 1**

- [ ] Dashboard page: total counts, category chart (Recharts)
- [ ] Hotspot logic: group issues within 500m radius → "Hot Zone" badge
- [ ] User points system (update on report/verify)
- [ ] Map filters (by category, severity)
- [ ] Mobile responsiveness audit
- [ ] Checkpoint: All P0 features working ✅

### Day 5 — June 26
**Goal: Polish + Edge Cases**

- [ ] Loading states everywhere (skeletons, not spinners)
- [ ] Error states (AI failure fallback, network error)
- [ ] Empty states (no issues in area)
- [ ] Image compression before upload (performance)
- [ ] Dark mode map style finalized
- [ ] Demo data: seed 10-15 real Ahmedabad issues for judges

### Day 6 — June 27
**Goal: Final Features + Documentation**

- [ ] Severity heatmap on dashboard
- [ ] Auth-gated UX polish (clear CTAs for unauthenticated users)
- [ ] Gamification: points displayed on profile
- [ ] Start Google Doc description (fill all required fields)
- [ ] README.md on GitHub (setup, env vars, architecture)

### Day 7 — June 28-29
**Goal: SHIP**

June 28:
- [ ] `firebase deploy` — verify deployment works
- [ ] Test all flows on mobile (actual phone, not devtools)
- [ ] Fix any production bugs
- [ ] Finalize Google Doc description

June 29 (morning, before 2PM):
- [ ] Final smoke test on deployed URL
- [ ] Submit on BlockseBlock: Deployed URL + GitHub + Google Doc
- [ ] **DO NOT CLICK FINAL SUBMIT UNTIL ALL 3 LINKS ARE VERIFIED WORKING**
- [ ] Final Submit before 1:30 PM (30 min buffer)

---

## GOOGLE TECHNOLOGIES CHECKLIST
*(For the Google Doc submission)*

| Technology | Usage in NagarAI | Score Impact |
|---|---|---|
| **Gemini 1.5 Flash** (AI Studio) | Core AI: image analysis + complaint generation | Primary |
| **Google Maps JavaScript API** | Issue map, location picker, reverse geocoding | Primary |
| **Firebase Firestore** | Real-time database | Supporting |
| **Firebase Auth** | Google Sign-In | Supporting |
| **Firebase Storage** | Image hosting | Supporting |
| **Firebase Hosting** | App deployment (required) | Required |

6 Google technologies. That's 15% of score — maximum.

---

## AGENTIC DEPTH NARRATIVE
*(How to explain this to judges — this is your 20% score)*

NagarAI runs a **3-step civic AI agent** on every report:

1. **Perceive** — Gemini Vision analyzes the photograph: identifies the issue type, assesses severity, understands context
2. **Reason** — AI determines the appropriate authority, generates a structured complaint with all required fields
3. **Act** — Drafts a ready-to-send formal complaint letter that the citizen can dispatch directly

This is not a passive reminder system. NagarAI takes an unstructured photograph and converts it into a structured, routable, actionable government complaint — autonomously.

---

## PROJECT NAME OPTIONS
Pick one:
- **NagarAI** — Nagar (city in Hindi/Gujarati) + AI — clear, Indian, professional
- **CivicLens** — Photography angle, clean English
- **FixIt** — Simple, universal, catchy
- **JanSeva AI** — Jan Seva = Public Service in Hindi/Gujarati

**Recommendation: NagarAI** — stands out in a national Indian hackathon, judges will remember it, and it's professional.

---

## FIRST COMMANDS TO RUN RIGHT NOW

```bash
# 1. Create project
npm create vite@latest nagarai -- --template react-ts
cd nagarai

# 2. Install dependencies
npm install firebase @googlemaps/js-api-loader react-router-dom recharts lucide-react
npm install -D tailwindcss postcss autoprefixer @types/googlemaps
npx tailwindcss init -p

# 3. Initialize shadcn
npx shadcn@latest init

# 4. Create .env.local
touch .env.local

# 5. Git init
git init
git add .
git commit -m "feat: initial project scaffold"
```

Then go to:
1. https://aistudio.google.com → Get Gemini API Key
2. https://console.firebase.google.com → New project "nagarai" → Enable Firestore, Auth, Storage, Hosting
3. https://console.cloud.google.com → Enable Maps JavaScript API → Get key

---

## CHECKPOINT PROTOCOL
*(Your discipline from Enchantment — apply it here)*

Before moving to next phase, verify by actually running the app, not by reading agent output:

- [ ] **CP1:** Photo uploads to Firebase Storage and URL is retrievable ✅
- [ ] **CP2:** Gemini returns valid JSON from a real photo (not mocked) ✅
- [ ] **CP3:** Issue writes to Firestore and appears on Map ✅
- [ ] **CP4:** Upvote updates Firestore in real-time ✅
- [ ] **CP5:** Complaint letter generated and displayed ✅
- [ ] **CP6:** `firebase deploy` succeeds and deployed URL is publicly accessible ✅
- [ ] **CP7:** All flows work on mobile (not just desktop) ✅
- [ ] **CP8:** Submission URLs verified → Final Submit clicked ✅

---

*Document generated: 22nd June 2026 | Vibe2Ship Hackathon | NagarAI*

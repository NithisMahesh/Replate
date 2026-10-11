# 🍲 Replate — Hyper-Local Surplus Food Redistribution Network

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Build-Passing-brightgreen)]()

> **Replate** connects commercial kitchens, banquet halls, and grassroots food vendors with local NGO redistribution hubs using **biological decay-aware routing**, **zero-app public QR intake**, and **closed-loop portion lifecycle verification**.

---

## 📌 Table of Contents

- [Overview & The Urban Food Paradox](#-overview--the-urban-food-paradox)
- [Key Breakthrough Innovations](#-key-breakthrough-innovations)
- [Core Workflows & Modules](#-core-workflows--modules)
- [System Architecture](#-system-architecture)
- [Run Locally](#-run-locally)
- [Demo Accounts & Built-in Tools](#-demo-accounts--built-in-tools)
- [Next Steps (Deployment & GitHub Workflow)](#-next-steps-deployment--github-workflow)
- [Tech Stack](#-tech-stack)

---

## 🌍 Overview & The Urban Food Paradox

In cities like Madurai, commercial food establishments (hostel messes, bakeries, restaurants) prepare large batches daily. At closing time, wholesome freshly prepared meals are often discarded because commercial kitchens cannot store cooked food overnight. Concurrently, shelter residents and vulnerable communities face food insecurity just kilometers away.

Surplus food cannot be treated like generic parcel delivery:
1. **Biological Safety Limits**: Cooked hot food faces severe bacterial decay within 2 to 3 hours.
2. **High Friction**: Traditional charities require cumbersome app downloads or uncoordinated phone calls.
3. **Lack of Portion Traceability**: "Phantom donations" and unmonitored en-route shrinkage compromise accountability.

**Replate solves this through hyper-local perishable logistics, zero-login intake, and mathematical data consistency.**

---

## 🚀 Key Breakthrough Innovations

### 1. 🔄 Dual-Funnel Intake Engine
- **Enterprise / Commercial Kitchens**: Integrated across three distinct meal slots (**Breakfast**, **Lunch**, **Dinner**). Connects with POS/billing systems (e.g., Petpooja, POSist) to automatically calculate unsold surplus and predicts likely leftovers from 7-day rolling averages.
- **Zero-App / Zero-Login Public QR Portal (`/donate/:ngoId`)**: Printable QR posters (*"Scan to donate surplus food. No app. No login."*) for wedding halls, caterers, and tea stalls. Enables donors to submit surplus in **under 30 seconds** with:
  - English & Tamil (`தமிழ்`) toggle.
  - Automatic temperature storage inference (Hot, Room Temp, Refrigerated).
  - Geolocation detection with manual fallback.
  - Real-time arrival in the NGO Inbox with visual countdown urgency clocks (Green > 2h, Amber 1-2h, Red < 1h).

### 2. 🗺️ Spatio-Temporal & Decay-Aware Route Optimization
- Greedy heuristic route planner that clusters collections under vehicle cargo limits (65–100 meals).
- Prioritizes pickups by strict biological expiry deadlines.
- Automatically calculates and visualizes **40%–60% reductions in travel distance and carbon emissions** compared to ad-hoc point-to-point trips.
- Multi-trip vehicle queueing with dynamic ETA re-calculation once active routes complete.

### 3. 🛡️ Closed-Loop 4-Stage Mathematical Integrity
Every food portion adheres to a strict invariant:
$$\text{Confirmed (Kitchen)} \ge \text{Collected (Van)} \ge \text{Received (Depot)} \ge \text{Distributed (Shelters)} \ge 0$$
- **Zero Hidden Losses**: If a provider confirms 20 meals but only 18 are loaded, the system explicitly logs `"2 portions short"` across driver manifests, depot intake, and NGO audit tables.
- **Atomic State Transitions**: Trip scheduling, donation linking, pool removal, and leftover re-planning execute in a single atomic transaction.
- **Built-in Data Integrity Guard**: A real-time diagnostic engine that audits invariants (no double bookings, zero pool leaks, exact sum balance).

---

## 👥 Core Workflows & Modules

| Role | Key Capabilities |
| :--- | :--- |
| **Food Providers** | Multi-meal management (Breakfast, Lunch, Dinner), POS billing auto-sync, 7-day rolling predictions, and secure 4-digit handover OTPs. |
| **Public Citizens / Caterers** | No-login, 30-second mobile intake form, Tamil/English bilingual interface, and instant photo/location submissions. |
| **NGO Logistics Hub** | Incoming triage inbox with live expiry clocks, one-click route generator, printable QR poster generator, and fleet progress map. |
| **Van Drivers** | Stop-by-stop manifest (`Pending` → `En route` → `Arrived` → `Collected`), discrepancy recorder, and donor OTP verification. |

---

## 🏛️ System Architecture

```
                 [ COMMERCIAL PROVIDERS ]            [ GRASSROOTS DONORS / CATERERS ]
                 (Daily Meal Slots + POS Sync)       (Zero-App Public QR Form in Tamil/EN)
                               │                                       │
                               └───────────────────┬───────────────────┘
                                                   │
                                                   ▼
                                       ┌───────────────────────┐
                                       │   CENTRAL STATE HUB   │
                                       │   (Atomic Reducer)    │
                                       └───────────┬───────────┘
                                                   │
                                                   ▼
                                       ┌───────────────────────┐
                                       │   SPATIO-TEMPORAL     │
                                       │    ROUTE OPTIMIZER    │
                                       └───────────┬───────────┘
                                                   │
                                 ┌─────────────────┴─────────────────┐
                                 │                                   │
                                 ▼                                   ▼
                      ┌──────────────────────┐           ┌──────────────────────┐
                      │   DRIVER MANIFEST    │           │    NGO DEPOT HUB     │
                      │  (OTP Handover &     │  ======>  │  (Intake, Audit &    │
                      │   Shortfall Logging) │           │   Community Feeding) │
                      └──────────────────────┘           └──────────────────────┘
```

---

## 💻 Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (comes with Node.js)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/replate.git
cd replate
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your configuration:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
# GEMINI_API_KEY: Required for AI predictive surplus features
GEMINI_API_KEY="your_gemini_api_key_here"

# APP_URL: Base URL for QR generation and self-referential links
APP_URL="http://localhost:3000"
```

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build & Type Check
```bash
# Type check and lint
npm run lint

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🎯 Demo Accounts & Built-in Tools

The app includes built-in demo accounts and presenter tools accessible via the **`DT` / Sliders icon** on the top navigation bar:

| Role | Email | Preloaded Entity |
| :--- | :--- | :--- |
| **Provider (Bakery)** | `bakery@demo.com` | Sri Krishna Bakes & Confectionery |
| **Provider (Mess)** | `mess@demo.com` | Kaveri Boys Hostel Mess |
| **NGO Depot Hub** | `ngo@demo.com` | Annam Seva Trust Depot (Madurai) |

### Presenter Demo Tools (`DemoDrawer`):
- **Fast Role Switcher**: Switch between provider and NGO views with one click.
- **Scenario Presets**: Load edge cases (e.g., Scenario 1: 65-meal cap splitting trips; Scenario 2: Expiry filter; Scenario 3: Sub-threshold hold).
- **Data Integrity Guard**: Run real-time invariant diagnostics verifying that zero donations are double-booked and all sums balance.

---

## 📋 What To Do Next

### 1. Initialize & Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete Replate surplus food redistribution platform"
git branch -M main
git remote add origin https://github.com/<your-username>/replate.git
git push -u origin main
```

### 2. Deploy to Production
- **Vercel**: Import your GitHub repo on [Vercel](https://vercel.com/), set `GEMINI_API_KEY` in Environment Variables, and deploy.
- **Netlify**: Connect repository and set build command to `npm run build` and publish directory to `dist`.
- **Cloud Run / Docker**: Use Vite production bundle served via static file server or Express.

### 3. Prepare Presentations & Pitches
A complete project pitch reference and minimalistic 5-slide deck outline is available in:
📄 **[`PROJECT_OVERVIEW_AND_PITCH.txt`](PROJECT_OVERVIEW_AND_PITCH.txt)**

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Mapping & Geospatial**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/) & [Motion](https://motion.dev/)
- **QR Code Engine**: [qrcode](https://github.com/soldair/node-qrcode) (Canvas/SVG generator)
- **Charts & Metrics**: [Recharts](https://recharts.org/)
- **AI Analytics**: [Google Gen AI SDK](https://github.com/google/generative-ai-js)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

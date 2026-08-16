# PPIF 2026 - Interactive Multi-Classroom Battle Game

An interactive, real-time web application engineered for the **PPIF 2026** (Pekan Perkenalan Informatika Fakultas / HMIF Universitas Multimedia Nusantara) orientation event. 

This game facilitates asynchronous classroom sessions managed by class PICs (Admins) from a projector, while participants (Players) join via their smartphones using a 6-digit PIN to compete in team-based trivia and unite in an intense cooperative 3-phase boss battle.

---

## 🚀 Key Features

- **Asynchronous Multi-Classroom Sessions**: Each classroom runs an isolated game session identified by a unique 6-digit PIN.
- **Dynamic Team Assignment**: Players join without passwords and are automatically balanced into two competing teams (Team A & Team B).
- **Interactive Story & Trivia System**:
  - Immersive storyline progression and activities.
  - Multiple-choice trivia with randomized option ordering.
  - Server-side response time calculation (`response_time_ms`) and duplicate submission protection.
- **Cooperative 3-Phase Boss Battle**:
  - Soul-like boss encounter where both teams mash taps simultaneously to defeat the boss.
  - Client-side tap batching (flushed every ~300ms) with server-side locks and throttled broadcasts.
  - Seamless phase transitions and scripted cinematic cutscenes.
- **Central Live Monitor & Leaderboard (`/monitor`)**:
  - Real-time dashboard for event organizers to monitor all active classrooms, live scoreboards, and accumulated response speeds.
- **High-Performance Realtime Engine**: Powered by **Laravel Reverb WebSockets** with **Laravel Echo** for instant state synchronization with graceful HTTP fallbacks.
- **Immersive Visuals**: Cyberpunk-inspired aesthetic built with **Tailwind CSS**, **GSAP** micro-animations, and **Three.js** 3D backgrounds with custom shader post-processing.

---

## 🛠️ Tech Stack

- **Backend**: Laravel 11/12/13 (PHP 8.3+), MySQL / SQLite
- **Realtime Relay**: Laravel Reverb (WebSocket server located in `/reverb`)
- **Frontend**: React 18, TypeScript, Vite, React Router v7
- **Styling & Animation**: Tailwind CSS, GSAP, Three.js
- **State Sync**: Laravel Echo, Pusher-JS

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **PHP**: `>= 8.3` (with `pdo`, `mbstring`, `curl`, `openssl`, `fileinfo` extensions enabled)
- **Composer**: `>= 2.0`
- **Node.js**: `>= 18.x` & **npm**
- **Database**: MySQL `>= 8.0` or MariaDB (SQLite can also be used for local testing)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/HMIF-UMN/PPIF2026-GAME.git
cd PPIF2026-GAME
```

### 2. Install Dependencies
Install PHP dependencies for both the main application and the standalone Reverb server, followed by Node.js packages:

```bash
# Install root application dependencies
composer install

# Install Reverb relay server dependencies
cd reverb && composer install && cd ..

# Install frontend dependencies
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure your database and Reverb keys:

```bash
cp .env.example .env
```

Generate the application encryption key:
```bash
php artisan key:generate
```

Configure your database connection in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ppif_game
DB_USERNAME=root
DB_PASSWORD=
```

Ensure Reverb credentials match between root `.env` and `reverb/.env`:
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=100001
REVERB_APP_KEY=ppif2026key
REVERB_APP_SECRET=ppif2026secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

*(If `reverb/.env` does not exist, copy `reverb/.env.example` to `reverb/.env` and paste the same `REVERB_APP_*` keys.)*

### 4. Run Migrations & Seeders
Execute database migrations and populate game steps and PIC accounts:

```bash
php artisan migrate:fresh --seed
```
> **Note**: This will seed 16 default game steps via `StepSeeder` and pre-configured PIC accounts via `PicAccountSeeder`.

---

## 🏃 Running the Application

### Option A: All-in-One Development Command (Recommended)
You can start all processes (Laravel API server, Vite dev server, Queue worker, Pail log viewer, and Reverb WebSocket server) concurrently with a single command:

```bash
composer run dev
```

### Option B: Running Processes Manually (Separate Terminals)
If you prefer running services individually:

1. **Terminal 1 - Laravel Server**:
   ```bash
   php artisan serve
   ```
2. **Terminal 2 - Vite Frontend**:
   ```bash
   npm run dev
   ```
3. **Terminal 3 - Reverb WebSocket Server**:
   ```bash
   php reverb/artisan reverb:start
   ```
4. **Terminal 4 - Queue Worker**:
   ```bash
   php artisan queue:listen
   ```

---

## 🎮 Accessing Game Portals

Once the dev servers are running, access the portals through your browser:

- **Participant / Player Screen (Mobile View)**:
  `http://localhost:8000/player/lobby`
- **Classroom Admin / PIC Screen (Projector View)**:
  `http://localhost:8000/admin/lobby`
- **Central Organizer Monitor & Leaderboard**:
  `http://localhost:8000/monitor`

---

## 📁 Project Structure Overview

```text
├── app/
│   ├── Events/                 # Realtime WebSocket broadcast events
│   ├── Http/Controllers/
│   │   ├── Admin/              # PIC authentication & session lifecycle controllers
│   │   └── Api/                # Game session, steps, answer submission, & boss fight APIs
│   └── Models/                 # Eloquent models (GameSession, Team, Player, Step, Answer, etc.)
├── database/
│   ├── migrations/             # Database tables schema
│   └── seeders/                # Master game steps and PIC account seeders
├── resources/js/
│   ├── Components/             # UI widgets, 3D Three.js backgrounds & monitoring panels
│   ├── hooks/                  # React hooks for API and WebSocket subscriptions
│   ├── Pages/
│   │   ├── GameFlowAdmin/      # Admin presentation views (Lobby, Questions, Boss, Monitor)
│   │   └── GameFlowPlayer/     # Mobile player views (Join, Questions, Boss tap screen)
│   ├── routes/AppRouters.tsx   # React Router definition
│   └── echo.ts                 # Laravel Echo WebSocket client configuration
└── reverb/                     # Dedicated lightweight Reverb WebSocket server
```

---

## 👥 Credits

Developed and Designed by **INTERFACE - PPIF 2026**

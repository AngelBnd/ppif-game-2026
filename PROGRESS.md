# Progress: Migrasi Game Flow ke Database + Realtime

Dokumen ini merangkum apa yang sudah dikerjakan dan apa yang masih perlu dikerjakan untuk sistem game PPIF 2026 (Laravel + React + realtime multi-kelas).

## Konteks singkat

Game ini dipakai untuk aktivitas kelas PPIF: tiap kelas jalan sesi sendiri (asinkron antar kelas), 1 sesi = 2 kelompok yang saling berlawanan. Rencana infrastruktur: Laravel + MySQL di shared hosting kampus (ac.id), realtime pakai **Laravel Reverb** yang dijalankan di **VPS terpisah** (idcloudhost, ~120rb/bulan) — VPS cuma jadi "pengeras suara" (relay broadcast), tidak menyimpan data/DB sendiri.

---

## Yang sudah dikerjakan

### 1. Database — skema & migration

Semua yang sebelumnya hardcoded di `playerGameFlow.ts` / `adminGameFlow.ts` sudah dipindah ke database (kedua file itu sudah dihapus).

| Tabel | Isi |
|---|---|
| `steps` | Master konten game (urutan `order`, `slug`, `type`: waiting/story/activity/answer/boss, `title`, `content` json, `correct_answer`, `time_limit_seconds`). Satu sumber kebenaran untuk admin & player — sebelumnya dua array terpisah. |
| `game_sessions` | 1 baris = 1 sesi kelas yang jalan. `code` (PIN 6 digit unik), `class_name`, `status` (waiting/active/finished), `current_step_id`. |
| `teams` | 2 per sesi (Kelompok A & B), punya `score`, `hp`. |
| `players` | Device/nama yang join, terikat ke 1 tim, diidentifikasi lewat `device_token` (bukan akun/login). |
| `step_progress` | Log kapan tiap step aktif per sesi — jadi basis perhitungan waktu jawab yang akurat (server-side, bukan timer client). |
| `answers` | Submission jawaban: `team_id`, `step_id`, `is_correct`, `response_time_ms`, unique per `(team_id, step_id)` — 1 tim cuma bisa submit 1x per soal (submit kedua ditolak 409). |

Seeder (`StepSeeder`) mengisi 16 step sesuai urutan game yang lama (lobby → prolog → chapter 1-3 dengan activity+answer di masing² → epilog 1 → boss fight → epilog 2 → activity 4).

**Catatan:** jawaban chapter 3 masih placeholder ("Answer 3 placeholder") — dibawa apa adanya dari kode lama, belum diisi jawaban asli.

### 2. API (Laravel)

- `GET /api/steps` — daftar semua step (untuk render flow), `correct_answer` otomatis disembunyikan dari response (`$hidden` di model `Step`) supaya kunci jawaban gak bocor ke browser player.
- `POST /api/game-sessions` — admin bikin sesi baru, auto-generate PIN unik + 2 tim.
- `GET /api/game-sessions/{code}` — ambil state sesi (dipakai untuk polling).
- `POST /api/game-sessions/{code}/join` — player join pakai PIN + nickname, auto-assign ke tim yang jumlah pemainnya lebih sedikit.
- `PATCH /api/game-sessions/{code}/advance` — admin majukan sesi ke step berikutnya (linear, berdasar `order`), otomatis set `status=finished` kalau step terakhir.
- `POST /api/game-sessions/{code}/answers` — submit jawaban; `response_time_ms` dihitung **server-side** dari `step_progress.activated_at`, cek benar/salah, tolak submit ganda, skor tim `+1` kalau benar.

### 3. Frontend (React)

- `useSteps()`, `useAdminSession()`, `usePlayerSession()` — hook yang fetch dari API, gantiin import data hardcoded.
- Admin: `WaitingRoomPage` sekarang nampilin PIN asli (bukan diketik manual) dan jumlah yang join asli dari `session.teams`; tombol Next/Start manggil `advanceSession()` beneran.
- Player: `JoiningPage` submit PIN+nickname ke API beneran, dapat `device_token` disimpan di localStorage; setelah join, player **tidak** pindah halaman sendiri — nunggu sampai admin advance, lalu otomatis ngikut lewat polling tiap 3 detik (`usePlayerSession`).
- Player: `AnswerTheQuestionPage` submit jawaban ke API, nampilin feedback "Correct!"/"Incorrect." dari hasil server.
- Slug step pertama disatuin jadi `lobby` (dulu beda: `join-room` vs `waiting-room`) — URL berubah jadi `/player/lobby` dan `/admin/lobby`.

### 4. Bug yang ditemukan & diperbaiki saat testing

Semua ditemukan lewat testing browser sungguhan (2 tab: admin + player), bukan cuma baca kode:

1. `response_time_ms` sempat negatif/desimal dari `Carbon::diffInMilliseconds()` (Carbon 3 berubah default `$absolute`) → gagal insert (kolom unsigned int). Diperbaiki dengan `abs()` + `round()`.
2. `JoiningPage.tsx` pakai `gsap` tanpa `import gsap` — **bug lama** yang sudah ada sebelum sesi kerja ini, baru ketauan pas animasi join dijalankan (`ReferenceError: gsap is not defined`).
3. Response endpoint `/join` naruh `GameSessionResource` nested di dalam array JSON — Laravel **tidak** otomatis bungkus jadi `{data: ...}` untuk kasus nested (beda dari endpoint lain yang return resource langsung). Kode frontend sempat salah asumsi format ini, bikin polling player gak pernah dapat state sesi yang benar.
4. Player sempat pindah step pakai navigasi lokal statis (bukan nunggu server) — dihapus, sekarang murni ngikut `current_step` dari server via polling.
5. `APP_KEY` belum ada di `.env` lokal — di-generate.
6. PHP lokal masih 8.0 (XAMPP), proyek butuh 8.3 — upgrade + fix `extension_dir` yang salah di `php.ini`.

### 5. Verifikasi

- `npx tsc --noEmit` bersih, tanpa error.
- Migration + seeder jalan bersih di MySQL lokal.
- End-to-end test otomatis (Playwright, 2 browser context terpisah simulasi admin+player): buat sesi → join pakai PIN asli → admin start → player auto-follow tanpa tombol → admin advance lagi → player auto-follow ke soal, nampilin pertanyaan asli dari DB → jawab benar → feedback "Correct!" muncul.

---

## Yang belum dikerjakan / rencana selanjutnya

### Prioritas tinggi (blocking untuk pemakaian nyata)

- [ ] **Realtime beneran (Laravel Reverb)** — saat ini masih polling tiap 3 detik (cukup untuk dev/testing, tapi bukan realtime instan). Rencana sudah dibahas: Reverb dijalankan di VPS (idcloudhost), Laravel di shared hosting tetap kirim event lewat HTTP ke Reverb, browser connect langsung ke Reverb via `wss://`. Perlu:
  - Domain buat VPS via `sslip.io`/`nip.io` (gratis, gak perlu approval kampus) atau beli domain murah (`.my.id`)
  - Setup nginx reverse proxy + Certbot SSL di VPS
  - Install `laravel/reverb`, config broadcasting, bikin event (`StepAdvanced`, `AnswerSubmitted`, dst) dan channel per sesi (`game-session.{id}`)
  - Ganti polling di `usePlayerSession` dengan Echo listener
- [ ] **Isi jawaban chapter 3** yang masih placeholder di `StepSeeder.php`
- [ ] **Konten StorylinePage admin** — masih literal teks "Placeholder for storyline screen.", belum didesain (beda jauh dari versi player yang sudah pakai dialogue box)
- [ ] **Boss fight — HP & damage** — kolom `teams.hp` sudah ada di skema tapi belum ada logic yang update-nya (belum ada endpoint/event buat kurangin HP boss atau HP tim)

### Prioritas menengah

- [ ] **Counter "X/2 has answered" di layar admin** — sekarang masih angka statis "0/2". Untuk diisi data asli butuh tambahan: endpoint/data yang expose berapa tim sudah submit jawaban untuk step aktif
- [ ] **Timer soal** — `time_limit_seconds` sudah ada di skema `steps` tapi belum dipakai; UI timer ("60 SECONDS") masih angka statis di frontend
- [ ] **Ganti gambar boss** — masih pakai `placeholderboss.png`
- [ ] **Reset/mulai sesi baru** — admin belum punya cara untuk mulai sesi baru dari awal tanpa clear localStorage manual (berguna kalau 1 kelas main lebih dari sekali, atau kalau ada kesalahan)

### Prioritas rendah / nice-to-have

- [ ] Font file yang 404 (`Arsenal-Bold.ttf`, `Noto-Bold.ttf`) — belum ada di `public/fonts/`
- [ ] Halaman `HomeAdmin/JoiningPage.tsx` dan `HomePhone/JoiningPage.tsx` — ada di kode tapi belum kesambung ke router, belum jelas kepakainya di mana
- [ ] Pertimbangkan apakah skor perlu mempertimbangkan kecepatan jawab (`response_time_ms` sudah dicatat tapi scoring saat ini cuma +1 per jawaban benar, belum ada bonus kecepatan)

### Perlu keputusan/konfirmasi dari tim

- Apakah tim boleh revisi jawaban setelah submit? (sekarang: tidak, submit kedua ditolak 409)
- Rule detail boss fight: gimana HP boss berkurang — dari jawaban benar? Dari damage per kelompok? Butuh clarify sebelum bikin endpoint-nya
- Kapan status sesi berubah dari `waiting` → `active`? (sekarang: begitu admin advance dari lobby ke step pertama)

---

## File-file kunci yang relevan

- Migration: `database/migrations/2026_07_21_*_create_{steps,game_sessions,teams,players,step_progress,answers}_table.php`
- Model: `app/Models/{Step,GameSession,Team,Player,StepProgress,Answer}.php`
- Seeder: `database/seeders/StepSeeder.php`
- Controller: `app/Http/Controllers/Api/{StepController,GameSessionController,AnswerController}.php`
- Routes: `routes/api.php`
- Hooks frontend: `resources/js/hooks/{useSteps,useAdminSession,usePlayerSession}.ts`

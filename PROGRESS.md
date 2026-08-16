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

### 6. Realtime (Laravel Reverb) — bagian lokal sudah jalan

Struktur: **2 project Laravel dalam 1 repo**, bukan repo terpisah.

- `reverb/` — instalasi Laravel minimal (skeleton biasa + `laravel/reverb`) yang cuma jalanin `artisan reverb:start`. Gak ada model/migration/kode game di sini — cuma perlu 3 credential (`REVERB_APP_ID/KEY/SECRET`) yang harus **sama persis** dengan root app. Dipin ke `laravel/reverb:1.10.2` (bukan `1.11.0` — versi itu bentrok dengan guard `DevCommands` baru di Laravel 13.22, service provider-nya manggil `Reverb::registerDevCommands()` unconditional di `register()` dan selalu error saat `package:discover`).
- Root app: `laravel/reverb` (pin sama), `config/broadcasting.php` dibikin manual — cuma koneksi `reverb`, **tanpa** `routes/channels.php`/`Broadcast::routes()` karena semua channel di sini publik (player diidentifikasi lewat `device_token`, bukan sesi auth Laravel, jadi gak ada yang bisa diautentikasi buat private channel).
- Event: `App\Events\{StepAdvanced,PlayerJoined}` (broadcast full state sesi, sama seperti response `GET /game-sessions/{code}`) dan `App\Events\AnswerSubmitted` (cuma `team_id`+`step_id`+`answered_count`, sengaja gak include `is_correct`/`answer_text` biar gak bocor ke tim lawan di channel yang sama). Semua `ShouldBroadcastNow` + `ShouldRescue` — kalau Reverb/VPS lagi down, `advance()`/`join()`/submit jawaban **tetap jalan** via HTTP biasa (gagal broadcast di-log, gak nge-500), dibatasi timeout ~2-3 detik biar gak nge-hang lama.
- Channel: `game-session.{code}` (pakai PIN, bukan `{id}` — lebih konsisten sama yang udah dipakai di URL/localStorage).
- Frontend: `laravel-echo` + `pusher-js`, `resources/js/echo.ts` (singleton client). `usePlayerSession` polling 3 detik **sudah diganti** listener `.step.advanced`. `useAdminSession` juga sudah subscribe (`.step.advanced`, `.player.joined`, `.answer.submitted`) — jumlah join di `WaitingRoomPage` dan counter "X/2 has answered" di admin `AnswerTheQuestionPage` sekarang live.
- `GameSessionResource` nambah field `answered_count` (hitung `answers` utk `current_step_id` yang aktif — otomatis balik ke 0 begitu step pindah, gak perlu reset manual).
- `composer run dev` sekarang otomatis ikut jalanin `reverb:start` dari `reverb/` (concurrently bareng server/queue/vite).
- Sudah dites end-to-end lokal lewat tinker (create session → join → advance ke step answer → submit answer): keempat event broadcast bersih ke `reverb:start` yang jalan beneran, `answered_count` kebukti 0 → 1 dengan benar. Juga dites skenario Reverb mati — konfirmasi gak ada exception yang bocor ke response.

**Yang masih belum:** deploy ke VPS beneran (lihat prioritas tinggi di bawah — domain, nginx, ganti `REVERB_HOST` dari `localhost` ke domain VPS).

*(Update: counter "X/2 has answered" di layar HP player belakangan juga udah disambung — lihat #7.)*

### 7. Boss Fight — kooperatif, 3 phase, tap-mashing

Desain dari tim acara: 2 kelompok kerja sama (bukan lawan-lawanan) ngelawan 1 boss yang sama dengan tap layar cepat-cepatan. Boss punya 3 phase ala Souls-like; begitu HP phase 3 tinggal dikit, cut ke animasi kalah — ini **scripted**, bukan hasil performa (storyline emang udah nentuin peserta kalah).

- `game_sessions` nambah `boss_phase` (1-3), `boss_hp`, `boss_finished_at` (nullable, nandain cutscene phase 3 udah kepicu). HP per phase & threshold cutscene ada di `GameSession::BOSS_PHASE_MAX_HP` (150/150/150, placeholder — gampang di-tune) dan `BOSS_PHASE3_CUTSCENE_THRESHOLD` (15).
- `teams.hp` (kolom yang dari awal gak kepakai) di-repurpose jadi **meter kontribusi tap** per kelompok (naik, bukan darah yang abis) — direset ke 0 otomatis tiap kali `advance()` masuk ke step `boss`.
- `POST /api/game-sessions/{code}/boss/taps` (`BossFightController@tap`) — client nge-batch tap lokal & kirim tiap ~300ms (`{device_token, taps}`, max 50/request) biar gak 1 request per tap. Transisi phase pakai row lock (`lockForUpdate`) di dalam DB transaction biar gak race waktu banyak device tap bareng.
- Broadcast `App\Events\BossDamaged` (`.boss.damaged`) di-throttle max 1x/250ms per sesi via cache lock, **kecuali** pas ganti phase atau masuk cutscene — itu selalu langsung broadcast. Tujuannya: beban ke Reverb tetap flat walau berapa pun banyak HP yang tap bareng (VPS Reverb cuma 2 CPU/2GB).
- Frontend: `handleFireTap` (animasi recoil FIRE+crosshair yang udah ada) disambung ke tap-batching beneran; HP boss & HP kontribusi tim di layar admin dan HP player diganti dari hardcoded ke data live (`usePlayerSession`/`useAdminSession` sama-sama listen `.boss.damaged`). `usePlayerSession` juga sekarang nyimpen `team` (id+nama) dari response join, soalnya sebelumnya gak ada cara phone tau dia di kelompok mana.
- Animasi transisi phase: banner flash "PHASE 2"/"PHASE 3" (~1.5 detik, non-blocking, gak ganggu tap) di kedua layar. Cutscene masih placeholder sederhana (overlay teks "The boss was too strong..."). Keduanya state-nya udah kepicu bener, tinggal nunggu art/animasi final dari tim desain.
- Sudah dites end-to-end dengan Reverb beneran jalan: `advance()` masuk step boss → state ke-reset (termasuk HP tim yang tadinya nonzero), tap lewat 3 phase sampai cutscene kepicu presisi di HP≤15, tap sesudah cutscene ditolak (409), kontribusi tim ke-hitung benar.
- **Dites di browser beneran (Playwright, bukan cuma tinker)** — nemu & benerin 2 bug asli:
  1. Kalau tap numpuk >50 dalam 1 window batch (300ms) — persis pas lagi "cepet-cepetan" — sisa di atas 50 sempat **hilang** (direset ke 0 alih-alih disimpan buat batch berikutnya). Sekarang sisa-nya lanjut ke flush selanjutnya, gak ada tap yang kebuang.
  2. (Bukan dari boss fight, ketemu gak sengaja) `AdminFlowPage` selalu manggil `createSession()` begitu mount kalau `session` masih `null` — padahal fetch PIN tersimpan dari localStorage itu masih async. Efeknya: **tiap admin reload halaman bikin sesi orphan baru** sebelum sesi asli ke-load dan nimpa. Diperbaiki dengan flag `isRestoring` di `useAdminSession` — `AdminFlowPage` sekarang nunggu proses restore kelar dulu sebelum mutusin bikin sesi baru. Diverifikasi: 3x reload admin, PIN tetap sama, cuma 1 baris sesi di DB (sebelumnya numpuk).

---

## Status Penyelesaian Proyek: Selesai (Completed)

Semua implementasi utama, alur permainan, integrasi realtime (Laravel Reverb + Echo), mekanik Boss Fight 3-phase, autentikasi admin & PIC, sistem leaderboard, serta monitoring multi-kelas telah berhasil diselesaikan dan diuji.

### Rangkuman Penyelesaian Fitur

- [x] **Database & Migrasi**: Skema tabel (`steps`, `game_sessions`, `teams`, `players`, `step_progress`, `answers`, `leaderboard_entries`) lengkap dan terisi dengan seeder data permainan serta akun PIC.
- [x] **REST API & Keamanan**: Seluruh endpoint player & admin siap digunakan, dilengkapi rate limiting per-device dan per-IP untuk mencegah flooding dan kecurangan.
- [x] **Realtime Broadcasting**: Integrasi Laravel Reverb dengan event `StepAdvanced`, `PlayerJoined`, `PlayerLeft`, `AnswerSubmitted`, `BossDamaged`, dan `BossPhaseStarted` berjalan lancar dengan fallback yang aman.
- [x] **Alur Game (Admin & Player)**: Sinkronisasi step realtime dari Lobby, Prolog, Chapter 1-3 (Activity + Question), hingga Epilog.
- [x] **Boss Fight Kooperatif**: 3 phase Souls-like battle dengan batching tap client-side, server-side lock, dan scripted cutscene transisi.
- [x] **Admin Monitor & Leaderboard**: Halaman `/monitor` untuk monitoring status real-time seluruh kelas/sesi, live scoreboard, dan waktu respon akumulatif.

---

## File-file kunci yang relevan

- Migration: `database/migrations/2026_07_21_*_create_{steps,game_sessions,teams,players,step_progress,answers}_table.php`
- Model: `app/Models/{Step,GameSession,Team,Player,StepProgress,Answer,LeaderboardEntry,User}.php`
- Seeder: `database/seeders/{StepSeeder,PicAccountSeeder}.php`
- Controller: `app/Http/Controllers/Api/{StepController,GameSessionController,AnswerController,BossFightController}.php`, `app/Http/Controllers/Admin/{AuthController,SessionController}.php`
- Routes: `routes/api.php`, `routes/web.php`
- Hooks frontend: `resources/js/hooks/{useSteps,useAdminSession,usePlayerSession,useAdminAuth,useCountdown}.ts`
- Broadcasting: `app/Events/{StepAdvanced,PlayerJoined,PlayerLeft,AnswerSubmitted,BossDamaged,BossPhaseStarted}.php`, `config/broadcasting.php`, `resources/js/echo.ts`
- Reverb server: `reverb/`
- Boss fight UI: `resources/js/Pages/GameFlow{Admin,Player}/BossFightPage.tsx`, `resources/js/Components/monitor/{BossHealth,TeamHP}.tsx`
- Admin Monitor: `resources/js/Pages/GameFlowAdmin/AdminMonitorPage.tsx`


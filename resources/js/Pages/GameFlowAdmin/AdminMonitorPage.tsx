import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getXsrfToken } from '@/utils/csrf';
import { useEffect, useMemo, useState } from 'react';
import AdminLoginPage from './AdminLoginPage';

type OverviewSession = {
    id: number;
    code: string;
    class_name: string | null;
    status: string;
    pic: string | null;
    current_step: string | null;
    teams: { name: string; score: number; hp: number }[];
    updated_at: string;
};

type LeaderboardRow = {
    class_name: string | null;
    team_name: string;
    score: number;
    correct_answers: number;
    total_answers: number;
    total_response_time_ms: number;
};

const REFRESH_INTERVAL_MS = 10000;

const STATUS_META: Record<string, { label: string; className: string }> = {
    waiting: {
        label: 'Menunggu',
        className:
            'bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/30',
    },
    active: {
        label: 'Aktif',
        className:
            'bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30',
    },
    finished: {
        label: 'Selesai',
        className: 'bg-white/10 text-white/60 ring-1 ring-inset ring-white/20',
    },
};

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] ?? {
        label: status,
        className: 'bg-white/10 text-white/60 ring-1 ring-inset ring-white/20',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const seconds = Math.max(0, Math.floor(diffMs / 1000));

    if (seconds < 5) return 'baru saja';
    if (seconds < 60) return `${seconds}d lalu`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m lalu`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}j lalu`;

    return `${Math.floor(hours / 24)}h lalu`;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function AdminMonitorPage() {
    const { user, isLoading: isAuthLoading, login, logout } = useAdminAuth();
    const [sessions, setSessions] = useState<OverviewSession[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [error, setError] = useState('');
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'waiting' | 'active' | 'finished'
    >('all');
    const [search, setSearch] = useState('');
    // Two-click delete: first click arms it, second click (within 4s)
    // confirms - avoids a jarring native confirm() popup for a destructive action.
    const [confirmingCode, setConfirmingCode] = useState<string | null>(null);
    const [deletingCode, setDeletingCode] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.is_admin) return;

        let cancelled = false;

        const loadOverview = async () => {
            try {
                const res = await fetch('/api/admin/overview', {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) throw new Error('Gagal memuat data.');
                const body = await res.json();
                if (cancelled) return;
                setSessions(body.sessions);
                setLeaderboard(body.leaderboard);
                setError('');
                setLastRefreshedAt(new Date());
            } catch (err) {
                if (!cancelled) setError((err as Error).message);
            } finally {
                if (!cancelled) setHasLoadedOnce(true);
            }
        };

        loadOverview();
        const interval = setInterval(loadOverview, REFRESH_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [user?.is_admin]);

    const counts = useMemo(
        () => ({
            all: sessions.length,
            waiting: sessions.filter((s) => s.status === 'waiting').length,
            active: sessions.filter((s) => s.status === 'active').length,
            finished: sessions.filter((s) => s.status === 'finished').length,
        }),
        [sessions],
    );

    const totalTeams = useMemo(
        () => sessions.reduce((sum, s) => sum + s.teams.length, 0),
        [sessions],
    );

    const visibleSessions = useMemo(() => {
        const query = search.trim().toLowerCase();

        return sessions.filter((s) => {
            if (statusFilter !== 'all' && s.status !== statusFilter)
                return false;
            if (!query) return true;

            return (
                s.code.toLowerCase().includes(query) ||
                (s.pic ?? '').toLowerCase().includes(query) ||
                (s.class_name ?? '').toLowerCase().includes(query)
            );
        });
    }, [sessions, statusFilter, search]);

    const handleDeleteClick = async (code: string) => {
        if (confirmingCode !== code) {
            setConfirmingCode(code);
            setTimeout(() => {
                setConfirmingCode((current) =>
                    current === code ? null : current,
                );
            }, 4000);
            return;
        }

        setConfirmingCode(null);
        setDeletingCode(code);
        setError('');

        try {
            const res = await fetch(`/api/admin/game-sessions/${code}`, {
                method: 'DELETE',
                headers: { 'X-XSRF-TOKEN': getXsrfToken() },
            });

            if (!res.ok) throw new Error('Gagal menghapus sesi.');

            setSessions((current) => current.filter((s) => s.code !== code));
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDeletingCode(null);
        }
    };

    if (isAuthLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Loading...</p>
            </main>
        );
    }

    if (!user) {
        return <AdminLoginPage onLogin={login} />;
    }

    if (!user.is_admin) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Akun ini bukan akun admin monitoring.</p>
            </main>
        );
    }

    return (
        <main className="relative z-30 min-h-screen bg-[#0A0C0F] text-white">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-arsenal text-3xl font-bold text-[#FFFE25]">
                            Monitoring Semua Sesi
                        </h1>
                        <p className="mt-1 text-sm text-white/50">
                            {lastRefreshedAt
                                ? `Diperbarui otomatis · terakhir ${timeAgo(lastRefreshedAt.toISOString())}`
                                : 'Memuat data...'}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
                    >
                        Logout
                    </button>
                </div>

                {error && (
                    <p className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-inset ring-red-500/30">
                        {error}
                    </p>
                )}

                {/* Summary stat cards */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total Sesi" value={counts.all} />
                    <StatCard
                        label="Aktif"
                        value={counts.active}
                        accent="text-emerald-300"
                    />
                    <StatCard
                        label="Menunggu"
                        value={counts.waiting}
                        accent="text-amber-300"
                    />
                    <StatCard label="Total Tim" value={totalTeams} />
                </div>

                {/* Sessions section */}
                <section className="mb-12">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-arsenal text-xl font-bold">Sesi</h2>

                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode, PIC, atau kelompok..."
                                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                            />

                            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
                                {(
                                    [
                                        'all',
                                        'waiting',
                                        'active',
                                        'finished',
                                    ] as const
                                ).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setStatusFilter(key)}
                                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                                            statusFilter === key
                                                ? 'bg-white text-black'
                                                : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        {key === 'all'
                                            ? 'Semua'
                                            : STATUS_META[key].label}{' '}
                                        ({counts[key]})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!hasLoadedOnce ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] py-16 text-center text-white/40">
                            Memuat sesi...
                        </div>
                    ) : visibleSessions.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] py-16 text-center text-white/40">
                            {sessions.length === 0
                                ? 'Belum ada sesi.'
                                : 'Tidak ada sesi yang cocok.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleSessions.map((s) => (
                                <div
                                    key={s.id}
                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-mono text-lg font-bold tracking-wider">
                                                {s.code}
                                            </p>
                                            <p className="text-xs text-white/40">
                                                Kelompok {s.class_name ?? '-'}
                                            </p>
                                        </div>
                                        <StatusBadge status={s.status} />
                                    </div>

                                    <div className="mb-3 flex items-center justify-between text-xs text-white/50">
                                        <span>PIC: {s.pic ?? '-'}</span>
                                        <span>{timeAgo(s.updated_at)}</span>
                                    </div>

                                    <div className="mb-3 rounded-lg bg-black/30 px-3 py-2 text-sm">
                                        <span className="text-white/40">
                                            Step:{' '}
                                        </span>
                                        {s.current_step ?? '-'}
                                    </div>

                                    <div className="mb-3 flex flex-col gap-1.5">
                                        {s.teams.map((t, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between rounded-md bg-white/5 px-3 py-1.5 text-sm"
                                            >
                                                <span className="truncate text-white/80">
                                                    {t.name}
                                                </span>
                                                <span className="font-semibold text-[#FFFE25]">
                                                    {t.score} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() =>
                                            handleDeleteClick(s.code)
                                        }
                                        disabled={deletingCode === s.code}
                                        className={`w-full rounded-lg py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                            confirmingCode === s.code
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/5 text-red-300/70 hover:bg-red-500/10 hover:text-red-300'
                                        }`}
                                    >
                                        {deletingCode === s.code
                                            ? 'Menghapus...'
                                            : confirmingCode === s.code
                                              ? 'Yakin? Klik lagi untuk hapus'
                                              : 'Hapus Sesi'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Leaderboard */}
                <section>
                    <h2 className="mb-4 font-arsenal text-xl font-bold">
                        Leaderboard
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50">
                                    <th className="py-3 pl-4 pr-4">#</th>
                                    <th className="py-3 pr-4">Kelompok</th>
                                    <th className="py-3 pr-4">Tim</th>
                                    <th className="py-3 pr-4">Skor</th>
                                    <th className="py-3 pr-4">Benar/Total</th>
                                    <th className="py-3 pr-4">
                                        Total Waktu Jawab
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((row, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                                    >
                                        <td className="py-3 pl-4 pr-4 text-white/50">
                                            {MEDALS[i] ?? i + 1}
                                        </td>
                                        <td className="py-3 pr-4 text-white/70">
                                            {row.class_name ?? '-'}
                                        </td>
                                        <td className="py-3 pr-4 font-medium">
                                            {row.team_name}
                                        </td>
                                        <td className="py-3 pr-4 font-semibold text-[#FFFE25]">
                                            {row.score}
                                        </td>
                                        <td className="py-3 pr-4 text-white/70">
                                            {row.correct_answers}/
                                            {row.total_answers}
                                        </td>
                                        <td className="py-3 pr-4 text-white/70">
                                            {(
                                                row.total_response_time_ms /
                                                1000
                                            ).toFixed(1)}
                                            s
                                        </td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-10 text-center text-white/40"
                                        >
                                            Belum ada data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

function StatCard({
    label,
    value,
    accent = 'text-white',
}: {
    label: string;
    value: number;
    accent?: string;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-white/40">
                {label}
            </p>
            <p className={`mt-1 font-arsenal text-2xl font-bold ${accent}`}>
                {value}
            </p>
        </div>
    );
}

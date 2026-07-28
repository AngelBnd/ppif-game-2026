import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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

export default function AdminMonitorPage() {
    const { user, isLoading: isAuthLoading, login, logout } = useAdminAuth();
    const [sessions, setSessions] = useState<OverviewSession[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [error, setError] = useState('');

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
            } catch (err) {
                if (!cancelled) setError((err as Error).message);
            }
        };

        loadOverview();
        const interval = setInterval(loadOverview, REFRESH_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [user?.is_admin]);

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
        <main className="relative z-30 min-h-screen bg-black p-6 text-white">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Monitoring Semua Sesi</h1>
                <button onClick={logout} className="text-sm text-white/60 underline">
                    Logout
                </button>
            </div>

            {error && <p className="mb-4 text-red-400">{error}</p>}

            <section className="mb-10">
                <h2 className="mb-3 text-lg font-semibold">Sesi Aktif</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="py-2 pr-4">Kode</th>
                                <th className="py-2 pr-4">PIC</th>
                                <th className="py-2 pr-4">Kelompok</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Step</th>
                                <th className="py-2 pr-4">Skor Tim</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => (
                                <tr key={s.id} className="border-b border-white/10">
                                    <td className="py-2 pr-4 font-mono">{s.code}</td>
                                    <td className="py-2 pr-4">{s.pic ?? '-'}</td>
                                    <td className="py-2 pr-4">{s.class_name ?? '-'}</td>
                                    <td className="py-2 pr-4">{s.status}</td>
                                    <td className="py-2 pr-4">{s.current_step ?? '-'}</td>
                                    <td className="py-2 pr-4">
                                        {s.teams
                                            .map((t) => `${t.name}: ${t.score}`)
                                            .join(', ')}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-white/40">
                                        Belum ada sesi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h2 className="mb-3 text-lg font-semibold">Leaderboard</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="py-2 pr-4">Kelompok</th>
                                <th className="py-2 pr-4">Tim</th>
                                <th className="py-2 pr-4">Skor</th>
                                <th className="py-2 pr-4">Benar/Total</th>
                                <th className="py-2 pr-4">Total Waktu Jawab</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((row, i) => (
                                <tr key={i} className="border-b border-white/10">
                                    <td className="py-2 pr-4">{row.class_name ?? '-'}</td>
                                    <td className="py-2 pr-4">{row.team_name}</td>
                                    <td className="py-2 pr-4">{row.score}</td>
                                    <td className="py-2 pr-4">
                                        {row.correct_answers}/{row.total_answers}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {row.total_response_time_ms} ms
                                    </td>
                                </tr>
                            ))}
                            {leaderboard.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-white/40">
                                        Belum ada data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

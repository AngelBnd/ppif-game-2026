import type { SessionInfo } from '@/types/gameSession';
import { useState } from 'react';

type Props = {
    session: SessionInfo | null;
    onRemove: (playerId: number) => Promise<unknown>;
};

/**
 * PIC-side escape hatch for a squatted team slot.
 *
 * A room has only six slots and joining needs nothing but the code, so a
 * script can fill every one of them before the class arrives. Leaving needs
 * the joiner's own device token, which a squatter won't hand over, and the
 * only other remedy was deleting the whole session - taking its teams,
 * answers and leaderboard rows with it, and forcing a new code out to the
 * room mid-event. This kicks one player and leaves everything else alone.
 *
 * Kept as a small utility panel in the corner rather than inline in the
 * waiting-room artwork, which is a fixed layout of rotated boards.
 */
export default function PlayerManagerPanel({ session, onRemove }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!session) return null;

    const players = session.teams.flatMap((team) =>
        team.players.map((player) => ({ ...player, teamName: team.name })),
    );

    const remove = async (playerId: number) => {
        setPendingId(playerId);
        setError(null);

        try {
            await onRemove(playerId);
        } catch {
            setError('Gagal mengeluarkan pemain. Coba lagi.');
        } finally {
            setPendingId(null);
        }
    };

    return (
        <div className="fixed bottom-2 left-2 z-50 font-arsenal text-xs">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className="rounded-md bg-white/5 px-4 py-1 text-white/50 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                Kelola Pemain ({players.length})
            </button>

            {isOpen && (
                <div className="mt-2 w-64 rounded-md bg-black/85 p-3 text-white/80 shadow-xl">
                    {players.length === 0 ? (
                        <p className="text-white/40">Belum ada pemain.</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {players.map((player) => (
                                <li
                                    key={player.id}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <span className="min-w-0 truncate">
                                        <span className="text-white/40">
                                            {player.teamName}
                                        </span>{' '}
                                        {player.nickname}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={pendingId !== null}
                                        onClick={() => remove(player.id)}
                                        className="shrink-0 rounded bg-red-600/20 px-2 py-0.5 text-red-300 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
                                    >
                                        {pendingId === player.id
                                            ? '...'
                                            : 'Keluarkan'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {error && <p className="mt-2 text-red-300">{error}</p>}
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';

type Props = {
    onLogin: (email: string, password: string) => Promise<unknown>;
};

export default function AdminLoginPage({ onLogin }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onLogin(email, password);
        } catch (err) {
            setError((err as Error).message || 'Login gagal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative z-30 flex min-h-screen items-center justify-center bg-black text-white">
            <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-xs flex-col gap-4"
            >
                <h1 className="text-center text-2xl font-bold">Login Admin</h1>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="username"
                    required
                    className="rounded-xl px-4 py-3 text-black"
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    className="rounded-xl px-4 py-3 text-black"
                />

                {error && <p className="text-center text-sm text-red-400">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40"
                >
                    {isSubmitting ? 'Masuk...' : 'Login'}
                </button>
            </form>
        </main>
    );
}

import { useCallback, useEffect, useState } from 'react';
import { getXsrfToken } from '@/utils/csrf';

export type AdminUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
};

export function useAdminAuth() {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshMe = useCallback(async () => {
        const res = await fetch('/api/admin/me', {
            headers: { Accept: 'application/json' },
        });

        if (res.ok) {
            const body = await res.json();
            setUser(body.user);
        } else {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        refreshMe().finally(() => setIsLoading(false));
    }, [refreshMe]);

    const login = useCallback(async (email: string, password: string) => {
        setError(null);

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': getXsrfToken(),
            },
            body: JSON.stringify({ email, password }),
        });

        const body = await res.json();

        if (!res.ok) {
            const message = body.message ?? 'Login gagal.';
            setError(message);
            throw new Error(message);
        }

        setUser(body.user);
        return body.user as AdminUser;
    }, []);

    const logout = useCallback(async () => {
        // Clear client-side state up front so the UI reacts immediately -
        // previously this awaited the network round trip first, so the
        // login form only appeared after the request resolved.
        setUser(null);

        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': getXsrfToken() },
            });
        } catch {
            // The user is already logged out client-side regardless of
            // whether the server request itself succeeded.
        }
    }, []);

    return { user, isLoading, error, login, logout };
}

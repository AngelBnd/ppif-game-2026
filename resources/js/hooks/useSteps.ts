import { useEffect, useState } from 'react';
import type { Step } from '@/types/step';

type StepsState = {
    steps: Step[];
    isLoading: boolean;
    error: string | null;
};

export function useSteps(): StepsState {
    const [steps, setSteps] = useState<Step[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/steps')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load steps');
                return res.json();
            })
            .then((body: { data: Step[] }) => {
                if (!cancelled) setSteps(body.data);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { steps, isLoading, error };
}

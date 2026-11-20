import { useCallback, useEffect, useState } from "react";

export function useResource<T>(load: () => Promise<T>) {
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState<{
        data: T | null;
        error: string;
        loader: typeof load | null;
        revision: number;
    }>({ data: null, error: "", loader: null, revision: -1 });
    const reload = useCallback(() => setRevision((v) => v + 1), []);
    useEffect(() => {
        let active = true;
        load()
            .then((data) => {
                if (active)
                    setState({ data, error: "", loader: load, revision });
            })
            .catch((error: unknown) => {
                if (active)
                    setState({
                        data: null,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Something went wrong. Please try again.",
                        loader: load,
                        revision,
                    });
            });
        return () => {
            active = false;
        };
    }, [load, revision]);
    const loading = state.loader !== load || state.revision !== revision;
    return {
        data: loading ? null : state.data,
        error: loading ? "" : state.error,
        loading,
        reload,
    };
}

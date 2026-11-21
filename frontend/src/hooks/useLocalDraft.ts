import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalDraft(key: string) {
    const [value, setValue] = useState(() => {
        try {
            return sessionStorage.getItem(key) || "";
        } catch {
            return "";
        }
    });
    const [error, setError] = useState("");
    const latest = useRef(value);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const change = useCallback(
        (code: string) => {
            latest.current = code;
            setValue(code);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                try {
                    sessionStorage.setItem(key, code);
                    setError("");
                } catch {
                    setError("This tab couldn’t save your draft. Copy your code before leaving.");
                }
            }, 300);
        },
        [key],
    );

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
            try {
                sessionStorage.setItem(key, latest.current);
            } catch {
                /* Keep the in-memory draft when storage is unavailable. */
            }
        },
        [key],
    );

    return { value, change, error };
}

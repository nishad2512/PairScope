import { useEffect, useId, useRef } from "react";
import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
} from "react";
import { AlertCircle, CircleCheck, LoaderCircle, X } from "lucide-react";

export function Button({
    children,
    variant = "primary",
    className = "",
    busy,
    disabled,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    busy?: boolean;
}) {
    return (
        <button
            className={`button button-${variant} ${className}`}
            disabled={busy || disabled}
            aria-busy={busy || undefined}
            {...props}
        >
            {busy && <LoaderCircle className="spin" size={16} />}
            {children}
        </button>
    );
}
export function Field({
    label,
    hint,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
    const generatedId = useId();
    const id = props.id || generatedId;
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <input
                {...props}
                id={id}
                aria-describedby={
                    [props["aria-describedby"], hint ? `${id}-hint` : ""]
                        .filter(Boolean)
                        .join(" ") || undefined
                }
            />
            {hint && <small id={`${id}-hint`}>{hint}</small>}
        </div>
    );
}
export function Select({
    label,
    children,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
    return (
        <label className="field">
            <span>{label}</span>
            <select {...props}>{children}</select>
        </label>
    );
}
export function Notice({
    children,
    success = false,
}: {
    children: ReactNode;
    success?: boolean;
}) {
    return (
        <div
            className={`notice ${success ? "notice-success" : ""}`}
            role={success ? "status" : "alert"}
        >
            {success ? <CircleCheck size={18} /> : <AlertCircle size={18} />}
            <span>{children}</span>
        </div>
    );
}
export function EmptyState({
    icon,
    title,
    children,
    action,
}: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{children}</p>
            {action}
        </div>
    );
}
export function Loading() {
    return (
        <div className="loading" role="status">
            <LoaderCircle className="spin" size={24} />
            <span>Getting things ready…</span>
        </div>
    );
}
export function Modal({
    title,
    description,
    children,
    onClose,
    busy = false,
    eyebrow = "YOUR WORKSPACE",
}: {
    title: string;
    description: string;
    children: ReactNode;
    onClose: () => void;
    busy?: boolean;
    eyebrow?: string;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const id = useId();
    const pressedBackdrop = useRef(false);
    useEffect(() => {
        const dialog = ref.current;
        const previousFocus = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog?.showModal();
        dialog
            ?.querySelector<HTMLElement>(
                "input:not([readonly]), select, textarea",
            )
            ?.focus();
        return () => {
            dialog?.close();
            document.body.style.overflow = overflow;
            if (
                previousFocus instanceof HTMLElement &&
                previousFocus.isConnected
            ) {
                previousFocus.focus({ preventScroll: true });
            }
        };
    }, []);
    const close = () => {
        if (!busy) onClose();
    };
    return (
        <dialog
            ref={ref}
            className="modal"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            aria-busy={busy || undefined}
            onCancel={(event) => {
                event.preventDefault();
                close();
            }}
            onPointerDown={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                pressedBackdrop.current =
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom;
            }}
            onClick={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const outside =
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom;
                if (pressedBackdrop.current && outside) close();
                pressedBackdrop.current = false;
            }}
        >
            <div className="modal-inner">
                <button
                    className="icon-button modal-close"
                    aria-label="Close dialog"
                    type="button"
                    disabled={busy}
                    onClick={close}
                >
                    <X size={20} />
                </button>
                <span className="eyebrow">{eyebrow}</span>
                <h2 id={`${id}-title`}>{title}</h2>
                <p id={`${id}-description`} className="muted">
                    {description}
                </p>
                {children}
            </div>
        </dialog>
    );
}
export function Badge({
    children,
    tone = "",
}: {
    children: ReactNode;
    tone?: string;
}) {
    return <span className={`badge ${tone}`}>{children}</span>;
}
export function Avatar({
    name,
    small = false,
}: {
    name: string;
    small?: boolean;
}) {
    return (
        <span className={`avatar ${small ? "avatar-small" : ""}`}>
            {name
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
        </span>
    );
}

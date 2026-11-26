import { useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/primitives";

export default function CopyLink({ value }: { value: string }) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<"ready" | "copied" | "manual">(
        "ready",
    );

    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            setStatus("copied");
        } catch {
            input.current?.focus();
            input.current?.select();
            setStatus("manual");
        }
    }

    return (
        <div className="field invitation-link">
            <label htmlFor={id}>Invitation link</label>
            <div className="copy-link-row">
                <input
                    ref={input}
                    id={id}
                    value={value}
                    readOnly
                    onFocus={(event) => event.currentTarget.select()}
                    aria-describedby={`${id}-help`}
                />
                <Button type="button" variant="secondary" onClick={copy}>
                    {status === "copied" ? (
                        <Check size={16} />
                    ) : (
                        <Copy size={16} />
                    )}
                    {status === "copied" ? "Copied" : "Copy link"}
                </Button>
            </div>
            <small id={`${id}-help`} role="status">
                {status === "copied"
                    ? "Link copied. Share it with the invited person."
                    : status === "manual"
                      ? "The link is selected. Copy it manually to share."
                      : "Only the invited account can use this link."}
            </small>
        </div>
    );
}

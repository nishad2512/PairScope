import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Bug, ChevronDown, ChevronUp, Terminal } from "lucide-react";

type Tab = "terminal" | "debug";

export default function SessionConsole() {
    const [tab, setTab] = useState<Tab>("terminal");
    const [open, setOpen] = useState(true);

    function selectTab(value: Tab) {
        setTab(value);
        setOpen(true);
    }

    function moveTab(event: KeyboardEvent, next: Tab) {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            selectTab(next);
            document.getElementById(`${next}-tab`)?.focus();
        }
    }

    return (
        <section
            className={`session-console ${open ? "" : "collapsed"}`}
            aria-label="Session output"
        >
            <div className="console-tabs">
                <div className="console-tab-buttons" role="tablist" aria-label="Output panels">
                    <button
                        id="terminal-tab"
                        role="tab"
                        aria-selected={tab === "terminal"}
                        aria-controls="console-content"
                        tabIndex={tab === "terminal" ? 0 : -1}
                        onKeyDown={(event) => moveTab(event, "debug")}
                        onClick={() => selectTab("terminal")}
                    >
                        <Terminal size={15} />
                        Terminal
                    </button>
                    <button
                        id="debug-tab"
                        role="tab"
                        aria-selected={tab === "debug"}
                        aria-controls="console-content"
                        tabIndex={tab === "debug" ? 0 : -1}
                        onKeyDown={(event) => moveTab(event, "terminal")}
                        onClick={() => selectTab("debug")}
                    >
                        <Bug size={15} />
                        Debug
                    </button>
                </div>
                <span>Execution unavailable</span>
                <button
                    className="console-collapse"
                    aria-label={open ? "Collapse output panel" : "Expand output panel"}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    {open ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                </button>
            </div>
            {open && (
                <div
                    id="console-content"
                    role="tabpanel"
                    aria-labelledby={tab === "terminal" ? "terminal-tab" : "debug-tab"}
                    tabIndex={0}
                >
                    <span className="console-prompt">{tab === "terminal" ? ">_" : "◉"}</span>
                    <div>
                        <strong>
                            {tab === "terminal"
                                ? "Your output will appear here."
                                : "A closer look, when you need it."}
                        </strong>
                        <p>
                            {tab === "terminal"
                                ? "Code execution isn’t available yet. Your code is shared with this session."
                                : "Breakpoints, variables, and the call stack will appear when debugging is available."}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

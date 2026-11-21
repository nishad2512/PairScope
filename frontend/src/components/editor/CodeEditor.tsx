import { useEffect, useRef } from "react";
import { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";
import * as monaco from "monaco-editor/editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import "monaco-editor/languages/definitions/javascript/register.js";
import "monaco-editor/languages/definitions/typescript/register.js";
import "monaco-editor/languages/definitions/python/register.js";
import "monaco-editor/languages/definitions/java/register.js";
import "monaco-editor/languages/definitions/cpp/register.js";
import "monaco-editor/languages/definitions/go/register.js";
import "monaco-editor/features/find/register.js";
import "monaco-editor/features/bracketMatching/register.js";
import { participantColor } from "../../lib/presence";
import type {
    CursorPosition,
    CursorUpdate,
    PresenceParticipant,
    RemoteCursor,
} from "../../types/realtime.types";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
monaco.editor.defineTheme("pairscope", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
        "editor.background": "#171a21",
        "editorLineNumber.foreground": "#555e70",
        "editorLineNumber.activeForeground": "#bdc6d8",
        "editor.lineHighlightBackground": "#1e222d",
        "editorCursor.foreground": "#ee9b64",
        "editor.selectionBackground": "#414b6c70",
    },
});

interface Props {
    sessionId: string;
    language: string;
    document: Y.Doc;
    content: string;
    readOnly: boolean;
    participants: PresenceParticipant[];
    cursors: Record<string, RemoteCursor>;
    onCursor: (value: Pick<CursorUpdate, "cursor" | "selection">) => void;
    onPosition: (position: CursorPosition) => void;
}

export default function CodeEditor({
    sessionId,
    language,
    document: sharedDocument,
    content,
    readOnly,
    participants,
    cursors,
    onCursor,
    onPosition,
}: Props) {
    const container = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!container.current) return;
        const editor = monaco.editor.create(container.current, {
            value: "",
            readOnly: true,
            language: "plaintext",
            theme: "pairscope",
            ariaLabel: "Session code editor",
            automaticLayout: true,
            fontSize: 14,
            lineHeight: 24,
            fontFamily:
                "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
            minimap: { enabled: false },
            padding: { top: 22, bottom: 24 },
            scrollBeyondLastLine: false,
            tabSize: 4,
            insertSpaces: true,
            renderLineHighlight: "all",
            contextmenu: true,
            wordWrap: "on",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
        });
        editorRef.current = editor;
        const binding = new MonacoBinding(
            sharedDocument.getText("code"),
            editor.getModel()!,
            new Set([editor]),
        );
        const publish = () => {
            const position = editor.getPosition();
            const selection = editor.getSelection();
            if (position) onPosition(position);
            onCursor({
                cursor: position,
                selection:
                    selection && !selection.isEmpty()
                        ? {
                              startLineNumber: selection.startLineNumber,
                              startColumn: selection.startColumn,
                              endLineNumber: selection.endLineNumber,
                              endColumn: selection.endColumn,
                          }
                        : null,
            });
        };
        const listeners = [
            editor.onDidChangeCursorSelection(publish),
            editor.onDidFocusEditorText(publish),
            editor.onDidBlurEditorText(() =>
                onCursor({ cursor: null, selection: null }),
            ),
        ];
        return () => {
            binding.destroy();
            listeners.forEach((listener) => listener.dispose());
            const model = editor.getModel();
            editor.dispose();
            model?.dispose();
            editorRef.current = null;
        };
    }, [sessionId, sharedDocument, onCursor, onPosition]);

    useEffect(() => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (model) monaco.editor.setModelLanguage(model, language);
        editor?.updateOptions({ readOnly });
    }, [language, readOnly, sessionId]);

    useEffect(() => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;
        const widgets: monaco.editor.IContentWidget[] = [];
        const decorations: monaco.editor.IModelDeltaDecoration[] = [];
        for (const peer of participants) {
            const remote = cursors[peer.socketId];
            if (
                !remote?.cursor ||
                remote.cursor.lineNumber > model.getLineCount()
            )
                continue;
            const color = participantColor(peer.id);
            const node = document.createElement("div");
            node.className = "pair-remote-caret";
            node.style.setProperty("--peer-color", color);
            const label = document.createElement("span");
            label.textContent = peer.displayName;
            node.append(label);
            const widget: monaco.editor.IContentWidget = {
                getId: () => `presence-${peer.socketId}`,
                getDomNode: () => node,
                getPosition: () => ({
                    position: model.validatePosition(remote.cursor!),
                    preference: [
                        monaco.editor.ContentWidgetPositionPreference.EXACT,
                    ],
                }),
            };
            editor.addContentWidget(widget);
            widgets.push(widget);
            if (
                remote.selection &&
                remote.selection.endLineNumber <= model.getLineCount()
            ) {
                const selection = remote.selection;
                decorations.push({
                    range: new monaco.Range(
                        selection.startLineNumber,
                        selection.startColumn,
                        selection.endLineNumber,
                        selection.endColumn,
                    ),
                    options: {
                        className: "pair-remote-selection",
                        inlineClassName: "pair-remote-selection",
                    },
                });
            }
        }
        const collection = editor.createDecorationsCollection(decorations);
        return () => {
            collection.clear();
            widgets.forEach((widget) => editor.removeContentWidget(widget));
        };
    }, [participants, cursors, sessionId, content]);

    return (
        <div
            ref={container}
            className="session-code-editor"
            aria-label="Code workspace"
        />
    );
}

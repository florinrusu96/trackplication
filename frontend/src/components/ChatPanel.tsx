import { useState } from "react";
import { api, ApiError } from "../api";
import type { Application, Extracted } from "../types";
import { CloseIcon, SendIcon, SparkleIcon } from "./icons";
import ExtractCard from "./ExtractCard";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  extracted?: Extracted;
  rawInput?: string;
  added?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (app: Application) => void;
}

let seq = 0;
const nextId = () => `m${seq++}`;

export default function ChatPanel({ open, onClose, onCreated }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
    setBusy(true);
    try {
      const extracted = await api.extract(text);
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          text: "Here's what I pulled out — edit anything, then add it:",
          extracted,
          rawInput: text,
        },
      ]);
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : "Something went wrong.";
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "assistant", text: `Couldn't extract that: ${detail}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function add(msgId: string, edited: Extracted, rawInput?: string) {
    try {
      const created = await api.createApplication({ ...edited, raw_input: rawInput });
      setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, added: true } : x)));
      onCreated(created);
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : "Save failed.";
      setMessages((m) => [...m, { id: nextId(), role: "assistant", text: detail }]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l sm:w-[380px]"
      style={{
        background: "#101318",
        borderColor: "rgba(255,255,255,.08)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .22s ease",
        boxShadow: "-12px 0 32px rgba(0,0,0,.35)",
      }}
    >
      <div className="flex flex-none items-center gap-2.5 border-b px-[18px] py-4" style={{ borderColor: "rgba(255,255,255,.06)" }}>
        <div
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg text-white"
          style={{ background: "linear-gradient(155deg,#7c9ae0,#5b78bf)" }}
        >
          <SparkleIcon size={13} />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold" style={{ color: "#f2f3f5" }}>AI Capture Assistant</div>
          <div className="text-[11.5px]" style={{ color: "#5b6270" }}>Paste a posting — I'll extract the fields</div>
        </div>
        <button onClick={onClose} className="flex h-[26px] w-[26px] items-center justify-center rounded-md" style={{ color: "#6b7280" }}>
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-[18px] py-4">
        {messages.length === 0 && (
          <div
            className="rounded-[10px] border px-3.5 py-3 text-[12.5px] leading-relaxed"
            style={{ background: "#14171d", borderColor: "rgba(255,255,255,.06)", color: "#5b6270" }}
          >
            Paste the text of a job posting (or a link plus description) below. I'll pull out the
            company, role, location, salary, and key requirements, then you can add it to your
            tracker with one click.
          </div>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <div
              key={msg.id}
              className="max-w-[85%] self-end whitespace-pre-wrap rounded-[10px_10px_2px_10px] px-3 py-[9px] text-[13px] leading-relaxed"
              style={{ background: "rgba(124,154,224,.14)", color: "#dbe3f5" }}
            >
              {msg.text}
            </div>
          ) : (
            <div
              key={msg.id}
              className="max-w-[92%] self-start rounded-[10px_10px_10px_2px] border px-3 py-[11px] text-[12.5px] leading-relaxed"
              style={{ background: "#14171d", borderColor: "rgba(255,255,255,.07)", color: "#c7cbd3" }}
            >
              <div className="mb-2">{msg.text}</div>
              {msg.extracted && (
                <ExtractCard
                  extracted={msg.extracted}
                  added={!!msg.added}
                  onAdd={(edited) => add(msg.id, edited, msg.rawInput)}
                />
              )}
            </div>
          ),
        )}

        {busy && (
          <div className="self-start px-1 py-1 text-[12.5px]" style={{ color: "#5b6270" }}>
            Extracting fields…
          </div>
        )}
      </div>

      <div className="flex flex-none items-end gap-2 border-t px-4 py-3.5" style={{ borderColor: "rgba(255,255,255,.06)" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Paste job posting text here…"
          className="max-h-[120px] min-h-[40px] flex-1 resize-y rounded-lg border px-[11px] py-[9px] text-[12.5px] leading-relaxed outline-none"
          style={{ background: "#14171d", borderColor: "rgba(255,255,255,.08)", color: "#e4e7ec" }}
        />
        <button
          onClick={send}
          disabled={busy}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-lg border disabled:opacity-50"
          style={{ borderColor: "rgba(124,154,224,.3)", background: "rgba(124,154,224,.12)", color: "#aebde8" }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

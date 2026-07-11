import { useState } from "react";
import { api, ApiError, setToken } from "../api";
import type { User } from "../types";

type Mode = "login" | "register";

export default function AuthGate({ onAuthed }: { onAuthed: (user: User) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await api.login(email.trim(), password)
          : await api.register(email.trim(), password);
      setToken(res.token);
      onAuthed(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    background: "#14171d",
    borderColor: "rgba(255,255,255,.08)",
    color: "#e4e7ec",
  };

  return (
    <div className="flex h-screen items-center justify-center px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ background: "#101318", borderColor: "rgba(255,255,255,.08)" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="h-[22px] w-[22px] flex-none rounded-md" style={{ background: "linear-gradient(155deg,#7c9ae0,#5b78bf)" }} />
          <div className="text-[15px] font-semibold" style={{ color: "#f2f3f5" }}>Tracker</div>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg border p-1" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="flex-1 rounded-md py-1.5 text-[13px] font-medium capitalize"
              style={{
                background: mode === m ? "rgba(124,154,224,.14)" : "transparent",
                color: mode === m ? "#c3d2f2" : "#6b7280",
              }}
            >
              {m === "register" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#5b6270" }}>
          Email
        </label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-3 w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
          style={inputStyle}
        />

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#5b6270" }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "register" ? 8 : undefined}
          placeholder={mode === "register" ? "At least 8 characters" : undefined}
          className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
          style={inputStyle}
        />

        {error && (
          <div className="mt-3 text-[12.5px]" style={{ color: "#cf9aa0" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg border py-2 text-[13px] font-medium disabled:opacity-60"
          style={{ borderColor: "rgba(124,154,224,.3)", background: "rgba(124,154,224,.12)", color: "#aebde8" }}
        >
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

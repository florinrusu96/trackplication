import { useState } from "react";
import { setApiKey } from "../api";

export default function ApiKeyGate({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState("");

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setApiKey(value.trim());
    onSaved();
  }

  return (
    <div className="flex h-screen items-center justify-center px-5">
      <form
        onSubmit={save}
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ background: "#101318", borderColor: "rgba(255,255,255,.08)" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <div
            className="h-[22px] w-[22px] flex-none rounded-md"
            style={{ background: "linear-gradient(155deg,#7c9ae0,#5b78bf)" }}
          />
          <div className="text-[15px] font-semibold" style={{ color: "#f2f3f5" }}>
            Tracker
          </div>
        </div>
        <p className="mb-4 mt-3 text-[13px] leading-relaxed" style={{ color: "#8b93a3" }}>
          Enter your access key to continue. It's stored in this browser only.
        </p>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Access key"
          className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
          style={{
            background: "#14171d",
            borderColor: "rgba(255,255,255,.08)",
            color: "#e4e7ec",
          }}
        />
        <button
          type="submit"
          className="mt-3 w-full rounded-lg border py-2 text-[13px] font-medium"
          style={{
            borderColor: "rgba(124,154,224,.3)",
            background: "rgba(124,154,224,.12)",
            color: "#aebde8",
          }}
        >
          Continue
        </button>
      </form>
    </div>
  );
}

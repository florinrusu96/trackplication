import { useState } from "react";
import { api, ApiError } from "../api";
import type { Application, Status } from "../types";
import { STATUS_ORDER } from "../theme";
import { CloseIcon } from "./icons";

interface Props {
  application: Application | null; // null = create a new one
  onClose: () => void;
  onSaved: (app: Application, isNew: boolean) => void;
}

interface FormState {
  company: string;
  role: string;
  status: Status;
  location: string;
  salary_text: string;
  source: string;
  url: string;
  applied_at: string;
  requirements: string; // one per line in the textarea
  notes: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function initFrom(app: Application | null): FormState {
  return {
    company: app?.company ?? "",
    role: app?.role ?? "",
    status: app?.status ?? "Applied",
    location: app?.location ?? "",
    salary_text: app?.salary_text ?? "",
    source: app?.source ?? "",
    url: app?.url ?? "",
    applied_at: app?.applied_at ?? todayISO(),
    requirements: (app?.requirements ?? []).join("\n"),
    notes: app?.notes ?? "",
  };
}

const inputStyle = {
  background: "#14171d",
  borderColor: "rgba(255,255,255,.08)",
  color: "#e4e7ec",
};
const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide";
const fieldCls = "w-full rounded-lg border px-3 py-2 text-[13px] outline-none";

export default function ApplicationModal({ application, onClose, onSaved }: Props) {
  const isNew = application === null;
  const [f, setF] = useState<FormState>(() => initFrom(application));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((cur) => ({ ...cur, [key]: value }));
  }

  const orNull = (s: string) => {
    const t = s.trim();
    return t === "" ? null : t;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!f.company.trim() || !f.role.trim()) {
      setError("Company and role are required.");
      return;
    }
    setError(null);
    setBusy(true);
    const requirements = f.requirements
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    const payload = {
      company: f.company.trim(),
      role: f.role.trim(),
      status: f.status,
      location: orNull(f.location),
      salary_text: orNull(f.salary_text),
      source: orNull(f.source),
      url: orNull(f.url),
      applied_at: f.applied_at || todayISO(),
      requirements,
      notes: f.notes,
    };
    try {
      // Narrow on `application` (not `isNew`) so TS knows it's non-null here.
      const saved = application
        ? await api.updateApplication(application.id, payload)
        : await api.createApplication(payload);
      onSaved(saved, application === null);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,.6)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-xl rounded-xl border"
        style={{
          background: "#101318",
          borderColor: "rgba(255,255,255,.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,.5)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "rgba(255,255,255,.06)" }}
        >
          <div className="text-[15px] font-semibold" style={{ color: "#f2f3f5" }}>
            {isNew ? "Add application" : "Edit application"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md"
            style={{ color: "#6b7280" }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Company *</label>
            <input value={f.company} onChange={(e) => set("company", e.target.value)} className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Role *</label>
            <input value={f.role} onChange={(e) => set("role", e.target.value)} className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Status</label>
            <select
              value={f.status}
              onChange={(e) => set("status", e.target.value as Status)}
              className={fieldCls}
              style={{ ...inputStyle, color: "#c7cbd3" }}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Date applied</label>
            <input type="date" value={f.applied_at} onChange={(e) => set("applied_at", e.target.value)} className={fieldCls} style={{ ...inputStyle, color: "#c7cbd3" }} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Location</label>
            <input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Not specified" className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Salary</label>
            <input value={f.salary_text} onChange={(e) => set("salary_text", e.target.value)} placeholder="Not listed" className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Source</label>
            <input value={f.source} onChange={(e) => set("source", e.target.value)} placeholder="e.g. LinkedIn" className={fieldCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#5b6270" }}>Link</label>
            <input value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" className={fieldCls} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} style={{ color: "#5b6270" }}>
              Requirements <span className="font-normal normal-case tracking-normal opacity-60">· one per line</span>
            </label>
            <textarea
              value={f.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              placeholder={"Distributed systems\nGo or Rust\nPayments experience"}
              className={`${fieldCls} min-h-[80px] resize-y leading-relaxed`}
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} style={{ color: "#5b6270" }}>Notes</label>
            <textarea
              value={f.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Recruiter contact, interview prep, gut feeling…"
              className={`${fieldCls} min-h-[70px] resize-y leading-relaxed`}
              style={inputStyle}
            />
          </div>
        </div>

        {error && (
          <div className="px-5 pb-1 text-[12.5px]" style={{ color: "#cf9aa0" }}>{error}</div>
        )}

        <div
          className="flex items-center justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: "rgba(255,255,255,.06)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-[13px]"
            style={{ borderColor: "rgba(255,255,255,.08)", color: "#8b93a3" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border px-4 py-2 text-[13px] font-medium disabled:opacity-60"
            style={{ borderColor: "rgba(124,154,224,.3)", background: "rgba(124,154,224,.12)", color: "#aebde8" }}
          >
            {busy ? "Saving…" : isNew ? "Add application" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

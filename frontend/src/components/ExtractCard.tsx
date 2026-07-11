import { useState } from "react";
import type { Extracted } from "../types";

interface Props {
  extracted: Extracted;
  added: boolean;
  onAdd: (edited: Extracted) => void;
}

const FIELDS: { key: keyof Extracted; label: string; placeholder: string }[] = [
  { key: "company", label: "Company", placeholder: "Company" },
  { key: "role", label: "Role", placeholder: "Role" },
  { key: "location", label: "Location", placeholder: "Not specified" },
  { key: "salary_text", label: "Salary", placeholder: "Not listed" },
  { key: "source", label: "Source", placeholder: "e.g. LinkedIn" },
  { key: "url", label: "Link", placeholder: "https://…" },
];

export default function ExtractCard({ extracted, added, onAdd }: Props) {
  const [fields, setFields] = useState<Extracted>(extracted);

  function set(key: keyof Extracted, value: string) {
    setFields((f) => ({ ...f, [key]: value === "" ? null : value }));
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3"
      style={{ background: "#0d0f13", borderColor: "rgba(255,255,255,.06)" }}
    >
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map(({ key, label, placeholder }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#5b6270" }}>
              {label}
            </span>
            <input
              value={(fields[key] as string | null) ?? ""}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              disabled={added}
              className="rounded-md border px-2 py-1.5 text-[12px] outline-none disabled:opacity-60"
              style={{ background: "#14171d", borderColor: "rgba(255,255,255,.08)", color: "#e4e7ec" }}
            />
          </label>
        ))}
      </div>

      {fields.requirements.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {fields.requirements.map((r, i) => (
            <span
              key={i}
              className="rounded-[5px] px-2 py-[3px] text-[11px]"
              style={{ background: "rgba(255,255,255,.05)", color: "#a9afba" }}
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => onAdd(fields)}
        disabled={added || !fields.company.trim() || !fields.role.trim()}
        className="mt-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium disabled:cursor-default"
        style={{
          borderColor: "rgba(124,154,224,.3)",
          background: added ? "rgba(127,185,154,.14)" : "rgba(124,154,224,.12)",
          color: added ? "#8fc7a6" : "#aebde8",
        }}
      >
        {added ? "Added ✓" : "Add to tracker"}
      </button>
    </div>
  );
}

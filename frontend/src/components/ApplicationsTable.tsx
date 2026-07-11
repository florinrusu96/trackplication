import { useState } from "react";
import type { Application } from "../types";
import ApplicationRow, { GRID } from "./ApplicationRow";

interface Props {
  apps: Application[];
  onCycleStatus: (app: Application) => void;
  onNotes: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  onEdit: (app: Application) => void;
}

const HEADERS = ["Company", "Role", "Location", "Salary", "Status", "Applied", "Source", "", ""];

export default function ApplicationsTable({
  apps,
  onCycleStatus,
  onNotes,
  onDelete,
  onEdit,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ background: "#101318", borderColor: "rgba(255,255,255,.07)" }}
    >
      {/* Header row — desktop only */}
      <div
        className="hidden px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide md:grid"
        style={{
          gridTemplateColumns: GRID,
          background: "#14171d",
          borderBottom: "1px solid rgba(255,255,255,.07)",
          color: "#5b6270",
        }}
      >
        {HEADERS.map((h, i) => (
          <div key={i} className="truncate pr-2">
            {h}
          </div>
        ))}
      </div>

      {apps.map((app) => (
        <ApplicationRow
          key={app.id}
          app={app}
          expanded={expandedId === app.id}
          onToggle={() => setExpandedId((cur) => (cur === app.id ? null : app.id))}
          onCycleStatus={() => onCycleStatus(app)}
          onNotes={(v) => onNotes(app.id, v)}
          onDelete={() => onDelete(app.id)}
          onEdit={() => onEdit(app)}
        />
      ))}

      {apps.length === 0 && (
        <div className="px-4 py-10 text-center text-[13px]" style={{ color: "#5b6270" }}>
          No applications match your filters.
        </div>
      )}
    </div>
  );
}

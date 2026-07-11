import { useEffect, useRef, useState } from "react";
import type { Application, Status } from "../types";
import { STATUS_META, fmtDate, sourceColor } from "../theme";
import { ChevronIcon, ExternalIcon, TrashIcon } from "./icons";

const GRID = "1.5fr 1.7fr 1.1fr 0.95fr 118px 100px 92px 34px 22px";

interface Props {
  app: Application;
  expanded: boolean;
  onToggle: () => void;
  onCycleStatus: () => void;
  onNotes: (value: string) => void;
  onDelete: () => void;
  onEdit: () => void;
}

function StatusPill({ status, onClick }: { status: Status; onClick: (e: React.MouseEvent) => void }) {
  const meta = STATUS_META[status];
  return (
    <span
      onClick={onClick}
      title="Click to change status"
      className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] py-[3px] text-[12px] font-medium"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: meta.fg }} />
      {status}
    </span>
  );
}

export default function ApplicationRow({
  app,
  expanded,
  onToggle,
  onCycleStatus,
  onNotes,
  onDelete,
  onEdit,
}: Props) {
  const [notes, setNotes] = useState(app.notes);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Keep local notes in sync if the row is replaced (e.g. after a reload).
  useEffect(() => setNotes(app.notes), [app.id, app.notes]);

  function editNotes(value: string) {
    setNotes(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onNotes(value), 600);
  }

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCycleStatus();
  };

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      {/* Desktop grid row */}
      <div
        onClick={onToggle}
        className="hidden cursor-pointer items-center px-4 py-[13px] transition-colors md:grid"
        style={{
          gridTemplateColumns: GRID,
          background: expanded ? "rgba(255,255,255,.025)" : "transparent",
        }}
      >
        <div className="truncate pr-2 font-medium" style={{ color: "#eceef1" }}>{app.company}</div>
        <div className="truncate pr-2" style={{ color: "#c7cbd3" }}>{app.role}</div>
        <div className="truncate pr-2 text-[13px]" style={{ color: "#8b93a3" }}>{app.location ?? "—"}</div>
        <div className="mono text-[12.5px]" style={{ color: "#8b93a3" }}>{app.salary_text ?? "—"}</div>
        <div><StatusPill status={app.status} onClick={cycle} /></div>
        <div className="mono text-[12.5px]" style={{ color: "#8b93a3" }}>{fmtDate(app.applied_at)}</div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#7d8494" }}>
          {app.source && (
            <span className="h-1.5 w-1.5 flex-none rounded-sm" style={{ background: sourceColor(app.source) }} />
          )}
          {app.source ?? "—"}
        </div>
        <div>
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex"
              style={{ color: "#5b6270" }}
              title="Open posting"
            >
              <ExternalIcon />
            </a>
          )}
        </div>
        <div
          style={{ color: "#4a5060", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .15s" }}
        >
          <ChevronIcon />
        </div>
      </div>

      {/* Mobile card */}
      <div onClick={onToggle} className="flex cursor-pointer flex-col gap-1.5 px-4 py-3.5 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-medium" style={{ color: "#eceef1" }}>{app.company}</div>
            <div className="truncate text-[13px]" style={{ color: "#c7cbd3" }}>{app.role}</div>
          </div>
          <div
            style={{ color: "#4a5060", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .15s" }}
          >
            <ChevronIcon />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <StatusPill status={app.status} onClick={cycle} />
          <span className="mono text-[12.5px]" style={{ color: "#8b93a3" }}>{fmtDate(app.applied_at)}</span>
        </div>
      </div>

      {/* Expanded detail (shared) */}
      {expanded && (
        <div className="px-4 pb-5 pt-1.5" style={{ background: "#0f1216" }}>
          <div
            className="grid grid-cols-1 gap-6 rounded-[10px] border px-5 py-4 md:grid-cols-2"
            style={{ background: "#131620", borderColor: "rgba(255,255,255,.05)" }}
          >
            <div>
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#5b6270" }}>
                Key requirements{" "}
                <span className="font-normal normal-case tracking-normal opacity-60">· extracted by AI</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {app.requirements.length === 0 && (
                  <span className="text-[12px]" style={{ color: "#5b6270" }}>None listed</span>
                )}
                {app.requirements.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-md border px-2.5 py-[5px] text-[12px]"
                    style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.06)", color: "#a9afba" }}
                  >
                    {r}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px]" style={{ color: "#5b6270" }}>
                <span>
                  {app.source ? <>Posted on <span style={{ color: "#8b93a3" }}>{app.source}</span> · </> : null}
                  Applied <span style={{ color: "#8b93a3" }}>{fmtDate(app.applied_at)}</span>
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="rounded-md border px-2 py-1 text-[11px]"
                    style={{ borderColor: "rgba(124,154,224,.25)", color: "#aebde8" }}
                    title="Edit application"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
                    style={{ borderColor: "rgba(196,142,148,.25)", color: "#cf9aa0" }}
                    title="Delete application"
                  >
                    <TrashIcon /> Delete
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#5b6270" }}>
                Your notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => editNotes(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add notes — recruiter contact, interview prep, gut feeling…"
                className="min-h-[84px] w-full resize-y rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed outline-none"
                style={{ background: "#0d0f13", borderColor: "rgba(255,255,255,.08)", color: "#c7cbd3" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { GRID };

import { STATUS_META, STATUS_ORDER } from "../theme";
import type { Status } from "../types";

interface Props {
  total: number;
  counts: Record<Status, number>;
  statusFilter: Status | "all";
  onFilter: (s: Status) => void;
}

export default function SummaryCards({ total, counts, statusFilter, onFilter }: Props) {
  return (
    <div className="mt-[22px] grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
      <div
        className="min-w-[110px] rounded-[10px] border px-[18px] py-[13px]"
        style={{ background: "#14171d", borderColor: "rgba(255,255,255,.06)" }}
      >
        <div className="mono text-[22px] font-semibold" style={{ color: "#f5f6f8" }}>
          {total}
        </div>
        <div className="mt-0.5 text-[12px]" style={{ color: "#6b7280" }}>
          Total
        </div>
      </div>

      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          onClick={() => onFilter(s)}
          className="min-w-[110px] rounded-[10px] border px-[18px] py-[13px] text-left transition-colors"
          style={{
            background: statusFilter === s ? "rgba(255,255,255,.05)" : "transparent",
            borderColor: "rgba(255,255,255,.06)",
          }}
        >
          <div className="mono text-[22px] font-semibold" style={{ color: STATUS_META[s].fg }}>
            {counts[s]}
          </div>
          <div className="mt-0.5 text-[12px]" style={{ color: "#6b7280" }}>
            {s}
          </div>
        </button>
      ))}
    </div>
  );
}

import { forwardRef } from "react";
import { SearchIcon } from "./icons";
import type { Status } from "../types";

export type SortKey = "date_desc" | "date_asc" | "company_asc" | "status";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: Status | "all";
  onStatusFilter: (v: Status | "all") => void;
  sortKey: SortKey;
  onSort: (v: SortKey) => void;
}

const selectStyle = {
  background: "#14171d",
  borderColor: "rgba(255,255,255,.08)",
  color: "#c7cbd3",
};

const Controls = forwardRef<HTMLInputElement, Props>(function Controls(
  { search, onSearch, statusFilter, onStatusFilter, sortKey, onSort },
  searchRef,
) {
  return (
    <div className="mt-[22px] flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-[320px]">
        <div className="pointer-events-none absolute left-[11px] top-[9px] opacity-50">
          <SearchIcon />
        </div>
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search company or role…"
          className="w-full rounded-lg border py-2 pl-8 pr-3 text-[13px] outline-none"
          style={{ background: "#14171d", borderColor: "rgba(255,255,255,.08)", color: "#e4e7ec" }}
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilter(e.target.value as Status | "all")}
        className="rounded-lg border px-2.5 py-2 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="all">All statuses</option>
        <option value="Applied">Applied</option>
        <option value="Interviewing">Interviewing</option>
        <option value="Offer">Offer</option>
        <option value="Rejected">Rejected</option>
        <option value="Ghosted">Ghosted</option>
      </select>
      <select
        value={sortKey}
        onChange={(e) => onSort(e.target.value as SortKey)}
        className="rounded-lg border px-2.5 py-2 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="date_desc">Newest first</option>
        <option value="date_asc">Oldest first</option>
        <option value="company_asc">Company A–Z</option>
        <option value="status">Status</option>
      </select>
    </div>
  );
});

export default Controls;

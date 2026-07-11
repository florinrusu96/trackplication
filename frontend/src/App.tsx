import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, clearToken, getToken } from "./api";
import type { Application, Status, User } from "./types";
import { STATUS_ORDER, nextStatus } from "./theme";
import AuthGate from "./components/AuthGate";
import Sidebar from "./components/Sidebar";
import SummaryCards from "./components/SummaryCards";
import Controls, { type SortKey } from "./components/Controls";
import ApplicationsTable from "./components/ApplicationsTable";
import ApplicationModal from "./components/ApplicationModal";
import EmptyState from "./components/EmptyState";
import ChatPanel from "./components/ChatPanel";
import Toast, { type ToastData } from "./components/Toast";
import { SparkleIcon } from "./components/icons";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");

  const [chatOpen, setChatOpen] = useState(false);
  // null = closed; { app: null } = add form; { app } = edit form.
  const [modal, setModal] = useState<{ app: Application | null } | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLInputElement>(null);

  function logout() {
    clearToken();
    setUser(null);
    setApps([]);
  }

  // Validate any stored token on mount.
  useEffect(() => {
    if (!getToken()) {
      setAuthChecked(true);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      setApps(await api.listApplications());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  // `/` focuses search (unless already typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(el.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function showToast(data: ToastData) {
    setToast(data);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  function onCreated(app: Application) {
    setApps((cur) => [app, ...cur]);
    showToast({ company: app.company, role: app.role });
  }

  function onSaved(app: Application, isNew: boolean) {
    if (isNew) {
      setApps((cur) => [app, ...cur]);
      showToast({ company: app.company, role: app.role });
    } else {
      setApps((cur) => cur.map((a) => (a.id === app.id ? app : a)));
    }
  }

  async function patchOptimistic(id: string, patch: Partial<Application>) {
    const prev = apps;
    setApps((cur) => cur.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    try {
      const updated = await api.updateApplication(id, patch);
      setApps((cur) => cur.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setApps(prev); // rollback
    }
  }

  function cycleStatus(app: Application) {
    patchOptimistic(app.id, { status: nextStatus(app.status) });
  }

  function editNotes(id: string, value: string) {
    patchOptimistic(id, { notes: value });
  }

  async function remove(id: string) {
    const prev = apps;
    setApps((cur) => cur.filter((a) => a.id !== id));
    try {
      await api.deleteApplication(id);
    } catch {
      setApps(prev);
    }
  }

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<Status, number>;
    for (const a of apps) c[a.status]++;
    return c;
  }, [apps]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = apps.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q && !a.company.toLowerCase().includes(q) && !a.role.toLowerCase().includes(q))
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "date_desc":
          return b.applied_at.localeCompare(a.applied_at) || b.created_at.localeCompare(a.created_at);
        case "date_asc":
          return a.applied_at.localeCompare(b.applied_at);
        case "company_asc":
          return a.company.localeCompare(b.company);
        case "status":
          return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      }
    });
    return list;
  }, [apps, search, statusFilter, sortKey]);

  if (!authChecked) return <div className="h-screen" />;
  if (!user) return <AuthGate onAuthed={setUser} />;

  const isEmpty = apps.length === 0 && !loading && !loadError;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar onOpenChat={() => setChatOpen(true)} email={user.email} onLogout={logout} />

      {/* Mobile logo bar */}
      <div
        className="fixed inset-x-0 top-0 z-10 flex items-center gap-2 border-b px-4 py-3 md:hidden"
        style={{ background: "#101318", borderColor: "rgba(255,255,255,.06)" }}
      >
        <div className="h-[20px] w-[20px] rounded-md" style={{ background: "linear-gradient(155deg,#7c9ae0,#5b78bf)" }} />
        <div className="text-[14px] font-semibold" style={{ color: "#f2f3f5" }}>Tracker</div>
        <button
          onClick={logout}
          className="ml-auto rounded-md border px-2 py-1 text-[11px]"
          style={{ borderColor: "rgba(255,255,255,.08)", color: "#6b7280" }}
        >
          Log out
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pt-[52px] md:pt-0">
        <div className="px-5 pt-6 md:px-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="text-[20px] font-semibold tracking-tight" style={{ color: "#f5f6f8" }}>
                Applications
              </div>
              <div className="mt-0.5 text-[13px]" style={{ color: "#6b7280" }}>
                Add applications by pasting a posting into the AI assistant.
              </div>
            </div>
            <button
              onClick={() => setModal({ app: null })}
              className="flex-none rounded-lg border px-3 py-2 text-[13px] font-medium"
              style={{ borderColor: "rgba(124,154,224,.3)", background: "rgba(124,154,224,.12)", color: "#aebde8" }}
            >
              + Add manually
            </button>
          </div>

          <SummaryCards
            total={apps.length}
            counts={counts}
            statusFilter={statusFilter}
            onFilter={(s) => setStatusFilter((cur) => (cur === s ? "all" : s))}
          />

          {!isEmpty && (
            <Controls
              ref={searchRef}
              search={search}
              onSearch={setSearch}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              sortKey={sortKey}
              onSort={setSortKey}
            />
          )}
        </div>

        <div className="flex-1 px-5 pb-10 pt-5 md:px-8">
          {loadError && (
            <div className="rounded-lg border px-4 py-3 text-[13px]" style={{ borderColor: "rgba(196,142,148,.25)", color: "#cf9aa0" }}>
              {loadError}{" "}
              <button className="underline" onClick={load}>
                Retry
              </button>
            </div>
          )}
          {loading && !loadError && (
            <div className="px-1 py-8 text-[13px]" style={{ color: "#5b6270" }}>Loading…</div>
          )}
          {isEmpty && <EmptyState onOpenChat={() => setChatOpen(true)} />}
          {!loading && !loadError && !isEmpty && (
            <ApplicationsTable
              apps={visible}
              onCycleStatus={cycleStatus}
              onNotes={editNotes}
              onDelete={remove}
              onEdit={(app) => setModal({ app })}
            />
          )}
        </div>
      </div>

      {/* Floating chat launcher */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          title="AI capture assistant"
          className="fixed bottom-6 right-6 z-20 flex h-[52px] w-[52px] items-center justify-center rounded-full border text-white"
          style={{
            borderColor: "rgba(124,154,224,.3)",
            background: "linear-gradient(155deg,#7c9ae0,#5b78bf)",
            boxShadow: "0 8px 24px rgba(91,120,191,.35)",
          }}
        >
          <SparkleIcon size={22} />
        </button>
      )}

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} onCreated={onCreated} />

      {modal && (
        <ApplicationModal
          application={modal.app}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}

      {toast && <Toast toast={toast} />}
    </div>
  );
}

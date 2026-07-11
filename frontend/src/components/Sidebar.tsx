import { AppsIcon, ArchiveIcon, SettingsIcon, SparkleIcon } from "./icons";

const kbd = "font-mono text-[10.5px] rounded px-1.5 py-px border";

interface Props {
  onOpenChat: () => void;
  email: string;
  onLogout: () => void;
}

export default function Sidebar({ onOpenChat, email, onLogout }: Props) {
  return (
    <div
      className="hidden w-56 flex-none flex-col border-r px-3.5 py-5 md:flex"
      style={{ background: "#101318", borderColor: "rgba(255,255,255,.06)" }}
    >
      <div className="flex items-center gap-[9px] px-2 pb-[22px] pt-1">
        <div
          className="h-[22px] w-[22px] flex-none rounded-md"
          style={{ background: "linear-gradient(155deg,#7c9ae0,#5b78bf)" }}
        />
        <div
          className="text-[14.5px] font-semibold tracking-tight"
          style={{ color: "#f2f3f5" }}
        >
          Tracker
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <div
          className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px] font-medium"
          style={{ background: "rgba(124,154,224,.12)", color: "#c3d2f2" }}
        >
          <AppsIcon /> Applications
        </div>
        <div
          className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px]"
          style={{ color: "#5b6270" }}
        >
          <ArchiveIcon /> Archive
          <span
            className="ml-auto text-[10px] font-semibold"
            style={{ color: "#3d4250" }}
          >
            SOON
          </span>
        </div>
        <div
          className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px]"
          style={{ color: "#5b6270" }}
        >
          <SettingsIcon /> Settings
          <span
            className="ml-auto text-[10px] font-semibold"
            style={{ color: "#3d4250" }}
          >
            SOON
          </span>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          onClick={onOpenChat}
          className="cursor-pointer flex items-center justify-center gap-2 rounded-lg border px-2.5 py-[9px] text-[12.5px] font-medium"
          style={{
            borderColor: "rgba(124,154,224,.25)",
            background: "rgba(124,154,224,.08)",
            color: "#aebde8",
          }}
        >
          <SparkleIcon size={13} /> Add via AI
        </button>
        <div
          className="flex flex-col gap-1.5 border-t pt-3"
          style={{ borderColor: "rgba(255,255,255,.06)" }}
        >
          <div
            className="px-0.5 text-[10.5px] font-semibold uppercase tracking-wider"
            style={{ color: "#4a5060" }}
          >
            Shortcuts
          </div>
          {[
            ["Search", "/"],
            ["Expand row", "↵"],
            ["Cycle status", "S"],
          ].map(([label, key]) => (
            <div key={label} className="flex justify-between px-0.5">
              <span className="text-[12px]" style={{ color: "#5b6270" }}>
                {label}
              </span>
              <kbd
                className={kbd}
                style={{
                  background: "#1a1e26",
                  borderColor: "rgba(255,255,255,.08)",
                  color: "#8b93a3",
                }}
              >
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-2 border-t pt-3"
          style={{ borderColor: "rgba(255,255,255,.06)" }}
        >
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[12px]"
              style={{ color: "#8b93a3" }}
              title={email}
            >
              {email}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="cursor-pointer flex-none rounded-md border px-2 py-1 text-[11px]"
            style={{ borderColor: "rgba(255,255,255,.08)", color: "#6b7280" }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

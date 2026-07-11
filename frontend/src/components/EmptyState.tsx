export default function EmptyState({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-24 text-center" style={{ color: "#5b6270" }}>
      <div
        className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border"
        style={{ background: "#14171d", borderColor: "rgba(255,255,255,.07)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 12H16M8 16H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mb-1.5 text-[15px] font-semibold" style={{ color: "#c7cbd3" }}>
        No applications yet
      </div>
      <div className="mb-[18px] max-w-[320px] text-[13px] leading-relaxed">
        Add applications by pasting a job posting into the AI assistant — it'll pull out the
        company, role, salary, and requirements for you to confirm.
      </div>
      <button
        onClick={onOpenChat}
        className="rounded-lg border px-4 py-[9px] text-[13px] font-medium"
        style={{ borderColor: "rgba(124,154,224,.3)", background: "rgba(124,154,224,.1)", color: "#aebde8" }}
      >
        Add your first application
      </button>
    </div>
  );
}

import { CheckIcon } from "./icons";

export interface ToastData {
  company: string;
  role: string;
}

export default function Toast({ toast }: { toast: ToastData }) {
  return (
    <div
      className="toast-in fixed bottom-6 right-6 z-40 flex max-w-[340px] items-center gap-3 rounded-[10px] border px-[18px] py-[14px]"
      style={{
        background: "#181c24",
        borderColor: "rgba(124,154,224,.25)",
        boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      }}
    >
      <div
        className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg"
        style={{ background: "rgba(127,185,154,.15)" }}
      >
        <CheckIcon />
      </div>
      <div>
        <div className="text-[13px] font-semibold" style={{ color: "#eceef1" }}>
          Application saved
        </div>
        <div className="mt-px text-[12.5px]" style={{ color: "#8b93a3" }}>
          {toast.company} — {toast.role}
        </div>
      </div>
    </div>
  );
}

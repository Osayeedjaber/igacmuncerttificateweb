"use client";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "info",
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const colors =
    variant === "danger"
      ? "bg-rose-500/20 border-rose-500/30"
      : variant === "warning"
      ? "bg-amber-500/20 border-amber-500/30"
      : "bg-blue-500/20 border-blue-500/30";

  const buttonColors =
    variant === "danger"
      ? "bg-rose-500 hover:bg-rose-600"
      : variant === "warning"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-emerald-500 hover:bg-emerald-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`rounded-2xl border ${colors} bg-slate-900/95 p-6 max-w-md w-full mx-4 shadow-xl`}>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl ${buttonColors} px-4 py-2 text-sm font-semibold text-white transition`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


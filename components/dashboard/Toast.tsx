"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
};

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors =
    type === "success"
      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
      : type === "error"
      ? "bg-rose-500/20 border-rose-500/30 text-rose-200"
      : "bg-blue-500/20 border-blue-500/30 text-blue-200";

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-5 ${colors}`}
    >
      <span className="text-lg">{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-white/60 hover:text-white transition"
      >
        ×
      </button>
    </div>
  );
}


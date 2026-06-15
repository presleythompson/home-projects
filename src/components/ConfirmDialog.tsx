"use client";

import { useEffect } from "react";

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl p-5 max-w-xs w-full border border-slate-100" onClick={(e) => e.stopPropagation()}>
        <p className="text-[16px] font-medium text-slate-700 mb-5 text-center">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2 text-[15px] font-semibold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-3 py-2 text-[15px] font-semibold rounded-lg bg-danger-500 text-white hover:bg-danger-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div data-overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-paper rounded-xl shadow-xl p-5 max-w-xs w-full border border-stone-100" onClick={(e) => e.stopPropagation()}>
        <p className="text-[16px] font-medium text-stone-700 mb-5 text-center">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2 text-[15px] font-semibold rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-3 py-2 text-[15px] font-semibold rounded-lg bg-danger-500 text-white hover:bg-danger-600 transition-colors cursor-pointer">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

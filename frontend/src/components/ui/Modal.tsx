"use client";

import { useCallback, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose?: () => void;
  closable?: boolean;
  children: React.ReactNode;
  title?: string;
}

export default function Modal({ open, onClose, closable = true, children, title }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable && onClose) onClose();
    },
    [closable, onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // focus trap: auto-focus panel on open
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closable ? onClose : undefined} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto outline-none animate-scale-in"
      >
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            {title && <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>}
            {closable && onClose && (
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-xl leading-none" aria-label="닫기">&times;</button>
            )}
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

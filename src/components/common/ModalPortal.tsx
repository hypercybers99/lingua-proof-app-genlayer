import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { modalManager } from "./modalManager";
import { X } from "lucide-react";

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabelledBy?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabelledBy,
  maxWidth = "max-w-2xl",
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const modalId = useRef(`modal-${Math.random().toString(36).substring(2, 9)}`);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const unregister = modalManager.register(modalId.current, onClose);
    return () => unregister();
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const el = modalContentRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  let modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "modal-root";
    document.body.appendChild(modalRoot);
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && modalManager.isTopModal(modalId.current)) {
      onClose();
    }
  };

  const titleId = ariaLabelledBy || `${modalId.current}-title`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalContentRef}
        className={`relative w-full ${maxWidth} my-8 bg-[#FBFBFA] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] rounded-xl shadow-2xl overflow-hidden transition-all text-[#111827] dark:text-[#F3F4F6]`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2D3339] bg-[#F5F5F0] dark:bg-[#13171A]">
          <h2 id={titleId} className="text-lg font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[calc(85vh-8rem)] overflow-y-auto">{children}</div>
      </div>
    </div>,
    modalRoot
  );
};

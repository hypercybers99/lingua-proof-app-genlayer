import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { modalManager } from "./modalManager";
import { X } from "lucide-react";
import { Z_CLASS } from "../../styles/zIndex";

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

    // Inert background app-root
    const appRoot = document.getElementById("app-root");
    if (appRoot) {
      appRoot.setAttribute("inert", "");
    }

    return () => {
      unregister();
      if (appRoot) {
        appRoot.removeAttribute("inert");
      }
    };
  }, [isOpen, onClose]);

  // Focus trap & tab cycling
  useEffect(() => {
    if (!isOpen) return;
    const el = modalContentRef.current;
    if (!el) return;

    const getFocusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.offsetParent !== null);

    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const currentFocusables = getFocusable();
        if (currentFocusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      className={`fixed inset-0 ${Z_CLASS.DIALOG} flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden`}
      onClick={handleBackdropClick}
      data-testid="modal-portal-overlay"
    >
      <div
        ref={modalContentRef}
        data-testid="modal-content-container"
        className={`relative w-full ${maxWidth} flex flex-col max-h-[100vh] max-h-[100dvh] my-auto bg-[#FBFBFA] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] rounded-xl shadow-2xl overflow-hidden transition-all text-[#111827] dark:text-[#F3F4F6]`}
      >
        {/* Sticky Modal Header */}
        <div
          data-testid="modal-header"
          className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2D3339] bg-[#F5F5F0] dark:bg-[#13171A]"
        >
          <h2 id={titleId} data-testid="modal-title" className="text-lg font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid="modal-close-button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body & Content */}
        <div data-testid="modal-body" className="flex-1 overflow-y-auto min-h-0 p-6">
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

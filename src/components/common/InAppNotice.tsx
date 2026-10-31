import React from "react";
import { Info, AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";

export type NoticeVariant = "info" | "warning" | "error" | "success";

interface InAppNoticeProps {
  variant?: NoticeVariant;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

export const InAppNotice: React.FC<InAppNoticeProps> = ({
  variant = "info",
  title,
  message,
  action,
  onDismiss,
  className = "",
}) => {
  const getStyles = () => {
    switch (variant) {
      case "success":
        return {
          wrapper: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
      case "warning":
        return {
          wrapper: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        };
      case "error":
        return {
          wrapper: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100",
          icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
        };
      case "info":
      default:
        return {
          wrapper: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100",
          icon: <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />,
        };
    }
  };

  const { wrapper, icon } = getStyles();

  return (
    <div className={`p-4 border rounded-xl flex items-start gap-3 shadow-sm ${wrapper} ${className}`} role="alert">
      {icon}
      <div className="flex-1 text-sm">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="opacity-90">{message}</div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

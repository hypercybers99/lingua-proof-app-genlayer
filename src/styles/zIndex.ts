/**
 * Unified Z-Index scale for LinguaProof dApp.
 * Strict hierarchy: page content < sticky header < overlay < dialog < toast.
 */
export const Z_INDEX = {
  PAGE_CONTENT: 0,
  STICKY_HEADER: 20,
  OVERLAY: 40,
  DIALOG: 50,
  TOAST: 60,
} as const;

export const Z_CLASS = {
  PAGE_CONTENT: "z-0",
  STICKY_HEADER: "z-20",
  OVERLAY: "z-40",
  DIALOG: "z-50",
  TOAST: "z-60",
} as const;

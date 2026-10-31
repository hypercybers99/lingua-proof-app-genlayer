import { FidelityClass, DefectLabel } from "./types";

/**
 * Python 3 round-half-to-even implementation.
 */
export function roundHalfToEven(n: number): number {
  const floor = Math.floor(n);
  const diff = n - floor;
  const eps = 1e-9;

  if (Math.abs(diff - 0.5) < eps) {
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return Math.round(n);
}

export interface ScoreBreakdown {
  totalSegments: number;
  preservedPoints: number;
  preservedSegments: number;
  unclearSegments: number;
  unclearRatio: number;
  defectiveSegments: number;
  rawFraction: number;
  score: number;
  fidelityClass: FidelityClass;
  formulaDisplay: string;
}

export function computeFidelityScore(
  segments: Array<{ label: DefectLabel | string; severity: number }>
): ScoreBreakdown {
  const totalSegments = segments.length;
  if (totalSegments === 0) {
    return {
      totalSegments: 0,
      preservedPoints: 0,
      preservedSegments: 0,
      unclearSegments: 0,
      unclearRatio: 0,
      defectiveSegments: 0,
      rawFraction: 0,
      score: 0,
      fidelityClass: "MATERIAL_LOSS",
      formulaDisplay: "0 / 0 = 0",
    };
  }

  let preservedSegments = 0;
  let unclearSegments = 0;
  let defectiveSegments = 0;

  for (const seg of segments) {
    if (seg.label === "UNCLEAR") {
      unclearSegments++;
    } else if (
      seg.severity === 0 &&
      (seg.label === "PRESERVED" || seg.label === "ANCHORS_OK")
    ) {
      preservedSegments++;
    } else {
      defectiveSegments++;
    }
  }

  const unclearRatio = unclearSegments / totalSegments;
  const isTooUnclear = unclearRatio > 0.25;

  const preservedPoints = preservedSegments + 0.5 * unclearSegments;
  const rawFraction = (100 * preservedPoints) / totalSegments;
  const score = Math.max(0, Math.min(100, roundHalfToEven(rawFraction)));

  let fidelityClass: FidelityClass;
  if (isTooUnclear) {
    fidelityClass = "INCONCLUSIVE";
  } else if (score >= 90) {
    fidelityClass = "FAITHFUL";
  } else if (score >= 70) {
    fidelityClass = "MINOR_SHIFT";
  } else {
    fidelityClass = "MATERIAL_LOSS";
  }

  const pointsStr =
    unclearSegments > 0
      ? `(${preservedSegments} + 0.5 * ${unclearSegments})`
      : `${preservedSegments}`;
  const formulaDisplay = `round(100 * ${pointsStr} / ${totalSegments}) = ${score}`;

  return {
    totalSegments,
    preservedPoints,
    preservedSegments,
    unclearSegments,
    unclearRatio,
    defectiveSegments,
    rawFraction,
    score,
    fidelityClass,
    formulaDisplay,
  };
}

export function getFidelityColor(fidelityClass: FidelityClass | null): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (fidelityClass) {
    case "FAITHFUL":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-300 dark:border-emerald-800",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
      };
    case "MINOR_SHIFT":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-300 dark:border-amber-800",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700",
      };
    case "MATERIAL_LOSS":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-300 dark:border-rose-800",
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-700",
      };
    case "INCONCLUSIVE":
    default:
      return {
        bg: "bg-slate-50 dark:bg-slate-900/40",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-300 dark:border-slate-700",
        badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600",
      };
  }
}

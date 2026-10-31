export interface Anchor {
  kind: "HEX_ADDRESS" | "HEX_HASH" | "URL" | "EMAIL" | "QUOTED" | "DATE" | "TICKER" | "NUMBER";
  val: string;
}

const STOP_TICKERS = new Set([
  "AI", "OK", "ID", "IP", "AM", "PM", "US", "EU", "UK", "UN", "TV", "PC", "IT",
  "CEO", "CFO", "CTO", "COO", "LLC", "INC", "LTD", "URL", "API", "JSON", "HTTP",
  "HTTPS", "HTML", "UTC", "NFC", "NFD", "FAQ", "SMS", "PDF", "RAM", "ROM", "CPU",
  "GPU", "SSD", "HDD", "USB", "LAN", "WAN"
]);

export function collapseWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function normalizeNumberToken(tok: string): string {
  let clean = tok.trim();
  if (clean.endsWith("%")) {
    clean = clean.slice(0, -1).trim();
  }
  if (clean.startsWith("+") || clean.startsWith("-")) {
    clean = clean.slice(1).trim();
  }

  if (clean.includes(",") && clean.includes(".")) {
    const lastComma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");
    if (lastComma > lastDot) {
      const intPart = clean.slice(0, lastComma).replace(/[. ]/g, "");
      const fracPart = clean.slice(lastComma + 1).replace(/0+$/, "");
      return intPart + (fracPart ? "." + fracPart : "");
    } else {
      const intPart = clean.slice(0, lastDot).replace(/[, ]/g, "");
      const fracPart = clean.slice(lastDot + 1).replace(/0+$/, "");
      return intPart + (fracPart ? "." + fracPart : "");
    }
  } else if (clean.includes(",") || clean.includes(".") || clean.includes(" ")) {
    const sep = clean.includes(",") ? "," : clean.includes(".") ? "." : " ";
    const parts = clean.split(sep);
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3 && parts[0] !== "0") {
      return parts[0] + parts[1];
    } else if (parts.length > 2 && parts.slice(1).every((p) => p.length === 3)) {
      return parts.join("");
    } else {
      return parts[0] + (parts[1] ? "." + parts[1].replace(/0+$/, "") : "");
    }
  }

  return clean;
}

export function extractAnchors(text: string): Anchor[] {
  const anchors: Anchor[] = [];
  const norm = collapseWhitespace(text);
  let working = norm;

  // 1. HEX ADDRESS & HASHES
  const hexPattern = /\b0x[0-9a-fA-F]{40,64}\b/g;
  let match: RegExpExecArray | null;
  while ((match = hexPattern.exec(working)) !== null) {
    const hexVal = match[0].toLowerCase();
    const kind = hexVal.length === 66 ? "HEX_HASH" : "HEX_ADDRESS";
    anchors.push({ kind, val: hexVal });
  }
  working = working.replace(hexPattern, " _HEX_ANCHOR_ ");

  // 2. URLS
  const urlPattern = /https?:\/\/[^\s<>'\"{}|\\^`]+/gi;
  while ((match = urlPattern.exec(working)) !== null) {
    const rawUrl = match[0];
    try {
      const u = new URL(rawUrl);
      const host = u.host.toLowerCase();
      const pathname = u.pathname.toLowerCase().replace(/\/+$/, "");
      const params = Array.from(u.searchParams.entries())
        .filter(([k]) => !k.toLowerCase().startsWith("utm_"))
        .sort(([a], [b]) => a.localeCompare(b));
      const qStr = new URLSearchParams(params).toString();
      const normUrl = `${host}${pathname}${qStr ? "?" + qStr : ""}`;
      anchors.push({ kind: "URL", val: normUrl });
    } catch {
      anchors.push({ kind: "URL", val: rawUrl.toLowerCase().replace(/\/+$/, "") });
    }
  }
  working = working.replace(urlPattern, " _URL_ANCHOR_ ");

  // 3. EMAILS
  const emailPattern = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b/g;
  while ((match = emailPattern.exec(working)) !== null) {
    anchors.push({ kind: "EMAIL", val: match[0].toLowerCase() });
  }
  working = working.replace(emailPattern, " _EMAIL_ANCHOR_ ");

  // 4. QUOTED STRINGS
  const quotedPattern = /"([^"\n]{1,60})"/g;
  while ((match = quotedPattern.exec(working)) !== null) {
    const qText = collapseWhitespace(match[1]).toLowerCase();
    if (qText) {
      anchors.push({ kind: "QUOTED", val: qText });
    }
  }
  working = working.replace(quotedPattern, " _QUOTED_ANCHOR_ ");

  // 5. ISO DATES: YYYY-MM-DD or YYYY/MM/DD
  const isoDatePattern = /\b(19\d\d|20\d\d)[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/g;
  while ((match = isoDatePattern.exec(working)) !== null) {
    const y = parseInt(match[1], 10);
    const mo = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    anchors.push({
      kind: "DATE",
      val: `${y.toString().padStart(4, "0")}-${mo.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`,
    });
  }
  working = working.replace(isoDatePattern, " _DATE_ANCHOR_ ");

  // Numeric Dates DD/MM/YYYY
  const numDatePattern = /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|[12]\d|3[01])[-/.](19\d\d|20\d\d)\b/g;
  while ((match = numDatePattern.exec(working)) !== null) {
    const v1 = parseInt(match[1], 10);
    const v2 = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const mo = v1 > 12 ? v2 : (v2 > 12 ? v1 : v2);
    const d = v1 > 12 ? v1 : (v2 > 12 ? v2 : v1);
    anchors.push({
      kind: "DATE",
      val: `${y.toString().padStart(4, "0")}-${mo.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`,
    });
  }
  working = working.replace(numDatePattern, " _DATE_ANCHOR_ ");

  // 6. TICKERS (2 to 6 uppercase letters, excluding stop tickers)
  const tickerPattern = /\b[A-Z]{2,6}\b/g;
  while ((match = tickerPattern.exec(working)) !== null) {
    const tok = match[0];
    if (!STOP_TICKERS.has(tok)) {
      anchors.push({ kind: "TICKER", val: tok });
    }
  }
  working = working.replace(tickerPattern, " _TICKER_ANCHOR_ ");

  // 7. NUMBERS & RANGES
  const rangePattern = /(?<=\b)(\d+(?:[.,\s]\d+)*%?)\s*-\s*(\d+(?:[.,\s]\d+)*%?)(?=$|\s|[.,;!?)])/g;
  while ((match = rangePattern.exec(working)) !== null) {
    anchors.push({ kind: "NUMBER", val: normalizeNumberToken(match[1]) });
    anchors.push({ kind: "NUMBER", val: normalizeNumberToken(match[2]) });
  }
  working = working.replace(rangePattern, " _NUM_ANCHOR_ ");

  const numPattern = /[+-]?\b\d+(?:[.,\s]\d+)*%?(?=$|\s|[.,;!?)])/g;
  while ((match = numPattern.exec(working)) !== null) {
    anchors.push({ kind: "NUMBER", val: normalizeNumberToken(match[0]) });
  }

  return anchors;
}

export function compareAnchors(srcAnchors: Anchor[], tgtAnchors: Anchor[]): { result: string; details: string[] } {
  if (srcAnchors.length === 0 && tgtAnchors.length === 0) {
    return { result: "ANCHORS_OK", details: [] };
  }

  const tgtMap = new Map<string, number>();
  for (const a of tgtAnchors) {
    const key = `${a.kind}:${a.val}`;
    tgtMap.set(key, (tgtMap.get(key) || 0) + 1);
  }

  const missing: string[] = [];
  for (const a of srcAnchors) {
    const key = `${a.kind}:${a.val}`;
    const count = tgtMap.get(key) || 0;
    if (count > 0) {
      tgtMap.set(key, count - 1);
    } else {
      missing.push(`${a.kind}:${a.val}`);
    }
  }

  const added: string[] = [];
  for (const [key, count] of tgtMap.entries()) {
    for (let i = 0; i < count; i++) {
      added.push(key);
    }
  }

  if (missing.length === 0 && added.length === 0) {
    return { result: "ANCHORS_OK", details: [] };
  }
  if (missing.length > 0 && added.length > 0) {
    return { result: "ANCHOR_ALTERED", details: [...missing.map((m) => `Missing: ${m}`), ...added.map((a) => `Added: ${a}`)] };
  }
  if (missing.length > 0) {
    return { result: "ANCHOR_MISSING", details: missing.map((m) => `Missing: ${m}`) };
  }
  return { result: "ANCHOR_ADDED", details: added.map((a) => `Added: ${a}`) };
}

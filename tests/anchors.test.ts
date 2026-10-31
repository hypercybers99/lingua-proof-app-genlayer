import { describe, it, expect } from "vitest";
import { extractAnchors, compareAnchors, normalizeNumberToken, collapseWhitespace } from "../src/lib/anchors";

describe("Anchors Extractor & Comparison", () => {
  it("collapses multiple whitespaces and trims", () => {
    expect(collapseWhitespace("  hello   world \n \t test  ")).toBe("hello world test");
  });

  it("extracts 20-byte hex addresses", () => {
    const text = "Contract at 0xba67d808f2b7E533ec06655eB730Ef5B27623EBF is active.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "HEX_ADDRESS",
      val: "0xba67d808f2b7e533ec06655eb730ef5b27623ebf",
    });
  });

  it("extracts 32-byte 66-hex transaction hashes", () => {
    const text = "Tx hash is 0x948a4f5ade97dff6a9a26f4fdc1a011e3873835566829711fb66f5ee5ce2cca4.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "HEX_HASH",
      val: "0x948a4f5ade97dff6a9a26f4fdc1a011e3873835566829711fb66f5ee5ce2cca4",
    });
  });

  it("extracts standard URLs with normalization", () => {
    const text = "Visit https://docs.linguaproof.io/path/ to review documentation.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "URL",
      val: "docs.linguaproof.io/path",
    });
  });

  it("strips utm tracking parameters from URLs", () => {
    const text = "Reference link: https://example.com/page?utm_source=twitter&ref=notary for documentation.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "URL",
      val: "example.com/page?ref=notary",
    });
  });

  it("extracts email addresses", () => {
    const text = "Contact security at audit-team@linguaproof.org for inquiries.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "EMAIL",
      val: "audit-team@linguaproof.org",
    });
  });

  it("extracts quoted terms", () => {
    const text = 'The proposal titled "Operational Framework v2" was approved.';
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "QUOTED",
      val: "operational framework v2",
    });
  });

  it("extracts ISO dates (YYYY-MM-DD)", () => {
    const text = "Voting period concludes on 2026-11-30.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "DATE",
      val: "2026-11-30",
    });
  });

  it("extracts numeric dates (DD/MM/YYYY)", () => {
    const text = "Meeting took place on 15/10/2026.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "DATE",
      val: "2026-10-15",
    });
  });

  it("extracts uppercase tickers excluding STOP_TICKERS", () => {
    const text = "Allocated 10,000 GEN to the development pool.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "TICKER",
      val: "GEN",
    });
  });

  it("ignores stop tickers like AI, JSON, URL, API", () => {
    const text = "The AI parsed the JSON API via URL.";
    const anchors = extractAnchors(text);
    const tickers = anchors.filter((a) => a.kind === "TICKER").map((a) => a.val);
    expect(tickers).not.toContain("AI");
    expect(tickers).not.toContain("JSON");
    expect(tickers).not.toContain("URL");
    expect(tickers).not.toContain("API");
  });

  it("normalizes comma-separated integers", () => {
    expect(normalizeNumberToken("50,000")).toBe("50000");
    expect(normalizeNumberToken("1,000,000")).toBe("1000000");
  });

  it("normalizes dot-separated thousands", () => {
    expect(normalizeNumberToken("50.000")).toBe("50000");
  });

  it("normalizes European decimals (1.000,50 -> 1000.5)", () => {
    expect(normalizeNumberToken("1.000,50")).toBe("1000.5");
  });

  it("normalizes US decimals (1,000.50 -> 1000.5)", () => {
    expect(normalizeNumberToken("1,000.50")).toBe("1000.5");
  });

  it("extracts percentages as normalized numbers", () => {
    const text = "Target threshold is 25% of total votes.";
    const anchors = extractAnchors(text);
    expect(anchors).toContainEqual({
      kind: "NUMBER",
      val: "25",
    });
  });

  it("extracts numeric ranges into two numbers", () => {
    const text = "The range was 10 - 20 days.";
    const anchors = extractAnchors(text);
    const nums = anchors.filter((a) => a.kind === "NUMBER").map((a) => a.val);
    expect(nums).toContain("10");
    expect(nums).toContain("20");
  });

  it("compares empty anchors as ANCHORS_OK", () => {
    const res = compareAnchors([], []);
    expect(res.result).toBe("ANCHORS_OK");
  });

  it("detects matching anchors as ANCHORS_OK", () => {
    const src = extractAnchors("Budget is 50,000 USD on 2026-11-30.");
    const tgt = extractAnchors("Ngân sách là 50.000 USD vào 2026-11-30.");
    const res = compareAnchors(src, tgt);
    expect(res.result).toBe("ANCHORS_OK");
  });

  it("detects missing anchors as ANCHOR_MISSING", () => {
    const src = extractAnchors("Budget is 50,000 USD.");
    const tgt = extractAnchors("Ngân sách được phân bổ.");
    const res = compareAnchors(src, tgt);
    expect(res.result).toBe("ANCHOR_MISSING");
  });

  it("detects altered anchors as ANCHOR_ALTERED", () => {
    const src = extractAnchors("Budget is 50,000 USD.");
    const tgt = extractAnchors("Ngân sách là 5,000 USD.");
    const res = compareAnchors(src, tgt);
    expect(res.result).toBe("ANCHOR_ALTERED");
  });

  it("detects added extraneous anchors as ANCHOR_ADDED", () => {
    const src = extractAnchors("General proposal.");
    const tgt = extractAnchors("Đề xuất 10,000 USD.");
    const res = compareAnchors(src, tgt);
    expect(res.result).toBe("ANCHOR_ADDED");
  });
});

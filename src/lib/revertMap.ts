export const REVERT_MAP: Record<string, { title: string; message: string; actionable: string }> = {
  "audit cooldown active": {
    title: "Audit Cooldown Active",
    message: "A consensus audit was recently submitted for this translation.",
    actionable: "Please wait 60 seconds before triggering another audit.",
  },
  "audit first": {
    title: "Translation Not Yet Audited",
    message: "This translation must be audited by validator consensus before it can be challenged.",
    actionable: "Trigger an audit on the translation detail page first.",
  },
  "challenge limit reached for translation": {
    title: "Translation Challenge Cap Reached",
    message: "The maximum number of allowed challenges for this translation has been reached.",
    actionable: "Consider submitting a formal revision instead of challenging individual segments.",
  },
  "challenge limit reached for you": {
    title: "Your Challenge Limit Reached",
    message: "Your address has submitted the maximum number of challenges for this translation.",
    actionable: "Wait for existing challenges to resolve or participate from another address.",
  },
  "challenge reason length out of range": {
    title: "Invalid Challenge Reason Length",
    message: "The explanation for challenging this segment must be between 10 and 1000 characters.",
    actionable: "Provide a detailed justification describing the fidelity defect.",
  },
  "clock unavailable": {
    title: "Network Clock Error",
    message: "The Studionet block timestamp was unavailable during execution.",
    actionable: "Please retry the transaction in a moment.",
  },
  "datetime must be string": {
    title: "Malformed Datetime",
    message: "The internal block datetime parameter is malformed.",
    actionable: "Please retry the transaction.",
  },
  "duplicate registration": {
    title: "Duplicate Translation",
    message: "An identical translation with the same source language, target language, and segment pairs is already registered.",
    actionable: "Search the Translation Explorer for the existing record.",
  },
  "duplicate source segment": {
    title: "Duplicate Source Segment",
    message: "The submitted text contains identical source segments.",
    actionable: "Ensure each aligned segment represents distinct clauses or combine them.",
  },
  "each pair needs exactly src and tgt strings": {
    title: "Invalid Segment Pair Format",
    message: "Every segment object in pairs_json must contain non-empty 'src' and 'tgt' string fields.",
    actionable: "Check the segment table in the editor for empty rows.",
  },
  "empty datetime": {
    title: "Empty Datetime String",
    message: "The transaction timestamp was empty.",
    actionable: "Please retry the transaction.",
  },
  "invalid ISO-8601 datetime format": {
    title: "Invalid Datetime Format",
    message: "The transaction timestamp did not conform to ISO-8601.",
    actionable: "Please retry the transaction.",
  },
  "invalid label length": {
    title: "Invalid Translation Label",
    message: "The translation title label must be between 1 and 120 characters.",
    actionable: "Shorten or lengthen your label to fit within 120 characters.",
  },
  "invalid pagination": {
    title: "Invalid Pagination Bounds",
    message: "The requested pagination offset or limit is invalid (limit max is 50).",
    actionable: "Adjust your page size to 50 or fewer items.",
  },
  "maximum audits reached": {
    title: "Maximum Audits Reached",
    message: "This translation has reached the lifetime audit cap.",
    actionable: "Review the historical audits or register a revision.",
  },
  "model output invalid": {
    title: "Validator Evaluation Failure",
    message: "Validators were unable to complete the non-deterministic evaluation rubric.",
    actionable: "Retry the audit. If persisting, inspect segment complexity.",
  },
  "only the translator can revise": {
    title: "Unauthorized Revision",
    message: "Only the original submitting translator can publish an authorized revision for this record.",
    actionable: "Connect the wallet that registered the parent translation.",
  },
  "pairs must be a list of 1 to 12 objects": {
    title: "Segment Count Out of Range",
    message: "Translations must contain between 1 and 12 segment pairs for on-chain consensus processing.",
    actionable: "Split large texts into sections of 12 or fewer aligned segments.",
  },
  "pairs_json is not valid JSON": {
    title: "Invalid JSON Syntax",
    message: "The segment payload failed JSON deserialization.",
    actionable: "Check the raw input for unescaped characters or formatting issues.",
  },
  "revision is identical to parent": {
    title: "Unchanged Revision",
    message: "The revised text is byte-for-byte identical to the parent translation.",
    actionable: "Make at least one correction to the target segments before submitting.",
  },
  "segment contains control characters": {
    title: "Control Characters Detected",
    message: "One or more segments contain disallowed control characters (e.g. null bytes).",
    actionable: "Strip invisible control characters and retry.",
  },
  "segment index out of range": {
    title: "Segment Index Out of Bounds",
    message: "The specified segment index does not exist in this translation.",
    actionable: "Select a valid segment index from the table.",
  },
  "source and target language must differ": {
    title: "Identical Languages",
    message: "The source and target languages must be different.",
    actionable: "Select a different target language for translation.",
  },
  "source segment length out of range": {
    title: "Source Segment Length Error",
    message: "Each source segment must be between 1 and 4,000 characters.",
    actionable: "Break down long paragraphs into individual sentences.",
  },
  "target equals source": {
    title: "Untranslated Content",
    message: "The target text is identical to the source text.",
    actionable: "Provide a genuine translation in the target language.",
  },
  "target segment length out of range": {
    title: "Target Segment Length Error",
    message: "Each target segment must be between 1 and 4,000 characters.",
    actionable: "Break down long target paragraphs to match source segments.",
  },
  "total source text too long": {
    title: "Total Text Size Limit Exceeded",
    message: "The cumulative source text exceeds the 65,536 byte limit.",
    actionable: "Reduce the text volume or register in separate parts.",
  },
  "translation already has a newer revision": {
    title: "Superseded Translation",
    message: "This translation has already been revised into a newer version.",
    actionable: "Navigate to the child revision to view or revise further.",
  },
  "translation not found": {
    title: "Translation Not Found",
    message: "No translation matching this ID exists in the contract state.",
    actionable: "Verify the 12-hex translation ID and try again.",
  },
  "translator cannot challenge own translation": {
    title: "Self-Challenge Prohibited",
    message: "Translators cannot submit formal challenges against their own registered translations.",
    actionable: "To correct your translation, use the 'Revise Translation' flow instead.",
  },
  "unsupported language": {
    title: "Unsupported Language",
    message: "The specified language code is not supported by the consensus validator rubric.",
    actionable: "Select a supported language code (e.g. en, vi, es, fr, de, zh, ja, ko, etc.).",
  },
};

export function parseRevertReason(errorStr: string): { title: string; message: string; actionable: string } {
  for (const [key, val] of Object.entries(REVERT_MAP)) {
    if (errorStr.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }

  return {
    title: "Transaction Reverted",
    message: errorStr || "Execution reverted by the GenVM runtime.",
    actionable: "Review transaction inputs and network status, then retry.",
  };
}

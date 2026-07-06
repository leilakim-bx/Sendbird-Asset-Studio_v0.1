const SHORT_TREND_LABEL_RE =
  /^(?:Q[1-4]|20\d{2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{2,4})?|Wk\.?\s*\d+|Week\s+\d+|Day\s+\d+|Before|After|Now|Launch|Baseline)$/i;

function cleanLabel(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function compactTrendAxisLabel(label: string | undefined, index: number, maxChars = 12): string {
  const source = cleanLabel(label) || `Point ${index + 1}`;
  if (source.length <= maxChars) return source;

  const words = source.split(/\s+/).filter(Boolean);
  const phrase = words.length > 1 ? words.slice(0, 2).join(" ") : source;
  const compact = phrase.length <= maxChars ? phrase : source.slice(0, maxChars).trim();

  return `${compact}...`;
}

export function generatedTrendAxisLabel(label: string | undefined, index: number): string {
  const source = cleanLabel(label);
  if (source && SHORT_TREND_LABEL_RE.test(source) && source.length <= 14) {
    return source;
  }
  return `Point ${index + 1}`;
}

export function shouldShowTrendAxisLabel(index: number, total: number): boolean {
  if (total <= 6) return true;
  const step = Math.ceil(total / 5);
  return index === 0 || index === total - 1 || index % step === 0;
}

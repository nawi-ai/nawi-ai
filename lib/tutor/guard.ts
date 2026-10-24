export function acceptTutorText(text: string, forbidden: string[]) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 12 || clean.length > 280) return null;
  const folded = fold(clean);
  if (/\b(la respuesta es|la opcion correcta|te doy la respuesta)\b/.test(folded)) return null;
  for (const phrase of forbidden) {
    const sample = fold(phrase);
    if (sample.length >= 8 && folded.includes(sample)) return null;
  }
  return clean;
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

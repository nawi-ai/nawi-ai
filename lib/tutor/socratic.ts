import { acceptTutorText } from "@/lib/tutor/guard";

export function localRebound(childWords: string, hint: string | null) {
  const said = childWords.replace(/\s+/g, " ").trim().slice(0, 80);
  const place = hint?.replace(/\s+/g, " ").trim() ?? "";
  if (said.length < 2 || place.length < 8) return null;
  const question = /[?¿]/.test(place) ? `Dijiste «${said}». ${place}` : `Dijiste «${said}». ${place}?`;
  return acceptSocraticQuestion(question, [], said);
}

export function acceptSocraticQuestion(text: string, forbidden: string[], childWords: string) {
  const clean = acceptTutorText(text, forbidden);
  if (!clean || !/[?¿]/.test(clean)) return null;
  const said = fold(childWords).slice(0, 24);
  const folded = fold(clean);
  if (said.length >= 4 && !folded.includes(said) && !folded.includes("dijiste")) return null;
  return clean;
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

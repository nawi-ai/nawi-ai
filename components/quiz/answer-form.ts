import type { NextAction } from "@/lib/reading-level";

export function shouldShowAnswerForm(input: {
  closed: boolean;
  showingResult: boolean;
  returned: boolean;
  nextAction?: NextAction;
}) {
  if (input.closed) return false;
  if (input.returned && !input.showingResult) return true;
  if (input.showingResult && input.nextAction === "continue") return false;
  return true;
}

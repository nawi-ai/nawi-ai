"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Volume2 } from "lucide-react";

import { NawiCharacter } from "@/components/brand/nawi-character";
import { shouldShowAnswerForm } from "@/components/quiz/answer-form";
import { useDictation } from "@/components/quiz/use-dictation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { speakOnce } from "@/components/reader/use-narration";
import { ApiClientError, apiRequest } from "@/lib/api/browser";
import { QUESTION_TYPE_LABEL } from "@/lib/reading-level";
import { expectedAttempt, isQuestionClosed, nextAdaptiveQuestion, questionsOnPath } from "@/lib/sessions/adapt";
import type { AnswerView, SessionDetail } from "@/lib/sessions/views";

export function QuizView({ detail }: { detail: SessionDetail }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerView[]>(detail.answers);
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const dictation = useDictation(setText);

  const path = questionsOnPath(detail.questions, answers);
  const plannedId = nextAdaptiveQuestion(detail.questions, answers);
  const question =
    (holdingId ? detail.questions.find((item) => item.id === holdingId) : null) ??
    detail.questions.find((item) => item.id === plannedId) ??
    null;

  const index = question ? path.indexOf(question.id) : -1;
  const group = question ? groupFor(question.id, answers) : [];
  const latest = group[group.length - 1];
  const closed = question ? isQuestionClosed(question, detail.questions, answers) : false;
  const draft = question?.format === "choice" ? choice : text.trim();
  const dirty = Boolean(question) && !closed && draft.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function groupFor(questionId: string, items: AnswerView[]) {
    return items
      .filter((item) => item.questionId === questionId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }

  function guard(href: string) {
    if (dirty) {
      setLeaveHref(href);
      return;
    }
    router.push(href);
  }

  async function submit() {
    if (!question || pending || closed) return;
    if (!draft) {
      setError("Escribe, elige o di una respuesta antes de comprobar.");
      return;
    }
    const attemptNumber = expectedAttempt(question, detail.questions, answers);
    if (!attemptNumber) return;
    dictation.stop();
    setPending(true);
    setError(null);
    try {
      const data = await apiRequest<{ answer: AnswerView }>(
        `/api/sessions/${detail.session.id}/evaluate`,
        {
          method: "POST",
          body: JSON.stringify({
            questionId: question.id,
            answer: question.format === "choice" ? choice : text.trim(),
            attemptNumber,
          }),
        },
      );
      setAnswers((current) => [...current, data.answer]);
      setHoldingId(question.id);
      setChoice("");
      setText("");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos comprobar la respuesta.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      await apiRequest(`/api/sessions/${detail.session.id}/complete`, { method: "POST" });
      router.push(`/resultado/${detail.session.id}`);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No pudimos cerrar la lectura.");
      setPending(false);
    }
  }

  function continueReading() {
    if (!question) return;
    const upcoming = nextAdaptiveQuestion(detail.questions, answers);
    setHoldingId(null);
    setText("");
    setChoice("");
    if (!upcoming) void finish();
  }

  if (!question) {
    return (
      <section className="mx-auto max-w-2xl rounded-[28px] border border-line bg-surface p-6">
        <NawiCharacter className="mx-auto h-32 w-32" />
        <h1 className="mt-4 text-center text-3xl font-extrabold">Ya respondiste las preguntas</h1>
        <p className="mt-3 text-center text-lg leading-8 text-muted">
          Ñawi puede calcular el resultado con lo que quedó guardado.
        </p>
        {error ? (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}
        <Button className="mt-6 w-full" type="button" disabled={pending} onClick={finish}>
          {pending ? "Calculando..." : "Ver mi resultado"}
        </Button>
      </section>
    );
  }

  const showingResult = Boolean(latest) && holdingId === question.id;
  const returned =
    question.role !== "support" &&
    !showingResult &&
    !closed &&
    group.some((item) => item.attemptNumber >= 2 && !item.isCorrect);
  const showForm = shouldShowAnswerForm({
    closed,
    showingResult,
    returned,
    nextAction: latest?.nextAction,
  });
  const continueLabel =
    detail.questions.find((item) => item.id === plannedId)?.role === "support"
      ? "Pensar con otra pregunta"
      : "Continuar";
  const roleNote =
    question.role === "support"
      ? "Esta pregunta te ayuda a pensarlo, sin decirte la respuesta."
      : question.role === "challenge"
        ? "Un reto un poco mayor, porque las anteriores te salieron."
        : returned
          ? "Volviste a esta pregunta. Las pistas siguen sirviendo."
          : null;

  return (
    <section className="mx-auto max-w-2xl">
      <button type="button" className="font-extrabold text-leaf" onClick={() => guard("/cuentos")}>
        Volver a la biblioteca
      </button>
      <p className="mt-4 text-sm font-extrabold text-muted">
        Pregunta {index + 1} de {path.length}
      </p>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {path.map((itemId, dot) => (
          <span
            key={itemId}
            className={`h-2 flex-1 rounded-full ${dot <= index ? "bg-leaf" : "bg-line"}`}
          />
        ))}
      </div>
      <p className="mt-4 text-sm font-extrabold text-leaf">{QUESTION_TYPE_LABEL[question.type]}</p>
      {roleNote ? <p className="mt-2 text-base leading-7 text-muted">{roleNote}</p> : null}
      <h1 className="mt-2 text-3xl font-extrabold leading-tight">{question.prompt}</h1>
      <button
        type="button"
        className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full px-2 font-extrabold text-leaf"
        onClick={() => {
          const spoke = speakOnce(question.prompt);
          setVoiceNote(spoke ? null : "Este navegador no puede leer la pregunta en voz alta.");
        }}
      >
        <Volume2 aria-hidden="true" size={18} /> Escuchar pregunta
      </button>
      {voiceNote ? (
        <div className="mt-3">
          <Notice>{voiceNote}</Notice>
        </div>
      ) : null}

      {question.format === "open" && !detail.geminiConfigured ? (
        <div className="mt-4">
          <Notice>
            Esta pregunta abierta se evalúa con Gemini. Falta configurar la clave y el modelo en el
            servidor. Las opciones de los otros cuentos sí se pueden comprobar sin esa clave.
          </Notice>
        </div>
      ) : null}

      {showingResult && latest ? (
        <div className="mt-5 rounded-[28px] border border-line bg-leaf-soft p-4">
          <div className="flex items-start gap-3">
            <NawiCharacter className="h-16 w-16 shrink-0" />
            <div>
              <p className="font-extrabold">{latest.isCorrect ? "¡Lo lograste!" : "Seguimos juntos"}</p>
              <p className="mt-1 text-base leading-7">{latest.feedback}</p>
              {latest.hint ? <p className="mt-2 text-base leading-7">Pista: {latest.hint}</p> : null}
              {latest.needsReview ? (
                <p className="mt-2 text-sm leading-6">
                  Esta respuesta quedó poco clara. No la contaremos como un error.
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {latest.nextAction === "continue" ? (
              <Button type="button" disabled={pending} onClick={continueReading}>
                {pending ? "Un momento..." : continueLabel}
              </Button>
            ) : (
              <Button href={`/leer/${detail.session.id}`} variant="secondary">
                Revisar el cuento
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {question.format === "choice" ? (
            <fieldset>
              <legend className="sr-only">Elige una respuesta</legend>
              <div className="grid gap-3">
                {question.choices?.map((option) => (
                  <label
                    key={option.id}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-lg font-bold ${choice === option.id ? "border-leaf bg-leaf-soft" : "border-line bg-surface"}`}
                  >
                    <input
                      type="radio"
                      name="respuesta"
                      value={option.id}
                      checked={choice === option.id}
                      onChange={() => setChoice(option.id)}
                      className="h-5 w-5 accent-[#377A58]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="respuesta" className="font-extrabold">
                  Tu respuesta
                </label>
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun px-4 font-extrabold"
                  aria-pressed={dictation.listening}
                  onClick={() => (dictation.listening ? dictation.stop() : dictation.start(text))}
                >
                  {dictation.listening ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={18} />}
                  {dictation.listening ? "Detener" : "Responder con la voz"}
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Puedes decirlo con tus palabras. Ñawi mira la idea, no cómo pronuncias.
              </p>
              <textarea
                id="respuesta"
                value={text}
                maxLength={500}
                rows={4}
                onChange={(event) => setText(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-line bg-surface p-4 text-lg leading-7"
                placeholder="Cuéntalo con tus palabras"
              />
              {dictation.note ? (
                <div className="mt-3">
                  <Notice>{dictation.note}</Notice>
                </div>
              ) : null}
            </div>
          )}
          <Button className="mt-4 w-full" type="submit" disabled={pending}>
            {pending ? "Comprobando..." : "Comprobar respuesta"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      {leaveHref ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="salir-titulo"
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#26352F]/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-[28px] bg-surface p-5">
            <h2 id="salir-titulo" className="text-2xl font-extrabold">
              ¿Sales sin comprobar?
            </h2>
            <p className="mt-2 text-base leading-7 text-muted">Tu respuesta todavía no se guardó.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => setLeaveHref(null)}>
                Seguir aquí
              </Button>
              <Button href={leaveHref}>Salir</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

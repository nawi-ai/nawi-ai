"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mic, Sparkles, Square, Volume2 } from "lucide-react";

import { NawiCharacter } from "@/components/brand/nawi-character";
import { shouldShowAnswerForm } from "@/components/quiz/answer-form";
import { useDictation } from "@/components/quiz/use-dictation";
import { Button } from "@/components/ui/button";
import { MagicBackButton } from "@/components/ui/magic-back-button";
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

  function backToReader() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(`/leer/${detail.session.id}`);
  }

  function guardBack() {
    if (dirty) {
      setLeaveHref("__back__");
      return;
    }
    backToReader();
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
      <section className="magic-quiz-page magic-quiz-page--complete">
        <div className="magic-quiz-complete">
          <span className="magic-quiz-complete__spark" aria-hidden="true">✦</span>
          <NawiCharacter className="mx-auto h-36 w-36" />
          <p>DESAFÍO COMPLETADO</p>
          <h1>Ya respondiste las preguntas</h1>
          <span>Ñawi puede calcular el resultado con lo que quedó guardado.</span>
          {error ? (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          ) : null}
          <Button className="magic-quiz-complete__button" type="button" disabled={pending} onClick={finish} variant="sun">
            {pending ? "Calculando..." : "Ver mi resultado"}
          </Button>
        </div>
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
          : "Busca la pista en la historia y elige con calma.";

  return (
    <section className="magic-quiz-page">
      <div className="magic-quiz-shell">
        <nav className="magic-quiz-nav" aria-label="Navegación del desafío">
          <MagicBackButton
            className={leaveHref ? "magic-back-button--hidden" : ""}
            fallbackHref={`/leer/${detail.session.id}`}
            ariaLabel="Volver a la lectura"
            onBack={guardBack}
          />
          <div>
            <span>DESAFÍO DE COMPRENSIÓN</span>
            <p>La prueba de las pistas</p>
          </div>
          <div className="magic-quiz-nav__count" aria-live="polite">
            <strong>{index + 1}</strong>
            <span>de {path.length}</span>
          </div>
        </nav>

        <div className="magic-quiz-progress" aria-label={`Pregunta ${index + 1} de ${path.length}`}>
          {path.map((itemId, dot) => (
            <span key={itemId} data-state={dot < index ? "done" : dot === index ? "current" : "pending"}>
              {dot < index ? <Check aria-hidden="true" size={13} /> : dot + 1}
            </span>
          ))}
        </div>

        <div className="magic-quiz-stage">
          <aside className="magic-quiz-guide" aria-label="Guía de Ñawi">
            <span className="magic-quiz-guide__halo" aria-hidden="true" />
            <Image
              src="/nawi-mago.webp"
              alt="Ñawi sosteniendo su libro mágico"
              width={1211}
              height={1299}
              sizes="(max-width: 760px) 180px, 300px"
              priority
            />
            <div className="magic-quiz-guide__note">
              <Sparkles aria-hidden="true" size={15} />
              <p>{roleNote}</p>
            </div>
          </aside>

          <div className="magic-quiz-card">
            <span className="magic-quiz-card__corner magic-quiz-card__corner--left" aria-hidden="true">✦</span>
            <span className="magic-quiz-card__corner magic-quiz-card__corner--right" aria-hidden="true">✦</span>
            <div className="magic-quiz-card__heading">
              <div>
                <span>{QUESTION_TYPE_LABEL[question.type]}</span>
                <small>PREGUNTA {index + 1}</small>
              </div>
              <button
                type="button"
                className="magic-quiz-listen"
                onClick={() => {
                  const spoke = speakOnce(question.prompt);
                  setVoiceNote(spoke ? null : "Este navegador no puede leer la pregunta en voz alta.");
                }}
              >
                <Volume2 aria-hidden="true" size={19} />
                <span>Escuchar</span>
              </button>
            </div>
            <h1>{question.prompt}</h1>

            {voiceNote ? <Notice>{voiceNote}</Notice> : null}

            {question.format === "open" && !detail.geminiConfigured ? (
              <Notice>
                Esta pregunta abierta se evalúa con Gemini. Falta configurar la clave y el modelo en el
                servidor. Las opciones de los otros cuentos sí se pueden comprobar sin esa clave.
              </Notice>
            ) : null}

            {showingResult && latest ? (
              <div className="magic-quiz-feedback" data-correct={latest.isCorrect}>
                <NawiCharacter className="h-20 w-20 shrink-0" />
                <div>
                  <strong>{latest.isCorrect ? "¡Lo lograste!" : "Seguimos juntos"}</strong>
                  <p>{latest.feedback}</p>
                  {latest.hint ? <p className="magic-quiz-feedback__hint">Pista: {latest.hint}</p> : null}
                  {latest.needsReview ? (
                    <small>Esta respuesta quedó poco clara. No la contaremos como un error.</small>
                  ) : null}
                  <div className="magic-quiz-feedback__actions">
                    {latest.nextAction === "continue" ? (
                      <Button type="button" disabled={pending} onClick={continueReading} variant="sun">
                        {pending ? "Un momento..." : continueLabel}
                      </Button>
                    ) : (
                      <Button href={`/leer/${detail.session.id}`} variant="secondary">
                        Revisar el cuento
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {showForm ? (
              <form
                className="magic-quiz-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                {question.format === "choice" ? (
                  <fieldset>
                    <legend className="sr-only">Elige una respuesta</legend>
                    <div className="magic-quiz-options">
                      {question.choices?.map((option, optionIndex) => (
                        <label key={option.id} data-selected={choice === option.id}>
                          <input
                            type="radio"
                            name="respuesta"
                            value={option.id}
                            checked={choice === option.id}
                            onChange={() => setChoice(option.id)}
                          />
                          <span className="magic-quiz-options__letter" aria-hidden="true">
                            {choice === option.id ? <Check size={19} /> : String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option.label}</span>
                          <i aria-hidden="true">✦</i>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <div className="magic-quiz-open-answer">
                    <div>
                      <label htmlFor="respuesta">Tu respuesta</label>
                      <button
                        type="button"
                        aria-pressed={dictation.listening}
                        onClick={() => (dictation.listening ? dictation.stop() : dictation.start(text))}
                      >
                        {dictation.listening ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={18} />}
                        {dictation.listening ? "Detener" : "Responder con la voz"}
                      </button>
                    </div>
                    <p>Puedes decirlo con tus palabras. Ñawi mira la idea, no cómo pronuncias.</p>
                    <textarea
                      id="respuesta"
                      value={text}
                      maxLength={500}
                      rows={4}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Cuéntalo con tus palabras"
                    />
                    {dictation.note ? <Notice>{dictation.note}</Notice> : null}
                  </div>
                )}
                <Button className="magic-quiz-submit" type="submit" disabled={pending} variant="sun">
                  <Sparkles aria-hidden="true" size={18} />
                  {pending ? "Comprobando..." : "Comprobar respuesta"}
                </Button>
              </form>
            ) : null}

            {error ? <Notice tone="error">{error}</Notice> : null}
          </div>
        </div>
      </div>

      {leaveHref ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="salir-titulo"
          className="magic-quiz-dialog"
        >
          <div className="magic-quiz-dialog__card">
            <span aria-hidden="true">✦</span>
            <h2 id="salir-titulo">¿Sales sin comprobar?</h2>
            <p>Tu respuesta todavía no se guardó.</p>
            <div>
              <Button type="button" variant="secondary" onClick={() => setLeaveHref(null)}>
                Seguir aquí
              </Button>
              {leaveHref === "__back__" ? (
                <Button
                  type="button"
                  onClick={backToReader}
                >
                  Salir
                </Button>
              ) : (
                <Button href={leaveHref}>Salir</Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

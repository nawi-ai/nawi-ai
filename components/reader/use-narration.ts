"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "playing" | "paused";

export function useNarration(paragraphs: string[]) {
  const [status, setStatus] = useState<Status>("idle");
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rate, setRate] = useState(0.9);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const rateRef = useRef(rate);
  const indexRef = useRef(0);
  const runRef = useRef(0);
  const paragraphsRef = useRef(paragraphs);
  const key = paragraphs.join("\n");
  const [storyKey, setStoryKey] = useState(key);

  if (storyKey !== key) {
    setStoryKey(key);
    setStatus("idle");
    setFinished(false);
    setParagraphIndex(0);
  }

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    paragraphsRef.current = paragraphs;
  }, [paragraphs]);

  useEffect(() => {
    indexRef.current = 0;
    runRef.current += 1;
    const synth = window.speechSynthesis;
    synth.cancel();
    const prime = () => synth.getVoices();
    prime();
    synth.addEventListener("voiceschanged", prime);
    return () => {
      runRef.current += 1;
      synth.cancel();
      synth.removeEventListener("voiceschanged", prime);
    };
  }, [key]);

  function speakFrom(start: number) {
    if (!("speechSynthesis" in window)) {
      setVoiceNote("Este navegador no puede narrar. Puedes leer el cuento en pantalla.");
      return;
    }
    const run = (runRef.current += 1);
    window.speechSynthesis.cancel();
    const voice = pickSpanishVoice();
    setVoiceNote(
      voice
        ? null
        : "No encontramos una voz en español. Si escuchas otro idioma, puedes seguir leyendo en pantalla.",
    );

    const items = paragraphsRef.current;
    const speakAt = (index: number) => {
      if (runRef.current !== run) return;
      if (index >= items.length) {
        const last = Math.max(0, items.length - 1);
        setStatus("idle");
        setFinished(true);
        setParagraphIndex(last);
        indexRef.current = last;
        return;
      }
      const utterance = new SpeechSynthesisUtterance(items[index] ?? "");
      utterance.lang = voice?.lang ?? "es-PE";
      if (voice) utterance.voice = voice;
      utterance.rate = rateRef.current;
      utterance.onend = () => {
        if (runRef.current !== run) return;
        indexRef.current = index + 1;
        setParagraphIndex(index + 1);
        speakAt(index + 1);
      };
      utterance.onerror = () => {
        if (runRef.current !== run) return;
        setStatus("idle");
      };
      indexRef.current = index;
      setParagraphIndex(index);
      setStatus("playing");
      window.speechSynthesis.speak(utterance);
    };

    speakAt(start);
  }

  return {
    status,
    paragraphIndex,
    finished,
    rate,
    voiceNote,
    setRate(next: number) {
      setRate(next);
      rateRef.current = next;
      if (status === "playing") speakFrom(indexRef.current);
    },
    play(start = 0) {
      setFinished(false);
      speakFrom(start);
    },
    jumpTo(index: number) {
      setFinished(false);
      if (status === "playing") {
        speakFrom(index);
        return;
      }
      indexRef.current = index;
      setParagraphIndex(index);
    },
    pause() {
      runRef.current += 1;
      window.speechSynthesis?.cancel();
      setStatus("paused");
    },
    resume() {
      speakFrom(indexRef.current);
    },
  };
}

export function speakOnce(text: string, rate = 0.95) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const voice = pickSpanishVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? "es-PE";
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return true;
}

function pickSpanishVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "es-pe") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es-419")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es")) ??
    null
  );
}

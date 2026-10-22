"use client";

import { useRef, useState } from "react";

type SpeechResultList = ArrayLike<{
  isFinal: boolean;
  0: { transcript: string };
}>;

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: SpeechResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor() {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function useDictation(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }

  function start(currentText: string) {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setNote("Este navegador no puede escuchar. Puedes escribir tu respuesta.");
      return;
    }
    window.speechSynthesis?.cancel();
    recRef.current?.stop();
    const rec = new Ctor();
    rec.lang = "es-PE";
    rec.continuous = false;
    rec.interimResults = true;
    const base = currentText.trim();
    rec.onresult = (event) => {
      let said = "";
      for (let index = 0; index < event.results.length; index += 1) {
        said += event.results[index]?.[0]?.transcript ?? "";
      }
      onTranscript(`${base} ${said}`.trim().slice(0, 500));
    };
    rec.onerror = () => {
      setNote("No pudimos escuchar. Puedes decirlo otra vez o escribirlo.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setNote(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setNote("El micrófono no se pudo abrir. Puedes escribir tu respuesta.");
    }
  }

  return { listening, note, start, stop };
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SpeechRecognitionResult = { transcript: string };
type SpeechRecognitionEvent = { results: { [i: number]: { [j: number]: SpeechRecognitionResult } }; resultIndex: number };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function MicButton() {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  async function sendTranscript(transcript: string) {
    setStatus("Thinking...");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, source: "in_app" }),
      });
      const body = await res.json();
      setStatus(body.message ?? body.error ?? "Done");
      router.refresh();
    } catch {
      setStatus("Something went wrong sending that.");
    }
    setTimeout(() => setStatus(null), 5000);
  }

  function handleClick() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = getRecognition();
    if (!recognition) {
      setStatus("Voice capture isn't supported in this browser.");
      setTimeout(() => setStatus(null), 5000);
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      sendTranscript(transcript);
    };
    recognition.onerror = () => {
      setStatus("Didn't catch that.");
      setTimeout(() => setStatus(null), 4000);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setStatus("Listening...");
  }

  return (
    <div className="fixed bottom-20 right-4 flex flex-col items-end gap-2">
      {status && (
        <div className="max-w-[240px] rounded bg-black px-3 py-2 text-sm text-white shadow">
          {status}
        </div>
      )}
      <button
        onClick={handleClick}
        aria-label={listening ? "Stop voice capture" : "Start voice capture"}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg ${
          listening ? "bg-red-500" : "bg-black"
        }`}
      >
        🎤
      </button>
    </div>
  );
}

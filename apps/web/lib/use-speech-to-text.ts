'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechToText {
  supported: boolean;
  listening: boolean;
  toggle: () => void;
  stop: () => void;
}

/**
 * Wraps the browser Web Speech API for optional voice answers. Degrades gracefully:
 * when the API is unavailable (for example Firefox), `supported` is false and the UI
 * hides the control, so typing always remains the reliable path.
 *
 * Finalised transcript segments are delivered via onResult; the caller appends them
 * to the current answer, which then flows through the normal autosave.
 */
export function useSpeechToText(onResult: (text: string) => void): UseSpeechToText {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result && result.isFinal) {
          finalText += result[0]?.transcript ?? '';
        }
      }
      if (finalText.trim()) onResultRef.current(finalText.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // Clean up if the component unmounts mid-recording.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, toggle, stop };
}

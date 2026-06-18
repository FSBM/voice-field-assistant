"use client";

import { useCallback, useRef, useState } from "react";

export interface Recorder {
  recording: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
}

export function useRecorder(): Recorder {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot record audio. Try Chrome or Edge.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      const name = (err as Error)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Microphone permission was blocked. Allow it in your browser, then try again.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No microphone was found on this device.");
      } else {
        setError("Could not start recording. Check your microphone and try again.");
      }
      setRecording(false);
    }
  }, []);

  const stop = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(new Blob());
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { recording, error, start, stop };
}

export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const voices = window.speechSynthesis.getVoices();
  const localVoice = voices.find((voice) => voice.localService && voice.lang.startsWith("en"));
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    const utterance = new SpeechSynthesisUtterance(trimmed);
    if (localVoice) utterance.voice = localVoice;
    window.speechSynthesis.speak(utterance);
  }
}

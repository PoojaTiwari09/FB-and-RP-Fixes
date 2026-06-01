/**
 * speech.service.ts — Browser Web Speech API wrapper (client-only).
 * Uses inbuilt Web Speech API for STT — no external service needed.
 *
 * Design:
 *  - continuous = false → avoids Google STT network timeouts
 *  - Auto-restarts on onend to simulate continuous mode
 *  - Accumulates text across restarts (doesn't reset input on each utterance)
 *  - SSR-gated — never called server-side
 */

let activeRecognition: SpeechRecognition | null = null;
let shouldRestart = false;
let accumulatedText = ''; // text built up across multiple utterances in one mic session

/**
 * Check if the browser supports Web Speech API.
 */
export function isSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Start microphone listening. Stays open until stopListening() is called.
 * Streams recognised text into onResult as user speaks.
 *
 * @param onResult   - (transcript, isFinal) — called on every update
 * @param onEnd      - called only when truly stopped
 * @param initialText - text already in the input box so we don't wipe it
 */
export function startListening(
  onResult: (transcript: string, isFinal: boolean) => void,
  onEnd: () => void,
  initialText = ''
): void {
  if (typeof window === 'undefined') { onEnd(); return; }
  if (!isSupported()) {
    console.warn('[SpeechService] Web Speech API not supported. Use Chrome or Edge.');
    onEnd();
    return;
  }

  stopListening(); // clean any previous session
  accumulatedText = initialText; // start with whatever the user already typed
  shouldRestart = true;
  startSession(onResult, onEnd);
}

function startSession(
  onResult: (transcript: string, isFinal: boolean) => void,
  onEnd: () => void
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition: SpeechRecognition = new SpeechRecognitionAPI();

  recognition.lang = 'en-US';
  recognition.continuous = true;      // true → keeps mic open across pauses, better for long phrases
  recognition.interimResults = true;  // stream partial text live
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    // Ignore late events if we already stopped listening
    if (activeRecognition !== recognition) return;

    let finalChunk = '';
    let interimChunk = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalChunk += chunk;
      } else {
        interimChunk += chunk;
      }
    }

    if (finalChunk) {
      // Append this utterance to accumulated text
      accumulatedText = (accumulatedText + ' ' + finalChunk).trim();
      onResult(accumulatedText, true);
    } else if (interimChunk) {
      // Show accumulated + current interim — do NOT update accumulatedText yet
      onResult((accumulatedText + ' ' + interimChunk).trim(), false);
    }
  };

  recognition.onend = () => {
    if (shouldRestart && activeRecognition === recognition) {
      // Auto-restart to keep mic open
      try {
        startSession(onResult, onEnd);
      } catch {
        shouldRestart = false;
        activeRecognition = null;
        onEnd();
      }
    } else {
      activeRecognition = null;
      if (!shouldRestart) onEnd();
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    // non-fatal — let onend handle restart
    if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'network') {
      return;
    }
    // Fatal errors
    const messages: Record<string, string> = {
      'audio-capture': 'Microphone not found. Check device settings.',
      'not-allowed':   'Mic access denied. Allow mic in browser settings.',
    };
    console.warn('[SpeechService]', messages[event.error] ?? `Error: ${event.error}`);
    shouldRestart = false;
    activeRecognition = null;
    onEnd();
  };

  try {
    recognition.start();
    activeRecognition = recognition;
  } catch (err) {
    console.warn('[SpeechService] Could not start recognition:', err);
    shouldRestart = false;
    activeRecognition = null;
    onEnd();
  }
}

/**
 * Stop listening and prevent auto-restart.
 */
export function stopListening(): void {
  shouldRestart = false;
  accumulatedText = '';
  if (activeRecognition) {
    const r = activeRecognition;
    activeRecognition = null;
    try { r.stop(); } catch { /* already stopped */ }
  }
}

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type AgentState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'calling'
  | 'presenting';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  transcript: string;
  response: string;
  actions: string[];
}

interface UseVoiceAgentOptions {
  onCallStarted?: () => void;
}

export function useVoiceAgent(options: UseVoiceAgentOptions = {}) {
  const [state, setState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [dialogueActive, setDialogueActive] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const historyRef = useRef(history);
  historyRef.current = history;
  const dialogueActiveRef = useRef(false);
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SpeechRecognition transcript — used as primary STT (better Georgian than Whisper)
  const srTranscriptRef = useRef('');

  const callTranscriptPollRef = useRef<any>(null); // truthy = polling active, null = stop

  // Refs for functions callable from stale closures
  const speakTextRef = useRef<(text: string) => Promise<boolean>>(async () => false);
  const initiateCallRef = useRef<(msg?: string) => Promise<string | null>>(async () => null);
  const processTextRef = useRef<(text: string) => Promise<void>>(async () => {});
  const startListeningRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    return () => {
      cleanupMic();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (autoListenTimerRef.current) {
        clearTimeout(autoListenTimerRef.current);
      }
      callTranscriptPollRef.current = null;
    };
  }, []);

  const cleanupMic = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // Auto-listen after speaking (dialogue mode, like Atlas — 0.3s delay)
  const scheduleAutoListen = useCallback(() => {
    if (!dialogueActiveRef.current) return;
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
    autoListenTimerRef.current = setTimeout(() => {
      if (dialogueActiveRef.current) {
        startListeningRef.current();
      }
    }, 300);
  }, []);

  const speakText = useCallback(async (text: string): Promise<boolean> => {
    setState('speaking');

    try {
      const res = await fetch('/api/allone-ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) return false;

      const audioBuffer = await res.arrayBuffer();
      if (audioBuffer.byteLength < 100) return false;

      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      return new Promise<boolean>((resolve) => {
        const audio = new Audio(url);
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          resolve(true);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          resolve(false);
        };

        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }, []);
  speakTextRef.current = speakText;

  const initiateCall = useCallback(async (contextMessage?: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/allone-ai/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextMessage || 'გამარჯობა ლიკა! ლუკა გიგზავნის მოკითხვას.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(`ზარი ვერ განხორციელდა: ${data.error}`);
        return null;
      }
      return data.callSid || null;
    } catch {
      setError('ზარის შეცდომა');
      return null;
    }
  }, []);
  initiateCallRef.current = initiateCall;

  const pollCallTranscript = useCallback(async (callSid: string) => {
    let lastTranscriptLen = 0;
    let fullTranscript: { role: string; content: string }[] = [];
    const MAX_POLL_MS = 5 * 60 * 1000; // 5 min max
    const startTime = Date.now();
    let stopped = false;

    // Store a cancel function so cleanup can stop the loop
    const pollId = setInterval(() => {}, 1e9); // dummy, just for ref
    clearInterval(pollId);
    callTranscriptPollRef.current = { [Symbol.toPrimitive]: () => 1 } as any;

    while (!stopped && Date.now() - startTime < MAX_POLL_MS) {
      await new Promise((r) => setTimeout(r, 3000));

      // Check if we were cancelled (reset/unmount)
      if (!callTranscriptPollRef.current) break;

      try {
        const res = await fetch(`/api/allone-ai/call/${callSid}/transcript`);
        if (!res.ok) continue;
        const data = await res.json();
        const transcript: { role: string; content: string }[] = data.transcript || [];

        // Inject new messages into history in real-time
        if (transcript.length > lastTranscriptLen) {
          const newMessages = transcript.slice(lastTranscriptLen);
          lastTranscriptLen = transcript.length;
          fullTranscript = transcript;

          setHistory((prev) => [
            ...prev,
            ...newMessages.map((m) => ({
              role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
              content: `[ზარი] ${m.content}`,
            })),
          ]);
        }

        // Call ended
        if (data.status === 'completed') {
          stopped = true;
          callTranscriptPollRef.current = null;

          // Build call summary for the AI
          const callLog = fullTranscript
            .map((m) => `${m.role === 'assistant' ? 'AI' : 'მომხმარებელი'}: ${m.content}`)
            .join('\n');

          const summaryPrompt = callLog.length > 0
            ? `ზარი დასრულდა. აი რა მოხდა ზარში:\n${callLog}\n\nმოკლედ მითხარი რა მოხდა ზარში და მკითხე სხვა რამე ხომ არ მჭირდება.`
            : 'ზარი დასრულდა. მკითხე სხვა რამე ხომ არ მჭირდება.';

          // Re-activate dialogue mode and let AI summarize + auto-listen
          dialogueActiveRef.current = true;
          setDialogueActive(true);
          processTextRef.current(summaryPrompt);
          return;
        }
      } catch {
        // Network error — will retry next loop
      }
    }

    // Timeout — go idle
    callTranscriptPollRef.current = null;
    setState('idle');
  }, []);

  const handleActions = useCallback(async (actions: string[], responseText: string) => {
    const opts = optionsRef.current;
    for (const action of actions) {
      if (action === 'CALL') {
        opts.onCallStarted?.();

        // Pause dialogue during the call
        dialogueActiveRef.current = false;
        setDialogueActive(false);
        if (autoListenTimerRef.current) {
          clearTimeout(autoListenTimerRef.current);
          autoListenTimerRef.current = null;
        }

        // Wait a moment so user hears the announcement before call fires
        await new Promise((r) => setTimeout(r, 1500));
        setState('calling');

        // Initiate call — get callSid for transcript polling
        const callSid = await initiateCallRef.current(responseText);

        if (callSid) {
          // Start polling in background (async, not awaited)
          pollCallTranscript(callSid);
        } else {
          await new Promise((r) => setTimeout(r, 2000));
          setState('idle');
        }
      }
    }
  }, [pollCallTranscript]);

  // Send text to chat API (no Whisper, direct to Gemini)
  const processText = useCallback(
    async (text: string) => {
      setState('processing');
      setTranscript(text);

      try {
        const res = await fetch('/api/allone-ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: historyRef.current }),
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
          const errText = await res.text();
          let msg = 'სერვერის შეცდომა, სცადეთ თავიდან';
          try { msg = JSON.parse(errText).error || msg; } catch {}
          setError(msg);
          setState('idle');
          return;
        }

        const data: ChatResponse = await res.json();
        setResponse(data.response);

        setHistory((prev) => [
          ...prev,
          { role: 'user', content: text },
          { role: 'assistant', content: data.response },
        ]);

        // Speak response first, then handle actions (e.g. call)
        let spoke = false;
        if (data.response) {
          spoke = await speakTextRef.current(data.response);
        }

        if (data.actions.length > 0) {
          await handleActions(data.actions, data.response);
        } else if (spoke) {
          // Dialogue mode: auto-listen only if speech actually played
          scheduleAutoListen();
        } else {
          // TTS failed — stay idle, don't auto-listen into silence
          setState('idle');
        }
      } catch (err: any) {
        const msg = err.name === 'AbortError' ? 'მოთხოვნა დრო ამოიწურა' : (err.message || 'დამუშავების შეცდომა');
        setError(msg);
        setState('idle');
      }
    },
    [handleActions, scheduleAutoListen]
  );
  processTextRef.current = processText;

  // Fallback: send audio blob to Whisper STT → Gemini
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setState('processing');
    setTranscript((prev) => prev || '...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('history', JSON.stringify(historyRef.current));

      const res = await fetch('/api/allone-ai/chat', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errText = await res.text();
        let msg = 'სერვერის შეცდომა, სცადეთ თავიდან';
        try { msg = JSON.parse(errText).error || msg; } catch {}
        setError(msg);
        setState('idle');
        return;
      }

      const data: ChatResponse = await res.json();
      setTranscript(data.transcript);
      setResponse(data.response);

      setHistory((prev) => [
        ...prev,
        { role: 'user', content: data.transcript },
        { role: 'assistant', content: data.response },
      ]);

      // Speak response first, then handle actions (e.g. call)
      let spoke = false;
      if (data.response) {
        spoke = await speakTextRef.current(data.response);
      }

      if (data.actions.length > 0) {
        await handleActions(data.actions, data.response);
      } else if (spoke) {
        scheduleAutoListen();
      } else {
        setState('idle');
      }
    } catch (err: any) {
      const msg = err.name === 'AbortError' ? 'მოთხოვნა დრო ამოიწურა' : (err.message || 'დამუშავების შეცდომა');
      setError(msg);
      setState('idle');
    }
  }, [handleActions, scheduleAutoListen]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setResponse('');
      srTranscriptRef.current = '';

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Activate dialogue mode on first listen
      dialogueActiveRef.current = true;
      setDialogueActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // Audio level visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArr = new Uint8Array(analyserRef.current.frequencyBinCount);
      let silenceStart = 0;
      let hasSpoken = false;
      const SILENCE_THRESHOLD = 0.04;
      const SILENCE_DURATION = 1500; // Shorter for dialogue mode (like Atlas)

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length / 255;
        setAudioLevel(avg);

        if (avg >= SILENCE_THRESHOLD) {
          hasSpoken = true;
          silenceStart = 0;
        } else if (hasSpoken) {
          if (!silenceStart) silenceStart = Date.now();
          else if (Date.now() - silenceStart > SILENCE_DURATION) {
            if (recorderRef.current && recorderRef.current.state === 'recording') {
              recorderRef.current.stop();
            }
            return;
          }
        }

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        cleanupMic();

        // Prefer SpeechRecognition transcript (Chrome's Georgian STT is better than Whisper)
        const srText = srTranscriptRef.current.trim();
        if (srText.length > 1) {
          processTextRef.current(srText);
        } else if (blob.size > 4000) {
          processAudio(blob);
        } else {
          // No speech detected — in dialogue mode, go back to listening
          if (dialogueActiveRef.current) {
            scheduleAutoListen();
          } else {
            setState('idle');
          }
        }
      };

      recorder.start(250);
      updateLevel();

      // SpeechRecognition — primary STT for Georgian
      try {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SR) {
          const recognition = new SR();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'ka-GE';
          recognitionRef.current = recognition;

          recognition.onresult = (event: any) => {
            let finalText = '';
            let interimText = '';
            for (let i = 0; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalText += result[0].transcript;
              } else {
                interimText += result[0].transcript;
              }
            }
            const display = finalText + interimText;
            if (display) setTranscript(display);
            // Save the best transcript (prefer final results)
            srTranscriptRef.current = finalText || interimText;
          };

          recognition.onerror = () => {};
          recognition.onend = () => { recognitionRef.current = null; };

          recognition.start();
        }
      } catch {
        // SpeechRecognition not available — will use Whisper fallback
      }

      setState('listening');
    } catch {
      setError('მიკროფონზე წვდომა ვერ მოხერხდა');
      setState('idle');
    }
  }, [cleanupMic, processAudio, scheduleAutoListen]);
  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    // Stop dialogue mode when user manually stops
    dialogueActiveRef.current = false;
    setDialogueActive(false);
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    } else {
      cleanupMic();
      setState('idle');
    }
  }, [cleanupMic]);

  const sendText = useCallback(
    async (text: string) => {
      setError(null);
      await processText(text);
    },
    [processText]
  );

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Stop dialogue mode when user manually stops speaking
    dialogueActiveRef.current = false;
    setDialogueActive(false);
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    dialogueActiveRef.current = false;
    setDialogueActive(false);
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
    callTranscriptPollRef.current = null; // signals poll loop to stop
    stopListening();
    stopSpeaking();
    setHistory([]);
    setTranscript('');
    setResponse('');
    setError(null);
    setState('idle');
  }, [stopListening, stopSpeaking]);

  return {
    state,
    transcript,
    response,
    history,
    error,
    audioLevel,
    dialogueActive,
    startListening,
    stopListening,
    sendText,
    speakText,
    stopSpeaking,
    reset,
  };
}

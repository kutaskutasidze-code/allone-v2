// Bidirectional Twilio Media Stream handler
// Flow: Twilio audio (mulaw 8kHz) → buffer → Gemini STT → Gemini LLM → Gemini TTS → mulaw back to Twilio

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2;
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const KNOWLEDGE = `ALLONE — AI გადაწყვეტილებები ბიზნესისთვის, თბილისი.
4-ეტაპიანი სერვისი: კონსულტაცია, დაგეგმვა, შესრულება (1 კვირა), მხარდაჭერა.
პროდუქტები: ხმოვანი აგენტები, ჩატბოტები, ავტომატიზაციები, ინდივიდუალური AI.
პროექტზე დაფუძნებული ფასწარმოქმნა: $2,500–$4,500 პროექტზე. მარჟა 61%→87%.
წელი 1 შემოსავალი: $169,500 (51 პროექტი). წელი 1 EBITDA: $40,360.
წელი 2 შემოსავალი: $733,500. 2-წლიანი ჯამი: $903,000.
EBITDA+ მე-6 თვიდან. 8 პროექტი/თვეში მე-12 თვეში.
ინვესტიცია: $240K სულ, 25% წილი, 2 ეტაპად ($40K ახლა + $200K დადასტურების შემდეგ).
ანაზღაურება: მე-19 თვე.`;

const PHONE_PROMPT = `შენ ხარ Allone AI-ის ხმოვანი ასისტენტი. ტელეფონით საუბრობ.

${KNOWLEDGE}

წესები:
- უპასუხე მოკლედ, 1-2 სრული წინადადებით (მინიმუმ 15 სიტყვა)
- სუფთა ქართულით
- იყავი თბილი და მეგობრული
- ნუ ჩამოთვლი — ერთი მთავარი პასუხი მიეცი

შეხვედრის დანიშვნა:
- თუ ადამიანს სურს შეხვედრის დანიშვნა, ჰკითხე: რა დღეს და რომელ საათზე სურს, სახელი და ტელეფონის ნომერი
- შეხვედრის ადგილი: Allone-ის ოფისი, ვაჟა-ფშაველას გამზირი 71, თბილისი
- დაადასტურე შეხვედრა და გაიმეორე თარიღი, დრო და ადგილი
- ზარის ბოლოს მადლობა გადაუხადე და თბილად გამოეთხოვე`;

// ─── Audio conversion utilities ───

// Mu-law decode table (ITU G.711)
const MULAW_DECODE = new Int16Array(256);
(function buildMulawTable() {
  for (let i = 0; i < 256; i++) {
    let mu = ~i & 0xFF;
    const sign = mu & 0x80;
    const exponent = (mu >> 4) & 0x07;
    const mantissa = mu & 0x0F;
    let sample = ((mantissa << 3) + 0x84) << exponent;
    sample -= 0x84;
    MULAW_DECODE[i] = sign ? -sample : sample;
  }
})();

function linearToMulaw(sample) {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  sample += MULAW_BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; exponent--, mask >>= 1) {}
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  return (~(sign | (exponent << 4) | mantissa) & 0xFF);
}

// Convert 8kHz mulaw buffer to 8kHz PCM s16le for STT
function mulawToLinearPcm8k(mulawBuf) {
  const samples = new Int16Array(mulawBuf.length);
  for (let i = 0; i < mulawBuf.length; i++) {
    samples[i] = MULAW_DECODE[mulawBuf[i]];
  }
  return Buffer.from(samples.buffer);
}

// Convert 24kHz PCM s16le from Gemini TTS → 8kHz mulaw for Twilio
function pcm24kToMulaw8k(pcmBuf) {
  const samples = new Int16Array(pcmBuf.buffer, pcmBuf.byteOffset, pcmBuf.length / 2);
  const ratio = 3; // 24000 / 8000
  const gain = 3.0;
  const outLen = Math.floor(samples.length / ratio);
  const mulaw = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const avg = (samples[idx] + samples[idx + 1] + samples[idx + 2]) / ratio;
    const clamped = Math.max(-32768, Math.min(32767, Math.round(avg * gain)));
    mulaw[i] = linearToMulaw(clamped);
  }
  return Buffer.from(mulaw);
}

// ─── Gemini API calls ───

async function geminiSTT(mulawBuffer) {
  const keys = [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(Boolean);
  if (keys.length === 0) return null;

  // Build mulaw WAV (Gemini accepts audio/wav with mulaw encoding)
  const wavSize = 58 + mulawBuffer.length;
  const wav = Buffer.alloc(wavSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wavSize - 8, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(18, 16);
  wav.writeUInt16LE(7, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.writeUInt16LE(0, 36);
  wav.write('fact', 38);
  wav.writeUInt32LE(4, 42);
  wav.writeUInt32LE(mulawBuffer.length, 46);
  wav.write('data', 50);
  wav.writeUInt32LE(mulawBuffer.length, 54);
  mulawBuffer.copy(wav, 58);

  const audioBase64 = wav.toString('base64');
  const duration = (mulawBuffer.length / 8000).toFixed(1);
  console.log(`[stt] sending ${duration}s of audio to Gemini (${wav.length} bytes)`);

  const sttBody = JSON.stringify({
    contents: [{
      parts: [
        { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
        { text: 'ტრანსკრიბაცია გააკეთე ამ ქართული მეტყველების. დააბრუნე მხოლოდ ტრანსკრიფცია, არაფერი სხვა. თუ ვერ გაიგე, დაწერე "გაუგებარია".' },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 200, thinkingConfig: { thinkingBudget: 0 } },
  });

  for (const key of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: sttBody }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`[stt] Gemini error (${res.status}):`, errBody.slice(0, 200));
        if (res.status === 429 || res.status === 403) continue; // try next key
        return null;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`[stt] Gemini transcription: "${text}"`);

      if (!text || text === 'გაუგებარია') return null;
      return text;
    } catch (e) {
      console.error('[stt] error:', e.message);
    }
  }
  return null;
}

async function geminiLLM(messages) {
  const keys = [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(Boolean);
  if (keys.length === 0) return groqLLM(messages);

  const contents = [];
  for (const msg of messages) {
    if (msg.role === 'system') {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
      contents.push({ role: 'model', parts: [{ text: 'გასაგებია.' }] });
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  const llmBody = JSON.stringify({
    contents,
    generationConfig: { temperature: 0.5, maxOutputTokens: 200, thinkingConfig: { thinkingBudget: 0 } },
  });

  for (const key of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: llmBody }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[llm] Gemini response (${text.length} chars)`);
          return text;
        }
      } else {
        const errBody = await res.text().catch(() => '');
        console.error(`[llm] Gemini error (${res.status}):`, errBody.slice(0, 200));
        if (res.status === 429 || res.status === 403) continue;
      }
    } catch (e) {
      console.error('[llm] Gemini error:', e.message);
    }
  }

  return groqLLM(messages);
}

async function groqLLM(messages) {
  if (!GROQ_API_KEY) return 'ბოდიშით, ტექნიკური ხარვეზია.';
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.5, max_tokens: 80 }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (e) {
    console.error('[llm] Groq error:', e.message);
  }
  return 'ბოდიშით, ტექნიკური ხარვეზია.';
}

async function geminiTTSWithKey(text, apiKey) {
  const ttsBody = JSON.stringify({
    contents: [{ parts: [{ text: `Read the following text aloud in a warm, friendly tone:\n${text}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ttsBody,
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[tts] Gemini error (${res.status}):`, errBody.slice(0, 200));
    return null;
  }

  const data = await res.json();
  const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) return null;

  const pcm24k = Buffer.from(audioBase64, 'base64');
  return pcm24kToMulaw8k(pcm24k);
}

async function geminiTTS(text) {
  if (!text || text.length < 10) {
    console.error('[tts] text too short for TTS:', text);
    return null;
  }

  const keys = [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(Boolean);
  if (keys.length === 0) return null;

  for (const key of keys) {
    try {
      const result = await geminiTTSWithKey(text, key);
      if (result) return result;
    } catch (e) {
      console.error('[tts] error:', e.message);
    }
  }
  return null;
}

// ─── Silence detection ───

const SILENCE_THRESHOLD = 350;  // mulaw decoded amplitude — lowered for phone line noise
const SILENCE_DURATION_MS = 2000; // 2s of silence = end of speech (phone has more pauses)
const MIN_SPEECH_MS = 500; // ignore bursts shorter than 500ms
const BARGE_IN_GRACE_MS = 2500; // don't allow barge-in for 2.5s after we start playing
const BARGE_IN_THRESHOLD = 0.15; // 15% of samples must be loud to count as speech

function isSilent(mulawBuf) {
  let loud = 0;
  for (let i = 0; i < mulawBuf.length; i++) {
    const decoded = Math.abs(MULAW_DECODE[mulawBuf[i]]);
    if (decoded > SILENCE_THRESHOLD) loud++;
  }
  return loud < mulawBuf.length * BARGE_IN_THRESHOLD;
}

// ─── Call transcript store (module-level, keyed by callSid) ───

const callStore = new Map(); // callSid → { status, history }

export function getCallTranscript(callSid) {
  const entry = callStore.get(callSid);
  return entry ? entry.history : [];
}

export function getCallStatus(callSid) {
  const entry = callStore.get(callSid);
  return entry ? entry.status : 'unknown';
}

// ─── Main call handler ───

export function handleCallConnection(ws) {
  let streamSid = null;
  let callSid = null;
  let history = [];
  let audioBuffer = []; // raw mulaw chunks from caller
  let speechStartTime = null;
  let lastSpeechTime = null;
  let silenceTimer = null;
  let isProcessing = false;
  let isPlaying = false;
  let playbackStartTime = 0;
  let greetingSent = false;

  function sendAudio(mulawBuf) {
    if (ws.readyState !== 1 || !streamSid) return;

    // Send in chunks of 640 bytes (~80ms at 8kHz mulaw)
    const CHUNK_SIZE = 640;
    for (let i = 0; i < mulawBuf.length; i += CHUNK_SIZE) {
      const chunk = mulawBuf.subarray(i, i + CHUNK_SIZE);
      ws.send(JSON.stringify({
        event: 'media',
        streamSid,
        media: { payload: Buffer.from(chunk).toString('base64') },
      }));
    }

    // Mark end of audio
    ws.send(JSON.stringify({
      event: 'mark',
      streamSid,
      mark: { name: `reply-${Date.now()}` },
    }));
  }

  function clearTwilioBuffer() {
    if (ws.readyState !== 1 || !streamSid) return;
    ws.send(JSON.stringify({ event: 'clear', streamSid }));
    isPlaying = false;
  }

  async function processUserSpeech() {
    if (audioBuffer.length === 0 || isProcessing) return;
    isProcessing = true;

    const allAudio = Buffer.concat(audioBuffer);
    audioBuffer = [];
    speechStartTime = null;
    lastSpeechTime = null;

    console.log(`[voice] processing ${allAudio.length} bytes of speech`);

    // 1. STT — send audio to Gemini for Georgian transcription
    const transcript = await geminiSTT(allAudio);

    if (!transcript || transcript.trim().length === 0) {
      console.log('[voice] no speech detected');
      isProcessing = false;
      return;
    }

    console.log(`[voice] user: "${transcript}"`);

    // 2. LLM — get AI response
    const messages = [
      { role: 'system', content: PHONE_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: transcript },
    ];

    const aiText = (await geminiLLM(messages)).replace(/\[ACTION:[\w_:]+\]/g, '').trim();
    console.log(`[voice] ai: "${aiText.slice(0, 80)}"`);

    history.push({ role: 'user', content: transcript });
    history.push({ role: 'assistant', content: aiText });
    if (history.length > 10) history = history.slice(-8);

    // Update module-level store so transcript is accessible via HTTP
    if (callSid && callStore.has(callSid)) {
      callStore.get(callSid).history = history;
    }

    // 3. TTS — convert to audio and send
    const audioData = await geminiTTS(aiText);
    if (audioData) {
      isPlaying = true;
      playbackStartTime = Date.now();
      sendAudio(audioData);
      console.log(`[voice] sent ${audioData.length} bytes of audio`);
    } else {
      console.error('[voice] TTS failed');
    }

    isProcessing = false;
  }

  ws.on('message', (rawMsg) => {
    let msg;
    try { msg = JSON.parse(rawMsg); } catch { return; }

    switch (msg.event) {
      case 'connected':
        console.log('[ws] connected');
        break;

      case 'start':
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        console.log(`[ws] stream started, callSid=${callSid}, streamSid=${streamSid}`);

        // Register call in module-level store
        callStore.set(callSid, { status: 'in-progress', history });

        // Send greeting after a short delay
        if (!greetingSent) {
          greetingSent = true;
          (async () => {
            const greeting = 'გამარჯობა! მე ვარ Allone-ის ასისტენტი. რით დაგეხმაროთ?';
            history.push({ role: 'assistant', content: greeting });
            const audio = await geminiTTS(greeting);
            if (audio) {
              isPlaying = true;
              playbackStartTime = Date.now();
              sendAudio(audio);
              console.log(`[voice] greeting sent (${audio.length} bytes)`);
            }
          })();
        }
        break;

      case 'media': {
        const payload = Buffer.from(msg.media.payload, 'base64');
        const now = Date.now();
        const loud = !isSilent(payload);

        // While we're playing audio back, check for barge-in
        if (isPlaying) {
          const elapsed = now - playbackStartTime;
          // Only allow barge-in after grace period
          if (loud && elapsed > BARGE_IN_GRACE_MS) {
            clearTwilioBuffer();
            audioBuffer = [];
            speechStartTime = null;
            console.log('[voice] barge-in detected, cleared playback');
          }
          // Don't collect audio while playing — it's just noise/echo
          break;
        }

        // Not playing — collect user speech
        if (loud) {
          if (!speechStartTime) speechStartTime = now;
          lastSpeechTime = now;
          audioBuffer.push(payload);

          // Reset silence timer
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            const speechDuration = lastSpeechTime - speechStartTime;
            if (speechDuration >= MIN_SPEECH_MS && !isProcessing) {
              processUserSpeech();
            }
          }, SILENCE_DURATION_MS);
        } else if (speechStartTime) {
          // Still collecting — silence during speech (natural pause)
          audioBuffer.push(payload);
        }
        break;
      }

      case 'mark':
        // Audio playback completed
        if (msg.mark?.name?.startsWith('reply-')) {
          isPlaying = false;
        }
        break;

      case 'stop':
        console.log(`[ws] stream stopped, callSid=${callSid}`);
        if (silenceTimer) clearTimeout(silenceTimer);
        break;
    }
  });

  ws.on('close', () => {
    console.log(`[ws] connection closed, callSid=${callSid}`);
    if (silenceTimer) clearTimeout(silenceTimer);
    // Mark call as completed in store
    if (callSid && callStore.has(callSid)) {
      callStore.get(callSid).status = 'completed';
    }
    // Clean up after 10 minutes
    if (callSid) {
      setTimeout(() => callStore.delete(callSid), 10 * 60 * 1000);
    }
  });

  ws.on('error', (err) => {
    console.error('[ws] error:', err.message);
  });
}

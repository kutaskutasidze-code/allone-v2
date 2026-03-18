import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;

// Downsample 24kHz PCM to 8kHz (Twilio native) with proper averaging to avoid glitches
function downsampleTo8k(pcm24k: Int16Array): Int16Array {
  const ratio = 3; // 24000 / 8000
  const gain = 3.0; // boost volume for phone
  const outLen = Math.floor(pcm24k.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const avg = (pcm24k[idx] + pcm24k[idx + 1] + pcm24k[idx + 2]) / ratio;
    out[i] = Math.max(-32768, Math.min(32767, Math.round(avg * gain)));
  }
  return out;
}

// Encode PCM s16le as mulaw (ITU G.711) — native phone codec
function linearToMulaw(sample: number): number {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  sample += MULAW_BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; exponent--, mask >>= 1) {}
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  const mulaw = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  return mulaw;
}

// Build 8kHz mulaw WAV — plays perfectly on phone with zero conversion
function buildMulawWav(pcm24k: Uint8Array): ArrayBuffer {
  // Parse 24kHz s16le PCM into Int16Array
  const samples24k = new Int16Array(pcm24k.buffer, pcm24k.byteOffset, pcm24k.length / 2);
  // Downsample to 8kHz
  const samples8k = downsampleTo8k(samples24k);
  // Convert to mulaw
  const mulawData = new Uint8Array(samples8k.length);
  for (let i = 0; i < samples8k.length; i++) {
    mulawData[i] = linearToMulaw(samples8k[i]);
  }

  // WAV header for mulaw
  const wavSize = 44 + mulawData.length;
  const buf = new ArrayBuffer(wavSize);
  const v = new DataView(buf);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  v.setUint32(4, wavSize - 8, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 7, true);    // mulaw format
  v.setUint16(22, 1, true);    // mono
  v.setUint32(24, 8000, true);  // 8kHz
  v.setUint32(28, 8000, true);  // byte rate
  v.setUint16(32, 1, true);    // block align
  v.setUint16(34, 8, true);    // 8 bits per sample
  w(36, 'data');
  v.setUint32(40, mulawData.length, true);
  new Uint8Array(buf).set(mulawData, 44);
  return buf;
}

// Gemini TTS — best Georgian quality
async function geminiTTS(text: string): Promise<ArrayBuffer | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Say in a warm, friendly voice: ${text}` }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      console.error('Gemini TTS error:', res.status);
      return null;
    }

    const data = await res.json();
    const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) return null;

    const pcmBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    return buildMulawWav(pcmBytes);
  } catch (e) {
    console.error('Gemini TTS error:', e);
    return null;
  }
}

// Cartesia TTS — fallback
async function cartesiaTTS(text: string): Promise<ArrayBuffer | null> {
  if (!CARTESIA_API_KEY) return null;

  try {
    const res = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': CARTESIA_API_KEY,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-3',
        transcript: text,
        voice: { mode: 'id', id: '0bfbea6c-2f8f-4f86-b411-aa2316561e36' },
        language: 'ka',
        output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 24000 },
      }),
    });

    if (!res.ok) return null;
    // Cartesia returns WAV with header — extract PCM, convert to mulaw
    const wavBuf = await res.arrayBuffer();
    const pcmBytes = new Uint8Array(wavBuf, 44); // skip WAV header
    return buildMulawWav(pcmBytes);
  } catch {
    return null;
  }
}

// Allow up to 30s for TTS generation
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text');
  if (!text) return new NextResponse(null, { status: 204 });

  let audio = await geminiTTS(text);
  if (!audio) {
    console.log('[tts-play] Gemini unavailable, falling back to Cartesia');
    audio = await cartesiaTTS(text);
  }

  if (!audio) return new NextResponse(null, { status: 502 });

  return new NextResponse(audio, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

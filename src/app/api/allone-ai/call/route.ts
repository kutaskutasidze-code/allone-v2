import { NextRequest, NextResponse } from 'next/server';

// Voice server on Fly.io handles WebSocket Media Streams
const VOICE_SERVER_URL = 'https://allone-voice-agent.fly.dev';
const LIKA_PHONE_NUMBER = process.env.LIKA_PHONE_NUMBER;

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    const targetNumber = to || LIKA_PHONE_NUMBER;

    if (!targetNumber) {
      return NextResponse.json({ error: 'No phone number provided' }, { status: 400 });
    }

    // Proxy to voice server on Fly.io
    const res = await fetch(`${VOICE_SERVER_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: targetNumber }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Voice server call error:', data);
      return NextResponse.json({
        error: data.error || 'Call failed',
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      callSid: data.callSid,
      to: targetNumber,
    });
  } catch (error) {
    console.error('Call error:', error);
    return NextResponse.json({ error: 'Call initiation failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

const VOICE_SERVER_URL = 'https://allone-voice-agent.fly.dev';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ callSid: string }> }
) {
  const { callSid } = await params;

  try {
    const res = await fetch(`${VOICE_SERVER_URL}/call/${callSid}/transcript`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { callSid, status: 'unknown', transcript: [] },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { callSid, status: 'unknown', transcript: [] },
      { status: 200 }
    );
  }
}

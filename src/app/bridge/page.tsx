'use client';

import { useState } from 'react';

export default function BridgePage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const submit = async () => {
    if (!token.trim()) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: token.trim() }),
      });
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Bridge Setup</h1>
        <p className="text-sm text-[#86868b] mb-6">Paste your Telegram bot token below</p>

        {status === 'done' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-medium">Token saved!</p>
            <p className="text-green-600 text-sm mt-1">Bot will start automatically. Open your bot in Telegram and send /start</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456:ABCdef..."
              className="w-full px-4 py-3 text-base border border-[#e5e5e7] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] mb-4"
              autoFocus
            />
            <button
              onClick={submit}
              disabled={!token.trim() || status === 'saving'}
              className="w-full py-3 bg-[#1d1d1f] text-white font-medium rounded-xl hover:bg-[#3a3a3c] disabled:opacity-50 transition-colors"
            >
              {status === 'saving' ? 'Saving...' : 'Save & Start Bot'}
            </button>
            {status === 'error' && (
              <p className="text-red-500 text-sm mt-2 text-center">Failed to save. Try again.</p>
            )}
          </>
        )}

        <div className="mt-8 bg-white rounded-xl border border-[#e5e5e7] p-4">
          <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">How to get the token:</h2>
          <ol className="text-sm text-[#6e6e73] space-y-2">
            <li>1. Open Telegram</li>
            <li>2. Search <strong>@BotFather</strong></li>
            <li>3. Send <code className="bg-[#f5f5f7] px-1.5 py-0.5 rounded">/newbot</code></li>
            <li>4. Name: <strong>Allone Bridge</strong></li>
            <li>5. Username: <strong>allone_mac_bot</strong> (or any unique name ending in _bot)</li>
            <li>6. Copy the token and paste above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

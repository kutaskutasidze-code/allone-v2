import http from 'http';
import { WebSocketServer } from 'ws';
import { handleCallConnection, getCallTranscript, getCallStatus } from './call-handler.js';

const PORT = process.env.PORT || 8080;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// HTTP server for TwiML and call initiation
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for transcript polling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // Get call transcript (live or completed)
  const transcriptMatch = url.pathname.match(/^\/call\/([^/]+)\/transcript$/);
  if (transcriptMatch && req.method === 'GET') {
    const callSid = transcriptMatch[1];
    const transcript = getCallTranscript(callSid);
    const status = getCallStatus(callSid);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ callSid, status, transcript }));
    return;
  }

  // Get call status
  const statusMatch = url.pathname.match(/^\/call\/([^/]+)\/status$/);
  if (statusMatch && req.method === 'GET') {
    const callSid = statusMatch[1];
    const status = getCallStatus(callSid);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ callSid, status }));
    return;
  }

  // TwiML for incoming/outgoing calls — connect to WebSocket stream
  if (url.pathname === '/twiml') {
    const host = req.headers.host;
    const wsUrl = `wss://${host}/stream`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml);
    return;
  }

  // Initiate outbound call
  if (url.pathname === '/call' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { to } = JSON.parse(body);
        if (!to) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing "to" field' }));
          return;
        }

        const host = req.headers.host;
        const twimlUrl = `https://${host}/twiml`;

        // Use Twilio REST API to create call
        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Url: twimlUrl,
          StatusCallback: `https://${host}/twiml?status=1`,
          StatusCallbackEvent: 'completed',
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        const data = await twilioRes.json();
        if (twilioRes.ok) {
          console.log(`[call] initiated to ${to}, sid=${data.sid}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, callSid: data.sid }));
        } else {
          console.error('[call] error:', data);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: data.message || 'Call failed' }));
        }
      } catch (e) {
        console.error('[call] error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// WebSocket server for Twilio Media Streams
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/stream') {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('[ws] new connection');
  handleCallConnection(ws);
});

server.listen(PORT, () => {
  console.log(`[voice-server] listening on port ${PORT}`);
});

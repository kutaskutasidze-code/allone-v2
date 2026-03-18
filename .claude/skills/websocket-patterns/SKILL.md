---
name: websocket-patterns
description: Real-time WebSocket connection patterns for Next.js applications. Covers Socket.io, native WebSockets, and real-time features. Use when building live chat, notifications, or real-time updates.
---

# WebSocket Patterns for Real-Time Features

## Options Overview

| Technology | Best For | Complexity |
|------------|----------|------------|
| **Supabase Realtime** | Simple pub/sub, DB changes | Low |
| **Socket.io** | Full-featured real-time | Medium |
| **Native WebSocket** | Lightweight, custom protocol | Medium |
| **Pusher/Ably** | Managed service, scale | Low |
| **Server-Sent Events** | One-way server → client | Low |

---

## Pattern 1: Supabase Realtime (Recommended for Supabase projects)

### Subscribe to Database Changes

```typescript
// hooks/useRealtimeMessages.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export function useRealtimeMessages(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.new) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  return messages;
}
```

### Broadcast Channel (No database)

```typescript
// hooks/usePresence.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserPresence {
  id: string;
  name: string;
  status: 'online' | 'typing' | 'away';
}

export function usePresence(roomId: string, currentUser: UserPresence) {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: currentUser.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presentUsers = Object.values(state)
          .flat()
          .map((p: unknown) => p as UserPresence);
        setUsers(presentUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(currentUser);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUser, supabase]);

  // Update user status
  const updateStatus = async (status: UserPresence['status']) => {
    const channel = supabase.channel(`room:${roomId}`);
    await channel.track({ ...currentUser, status });
  };

  return { users, updateStatus };
}
```

### Broadcast Messages (Ephemeral)

```typescript
// hooks/useBroadcast.ts
'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BroadcastMessage {
  type: string;
  payload: unknown;
}

export function useBroadcast(
  channelName: string,
  onMessage: (message: BroadcastMessage) => void
) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        onMessage(payload as BroadcastMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, onMessage, supabase]);

  const broadcast = useCallback(
    async (message: BroadcastMessage) => {
      const channel = supabase.channel(channelName);
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
    },
    [channelName, supabase]
  );

  return { broadcast };
}

// Usage
function ChatRoom() {
  const { broadcast } = useBroadcast('chat-room-1', (msg) => {
    console.log('Received:', msg);
  });

  const sendTypingIndicator = () => {
    broadcast({ type: 'typing', payload: { userId: '123' } });
  };
}
```

---

## Pattern 2: Socket.io (Full-Featured)

### Installation

```bash
npm install socket.io socket.io-client
```

### Server Setup (Custom Node.js server)

```typescript
// server.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a room
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { id: socket.id });
    });

    // Leave a room
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { id: socket.id });
    });

    // Chat message
    socket.on('chat-message', (data: { roomId: string; message: string }) => {
      io.to(data.roomId).emit('chat-message', {
        id: socket.id,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Typing indicator
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('typing', {
        id: socket.id,
        isTyping: data.isTyping,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
```

### Client Hook

```typescript
// hooks/useSocket.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { url = '', autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(url, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [url, autoConnect]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-room', roomId);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    joinRoom,
    leaveRoom,
  };
}
```

### Chat Component with Socket.io

```typescript
// components/SocketChat.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: string;
  message: string;
  timestamp: string;
}

export function SocketChat({ roomId }: { roomId: string }) {
  const { isConnected, emit, on, joinRoom, leaveRoom } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isConnected) return;

    joinRoom(roomId);

    const unsubMessage = on('chat-message', (data) => {
      setMessages(prev => [...prev, data as Message]);
    });

    const unsubTyping = on('typing', (data: { id: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.id);
        } else {
          newSet.delete(data.id);
        }
        return newSet;
      });
    });

    return () => {
      leaveRoom(roomId);
      unsubMessage();
      unsubTyping();
    };
  }, [isConnected, roomId, joinRoom, leaveRoom, on]);

  const sendMessage = () => {
    if (!input.trim()) return;
    emit('chat-message', { roomId, message: input });
    setInput('');
    emit('typing', { roomId, isTyping: false });
  };

  const handleTyping = (value: string) => {
    setInput(value);
    emit('typing', { roomId, isTyping: value.length > 0 });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      <div className={`px-4 py-2 text-sm ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="p-2 bg-gray-100 rounded">
            <span className="text-xs text-gray-500">{msg.id}</span>
            <p>{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1 text-sm text-gray-500">
          {typingUsers.size === 1 ? 'Someone is typing...' : `${typingUsers.size} people are typing...`}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(); }}
        className="p-4 border-t flex gap-2"
      >
        <input
          value={input}
          onChange={e => handleTyping(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## Pattern 3: Native WebSocket API Route

### WebSocket Handler (API Route)

```typescript
// app/api/ws/route.ts
// Note: Next.js doesn't natively support WebSocket in API routes
// Use a custom server or edge runtime

// For Vercel, use Supabase Realtime or a separate WebSocket service
// For self-hosted, use the custom server approach below
```

### Custom Server with Native WebSocket

```typescript
// server-ws.ts
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

// Store connections by room
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket) => {
  let currentRoom: string | null = null;

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'join':
          currentRoom = message.roomId;
          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Set());
          }
          rooms.get(currentRoom)!.add(ws);
          break;

        case 'message':
          if (currentRoom && rooms.has(currentRoom)) {
            const payload = JSON.stringify({
              type: 'message',
              content: message.content,
              timestamp: Date.now(),
            });

            rooms.get(currentRoom)!.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            });
          }
          break;

        case 'leave':
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom)!.delete(ws);
          }
          currentRoom = null;
          break;
      }
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom)!.delete(ws);
    }
  });
});

server.listen(3001, () => {
  console.log('WebSocket server on port 3001');
});
```

### Client Hook for Native WebSocket

```typescript
// hooks/useWebSocket.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type MessageHandler = (data: unknown) => void;

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = handlersRef.current.get(data.type);
        if (handler) {
          handler(data);
        }
      } catch (err) {
        console.error('Message parse error:', err);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const send = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    handlersRef.current.set(type, handler);
    return () => {
      handlersRef.current.delete(type);
    };
  }, []);

  return { isConnected, send, subscribe };
}
```

---

## Pattern 4: Server-Sent Events (SSE)

For one-way server → client streaming:

```typescript
// app/api/events/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // Simulate events
      let count = 0;
      const sendEvent = setInterval(() => {
        count++;
        const data = JSON.stringify({ count, time: Date.now() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        if (count >= 100) {
          clearInterval(sendEvent);
          clearInterval(heartbeat);
          controller.close();
        }
      }, 1000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(sendEvent);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Client usage
function useSSE(url: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  return data;
}
```

---

## Pattern 5: Reconnection Logic

```typescript
// hooks/useReconnectingSocket.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Options {
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
}

export function useReconnectingSocket(url: string, options: Options = {}) {
  const {
    maxRetries = 10,
    retryDelay = 1000,
    maxRetryDelay = 30000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      setRetryCount(0);
      console.log('Connected');
    };

    ws.onclose = () => {
      setIsConnected(false);

      // Attempt reconnection with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.min(
          retryDelay * Math.pow(2, retryCount),
          maxRetryDelay
        );

        console.log(`Reconnecting in ${delay}ms... (attempt ${retryCount + 1})`);

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connect();
        }, delay);
      } else {
        console.error('Max retries reached');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [url, retryCount, maxRetries, retryDelay, maxRetryDelay]);

  useEffect(() => {
    connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, send, retryCount };
}
```

---

## Best Practices

1. **Use Supabase Realtime** when possible - Already integrated, handles scaling
2. **Implement reconnection** - Networks fail, handle gracefully
3. **Add heartbeats** - Detect dead connections
4. **Clean up subscriptions** - Prevent memory leaks
5. **Handle offline state** - Queue messages, sync on reconnect
6. **Rate limit messages** - Prevent spam/abuse
7. **Compress large payloads** - Reduce bandwidth
8. **Use rooms/channels** - Don't broadcast everything to everyone

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  Mic,
  FileText,
  Plus,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  Star,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Paperclip,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiquidMetal, PulsingBorder } from '@paper-design/shaders-react';

// Web Speech API types are in src/types/speech.d.ts

interface AttachedFile {
  file: File;
  name: string;
  extractedText?: string;
  uploading?: boolean;
}

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.csv,.md,.png,.jpg,.jpeg';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createAction?: {
    type: string;
    config: Record<string, unknown>;
  };
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  chat_messages?: { id: string; role: string; content: string; created_at: string }[];
}

interface Product {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

interface AIStudioContentProps {
  user: {
    id: string;
    email?: string;
  };
  products: Product[];
  profile: {
    avatar_style?: string;
    avatar_seed?: string;
    custom_avatar_url?: string | null;
    pricing_tiers?: {
      name: string;
      max_products: number;
    };
  } | null;
}

const productTypeIcons: Record<string, typeof Zap> = {
  automation: Zap,
  voice_agent: Mic,
  rag_bot: FileText,
};

const productTypeLabels: Record<string, string> = {
  automation: 'Automation',
  voice_agent: 'Voice AI',
  rag_bot: 'RAG Bot',
};

const MAX_MESSAGE_LENGTH = 4000;

const QUICK_PROMPTS = [
  { icon: Zap, label: 'Lead capture automation', prompt: 'I need an automation to capture leads from my website form and notify my team on Slack' },
  { icon: Mic, label: 'Phone receptionist', prompt: 'Create a voice AI that answers calls, takes messages, and schedules appointments' },
  { icon: FileText, label: 'Support chatbot', prompt: 'I want a chatbot that can answer customer questions from my FAQ documents' },
];

export default function AIStudioContent({ user, products, profile }: AIStudioContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [sessions, setSessions] = useState<{ starred: ChatSession[]; recent: ChatSession[] }>({ starred: [], recent: [] });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [chatMode, setChatMode] = useState<'chat' | 'voice'>('chat');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceModeActiveRef = useRef(false);
  const sendMessageVoiceRef = useRef<(text: string) => void>(() => {});
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  // User avatar URL
  const userAvatarUrl = profile?.custom_avatar_url ||
    (profile?.avatar_style && profile?.avatar_seed
      ? `https://api.dicebear.com/7.x/${profile.avatar_style}/svg?seed=${encodeURIComponent(profile.avatar_seed)}`
      : null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session.id);
        setMessages([]);
        loadSessions(); // non-blocking
        return data.session.id;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
    return null;
  };

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        if (isMobile) setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }, [isMobile]);

  const saveMessage = async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, role, content }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const toggleStar = async (sessionId: string, currentStarred: boolean) => {
    try {
      await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, is_starred: !currentStarred }),
      });
      await loadSessions();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/chat/sessions?sessionId=${sessionId}`, { method: 'DELETE' });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    // Client-side validation
    if (input.length > MAX_MESSAGE_LENGTH) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Message too long. Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    const messageContent = input.trim() || (attachedFile ? `[Attached: ${attachedFile.name}]` : '');
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Clear file after sending
    const fileContext = attachedFile?.extractedText ? {
      fileName: attachedFile.name,
      extractedText: attachedFile.extractedText,
    } : null;
    setAttachedFile(null);

    // Save user message in background (don't block LLM call)
    saveMessage(sessionId, 'user', userMessage.content);

    try {
      const response = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          fileContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const assistantId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      let createAction = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              fullContent += data.content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
            } else if (data.type === 'done') {
              createAction = data.createAction;
            }
          } catch { /* skip */ }
        }
      }

      // Save and update in background
      saveMessage(sessionId, 'assistant', fullContent);
      loadSessions();

      if (createAction) {
        handleCreateProduct(createAction, sessionId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      saveMessage(sessionId, 'assistant', errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (createAction: { type: string; config: Record<string, unknown> }, sessionId: string) => {
    try {
      const response = await fetch('/api/studio/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: createAction.type,
          config: createAction.config,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedProduct(data.product);

        // Build success message based on product type
        let successContent = `I've created your ${productTypeLabels[createAction.type] || 'product'} "${createAction.config.name}".`;

        if (createAction.type === 'voice_agent') {
          if (data.phone_number) {
            successContent += `\n\nPhone Number: ${data.phone_number}\n\nYou can test it by calling this number! Find more details in your Voice AI dashboard.`;
          } else if (data.warning) {
            successContent += `\n\n${data.warning}\n\nYour agent configuration is saved. Check the Voice AI dashboard for status updates.`;
          } else {
            successContent += `\n\nGo to your Voice AI dashboard to see details and configure the phone number.`;
          }
        } else if (createAction.type === 'rag_bot') {
          successContent += `\n\nGo to your RAG Bots dashboard to upload documents and get the embed code.`;
        } else {
          successContent += `\n\nGo to your Workflows dashboard to configure triggers and actions.`;
        }

        const successMessage: Message = {
          id: `success-${Date.now()}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
        await saveMessage(sessionId, 'assistant', successContent);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create product' }));
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Failed to create the product: ${errorData.error || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveMessage(sessionId, 'assistant', errorMessage.content);
      }
    } catch (error) {
      console.error('Create product error:', error);
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    setShowTranscript(true);
    setIsChatOpen(true);
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    saveMessage(sessionId, 'user', userMessage.content);

    try {
      const response = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMessage].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const assistantId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      let createAction = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              fullContent += data.content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
            } else if (data.type === 'done') {
              createAction = data.createAction;
            }
          } catch { /* skip */ }
        }
      }

      saveMessage(sessionId, 'assistant', fullContent);
      loadSessions();

      if (createAction) {
        handleCreateProduct(createAction, sessionId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Text-to-speech via browser SpeechSynthesis
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    setIsSpeaking(true);

    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, (match) => match.replace(/\[|\]|\(.*?\)/g, ''))
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 1500);

    if (!cleanText) {
      setIsSpeaking(false);
      return;
    }

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      speechSynthesis.speak(utterance);
    });
  }, []);

  // Start listening via browser SpeechRecognition
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    transcriptRef.current = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const text = transcriptRef.current.trim();
      if (text && voiceModeActiveRef.current) {
        sendMessageVoiceRef.current(text);
      } else if (voiceModeActiveRef.current) {
        // No speech detected, restart
        setTimeout(() => startListening(), 300);
      }
    };

    recognition.start();
    setIsRecording(true);
  }, []);

  // Send a message in voice mode (speaks response, auto-listens again)
  const sendMessageVoice = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    saveMessage(sessionId, 'user', userMessage.content);

    try {
      const response = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const assistantId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      let createAction = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              fullContent += data.content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
            } else if (data.type === 'done') {
              createAction = data.createAction;
            }
          } catch { /* skip */ }
        }
      }

      saveMessage(sessionId, 'assistant', fullContent);
      loadSessions();

      // Speak the full response
      await speakText(fullContent);

      // Auto-restart listening for continuous conversation
      if (voiceModeActiveRef.current) {
        setTimeout(() => startListening(), 300);
      }

      if (createAction) {
        handleCreateProduct(createAction, sessionId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      saveMessage(sessionId, 'assistant', errorMsg.content);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentSessionId, messages, speakText, startListening]);

  // Keep ref in sync to avoid stale closures in startListening
  sendMessageVoiceRef.current = sendMessageVoice;

  // Voice mode toggle (blob click) - state machine
  const toggleVoiceMode = () => {
    if (isLoading) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (isSpeaking) {
      // Speaking → Click: Interrupt speech, start listening
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceModeActive(true);
      voiceModeActiveRef.current = true;
      startListening();
      return;
    }

    if (isRecording) {
      // Recording → Click: Stop and cancel
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsRecording(false);
      setVoiceModeActive(false);
      voiceModeActiveRef.current = false;
      return;
    }

    // Idle → Click: Start listening
    setVoiceModeActive(true);
    voiceModeActiveRef.current = true;
    startListening();
  };

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'File too large. Maximum size is 10MB.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setAttachedFile({ file, name: file.name, uploading: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/chat/upload', { method: 'POST', body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();
      setAttachedFile({
        file,
        name: data.fileName,
        extractedText: data.extractedText,
        uploading: false,
      });
    } catch (error) {
      setAttachedFile(null);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const allSessions = [...sessions.starred, ...sessions.recent];

  // Chat mode: submit via metallic input
  const handleChatSubmit = () => {
    if (!input.trim() || isLoading) return;
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="flex h-full pt-[5rem] relative overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex-shrink-0 bg-white overflow-hidden",
              isMobile && "fixed left-0 top-[5rem] bottom-0 z-40"
            )}
          >
            <div className="w-[220px] h-full flex flex-col pt-3 px-3">
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-[#3a3a3c] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
              <div className="flex-1 overflow-y-auto mt-4" style={{ scrollbarWidth: 'none' }}>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-[#86868b]" />
                  </div>
                ) : allSessions.length === 0 ? (
                  <p className="text-[12px] text-[#a1a1a6] px-3">No chats yet</p>
                ) : (
                  <>
                    {sessions.starred.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-[#a1a1a6] uppercase tracking-wider mb-1 px-3">Starred</p>
                        {sessions.starred.map((session) => (
                          <SessionItem key={session.id} session={session} isActive={currentSessionId === session.id} onSelect={() => loadSession(session.id)} onToggleStar={() => toggleStar(session.id, session.is_starred)} onDelete={() => deleteSession(session.id)} />
                        ))}
                      </div>
                    )}
                    {sessions.recent.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#a1a1a6] uppercase tracking-wider mb-1 px-3">Recent</p>
                        {sessions.recent.map((session) => (
                          <SessionItem key={session.id} session={session} isActive={currentSessionId === session.id} onSelect={() => loadSession(session.id)} onToggleStar={() => toggleStar(session.id, session.is_starred)} onDelete={() => deleteSession(session.id)} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Thin Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-transparent">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
          >
            {showSidebar ? <PanelLeftClose className="w-[18px] h-[18px] text-[#86868b]" /> : <PanelLeft className="w-[18px] h-[18px] text-[#86868b]" />}
          </button>

          {/* Chat / Voice Toggle */}
          <div className="flex items-center bg-[#f5f5f7] rounded-full p-0.5">
            <button
              onClick={() => { setChatMode('chat'); setIsChatOpen(false); }}
              className={cn('px-3 py-1 text-xs font-medium rounded-full transition-all', chatMode === 'chat' ? 'bg-[#1d1d1f] text-white' : 'text-[#86868b]')}
            >
              Chat
            </button>
            <button
              onClick={() => setChatMode('voice')}
              className={cn('px-3 py-1 text-xs font-medium rounded-full transition-all', chatMode === 'voice' ? 'bg-[#1d1d1f] text-white' : 'text-[#86868b]')}
            >
              Voice
            </button>
          </div>

          {profile?.pricing_tiers && (
            <p className="text-[11px] text-[#86868b]">
              {profile.pricing_tiers.name} · {products.length}/{profile.pricing_tiers.max_products === -1 ? '∞' : profile.pricing_tiers.max_products}
            </p>
          )}
        </div>

        {/* Center Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">

          {/* ===== CHAT MODE ===== */}
          {chatMode === 'chat' && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              {/* Messages - no borders, no backgrounds, just text */}
              <div className={cn(
                "w-full max-w-lg transition-all duration-500 px-4",
                isChatOpen ? "flex-1 opacity-100" : "h-0 opacity-0 overflow-hidden"
              )}>
                <div ref={messagesEndRef} className="h-full overflow-y-auto flex flex-col justify-end pb-6" style={{ scrollbarWidth: 'none' }}>
                  {messages.length === 0 && isChatOpen && (
                    <div className="flex flex-col items-center justify-center gap-3 pb-8">
                      {QUICK_PROMPTS.map((prompt, index) => {
                        const Icon = prompt.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(prompt.prompt)}
                            className="flex items-center gap-2.5 text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {prompt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="animate-fade-in">
                        {message.role === 'user' ? (
                          <p className="text-[13px] text-[#86868b] text-right">{message.content}</p>
                        ) : (
                          <p className="text-[15px] text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#1d1d1f] rounded-full animate-pulse" />
                        <span className="w-1.5 h-1.5 bg-[#1d1d1f] rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-[#1d1d1f] rounded-full animate-pulse [animation-delay:300ms]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metallic Ask AI Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col justify-center items-center mb-8 [&_*:focus-visible]:!outline-none"
              >
                {!isChatOpen ? (
                  <div
                    onClick={() => { setIsChatOpen(true); setTimeout(() => chatInputRef.current?.focus(), 100); }}
                    className="relative w-[200px] sm:w-[220px] h-[60px] sm:h-[68px] cursor-pointer flex items-center justify-center"
                  >
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <PulsingBorder
                        speed={0.79}
                        roundness={1}
                        thickness={0.025}
                        softness={0.85}
                        intensity={0.2}
                        bloom={0.25}
                        spots={5}
                        spotSize={0.5}
                        pulse={0.2}
                        smoke={0.3}
                        smokeSize={0.6}
                        scale={0.6}
                        rotation={0}
                        aspectRatio="auto"
                        colors={['#233944', '#262426', '#F6F3F3C2']}
                        colorBack="#ffffff"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="relative z-10 flex items-center justify-center">
                      <LiquidMetal
                        speed={0.68}
                        softness={0.1}
                        repetition={2}
                        shiftRed={0.3}
                        shiftBlue={0.3}
                        distortion={0.07}
                        contour={0.4}
                        scale={0.6}
                        rotation={0}
                        shape="circle"
                        angle={70}
                        image="https://workers.paper.design/file-assets/01KF3FJDBVRQRC2Z21M10KBDQ5/01KF3JVMCGH3M6TG0XEQ9ZA6S3.svg"
                        colorBack="#00000000"
                        colorTint="#FFFFFF"
                        className="w-[40px] h-[40px] sm:w-[46px] sm:h-[46px] rounded-full mr-3"
                      />
                      <span className="text-sm sm:text-base font-medium tracking-wide text-[#1d1d1f]">Ask AI</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[calc(100vw-48px)] sm:w-[460px] md:w-[520px] h-[48px] flex items-center px-4">
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                      disabled={isLoading}
                      placeholder="Ask anything..."
                      className="flex-1 h-full bg-transparent text-sm text-[#1d1d1f] outline-none border-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none caret-[#1d1d1f] placeholder:text-[#a1a1a6]"
                    />
                    <div className="flex items-center gap-2.5 ml-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#a1a1a6] hover:text-[#1d1d1f] transition-colors">
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleChatSubmit()} disabled={isLoading || !input.trim()} className="text-[#1d1d1f] disabled:opacity-20 transition-opacity">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_FILE_TYPES} onChange={handleFileSelect} className="hidden" />
                  </div>
                )}

                {/* Attached file indicator */}
                {attachedFile && isChatOpen && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#86868b] mt-1">
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                    {attachedFile.uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                      <button onClick={removeAttachedFile} className="hover:text-[#1d1d1f]"><X className="w-3 h-3" /></button>
                    )}
                  </div>
                )}

                {/* Close button */}
                {isChatOpen && (
                  <button
                    onClick={() => { setIsChatOpen(false); }}
                    className="mt-2 p-1.5 text-[#a1a1a6] hover:text-[#1d1d1f] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            </div>
          )}

          {/* ===== VOICE MODE ===== */}
          {chatMode === 'voice' && (
            <div className="flex flex-col items-center justify-center w-full h-full gap-4">
              {/* Gooey liquid blob */}
              <div
                onClick={toggleVoiceMode}
                className="relative flex items-center justify-center w-40 h-40 md:w-52 md:h-52 cursor-pointer select-none"
              >
                <div className="absolute inset-0 pointer-events-none" style={{ filter: 'contrast(20) blur(0px)' }}>
                  <div className="absolute inset-0" style={{ filter: 'blur(6px)' }}>
                    <div className={cn("absolute inset-[8%]", isRecording ? "bg-red-600" : isSpeaking ? "bg-[#34c759]" : "bg-[#1d1d1f]")} style={{ animation: 'blobA 8s ease-in-out infinite' }} />
                    <div className={cn("absolute w-[40%] h-[40%] rounded-full", isRecording ? "bg-red-600" : isSpeaking ? "bg-[#34c759]" : "bg-[#1d1d1f]")} style={{ animation: 'blobOrbit1 6s ease-in-out infinite' }} />
                    <div className={cn("absolute w-[32%] h-[32%] rounded-full", isRecording ? "bg-red-600" : isSpeaking ? "bg-[#34c759]" : "bg-[#1d1d1f]")} style={{ animation: 'blobOrbit2 7s ease-in-out infinite' }} />
                    <div className={cn("absolute w-[28%] h-[28%] rounded-full", isRecording ? "bg-red-600" : isSpeaking ? "bg-[#34c759]" : "bg-[#1d1d1f]")} style={{ animation: 'blobOrbit3 9s ease-in-out infinite' }} />
                  </div>
                </div>
                <span className="relative z-10 text-white text-[15px] md:text-[18px] font-semibold tracking-tight pointer-events-none">
                  {isLoading ? '...' : isRecording ? 'listening' : isSpeaking ? 'speaking' : 'tap to talk'}
                </span>
              </div>

              <style jsx>{`
                @keyframes blobA {
                  0%, 100% { border-radius: 52% 48% 66% 34% / 38% 64% 36% 62%; transform: rotate(0deg) scale(1); }
                  20% { border-radius: 64% 36% 52% 48% / 62% 38% 64% 36%; transform: rotate(72deg) scale(1.02); }
                  40% { border-radius: 38% 62% 48% 52% / 52% 48% 62% 38%; transform: rotate(144deg) scale(0.98); }
                  60% { border-radius: 58% 42% 42% 58% / 42% 58% 42% 58%; transform: rotate(216deg) scale(1.03); }
                  80% { border-radius: 42% 58% 58% 42% / 58% 42% 58% 42%; transform: rotate(288deg) scale(0.99); }
                }
                @keyframes blobOrbit1 {
                  0%, 100% { top: 5%; left: 55%; transform: scale(1); }
                  25% { top: 55%; left: 70%; transform: scale(1.1); }
                  50% { top: 65%; left: 30%; transform: scale(0.9); }
                  75% { top: 15%; left: 10%; transform: scale(1.05); }
                }
                @keyframes blobOrbit2 {
                  0%, 100% { top: 60%; left: 10%; transform: scale(1); }
                  33% { top: 10%; left: 50%; transform: scale(1.15); }
                  66% { top: 55%; left: 65%; transform: scale(0.85); }
                }
                @keyframes blobOrbit3 {
                  0%, 100% { top: 30%; left: 65%; transform: scale(1); }
                  25% { top: 65%; left: 55%; transform: scale(0.9); }
                  50% { top: 55%; left: 5%; transform: scale(1.1); }
                  75% { top: 5%; left: 35%; transform: scale(0.95); }
                }
              `}</style>

              {/* Transcript - no borders, just text */}
              {messages.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md max-h-[30vh] overflow-y-auto px-6" style={{ scrollbarWidth: 'none' }}>
                  <div className="space-y-3">
                    {messages.slice(-6).map((m) => (
                      <p key={m.id} className={cn("text-[13px] leading-relaxed", m.role === 'user' ? "text-[#86868b] text-right" : "text-[#1d1d1f]")}>
                        {m.content}
                      </p>
                    ))}
                  </div>
                  <div ref={messagesEndRef} />
                </motion.div>
              )}

              {/* Quick prompts when idle */}
              {messages.length === 0 && !isRecording && !isSpeaking && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  {QUICK_PROMPTS.map((prompt, index) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className="flex items-center gap-2 text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                      >
                        <Icon className="w-3 h-3" />
                        {prompt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Created Product Toast */}
      <AnimatePresence>
        {createdProduct && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto bg-white rounded-xl shadow-lg border border-black/[0.04] p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">Product Created!</p>
              <p className="text-xs text-[#86868b]">{createdProduct.name}</p>
            </div>
            <button onClick={() => setCreatedProduct(null)} className="ml-4 text-xs text-[#86868b] hover:text-[#1d1d1f]">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Session Item Component
function SessionItem({
  session,
  isActive,
  onSelect,
  onToggleStar,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors"
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <span className={cn("text-[12px] truncate flex-1 transition-colors", isActive ? "text-[#1d1d1f] font-medium" : "text-[#86868b] group-hover:text-[#1d1d1f]")}>
        {session.title}
      </span>
      {showActions && (
        <div className="flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onToggleStar(); }} className="p-0.5">
            <Star className={cn('w-3 h-3', session.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-[#a1a1a6]')} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5">
            <Trash2 className="w-3 h-3 text-[#a1a1a6] hover:text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}

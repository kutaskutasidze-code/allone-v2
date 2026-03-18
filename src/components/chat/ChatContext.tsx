'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ChatModal } from './ChatModal';

interface ChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
      <ChatModal isOpen={isOpen} onClose={closeChat} />
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

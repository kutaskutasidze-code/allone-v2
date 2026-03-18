"use client";

import { useCallback } from "react";
import { MessageDock, type Character } from "@/components/ui/message-dock";
import { useChat } from "./ChatContext";

// Equivalenza fragrance categories as characters
const equivalenzaCharacters: Character[] = [
  { emoji: "🌿", name: "Equivalenza", online: false },
  {
    emoji: "🍋",
    name: "Fresh",
    online: true,
    backgroundColor: "bg-lime-200",
    gradientColors: "#a1ec8b, #ecfccb",
  },
  {
    emoji: "🌸",
    name: "Floral",
    online: true,
    backgroundColor: "bg-pink-200",
    gradientColors: "#f9a8d4, #fce7f3",
  },
  {
    emoji: "🪵",
    name: "Woody",
    online: true,
    backgroundColor: "bg-amber-200",
    gradientColors: "#fcd34d, #fef3c7",
  },
  {
    emoji: "🖤",
    name: "Oriental",
    online: false,
    backgroundColor: "bg-stone-300",
    gradientColors: "#d6d3d1, #f5f5f4",
  },
];

export function EquivalenzaDock() {
  const { openChat } = useChat();

  const handleMessageSend = useCallback(
    (message: string, character: Character) => {
      // Open the main chat panel with the message pre-loaded
      console.log(`[Equivalenza] ${character.name}: ${message}`);
      openChat();
    },
    [openChat]
  );

  const handleCharacterSelect = useCallback((character: Character) => {
    console.log(`[Equivalenza] Selected: ${character.name}`);
  }, []);

  return (
    <MessageDock
      characters={equivalenzaCharacters}
      onMessageSend={handleMessageSend}
      onCharacterSelect={handleCharacterSelect}
      expandedWidth={480}
      position="bottom"
      placeholder={(name) => `Ask about ${name} fragrances...`}
      theme="light"
      enableAnimations={true}
      closeOnSend={true}
      autoFocus={true}
    />
  );
}

import { useCallback } from "react";
import { useSoul } from "@opensouls/react";
import { said } from "@opensouls/soul";
import { usePresence } from "./usePresence";
import { useUserChat } from "./useUserChat";

export type StoreEvent = {
  _id: string;
  _kind: "perception" | "interactionRequest" | "system";
  _timestamp: number;
  _pending?: boolean;
  internal?: boolean;
  action: string;
  content: string;
  name?: string;
};

export function useTanakiSoul() {
  const organization = "local";
  const local = true;
  
  // Get user-specific chat data
  const { userId, chatId, addMessage } = useUserChat();

  // Connect to presence tracking with user ID
  const { connectedUsers: presenceCount, isConnected: presenceConnected } = usePresence({ 
    enabled: true,
    userId 
  });

  // Use user-specific soul ID
  const { soul, connected, disconnect, store } = useSoul({
    blueprint: "tanaki-speaks",
    soulId: `tanaki-${userId}-${chatId}`, // Unique per user and session
    local,
    token: "test",
    debug: true,
  });

  const events = (store?.events ?? []) as unknown as StoreEvent[];

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message to chat immediately
    addMessage({
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: trimmed,
      timestamp: new Date(),
      isAI: false
    });

    // Dispatch with user-specific metadata
    await soul.dispatch({
      ...said("User", trimmed),
      _metadata: {
        userId,
        connectedUsers: presenceCount,
        chatId,
        timestamp: Date.now()
      },
    });
  }, [soul, userId, chatId, presenceCount, addMessage]);

  return {
    organization,
    local,
    soul,
    connected,
    events,
    send,
    disconnect,
    connectedUsers: presenceCount,
    presenceConnected,
    userId,
    chatId
  };
}
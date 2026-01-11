import { useSoul } from "@opensouls/react";
import { said } from "@opensouls/soul";
import { useCallback, useMemo } from "react";
import { usePresence } from "./usePresence";

// Generate unique session ID for each user/browser
const getOrCreateSessionId = () => {
  if (typeof window === "undefined") return "server-session";
  
  // Try to get existing session from localStorage
  let sessionId = localStorage.getItem("tanaki-session-id");
  
  // If no session exists or it's the shared one, create new
  if (!sessionId || sessionId === "tanaki-shared-session") {
    sessionId = `tanaki-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("tanaki-session-id", sessionId);
  }
  
  return sessionId;
};

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

  // Generate unique session ID for this user
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  
  // Connect to presence tracking
  const { connectedUsers: presenceCount, isConnected: presenceConnected } = usePresence({ 
    enabled: true 
  });

  const { soul, connected, disconnect, store } = useSoul({
    blueprint: "tanaki-speaks",
    soulId: sessionId, // Use unique session ID
    local,
    token: "test",
    debug: true,
  });

  const events = (store?.events ?? []) as unknown as StoreEvent[];

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    await soul.dispatch({
      ...said("User", trimmed),
      _metadata: {
        connectedUsers: presenceCount,
      },
    });
  }, [soul, presenceCount]);

  // Clear chat for this session
  const clearSession = useCallback(() => {
    // Create fresh session ID
    const newSessionId = `tanaki-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("tanaki-session-id", newSessionId);
    
    // Disconnect and let parent component reload with new session
    disconnect();
    
    return newSessionId;
  }, [disconnect]);

  return {
    organization,
    local,
    soul,
    connected,
    events,
    send,
    disconnect,
    clearSession,
    connectedUsers: presenceCount,
    presenceConnected,
    sessionId,
  };
}
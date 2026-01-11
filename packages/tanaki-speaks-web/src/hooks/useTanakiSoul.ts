import { useCallback, useEffect, useState } from "react";
import { useSoul } from "@opensouls/react";
import { said } from "@opensouls/soul";
import { usePresence } from "./usePresence";

// Generate a unique soulId per tab
const useUniqueSoulId = () => {
  const [soulId] = useState(() => crypto.randomUUID());
  return soulId;
};

export type StoreEvent = {
  _id: string;
  _kind: "perception" | "interactionRequest" | "system";
  _timestamp: number;
  action: string;
  content: string;
  soulId?: string; // track which tab sent it
};

export function useTanakiSoul() {
  const soulId = useUniqueSoulId(); // unique per tab

  const organization = "local";
  const local = true;

  const { connectedUsers: presenceCount, isConnected: presenceConnected } = usePresence({ enabled: true });

  const { soul, connected, disconnect } = useSoul({
    blueprint: "tanaki-speaks",
    soulId,
    local,
    token: "test",
    debug: true,
  });

  // Only store AI/MEILIN responses for this tab
  const [events, setEvents] = useState<StoreEvent[]>([]);

  // Listen for ephemeral AI responses
  useEffect(() => {
    const handler = (evt: any) => {
      const data = evt?.data;
      if (!data || data._kind !== "interactionRequest" || data.action !== "says") return;
      setEvents(prev => [...prev, { ...data, soulId }]);
    };
    soul.on("ephemeral:ai-response", handler);
    return () => soul.off("ephemeral:ai-response", handler);
  }, [soul, soulId]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Dispatch user message to AI
    await soul.dispatch({
      ...said("User", trimmed),
      _metadata: { connectedUsers: presenceCount },
    });
  }, [soul, presenceCount]);

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
  };
}

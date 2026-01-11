import { useSoul } from "@opensouls/react";
import { said } from "@opensouls/soul";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePresence } from "./usePresence";

function createSessionId() {
  return crypto.randomUUID();
}

export function useTanakiSoul() {
  const sessionId = useMemo(createSessionId, []);

  const { connectedUsers, isConnected: presenceConnected } = usePresence({
    enabled: true,
  });

  const { soul, connected, disconnect } = useSoul({
    blueprint: "tanaki-speaks",
    soulId: sessionId,
    local: true,
    token: "test",
    debug: true,
  });

  // 🔥 THIS is what you were missing
  const [aiMessages, setAiMessages] = useState<
    { id: string; text: string; timestamp: number }[]
  >([]);

  useEffect(() => {
    const onInteraction = (evt: any) => {
      const data = evt?.data;
      if (!data) return;

      if (data._kind === "interactionRequest" && data.action === "says") {
        setAiMessages((prev) => [
          ...prev,
          {
            id: data._id,
            text: data.content,
            timestamp: data._timestamp ?? Date.now(),
          },
        ]);
      }
    };

    soul.on("interactionRequest", onInteraction);

    return () => {
      soul.off("interactionRequest", onInteraction);
    };
  }, [soul]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !connected) return;

      await soul.dispatch({
        ...said("User", text),
        _metadata: { connectedUsers },
      });
    },
    [soul, connected, connectedUsers]
  );

  return {
    soul,
    connected,
    send,
    disconnect,
    connectedUsers,
    presenceConnected,
    aiMessages, // 👈 USE THIS IN UI
  };
}

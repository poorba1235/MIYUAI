/** @typedef {import("@/components/TanakiAudio").TanakiAudioHandle} TanakiAudioHandle */

import { ChatInput } from "@/components/ChatInput";
import { TanakiAudio, type TanakiAudioHandle } from "@/components/TanakiAudio";
import { useTanakiSoul } from "@/hooks/useTanakiSoul";
import { base64ToUint8 } from "@/utils/base64";
import { SoulEngineProvider } from "@opensouls/react";
import { Box, Flex, Text, VisuallyHidden } from "@radix-ui/themes";
import { useProgress } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tanaki3DExperience } from "./3d/Tanaki3DExperience";
import { FloatingBubbles } from "./FloatingBubbles";

function readBoolEnv(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/* -------------------------------------------------- */
/* Client Wrapper */
/* -------------------------------------------------- */

export default function TanakiClient() {
  const organization = "local";
  const local = readBoolEnv(import.meta.env.VITE_SOUL_ENGINE_LOCAL, false);

  const getWebSocketUrl =
    typeof window === "undefined"
      ? undefined
      : (org: string, _local: boolean, debug: boolean) => {
          const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const channel = debug ? "debug-chat" : "experience";
          return `${wsProtocol}//${window.location.host}/ws/soul/${encodeURIComponent(
            org
          )}/${channel}`;
        };

  return (
    <SoulEngineProvider
      organization={organization}
      local={local}
      getWebSocketUrl={getWebSocketUrl}
    >
      <TanakiExperience />
    </SoulEngineProvider>
  );
}

/* -------------------------------------------------- */
/* Main Experience */
/* -------------------------------------------------- */

function TanakiExperience() {
  const { connected, events, send, connectedUsers, soul } = useTanakiSoul();

  const audioRef = useRef<TanakiAudioHandle | null>(null);
  const activeTtsStreamIdRef = useRef<string | null>(null);
  const unlockedOnceRef = useRef(false);

  const [liveText, setLiveText] = useState("");
  const [mouthBlend, setMouthBlend] = useState(0);

  /* -------------------------------------------------- */
  /* Audio unlock */
  /* -------------------------------------------------- */

  const unlockOnce = useCallback(() => {
    if (unlockedOnceRef.current) return;
    unlockedOnceRef.current = true;
    void audioRef.current?.unlock();
  }, []);

  /* -------------------------------------------------- */
  /* Collect latest AI response (for ARIA) */
  /* -------------------------------------------------- */

  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    const latest = [...events]
      .reverse()
      .find((e) => e._kind === "interactionRequest" && e.action === "says");

    if (!latest) return;
    if (lastSpokenIdRef.current === latest._id) return;

    lastSpokenIdRef.current = latest._id;
    setLiveText(latest.content);
  }, [events]);

  /* -------------------------------------------------- */
  /* TTS audio stream */
  /* -------------------------------------------------- */

  useEffect(() => {
    const onChunk = (evt: any) => {
      const data = evt?.data;
      if (!data?.streamId || !data?.chunkBase64) return;

      if (activeTtsStreamIdRef.current !== data.streamId) {
        activeTtsStreamIdRef.current = data.streamId;
        audioRef.current?.interrupt();
      }

      try {
        const bytes = base64ToUint8(data.chunkBase64);
        audioRef.current?.enqueuePcm16(bytes);
      } catch (err) {
        console.error("TTS decode error", err);
      }
    };

    const onComplete = (evt: any) => {
      if (activeTtsStreamIdRef.current === evt?.data?.streamId) {
        activeTtsStreamIdRef.current = null;
      }
    };

    soul.on("ephemeral:audio-chunk", onChunk);
    soul.on("ephemeral:audio-complete", onComplete);

    return () => {
      soul.off("ephemeral:audio-chunk", onChunk);
      soul.off("ephemeral:audio-complete", onComplete);
    };
  }, [soul]);

  /* -------------------------------------------------- */
  /* Loader */
  /* -------------------------------------------------- */

  const { active, progress } = useProgress();

  /* -------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------- */

  const status = connected ? "🟢" : "🔴";

  return (
    <div
      className="h-screen w-screen relative"
      onPointerDownCapture={unlockOnce}
      onTouchStartCapture={unlockOnce}
    >
      {/* 3D background */}
      <Tanaki3DExperience />

      {/* Audio */}
      <TanakiAudio
        ref={audioRef}
        enabled
        onVolumeChange={(v) =>
          setMouthBlend((p) => p * 0.6 + Math.min(1, v * 1.6) * 0.4)
        }
      />

      {/* UI */}
      <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-transparent to-black/30">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <div className="bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm flex gap-2 items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {connected ? "Connected" : "Disconnected"}
            {connectedUsers > 0 && (
              <span className="text-xs text-gray-300">
                {connectedUsers} online
              </span>
            )}
          </div>
          <div className="bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm">
            MEILIN
          </div>
        </div>

        {/* Chat messages */}
        <FloatingBubbles events={events} />

        {/* Input */}
        <Box
          className="absolute left-4 right-4 bottom-4 max-w-2xl mx-auto"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Flex justify="between" align="center">
            <Flex gap="2">
              <Text size="2">{status}</Text>
              {connectedUsers > 0 && (
                <Text size="1" color="gray">
                  {connectedUsers} here
                </Text>
              )}
            </Flex>
            <Text size="2" color="gray">
              tanaki
            </Text>
          </Flex>

          <VisuallyHidden>
            <div aria-live="polite">{liveText}</div>
          </VisuallyHidden>

          <ChatInput
            onUserGesture={unlockOnce}
            onSend={async (text) => {
              unlockOnce();
              await send(text);
            }}
          />
        </Box>
      </div>

      {/* Loading */}
      {active && progress < 100 && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
          <div className="w-64">
            <div className="text-center mb-2">Loading…</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
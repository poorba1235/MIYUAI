/* eslint-disable react-refresh/only-export-components */
/** @typedef {import("@/components/TanakiAudio").TanakiAudioHandle} TanakiAudioHandle */

import loadingAnimation from "@/../public/loading.json";
import { ChatInput } from "@/components/ChatInput";
import { TanakiAudio } from "@/components/TanakiAudio";
import { useTanakiSoul } from "@/hooks/useTanakiSoul";
import { base64ToUint8 } from "@/utils/base64";
import { SoulEngineProvider } from "@opensouls/react";
import { VisuallyHidden } from "@radix-ui/themes";
import { useProgress } from "@react-three/drei";
import Lottie from "lottie-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tanaki3DExperience } from "./3d/Tanaki3DExperience";
import { Cpu, Home, Menu, Settings, Users, Zap } from "lucide-react";

function readBoolEnv(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export default function TanakiClient() {
  const organization = "local";
  const local = readBoolEnv(import.meta.env.VITE_SOUL_ENGINE_LOCAL, false);

  const getWebSocketUrl =
    typeof window === "undefined"
      ? undefined
      : (org: string, _local: boolean, debug: boolean) => {
          const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const channel = debug ? "debug-chat" : "experience";
          return `${wsProtocol}//${window.location.host}/ws/soul/${encodeURIComponent(org)}/${channel}`;
        };

  return (
    <SoulEngineProvider organization={organization} local={local} getWebSocketUrl={getWebSocketUrl}>
      <TanakiExperience />
    </SoulEngineProvider>
  );
}

function TanakiExperience() {
  // ✅ FIX: use aiMessages instead of events
  const { connected, aiMessages, send, connectedUsers, soul } = useTanakiSoul();

  const audioRef = useRef<any>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const activeTtsStreamIdRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [liveText, setLiveText] = useState("");
  const [userMessages, setUserMessages] = useState<
    { id: string; text: string; timestamp: Date }[]
  >([]);

  // ✅ FIX: live text comes from aiMessages
  useEffect(() => {
    const latest = aiMessages[aiMessages.length - 1];
    if (!latest) return;
    if (lastSpokenIdRef.current === latest.id) return;
    lastSpokenIdRef.current = latest.id;
    setLiveText(latest.text);
  }, [aiMessages.length]);

  // 🔊 Audio events (UNCHANGED)
  useEffect(() => {
    const onChunk = (evt: any) => {
      const data = evt?.data;
      if (!data?.chunkBase64 || !data?.streamId) return;

      if (activeTtsStreamIdRef.current !== data.streamId) {
        activeTtsStreamIdRef.current = data.streamId;
        audioRef.current?.interrupt();
      }

      audioRef.current?.enqueuePcm16(base64ToUint8(data.chunkBase64));
    };

    const onComplete = (evt: any) => {
      if (evt?.data?.streamId === activeTtsStreamIdRef.current) {
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !connected) return;

    setUserMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, timestamp: new Date() },
    ]);

    await send(text);
  };

  const { active, progress } = useProgress();

  return (
    <div style={{ height: "100dvh", width: "100%" }}>
      <Tanaki3DExperience message={liveText ? { content: liveText, animation: "Action" } : null} />

      <TanakiAudio ref={audioRef} enabled />

      {/* CHAT UI */}
      <div ref={overlayRef} className="fixed bottom-4 left-4 w-[420px] h-[70vh] bg-black/30 rounded-xl p-4">
        <div className="overflow-y-auto h-full space-y-3">

          {[...userMessages,
            ...aiMessages.map((m) => ({
              id: m.id,
              text: m.text,
              timestamp: new Date(m.timestamp),
              isAI: true,
            })),
          ]
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.isAI ? "bg-purple-500/20" : "bg-cyan-500/20"
                }`}
              >
                <strong>{msg.isAI ? "MEILIN" : "YOU"}</strong>
                <div>{msg.text}</div>
              </div>
            ))}

          {userMessages.length === 0 && aiMessages.length === 0 && (
            <div className="text-center text-gray-400">Start chatting</div>
          )}
        </div>

        <ChatInput disabled={!connected} onSend={handleSendMessage} />
      </div>

      <VisuallyHidden>
        <div aria-live="polite">{liveText}</div>
      </VisuallyHidden>

      <ModelLoadingOverlay active={active} progress={progress} />
    </div>
  );
}

/* -------------------------------------------------- */
/* 3D Model Loading Overlay */
/* -------------------------------------------------- */

function ModelLoadingOverlay({ active, progress }: { active: boolean; progress: number }) {
  if (!active || progress >= 100) return null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <Lottie animationData={loadingAnimation} className="w-64 h-64" />
      <div className="mt-4">{Math.round(progress)}%</div>
    </div>
  );
}

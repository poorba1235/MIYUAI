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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tanaki3DExperience } from "./3d/Tanaki3DExperience";

// Import icons
import { Cpu, Home, Menu, Settings, Sparkles, Users, Zap } from "lucide-react";

// Type definitions
interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
  };
  timestamp: Date;
  isPending?: boolean;
}

interface AvatarMessage {
  content: string;
  animation: string;
}

interface MenuItem {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  active?: boolean;
}

function readBoolEnv(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export default function TanakiClient() {
  const organization = "local";
  const local = readBoolEnv(import.meta.env.VITE_SOUL_ENGINE_LOCAL, false);

  // EXACT WebSocket URL from working code
  const getWebSocketUrl =
    typeof window === "undefined"
      ? undefined
      : (org: string, _local: boolean, debug: boolean) => {
          const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const channel = debug ? "debug-chat" : "experience";
          return `${wsProtocol}//${window.location.host}/ws/soul/${encodeURIComponent(org)}/${channel}`;
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
  // EXACTLY same destructuring as working code
  const { connected, events, send, connectedUsers, soul } = useTanakiSoul();
  
  // Audio handling (same as working code)
  const audioRef = useRef<TanakiAudioHandle | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const activeTtsStreamIdRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  
  // UI state
  const [blend, setBlend] = useState(0);
  const unlockedOnceRef = useRef(false);
  const [overlayHeight, setOverlayHeight] = useState(240);
  const [liveText, setLiveText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState("");
  
  // Chat UI state (NEW - for your chat interface)
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<AvatarMessage | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const pendingResponseRef = useRef<Message | null>(null);

  const USER_ID = useMemo(() => "user_" + Math.random().toString(36).substr(2, 9), []);

  const unlockOnce = useCallback(() => {
    if (unlockedOnceRef.current) return;
    unlockedOnceRef.current = true;
    void audioRef.current?.unlock();
  }, []);

  // 1. EXACT event handling from working code (with chat UI addition)
  useEffect(() => {
    const latest = [...events]
      .reverse()
      .find((e) => e._kind === "interactionRequest" && e.action === "says");
    
    if (!latest) return;
    if (lastSpokenIdRef.current === latest._id) return;
    
    lastSpokenIdRef.current = latest._id;
    setLiveText(latest.content);
    
    // ADDED: Update chat UI with AI response
    if (latest.content) {
      // Remove pending message if exists
      if (pendingResponseRef.current) {
        setMessages(prev => prev.filter(msg => msg.id !== pendingResponseRef.current?.id));
        pendingResponseRef.current = null;
      }
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: latest.content,
        user: { id: "MEILIN", name: "MEILIN" },
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === aiMessage.id || msg.text === aiMessage.text);
        return exists ? prev : [...prev, aiMessage];
      });
      
      // Set for 3D avatar
      setCurrentMessage({
        content: latest.content,
        animation: "Action",
      });
    }
    
    setIsThinking(false);
    
  }, [events.length, events[events.length - 1]?.content]);

  // 2. EXACT TTS handling from working code
  useEffect(() => {
    const onChunk = (evt: any) => {
      const data = evt?.data as any;
      if (!data || typeof data !== "object") return;

      const streamId = typeof data.streamId === "string" ? data.streamId : null;
      const chunkBase64 = typeof data.chunkBase64 === "string" ? data.chunkBase64 : null;
      if (!streamId || !chunkBase64) return;

      if (activeTtsStreamIdRef.current !== streamId) {
        activeTtsStreamIdRef.current = streamId;
        audioRef.current?.interrupt();
      }

      try {
        const bytes = base64ToUint8(chunkBase64);
        audioRef.current?.enqueuePcm16(bytes);
      } catch (err) {
        console.error("Failed to decode/enqueue TTS chunk:", err);
      }
    };

    const onComplete = (evt: any) => {
      const data = evt?.data as any;
      const streamId = typeof data?.streamId === "string" ? data.streamId : null;
      if (!streamId) return;
      if (activeTtsStreamIdRef.current === streamId) {
        activeTtsStreamIdRef.current = null;
        setCurrentMessage(null);
      }
    };

    const onError = (evt: any) => {
      const data = evt?.data as any;
      const message = typeof data?.message === "string" ? data.message : "unknown error";
      console.error("TTS error event:", message, evt);
      setError("Audio playback failed. Please try again.");
      
      // Cleanup pending message on error
      if (pendingResponseRef.current) {
        setMessages(prev => prev.filter(msg => msg.id !== pendingResponseRef.current?.id));
        pendingResponseRef.current = null;
      }
      setIsThinking(false);
    };

    soul.on("ephemeral:audio-chunk", onChunk);
    soul.on("ephemeral:audio-complete", onComplete);
    soul.on("ephemeral:audio-error", onError);
    
    return () => {
      soul.off("ephemeral:audio-chunk", onChunk);
      soul.off("ephemeral:audio-complete", onComplete);
      soul.off("ephemeral:audio-error", onError);
    };
  }, [soul]);

  // 3. EXACT overlay height measurement from working code
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setOverlayHeight(Math.max(120, Math.round(rect.height + 10)));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Handle sending message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !connected) return;
    
    try {
      setError("");
      unlockOnce();
      setIsThinking(true);
      
      // Add user message to chat
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        text: text,
        user: { id: USER_ID, name: "YOU" },
        timestamp: new Date()
      };
      
      // Add thinking message
      const thinkingMessage: Message = {
        id: `thinking_${Date.now()}`,
        text: "MEILIN is thinking...",
        user: { id: "MEILIN", name: "MEILIN" },
        timestamp: new Date(),
        isPending: true
      };
      
      pendingResponseRef.current = thinkingMessage;
      
      setMessages(prev => [...prev, userMessage, thinkingMessage]);
      
      // Send to AI (EXACT same as working code)
      await send(text);
      
      // Timeout to remove thinking message if no response
      setTimeout(() => {
        if (pendingResponseRef.current) {
          setMessages(prev => prev.filter(msg => msg.id !== pendingResponseRef.current?.id));
          pendingResponseRef.current = null;
          setIsThinking(false);
          setError("No response received. Please try again.");
        }
      }, 30000);
      
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      
      // Cleanup on error
      if (pendingResponseRef.current) {
        setMessages(prev => prev.filter(msg => msg.id !== pendingResponseRef.current?.id));
        pendingResponseRef.current = null;
      }
      setIsThinking(false);
    }
  };

  const handleMessagePlayed = () => {
    setCurrentMessage(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 3D Model Loading Overlay
  const { active, progress } = useProgress();

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Users, label: "Community" },
    { icon: Cpu, label: "Models" },
    { icon: Zap, label: "Features" },
    { icon: Settings, label: "Settings" }
  ];

  const mobileMenuItems = ["Dashboard", "Community", "Models", "Features", "Settings"];

  return (
    <div
      style={{ height: "100dvh", width: "100%", position: "relative" }}
      onPointerDownCapture={() => {
        unlockOnce();
      }}
      onTouchStartCapture={() => {
        unlockOnce();
      }}
    >
      {/* 3D Model Loading Overlay */}
      <ModelLoadingOverlay active={active} progress={progress} />

      {/* 3D Experience - Full Screen Background */}
      <Tanaki3DExperience
        message={currentMessage}
        onMessagePlayed={handleMessagePlayed}
        chat={() => console.log("Chat triggered")}
      />
      
      {/* 🔊 Audio Component */}
      <TanakiAudio
        ref={audioRef}
        enabled={!isMuted}
        onVolumeChange={(volume) => {
          setBlend((prev) => prev * 0.5 + volume * 0.5);
        }}
      />

      {/* UI Overlay */}
      <div
        className="fixed top-0 left-0 w-full h-full z-10 flex flex-col justify-between p-6"
        style={{ pointerEvents: "none" as const }}
      >
        <div>
          <nav
            className="flex flex-row md:flex-row gap-4 px-5 py-3 items-center justify-between md:items-start pointer-events-auto rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-gray-900/10 to-cyan-900/10 shadow-2xl"
            style={{ pointerEvents: "auto" as const }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <a
                  href="/"
                  className="text-cyan-300 font-bold text-xl hover:text-cyan-100 transition-all duration-300 hover:drop-shadow-glow"
                  style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.1em" }}
                >
                  MEILIN.AI
                </a>
              </div>
              
              <div className="hidden md:flex items-center gap-1 ml-6">
                {menuItems.map((item, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex items-center gap-2 text-cyan-200/80 hover:text-cyan-100 px-4 py-2 rounded-xl hover:bg-cyan-500/10 transition-all duration-300 border border-transparent hover:border-cyan-500/30 group"
                  >
                    <item.icon size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
               
               
              </div>

              {/* Social Links */}
              <div className="hidden md:flex items-center gap-3">
                <a
                  href="#"
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all duration-300 text-sm font-medium"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  TWITTER
                </a>
                <a
                  href="#"
                  className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-100 transition-all duration-300 text-sm font-medium"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  GITHUB
                </a>
              </div>

              <div className="md:hidden relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                >
                  <Menu size={20} />
                </button>

                <div
                  className={`absolute ${isMenuOpen ? "flex opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"} 
                    flex-col bg-gray-900/10 border border-cyan-500/20 p-4 rounded-2xl right-0 top-full w-64 
                    transition-all duration-300 shadow-2xl z-20`}
                >
                  {mobileMenuItems.map((item) => (
                    <a
                      key={item}
                      href="#"
                      className="text-cyan-200 hover:text-cyan-100 p-3 rounded-lg hover:bg-cyan-500/10 transition-all duration-200 text-center font-medium"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {item}
                    </a>
                  ))}
                  <div className="border-t border-cyan-500/20 pt-3 mt-2">
                    <a
                      href="#"
                      className="text-cyan-200 hover:text-cyan-100 p-3 rounded-lg hover:bg-cyan-500/10 transition-all duration-200 text-center font-medium block"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      TWITTER
                    </a>
                    <a
                      href="#"
                      className="text-purple-200 hover:text-purple-100 p-3 rounded-lg hover:bg-purple-500/10 transition-all duration-200 text-center font-medium block"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      GITHUB
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end', marginTop: '25px', marginRight: "20px" }}>
            <div className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-cyan-300 font-bold text-sm tracking-wider">LIVE CHAT</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
              <div className="w-px h-4 bg-cyan-500/40"></div>
              <span className="text-cyan-200/80 text-xs font-medium">Users Online: {connectedUsers}</span>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div
          ref={overlayRef}
          className="w-full md:w-[480px] h-[55vh] md:h-[75vh] flex flex-col bg-gradient-to-br from-gray-900/10 to-cyan-900/10 p-5 rounded-3xl shadow-2xl border border-cyan-500/20 pointer-events-auto fixed bottom-0 left-0 md:relative md:bottom-auto md:left-auto mobile-chat"
          style={{ pointerEvents: "auto" as const }}
        >
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-300 font-bold text-lg tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                NEURAL_CHAT
              </span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200/70 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif" }}>SYSTEM ACTIVE</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-black/10 border border-cyan-500/10 shadow-inner mt-3">
            {error && (
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-3 text-sm">
                {error}
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="text-center py-8 text-cyan-300/50">
                <div className="text-lg mb-2">Start a conversation with MEILIN</div>
                <div className="text-sm">Ask anything and get AI-powered responses</div>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`mb-4 p-4 rounded-2xl border transition-all duration-300 ${
                    msg.user?.id === USER_ID 
                      ? "bg-cyan-500/10 border-cyan-500/30 ml-8" 
                      : msg.isPending
                      ? "bg-cyan-500/5 border-cyan-500/10 animate-pulse"
                      : "bg-purple-500/10 border-purple-500/30 mr-8"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      msg.user?.id === USER_ID 
                        ? "bg-cyan-400" 
                        : msg.isPending 
                        ? "bg-cyan-400 animate-pulse" 
                        : "bg-purple-400"
                    }`}></div>
                    <strong className={`text-sm font-bold ${
                      msg.user?.id === USER_ID 
                        ? "text-cyan-300" 
                        : msg.isPending 
                        ? "text-cyan-300/60" 
                        : "text-purple-300"
                    }`}>
                      {msg.user?.name || msg.user?.id}
                    </strong>
                    {msg.user?.id === USER_ID && (
                      <div className="flex items-center gap-1 bg-cyan-500/20 px-2 py-1 rounded-full">
                        <span className="text-xs text-cyan-300 font-medium">LIVE</span>
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    {msg.isPending && (
                      <div className="flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-full">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`text-sm leading-relaxed ${
                    msg.user?.id === USER_ID 
                      ? "text-cyan-100" 
                      : msg.isPending 
                      ? "text-cyan-300/60 italic" 
                      : "text-purple-100"
                  }`}>
                    {msg.text}
                  </div>
                  {!msg.isPending && (
                    <div className={`text-xs mt-2 ${
                      msg.user?.id === USER_ID ? "text-cyan-400/60" : "text-purple-400/60"
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="mt-4">
            <ChatInput
              disabled={!connected || isThinking}
              placeholder="Transmit neural message..."
              onUserGesture={unlockOnce}
              isRecording={isRecording}
              onVoiceClick={() => setIsRecording(!isRecording)}
              onSend={handleSendMessage}
            />
          </div>
        </div>

 

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="fixed bottom-6 right-6 z-20 p-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 pointer-events-auto"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        <VisuallyHidden>
          <div aria-live="polite" aria-atomic="true">
            {liveText}
          </div>
        </VisuallyHidden>

        <style jsx>{`
          @media (max-width: 768px) {
            .mobile-chat {
              height: 45vh !important;
              background: linear-gradient(135deg, rgba(20, 20, 30, 0.1) 0%, rgba(10, 30, 40, 0.1) 100%) !important;
              border: 1px solid rgba(34, 211, 238, 0.3) !important;
              margin: 10px;
              border-radius: 20px !important;
            }
          }
          
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(6, 182, 212, 0.1);
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.4);
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.6);
          }
        `}</style>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');
          
          .hover\\:drop-shadow-glow:hover {
            filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.6));
          }
        `}</style>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* 3D Model Loading Overlay */
/* -------------------------------------------------- */

interface ModelLoadingOverlayProps {
  active: boolean;
  progress: number;
}

function ModelLoadingOverlay({ active, progress }: ModelLoadingOverlayProps) {
  if (!active || progress >= 100) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[1000] text-center">
      <Lottie 
        animationData={loadingAnimation} 
        className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px]" 
      />
      <p className="hidden text-xs text-gray-600 max-w-[80%] mt-4 md:block md:hidden">
        For the best experience, we recommend using App on a desktop device.
        Mobile compatibility is currently limited.
      </p>
    </div>
  );
}
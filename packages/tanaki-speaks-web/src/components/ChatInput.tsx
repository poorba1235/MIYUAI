import { Box, Flex } from "@radix-ui/themes";
import { Mic, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export function ChatInput({
  disabled = false,
  placeholder = "Transmit neural message...",
  onUserGesture,
  onSend,
  onVoiceClick,
  isRecording = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSending(true);
    try {
      await onSend(trimmed);
      setText("");
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [onSend, text]);

  return (
    <Flex gap="3" align="center" style={{ width: "100%" }}>
      {/* Voice Recording Button */}
      <button
        onClick={() => {
          onUserGesture?.();
          onVoiceClick?.();
        }}
        className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 ${
          isRecording
            ? "bg-red-500/20 border-red-400/50 text-red-300 animate-pulse shadow-red-500/25"
            : "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 hover:shadow-cyan-500/25"
        } ${disabled || isSending ? "cursor-not-allowed opacity-30" : ""}`}
        disabled={disabled || isSending}
        onPointerDownCapture={() => onUserGesture?.()}
        onTouchStartCapture={() => onUserGesture?.()}
      >
        <Mic size={20} />
      </button>

      {/* Text Input */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full placeholder:text-cyan-200/40 placeholder:italic pl-12 pr-24 py-4 rounded-2xl bg-black/10 border border-cyan-500/20 text-cyan-100 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 shadow-inner disabled:opacity-30 disabled:cursor-not-allowed"
            value={text}
            placeholder={placeholder}
            disabled={disabled || isSending}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => onUserGesture?.()}
            onPointerDownCapture={() => onUserGesture?.()}
            onTouchStartCapture={() => onUserGesture?.()}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (e.shiftKey) return;
              e.preventDefault();
              void send();
            }}
          />
          {/* Search icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="rgba(34, 211, 238, 0.4)" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
          </div>
          {/* Enter hint */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-200/40 italic text-sm">
            ↵ Enter
          </div>
        </div>
      </Box>

      {/* Send Button */}
      <button
        onClick={() => {
          onUserGesture?.();
          void send();
        }}
        disabled={disabled || isSending || text.trim().length === 0}
        className="p-4 rounded-2xl shadow-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-300 hover:text-cyan-100 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-cyan-500/25"
        onPointerDownCapture={() => onUserGesture?.()}
        onTouchStartCapture={() => onUserGesture?.()}
      >
        <Send size={20} />
      </button>
    </Flex>
  );
}
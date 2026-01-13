import { useState, useEffect, useCallback } from 'react';

// Generate unique user ID that persists per session
const generateUserId = () => {
  if (typeof window === 'undefined') return 'user-' + Date.now();
  
  let userId = localStorage.getItem('tanaki-user-id');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('tanaki-user-id', userId);
  }
  return userId;
};

// Generate session-specific chat ID that resets on new session
const generateChatId = () => {
  if (typeof window === 'undefined') return 'chat-' + Date.now();
  
  const sessionChatId = sessionStorage.getItem('tanaki-chat-id');
  if (!sessionChatId) {
    const newChatId = 'chat-' + Date.now();
    sessionStorage.setItem('tanaki-chat-id', newChatId);
    return newChatId;
  }
  return sessionChatId;
};

export function useUserChat() {
  const [userId] = useState(() => generateUserId());
  const [chatId] = useState(() => generateChatId());
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    timestamp: Date;
    isAI: boolean;
    userId: string;
  }>>([]);

  // Load chat history from session storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedChat = sessionStorage.getItem(`tanaki-chat-${userId}`);
    if (savedChat) {
      try {
        const messages = JSON.parse(savedChat);
        setChatMessages(messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }
  }, [userId]);

  // Save chat to session storage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (chatMessages.length > 0) {
      sessionStorage.setItem(
        `tanaki-chat-${userId}`,
        JSON.stringify(chatMessages)
      );
    } else {
      sessionStorage.removeItem(`tanaki-chat-${userId}`);
    }
  }, [chatMessages, userId]);

  const addMessage = useCallback((message: {
    id: string;
    text: string;
    timestamp: Date;
    isAI: boolean;
  }) => {
    const messageWithUser = {
      ...message,
      userId
    };
    
    setChatMessages(prev => [...prev, messageWithUser]);
  }, [userId]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`tanaki-chat-${userId}`);
      // Start a new chat session
      const newChatId = 'chat-' + Date.now();
      sessionStorage.setItem('tanaki-chat-id', newChatId);
      window.location.reload(); // Refresh to get new session
    }
  }, [userId]);

  return {
    userId,
    chatId,
    chatMessages,
    addMessage,
    clearChat,
    setChatMessages
  };
}
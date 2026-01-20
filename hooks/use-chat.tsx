/**
 * Chat context and hook for managing chat state
 */

import type { HistoryEntry, PathState } from '@/lib/api/chat';
import * as chatApi from '@/lib/api/chat';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export interface AnalysisResult {
  analysisId: string;
  newChatId: string;
}

interface ChatContextType {
  chatId: string | null;
  history: HistoryEntry[];
  activePath: string;
  pathState: PathState | null;
  isLoading: boolean;
  isSending: boolean;
  isAnalyzing: boolean;
  error: string | null;
  initializeChat: (locale: string, initialPath?: string) => Promise<void>;
  reopenChat: (chatId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  finishChat: (locale: string) => Promise<AnalysisResult>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activePath, setActivePath] = useState<string>('idle');
  const [pathState, setPathState] = useState<PathState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeChat = useCallback(async (locale: string, initialPath?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // First, try to get the latest active chat
      const latestChat = await chatApi.getLatestChat();

      if (latestChat && latestChat.chatId) {
        // Load existing chat
        setChatId(latestChat.chatId);
        setHistory(latestChat.history || []);
        setActivePath(latestChat.activePath || 'idle');
        setPathState(latestChat.pathState);
        console.log('Loaded existing chat:', latestChat.chatId);
      } else {
        // No active chat found, create a new one
        console.log('No existing chat found, creating new chat...');
        const result = await chatApi.initChat({ locale, initialPath });
        setChatId(result.chatId);
        setHistory(result.history || []);
        setActivePath(result.activePath || 'idle');
        setPathState(result.pathState);
        console.log('Created new chat:', result.chatId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize chat';
      setError(errorMessage);
      console.error('Failed to initialize chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reopenChat = useCallback(async (chatIdToReopen: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the chat history for the old analyzed chat
      const oldChatData = await chatApi.getChatHistory(chatIdToReopen);
      
      // Create a new chat with a new ID
      const newChatResult = await chatApi.initChat({ locale: 'de', initialPath: 'idle' });
      
      // Update the new chat in the backend with the old chat's history
      // This ensures the history is persisted and will be loaded correctly
      await chatApi.updateChatHistory(
        newChatResult.chatId,
        oldChatData.history || [],
        oldChatData.pathState
      );
      
      // Set the new chat with the old chat's history
      // This allows the user to continue from where they left off, but in a new chat
      setChatId(newChatResult.chatId);
      setHistory(oldChatData.history || []);
      setPathState(oldChatData.pathState);
      setActivePath(oldChatData.pathState?.activePath || newChatResult.activePath || 'idle');
      
      console.log('Reopened chat in new chat:', newChatResult.chatId, 'from old chat:', chatIdToReopen);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reopen chat';
      setError(errorMessage);
      console.error('Failed to reopen chat:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!chatId) {
      setError('No active chat');
      return;
    }

    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Optimistically add user message to UI
      const userMessage: HistoryEntry = {
        role: 'user',
        parts: [{ text: message }],
        timestamp: Date.now(),
      };

      setHistory(prev => [...prev, userMessage]);

      // Send to backend
      const result = await chatApi.sendMessage({
        chatId,
        message,
        history: history, // Don't include the optimistic user message
      });

      // Update with full history from backend (includes AI response)
      setHistory(result.history);

      console.log('Message sent, AI responded');

      // Extract memories after each message - the AI (via system instruction) decides what to store
      // This works for both direct memory requests and implicit memory-worthy content
      // 
      // CRITICAL BUG: The backend system instruction incorrectly switches to the "memory" path
      // when the user asks to STORE a memory. This is WRONG behavior.
      // 
      // CORRECT behavior should be:
      // - Storing memories: "remember X" / "merke dir X" → 
      //   * DO NOT switch to memory path
      //   * DO NOT recall/show existing memories
      //   * Just acknowledge and extract/store the new memory silently
      //   * Stay in current conversation path
      // 
      // - Recalling memories: "what do you remember" / "was erinnerst du dich" / "zeig mir Erinnerungen" → 
      //   * DO switch to memory path
      //   * Show/recall existing memories
      // 
      // The backend system instruction must be updated to fix this path switching logic.
      chatApi.extractMemories().catch(err => {
        console.error('Failed to extract memories:', err);
        // Don't fail the whole operation if memory extraction fails
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Failed to send message:', err);

      // Remove optimistic message on error
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }, [chatId, history]);

  const finishChat = useCallback(async (locale: string): Promise<AnalysisResult> => {
    if (!chatId) {
      throw new Error('No active chat to finish');
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Step 1: Analyze the chat
      console.log('Analyzing chat:', chatId);
      const analysisResult = await chatApi.analyzeChat(chatId, locale);

      console.log('Analysis result:', analysisResult);

      // Validate the response structure
      if (!analysisResult || !analysisResult.analysis) {
        throw new Error('Invalid analysis response from server');
      }

      // Step 2: Extract memories (runs in parallel but we don't wait for it)
      chatApi.extractMemories().catch(err => {
        console.error('Failed to extract memories:', err);
        // Don't fail the whole operation if memory extraction fails
      });

      // Step 3: Update streak (after successful analysis)
      // Import the streak update function
      const { updateStreak } = await import('@/lib/api/streak');
      updateStreak().catch(err => {
        console.error('Failed to update streak:', err);
        // Don't fail the whole operation if streak update fails
      });

      // Step 4: Update to the new chat (if provided)
      if (analysisResult.initiatedChat && analysisResult.initiatedChat.chatId) {
        setChatId(analysisResult.initiatedChat.chatId);
        setHistory(analysisResult.initiatedChat.history || []);
        setActivePath('idle');
        console.log('Chat finished successfully, new chat:', analysisResult.initiatedChat.chatId);
      } else {
        // If no new chat was created, initialize a new one
        console.log('No new chat in response, initializing new chat');
        await initializeChat(locale, 'idle');
      }

      return {
        analysisId: analysisResult.analysis.id,
        newChatId: analysisResult.initiatedChat?.chatId || chatId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to finish chat';
      setError(errorMessage);
      console.error('Failed to finish chat:', err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [chatId, initializeChat]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chatId,
        history,
        activePath,
        pathState,
        isLoading,
        isSending,
        isAnalyzing,
        error,
        initializeChat,
        reopenChat,
        sendMessage,
        finishChat,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

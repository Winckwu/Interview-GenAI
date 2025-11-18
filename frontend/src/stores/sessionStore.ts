import { create } from 'zustand';
import api from '../services/api';

export interface SessionItem {
  id: string;
  taskDescription: string;
  taskType: string;
  createdAt: string;
  startedAt: string;
  endedAt?: string;
}

export interface Interaction {
  id: string;
  sessionId: string;
  userPrompt: string;
  aiResponse: string;
  aiModel?: string;
  responseTime?: number;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
  confidenceScore?: number;
  createdAt: string;
}

export interface SessionState {
  // State
  sessions: SessionItem[];
  sessionsLoading: boolean;
  error: string | null;

  // Actions
  loadSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addInteraction: (sessionId: string, interaction: Interaction) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<SessionItem>) => Promise<void>;
  clearError: () => void;
  refreshSessions: () => Promise<void>;
}

/**
 * Global session store using Zustand
 * Manages recent sessions and interactions across the app
 */
export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  sessionsLoading: false,
  error: null,

  /**
   * Load recent sessions from API
   * Filters to only show sessions with valid interactions
   */
  loadSessions: async () => {
    set({ sessionsLoading: true, error: null });
    try {
      const response = await api.get('/sessions', { params: { limit: 50, offset: 0 } });
      if (response.data.data && response.data.data.sessions) {
        // Remove duplicate sessions by ID
        const uniqueSessions = Array.from(
          new Map(response.data.data.sessions.map((session: SessionItem) => [session.id, session])).values()
        ) as SessionItem[];

        // Filter sessions that have valid interactions (with actual content)
        const sessionsWithContent = await Promise.all(
          uniqueSessions.map(async (session) => {
            try {
              const interactionsResponse = await api.get('/interactions', {
                params: { sessionId: session.id },
              });
              const interactions = interactionsResponse.data.data.interactions || [];
              // Check if session has at least one valid interaction with both user prompt and AI response
              const validInteractions = interactions.filter(
                (interaction: any) =>
                  interaction.userPrompt && interaction.aiResponse && interaction.sessionId === session.id
              );

              if (validInteractions.length > 0) {
                // Use the first user prompt as the session title (truncate to 50 chars)
                const firstPrompt = validInteractions[0].userPrompt;
                const title = firstPrompt.length > 50 ? firstPrompt.substring(0, 50) + '...' : firstPrompt;
                return {
                  ...session,
                  taskDescription: title,
                };
              }
              return null;
            } catch (err) {
              console.error(`Failed to load interactions for session ${session.id}:`, err);
              return null;
            }
          })
        );

        // Filter out null values and limit to 10
        const filteredSessions = sessionsWithContent.filter((s) => s !== null).slice(0, 10) as SessionItem[];
        // Sort by date descending (newest first)
        filteredSessions.sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime());
        set({ sessions: filteredSessions });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load sessions';
      set({ error: errorMsg });
      console.error('Failed to load sessions:', err);
    } finally {
      set({ sessionsLoading: false });
    }
  },

  /**
   * Delete a session
   */
  deleteSession: async (sessionId: string) => {
    set({ error: null });
    try {
      await api.delete(`/sessions/${sessionId}`);
      // Remove from sessions list
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete session';
      set({ error: errorMsg });
      throw err;
    }
  },

  /**
   * Add a new interaction to a session
   * This updates the session title if it's the first interaction
   */
  addInteraction: async (sessionId: string, interaction: Interaction) => {
    set({ error: null });
    try {
      // Update the session in the list
      set((state) => {
        const updatedSessions = state.sessions.map((session) => {
          if (session.id === sessionId) {
            // If this is the first interaction, update the title
            return {
              ...session,
              taskDescription: interaction.userPrompt.length > 50
                ? interaction.userPrompt.substring(0, 50) + '...'
                : interaction.userPrompt,
            };
          }
          return session;
        });

        // If the session is not in the list yet, add it
        if (!updatedSessions.find((s) => s.id === sessionId)) {
          const newSession: SessionItem = {
            id: sessionId,
            taskDescription: interaction.userPrompt.length > 50
              ? interaction.userPrompt.substring(0, 50) + '...'
              : interaction.userPrompt,
            taskType: 'general',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
          };
          updatedSessions.unshift(newSession);
        }

        // Keep only the 10 most recent sessions
        return { sessions: updatedSessions.slice(0, 10) };
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to add interaction';
      set({ error: errorMsg });
      throw err;
    }
  },

  /**
   * Update session metadata
   */
  updateSession: async (sessionId: string, updates: Partial<SessionItem>) => {
    set({ error: null });
    try {
      await api.patch(`/sessions/${sessionId}`, updates);
      // Update in local state
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId ? { ...session, ...updates } : session
        ),
      }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update session';
      set({ error: errorMsg });
      throw err;
    }
  },

  /**
   * Refresh sessions from API
   */
  refreshSessions: async () => {
    await get().loadSessions();
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));

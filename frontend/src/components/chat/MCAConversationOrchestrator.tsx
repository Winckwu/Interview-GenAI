import React, { useEffect, useState } from 'react';
import api from '../../services/api';

/**
 * MCA Conversation Orchestrator
 *
 * Three-Layer Real-Time Adaptive MR System:
 * Layer 1: Behavior Signal Detection (12-dimensional)
 * Layer 2: Realtime Pattern Recognition (Bayesian updating)
 * Layer 3: Adaptive MR Activation (Context-aware interventions)
 */

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
}

export interface BehavioralSignals {
  taskDecompositionEvidence: number;
  goalClarityScore: number;
  strategyMentioned: boolean;
  preparationActions: string[];
  verificationAttempted: boolean;
  qualityCheckMentioned: boolean;
  contextAwarenessIndicator: number;
  outputEvaluationPresent: boolean;
  reflectionDepth: number;
  capabilityJudgmentShown: boolean;
  iterationCount: number;
  trustCalibrationEvidence: string[];
  taskComplexity: number;
  aiRelianceDegree: number;
}

export interface PatternEstimate {
  topPattern: string;
  probability: number;
  confidence: number;
  probabilities: Record<string, number>;
  needMoreData: boolean;
  evidence: string[];
}

export interface ActiveMR {
  mrId: string;
  name: string;
  urgency: 'observe' | 'remind' | 'enforce';
  displayMode: 'inline' | 'sidebar' | 'modal';
  message: string;
  priority: number;
}

export interface OrchestratorResult {
  signals: BehavioralSignals | null;
  pattern: PatternEstimate | null;
  activeMRs: ActiveMR[];
  turnCount: number;
  isHighRiskF: boolean;
}

interface MCAConversationOrchestratorProps {
  sessionId: string;
  messages: Message[];
  onMRUpdate?: (result: OrchestratorResult) => void;
  enabled?: boolean;
}

/**
 * React component for real-time MR orchestration
 * Manages the three-layer system for adaptive interventions
 */
const MCAConversationOrchestrator: React.FC<MCAConversationOrchestratorProps> = ({
  sessionId,
  messages,
  onMRUpdate,
  enabled = true,
}) => {
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process conversation and get MRs
   * Called whenever messages change
   */
  useEffect(() => {
    if (!enabled || !sessionId || messages.length === 0) {
      return;
    }

    const processConversation = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert messages to conversation turns for backend processing
        const conversationTurns = messages.map((msg, index) => ({
          id: msg.id,
          userMessage: msg.role === 'user' ? msg.content : '',
          aiResponse: msg.role === 'ai' ? msg.content : undefined,
          timestamp: new Date(msg.timestamp),
          sessionId,
        }));

        // Call orchestration endpoint
        const orchestrateResponse = await api.post('/mca/orchestrate', {
          sessionId,
          conversationTurns,
          currentTurnIndex: messages.length - 1,
        });

        const orchestrationResult: OrchestratorResult = {
          signals: orchestrateResponse.data.data.signals || null,
          pattern: orchestrateResponse.data.data.pattern || null,
          activeMRs: orchestrateResponse.data.data.activeMRs || [],
          turnCount: orchestrateResponse.data.data.turnCount || messages.filter(m => m.role === 'user').length,
          isHighRiskF: orchestrateResponse.data.data.isHighRiskF || false,
        };

        setResult(orchestrationResult);

        // Notify parent component
        if (onMRUpdate) {
          onMRUpdate(orchestrationResult);
        }
      } catch (err: any) {
        console.error('Orchestration error:', err);
        setError(err.response?.data?.error || 'Failed to orchestrate MRs');
        // Don't fail silently, but continue with empty MRs
        setResult({
          signals: null,
          pattern: null,
          activeMRs: [],
          turnCount: messages.filter(m => m.role === 'user').length,
          isHighRiskF: false,
        });
      } finally {
        setLoading(false);
      }
    };

    // Debounce to avoid too frequent calls
    const timeoutId = setTimeout(processConversation, 300);
    return () => clearTimeout(timeoutId);
  }, [sessionId, messages, enabled, onMRUpdate]);

  // Return null for non-rendering orchestrator
  // MRs will be passed via onMRUpdate callback
  return null;
};

/**
 * Hook for using MCA orchestration in components
 */
export const useMCAOrchestrator = (
  sessionId: string,
  messages: Message[],
  enabled: boolean = true
) => {
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !sessionId || messages.length === 0) {
      return;
    }

    const processConversation = async () => {
      setLoading(true);

      try {
        const conversationTurns = messages.map((msg) => ({
          id: msg.id,
          userMessage: msg.role === 'user' ? msg.content : '',
          aiResponse: msg.role === 'ai' ? msg.content : undefined,
          timestamp: new Date(msg.timestamp),
          sessionId,
        }));

        const orchestrateResponse = await api.post('/mca/orchestrate', {
          sessionId,
          conversationTurns,
          currentTurnIndex: messages.length - 1,
        });

        setResult({
          signals: orchestrateResponse.data.data.signals || null,
          pattern: orchestrateResponse.data.data.pattern || null,
          activeMRs: orchestrateResponse.data.data.activeMRs || [],
          turnCount: orchestrateResponse.data.data.turnCount || messages.filter(m => m.role === 'user').length,
          isHighRiskF: orchestrateResponse.data.data.isHighRiskF || false,
        });
      } catch (err) {
        console.error('Orchestration error:', err);
        setResult({
          signals: null,
          pattern: null,
          activeMRs: [],
          turnCount: messages.filter(m => m.role === 'user').length,
          isHighRiskF: false,
        });
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(processConversation, 300);
    return () => clearTimeout(timeoutId);
  }, [sessionId, messages, enabled]);

  return {
    result,
    loading,
    activeMRs: result?.activeMRs || [],
    pattern: result?.pattern || null,
    isHighRiskF: result?.isHighRiskF || false,
  };
};

/**
 * MR Display Component
 * Renders MR based on display mode and urgency
 */
interface MRDisplayProps {
  mr: ActiveMR;
  onClose?: () => void;
  onAcknowledge?: () => void;
}

export const MRDisplay: React.FC<MRDisplayProps> = ({
  mr,
  onClose,
  onAcknowledge,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'observe':
        return { bg: '#f0f9ff', border: '#93c5fd', text: '#1e40af' };
      case 'remind':
        return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' };
      case 'enforce':
        return { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
    }
  };

  const colors = getUrgencyColor(mr.urgency);

  if (mr.displayMode === 'inline') {
    // Inline display - subtle notification within conversation
    return (
      <div style={{
        margin: '1rem 0',
        padding: '1rem',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '0.5rem',
        color: colors.text,
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {mr.urgency === 'observe' && '💡'}
          {mr.urgency === 'remind' && '⚠️'}
          {mr.urgency === 'enforce' && '🛑'}
          {mr.name}
        </div>
        <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{mr.message}</p>
      </div>
    );
  } else if (mr.displayMode === 'sidebar') {
    // Sidebar display - visible but not blocking
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '0.5rem',
        color: colors.text,
        fontSize: '0.875rem',
        marginBottom: '1rem',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {mr.urgency === 'observe' && '💡'}
            {mr.urgency === 'remind' && '⚠️'}
            {mr.urgency === 'enforce' && '🛑'}
            {mr.name}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0',
              }}
            >
              ✕
            </button>
          )}
        </div>
        <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{mr.message}</p>
      </div>
    );
  } else if (mr.displayMode === 'modal') {
    // Modal display - blocking, requires attention
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '500px',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          border: `3px solid ${colors.border}`,
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.125rem',
            fontWeight: '700',
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {mr.urgency === 'observe' && '💡'}
            {mr.urgency === 'remind' && '⚠️'}
            {mr.urgency === 'enforce' && '🛑'}
            {mr.name}
          </h3>

          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap',
          }}>
            {mr.message}
          </p>

          {mr.urgency === 'enforce' && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#991b1b',
            }}>
              <strong>⚠️ Critical Notice:</strong> This requires your immediate attention for your learning and skill development.
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                }}
              >
                Dismiss
              </button>
            )}
            <button
              onClick={() => {
                setAcknowledged(true);
                if (onAcknowledge) onAcknowledge();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: colors.text,
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              {acknowledged ? '✓ Understood' : 'I Understand'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MCAConversationOrchestrator;

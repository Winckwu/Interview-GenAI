/**
 * MR5: Low-Cost Iteration Mechanism - React Component
 *
 * Enables efficient iteration through:
 * - Branching conversations from any point in history
 * - Batch variant generation with different parameters
 * - Version comparison and rating
 * - Learning user preferences over time
 *
 * Design Rationale (from 49 interviews, 33% of users):
 * - I002: "3-4 times before it really works" - iteration is normal workflow
 * - I016: "keep feeding it this question" - frequent micro-adjustments
 * - Current linear chat limits experimentation and increases cognitive load
 * - Users need low-cost, low-friction way to explore multiple directions
 *
 * This addresses the biggest UX pain point: iteration should feel effortless
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ConversationBranch,
  IterationVariant,
  VariantComparison,
  generateVariants,
  rateVariant,
  getBranchTree,
  compareBranches,
  getPromissingBranches,
  ParentReference,
} from './utils';
import { apiService } from '../../../services/api';
import './styles.css';

// Message type for branch conversations
interface BranchMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

/**
 * Clean AI response: remove <thinking> blocks and format for display
 */
function cleanAIResponse(content: string): string {
  // Remove <thinking>...</thinking> blocks (including nested content)
  let cleaned = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

  // Remove any remaining thinking tags
  cleaned = cleaned.replace(/<\/?thinking>/gi, '');

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Simple markdown to React elements for MR5 display
 */
function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let inList = false;

  const processInlineMarkdown = (line: string): React.ReactNode => {
    // Bold: **text** or __text__
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      if (boldMatch) {
        const index = boldMatch.index!;
        if (index > 0) {
          parts.push(remaining.substring(0, index));
        }
        parts.push(
          <strong key={key++}>{boldMatch[1] || boldMatch[2]}</strong>
        );
        remaining = remaining.substring(index + boldMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: '0.25rem' }}>{processInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<br key={elements.length} />);
      continue;
    }

    // Numbered list: 1. item or 1) item
    const numberedMatch = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
    if (numberedMatch) {
      if (!inList) inList = true;
      listItems.push(numberedMatch[1]);
      continue;
    }

    // Bullet list: - item, * item, • item
    const bulletMatch = trimmed.match(/^[-\*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) inList = true;
      listItems.push(bulletMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={elements.length} style={{ margin: '0.5rem 0' }}>
        {processInlineMarkdown(trimmed)}
      </p>
    );
  }

  flushList();
  return elements;
}

/**
 * Props for MR5 component
 */
interface MR5Props {
  sessionId?: string;
  initialPrompt?: string;
  conversationHistory?: Array<{ role: 'user' | 'ai'; content: string; timestamp: Date }>;
  onBranchCreated?: (branch: ConversationBranch) => void;
  onVariantsGenerated?: (variants: IterationVariant[]) => void;
  onComparisonMade?: (comparison: VariantComparison) => void;
  onOpenMR6?: () => void;
  onVariantSelected?: (variantContent: string) => void; // NEW: Callback when user selects a variant to use
  allowBranching?: boolean;
  maxBranches?: number;
}

/**
 * MR5 Component: Low-Cost Iteration Mechanism
 *
 * Transforms iteration from a tedious process into an efficient exploration mechanism
 */
export const MR5LowCostIteration: React.FC<MR5Props> = ({
  sessionId,
  initialPrompt = '',
  conversationHistory = [],
  onBranchCreated,
  onVariantsGenerated,
  onComparisonMade,
  onOpenMR6,
  onVariantSelected,
  allowBranching = true,
  maxBranches = 10,
}) => {
  // State for conversation branches
  const [branches, setBranches] = useState<ConversationBranch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

  // State for iteration
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [variants, setVariants] = useState<IterationVariant[]>([]);
  const [variantRatings, setVariantRatings] = useState<Map<string, 'good' | 'okay' | 'poor'>>(new Map());

  // UI state
  const [activeView, setActiveView] = useState<'history' | 'branches' | 'variants' | 'comparison'>('history');
  const [showBranchingUI, setShowBranchingUI] = useState(false);
  const [selectedComparisonVariants, setSelectedComparisonVariants] = useState<string[]>([]);
  const [temperatureRange, setTemperatureRange] = useState({ min: 0.3, max: 0.9 });
  const [variantCount, setVariantCount] = useState(3);

  // Branch conversation state
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchInput, setBranchInput] = useState('');
  const [branchStreamingContent, setBranchStreamingContent] = useState('');
  const branchAbortRef = useRef<(() => void) | null>(null);

  /**
   * Load branches from database on mount
   */
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await apiService.mrHistory.mr5.listBranches({
          sessionId: sessionId || undefined,
          limit: 50,
        });
        const dbBranches = response.data.data.branches || [];
        // Convert DB format to local format
        const loadedBranches: ConversationBranch[] = dbBranches.map((db: any) => ({
          id: db.id,
          name: db.branchName || `Branch`,
          parentRef: {
            branchId: db.parentBranchId || 'main',
            messageIndex: db.parentMessageIndex || 0,
          },
          history: (db.conversationHistory || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'ai' : msg.role,
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          })),
          nextPrompt: db.nextPrompt || '',
          createdAt: new Date(db.createdAt),
          rating: db.rating || 0,
          variantsCount: 0,
        }));
        setBranches(loadedBranches);
        console.log('[MR5] Loaded branches from database:', loadedBranches.length);
      } catch (error) {
        console.error('[MR5] Failed to load branches:', error);
      }
    };
    loadBranches();
  }, [sessionId]);

  /**
   * Save branch to database
   */
  const saveBranchToDB = useCallback(async (branch: ConversationBranch) => {
    try {
      await apiService.mrHistory.mr5.createBranch({
        sessionId: sessionId || undefined,
        branchName: branch.name,
        parentBranchId: branch.parentRef.branchId,
        parentMessageIndex: branch.parentRef.messageIndex,
        conversationHistory: branch.history.map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
        nextPrompt: branch.nextPrompt,
        rating: branch.rating,
      });
      console.log('[MR5] Branch saved to database:', branch.name);
    } catch (error) {
      console.error('[MR5] Failed to save branch:', error);
    }
  }, [sessionId]);

  /**
   * Save variant to database
   */
  const saveVariantToDB = useCallback(async (variant: IterationVariant, rating?: 'good' | 'okay' | 'poor', wasSelected?: boolean) => {
    try {
      await apiService.mrHistory.mr5.createVariant({
        sessionId: sessionId || undefined,
        prompt: initialPrompt,
        content: variant.content,
        temperature: variant.temperature,
        style: variant.style,
        promptTokens: variant.tokenUsage?.promptTokens,
        completionTokens: variant.tokenUsage?.completionTokens,
        totalTokens: variant.tokenUsage?.totalTokens,
        rating: rating,
        wasSelected: wasSelected,
      });
      console.log('[MR5] Variant saved to database');
    } catch (error) {
      console.error('[MR5] Failed to save variant to database:', error);
    }
  }, [sessionId, initialPrompt]);

  // Branch tree visualization
  const branchTree = useMemo(() => getBranchTree(branches), [branches]);

  /**
   * Create a new branch from current point in conversation
   * If a prompt is provided, immediately call GPT API to get a response
   */
  const handleCreateBranch = useCallback(
    async (fromIndex: number, customPrompt?: string) => {
      if (branches.length >= maxBranches) {
        alert(`Maximum branches (${maxBranches}) reached`);
        return;
      }

      // Ensure fromIndex is valid (at least 0)
      const validIndex = Math.max(0, fromIndex);

      const parentRef: ParentReference = {
        branchId: activeBranchId || 'main',
        messageIndex: validIndex,
      };

      // Get base history from conversation
      const baseHistory = conversationHistory.slice(0, validIndex + 1);

      const newBranch: ConversationBranch = {
        id: `branch-${Date.now()}`,
        name: `Branch ${branches.length + 1}`,
        parentRef,
        history: [...baseHistory],
        nextPrompt: customPrompt || '',
        createdAt: new Date(),
        rating: 0,
        variantsCount: 0,
      };

      setBranches(prev => [...prev, newBranch]);
      setActiveBranchId(newBranch.id);
      onBranchCreated?.(newBranch);

      // Close branching UI and switch to branches view
      setShowBranchingUI(false);
      setActiveView('branches');

      // If a prompt is provided, immediately send it to get AI response
      if (customPrompt && customPrompt.trim()) {
        setBranchLoading(true);
        setBranchStreamingContent('');

        // Add user message to branch
        const userMessage: BranchMessage = {
          role: 'user',
          content: customPrompt,
          timestamp: new Date(),
        };

        setBranches(prev => prev.map(b =>
          b.id === newBranch.id
            ? { ...b, history: [...b.history, userMessage] }
            : b
        ));

        try {
          // Build conversation history for API
          const apiHistory = baseHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          }));

          // Call streaming API
          const { stream, abort } = await apiService.ai.chatStream(
            customPrompt,
            apiHistory
          );

          branchAbortRef.current = abort;

          // Read stream - stream is already a ReadableStreamDefaultReader
          const decoder = new TextDecoder();
          let fullContent = '';

          while (true) {
            const { done, value } = await stream.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setBranchStreamingContent(fullContent);
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Add AI response to branch and save to DB
          if (fullContent) {
            const aiMessage: BranchMessage = {
              role: 'ai',
              content: fullContent,
              timestamp: new Date(),
            };

            const updatedBranch = {
              ...newBranch,
              history: [...newBranch.history, userMessage, aiMessage],
            };

            setBranches(prev => prev.map(b =>
              b.id === newBranch.id ? updatedBranch : b
            ));

            // Save branch to database
            await saveBranchToDB(updatedBranch);
          }
        } catch (error) {
          console.error('[MR5] Failed to get AI response for branch:', error);
        } finally {
          setBranchLoading(false);
          setBranchStreamingContent('');
          branchAbortRef.current = null;
        }
      } else {
        // No prompt - still save the branch
        await saveBranchToDB(newBranch);
      }
    },
    [branches, activeBranchId, conversationHistory, maxBranches, onBranchCreated, saveBranchToDB]
  );

  /**
   * Send a message on the active branch
   */
  const handleBranchSend = useCallback(async () => {
    if (!activeBranchId || !branchInput.trim() || branchLoading) return;

    const currentBranch = branches.find(b => b.id === activeBranchId);
    if (!currentBranch) return;

    setBranchLoading(true);
    setBranchStreamingContent('');

    // Add user message
    const userMessage: BranchMessage = {
      role: 'user',
      content: branchInput,
      timestamp: new Date(),
    };

    setBranches(prev => prev.map(b =>
      b.id === activeBranchId
        ? { ...b, history: [...b.history, userMessage] }
        : b
    ));

    const userInput = branchInput;
    setBranchInput('');

    try {
      // Build conversation history for API
      const apiHistory = currentBranch.history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Call streaming API
      const { stream, abort } = await apiService.ai.chatStream(
        userInput,
        apiHistory
      );

      branchAbortRef.current = abort;

      // Read stream - stream is already a ReadableStreamDefaultReader
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await stream.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setBranchStreamingContent(fullContent);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add AI response to branch and save to DB
      if (fullContent) {
        const aiMessage: BranchMessage = {
          role: 'ai',
          content: fullContent,
          timestamp: new Date(),
        };

        const updatedBranch = {
          ...currentBranch,
          history: [...currentBranch.history, userMessage, aiMessage],
        };

        setBranches(prev => prev.map(b =>
          b.id === activeBranchId ? updatedBranch : b
        ));

        // Save updated branch to database
        await saveBranchToDB(updatedBranch);
      }
    } catch (error) {
      console.error('[MR5] Failed to send message on branch:', error);
    } finally {
      setBranchLoading(false);
      setBranchStreamingContent('');
      branchAbortRef.current = null;
    }
  }, [activeBranchId, branchInput, branchLoading, branches, saveBranchToDB]);

  /**
   * Generate multiple variants with different parameters
   */
  const handleGenerateVariants = useCallback(async () => {
    setGeneratingVariants(true);

    try {
      // Convert conversation history to API format
      const apiHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Generate variants using GPT API with conversation context
      const newVariants = await generateVariants({
        prompt: initialPrompt,
        count: variantCount,
        temperatureRange,
        baseVariant: conversationHistory[conversationHistory.length - 1]?.content || '',
        conversationHistory: apiHistory,
      });

      setVariants(newVariants);
      onVariantsGenerated?.(newVariants);

      // Save each variant to database
      for (const variant of newVariants) {
        await saveVariantToDB(variant);
      }

      // Update active branch
      if (activeBranchId) {
        setBranches(prev =>
          prev.map(b =>
            b.id === activeBranchId ? { ...b, variantsCount: newVariants.length } : b
          )
        );
      }
    } catch (error) {
      console.error('[MR5] Failed to generate variants:', error);
    } finally {
      setGeneratingVariants(false);
    }
  }, [initialPrompt, conversationHistory, variantCount, temperatureRange, activeBranchId, onVariantsGenerated, saveVariantToDB]);

  /**
   * Rate a variant
   */
  const handleRateVariant = useCallback(
    (variantId: string, rating: 'good' | 'okay' | 'poor') => {
      setVariantRatings(prev => new Map(prev).set(variantId, rating));
      rateVariant(variantId, rating);
    },
    []
  );

  /**
   * Compare selected variants side-by-side
   */
  const handleCompareVariants = useCallback(() => {
    if (selectedComparisonVariants.length < 2) {
      alert('Select at least 2 variants to compare');
      return;
    }

    const selectedVars = variants.filter(v => selectedComparisonVariants.includes(v.id));
    const comparison = compareBranches(selectedVars);

    onComparisonMade?.(comparison);
    setActiveView('comparison');
  }, [selectedComparisonVariants, variants, onComparisonMade]);

  /**
   * Get promising branches based on ratings and metrics
   */
  const promisingBranches = useMemo(() => {
    if (branches.length === 0) return [];
    return getPromissingBranches(branches, Array.from(variantRatings.entries()));
  }, [branches, variantRatings]);

  /**
   * Render conversation history view
   */
  const renderHistoryView = () => {
    return (
      <div className="mr5-history-view">
        <h3 className="mr5-section-title">Conversation History</h3>
        {conversationHistory.length === 0 ? (
          <p className="mr5-empty-message">No conversation history yet</p>
        ) : (
          <div className="mr5-history-list">
            {conversationHistory.map((msg, idx) => (
              <div key={idx} className={`mr5-history-item mr5-msg-${msg.role}`}>
                <div className="mr5-msg-header">
                  <span className="mr5-msg-role">{msg.role === 'user' ? '👤 You' : '🤖 AI'}</span>
                  <span className="mr5-msg-time">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="mr5-msg-content">{msg.content}</p>
                {allowBranching && msg.role === 'ai' && (
                  <button
                    className="mr5-branch-btn"
                    onClick={() => {
                      handleCreateBranch(idx);
                      setShowBranchingUI(false);
                    }}
                  >
                    🌿 Branch here
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {allowBranching && (
          <button className="mr5-action-btn mr5-primary" onClick={() => setShowBranchingUI(!showBranchingUI)}>
            {showBranchingUI ? '✕ Cancel' : '🌿 Create Branch'}
          </button>
        )}
      </div>
    );
  };

  /**
   * Render branching interface
   */
  const renderBranchingUI = () => {
    if (!showBranchingUI) return null;

    return (
      <div className="mr5-branching-ui">
        <div className="mr5-branching-card">
          <h4 className="mr5-branching-title">Create New Branch</h4>
          <p className="mr5-branching-subtitle">Start exploring a new direction from any point</p>

          <textarea
            className="mr5-branching-input"
            placeholder="Enter your new prompt or modification..."
            defaultValue={initialPrompt}
          />

          <button
            className="mr5-action-btn mr5-primary"
            onClick={() => {
              const textarea = document.querySelector(
                '.mr5-branching-input'
              ) as HTMLTextAreaElement;
              handleCreateBranch(conversationHistory.length - 1, textarea?.value);
            }}
          >
            Create Branch
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render branches view with full conversation and continuation
   */
  const renderBranchesView = () => {
    const activeBranch = branches.find(b => b.id === activeBranchId);

    return (
      <div className="mr5-branches-view">
        <h3 className="mr5-section-title">Conversation Branches ({branches.length})</h3>

        {branches.length === 0 ? (
          <p className="mr5-empty-message">No branches yet. Create one to start exploring alternatives.</p>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Branch selector */}
            <div style={{ flex: '0 0 200px' }}>
              <div className="mr5-branch-tree">
                <div className="mr5-main-branch">
                  <div
                    className={`mr5-branch-node mr5-main-node ${!activeBranchId ? 'active' : ''}`}
                    onClick={() => setActiveBranchId(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="mr5-branch-icon">📌</span>
                    <span className="mr5-branch-label">Main</span>
                    <span className="mr5-branch-messages">{conversationHistory.length}</span>
                  </div>
                </div>

                <div className="mr5-branch-children">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`mr5-branch-node ${activeBranchId === branch.id ? 'active' : ''}`}
                      onClick={() => setActiveBranchId(branch.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="mr5-branch-icon">🌿</span>
                      <div className="mr5-branch-info">
                        <span className="mr5-branch-label">{branch.name}</span>
                        <span className="mr5-branch-variants" style={{ fontSize: '0.75rem', color: '#666' }}>
                          {branch.history.length} msgs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Branch conversation */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              {activeBranch ? (
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fff',
                }}>
                  {/* Branch header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <strong>🌿 {activeBranch.name}</strong>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                        ({activeBranch.history.length} messages)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Delete this branch?')) {
                          setBranches(prev => prev.filter(b => b.id !== activeBranchId));
                          setActiveBranchId(null);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Conversation messages */}
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '1rem',
                  }}>
                    {activeBranch.history.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: '1rem',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                          borderLeft: msg.role === 'user' ? '3px solid #2196f3' : '3px solid #4caf50',
                        }}
                      >
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          marginBottom: '0.5rem',
                          fontWeight: 500,
                        }}>
                          {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                        }}>
                          {msg.role === 'ai'
                            ? formatMarkdown(cleanAIResponse(msg.content))
                            : <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>
                          }
                        </div>
                      </div>
                    ))}

                    {/* Streaming content */}
                    {branchLoading && branchStreamingContent && (
                      <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: '#f5f5f5',
                        borderLeft: '3px solid #4caf50',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', fontWeight: 500 }}>
                          🤖 AI
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                        }}>
                          {formatMarkdown(cleanAIResponse(branchStreamingContent))}
                          <span className="mr5-cursor">▊</span>
                        </div>
                      </div>
                    )}

                    {branchLoading && !branchStreamingContent && (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                        ⏳ AI is thinking...
                      </div>
                    )}
                  </div>

                  {/* Chat input */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid #e0e0e0',
                    background: '#fafafa',
                    display: 'flex',
                    gap: '0.5rem',
                  }}>
                    <input
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleBranchSend();
                        }
                      }}
                      placeholder="Continue the conversation..."
                      disabled={branchLoading}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                      }}
                    />
                    <button
                      onClick={handleBranchSend}
                      disabled={branchLoading || !branchInput.trim()}
                      style={{
                        padding: '0.5rem 1rem',
                        background: branchLoading || !branchInput.trim() ? '#ccc' : '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: branchLoading || !branchInput.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      {branchLoading ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                }}>
                  <p>👈 Select a branch to view and continue the conversation</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Or create a new branch from the History tab
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render variants view
   */
  const renderVariantsView = () => {
    return (
      <div className="mr5-variants-view">
        <h3 className="mr5-section-title">Generate Variants</h3>

        <div className="mr5-variant-controls">
          <div className="mr5-control-group">
            <label className="mr5-control-label">Number of Variants</label>
            <input
              type="range"
              min="2"
              max="10"
              value={variantCount}
              onChange={e => setVariantCount(parseInt(e.target.value))}
              className="mr5-slider"
            />
            <span className="mr5-control-value">{variantCount}</span>
          </div>

          <div className="mr5-control-group">
            <label className="mr5-control-label">Temperature Range (Creativity)</label>
            <div className="mr5-temp-range">
              <span>Conservative</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperatureRange.min}
                onChange={e =>
                  setTemperatureRange(prev => ({
                    ...prev,
                    min: Math.min(parseFloat(e.target.value), prev.max),
                  }))
                }
                className="mr5-slider"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperatureRange.max}
                onChange={e =>
                  setTemperatureRange(prev => ({
                    ...prev,
                    max: Math.max(parseFloat(e.target.value), prev.min),
                  }))
                }
                className="mr5-slider"
              />
              <span>Creative</span>
            </div>
            <div className="mr5-temp-display">
              {temperatureRange.min.toFixed(1)} - {temperatureRange.max.toFixed(1)}
            </div>
          </div>

          <button
            className="mr5-action-btn mr5-primary"
            onClick={handleGenerateVariants}
            disabled={generatingVariants}
          >
            {generatingVariants ? '⏳ Generating...' : '✨ Generate Variants'}
          </button>
        </div>

        {variants.length > 0 && (
          <div className="mr5-variants-list">
            <h4 className="mr5-variants-title">Generated Variants ({variants.length})</h4>

            <div className="mr5-variants-grid">
              {variants.map((variant: any, idx) => (
                <div
                  key={variant.id}
                  className={`mr5-variant-card ${selectedComparisonVariants.includes(variant.id) ? 'selected' : ''}`}
                >
                  <div className="mr5-variant-header">
                    <span className="mr5-variant-label">Variant {idx + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {variant.style && (
                        <span
                          className="mr5-variant-style"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                            borderRadius: '0.25rem',
                            fontWeight: '500',
                          }}
                        >
                          {variant.style}
                        </span>
                      )}
                      <span className="mr5-variant-temp">T: {variant.temperature.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="mr5-variant-content">{variant.content.substring(0, 150)}...</p>

                  {variant.tokenUsage && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.5rem',
                        display: 'flex',
                        gap: '1rem',
                      }}
                    >
                      <span>📊 {variant.tokenUsage.totalTokens} tokens</span>
                      <span>💰 ~${((variant.tokenUsage.totalTokens / 1000) * 0.00015).toFixed(4)}</span>
                    </div>
                  )}

                  <div className="mr5-variant-rating">
                    <button
                      className={`mr5-rating-btn mr5-good ${variantRatings.get(variant.id) === 'good' ? 'selected' : ''}`}
                      onClick={() => handleRateVariant(variant.id, 'good')}
                    >
                      👍 Good
                    </button>
                    <button
                      className={`mr5-rating-btn mr5-okay ${variantRatings.get(variant.id) === 'okay' ? 'selected' : ''}`}
                      onClick={() => handleRateVariant(variant.id, 'okay')}
                    >
                      👌 Okay
                    </button>
                    <button
                      className={`mr5-rating-btn mr5-poor ${variantRatings.get(variant.id) === 'poor' ? 'selected' : ''}`}
                      onClick={() => handleRateVariant(variant.id, 'poor')}
                    >
                      👎 Poor
                    </button>
                  </div>

                  {/* Use this variant button */}
                  {onVariantSelected && (
                    <button
                      className="mr5-action-btn mr5-use-variant"
                      onClick={() => onVariantSelected(variant.content)}
                      style={{
                        marginTop: '0.5rem',
                        width: '100%',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: '500',
                      }}
                    >
                      ✓ Use This Variant
                    </button>
                  )}

                  <label className="mr5-compare-label">
                    <input
                      type="checkbox"
                      checked={selectedComparisonVariants.includes(variant.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedComparisonVariants(prev => [...prev, variant.id]);
                        } else {
                          setSelectedComparisonVariants(prev => prev.filter(id => id !== variant.id));
                        }
                      }}
                    />
                    Compare
                  </label>
                </div>
              ))}
            </div>

            {selectedComparisonVariants.length >= 2 && (
              <button className="mr5-action-btn mr5-primary" onClick={handleCompareVariants}>
                📊 Compare {selectedComparisonVariants.length} Variants
              </button>
            )}

            {/* MR Integration: Recommend cross-model comparison after generating variants */}
            {onOpenMR6 && variants.length >= 2 && (
              <div style={{
                backgroundColor: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '1.5rem 0 0 0',
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
                  🔄 Next Step: Compare Across AI Models
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                  You've generated {variants.length} variants! Now try getting the same prompt from different AI models (GPT-4, Claude, Gemini). Each model has unique strengths - comparing them helps you find the best solution.
                </p>
                <button
                  onClick={onOpenMR6}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  title="Open Multi-Model Comparison - Compare outputs from GPT-4, Claude, and Gemini"
                >
                  🔄 Compare AI Models (MR6)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render comparison view
   */
  const renderComparisonView = () => {
    if (selectedComparisonVariants.length === 0) {
      return <p className="mr5-empty-message">Select variants to compare</p>;
    }

    const variantsToCompare = variants.filter(v => selectedComparisonVariants.includes(v.id));

    return (
      <div className="mr5-comparison-view">
        <h3 className="mr5-section-title">Variant Comparison</h3>

        <div className="mr5-comparison-grid">
          {variantsToCompare.map((variant, idx) => (
            <div key={variant.id} className="mr5-comparison-column">
              <div className="mr5-comparison-header">
                <h4 className="mr5-comparison-title">Variant {idx + 1}</h4>
                <div className="mr5-comparison-meta">
                  <span>T: {variant.temperature.toFixed(1)}</span>
                  <span>
                    {variantRatings.get(variant.id) === 'good' && '👍 Good'}
                    {variantRatings.get(variant.id) === 'okay' && '👌 Okay'}
                    {variantRatings.get(variant.id) === 'poor' && '👎 Poor'}
                  </span>
                </div>
              </div>
              <div className="mr5-comparison-content">
                <p>{variant.content}</p>
              </div>
              <div className="mr5-comparison-metrics">
                <span className="mr5-metric">Length: {variant.content.length} chars</span>
                <span className="mr5-metric">Tokens: ~{Math.round(variant.content.length / 4)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* MR Integration: Recommend cross-model comparison in comparison view */}
        {onOpenMR6 && variantsToCompare.length >= 2 && (
          <div style={{
            backgroundColor: '#dbeafe',
            border: '2px solid #3b82f6',
            borderRadius: '0.5rem',
            padding: '1rem',
            margin: '1.5rem 0',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
              💡 Want More Perspectives?
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
              You're comparing variants from temperature variations. Try comparing outputs from completely different AI models (GPT-4, Claude, Gemini) to get diverse perspectives and approaches to your problem.
            </p>
            <button
              onClick={onOpenMR6}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
              }}
              title="Open Multi-Model Comparison - Get diverse perspectives from different AI models"
            >
              🔄 Compare AI Models (MR6)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mr5-container">
      <div className="mr5-header">
        <h1 className="mr5-title">Low-Cost Iteration Mechanism</h1>
        <p className="mr5-subtitle">
          Explore multiple directions, compare versions, and iterate efficiently without friction
        </p>
      </div>

      <div className="mr5-tabs">
        <button
          className={`mr5-tab ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          📝 History
        </button>
        {allowBranching && (
          <button
            className={`mr5-tab ${activeView === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveView('branches')}
          >
            🌿 Branches ({branches.length})
          </button>
        )}
        <button
          className={`mr5-tab ${activeView === 'variants' ? 'active' : ''}`}
          onClick={() => setActiveView('variants')}
        >
          ✨ Variants ({variants.length})
        </button>
        <button
          className={`mr5-tab ${activeView === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveView('comparison')}
          disabled={selectedComparisonVariants.length === 0}
        >
          📊 Compare
        </button>
      </div>

      <div className="mr5-content">
        {activeView === 'history' && renderHistoryView()}
        {showBranchingUI && renderBranchingUI()}
        {activeView === 'branches' && renderBranchesView()}
        {activeView === 'variants' && renderVariantsView()}
        {activeView === 'comparison' && renderComparisonView()}
      </div>

      <div className="mr5-tips">
        <p className="mr5-tip-title">💡 Tips for efficient iteration:</p>
        <ul className="mr5-tip-list">
          <li>Create branches to explore different directions without losing original work</li>
          <li>Generate multiple variants to quickly find your preferred style</li>
          <li>Rate variants so the system learns your preferences</li>
          <li>Compare variants side-by-side to identify differences clearly</li>
        </ul>
      </div>
    </div>
  );
};

export default MR5LowCostIteration;

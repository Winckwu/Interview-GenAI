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

import React, { useState, useCallback, useMemo } from 'react';
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
} from './MR5LowCostIteration.utils';
import './MR5LowCostIteration.css';

/**
 * Props for MR5 component
 */
interface MR5Props {
  initialPrompt?: string;
  conversationHistory?: Array<{ role: 'user' | 'ai'; content: string; timestamp: Date }>;
  onBranchCreated?: (branch: ConversationBranch) => void;
  onVariantsGenerated?: (variants: IterationVariant[]) => void;
  onComparisonMade?: (comparison: VariantComparison) => void;
  onOpenMR6?: () => void;
  allowBranching?: boolean;
  maxBranches?: number;
}

/**
 * MR5 Component: Low-Cost Iteration Mechanism
 *
 * Transforms iteration from a tedious process into an efficient exploration mechanism
 */
export const MR5LowCostIteration: React.FC<MR5Props> = ({
  initialPrompt = '',
  conversationHistory = [],
  onBranchCreated,
  onVariantsGenerated,
  onComparisonMade,
  onOpenMR6,
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

  // Branch tree visualization
  const branchTree = useMemo(() => getBranchTree(branches), [branches]);

  /**
   * Create a new branch from current point in conversation
   */
  const handleCreateBranch = useCallback(
    (fromIndex: number, customPrompt?: string) => {
      if (branches.length >= maxBranches) {
        alert(`Maximum branches (${maxBranches}) reached`);
        return;
      }

      const parentRef: ParentReference = {
        branchId: activeBranchId || 'main',
        messageIndex: fromIndex,
      };

      const newBranch: ConversationBranch = {
        id: `branch-${Date.now()}`,
        name: `Branch ${branches.length + 1}`,
        parentRef,
        history: conversationHistory.slice(0, fromIndex + 1),
        nextPrompt: customPrompt || '',
        createdAt: new Date(),
        rating: 0,
        variantsCount: 0,
      };

      setBranches(prev => [...prev, newBranch]);
      setActiveBranchId(newBranch.id);
      onBranchCreated?.(newBranch);
    },
    [branches, activeBranchId, conversationHistory, maxBranches, onBranchCreated]
  );

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
  }, [initialPrompt, conversationHistory, variantCount, temperatureRange, activeBranchId, onVariantsGenerated]);

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
   * Render branches view
   */
  const renderBranchesView = () => {
    return (
      <div className="mr5-branches-view">
        <h3 className="mr5-section-title">Conversation Branches ({branches.length})</h3>

        {branches.length === 0 ? (
          <p className="mr5-empty-message">No branches yet. Create one to start exploring alternatives.</p>
        ) : (
          <>
            <div className="mr5-branch-tree">
              <div className="mr5-main-branch">
                <div className="mr5-branch-node mr5-main-node">
                  <span className="mr5-branch-icon">📌</span>
                  <span className="mr5-branch-label">Main Conversation</span>
                  <span className="mr5-branch-messages">{conversationHistory.length} messages</span>
                </div>
              </div>

              <div className="mr5-branch-children">
                {branches.map((branch, idx) => (
                  <div
                    key={branch.id}
                    className={`mr5-branch-node ${activeBranchId === branch.id ? 'active' : ''}`}
                    onClick={() => setActiveBranchId(branch.id)}
                  >
                    <span className="mr5-branch-icon">🌿</span>
                    <div className="mr5-branch-info">
                      <span className="mr5-branch-label">{branch.name}</span>
                      <span className="mr5-branch-variants">
                        {branch.variantsCount > 0 && `${branch.variantsCount} variants`}
                      </span>
                    </div>
                    <span className={`mr5-branch-rating mr5-rating-${branch.rating}`}>
                      {'⭐'.repeat(Math.max(1, branch.rating))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {activeBranchId && (
              <div className="mr5-branch-details">
                <h4 className="mr5-details-title">
                  {branches.find(b => b.id === activeBranchId)?.name} Details
                </h4>
                <p className="mr5-details-text">
                  {branches.find(b => b.id === activeBranchId)?.history.length} messages in this branch
                </p>
              </div>
            )}

            {promisingBranches.length > 0 && (
              <div className="mr5-promising-branches">
                <h4 className="mr5-promising-title">🚀 Promising Branches</h4>
                <p className="mr5-promising-subtitle">Based on your ratings and iterations</p>
                <div className="mr5-promising-list">
                  {promisingBranches.map((branch, idx) => (
                    <div key={branch.id} className="mr5-promising-item">
                      <span className="mr5-promising-rank">#{idx + 1}</span>
                      <span className="mr5-promising-name">{branch.name}</span>
                      <span className="mr5-promising-score">{branch.rating}⭐</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
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

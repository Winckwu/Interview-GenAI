/**
 * MR15: Metacognitive Strategy Instruction Component
 *
 * Teaches users effective AI collaboration strategies through:
 * 1. 4 strategy categories (Planning/Monitoring/Evaluation/Regulation)
 * 2. Just-in-time prompts for problem behaviors
 * 3. Case library (effective vs ineffective examples)
 * 4. Scaffold fading - reduces guidance as competence increases
 * 5. Prevents Pattern F (passive/ineffective AI use)
 *
 * Evidence: 33/49 users (67%) don't understand advanced AI strategies
 * Educational value: Teaches meta-cognitive awareness and skill development
 */

import React, { useState, useCallback, useEffect } from 'react';
import './MR15MetacognitiveStrategyGuide.css';
import {
  STRATEGY_LIBRARY,
  CASE_STUDIES,
  BEHAVIOR_PATTERNS,
  calculateScaffoldLevel,
  getJustInTimePrompt,
  getRecommendedStrategies,
  type StrategyCategory,
  type CaseStudy
} from './MR15MetacognitiveStrategyGuide.utils';

/**
 * User competency level for scaffold fading
 */
export type ScaffoldLevel = 'high' | 'medium' | 'low';

/**
 * Detected behavior that might need strategy guidance
 */
export interface DetectedBehavior {
  type: 'short-prompt' | 'no-iteration' | 'no-verification' | 'passive-acceptance';
  timestamp: Date;
  context: string;
}

/**
 * Strategy proficiency tracking
 */
export interface StrategyProficiency {
  category: StrategyCategory;
  rating: 1 | 2 | 3 | 4 | 5; // 1=never, 5=always used appropriately
  lastPracticed: Date;
  examples: string[];
}

interface MR15Props {
  // Behavior detection for just-in-time prompts
  onBehaviorDetected?: (behavior: DetectedBehavior) => void;
  onStrategyLearned?: (strategy: string) => void;
  onStrategyPracticed?: (strategy: string) => void;

  // User context for personalization
  userExpertiseLevel?: 'beginner' | 'intermediate' | 'advanced';
  sessionDuration?: number; // milliseconds
  suggestionsCount?: number;
  verificationRate?: number; // 0-1
  iterationRate?: number; // 0-1
}

export const MR15MetacognitiveStrategyGuide: React.FC<MR15Props> = ({
  onBehaviorDetected,
  onStrategyLearned,
  onStrategyPracticed,
  userExpertiseLevel = 'intermediate',
  sessionDuration = 0,
  suggestionsCount = 0,
  verificationRate = 0.5,
  iterationRate = 0.3
}) => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory>('planning');
  const [scaffoldLevel, setScaffoldLevel] = useState<ScaffoldLevel>('medium');
  const [showJustInTimePrompt, setShowJustInTimePrompt] = useState(false);
  const [justInTimeMessage, setJustInTimeMessage] = useState<{
    title: string;
    message: string;
    recommendation: string;
  } | null>(null);
  const [proficiency, setProficiency] = useState<StrategyProficiency[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [showCaseStudies, setShowCaseStudies] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);

  /**
   * Initialize scaffold level based on user data
   */
  useEffect(() => {
    const level = calculateScaffoldLevel({
      suggestionCount: suggestionsCount,
      verificationRate,
      iterationRate,
      sessionDuration
    });
    setScaffoldLevel(level);
  }, [suggestionsCount, verificationRate, iterationRate, sessionDuration]);

  /**
   * Monitor for problem behaviors and trigger just-in-time prompts
   */
  useEffect(() => {
    const detectProblems = () => {
      // Check for short prompts (< 10 words suggests lazy querying)
      if (suggestionsCount > 0 && verificationRate < 0.1) {
        const behavior: DetectedBehavior = {
          type: 'no-verification',
          timestamp: new Date(),
          context: 'User approving suggestions without verification'
        };

        if (onBehaviorDetected) {
          onBehaviorDetected(behavior);
        }

        // Show just-in-time prompt
        const prompt = getJustInTimePrompt('no-verification');
        setJustInTimeMessage(prompt);
        setShowJustInTimePrompt(true);
      }

      // Check for passive acceptance (>80% approval rate = 0+ rejections)
      if (iterationRate < 0.1 && suggestionsCount > 5) {
        const behavior: DetectedBehavior = {
          type: 'no-iteration',
          timestamp: new Date(),
          context: 'User not iterating or requesting variations'
        };

        if (onBehaviorDetected) {
          onBehaviorDetected(behavior);
        }

        const prompt = getJustInTimePrompt('no-iteration');
        setJustInTimeMessage(prompt);
        setShowJustInTimePrompt(true);
      }
    };

    const interval = setInterval(detectProblems, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [suggestionsCount, verificationRate, iterationRate, onBehaviorDetected]);

  /**
   * Handle strategy category selection
   */
  const handleCategorySelect = useCallback((category: StrategyCategory) => {
    setSelectedCategory(category);
  }, []);

  /**
   * Handle strategy learning (mark as completed)
   */
  const handleStrategyCompleted = useCallback((strategyTitle: string) => {
    setCompletedLessons(prev => new Set(prev).add(strategyTitle));

    if (onStrategyLearned) {
      onStrategyLearned(strategyTitle);
    }
  }, [onStrategyLearned]);

  /**
   * Handle strategy practice
   */
  const handlePracticeStrategy = useCallback((strategy: string) => {
    setPracticeMode(true);

    if (onStrategyPracticed) {
      onStrategyPracticed(strategy);
    }
  }, [onStrategyPracticed]);

  /**
   * Handle case study selection
   */
  const handleSelectCaseStudy = useCallback((caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
  }, []);

  /**
   * Render strategy category tabs
   */
  const renderCategoryTabs = () => {
    const categories: StrategyCategory[] = ['planning', 'monitoring', 'evaluation', 'regulation'];
    const icons = {
      planning: '🎯',
      monitoring: '👁️',
      evaluation: '🔍',
      regulation: '⚙️'
    };

    return (
      <div className="mr15-category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`mr15-category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategorySelect(category)}
            aria-selected={selectedCategory === category}
          >
            <span className="mr15-tab-icon">{icons[category]}</span>
            <span className="mr15-tab-label">{category}</span>
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render strategy library for selected category
   */
  const renderStrategyLibrary = () => {
    const categoryStrategies = STRATEGY_LIBRARY[selectedCategory];

    return (
      <div className="mr15-strategy-library">
        <h2 className="mr15-library-title">{selectedCategory} Strategies</h2>

        <div className="mr15-strategies-grid">
          {categoryStrategies.map((strategy, idx) => {
            const isCompleted = completedLessons.has(strategy.title);
            const shouldShow = scaffoldLevel === 'high' || idx < 2; // Show fewer at high competence

            if (!shouldShow && scaffoldLevel === 'high') return null;

            return (
              <div key={idx} className={`mr15-strategy-card ${isCompleted ? 'completed' : ''}`}>
                <div className="mr15-strategy-header">
                  <h3 className="mr15-strategy-title">{strategy.title}</h3>
                  {isCompleted && <span className="mr15-badge-completed">✓ Learned</span>}
                </div>

                <p className="mr15-strategy-description">{strategy.description}</p>

                <div className="mr15-strategy-content">
                  <h4>When to use:</h4>
                  <p className="mr15-when-to-use">{strategy.whenToUse}</p>

                  <h4>How to apply:</h4>
                  <ul className="mr15-how-to-apply">
                    {strategy.howToApply.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ul>

                  <h4>Why it matters:</h4>
                  <p className="mr15-why-it-matters">{strategy.whyItMatters}</p>
                </div>

                <div className="mr15-strategy-actions">
                  <button
                    className="mr15-btn-practice"
                    onClick={() => handlePracticeStrategy(strategy.title)}
                  >
                    🎯 Practice This
                  </button>
                  {!isCompleted && (
                    <button
                      className="mr15-btn-completed"
                      onClick={() => handleStrategyCompleted(strategy.title)}
                    >
                      ✓ Mark as Learned
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {scaffoldLevel === 'high' && (
          <div className="mr15-scaffold-fade-notice">
            <p>📚 You're mastering these strategies! Advanced strategies will appear as you progress.</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render case studies (effective vs ineffective examples)
   */
  const renderCaseStudies = () => {
    return (
      <div className="mr15-case-studies">
        <h2 className="mr15-case-studies-title">Learn from Examples</h2>

        <div className="mr15-case-grid">
          {CASE_STUDIES.map((caseStudy, idx) => (
            <button
              key={idx}
              className={`mr15-case-card ${caseStudy.type} ${
                selectedCaseStudy?.title === caseStudy.title ? 'selected' : ''
              }`}
              onClick={() => handleSelectCaseStudy(caseStudy)}
            >
              <div className="mr15-case-header">
                <span className="mr15-case-icon">
                  {caseStudy.type === 'effective' ? '✅' : '❌'}
                </span>
                <span className="mr15-case-type">{caseStudy.type}</span>
              </div>
              <h3 className="mr15-case-title">{caseStudy.title}</h3>
              <p className="mr15-case-brief">{caseStudy.brief}</p>
            </button>
          ))}
        </div>

        {selectedCaseStudy && (
          <div className="mr15-case-detail">
            <div className="mr15-case-detail-header">
              <h3>{selectedCaseStudy.title}</h3>
              <span className={`mr15-case-detail-type ${selectedCaseStudy.type}`}>
                {selectedCaseStudy.type.toUpperCase()}
              </span>
            </div>

            <div className="mr15-case-scenario">
              <h4>Scenario:</h4>
              <p>{selectedCaseStudy.scenario}</p>
            </div>

            <div className="mr15-case-approach">
              <h4>Approach:</h4>
              <p>{selectedCaseStudy.approach}</p>
            </div>

            <div className="mr15-case-outcome">
              <h4>Outcome:</h4>
              <p>{selectedCaseStudy.outcome}</p>
            </div>

            <div className={`mr15-case-lesson ${selectedCaseStudy.type}`}>
              <h4>Key Lesson:</h4>
              <p>{selectedCaseStudy.lesson}</p>
            </div>

            <div className="mr15-case-actions">
              <button className="mr15-btn-understand">
                {selectedCaseStudy.type === 'effective' ? '✓ I understand' : '✓ I understand to avoid'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render just-in-time prompt modal
   */
  const renderJustInTimePrompt = () => {
    if (!showJustInTimePrompt || !justInTimeMessage) return null;

    return (
      <div className="mr15-jit-overlay" onClick={() => setShowJustInTimePrompt(false)}>
        <div className="mr15-jit-modal" onClick={e => e.stopPropagation()}>
          <h3 className="mr15-jit-title">💡 {justInTimeMessage.title}</h3>
          <p className="mr15-jit-message">{justInTimeMessage.message}</p>

          <div className="mr15-jit-recommendation">
            <h4>💭 Recommendation:</h4>
            <p>{justInTimeMessage.recommendation}</p>
          </div>

          <div className="mr15-jit-actions">
            <button
              className="mr15-btn-dismiss"
              onClick={() => setShowJustInTimePrompt(false)}
            >
              Dismiss
            </button>
            <button
              className="mr15-btn-learn-more"
              onClick={() => {
                setShowJustInTimePrompt(false);
                // Navigate to relevant strategy
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render proficiency dashboard
   */
  const renderProficiencyDashboard = () => {
    const categoryLabels = {
      planning: '🎯 Planning',
      monitoring: '👁️ Monitoring',
      evaluation: '🔍 Evaluation',
      regulation: '⚙️ Regulation'
    };

    return (
      <div className="mr15-proficiency-dashboard">
        <h2 className="mr15-proficiency-title">Your Metacognitive Proficiency</h2>

        <div className="mr15-proficiency-grid">
          {(['planning', 'monitoring', 'evaluation', 'regulation'] as const).map(category => {
            // Calculate average proficiency for category
            const categoryStrategies = STRATEGY_LIBRARY[category];
            const learned = categoryStrategies.filter(s =>
              completedLessons.has(s.title)
            ).length;
            const progress = Math.round((learned / categoryStrategies.length) * 100);

            return (
              <div key={category} className="mr15-proficiency-item">
                <div className="mr15-proficiency-label">{categoryLabels[category]}</div>
                <div className="mr15-proficiency-bar">
                  <div
                    className="mr15-proficiency-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mr15-proficiency-text">
                  {learned}/{categoryStrategies.length} learned
                </div>
              </div>
            );
          })}
        </div>

        <div className="mr15-scaffold-level">
          <h3>Guidance Level: <span className={`mr15-level-${scaffoldLevel}`}>{scaffoldLevel}</span></h3>
          <p className="mr15-scaffold-explanation">
            {scaffoldLevel === 'high' && 'You\'ve shown strong proficiency. Guidance is fading to encourage independence.'}
            {scaffoldLevel === 'medium' && 'You\'re building competence. Guidance available when needed.'}
            {scaffoldLevel === 'low' && 'You\'re learning fundamentals. Detailed guidance provided.'}
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render main content
   */
  return (
    <div className="mr15-container">
      <div className="mr15-header">
        <h1 className="mr15-title">🧠 Metacognitive Strategy Guide</h1>
        <p className="mr15-subtitle">
          Master effective AI collaboration strategies. Learn, practice, and develop metacognitive awareness.
        </p>
      </div>

      {/* Navigation */}
      <div className="mr15-navigation">
        <button
          className={`mr15-nav-btn ${!showCaseStudies ? 'active' : ''}`}
          onClick={() => setShowCaseStudies(false)}
        >
          📚 Strategy Library
        </button>
        <button
          className={`mr15-nav-btn ${showCaseStudies ? 'active' : ''}`}
          onClick={() => setShowCaseStudies(true)}
        >
          📖 Case Studies
        </button>
      </div>

      {/* Main content area */}
      {!showCaseStudies ? (
        <>
          {/* Category tabs */}
          {renderCategoryTabs()}

          {/* Strategy library */}
          {renderStrategyLibrary()}
        </>
      ) : (
        // Case studies view
        renderCaseStudies()
      )}

      {/* Proficiency dashboard */}
      {renderProficiencyDashboard()}

      {/* Just-in-time prompt */}
      {renderJustInTimePrompt()}
    </div>
  );
};

export default MR15MetacognitiveStrategyGuide;

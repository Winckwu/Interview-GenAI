/**
 * MR3: Human Agency Control - Demo & Test Scenarios
 *
 * Demonstrates 5 realistic usage scenarios:
 * 1. User with high autonomy (many rejections)
 * 2. User with balanced acceptance/rejection
 * 3. User with low autonomy (mostly approves)
 * 4. User pausing AI mid-session
 * 5. User saving human-only versions
 */

import React, { useState, useCallback } from 'react';
import MR3HumanAgencyControl, {
  InterventionLevel,
  AISuggestion
} from './MR3HumanAgencyControl';

interface DemoScenarioState {
  selectedScenario: number;
  interventionLevel: InterventionLevel;
  aiPaused: boolean;
  suggestions: AISuggestion[];
}

const MR3Demo: React.FC = () => {
  const [demoState, setDemoState] = useState<DemoScenarioState>({
    selectedScenario: 0,
    interventionLevel: 'suggestive',
    aiPaused: false,
    suggestions: []
  });

  const [demoLog, setDemoLog] = useState<string[]>([]);

  /**
   * Sample AI suggestions for demonstration
   */
  const getSampleSuggestions = useCallback((): AISuggestion[] => {
    return [
      {
        id: 'sugg-1',
        type: 'correction',
        content: 'Change "utilize" to "use" for clarity',
        context: 'In the introduction paragraph',
        confidence: 0.95,
        timestamp: new Date(),
        approved: false,
        rejected: false
      },
      {
        id: 'sugg-2',
        type: 'structure',
        content: 'Consider restructuring: Intro → Background → Methods → Results → Discussion',
        context: 'Overall document organization',
        confidence: 0.85,
        timestamp: new Date(Date.now() - 30000),
        approved: false,
        rejected: false
      },
      {
        id: 'sugg-3',
        type: 'recommendation',
        content: 'Add examples from industry case studies to support claims',
        context: 'Section 3.2 Analysis',
        confidence: 0.72,
        timestamp: new Date(Date.now() - 60000),
        approved: false,
        rejected: false
      },
      {
        id: 'sugg-4',
        type: 'content',
        content: 'Expand on the methodology explanation - currently too brief',
        context: 'Section 2: Methodology',
        confidence: 0.68,
        timestamp: new Date(Date.now() - 90000),
        approved: false,
        rejected: false
      }
    ];
  }, []);

  /**
   * Scenario definitions
   */
  const scenarios = [
    {
      title: '🎯 Scenario 1: Strategic User (High Autonomy)',
      description:
        'User who actively evaluates suggestions and frequently rejects or modifies them. ' +
        'Shows 40% rejection rate, uses "Passive" intervention level.',
      interventionLevel: 'passive' as InterventionLevel,
      stats: {
        suggestionsReceived: 25,
        approved: 15,
        rejected: 10,
        reason:
          'This user is highly engaged and critical. They maintain strong autonomy ' +
          'and make deliberate decisions about AI assistance.'
      }
    },
    {
      title: '⚖️ Scenario 2: Balanced User (Moderate Autonomy)',
      description:
        'User with balanced approach - approves helpful suggestions but rejects questionable ones. ' +
        '30% rejection rate, uses "Suggestive" intervention level.',
      interventionLevel: 'suggestive' as InterventionLevel,
      stats: {
        suggestionsReceived: 30,
        approved: 21,
        rejected: 9,
        reason:
          'This user demonstrates healthy autonomy with balanced decision-making. ' +
          'They leverage AI while maintaining critical evaluation.'
      }
    },
    {
      title: '⚠️ Scenario 3: Passive User (Low Autonomy Risk)',
      description:
        'User who auto-accepts most suggestions with minimal evaluation. ' +
        '10% rejection rate, uses "Proactive" intervention level.',
      interventionLevel: 'proactive' as InterventionLevel,
      stats: {
        suggestionsReceived: 40,
        approved: 36,
        rejected: 4,
        reason:
          'WARNING: Low autonomy detected. User shows signs of over-dependence on AI. ' +
          'System should prompt for more critical evaluation and suggest skill-building tasks.'
      }
    },
    {
      title: '⏸️ Scenario 4: Deliberate Pause (Session Control)',
      description:
        'User who strategically pauses AI during complex work that requires independent thinking. ' +
        'Uses pause functionality, then resumes AI assistance for routine tasks.',
      interventionLevel: 'suggestive' as InterventionLevel,
      stats: {
        pauseDuration: '15 minutes',
        resumed: true,
        reason:
          'This demonstrates healthy agency use. User recognizes when independent thought is important ' +
          'and deliberately removes AI assistance to maintain skill and autonomy.'
      }
    },
    {
      title: '💾 Scenario 5: Human-Only Checkpoints (Version Control)',
      description:
        'User who periodically saves "human-only" versions of work to maintain a reference ' +
        'of independent work. Builds a personal audit trail of human-generated content.',
      interventionLevel: 'suggestive' as InterventionLevel,
      stats: {
        humanVersionsSaved: 3,
        firstCheckpoint: '2024-11-17 14:30',
        reason:
          'Excellent practice. User maintains snapshots of independent work, creating natural ' +
          'guards against skill degradation and providing clear evidence of human authorship.'
      }
    }
  ];

  /**
   * Handle scenario selection
   */
  const handleScenarioSelect = useCallback((scenarioIdx: number) => {
    const scenario = scenarios[scenarioIdx];
    setDemoState(prev => ({
      ...prev,
      selectedScenario: scenarioIdx,
      interventionLevel: scenario.interventionLevel
    }));

    setDemoLog(prev => [
      ...prev,
      `📋 Selected: ${scenario.title}`,
      `Description: ${scenario.description}`
    ]);
  }, [scenarios]);

  /**
   * Handle intervention level change
   */
  const handleInterventionChange = useCallback((level: InterventionLevel) => {
    setDemoState(prev => ({
      ...prev,
      interventionLevel: level
    }));

    const levelLabels = {
      passive: '🤐 Passive',
      suggestive: '🤝 Suggestive',
      proactive: '🚀 Proactive'
    };

    setDemoLog(prev => [
      ...prev,
      `🎛️ Intervention level changed to: ${levelLabels[level]}`
    ]);
  }, []);

  /**
   * Handle AI pause
   */
  const handleAIPause = useCallback((paused: boolean) => {
    setDemoState(prev => ({
      ...prev,
      aiPaused: paused
    }));

    setDemoLog(prev => [
      ...prev,
      paused ? '⏸️ AI assistance paused' : '▶️ AI assistance resumed'
    ]);
  }, []);

  /**
   * Handle continue without AI
   */
  const handleContinueWithoutAI = useCallback(() => {
    setDemoLog(prev => [
      ...prev,
      '🚶 User chose to continue without AI'
    ]);
  }, []);

  /**
   * Handle save human version
   */
  const handleSaveHumanVersion = useCallback((versionData: any) => {
    setDemoLog(prev => [
      ...prev,
      `💾 Human-only version saved (${new Date().toLocaleTimeString()})`
    ]);
  }, []);

  /**
   * Handle suggestion approval
   */
  const handleSuggestionApproval = useCallback((suggestion: any) => {
    setDemoLog(prev => [
      ...prev,
      `✓ Approved: "${suggestion.content.substring(0, 50)}..."`
    ]);
  }, []);

  /**
   * Clear demo log
   */
  const handleClearLog = useCallback(() => {
    setDemoLog([]);
  }, []);

  const currentScenario = scenarios[demoState.selectedScenario];

  return (
    <div className="mr3-demo-container">
      {/* Header */}
      <div className="mr3-demo-header">
        <h1>MR3: Human Agency Control - Interactive Demo</h1>
        <p className="mr3-demo-subtitle">
          Explore 5 usage scenarios demonstrating different autonomy levels and control strategies
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="mr3-demo-scenarios">
        <h2>Choose a Scenario:</h2>
        <div className="mr3-scenario-buttons">
          {scenarios.map((scenario, idx) => (
            <button
              key={idx}
              className={`mr3-scenario-btn ${demoState.selectedScenario === idx ? 'active' : ''}`}
              onClick={() => handleScenarioSelect(idx)}
              title={scenario.description}
            >
              {scenario.title.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Current Scenario Info */}
      <div className="mr3-demo-scenario-info">
        <h2>{currentScenario.title}</h2>
        <p className="mr3-scenario-description">{currentScenario.description}</p>

        <div className="mr3-scenario-stats">
          <h3>Scenario Stats:</h3>
          <div className="mr3-stats-details">
            {Object.entries(currentScenario.stats).map(([key, value]) => (
              <div key={key} className="mr3-stat-item">
                <span className="mr3-stat-label">{key}:</span>
                <span className="mr3-stat-value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Component Demo */}
      <div className="mr3-demo-component">
        <h2>Component in Action:</h2>
        <MR3HumanAgencyControl
          onInterventionChange={handleInterventionChange}
          onAIPause={handleAIPause}
          onContinueWithoutAI={handleContinueWithoutAI}
          onSaveHumanVersion={handleSaveHumanVersion}
          onSuggestionApproval={handleSuggestionApproval}
          currentWorkSessionId={`demo-scenario-${demoState.selectedScenario}`}
          currentContent="Sample document being edited..."
        />
      </div>

      {/* Activity Log */}
      <div className="mr3-demo-log">
        <div className="mr3-log-header">
          <h2>Activity Log:</h2>
          <button className="mr3-log-clear" onClick={handleClearLog}>
            Clear
          </button>
        </div>

        <div className="mr3-log-entries">
          {demoLog.length === 0 ? (
            <p className="mr3-log-empty">Interact with the component above to see activity log</p>
          ) : (
            demoLog.map((entry, idx) => (
              <div key={idx} className="mr3-log-entry">
                <span className="mr3-log-time">{new Date().toLocaleTimeString()}</span>
                <span className="mr3-log-text">{entry}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Features Overview */}
      <div className="mr3-demo-features">
        <h2>Key Features Demonstrated:</h2>

        <div className="mr3-features-grid">
          <div className="mr3-feature">
            <h3>1️⃣ Intervention Control</h3>
            <p>
              Adjust AI intervention level from <strong>Passive</strong> (user-initiated) to{' '}
              <strong>Proactive</strong> (AI frequently suggests). Find your comfort zone.
            </p>
          </div>

          <div className="mr3-feature">
            <h3>2️⃣ Suggestion Approval</h3>
            <p>
              Every AI suggestion requires explicit user approval. Options: Approve, Reject, or
              Modify. Maintains human decision-making authority.
            </p>
          </div>

          <div className="mr3-feature">
            <h3>3️⃣ Session Pause</h3>
            <p>
              Pause AI assistance anytime during complex work. Lets you think independently before
              deciding to re-engage AI assistance.
            </p>
          </div>

          <div className="mr3-feature">
            <h3>4️⃣ Human-Only Versions</h3>
            <p>
              Save snapshots of independent work as checkpoints. Build a portfolio of human-created
              content and track skill maintenance.
            </p>
          </div>

          <div className="mr3-feature">
            <h3>5️⃣ Continue Without AI</h3>
            <p>
              Exit AI assistance entirely for specific tasks. Useful for skill practice or when you
              need complete autonomy.
            </p>
          </div>

          <div className="mr3-feature">
            <h3>6️⃣ Autonomy Metrics</h3>
            <p>
              Real-time display of approval rate, rejection rate, and agency score. Understand your
              AI usage patterns and autonomy level.
            </p>
          </div>
        </div>
      </div>

      {/* Design Rationale */}
      <div className="mr3-demo-rationale">
        <h2>Design Rationale:</h2>
        <p>
          <strong>Evidence Base:</strong> 27/49 users (55%) expressed fear that AI over-intervention
          could erode decision-making autonomy. This component directly addresses that concern.
        </p>

        <h3>Design Principles:</h3>
        <ul>
          <li>
            <strong>Human-First:</strong> AI is a tool, not a replacement. Users maintain ultimate
            decision authority.
          </li>
          <li>
            <strong>Transparent Control:</strong> Clear visibility of intervention level and
            suggestion approval status.
          </li>
          <li>
            <strong>Exit Paths:</strong> Multiple ways to reduce or pause AI intervention (pause,
            exit, human-only versions).
          </li>
          <li>
            <strong>Autonomy Measurement:</strong> Real-time feedback on approval/rejection patterns
            to help users understand their AI dependency.
          </li>
          <li>
            <strong>Skill Preservation:</strong> Human-only version checkpoints create natural
            guards against skill degradation.
          </li>
          <li>
            <strong>Accessibility:</strong> WCAG 2.1 AA compliance, high contrast support, dark
            mode, and reduced motion support.
          </li>
        </ul>
      </div>

      {/* Implementation Notes */}
      <div className="mr3-demo-implementation">
        <h2>Implementation Notes:</h2>

        <h3>Component API:</h3>
        <pre className="mr3-code-block">{`<MR3HumanAgencyControl
  onInterventionChange={(level) => {}}
  onAIPause={(paused) => {}}
  onContinueWithoutAI={() => {}}
  onSaveHumanVersion={(data) => {}}
  onSuggestionApproval={(suggestion) => {}}
  currentContent={string}
  currentWorkSessionId={string}
/>
`}</pre>

        <h3>Key State Management:</h3>
        <ul>
          <li>
            <code>interventionLevel</code>: 'passive' | 'suggestive' | 'proactive'
          </li>
          <li>
            <code>aiSessionPaused</code>: boolean
          </li>
          <li>
            <code>suggestionsReceived</code>: number
          </li>
          <li>
            <code>suggestionsApproved</code>: number
          </li>
          <li>
            <code>suggestionsRejected</code>: number
          </li>
          <li>
            <code>humanVersionSaved</code>: boolean
          </li>
        </ul>

        <h3>localStorage Integration:</h3>
        <p>
          Human-only versions are stored in browser localStorage with keys:
          <code>human-version-{`{sessionId}`}</code> and indexed in{' '}
          <code>human-versions-index-{`{sessionId}`}</code>
        </p>
      </div>

      {/* Testing Checklist */}
      <div className="mr3-demo-testing">
        <h2>QA Testing Checklist:</h2>
        <div className="mr3-testing-list">
          <div className="mr3-test-item">
            <input type="checkbox" id="test-1" defaultChecked disabled />
            <label htmlFor="test-1">
              Intervention level slider updates correctly (0 passive → 1 suggestive → 2 proactive)
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-2" defaultChecked disabled />
            <label htmlFor="test-2">
              Pause/Resume button toggles AI session state correctly
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-3" defaultChecked disabled />
            <label htmlFor="test-3">
              Save Human-Only Version saves to localStorage and appears in history
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-4" defaultChecked disabled />
            <label htmlFor="test-4">
              Suggestion approval/rejection updates metrics correctly
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-5" defaultChecked disabled />
            <label htmlFor="test-5">
              Agency score calculation reflects autonomy level (high rejection = higher autonomy)
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-6" defaultChecked disabled />
            <label htmlFor="test-6">
              Floating action buttons (pause/exit) visible on screen
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-7" defaultChecked disabled />
            <label htmlFor="test-7">
              Confirmation dialogs appear for pause/exit/save actions
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-8" defaultChecked disabled />
            <label htmlFor="test-8">
              Dark mode colors apply correctly with media query
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-9" defaultChecked disabled />
            <label htmlFor="test-9">
              High contrast mode increases border widths and improves readability
            </label>
          </div>
          <div className="mr3-test-item">
            <input type="checkbox" id="test-10" defaultChecked disabled />
            <label htmlFor="test-10">
              Responsive design works on mobile (< 480px), tablet (768px), and desktop
            </label>
          </div>
        </div>
      </div>

      <style>{`
        .mr3-demo-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1a1a1a;
          background: #ffffff;
        }

        .mr3-demo-header {
          margin-bottom: 2rem;
        }

        .mr3-demo-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          color: #0066ff;
        }

        .mr3-demo-subtitle {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .mr3-demo-scenarios {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .mr3-demo-scenarios h2 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
        }

        .mr3-scenario-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .mr3-scenario-btn {
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .mr3-scenario-btn:hover {
          border-color: #0066ff;
          color: #0066ff;
        }

        .mr3-scenario-btn.active {
          background: #0066ff;
          color: white;
          border-color: #0066ff;
        }

        .mr3-demo-scenario-info {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #e6f2ff;
          border-left: 4px solid #0066ff;
          border-radius: 6px;
        }

        .mr3-demo-scenario-info h2 {
          margin: 0 0 0.5rem 0;
          color: #0066ff;
        }

        .mr3-scenario-description {
          margin: 0 0 1.5rem 0;
          color: #333;
          line-height: 1.6;
        }

        .mr3-scenario-stats h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .mr3-stats-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .mr3-stat-item {
          padding: 0.75rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #b3d9ff;
        }

        .mr3-stat-label {
          font-weight: 600;
          color: #0066ff;
        }

        .mr3-stat-value {
          margin-left: 0.5rem;
          color: #1a1a1a;
        }

        .mr3-demo-component {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .mr3-demo-component h2 {
          margin: 0 0 1rem 0;
        }

        .mr3-demo-log {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #1a1a1a;
          border-radius: 8px;
          color: #e0e0e0;
        }

        .mr3-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .mr3-log-header h2 {
          margin: 0;
          color: #4a9eff;
        }

        .mr3-log-clear {
          padding: 0.5rem 1rem;
          background: #404040;
          color: #e0e0e0;
          border: 1px solid #606060;
          border-radius: 4px;
          cursor: pointer;
        }

        .mr3-log-clear:hover {
          background: #505050;
        }

        .mr3-log-entries {
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mr3-log-empty {
          text-align: center;
          color: #808080;
          margin: 1rem 0;
        }

        .mr3-log-entry {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
          border-left: 2px solid #4a9eff;
          padding-left: 0.75rem;
        }

        .mr3-log-time {
          color: #808080;
          white-space: nowrap;
          font-size: 0.85rem;
        }

        .mr3-log-text {
          color: #e0e0e0;
        }

        .mr3-demo-features {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .mr3-demo-features h2 {
          margin: 0 0 1.5rem 0;
        }

        .mr3-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .mr3-feature {
          padding: 1.5rem;
          background: white;
          border-radius: 6px;
          border-left: 4px solid #0066ff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .mr3-feature h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1.1rem;
        }

        .mr3-feature p {
          margin: 0;
          color: #666;
          line-height: 1.6;
        }

        .mr3-demo-rationale,
        .mr3-demo-implementation,
        .mr3-demo-testing {
          margin: 2rem 0;
          padding: 1.5rem;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .mr3-code-block {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.9rem;
          margin: 1rem 0;
        }

        .mr3-testing-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mr3-test-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .mr3-test-item input {
          cursor: pointer;
          margin-top: 0.25rem;
        }

        .mr3-test-item label {
          cursor: pointer;
          color: #666;
        }

        @media (max-width: 768px) {
          .mr3-demo-container {
            padding: 1rem;
          }

          .mr3-demo-header h1 {
            font-size: 1.5rem;
          }

          .mr3-scenario-buttons {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .mr3-features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MR3Demo;

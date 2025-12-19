import React, { useState } from 'react';
import { Info, Brain, RefreshCw, AlertTriangle, BarChart3, Lightbulb } from 'lucide-react';
import './ChatHelpPanel.css';

interface ChatHelpPanelProps {
  isVisible: boolean;
  onClose: () => void;
  messageCount?: number;
  hasActiveIntervention?: boolean;
}

/**
 * Collapsible Help Panel for ChatSessionPage
 * Provides guidance on system features, MR interventions, and usage tips
 */
const ChatHelpPanel: React.FC<ChatHelpPanelProps> = ({
  isVisible,
  onClose,
  messageCount = 0,
  hasActiveIntervention = false,
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  if (!isVisible) return null;

  return (
    <div className="chat-help-panel">
      <div className="chat-help-header">
        <div className="chat-help-title-row">
          <h3 className="chat-help-title">Quick Guide</h3>
          <button
            onClick={onClose}
            className="chat-help-close-btn"
            aria-label="Close help panel"
            title="Close help panel"
          >
            ✕
          </button>
        </div>
        <p className="chat-help-subtitle">Get the most out of your AI chat session</p>
      </div>

      <div className="chat-help-tabs">
        <button
          className={`chat-help-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button
          className={`chat-help-tab ${activeSection === 'mr' ? 'active' : ''}`}
          onClick={() => setActiveSection('mr')}
        >
          MR System
        </button>
        <button
          className={`chat-help-tab ${activeSection === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveSection('tips')}
        >
          Tips
        </button>
      </div>

      <div className="chat-help-content">
        {activeSection === 'overview' && (
          <div className="chat-help-section">
            <div className="chat-help-status-card">
              <h4>Current Session Status</h4>
              <div className="chat-help-status-items">
                <div className="chat-help-status-item">
                  <span className="status-label">Messages:</span>
                  <span className="status-value">{messageCount}</span>
                </div>
                <div className="chat-help-status-item">
                  <span className="status-label">Active Intervention:</span>
                  <span className={`status-badge ${hasActiveIntervention ? 'active' : 'inactive'}`}>
                    {hasActiveIntervention ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="chat-help-info-box">
              <div className="info-icon"><Info size={20} strokeWidth={2} /></div>
              <div className="info-content">
                <h4>What happens during a chat?</h4>
                <ul>
                  <li>System monitors your interaction patterns</li>
                  <li>Tracks verification and modification behaviors</li>
                  <li>Identifies AI usage patterns (A-F)</li>
                  <li>Triggers intelligent interventions when needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'mr' && (
          <div className="chat-help-section">
            <div className="chat-help-info-box">
              <div className="info-icon"><Brain size={20} strokeWidth={2} /></div>
              <div className="info-content">
                <h4>MR Intervention System</h4>
                <p>Metacognitive Recommendation (MR) interventions help prevent skill degradation and improve AI collaboration effectiveness.</p>
              </div>
            </div>

            <div className="chat-help-mr-list">
              <h4>When do MR interventions appear?</h4>
              <div className="mr-trigger-item">
                <span className="mr-icon"><RefreshCw size={16} strokeWidth={2} /></span>
                <div className="mr-trigger-text">
                  <strong>Low verification behavior</strong>
                  <p>System detects you're not validating AI outputs</p>
                </div>
              </div>
              <div className="mr-trigger-item">
                <span className="mr-icon"><AlertTriangle size={16} strokeWidth={2} /></span>
                <div className="mr-trigger-text">
                  <strong>Pattern recognition</strong>
                  <p>System identifies risky usage patterns (D, E, or F)</p>
                </div>
              </div>
              <div className="mr-trigger-item">
                <span className="mr-icon"><BarChart3 size={16} strokeWidth={2} /></span>
                <div className="mr-trigger-text">
                  <strong>Metacognitive assessment</strong>
                  <p>Periodic evaluation of your cognitive capabilities</p>
                </div>
              </div>
            </div>

            <div className="chat-help-action-box">
              <h4>How to respond to MR interventions</h4>
              <ol>
                <li>Read the intervention message carefully</li>
                <li>Follow the recommended actions or exercises</li>
                <li>Apply the guidance to your current task</li>
                <li>Continue with your improved approach</li>
              </ol>
            </div>
          </div>
        )}

        {activeSection === 'tips' && (
          <div className="chat-help-section">
            <h4>Usage Tips</h4>

            <div className="chat-help-tip-card">
              <div className="tip-number">1</div>
              <div className="tip-content">
                <h5>Verify AI outputs</h5>
                <p>Always check and validate what the AI suggests. Don't blindly accept responses.</p>
              </div>
            </div>

            <div className="chat-help-tip-card">
              <div className="tip-number">2</div>
              <div className="tip-content">
                <h5>Engage actively</h5>
                <p>Modify and improve AI responses. Show that you're thinking critically.</p>
              </div>
            </div>

            <div className="chat-help-tip-card">
              <div className="tip-number">3</div>
              <div className="tip-content">
                <h5>Use MR tools</h5>
                <p>Click the "MR Tools" button to access collaboration tools and interventions.</p>
              </div>
            </div>

            <div className="chat-help-tip-card">
              <div className="tip-number">4</div>
              <div className="tip-content">
                <h5>Complete assessments</h5>
                <p>When prompted, complete MR19 metacognitive assessments to help the system personalize interventions.</p>
              </div>
            </div>

            <div className="chat-help-tip-card">
              <div className="tip-number">5</div>
              <div className="tip-content">
                <h5>Review your patterns</h5>
                <p>Check the Pattern Analysis to understand your AI usage behavior and improve over time.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-help-footer">
        <p className="help-note">
          <Lightbulb size={14} strokeWidth={2} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> <strong>Tip:</strong> The system learns from your behavior to provide personalized guidance
        </p>
      </div>
    </div>
  );
};

export default ChatHelpPanel;

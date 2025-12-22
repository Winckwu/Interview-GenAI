import React, { useState } from 'react';
import './HelpPage.css';

/**
 * Standalone Help Page
 * Comprehensive guide for the AI Pattern Recognition System
 * Includes MR mechanism explanations, usage guide, and FAQ
 */
const HelpPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  return (
    <div className="help-page">
      <div className="help-container">
        {/* Header */}
        <header className="help-header">
          <div className="help-hero">
            <h1>AI Pattern Recognition System</h1>
            <p className="help-hero-subtitle">
              Complete Guide to Metacognitive Collaboration
            </p>
          </div>
        </header>

        {/* Navigation */}
        <nav className="help-nav">
          <button
            className={`help-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📚 Overview
          </button>
          <button
            className={`help-nav-btn ${activeSection === 'getting-started' ? 'active' : ''}`}
            onClick={() => setActiveSection('getting-started')}
          >
            🚀 Getting Started
          </button>
          <button
            className={`help-nav-btn ${activeSection === 'mr-system' ? 'active' : ''}`}
            onClick={() => setActiveSection('mr-system')}
          >
            🧠 MR System
          </button>
          <button
            className={`help-nav-btn ${activeSection === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveSection('patterns')}
          >
            📊 Patterns
          </button>
          <button
            className={`help-nav-btn ${activeSection === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveSection('faq')}
          >
            ❓ FAQ
          </button>
        </nav>

        {/* Content */}
        <main className="help-content">
          {activeSection === 'overview' && (
            <div className="help-section">
              <h2>System Overview</h2>

              <div className="help-card">
                <div className="help-card-icon">🎯</div>
                <div className="help-card-content">
                  <h3>What is this system?</h3>
                  <p>
                    The AI Pattern Recognition System is an intelligent platform designed to enhance
                    human-AI collaboration. It monitors your interaction patterns with AI assistants,
                    identifies potential skill degradation risks, and provides personalized metacognitive
                    interventions (MRs) to maintain and improve your cognitive abilities.
                  </p>
                </div>
              </div>

              <div className="help-card">
                <div className="help-card-icon">⚙️</div>
                <div className="help-card-content">
                  <h3>Core Features</h3>
                  <ul>
                    <li>
                      <strong>Pattern Recognition:</strong> Identifies 6 distinct AI usage patterns (A-F)
                      based on your verification and modification behaviors
                    </li>
                    <li>
                      <strong>Metacognitive Assessment:</strong> Evaluates 12 dimensions of cognitive
                      capabilities including reasoning, self-regulation, and critical thinking
                    </li>
                    <li>
                      <strong>Intelligent Interventions:</strong> Provides 19 MR strategies to prevent
                      skill decay and improve collaboration effectiveness
                    </li>
                    <li>
                      <strong>Real-time Monitoring:</strong> Continuous tracking of verification,
                      engagement, and modification behaviors during chat sessions
                    </li>
                  </ul>
                </div>
              </div>

              <div className="help-card">
                <div className="help-card-icon">💡</div>
                <div className="help-card-content">
                  <h3>Key Benefits</h3>
                  <ul>
                    <li>Improved AI efficiency through pattern awareness</li>
                    <li>Prevention of skill degradation via timely interventions</li>
                    <li>Enhanced problem-solving abilities with metacognitive insights</li>
                    <li>Personalized recommendations based on your behavior and experience level</li>
                    <li>Transparent AI collaboration with trust calibration</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'getting-started' && (
            <div className="help-section">
              <h2>Getting Started</h2>

              <div className="help-steps">
                <div className="help-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Start a Chat Session</h3>
                    <p>Navigate to <strong>AI Chat</strong> from the sidebar and begin interacting with the AI assistant.</p>
                  </div>
                </div>

                <div className="help-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Complete MR19 Assessment</h3>
                    <p>
                      When prompted, complete the <strong>MR19 Metacognitive Capability Assessment</strong>.
                      This evaluates 12 dimensions of your cognitive abilities and helps personalize interventions.
                    </p>
                  </div>
                </div>

                <div className="help-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Engage with AI</h3>
                    <p>
                      Chat naturally with the AI. The system monitors your behavior:
                      <br/>• Do you verify AI outputs?
                      <br/>• Do you modify suggestions?
                      <br/>• How deeply do you engage?
                    </p>
                  </div>
                </div>

                <div className="help-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>Respond to MR Interventions</h3>
                    <p>
                      When the system detects patterns that may lead to skill degradation, it triggers MR
                      interventions. Follow the guidance to improve your collaboration approach.
                    </p>
                  </div>
                </div>

                <div className="help-step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h3>Review Your Patterns</h3>
                    <p>
                      Visit the <strong>Pattern Analysis</strong> page to see your AI usage patterns (A-F)
                      and understand your collaboration style over time.
                    </p>
                  </div>
                </div>

                <div className="help-step">
                  <div className="step-number">6</div>
                  <div className="step-content">
                    <h3>Track Progress</h3>
                    <p>
                      Check the <strong>Dashboard</strong> to monitor metrics like verification rate,
                      modification behavior, and metacognitive assessment scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'mr-system' && (
            <div className="help-section">
              <h2>MR Intervention System</h2>

              <div className="help-intro-box">
                <h3>What are MR Interventions?</h3>
                <p>
                  Metacognitive Recommendations (MRs) are intelligent interventions designed to prevent
                  skill degradation and enhance your cognitive abilities when collaborating with AI.
                  The system uses 19 distinct MR strategies based on your behavior, experience level,
                  and identified patterns.
                </p>
              </div>

              <div className="mr-grid">
                {/* MR1-MR5 */}
                <div className="mr-card">
                  <div className="mr-number">MR1</div>
                  <div className="mr-content">
                    <h4>Task Decomposition Scaffold</h4>
                    <p>Guides you to break down complex tasks into manageable subtasks</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR2</div>
                  <div className="mr-content">
                    <h4>Process Transparency</h4>
                    <p>Shows AI's reasoning process and decision-making steps</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR3</div>
                  <div className="mr-content">
                    <h4>Reminder Frequency</h4>
                    <p>Control how often you receive metacognitive reminders. Choose 'Minimal' for only critical warnings, 'Balanced' for moderate guidance (default), or 'Active' for comprehensive coaching with all tips and suggestions.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR4</div>
                  <div className="mr-content">
                    <h4>Role Definition Guidance</h4>
                    <p>Select AI roles (Research, Draft, Verifier, Brainstorm, Tutor, Critic) to constrain AI behavior. The AI will respond according to the selected role's guidelines.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR5</div>
                  <div className="mr-content">
                    <h4>Low-Cost Iteration</h4>
                    <p>Create conversation branches to explore different directions. Generate variants with different temperatures. Branch conversations persist in database for later review.</p>
                  </div>
                </div>

                {/* MR6-MR10 */}
                <div className="mr-card">
                  <div className="mr-number">MR6</div>
                  <div className="mr-content">
                    <h4>Cross-Model Experimentation</h4>
                    <p>Send the same prompt to multiple AI models (GPT-4, Claude, Gemini) and compare outputs side-by-side. Track latency, token usage, and your ratings to find the best model for each task type.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR7</div>
                  <div className="mr-content">
                    <h4>Failure Tolerance Learning</h4>
                    <p>Frame failed iterations as learning opportunities. The system analyzes what went wrong, builds a personal "anti-pattern library", and shows statistics like "success often requires X failed attempts".</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR8</div>
                  <div className="mr-content">
                    <h4>Task Characteristic Recognition</h4>
                    <p>Automatically identifies task attributes (criticality, familiarity, time pressure) and adjusts AI behavior accordingly. High-stakes unfamiliar tasks get more verification prompts; routine tasks get streamlined assistance.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR9</div>
                  <div className="mr-content">
                    <h4>Dynamic Trust Calibration</h4>
                    <p>Provides context-specific trust guidance: 85% for grammar checks, 40% for math derivations, 5% for academic citations. Tracks your verification findings to personalize recommendations.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR10</div>
                  <div className="mr-content">
                    <h4>Cost-Benefit Analysis</h4>
                    <p>Shows explicit trade-off analysis: estimated time savings, quality risk level, and learning opportunity cost. Warns when AI use may reduce practice opportunities for important skills.</p>
                  </div>
                </div>

                {/* MR11-MR15 */}
                <div className="mr-card">
                  <div className="mr-number">MR11</div>
                  <div className="mr-content">
                    <h4>Integrated Verification</h4>
                    <p>One-click verification tools: run code snippets, check math with calculators, verify citations via Google Scholar. Tracks what you verified and error rates discovered.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR12</div>
                  <div className="mr-content">
                    <h4>Critical Thinking Scaffolding</h4>
                    <p>Socratic questioning prompts: "What assumptions does this make?", "What are counter-examples?", "Is the logic complete?" Domain-specific checklists for code, writing, and math.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR13</div>
                  <div className="mr-content">
                    <h4>Transparent Uncertainty</h4>
                    <p>Shows AI confidence levels per statement (high/medium/low). Marks knowledge boundaries: "This information may be outdated" or "This requires domain expert verification".</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR14</div>
                  <div className="mr-content">
                    <h4>Guided Reflection Mechanism</h4>
                    <p>Post-response prompts: "How did this help you?", "How much did you understand?", "Could you do this without AI?" Builds learning logs and metacognitive awareness.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR15</div>
                  <div className="mr-content">
                    <h4>Metacognitive Strategy Guide</h4>
                    <p>Just-in-time strategy tips: "Try thinking 5 minutes before asking AI", "Mark suspicious parts for verification", "Track AI error patterns". Prevents Pattern F formation.</p>
                  </div>
                </div>

                {/* MR16-MR19 */}
                <div className="mr-card">
                  <div className="mr-number">MR16</div>
                  <div className="mr-content">
                    <h4>Skill Atrophy Prevention</h4>
                    <p>Monitors your independent task completion rate over time. Warns when skills may be declining (e.g., "30% independent 3 months ago → 5% now"). Suggests "AI-free practice" exercises.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR17</div>
                  <div className="mr-content">
                    <h4>Learning Process Visualization</h4>
                    <p>Visualizes your knowledge growth, concept connections, and skill trajectories. Shows metacognitive dashboard: verification rate, reflection depth, strategy diversity.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR18</div>
                  <div className="mr-content">
                    <h4>Over-Reliance Warning</h4>
                    <p>Detects Pattern F danger signs: no verification, short prompts, accepting first output. Triggers when 20+ queries have zero verification. Recommends critical thinking exercises.</p>
                  </div>
                </div>

                <div className="mr-card">
                  <div className="mr-number">MR19</div>
                  <div className="mr-content">
                    <h4>Metacognitive Capability Assessment</h4>
                    <p>Evaluates 12 dimensions: Planning, Monitoring, Evaluation, Critical Thinking, Reasoning, Problem-Solving, Reflection, Self-Regulation, Knowledge Application, Adaptability, Awareness, Strategic Thinking.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'patterns' && (
            <div className="help-section">
              <h2>AI Usage Patterns</h2>

              <div className="help-intro-box">
                <h3>Understanding Your Collaboration Pattern</h3>
                <p>
                  The system identifies 6 distinct patterns (A-F) based on your verification
                  and modification behaviors. Each pattern reflects a different collaboration style
                  with varying levels of cognitive engagement.
                </p>
              </div>

              <div className="pattern-grid">
                <div className="pattern-card pattern-a">
                  <div className="pattern-badge">Pattern A</div>
                  <h4>Strategic Decomposition</h4>
                  <p>
                    <strong>Characteristics:</strong> Sophisticated pre-planning, breaks complex problems into sub-tasks, strong cognitive control over AI collaboration
                  </p>
                  <p>
                    <strong>Risk Level:</strong> <span className="risk-low">Low</span> — High planning and control
                  </p>
                </div>

                <div className="pattern-card pattern-b">
                  <div className="pattern-badge">Pattern B</div>
                  <h4>Iterative Refinement</h4>
                  <p>
                    <strong>Characteristics:</strong> Rapid experimentation with 3-7 iterations, active learning through trial and error, continuous improvement
                  </p>
                  <p>
                    <strong>Risk Level:</strong> <span className="risk-low">Low-Medium</span> — Active experimentation
                  </p>
                </div>

                <div className="pattern-card pattern-c">
                  <div className="pattern-badge">Pattern C</div>
                  <h4>Context-Sensitive Adaptation</h4>
                  <p>
                    <strong>Characteristics:</strong> Flexible strategies adapting to task complexity, switches approaches based on context (44.9% of users)
                  </p>
                  <p>
                    <strong>Risk Level:</strong> <span className="risk-medium">Medium</span> — Balanced but variable
                  </p>
                </div>

                <div className="pattern-card pattern-d">
                  <div className="pattern-badge">Pattern D</div>
                  <h4>Deep Verification</h4>
                  <p>
                    <strong>Characteristics:</strong> Systematic verification, parallel problem-solving, thorough validation of AI outputs
                  </p>
                  <p>
                    <strong>Risk Level:</strong> <span className="risk-low">Low-Medium</span> — Strong verification habits
                  </p>
                </div>

                <div className="pattern-card pattern-e">
                  <div className="pattern-badge">Pattern E</div>
                  <h4>Pedagogical Reflection</h4>
                  <p>
                    <strong>Characteristics:</strong> Learning-oriented approach, uses AI for self-development, focuses on understanding rather than just results
                  </p>
                  <p>
                    <strong>Risk Level:</strong> <span className="risk-low">Low</span> — Growth mindset
                  </p>
                </div>

                <div className="pattern-card pattern-f">
                  <div className="pattern-badge">Pattern F</div>
                  <h4>Passive Dependency</h4>
                  <p>
                    <strong>Characteristics:</strong> Minimal metacognitive engagement, accepts AI outputs without verification, passive consumption
                  </p>
                  <p>
                    <strong>Risk Level:</strong> <span className="risk-critical">Critical</span> — HIGH RISK for skill atrophy
                  </p>
                  <p>
                    <strong>Indicators:</strong> Low verification rate, short prompts, no iterative refinement, high acceptance rate
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="help-section">
              <h2>Frequently Asked Questions</h2>

              <div className="faq-list">
                <div className="faq-item">
                  <h4>What does the system track?</h4>
                  <p>
                    The system tracks your verification behavior (do you check AI outputs?),
                    modification behavior (do you edit or improve suggestions?), and overall
                    engagement patterns during chat sessions.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>How often should I complete MR19 assessments?</h4>
                  <p>
                    The system will prompt you periodically (typically every 15 interactions or when
                    you reach certain milestones). You can also manually access it from the Patterns page.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>What if I don't want MR interventions?</h4>
                  <p>
                    You can dismiss individual interventions, but we recommend engaging with them to
                    prevent skill degradation and improve your AI collaboration effectiveness.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>How is my pattern calculated?</h4>
                  <p>
                    Your pattern (A-F) is determined by analyzing your verification and modification
                    rates over the last 15 interactions, with a threshold of 50% for each dimension.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>Can I see my historical data?</h4>
                  <p>
                    Yes! Visit the Dashboard to see metrics over time, and the Patterns page for
                    detailed pattern analysis and metacognitive scores.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>What are the 12 metacognitive dimensions?</h4>
                  <p>
                    The MR19 assessment evaluates: Planning, Monitoring, Evaluation, Critical Thinking,
                    Reasoning, Problem-Solving, Reflection, Self-Regulation, Knowledge Application,
                    Adaptability, Metacognitive Awareness, and Strategic Thinking.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>How do I improve from Pattern F (Passive Dependency)?</h4>
                  <p>
                    Start by actively verifying AI outputs before accepting them. Use MR12 Critical Thinking
                    to question AI responses, try MR11 Verification workflow, and engage with MR interventions.
                    Building verification habits will help you develop healthier AI collaboration patterns.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>Is my data private?</h4>
                  <p>
                    Yes, all your interaction data, assessments, and patterns are private to your account.
                    The system only uses this data to provide personalized recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HelpPage;

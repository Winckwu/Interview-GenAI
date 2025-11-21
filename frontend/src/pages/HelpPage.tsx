import React, { useState } from 'react';
import './HelpPage.css';
import '../styles/components.css';

/**
 * Help Page
 * Comprehensive documentation for MR mechanisms, FAQ, and terminology
 */
const HelpPage: React.FC = () => {
  const [activeMR, setActiveMR] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'mrs' | 'faq' | 'glossary'>('overview');

  const mrDefinitions = [
    {
      id: 'MR1',
      name: 'Task Decomposition Scaffold',
      category: 'Planning & Strategy',
      description: 'Guides users to break down complex tasks into manageable subtasks before engaging with AI.',
      trigger: 'Activated when user submits overly complex or multi-faceted questions without clear decomposition.',
      benefits: [
        'Improves task clarity and focus',
        'Reduces AI response ambiguity',
        'Enhances problem-solving skills',
        'Prevents overwhelming AI with vague requests'
      ],
      howToUse: 'When triggered, follow the step-by-step decomposition interface. Identify main task components, break them into subtasks, and prioritize execution order.'
    },
    {
      id: 'MR2',
      name: 'Process Transparency',
      category: 'Monitoring & Awareness',
      description: 'Reveals AI reasoning process and decision-making steps to improve understanding.',
      trigger: 'Triggered when users accept AI responses without understanding the underlying logic.',
      benefits: [
        'Builds mental models of AI capabilities',
        'Enhances critical evaluation of AI outputs',
        'Identifies reasoning gaps or errors',
        'Improves learning transfer to new tasks'
      ],
      howToUse: 'Review the timeline view showing AI reasoning steps. Compare different versions of responses. Ask follow-up questions about specific reasoning stages.'
    },
    {
      id: 'MR3',
      name: 'Human Agency Control',
      category: 'Regulation & Control',
      description: 'Empowers users to control intervention intensity and maintain decision-making authority.',
      trigger: 'Activated for users showing passive acceptance or over-reliance on AI suggestions.',
      benefits: [
        'Preserves user autonomy',
        'Customizes intervention to comfort level',
        'Prevents learned helplessness',
        'Maintains human-in-the-loop decision making'
      ],
      howToUse: 'Adjust intervention level (Minimal/Moderate/Active) based on your expertise and task complexity. Review and modify system suggestions.'
    },
    {
      id: 'MR4',
      name: 'Role Definition Guidance',
      category: 'Planning & Strategy',
      description: 'Helps users explicitly define AI and human roles in collaborative tasks.',
      trigger: 'Triggered when role boundaries are unclear or users delegate inappropriate tasks to AI.',
      benefits: [
        'Clarifies responsibility distribution',
        'Optimizes human-AI collaboration',
        'Prevents skill degradation in delegated areas',
        'Improves task efficiency'
      ],
      howToUse: 'Select role templates or customize your own. Define what AI should do (generate, analyze, summarize) vs. what you retain (judge, decide, verify).'
    },
    {
      id: 'MR5',
      name: 'Low-Cost Iteration',
      category: 'Experimentation & Learning',
      description: 'Encourages rapid experimentation with different prompts and approaches.',
      trigger: 'Activated when users accept first AI response without exploring alternatives.',
      benefits: [
        'Discovers better solutions',
        'Builds prompt engineering skills',
        'Reveals AI capability boundaries',
        'Reduces anchoring bias to initial responses'
      ],
      howToUse: 'Try rephrasing your question, changing specificity level, or requesting different formats. Compare results across iterations.'
    },
    {
      id: 'MR6',
      name: 'Cross-Model Experimentation',
      category: 'Experimentation & Learning',
      description: 'Facilitates comparison of responses from different AI models.',
      trigger: 'Triggered for users relying exclusively on single AI model without comparison.',
      benefits: [
        'Exposes model-specific biases',
        'Identifies capability differences',
        'Improves calibration of trust',
        'Enhances critical evaluation skills'
      ],
      howToUse: 'Submit same query to multiple models. Compare response quality, accuracy, and perspective. Note strengths/weaknesses of each.'
    },
    {
      id: 'MR7',
      name: 'Failure Tolerance Learning',
      category: 'Monitoring & Awareness',
      description: 'Normalizes AI errors as learning opportunities rather than system failures.',
      trigger: 'Activated when users show frustration or abandonment after AI mistakes.',
      benefits: [
        'Builds resilient AI usage patterns',
        'Improves error detection skills',
        'Reduces over-trust after initial success',
        'Encourages productive failure analysis'
      ],
      howToUse: 'When AI makes a mistake, analyze why it occurred. Document error patterns. Adjust prompts to avoid similar issues.'
    },
    {
      id: 'MR8',
      name: 'Task Characteristic Recognition',
      category: 'Planning & Strategy',
      description: 'Helps users identify task properties that affect AI suitability.',
      trigger: 'Triggered when users apply AI inappropriately to unsuitable task types.',
      benefits: [
        'Matches tasks to AI strengths',
        'Prevents misapplication of AI',
        'Improves task outcome quality',
        'Builds task categorization skills'
      ],
      howToUse: 'Evaluate task complexity, creativity requirement, domain knowledge, and verification feasibility before engaging AI.'
    },
    {
      id: 'MR9',
      name: 'Dynamic Trust Calibration',
      category: 'Monitoring & Awareness',
      description: 'Adjusts user trust in AI based on performance feedback and task context.',
      trigger: 'Activated when user trust level mismatches AI actual reliability.',
      benefits: [
        'Prevents over-trust and under-trust',
        'Improves verification decisions',
        'Adapts to different task domains',
        'Builds accurate mental models of AI'
      ],
      howToUse: 'Monitor trust score feedback. Adjust verification intensity based on task criticality and AI confidence.'
    },
    {
      id: 'MR10',
      name: 'Cost-Benefit Analysis',
      category: 'Evaluation & Reflection',
      description: 'Prompts explicit evaluation of AI usage efficiency vs. manual approaches.',
      trigger: 'Triggered when users apply AI without considering time/quality trade-offs.',
      benefits: [
        'Optimizes AI usage decisions',
        'Identifies when manual work is better',
        'Improves resource allocation',
        'Builds strategic AI usage skills'
      ],
      howToUse: 'Estimate time saved vs. quality risk. Consider learning value of manual work. Decide AI usage threshold for task types.'
    },
    {
      id: 'MR11',
      name: 'Integrated Verification',
      category: 'Evaluation & Reflection',
      description: 'Scaffolds systematic verification of AI outputs with external sources.',
      trigger: 'Activated when users accept AI responses without verification, especially for factual claims.',
      benefits: [
        'Catches AI hallucinations and errors',
        'Builds fact-checking habits',
        'Improves information literacy',
        'Reduces propagation of misinformation'
      ],
      howToUse: 'Identify verifiable claims in AI response. Check against authoritative sources. Document verification results.'
    },
    {
      id: 'MR12',
      name: 'Critical Thinking Scaffolding',
      category: 'Evaluation & Reflection',
      description: 'Prompts deeper analysis through Socratic questioning of AI responses.',
      trigger: 'Triggered when users show surface-level engagement without critical analysis.',
      benefits: [
        'Deepens understanding',
        'Identifies logical gaps',
        'Improves analytical skills',
        'Prevents passive consumption'
      ],
      howToUse: 'Answer scaffolded questions: What assumptions are made? What evidence supports this? What alternatives exist? What are limitations?'
    },
    {
      id: 'MR13',
      name: 'Transparent Uncertainty',
      category: 'Monitoring & Awareness',
      description: 'Makes AI confidence levels and uncertainty visible to users.',
      trigger: 'Activated when AI provides uncertain responses without clear confidence indicators.',
      benefits: [
        'Calibrates appropriate skepticism',
        'Guides verification priority',
        'Prevents blind trust',
        'Improves risk assessment'
      ],
      howToUse: 'Review confidence scores for different parts of response. Prioritize verification of low-confidence claims.'
    },
    {
      id: 'MR14',
      name: 'Guided Reflection Mechanism',
      category: 'Evaluation & Reflection',
      description: 'Structured reflection prompts after task completion to consolidate learning.',
      trigger: 'Triggered at session end to encourage metacognitive reflection.',
      benefits: [
        'Consolidates learning',
        'Identifies improvement opportunities',
        'Builds self-awareness',
        'Transfers knowledge to future tasks'
      ],
      howToUse: 'Reflect on: What did you learn? What worked well? What would you do differently? How will you apply this knowledge?'
    },
    {
      id: 'MR15',
      name: 'Metacognitive Strategy Guide',
      category: 'Planning & Strategy',
      description: 'Recommends metacognitive strategies based on task type and user pattern.',
      trigger: 'Activated when users lack appropriate metacognitive strategies for current task.',
      benefits: [
        'Expands strategy repertoire',
        'Matches strategies to contexts',
        'Improves self-regulation',
        'Enhances learning efficiency'
      ],
      howToUse: 'Review recommended strategies (planning, monitoring, evaluation, regulation). Select and apply most relevant to current task.'
    },
    {
      id: 'MR16',
      name: 'Skill Atrophy Prevention',
      category: 'Regulation & Control',
      description: 'Alerts users when excessive AI delegation may cause skill degradation.',
      trigger: 'Triggered when analysis shows declining manual performance in delegated skill areas.',
      benefits: [
        'Preserves critical skills',
        'Maintains competence baseline',
        'Balances automation with learning',
        'Prevents deskilling'
      ],
      howToUse: 'Review skill atrophy warnings. Schedule manual practice for flagged skills. Alternate between AI-assisted and manual work.'
    },
    {
      id: 'MR17',
      name: 'Learning Process Visualization',
      category: 'Monitoring & Awareness',
      description: 'Visualizes learning progress and pattern evolution over time.',
      trigger: 'Periodically shown to illustrate behavioral changes and learning trajectory.',
      benefits: [
        'Provides progress visibility',
        'Motivates continued improvement',
        'Identifies stagnation areas',
        'Celebrates growth milestones'
      ],
      howToUse: 'Review learning curves, pattern evolution charts, and skill development graphs. Set improvement goals based on visualizations.'
    },
    {
      id: 'MR18',
      name: 'Over-Reliance Warning',
      category: 'Regulation & Control',
      description: 'Alerts when dependency metrics indicate unhealthy reliance on AI.',
      trigger: 'Activated when AI reliance score exceeds threshold or shows concerning trends.',
      benefits: [
        'Prevents learned helplessness',
        'Maintains independent thinking',
        'Balances AI usage',
        'Protects cognitive autonomy'
      ],
      howToUse: 'Review reliance metrics. Implement suggested mitigation strategies. Set AI usage boundaries for specific task types.'
    },
    {
      id: 'MR19',
      name: 'Metacognitive Capability Assessment',
      category: 'Evaluation & Reflection',
      description: 'Comprehensive 36-item assessment measuring metacognitive awareness across 12 dimensions.',
      trigger: 'Prompted at system onboarding and periodically for progress tracking.',
      benefits: [
        'Establishes metacognitive baseline',
        'Tracks improvement over time',
        'Personalizes intervention strategies',
        'Identifies specific weaknesses'
      ],
      howToUse: 'Complete all 36 items honestly. Review dimensional scores (P1-P4, M1-M3, E1-E3, R1-R2). Use results to guide intervention focus.'
    }
  ];

  const faqItems = [
    {
      question: 'What is the AI Pattern Recognition System?',
      answer: 'The system analyzes your interactions with AI to identify behavioral patterns (A-F) and provides personalized interventions to improve your AI usage efficiency while preventing skill degradation.'
    },
    {
      question: 'What do the pattern letters (A-F) mean?',
      answer: 'Patterns represent different AI usage behaviors:\n• Pattern A/B: High metacognitive awareness, strategic AI use, strong verification\n• Pattern C/D: Moderate awareness, inconsistent verification\n• Pattern E/F: Low awareness, passive AI consumption, high dependency risk'
    },
    {
      question: 'How are MR interventions different from regular notifications?',
      answer: 'MR interventions are intelligent, context-aware mechanisms grounded in metacognitive theory. They trigger based on your specific behavioral patterns and provide actionable scaffolding rather than generic tips.'
    },
    {
      question: 'Can I turn off MR interventions?',
      answer: 'Yes, using MR3 (Human Agency Control), you can adjust intervention intensity from Minimal to Active. However, some critical warnings (like MR18 Over-Reliance) remain visible for your safety.'
    },
    {
      question: 'How often should I complete the MR19 assessment?',
      answer: 'Complete it once at onboarding to establish your baseline. We recommend retaking every 4-6 weeks to track metacognitive development. The system will prompt you when appropriate.'
    },
    {
      question: 'Why does the system recommend verifying AI responses?',
      answer: 'AI models can produce hallucinations (confident but incorrect information). Verification (MR11) builds critical thinking skills and prevents blind trust, especially for factual claims or critical decisions.'
    },
    {
      question: 'What is the 15-interaction threshold?',
      answer: 'The system needs minimum 15 interactions to reliably detect your behavioral pattern. Before this threshold, metrics show as locked (🔒) to prevent misleading early assessments.'
    },
    {
      question: 'How is my privacy protected?',
      answer: 'All interaction data is encrypted and stored securely. Pattern analysis occurs on aggregated behavioral metrics, not raw conversation content. You can delete your data anytime from Settings.'
    },
    {
      question: 'Can I see my historical pattern evolution?',
      answer: 'Yes! Visit the "Pattern Evolution" page to see your behavioral changes over time, including improvements, migrations, and oscillations between patterns.'
    },
    {
      question: 'What should I do if I disagree with my pattern classification?',
      answer: 'Patterns are probabilistic assessments based on observed behavior. If you believe it\'s inaccurate, continue interacting naturally—the system adapts. You can also review the specific metrics driving the classification on the Patterns page.'
    }
  ];

  const glossaryTerms = [
    { term: 'AI Reliance Score', definition: 'Metric (0-1) measuring degree of dependency on AI outputs without independent verification or critical evaluation.' },
    { term: 'Behavioral Pattern', definition: 'Classification (A-F) of AI usage behavior based on metacognitive awareness, verification habits, and strategic engagement.' },
    { term: 'Confidence Score', definition: 'System certainty (0-100%) in pattern classification, based on data quantity and behavioral consistency.' },
    { term: 'Context Switching', definition: 'Frequency of shifting between different task types or cognitive modes during AI interaction sessions.' },
    { term: 'Metacognition', definition: 'Awareness and regulation of one\'s own cognitive processes—"thinking about thinking." Includes planning, monitoring, evaluating, and regulating.' },
    { term: 'Metacognitive Regulation (MR)', definition: 'Intelligent intervention mechanisms (MR1-MR19) designed to improve metacognitive awareness and strategic AI usage.' },
    { term: 'MR19 Assessment', definition: '36-item questionnaire measuring metacognitive abilities across 12 dimensions: Planning (P1-P4), Monitoring (M1-M3), Evaluation (E1-E3), Regulation (R1-R2).' },
    { term: 'Pattern Stability', definition: 'Measure (0-1) of how consistently a user exhibits a particular behavioral pattern over time.' },
    { term: 'Skill Atrophy', definition: 'Degradation of manual abilities due to excessive delegation to AI systems (e.g., reduced writing, coding, or analytical skills).' },
    { term: 'Streak Length', definition: 'Number of consecutive interactions maintaining the same dominant behavioral pattern.' },
    { term: 'Trend Direction', definition: 'Pattern evolution trajectory: converging (stabilizing), diverging (shifting), oscillating (inconsistent), or stable (unchanged).' },
    { term: 'Trust Calibration', definition: 'Alignment between user trust level and AI actual reliability for given task types—prevents both over-trust and under-trust.' },
    { term: 'Verification Rate', definition: 'Percentage of AI responses that user independently verifies with external sources or critical analysis.' }
  ];

  return (
    <div className="page help-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>📚 Help & Documentation</h1>
        <p className="page-subtitle">
          Comprehensive guide to the AI Pattern Recognition System and Metacognitive Regulation mechanisms
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="help-nav">
        <button
          className={`help-nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📖 Overview
        </button>
        <button
          className={`help-nav-tab ${activeSection === 'mrs' ? 'active' : ''}`}
          onClick={() => setActiveSection('mrs')}
        >
          🧠 MR Mechanisms (1-19)
        </button>
        <button
          className={`help-nav-tab ${activeSection === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveSection('faq')}
        >
          ❓ FAQ
        </button>
        <button
          className={`help-nav-tab ${activeSection === 'glossary' ? 'active' : ''}`}
          onClick={() => setActiveSection('glossary')}
        >
          📝 Glossary
        </button>
      </div>

      {/* Section Content */}
      <div className="help-content">
        {activeSection === 'overview' && (
          <div className="help-section">
            <h2>System Overview</h2>

            <div className="help-card">
              <h3>🎯 What is this system?</h3>
              <p>
                The AI Pattern Recognition System is an intelligent platform that analyzes your interactions
                with AI tools to identify behavioral patterns and provide personalized metacognitive interventions.
                Our goal is to help you develop more effective, sustainable AI usage strategies while preserving
                critical thinking skills.
              </p>
            </div>

            <div className="help-card">
              <h3>🔄 How it works</h3>
              <ol className="help-list">
                <li><strong>Pattern Detection:</strong> As you interact with AI, the system continuously analyzes your behavior across dimensions like task decomposition, verification habits, and trust calibration.</li>
                <li><strong>Classification:</strong> Based on accumulated data (minimum 15 interactions), you're classified into one of six behavioral patterns (A-F) representing different levels of metacognitive awareness.</li>
                <li><strong>Intervention Delivery:</strong> Metacognitive Regulation mechanisms (MR1-MR19) trigger contextually based on your pattern and current behavior to provide targeted guidance.</li>
                <li><strong>Evolution Tracking:</strong> The system monitors how your patterns evolve over time, celebrating improvements and alerting to concerning trends.</li>
              </ol>
            </div>

            <div className="help-card">
              <h3>📊 Key Features</h3>
              <div className="feature-grid">
                <div className="feature-item">
                  <h4>Pattern Recognition (A-F)</h4>
                  <p>Identifies your AI usage behavior patterns from strategic (A) to passive (F)</p>
                </div>
                <div className="feature-item">
                  <h4>MR19 Assessment</h4>
                  <p>36-item metacognitive evaluation across 12 dimensions</p>
                </div>
                <div className="feature-item">
                  <h4>Intelligent Interventions</h4>
                  <p>19 MR mechanisms providing real-time guidance</p>
                </div>
                <div className="feature-item">
                  <h4>Evolution Tracking</h4>
                  <p>Monitor behavioral changes and learning progress</p>
                </div>
              </div>
            </div>

            <div className="help-card workflow-card">
              <h3>🔀 System Workflow</h3>
              <div className="workflow-diagram">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Initial Assessment</h4>
                    <p>Complete MR19 questionnaire (optional but recommended)</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>AI Interactions</h4>
                    <p>Use the AI Chat feature naturally (minimum 15 interactions)</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Pattern Detection</h4>
                    <p>System identifies your behavioral pattern (A-F)</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>MR Interventions</h4>
                    <p>Receive personalized guidance based on your pattern</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h4>Evolution & Growth</h4>
                    <p>Track improvements and pattern migrations over time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'mrs' && (
          <div className="help-section">
            <h2>Metacognitive Regulation (MR) Mechanisms</h2>
            <p className="section-intro">
              19 intelligent intervention mechanisms designed to enhance your metacognitive awareness
              and strategic AI usage. Click each MR to learn more about its purpose, triggers, and usage.
            </p>

            <div className="mr-categories">
              {['Planning & Strategy', 'Monitoring & Awareness', 'Evaluation & Reflection', 'Regulation & Control', 'Experimentation & Learning'].map(category => (
                <div key={category} className="mr-category">
                  <h3>{category}</h3>
                  <div className="mr-grid">
                    {mrDefinitions.filter(mr => mr.category === category).map(mr => (
                      <div
                        key={mr.id}
                        className={`mr-card ${activeMR === mr.id ? 'expanded' : ''}`}
                        onClick={() => setActiveMR(activeMR === mr.id ? null : mr.id)}
                      >
                        <div className="mr-card-header">
                          <h4>{mr.id}: {mr.name}</h4>
                          <span className="expand-icon">{activeMR === mr.id ? '−' : '+'}</span>
                        </div>
                        <p className="mr-description">{mr.description}</p>

                        {activeMR === mr.id && (
                          <div className="mr-details">
                            <div className="mr-detail-section">
                              <h5>🎯 When it triggers:</h5>
                              <p>{mr.trigger}</p>
                            </div>
                            <div className="mr-detail-section">
                              <h5>✅ Benefits:</h5>
                              <ul>
                                {mr.benefits.map((benefit, idx) => (
                                  <li key={idx}>{benefit}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="mr-detail-section">
                              <h5>📋 How to use:</h5>
                              <p>{mr.howToUse}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="help-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqItems.map((item, idx) => (
                <div key={idx} className="faq-item">
                  <h3 className="faq-question">
                    <span className="faq-icon">Q:</span>
                    {item.question}
                  </h3>
                  <div className="faq-answer">
                    <span className="faq-icon">A:</span>
                    <p style={{ whiteSpace: 'pre-line' }}>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'glossary' && (
          <div className="help-section">
            <h2>Terminology Glossary</h2>
            <p className="section-intro">
              Key terms and concepts used throughout the AI Pattern Recognition System.
            </p>
            <div className="glossary-list">
              {glossaryTerms.map((item, idx) => (
                <div key={idx} className="glossary-item">
                  <dt className="glossary-term">{item.term}</dt>
                  <dd className="glossary-definition">{item.definition}</dd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;

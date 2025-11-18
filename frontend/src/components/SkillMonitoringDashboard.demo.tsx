import React, { useState } from 'react';
import SkillMonitoringDashboard from './SkillMonitoringDashboard';

/**
 * SkillMonitoringDashboard Demo (MR16)
 *
 * Real-world scenarios based on interview findings:
 * - Scenario 1 (I38): Career crisis from skill degradation
 * - Scenario 2 (I12): Exam vs homework performance gap
 * - Scenario 3: Long-term skill maintenance issue
 * - Scenario 4: All green - healthy skill usage
 * - Scenario 5: Mixed - some skills degrading, others stable
 */

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  situation: string;
  findings: string[];
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'career-crisis',
    title: 'I38 Career Crisis Scenario',
    description: 'Over-reliance on AI leading to critical skill loss',
    situation:
      'A developer used AI for 95% of coding tasks over 6 months. When interviewed for a job, they failed technical test because they couldn\'t write code independently.',
    findings: [
      'Python: Baseline 8.5 → Current 4.2 (51% decline) - SEVERE',
      'Algorithm Design: Baseline 8.0 → Current 3.8 (53% decline) - SEVERE',
      'Problem Solving: Baseline 7.5 → Current 4.1 (45% decline) - SEVERE',
      'AI usage: Increased from 20% to 95% over 6 months',
    ],
  },
  {
    id: 'exam-gap',
    title: 'I12 Exam vs Homework Gap',
    description: 'High homework grades but low exam performance',
    situation:
      'A student has 85% homework average (with AI help) but 45% exam score (without AI). Test scores don\'t reflect true understanding.',
    findings: [
      'Writing: Baseline 8.0 → Current 6.5 (19% decline) - EARLY WARNING',
      'Analysis: Baseline 7.8 → Current 5.2 (33% decline) - SEVERE',
      'Math: Baseline 7.5 → Current 4.9 (35% decline) - SEVERE',
      'AI usage: 70% for homework, 0% during exams (50% gap)',
    ],
  },
  {
    id: 'long-term',
    title: 'Long-term Skill Maintenance',
    description: 'Gradual skill loss from reduced independent practice',
    situation:
      'An engineer hasn\'t written SQL queries from scratch in 3 months. When needed for a task, they struggled to remember syntax and optimization techniques.',
    findings: [
      'SQL: Baseline 8.2 → Current 5.8 (29% decline) - MID WARNING',
      'Database Design: Baseline 7.5 → Current 5.1 (32% decline) - SEVERE',
      'Performance Tuning: Baseline 7.8 → Current 4.5 (42% decline) - SEVERE',
      'Independent work: Decreased from 50% to 15% over 3 months',
    ],
  },
  {
    id: 'healthy',
    title: 'Healthy Skill Management',
    description: 'Balanced use of AI with regular independent practice',
    situation:
      'A developer uses AI for 35% of tasks but regularly practices independently. They complete weekly coding challenges without assistance.',
    findings: [
      'Python: Baseline 8.0 → Current 7.9 (1% decline) - STABLE',
      'Testing: Baseline 7.5 → Current 7.4 (1% decline) - STABLE',
      'System Design: Baseline 7.8 → Current 7.7 (1% decline) - STABLE',
      'Independent work: Maintained at 65% consistently',
    ],
  },
  {
    id: 'mixed',
    title: 'Mixed Skills - Selective Degradation',
    description: 'Some skills degrading while others remain strong',
    situation:
      'A data scientist relies heavily on AI for Python but continues to practice statistics independently. Python skills declining, stats skills stable.',
    findings: [
      'Python: Baseline 8.5 → Current 5.8 (32% decline) - SEVERE',
      'Statistics: Baseline 7.8 → Current 7.6 (2% decline) - STABLE',
      'Analysis: Baseline 8.0 → Current 6.2 (22% decline) - MID WARNING',
      'Python AI usage: 85% (↑), Stats AI usage: 20% (→)',
    ],
  },
];

/**
 * Individual Scenario Demo Component
 */
interface ScenarioDemoProps {
  scenario: DemoScenario;
}

const ScenarioDemo: React.FC<ScenarioDemoProps> = ({ scenario }) => {
  // Generate realistic skill data for each scenario
  const getSkillsForScenario = (scenarioId: string) => {
    const baseDate = new Date();

    switch (scenarioId) {
      case 'career-crisis':
        return [
          {
            name: 'Python Programming',
            category: 'programming' as const,
            baseline: 8.5,
            current: 4.2,
            lastMeasured: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 180 * 24 * 60 * 60 * 1000), score: 8.5 },
              { date: new Date(baseDate.getTime() - 150 * 24 * 60 * 60 * 1000), score: 8.2 },
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.5 },
              { date: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000), score: 6.1 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 5.0 },
              { date: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000), score: 4.5 },
              { date: baseDate, score: 4.2 },
            ],
          },
          {
            name: 'Algorithm Design',
            category: 'analysis' as const,
            baseline: 8.0,
            current: 3.8,
            lastMeasured: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 180 * 24 * 60 * 60 * 1000), score: 8.0 },
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.2 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 4.9 },
              { date: baseDate, score: 3.8 },
            ],
          },
          {
            name: 'Problem Solving',
            category: 'analysis' as const,
            baseline: 7.5,
            current: 4.1,
            lastMeasured: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 180 * 24 * 60 * 60 * 1000), score: 7.5 },
              { date: new Date(baseDate.getTime() - 100 * 24 * 60 * 60 * 1000), score: 6.8 },
              { date: new Date(baseDate.getTime() - 50 * 24 * 60 * 60 * 1000), score: 4.5 },
              { date: baseDate, score: 4.1 },
            ],
          },
        ];

      case 'exam-gap':
        return [
          {
            name: 'Writing',
            category: 'writing' as const,
            baseline: 8.0,
            current: 6.5,
            lastMeasured: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 8.0 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.2 },
              { date: baseDate, score: 6.5 },
            ],
          },
          {
            name: 'Analysis',
            category: 'analysis' as const,
            baseline: 7.8,
            current: 5.2,
            lastMeasured: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.8 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 6.0 },
              { date: baseDate, score: 5.2 },
            ],
          },
          {
            name: 'Math',
            category: 'math' as const,
            baseline: 7.5,
            current: 4.9,
            lastMeasured: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.5 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 6.1 },
              { date: baseDate, score: 4.9 },
            ],
          },
        ];

      case 'long-term':
        return [
          {
            name: 'SQL',
            category: 'programming' as const,
            baseline: 8.2,
            current: 5.8,
            lastMeasured: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 8.2 },
              { date: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000), score: 7.5 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 6.5 },
              { date: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000), score: 6.1 },
              { date: baseDate, score: 5.8 },
            ],
          },
          {
            name: 'Database Design',
            category: 'design' as const,
            baseline: 7.5,
            current: 5.1,
            lastMeasured: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.5 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 6.2 },
              { date: baseDate, score: 5.1 },
            ],
          },
          {
            name: 'Performance Tuning',
            category: 'programming' as const,
            baseline: 7.8,
            current: 4.5,
            lastMeasured: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.8 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 5.8 },
              { date: baseDate, score: 4.5 },
            ],
          },
        ];

      case 'healthy':
        return [
          {
            name: 'Python Programming',
            category: 'programming' as const,
            baseline: 8.0,
            current: 7.9,
            lastMeasured: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
            trend: 'stable' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 8.0 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.95 },
              { date: baseDate, score: 7.9 },
            ],
          },
          {
            name: 'Testing',
            category: 'testing' as const,
            baseline: 7.5,
            current: 7.4,
            lastMeasured: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
            trend: 'stable' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.5 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.45 },
              { date: baseDate, score: 7.4 },
            ],
          },
          {
            name: 'System Design',
            category: 'design' as const,
            baseline: 7.8,
            current: 7.7,
            lastMeasured: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            trend: 'stable' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.8 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.75 },
              { date: baseDate, score: 7.7 },
            ],
          },
        ];

      case 'mixed':
        return [
          {
            name: 'Python Programming',
            category: 'programming' as const,
            baseline: 8.5,
            current: 5.8,
            lastMeasured: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 8.5 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.0 },
              { date: baseDate, score: 5.8 },
            ],
          },
          {
            name: 'Statistics',
            category: 'math' as const,
            baseline: 7.8,
            current: 7.6,
            lastMeasured: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000),
            trend: 'stable' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 7.8 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.7 },
              { date: baseDate, score: 7.6 },
            ],
          },
          {
            name: 'Analysis',
            category: 'analysis' as const,
            baseline: 8.0,
            current: 6.2,
            lastMeasured: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
            trend: 'declining' as const,
            measurements: [
              { date: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000), score: 8.0 },
              { date: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000), score: 7.1 },
              { date: baseDate, score: 6.2 },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const getUsagePatternsForScenario = (scenarioId: string) => {
    switch (scenarioId) {
      case 'career-crisis':
        return {
          'Python Programming': {
            withAI: 95,
            independent: 5,
            lastMonthAverage: 75,
            trend: 'increasing' as const,
          },
          'Algorithm Design': {
            withAI: 88,
            independent: 12,
            lastMonthAverage: 60,
            trend: 'increasing' as const,
          },
          'Problem Solving': {
            withAI: 92,
            independent: 8,
            lastMonthAverage: 65,
            trend: 'increasing' as const,
          },
        };

      case 'exam-gap':
        return {
          Writing: {
            withAI: 70,
            independent: 30,
            lastMonthAverage: 50,
            trend: 'increasing' as const,
          },
          Analysis: {
            withAI: 75,
            independent: 25,
            lastMonthAverage: 55,
            trend: 'increasing' as const,
          },
          Math: {
            withAI: 80,
            independent: 20,
            lastMonthAverage: 60,
            trend: 'increasing' as const,
          },
        };

      case 'long-term':
        return {
          SQL: {
            withAI: 85,
            independent: 15,
            lastMonthAverage: 65,
            trend: 'increasing' as const,
          },
          'Database Design': {
            withAI: 88,
            independent: 12,
            lastMonthAverage: 68,
            trend: 'increasing' as const,
          },
          'Performance Tuning': {
            withAI: 90,
            independent: 10,
            lastMonthAverage: 70,
            trend: 'increasing' as const,
          },
        };

      case 'healthy':
        return {
          'Python Programming': {
            withAI: 35,
            independent: 65,
            lastMonthAverage: 38,
            trend: 'stable' as const,
          },
          Testing: {
            withAI: 30,
            independent: 70,
            lastMonthAverage: 32,
            trend: 'stable' as const,
          },
          'System Design': {
            withAI: 40,
            independent: 60,
            lastMonthAverage: 42,
            trend: 'stable' as const,
          },
        };

      case 'mixed':
        return {
          'Python Programming': {
            withAI: 85,
            independent: 15,
            lastMonthAverage: 65,
            trend: 'increasing' as const,
          },
          Statistics: {
            withAI: 20,
            independent: 80,
            lastMonthAverage: 22,
            trend: 'stable' as const,
          },
          Analysis: {
            withAI: 65,
            independent: 35,
            lastMonthAverage: 50,
            trend: 'increasing' as const,
          },
        };

      default:
        return {};
    }
  };

  const skills = getSkillsForScenario(scenario.id);
  const usagePatterns = getUsagePatternsForScenario(scenario.id);

  return (
    <div style={styles.scenarioContainer}>
      <div style={styles.scenarioHeader}>
        <h3 style={styles.scenarioTitle}>{scenario.title}</h3>
        <p style={styles.scenarioDescription}>{scenario.description}</p>
      </div>

      <div style={styles.situationBox}>
        <h4 style={styles.situationTitle}>📋 Situation</h4>
        <p style={styles.situationText}>{scenario.situation}</p>
      </div>

      <div style={styles.findingsBox}>
        <h4 style={styles.findingsTitle}>📊 Key Findings</h4>
        <ul style={styles.findingsList}>
          {scenario.findings.map((finding, idx) => (
            <li key={idx} style={styles.findingItem}>
              {finding}
            </li>
          ))}
        </ul>
      </div>

      <SkillMonitoringDashboard
        skills={skills}
        usagePatterns={usagePatterns}
        onIntervention={(intervention) => {
          console.log('Intervention triggered:', intervention);
        }}
        onTaskComplete={(skillName) => {
          console.log('Task completed for:', skillName);
        }}
        showInterventionModal={false}
      />
    </div>
  );
};

/**
 * Main Demo Page
 */
export const SkillMonitoringDashboardDemo: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState('career-crisis');
  const currentScenario = DEMO_SCENARIOS.find((s) => s.id === activeScenario);

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>🎯 Skill Monitoring & Degradation Prevention (MR16)</h1>
        <p style={styles.pageSubtitle}>
          Based on interview findings: I38 (career crisis), I12 (exam vs homework gap), and other patterns
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.navTabs}>
        {DEMO_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            style={{
              ...styles.navTab,
              ...(activeScenario === scenario.id ? styles.navTabActive : {}),
            }}
            onClick={() => setActiveScenario(scenario.id)}
          >
            {scenario.title}
          </button>
        ))}
      </div>

      {/* Active Scenario */}
      {currentScenario && <ScenarioDemo scenario={currentScenario} />}

      {/* Framework Documentation */}
      <div style={styles.framework}>
        <h2 style={styles.frameworkTitle}>📚 Intervention Framework</h2>

        <div style={styles.frameworkGrid}>
          <div style={styles.frameworkCard}>
            <h3 style={{ ...styles.cardTitle, color: '#FFC107' }}>⚠️ Early Stage (10-20% decline)</h3>
            <div style={styles.cardContent}>
              <p><strong>Trigger:</strong> Skill score drops 10-20% below baseline</p>
              <p><strong>Response:</strong> Non-intrusive notification</p>
              <ul>
                <li>Gentle reminder message</li>
                <li>Suggestions for practice activities</li>
                <li>Optional quick assessment</li>
                <li>User can dismiss</li>
              </ul>
              <p style={{ color: '#666' }}><em>Goal: Raise awareness before it gets worse</em></p>
            </div>
          </div>

          <div style={styles.frameworkCard}>
            <h3 style={{ ...styles.cardTitle, color: '#FF9800' }}>⚠⚠ Mid Stage (20-30% decline)</h3>
            <div style={styles.cardContent}>
              <p><strong>Trigger:</strong> Skill score drops 20-30% below baseline</p>
              <p><strong>Response:</strong> Modal alert with recommendations</p>
              <ul>
                <li>Prominent warning modal</li>
                <li>Specific practice tasks recommended</li>
                <li>Formal assessment request</li>
                <li>User can still use AI but should reconsider</li>
              </ul>
              <p style={{ color: '#666' }}><em>Goal: Encourage action before critical loss</em></p>
            </div>
          </div>

          <div style={styles.frameworkCard}>
            <h3 style={{ ...styles.cardTitle, color: '#F44336' }}>✕ Severe (>30% decline)</h3>
            <div style={styles.cardContent}>
              <p><strong>Trigger:</strong> Skill score drops >30% below baseline</p>
              <p><strong>Response:</strong> Force intervention</p>
              <ul>
                <li>✕ AI assistance BLOCKED</li>
                <li>Mandatory independent assessment</li>
                <li>Must score ≥7/10 to re-enable AI</li>
                <li>Includes guided restoration program</li>
              </ul>
              <p style={{ color: '#666' }}><em>Goal: Prevent further skill loss, force recovery</em></p>
            </div>
          </div>
        </div>
      </div>

      {/* Research Context */}
      <div style={styles.research}>
        <h2 style={styles.researchTitle}>🔬 Research Background</h2>

        <div style={styles.researchContent}>
          <div style={styles.researchCase}>
            <h3>I38: Career Crisis Case</h3>
            <p>
              A developer over-relied on AI for 6 months, using it for 95% of coding tasks. When interviewing for a
              new job, they failed the technical test because they couldn't write code independently. This led to:
            </p>
            <ul>
              <li>Rejection from preferred companies</li>
              <li>Loss of confidence in programming ability</li>
              <li>Career setback and delayed advancement</li>
              <li>Recognition that they had "forgotten how to code"</li>
            </ul>
          </div>

          <div style={styles.researchCase}>
            <h3>I12: Exam vs Homework Gap</h3>
            <p>
              A student had strong homework grades (85%) when using AI help, but significantly lower exam scores (45%)
              without AI. Analysis showed:
            </p>
            <ul>
              <li>AI-assisted work: 85% average</li>
              <li>Independent test performance: 45% average</li>
              <li>40-point gap between AI-assisted and independent work</li>
              <li>Indicates skills weren't properly developed, only delegated</li>
            </ul>
          </div>

          <div style={styles.researchCase}>
            <h3>Other Key Findings</h3>
            <p>Multiple interviewees reported:</p>
            <ul>
              <li>Skills atrophy when used less frequently</li>
              <li>Difficulty switching back to independent mode</li>
              <li>Over-confidence in AI-assisted work quality</li>
              <li>Lack of awareness until performance gap revealed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>
          <strong>MR16 - Skill Degradation Prevention System</strong> monitors skill trajectory and intervenes
          progressively to prevent the I38 career crisis and I12 exam gap patterns from occurring.
        </p>
        <p>
          Through tiered interventions (early warning → mid-stage recommendations → severe force), users maintain
          healthy skill levels while still leveraging AI assistance appropriately.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    backgroundColor: '#fafafa',
    color: '#212121',
  },
  pageHeader: {
    marginBottom: '2rem',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '1.5rem',
  },
  pageTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1976d2',
  },
  pageSubtitle: {
    margin: 0,
    fontSize: '1.125rem',
    color: '#666666',
    lineHeight: 1.6,
  },
  navTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '1rem',
  },
  navTab: {
    padding: '0.75rem 1.25rem',
    background: 'white',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    color: '#666666',
  },
  navTabActive: {
    background: '#1976d2',
    color: 'white',
    borderColor: '#1976d2',
  },
  scenarioContainer: {
    marginBottom: '3rem',
  },
  scenarioHeader: {
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e0e0e0',
  },
  scenarioTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1976d2',
  },
  scenarioDescription: {
    margin: 0,
    color: '#666666',
    fontSize: '0.95rem',
  },
  situationBox: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    background: '#f0f4ff',
    borderRadius: '8px',
    borderLeft: '4px solid #1976d2',
  },
  situationTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1976d2',
  },
  situationText: {
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: '#555555',
  },
  findingsBox: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: '#fff3e0',
    borderRadius: '8px',
    borderLeft: '4px solid #FF9800',
  },
  findingsTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#E65100',
  },
  findingsList: {
    margin: 0,
    paddingLeft: '1.5rem',
  },
  findingItem: {
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    color: '#555555',
  },
  framework: {
    marginTop: '3rem',
    marginBottom: '3rem',
  },
  frameworkTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#212121',
    marginBottom: '1.5rem',
  },
  frameworkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  frameworkCard: {
    padding: '1.5rem',
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  cardTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  cardContent: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  research: {
    marginTop: '3rem',
    marginBottom: '2rem',
  },
  researchTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#212121',
    marginBottom: '1.5rem',
  },
  researchContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  researchCase: {
    padding: '1.5rem',
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  footer: {
    marginTop: '3rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    color: 'white',
    borderRadius: '8px',
    textAlign: 'center',
  },
};

export default SkillMonitoringDashboardDemo;

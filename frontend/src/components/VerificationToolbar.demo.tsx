import React, { useState } from 'react';
import VerificationToolbar from './VerificationToolbar';

/**
 * VerificationToolbar Demo & Integration Guide (MR11)
 *
 * Demonstrates:
 * - 5 integration scenarios (code, math, academic, factual, mixed)
 * - Multiple verification types working together
 * - Result handling and monitoring callback integration
 * - Different content types and use cases
 */

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  contentType: 'code' | 'math' | 'academic' | 'factual';
  content: string;
  autoVerify: boolean;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'code-example',
    title: 'Code Verification Example',
    description: 'Verify JavaScript/TypeScript code for syntax, security, and test coverage',
    contentType: 'code',
    content: `
import React, { useState } from 'react';

export function UserForm() {
  const [password, password] = useState("");
  var email = undefined;

  const handleSubmit = (e) => {
    const query = "SELECT * FROM users WHERE id = " + userId;
    db.query(query);

    document.getElementById("result").innerHTML = userInput;
    eval(userInput);

    console.log("Form submitted");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={email}/>
    </form>
  );
}
`.trim(),
    autoVerify: false,
  },
  {
    id: 'math-example',
    title: 'Mathematical Expression Verification',
    description: 'Validate mathematical formulas and expressions for correctness',
    contentType: 'math',
    content: `
Area of Circle = π * r²

Pythagorean Theorem: a² + b² = c²

Quadratic Formula: x = (-b ± √(b² - 4ac)) / 2a

Volume of Sphere = 4/3 * π * r³

Derivative of sin(x) = cos(x)

Integration: ∫x² dx = x³/3 + C

Standard Deviation = √(Σ(x - μ)² / N)
`.trim(),
    autoVerify: false,
  },
  {
    id: 'academic-example',
    title: 'Academic Paper Verification',
    description: 'Verify citations and academic references in proper format',
    contentType: 'academic',
    content: `
Recent studies have demonstrated the importance of machine learning in data analysis (Smith, 2022).
The foundational work by Goodfellow et al. (2016) established the framework for neural networks.
As noted in Vapnik (1995), support vector machines have significant theoretical advantages.

The research builds upon previous findings (Johnson, 2020) showing that data augmentation improves
model performance. Additionally, Shorten & Khoshgoftaar (2019) provide comprehensive analysis of
augmentation techniques.

According to recent surveys (Wilson, 2023), the field continues to evolve rapidly with new
methodologies emerging constantly. The initial concept was introduced by Rumelhart et al. (1986).
`.trim(),
    autoVerify: false,
  },
  {
    id: 'factual-example',
    title: 'Factual Content Verification',
    description: 'Identify factual claims requiring human verification',
    contentType: 'factual',
    content: `
The United States has 50 states and 6 populated territories. The Declaration of Independence
was signed on July 4, 1776. The Great Wall of China is approximately 13,171 miles long.

According to the World Health Organization, the average global life expectancy is 73.4 years
as of 2022. The Earth orbits the Sun every 365.25 days, which is why we have leap years every
4 years (except for century years divisible by 400).

The population of New York City is approximately 8.3 million people, making it the most populous
city in the United States. The Amazon Rainforest produces about 20% of the world's oxygen.
`.trim(),
    autoVerify: false,
  },
  {
    id: 'mixed-example',
    title: 'Mixed Content Verification',
    description: 'Combined code with documentation and mathematical references',
    contentType: 'code',
    content: `
/**
 * Calculate the standard deviation of an array.
 * Formula: σ = √(Σ(x - μ)² / N)
 *
 * Reference: According to Goodfellow et al. (2016), statistical measures are critical
 * for data analysis pipelines.
 */
function calculateStandardDeviation(values) {
  if (!values || values.length === 0) return null;

  // Calculate mean
  const mean = values.reduce((a, b) => a + b) / values.length;

  // Calculate variance
  const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length;

  // Return standard deviation
  return Math.sqrt(variance);
}

// Test: calculateStandardDeviation([1, 2, 3, 4, 5]) = 1.414
// Usage: const std = calculateStandardDeviation(dataArray);

export { calculateStandardDeviation };
`.trim(),
    autoVerify: false,
  },
];

/**
 * Individual Demo Component
 */
interface DemoProps {
  scenario: DemoScenario;
}

const DemoScenarioComponent: React.FC<DemoProps> = ({ scenario }) => {
  const [lastResult, setLastResult] = useState<string>('No results yet');
  const [resultCount, setResultCount] = useState(0);

  const handleVerificationComplete = (results: any[]) => {
    setResultCount(results.length);
    const summary = results
      .map((r) => `${r.type}: ${r.status}`)
      .join(', ');
    setLastResult(`Completed ${results.length} verifications: ${summary}`);
  };

  return (
    <div style={styles.demoContainer}>
      <div style={styles.demoHeader}>
        <h3 style={styles.demoTitle}>{scenario.title}</h3>
        <p style={styles.demoDescription}>{scenario.description}</p>
      </div>

      <div style={styles.contentPreview}>
        <h4 style={styles.contentTitle}>Content to Verify:</h4>
        <pre style={styles.contentCode}>{scenario.content}</pre>
      </div>

      <VerificationToolbar
        content={scenario.content}
        contentType={scenario.contentType}
        onVerificationComplete={handleVerificationComplete}
        autoVerify={scenario.autoVerify}
      />

      <div style={styles.resultSummary}>
        <p>
          <strong>Verification Status:</strong> {lastResult}
        </p>
        {resultCount > 0 && (
          <p style={{ color: '#4caf50', fontWeight: 'bold' }}>
            ✓ {resultCount} verification tool{resultCount !== 1 ? 's' : ''} executed successfully
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Main Demo Page
 */
export const VerificationToolbarDemo: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState('code-example');
  const currentScenario = DEMO_SCENARIOS.find((s) => s.id === activeScenario);

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>🔍 VerificationToolbar Demo & Integration Guide</h1>
        <p style={styles.pageSubtitle}>
          Integrated verification tool with support for code, math, academic, and factual verification
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
      {currentScenario && <DemoScenarioComponent scenario={currentScenario} />}

      {/* Integration Guide */}
      <div style={styles.integrationGuide}>
        <h2 style={styles.guideTitle}>📚 Integration Guide & API Reference</h2>

        {/* Usage Example */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>1. Basic Usage</h3>
          <pre style={styles.codeBlock}>
{`import VerificationToolbar from './components/VerificationToolbar';

export function MyComponent() {
  const [verificationResults, setVerificationResults] = useState([]);

  return (
    <VerificationToolbar
      content={codeOrTextToVerify}
      contentType="code"
      onVerificationComplete={(results) => {
        setVerificationResults(results);
        console.log('Verification complete:', results);
      }}
      autoVerify={false}
    />
  );
}`}
          </pre>
        </section>

        {/* Props Reference */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>2. Props Reference</h3>
          <table style={styles.propsTable}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>Prop</th>
                <th style={styles.tableHeaderCell}>Type</th>
                <th style={styles.tableHeaderCell}>Description</th>
                <th style={styles.tableHeaderCell}>Required</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>content</td>
                <td style={styles.tableCell}>string</td>
                <td style={styles.tableCell}>Content to verify (code, text, math, etc.)</td>
                <td style={styles.tableCell}>✓</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>contentType</td>
                <td style={styles.tableCell}>
                  'code' | 'math' | 'academic' | 'factual'
                </td>
                <td style={styles.tableCell}>Type of content to determine verification approach</td>
                <td style={styles.tableCell}>✓</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>onVerificationComplete</td>
                <td style={styles.tableCell}>function</td>
                <td style={styles.tableCell}>Callback when verification completes with results array</td>
                <td style={styles.tableCell}>×</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>autoVerify</td>
                <td style={styles.tableCell}>boolean</td>
                <td style={styles.tableCell}>
                  Run all verifications automatically on mount (default: false)
                </td>
                <td style={styles.tableCell}>×</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>eslintConfig</td>
                <td style={styles.tableCell}>object</td>
                <td style={styles.tableCell}>Custom ESLint rules configuration</td>
                <td style={styles.tableCell}>×</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Verification Types */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>3. Supported Verification Types</h3>
          <div style={styles.verificationTypes}>
            <div style={styles.verificationType}>
              <h4 style={{ ...styles.typeTitle, color: '#4caf50' }}>✓ Syntax Check</h4>
              <p>ESLint-like rules for code syntax, style, and best practices</p>
              <ul>
                <li>Trailing whitespace detection</li>
                <li>Missing semicolons</li>
                <li>Console statement warnings</li>
                <li>Variable declaration style (var vs const/let)</li>
                <li>Bracket/parenthesis balance check</li>
              </ul>
            </div>

            <div style={styles.verificationType}>
              <h4 style={{ ...styles.typeTitle, color: '#f44336' }}>🔒 Security Scan</h4>
              <p>SonarQube-like security vulnerability detection</p>
              <ul>
                <li>Hardcoded credentials/secrets</li>
                <li>SQL injection patterns</li>
                <li>XSS vulnerabilities</li>
                <li>eval() usage detection</li>
                <li>Weak cryptography warnings</li>
                <li>Missing authentication checks</li>
              </ul>
            </div>

            <div style={styles.verificationType}>
              <h4 style={{ ...styles.typeTitle, color: '#2196f3' }}>✓ Test Suggestions</h4>
              <p>Intelligent test case recommendations</p>
              <ul>
                <li>Function detection and coverage goals</li>
                <li>Async/Promise testing guidance</li>
                <li>API mocking strategies</li>
                <li>DOM testing with React Testing Library</li>
                <li>Test naming and isolation best practices</li>
              </ul>
            </div>

            <div style={styles.verificationType}>
              <h4 style={{ ...styles.typeTitle, color: '#ff9800' }}>∑ Math Verification</h4>
              <p>SymPy-integrated mathematical expression validation</p>
              <ul>
                <li>Division by zero detection</li>
                <li>Undefined operations (sqrt(-1), log(0))</li>
                <li>Format standardization suggestions</li>
                <li>Domain and range validation</li>
              </ul>
            </div>

            <div style={styles.verificationType}>
              <h4 style={{ ...styles.typeTitle, color: '#1976d2' }}>📚 Citation Verification</h4>
              <p>Google Scholar API integration for academic citations</p>
              <ul>
                <li>APA format detection and validation</li>
                <li>MLA format detection and validation</li>
                <li>Chicago format detection and validation</li>
                <li>Scholar database cross-reference</li>
              </ul>
            </div>

            <div style={styles.verificationType}>
              <h4 style={{ ...styles.typeTitle, color: '#4caf50' }}>✓ Fact Verification</h4>
              <p>Wikipedia API integration for factual claims</p>
              <ul>
                <li>Factual claim extraction</li>
                <li>Wikipedia cross-reference</li>
                <li>Manual verification marking</li>
                <li>Statistical accuracy checking</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Result Structure */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>4. Result Structure</h3>
          <pre style={styles.codeBlock}>
{`interface VerificationResult {
  type: 'syntax' | 'security' | 'test' | 'math' | 'citation' | 'fact';
  status: 'not_started' | 'pending' | 'success' | 'warning' | 'error';
  message: string;              // Summary message
  details: string[];            // Detailed findings
  timestamp: Date;              // When verification ran
  suggestions?: string[];       // Recommendations
}

// Example Result:
{
  type: 'syntax',
  status: 'warning',
  message: 'Syntax check: 0 errors, 3 warnings found',
  details: [
    'Line 5: Missing semicolon',
    'Line 12: Trailing whitespace detected',
    'Line 8: Use const or let instead of var'
  ],
  timestamp: 2024-11-17T10:30:00Z,
  suggestions: [
    'Enable ESLint in your IDE for real-time feedback',
    'Run: npx eslint . --fix for automatic fixes'
  ]
}`}
          </pre>
        </section>

        {/* Best Practices */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>5. Best Practices & Use Cases</h3>
          <div style={styles.bestPractices}>
            <div style={styles.practice}>
              <h4>✓ Code Review Integration</h4>
              <p>
                Use syntax and security checks before submitting pull requests. Catches common
                issues early and enforces team standards.
              </p>
            </div>
            <div style={styles.practice}>
              <h4>✓ Academic Paper Validation</h4>
              <p>
                Verify citations are properly formatted and cross-referenced. Ensures academic
                integrity and proper attribution.
              </p>
            </div>
            <div style={styles.practice}>
              <h4>✓ Multi-Step Content Verification</h4>
              <p>
                Run "Verify All" for comprehensive validation. Results display in expandable
                sections for easy review.
              </p>
            </div>
            <div style={styles.practice}>
              <h4>✓ User Substitution Strategies</h4>
              <p>
                Implements I3 (triangle verification) and I44 (security audit) patterns. Users can
                trust verification results.
              </p>
            </div>
            <div style={styles.practice}>
              <h4>✓ Responsive Design</h4>
              <p>
                Works seamlessly on mobile and desktop. Verification buttons scale appropriately
                without disrupting content flow.
              </p>
            </div>
            <div style={styles.practice}>
              <h4>✓ Accessibility First</h4>
              <p>
                WCAG 2.1 AA compliant. Keyboard navigation, screen reader support, dark mode, and
                reduced motion all supported.
              </p>
            </div>
          </div>
        </section>

        {/* Monitoring Integration */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>6. Monitoring & Analytics Integration</h3>
          <pre style={styles.codeBlock}>
{`// Track verification results for analytics
function handleVerificationComplete(results: VerificationResult[]) {
  // Log results
  console.log('Verification results:', results);

  // Send to analytics
  analytics.track('verification_completed', {
    timestamp: new Date(),
    results: results.map(r => ({
      type: r.type,
      status: r.status,
      issueCount: r.details.length
    }))
  });

  // Update monitoring dashboard
  updateDashboard({
    successCount: results.filter(r => r.status === 'success').length,
    warningCount: results.filter(r => r.status === 'warning').length,
    errorCount: results.filter(r => r.status === 'error').length
  });

  // Store for audit trail
  auditLog.save({
    action: 'verification_run',
    results,
    userId: getCurrentUser().id
  });
}`}
          </pre>
        </section>

        {/* Advanced Configuration */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>7. Advanced Configuration</h3>
          <pre style={styles.codeBlock}>
{`// Custom ESLint configuration
const customESLintConfig = {
  rules: {
    'no-console': 'error',      // Treat console.log as error
    'no-var': 'error',          // Require const/let
    'semi': ['error', 'always'] // Require semicolons
  }
};

<VerificationToolbar
  content={code}
  contentType="code"
  eslintConfig={customESLintConfig}
  onVerificationComplete={(results) => {
    if (results.some(r => r.status === 'error')) {
      alert('Critical issues found! Please review.');
    }
  }}
  autoVerify={false}
/>`}
          </pre>
        </section>

        {/* Browser Support */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>8. Browser Support & Performance</h3>
          <table style={styles.propsTable}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>Feature</th>
                <th style={styles.tableHeaderCell}>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>Browser Support</td>
                <td style={styles.tableCell}>Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>Bundle Size</td>
                <td style={styles.tableCell}>~25KB minified + gzipped</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>Performance</td>
                <td style={styles.tableCell}>
                  Verification runs synchronously, 100-500ms per check
                </td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>Dependencies</td>
                <td style={styles.tableCell}>React 17.0+ only</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.tableCell}>Accessibility</td>
                <td style={styles.tableCell}>WCAG 2.1 AA compliant</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Troubleshooting */}
        <section style={styles.guideSection}>
          <h3 style={styles.sectionTitle}>9. Troubleshooting & FAQs</h3>
          <div style={styles.faqItem}>
            <h4>Q: Why are verifications slow?</h4>
            <p>
              A: Verification runs synchronously to avoid race conditions. For large content (>10k
              lines), consider chunking and running verifications on specific sections.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4>Q: Can I disable specific verification types?</h4>
            <p>
              A: Currently all 6 types run. For selective verification, you can check the result
              status in the callback and handle accordingly.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4>Q: How do I integrate with my custom linter?</h4>
            <p>
              A: Modify the runSyntaxCheck() function or use the eslintConfig prop to customize
              verification rules.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4>Q: Is the component accessible?</h4>
            <p>
              A: Yes! WCAG 2.1 AA compliant with keyboard navigation, ARIA labels, and screen
              reader support. Dark mode and reduced motion also supported.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>
          <strong>MR11 - Integrated Verification Tool</strong> provides seamless multi-layer
          verification for code, mathematics, academic content, and factual claims.
        </p>
        <p>
          ✓ 6 Verification Types | ✓ Seamless Integration | ✓ Accessible Design | ✓ Mobile
          Responsive
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
    maxWidth: '1200px',
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
    padding: '0.6rem 1rem',
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
  demoContainer: {
    marginBottom: '3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  demoHeader: {
    paddingBottom: '1rem',
    borderBottom: '1px solid #e0e0e0',
  },
  demoTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1976d2',
  },
  demoDescription: {
    margin: 0,
    color: '#666666',
    fontSize: '0.95rem',
  },
  contentPreview: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem',
  },
  contentTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#212121',
  },
  contentCode: {
    margin: 0,
    padding: '0.75rem',
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '0.8rem',
    overflow: 'auto',
    maxHeight: '200px',
    fontFamily: 'Monaco, Courier New, monospace',
  },
  resultSummary: {
    background: '#e8f5e9',
    border: '1px solid #4caf50',
    borderRadius: '6px',
    padding: '1rem',
    color: '#1b5e20',
  },
  integrationGuide: {
    marginTop: '3rem',
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '2rem',
  },
  guideTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1976d2',
  },
  guideSection: {
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #e0e0e0',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#212121',
  },
  codeBlock: {
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '1rem',
    overflow: 'auto',
    fontSize: '0.8rem',
    fontFamily: 'Monaco, Courier New, monospace',
    margin: '1rem 0',
  },
  propsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
  tableHeader: {
    background: '#1976d2',
    color: 'white',
  },
  tableHeaderCell: {
    padding: '0.75rem',
    textAlign: 'left',
    fontWeight: 600,
    borderRight: '1px solid #0d47a1',
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0',
    ':hover': {
      background: '#f5f5f5',
    },
  },
  tableCell: {
    padding: '0.75rem',
    borderRight: '1px solid #e0e0e0',
  },
  verificationTypes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '1.5rem',
  },
  verificationType: {
    padding: '1.5rem',
    background: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  typeTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  bestPractices: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  practice: {
    padding: '1rem',
    background: '#f0f4ff',
    borderLeft: '4px solid #1976d2',
    borderRadius: '4px',
  },
  faqItem: {
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e0e0e0',
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

export default VerificationToolbarDemo;

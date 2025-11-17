import React, { useState } from 'react';
import UncertaintyIndicator from './UncertaintyIndicator';

/**
 * UncertaintyIndicator Demo & Documentation
 *
 * This demo showcases different confidence levels and use cases
 * based on the strict model validation results.
 */

export const UncertaintyIndicatorDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<'general' | 'medical' | 'legal' | 'financial' | 'edge-cases'>('general');

  return (
    <div style={{ padding: '32px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <h1>UncertaintyIndicator Component Demo</h1>
      <p>
        Based on strict model validation: CV stability (5.24-5.50%), mixed pattern handling (80% low confidence),
        and Pattern F detection (92%).
      </p>

      {/* Demo Selector */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {(['general', 'medical', 'legal', 'financial', 'edge-cases'] as const).map((demo) => (
          <button
            key={demo}
            onClick={() => setSelectedDemo(demo)}
            style={{
              padding: '10px 16px',
              backgroundColor: selectedDemo === demo ? '#2196F3' : '#fff',
              color: selectedDemo === demo ? '#fff' : '#333',
              border: `2px solid ${selectedDemo === demo ? '#2196F3' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {demo.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Demo Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* General Examples */}
        {selectedDemo === 'general' && (
          <>
            <section>
              <h2>General Purpose - High Confidence (>0.85)</h2>
              <p>Content that the model is very confident about. Can be used with minimal review.</p>

              <UncertaintyIndicator
                content="The capital of France is Paris."
                confidence={0.92}
                uncertaintyReasons={[
                  "High clarity: Capital cities are well-defined factual information",
                  "Extensive training data: Paris has been the capital of France for centuries",
                ]}
                taskType="general"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_001',
                }}
              />
            </section>

            <section>
              <h2>General Purpose - Medium Confidence (0.70-0.85)</h2>
              <p>Content with moderate confidence. Light review is recommended.</p>

              <UncertaintyIndicator
                content="Python is one of the most popular programming languages for data science."
                confidence={0.78}
                uncertaintyReasons={[
                  "Changing landscape: Programming language popularity shifts over time",
                  "Definition ambiguity: 'Most popular' can be measured by different metrics",
                  "Regional variation: Different regions have different language preferences",
                ]}
                taskType="general"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_002',
                }}
              />
            </section>

            <section>
              <h2>General Purpose - Low Confidence (<0.70)</h2>
              <p>Content with low confidence. Detailed review is strongly recommended.</p>

              <UncertaintyIndicator
                content="The average house price in San Francisco will increase by 15% in 2024."
                confidence={0.55}
                uncertaintyReasons={[
                  "Future prediction: Real estate prices are highly unpredictable",
                  "Market volatility: Economic factors can change rapidly",
                  "Limited historical patterns: COVID-19 disrupted typical trends",
                  "Data recency: Model training data may not include latest market shifts",
                ]}
                taskType="general"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_003',
                }}
              />
            </section>
          </>
        )}

        {/* Medical Examples */}
        {selectedDemo === 'medical' && (
          <>
            <section>
              <h2>Medical Domain - High Confidence (>0.85)</h2>
              <p>
                Even high-confidence medical information requires verification. Always consult healthcare providers.
              </p>

              <UncertaintyIndicator
                content="Aspirin is commonly used to reduce fever and relieve minor aches and pains."
                confidence={0.88}
                uncertaintyReasons={[
                  "Well-established medical fact: Aspirin's basic uses are well-documented",
                  "Extensive clinical data: Decades of medical research support this",
                ]}
                taskType="medical"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_004',
                }}
              />
            </section>

            <section>
              <h2>Medical Domain - Low Confidence (<0.70)</h2>
              <p>Medical information with low confidence. Professional medical consultation is essential.</p>

              <UncertaintyIndicator
                content="For a patient experiencing chest pain with no previous cardiac history, immediate EKG and troponin testing should be performed."
                confidence={0.48}
                uncertaintyReasons={[
                  "High variability: Individual patient circumstances vary greatly",
                  "Clinical judgment required: Proper diagnosis requires full medical evaluation",
                  "Liability concerns: Medical recommendations depend on complete patient history",
                  "Specialty knowledge: Cardiology decisions require expert interpretation",
                ]}
                taskType="medical"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_005',
                }}
              />
            </section>
          </>
        )}

        {/* Legal Examples */}
        {selectedDemo === 'legal' && (
          <>
            <section>
              <h2>Legal Domain - Medium-High Confidence</h2>
              <p>Even well-known legal information needs attorney review for specific situations.</p>

              <UncertaintyIndicator
                content="In the United States, the statute of limitations for filing a breach of contract claim is typically between 3-6 years, depending on the state."
                confidence={0.82}
                uncertaintyReasons={[
                  "Jurisdiction dependent: Laws vary significantly by state and type of contract",
                  "Specific circumstances matter: Exceptions and modifications apply in many cases",
                  "Recent legislation: New laws may have changed the timeline",
                ]}
                taskType="legal"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_006',
                }}
              />
            </section>

            <section>
              <h2>Legal Domain - Low Confidence</h2>
              <p>Complex legal matters with low confidence require immediate attorney consultation.</p>

              <UncertaintyIndicator
                content="If a non-compete agreement is deemed unenforceable in court, the employee is automatically free to work for competitors with no restrictions."
                confidence={0.52}
                uncertaintyReasons={[
                  "Doctrine complexity: Non-compete enforceability involves intricate case law",
                  "State variation: Each jurisdiction has different standards for enforcement",
                  "Individual circumstance: Specific employment terms greatly affect outcomes",
                  "Recent precedent: Courts continuously refine non-compete standards",
                ]}
                taskType="legal"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_007',
                }}
              />
            </section>
          </>
        )}

        {/* Financial Examples */}
        {selectedDemo === 'financial' && (
          <>
            <section>
              <h2>Financial Domain - General Information (High Confidence)</h2>
              <p>Factual financial information with high confidence, but not investment advice.</p>

              <UncertaintyIndicator
                content="The S&P 500 is a market-capitalization-weighted index of the 500 largest publicly traded companies in the United States."
                confidence={0.91}
                uncertaintyReasons={[
                  "Well-defined index: S&P 500 composition is precisely documented",
                  "Static definition: The index definition remains consistent",
                ]}
                taskType="financial"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_008',
                }}
              />
            </section>

            <section>
              <h2>Financial Domain - Investment Analysis (Low Confidence)</h2>
              <p>Investment predictions have inherent uncertainty. Always consult financial advisors.</p>

              <UncertaintyIndicator
                content="Based on current market trends, technology stocks are likely to outperform energy stocks over the next 12 months."
                confidence={0.41}
                uncertaintyReasons={[
                  "Market unpredictability: Financial markets are highly volatile and complex",
                  "Future uncertainty: Unforeseen events can drastically change market dynamics",
                  "Multiple factors: Countless variables influence sector performance",
                  "Data recency: Historical patterns may not predict future performance",
                  "Risk factors: Geopolitical, regulatory, and economic changes are unpredictable",
                ]}
                taskType="financial"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_009',
                }}
              />
            </section>
          </>
        )}

        {/* Edge Cases */}
        {selectedDemo === 'edge-cases' && (
          <>
            <section>
              <h2>Edge Case: Mixed Domain Uncertainty</h2>
              <p>Content that touches on both medical and financial aspects with compounded uncertainty.</p>

              <UncertaintyIndicator
                content="A patient with diabetes who improves glycemic control through lifestyle changes might expect to reduce medication costs by 20-30% annually."
                confidence={0.62}
                uncertaintyReasons={[
                  "Medical complexity: Diabetes progression is highly individual",
                  "Financial variability: Healthcare costs and medication prices vary widely",
                  "Individual factors: Age, comorbidities, and insurance affect outcomes",
                  "Medication dependency: Some patients cannot reduce medications safely",
                ]}
                taskType="medical"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_010',
                }}
              />
            </section>

            <section>
              <h2>Edge Case: Rapid-Change Domain</h2>
              <p>Content about rapidly evolving fields where model training data quickly becomes outdated.</p>

              <UncertaintyIndicator
                content="As of late 2024, the most advanced large language models have approximately 70-100 billion parameters."
                confidence={0.45}
                uncertaintyReasons={[
                  "Rapid evolution: AI capabilities are advancing faster than model training",
                  "Data cutoff: Training data has a fixed temporal boundary",
                  "Competition intensity: New models are released frequently",
                  "Model capabilities unknown: Unreleased models' parameters are speculative",
                ]}
                taskType="general"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_011',
                }}
              />
            </section>

            <section>
              <h2>Edge Case: Subjective vs Objective</h2>
              <p>Content mixing objective facts with subjective interpretation.</p>

              <UncertaintyIndicator
                content="Climate change is the primary environmental challenge of our time, and renewable energy adoption is essential to address it."
                confidence={0.68}
                uncertaintyReasons={[
                  "Value judgment: 'Primary challenge' is partially subjective",
                  "Causation debate: Climate attribution has scientific consensus but remains debated",
                  "Solution multiplicity: Different experts propose different approaches",
                  "Policy dependent: Different regions prioritize different solutions",
                ]}
                taskType="general"
                metadata={{
                  modelName: 'PatternRecognition-v1',
                  timestamp: new Date(),
                  taskId: 'demo_012',
                }}
              />
            </section>
          </>
        )}
      </div>

      {/* Documentation */}
      <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #ddd' }}>
        <h2>Component Documentation</h2>

        <h3>Props Interface</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
        >
          {`interface UncertaintyIndicatorProps {
  // The AI-generated content to display
  content: string;

  // Model confidence score (0-1)
  // Based on validation: ±5.5pp accuracy variance
  confidence: number;

  // Reasons why model is uncertain
  uncertaintyReasons: string[];

  // Task type determines display behavior
  // High-risk domains (medical, legal, financial)
  // always show verification advice
  taskType: 'general' | 'medical' | 'legal' |
            'financial' | 'academic' | 'code';

  // Optional metadata for monitoring
  metadata?: {
    modelName?: string;
    timestamp?: Date;
    userId?: string;
    taskId?: string;
  };

  // Optional callback for user feedback (for monitoring)
  onFeedback?: (feedback: {
    contentId: string;
    userAccuracy: 'correct' | 'partial' | 'incorrect' | 'unknown';
    actualValue?: string;
  }) => void;
}`}
        </pre>

        <h3>Confidence Thresholds</h3>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '16px',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Confidence Range</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Action</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd', color: '#4CAF50', fontWeight: 'bold' }}>
                &gt; 0.85 (85%+)
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Auto-classify, use with confidence</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                General factual content, well-established facts, simple queries
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd', color: '#FF9800', fontWeight: 'bold' }}>
                0.70-0.85 (70-85%)
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Suggest, light review recommended</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                Domain-specific content, slightly ambiguous information, contextual answers
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', color: '#F44336', fontWeight: 'bold' }}>
                &lt; 0.70 (&lt;70%)
              </td>
              <td style={{ padding: '12px' }}>Detailed review needed, human verification essential</td>
              <td style={{ padding: '12px' }}>
                High-risk domains, predictions, complex reasoning, multi-factor analysis
              </td>
            </tr>
          </tbody>
        </table>

        <h3>High-Risk Domain Handling</h3>
        <p>
          For high-risk domains (medical, legal, financial), the component automatically displays verification advice
          regardless of confidence level. Low confidence in these domains triggers mandatory expanded view with clear
          disclaimers.
        </p>

        <h3>Usage Example</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: '1.6',
            marginTop: '16px',
          }}
        >
          {`import UncertaintyIndicator from './UncertaintyIndicator';

// In your React component:
<UncertaintyIndicator
  content="Aspirin is commonly used for pain relief."
  confidence={0.88}
  uncertaintyReasons={[
    "Well-established medical fact",
    "Extensive clinical data available"
  ]}
  taskType="medical"
  metadata={{
    modelName: 'PatternRecognition-v1',
    timestamp: new Date(),
    taskId: 'user_query_001'
  }}
  onFeedback={(feedback) => {
    // Log feedback for continuous improvement
    logUserFeedback(feedback);
  }}
/>`}
        </pre>

        <h3>Monitoring Integration</h3>
        <p>
          The component supports continuous monitoring through the feedback callback. Recommended monitoring approach
          (based on validation):
        </p>
        <ul>
          <li>
            <strong>Daily:</strong> Check low confidence ratio (target &lt;40%), alert if exceeded
          </li>
          <li>
            <strong>Weekly:</strong> Generate performance reports, track Pattern F detection
          </li>
          <li>
            <strong>Monthly:</strong> Compare with labeled ground truth, validate model accuracy
          </li>
        </ul>

        <h3>Accessibility Features</h3>
        <ul>
          <li>Full keyboard navigation support (Tab, Enter, Space)</li>
          <li>Screen reader friendly with proper ARIA labels</li>
          <li>Reduced motion support for users with vestibular disorders</li>
          <li>Dark mode support</li>
          <li>High contrast mode support</li>
        </ul>
      </section>
    </div>
  );
};

export default UncertaintyIndicatorDemo;

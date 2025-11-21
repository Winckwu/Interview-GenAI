import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * A/B Testing Page
 * View and analyze A/B test results for intervention strategies
 */
const ABTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'details'>('overview');

  // Mock test data
  const testData = [
    {
      id: 'test-001',
      name: 'Intervention Strategy Comparison',
      status: 'completed',
      startDate: '2025-11-01',
      endDate: '2025-11-29',
      variants: [
        { name: 'Baseline', users: 10, successRate: 68.9, satisfaction: 3.2, confidence: 0.92 },
        { name: 'Aggressive', users: 10, successRate: 70.2, satisfaction: 2.8, confidence: 0.88 },
        { name: 'Adaptive', users: 10, successRate: 73.2, satisfaction: 3.6, confidence: 0.95 },
      ],
    },
  ];

  const comparisonData = [
    { strategy: 'Baseline', successRate: 68.9, satisfaction: 3.2 },
    { strategy: 'Aggressive', successRate: 70.2, satisfaction: 2.8 },
    { strategy: 'Adaptive', successRate: 73.2, satisfaction: 3.6 },
  ];

  const detailsData = [
    {
      metric: 'Success Rate',
      baseline: '68.9%',
      aggressive: '70.2%',
      adaptive: '73.2%',
      winner: 'Adaptive',
    },
    {
      metric: 'User Satisfaction',
      baseline: '3.2/5',
      aggressive: '2.8/5',
      adaptive: '3.6/5',
      winner: 'Adaptive',
    },
    {
      metric: 'Confidence Calibration',
      baseline: '0.92',
      aggressive: '0.88',
      adaptive: '0.95',
      winner: 'Adaptive',
    },
    {
      metric: 'Pattern Evolution Rate',
      baseline: '35%',
      aggressive: '38%',
      adaptive: '40%',
      winner: 'Adaptive',
    },
  ];

  return (
    <div className="page abtest-page">
      <div className="page-header">
        <h1>A/B Testing</h1>
        <p className="page-subtitle">Compare intervention strategies and their effectiveness</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
        <button
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Detailed Comparison
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {testData.map((test) => (
            <div key={test.id} className="test-card">
              <div className="test-header">
                <h3>{test.name}</h3>
                <span className={`badge badge-${test.status}`}>{test.status}</span>
              </div>
              <p className="test-dates">
                {new Date(test.startDate).toLocaleDateString()} - {new Date(test.endDate).toLocaleDateString()}
              </p>
              <div className="variants-grid">
                {test.variants.map((variant) => (
                  <div key={variant.name} className="variant-card">
                    <h4>{variant.name}</h4>
                    <div className="variant-stats">
                      <div className="stat">
                        <span className="label">Users</span>
                        <span className="value">{variant.users}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Success Rate</span>
                        <span className="value">{variant.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="stat">
                        <span className="label">Satisfaction</span>
                        <span className="value">{variant.satisfaction.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="tab-content">
          <div className="chart-container">
            <h3>Strategy Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis yAxisId="left" label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Satisfaction (0-5)', angle: 90, position: 'insideRight' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                  labelStyle={{
                    color: '#f9fafb',
                    fontWeight: 600,
                  }}
                  itemStyle={{
                    color: '#e5e7eb',
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="successRate" fill="#3b82f6" name="Success Rate (%)" />
                <Bar yAxisId="right" dataKey="satisfaction" fill="#10b981" name="Satisfaction (0-5)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="key-findings">
            <h3>Key Findings</h3>
            <ul>
              <li>✅ <strong>Adaptive strategy outperforms</strong> with 73.2% success rate and highest satisfaction (3.6/5)</li>
              <li>✅ <strong>Effect sizes modest (d &lt; 0.5)</strong> - all strategies are viable for different contexts</li>
              <li>✅ <strong>User preference clear</strong> - Adaptive gets highest satisfaction rating</li>
              <li>✅ <strong>Safety validated</strong> - no strategy performs poorly; all show positive outcomes</li>
            </ul>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="tab-content">
          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Baseline</th>
                  <th>Aggressive</th>
                  <th>Adaptive</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {detailsData.map((row) => (
                  <tr key={row.metric}>
                    <td><strong>{row.metric}</strong></td>
                    <td>{row.baseline}</td>
                    <td>{row.aggressive}</td>
                    <td>{row.adaptive}</td>
                    <td>
                      <span className="badge badge-success">{row.winner}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="recommendations">
            <h3>Recommendations</h3>
            <div className="recommendation-card">
              <h4>Deploy Adaptive Strategy</h4>
              <p>The adaptive strategy shows the best overall performance with highest user satisfaction. Recommended for production deployment.</p>
            </div>
            <div className="recommendation-card">
              <h4>Context-Based Selection</h4>
              <p>Different users may respond better to different strategies. Consider user segmentation for personalized approach.</p>
            </div>
            <div className="recommendation-card">
              <h4>Monitor and Iterate</h4>
              <p>Continue monitoring real-world performance and gather feedback for continuous optimization.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABTestPage;

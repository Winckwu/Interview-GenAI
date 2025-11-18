import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './DataBrowserPage.css';

/**
 * Data Browser Page
 * View all stored data in the database
 */
const DataBrowserPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<'sessions' | 'interactions' | 'patterns' | 'assessments'>('sessions');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data based on active tab
  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'sessions':
          response = await api.get('/sessions');
          break;
        case 'interactions':
          response = await api.get('/interactions');
          break;
        case 'patterns':
          response = await api.get('/patterns/trends/current');
          break;
        case 'assessments':
          response = await api.get(`/assessments/${user?.id}`);
          break;
        default:
          setData([]);
          return;
      }

      // Handle both array and object responses
      const result = response.data;
      let dataArray = [];

      if (Array.isArray(result)) {
        dataArray = result;
      } else if (result.data && Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (result.sessions && Array.isArray(result.sessions)) {
        dataArray = result.sessions;
      } else if (result.interactions && Array.isArray(result.interactions)) {
        dataArray = result.interactions;
      } else if (result.patterns && Array.isArray(result.patterns)) {
        dataArray = result.patterns;
      } else if (result.assessments && Array.isArray(result.assessments)) {
        dataArray = result.assessments;
      }

      setData(dataArray);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      addNotification(`Failed to fetch ${activeTab}: ${err.response?.data?.error || err.message}`, 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, user?.id]);

  const renderSessionData = () => {
    if (data.length === 0) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No sessions found</div>;
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Task Type</th>
              <th>Description</th>
              <th>Duration (min)</th>
              <th>Started</th>
              <th>Ended</th>
            </tr>
          </thead>
          <tbody>
            {data.map((session: any) => (
              <tr key={session.id}>
                <td>{session.id.substring(0, 8)}...</td>
                <td>{session.task_type || 'general'}</td>
                <td>{session.task_description || 'N/A'}</td>
                <td>{session.duration_minutes || '-'}</td>
                <td>{new Date(session.started_at).toLocaleDateString()} {new Date(session.started_at).toLocaleTimeString()}</td>
                <td>{session.ended_at ? new Date(session.ended_at).toLocaleTimeString() : 'In Progress'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInteractionData = () => {
    if (data.length === 0) {
      return <div className="empty-state">No interactions found</div>;
    }

    return (
      <div className="interactions-container">
        {data.map((interaction: any) => (
          <div
            key={interaction.id}
            className="interaction-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                  Interaction {interaction.id.substring(0, 8)}...
                </h4>
                <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                  {new Date(interaction.created_at).toLocaleString()}
                </p>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {interaction.was_verified && <span>✓ Verified</span>}
                {interaction.was_modified && <span> • Modified</span>}
                {interaction.was_rejected && <span> • Rejected</span>}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>
                User Prompt:
              </p>
              <p style={{
                margin: '0',
                padding: '0.75rem',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#1f2937',
              }}>
                {interaction.user_prompt}
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>
                AI Response:
              </p>
              <p style={{
                margin: '0',
                padding: '0.75rem',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#1f2937',
              }}>
                {interaction.ai_response || 'No response recorded'}
              </p>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              Response time: {interaction.response_time_ms}ms | Model: {interaction.ai_model}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPatternData = () => {
    if (data.length === 0) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No patterns detected</div>;
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Confidence</th>
              <th>Detection Method</th>
              <th>Detected At</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pattern: any) => (
              <tr key={pattern.id}>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '0.25rem',
                    fontWeight: '600',
                  }}>
                    Pattern {pattern.detected_pattern?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </td>
                <td>{(pattern.confidence * 100).toFixed(1)}%</td>
                <td>{pattern.detection_method || 'rule_based'}</td>
                <td>{new Date(pattern.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAssessmentData = () => {
    if (data.length === 0) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No assessments found</div>;
    }

    return (
      <div className="assessments-container" style={{ display: 'grid', gap: '1.5rem' }}>
        {data.map((assessment: any) => (
          <div
            key={assessment.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                  Assessment {assessment.id.substring(0, 8)}...
                </h4>
                <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                  {new Date(assessment.created_at).toLocaleString()}
                </p>
              </div>
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: assessment.pattern_identified ? '#dbeafe' : '#f3f4f6',
                color: assessment.pattern_identified ? '#1e40af' : '#4b5563',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}>
                Pattern: {assessment.pattern_identified || 'UNKNOWN'}
              </span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>
                Score: {assessment.score || 'N/A'}
              </p>
              {assessment.feedback && (
                <p style={{
                  margin: '0',
                  padding: '0.75rem',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                }}>
                  {assessment.feedback}
                </p>
              )}
            </div>

            {assessment.recommendations && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>
                  Recommendations:
                </p>
                <ul style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                  {typeof assessment.recommendations === 'string'
                    ? <li>{assessment.recommendations}</li>
                    : Array.isArray(assessment.recommendations) && assessment.recommendations.map((rec, idx) => (
                      <li key={idx}>{typeof rec === 'string' ? rec : JSON.stringify(rec)}</li>
                    ))
                  }
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page data-browser-page">
      <div className="page-header">
        <h1>Data Browser</h1>
        <p className="page-subtitle">View all your stored data</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        {(['sessions', 'interactions', 'patterns', 'assessments'] as const).map((tab) => (
          <button
            key={tab}
            className={`${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message={`Loading ${activeTab}...`} />
      ) : (
        <>
          {activeTab === 'sessions' && renderSessionData()}
          {activeTab === 'interactions' && renderInteractionData()}
          {activeTab === 'patterns' && renderPatternData()}
          {activeTab === 'assessments' && renderAssessmentData()}
        </>
      )}

      {/* Refresh Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={fetchData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
          }}
        >
          ↻ Refresh Data
        </button>
      </div>
    </div>
  );
};

export default DataBrowserPage;

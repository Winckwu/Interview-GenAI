/**
 * ThinkingHistory Component
 * Displays past critical thinking sessions with expandable details
 */

import React, { useState, useEffect, useCallback } from 'react';
import './ThinkingHistory.css';

const API_BASE = '/api';

interface ThinkingRecord {
  id: string;
  session_id?: string;
  message_id?: string;
  message_content: string;
  content_type: string;
  ai_questions: any[];
  user_responses: any[];
  needs_verification: boolean;
  summary?: string;
  created_at: string;
  completed_at?: string;
}

interface ThinkingHistoryProps {
  sessionId?: string;
  compact?: boolean;
  onSelectRecord?: (record: ThinkingRecord) => void;
}

export const ThinkingHistory: React.FC<ThinkingHistoryProps> = ({
  sessionId,
  compact = true,
  onSelectRecord,
}) => {
  const [records, setRecords] = useState<ThinkingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Track expanded questions within records: "recordId-questionId"
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      params.append('limit', '10');

      const response = await fetch(`${API_BASE}/thinking-records?${params}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch records');

      const data = await response.json();
      if (data.success) {
        // Handle both old and new response formats
        setRecords(Array.isArray(data.data) ? data.data : data.data?.records || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Get content type icon
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      code: '💻',
      math: '🔢',
      writing: '✍️',
      design: '🎨',
      general: '💬',
    };
    return icons[type] || '💬';
  };

  // Get result badge
  const getResultBadge = (record: ThinkingRecord) => {
    const responses = record.user_responses || [];
    const noCount = responses.filter((r: any) => r.response === 'no').length;
    const unsureCount = responses.filter((r: any) => r.response === 'unsure').length;

    if (noCount > 0 || record.needs_verification) {
      return <span className="th-badge th-badge-warning">⚠️ Needs Review</span>;
    }
    if (unsureCount > 0) {
      return <span className="th-badge th-badge-unsure">? Uncertain</span>;
    }
    return <span className="th-badge th-badge-good">✓ Verified</span>;
  };

  if (isLoading) {
    return (
      <div className={`th-container ${compact ? 'th-compact' : ''}`}>
        <div className="th-loading">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`th-container ${compact ? 'th-compact' : ''}`}>
        <div className="th-error">
          <p>Failed to load history</p>
          <button onClick={fetchRecords}>Retry</button>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={`th-container ${compact ? 'th-compact' : ''}`}>
        <div className="th-empty">
          <span className="th-empty-icon">📝</span>
          <p>No thinking records yet</p>
          <span className="th-empty-hint">Complete a critical thinking evaluation to see it here</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`th-container ${compact ? 'th-compact' : ''}`}>
      <div className="th-header">
        <h3>🧠 Thinking History</h3>
        <span className="th-count">{records.length} records</span>
      </div>

      <div className="th-list">
        {records.map((record) => (
          <div
            key={record.id}
            className={`th-item ${expandedId === record.id ? 'th-item-expanded' : ''}`}
          >
            <div
              className="th-item-header"
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            >
              <div className="th-item-left">
                <span className="th-item-icon">{getTypeIcon(record.content_type)}</span>
                <div className="th-item-info">
                  <span className="th-item-preview">
                    {record.message_content.slice(0, 60)}...
                  </span>
                  <span className="th-item-time">{formatDate(record.created_at)}</span>
                </div>
              </div>
              <div className="th-item-right">
                {getResultBadge(record)}
                <span className="th-item-arrow">
                  {expandedId === record.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {expandedId === record.id && (
              <div className="th-item-details">
                {/* Questions & Responses */}
                <div className="th-responses">
                  {(record.ai_questions || []).map((q: any, idx: number) => {
                    const response = (record.user_responses || []).find((r: any) => r.questionId === q.id) || (record.user_responses || [])[idx];
                    const questionKey = `${record.id}-${q.id || idx}`;
                    const isQuestionExpanded = expandedQuestion === questionKey;

                    return (
                      <div
                        key={q.id || idx}
                        className={`th-response-item ${isQuestionExpanded ? 'th-response-expanded' : ''}`}
                      >
                        <div
                          className="th-response-header"
                          onClick={() => setExpandedQuestion(isQuestionExpanded ? null : questionKey)}
                        >
                          <div className="th-response-main">
                            <span className={`th-response-icon th-icon-${response?.response || 'skip'}`}>
                              {response?.response === 'yes' && '✓'}
                              {response?.response === 'no' && '✗'}
                              {response?.response === 'unsure' && '?'}
                              {(response?.response === 'skip' || !response) && '—'}
                            </span>
                            <span className="th-response-question">{q.question}</span>
                          </div>
                          <span className="th-response-arrow">{isQuestionExpanded ? '▲' : '▼'}</span>
                        </div>
                        {isQuestionExpanded && (
                          <div className="th-response-details">
                            {q.description && (
                              <p className="th-detail-desc">{q.description}</p>
                            )}
                            {q.verificationTip && (
                              <p className="th-detail-tip">💡 {q.verificationTip}</p>
                            )}
                            {q.targetText && (
                              <p className="th-detail-target">📌 "{q.targetText.slice(0, 150)}..."</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Content Preview */}
                <div className="th-content-preview">
                  <strong>Content evaluated:</strong>
                  <p>{record.message_content.slice(0, 200)}...</p>
                </div>

                {/* Actions */}
                {onSelectRecord && (
                  <button
                    className="th-action-btn"
                    onClick={() => onSelectRecord(record)}
                  >
                    View Full Details
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThinkingHistory;

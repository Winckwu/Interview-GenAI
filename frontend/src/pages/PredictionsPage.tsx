import React, { useState } from 'react';
import { usePatternStore } from '../stores/patternStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

/**
 * Predictions Page
 * Create new predictions and view prediction history
 * Data automatically refreshes every 30 seconds to show latest predictions
 */
const PredictionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { predictions, loading, fetchPredictions, createPrediction } = usePatternStore();
  const { addNotification } = useUIStore();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    taskId: '',
    taskType: 'coding',
    complexity: 'medium',
    timeConstraint: 'adequate',
    aiAvailable: true,
  });

  // Auto-refresh predictions data every 30 seconds
  useAutoRefresh(
    [() => fetchPredictions(user?.id || '')],
    [user?.id, fetchPredictions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPrediction(formData.taskId, {
        taskType: formData.taskType,
        complexity: formData.complexity,
        timeConstraint: formData.timeConstraint,
        aiAvailable: formData.aiAvailable,
      });
      addNotification('Prediction created successfully!', 'success');
      setShowForm(false);
      setFormData({ taskId: '', taskType: 'coding', complexity: 'medium', timeConstraint: 'adequate', aiAvailable: true });
    } catch (error) {
      addNotification('Failed to create prediction', 'error');
    }
  };

  if (loading && !predictions.length) {
    return <LoadingSpinner message="Loading predictions..." />;
  }

  const predictionArray = Array.isArray(predictions) ? predictions : [];
  const userPredictions = predictionArray.filter((p) => p.userId === user?.id);
  const accuracy = userPredictions.length > 0
    ? ((userPredictions.filter((p) => p.isCorrect).length / userPredictions.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="page predictions-page">
      <div className="page-header">
        <h1>Predictions</h1>
        <p className="page-subtitle">Track your AI usage predictions and accuracy</p>
      </div>

      {/* Quick Stats */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Predictions</div>
          <div className="metric-value">{userPredictions.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Accuracy</div>
          <div className="metric-value">{accuracy}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Correct</div>
          <div className="metric-value">
            {userPredictions.filter((p) => p.isCorrect).length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending Feedback</div>
          <div className="metric-value">
            {userPredictions.filter((p) => !p.isCorrect && p.isCorrect !== false).length}
          </div>
        </div>
      </div>

      {/* New Prediction Button */}
      <div className="section-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Prediction'}
        </button>
      </div>

      {/* New Prediction Form */}
      {showForm && (
        <div className="form-card">
          <h3>Create New Prediction</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task ID</label>
              <input
                type="text"
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                placeholder="Enter task ID"
                required
              />
            </div>

            <div className="form-group">
              <label>Task Type</label>
              <select value={formData.taskType} onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}>
                <option value="coding">Coding</option>
                <option value="writing">Writing</option>
                <option value="analysis">Analysis</option>
                <option value="design">Design</option>
              </select>
            </div>

            <div className="form-group">
              <label>Complexity</label>
              <select value={formData.complexity} onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Time Constraint</label>
              <select value={formData.timeConstraint} onChange={(e) => setFormData({ ...formData, timeConstraint: e.target.value })}>
                <option value="limited">Limited</option>
                <option value="adequate">Adequate</option>
                <option value="abundant">Abundant</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">Submit Prediction</button>
          </form>
        </div>
      )}

      {/* Predictions List */}
      <div className="predictions-list">
        <h3>Prediction History</h3>
        {userPredictions.length === 0 ? (
          <div className="empty-state">
            <p>No predictions yet. Create your first prediction above.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Predicted Pattern</th>
                  <th>Actual Pattern</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {userPredictions.map((pred) => (
                  <tr key={pred.id}>
                    <td>{pred.taskId}</td>
                    <td>{pred.predictedPattern}</td>
                    <td>{pred.actualPattern || '-'}</td>
                    <td>{(pred.confidence * 100).toFixed(0)}%</td>
                    <td>
                      {pred.isCorrect === null ? (
                        <span className="badge badge-pending">Pending</span>
                      ) : pred.isCorrect ? (
                        <span className="badge badge-success">Correct</span>
                      ) : (
                        <span className="badge badge-error">Incorrect</span>
                      )}
                    </td>
                    <td>{new Date(pred.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionsPage;

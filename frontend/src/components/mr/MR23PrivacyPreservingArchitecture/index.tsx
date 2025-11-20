/**
 * MR23: Privacy-Preserving Architecture Component
 *
 * Enable professional adoption through privacy-first design and encryption.
 * Evidence: 17/49 users (35%) professionals avoid AI due to privacy
 * Market Impact: Unlocks $10B+ enterprise AI market
 *
 * React 18 + TypeScript
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PrivacySettings,
  PrivacyMode,
  ComplianceFramework,
  DataProcessingRecord,
  initializePrivacySettings,
  getEncryptionConfig,
  recordDataProcessing,
  getComplianceChecklist,
  calculateCompliancePercentage,
  generatePrivacyReport,
  getPrivacyModeComparison,
  recommendPrivacyMode,
  getPrivacyPolicyTemplate,
  validatePrivacyCompliance
} from './utils';

interface MR23Props {
  userId: string;
  onSettingsChange?: (settings: PrivacySettings) => void;
  onComplianceUpdate?: (framework: ComplianceFramework) => void;
}

const MR23PrivacyPreservingArchitecture: React.FC<MR23Props> = ({
  userId,
  onSettingsChange,
  onComplianceUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'encryption' | 'compliance' | 'report'>('settings');
  const [settings, setSettings] = useState<PrivacySettings>(() =>
    initializePrivacySettings(userId, 'hybrid')
  );
  const [processingRecords, setProcessingRecords] = useState<DataProcessingRecord[]>([]);
  const [selectedComplianceFramework, setSelectedComplianceFramework] = useState<ComplianceFramework>('gdpr');
  const [complianceChecklists, setComplianceChecklists] = useState<Record<ComplianceFramework, any>>({
    hipaa: null,
    gdpr: null,
    soc2: null,
    ccpa: null,
    none: null
  });

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`mr23-privacy-${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings(parsed.settings);
      setProcessingRecords(parsed.records || []);
    }
  }, [userId]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`mr23-privacy-${userId}`, JSON.stringify({
      settings,
      records: processingRecords
    }));
    onSettingsChange?.(settings);
  }, [settings, processingRecords, userId, onSettingsChange]);

  // Update privacy mode
  const handlePrivacyModeChange = useCallback((mode: PrivacyMode) => {
    setSettings(prev => ({
      ...prev,
      privacyMode: mode,
      dataRetention: mode === 'local' ? 0 : 90,
      encryptionEnabled: mode !== 'cloud',
      encryptionType: mode === 'cloud' ? 'tls' : mode === 'local' ? 'e2e' : 'homomorphic',
      localStorageOnly: mode === 'local',
      lastUpdated: new Date()
    }));
  }, []);

  // Update encryption type
  const handleEncryptionChange = useCallback((encType: string) => {
    setSettings(prev => ({
      ...prev,
      encryptionType: encType as any,
      encryptionEnabled: encType !== 'none',
      lastUpdated: new Date()
    }));
  }, []);

  // Log data processing
  const handleRecordProcessing = useCallback((taskType: string, dataSize: number = 1024) => {
    const record = recordDataProcessing(taskType, dataSize, settings);
    setProcessingRecords(prev => [...prev, record]);
  }, [settings]);

  // Get analysis
  const comparisonMatrix = useMemo(() => getPrivacyModeComparison(), []);
  const privacyReport = useMemo(() => generatePrivacyReport(processingRecords, settings, ['gdpr', 'hipaa']), [processingRecords, settings]);
  const encryptionConfig = useMemo(() => getEncryptionConfig(settings.encryptionType), [settings.encryptionType]);
  const complianceValidation = useMemo(
    () => validatePrivacyCompliance(settings, selectedComplianceFramework),
    [settings, selectedComplianceFramework]
  );
  const complianceChecklist = useMemo(() => {
    if (!complianceChecklists[selectedComplianceFramework]) {
      const checklist = getComplianceChecklist(selectedComplianceFramework);
      setComplianceChecklists(prev => ({
        ...prev,
        [selectedComplianceFramework]: checklist
      }));
      return checklist;
    }
    return complianceChecklists[selectedComplianceFramework];
  }, [selectedComplianceFramework, complianceChecklists]);

  return (
    <div className="mr23-privacy-architecture">
      <div className="mr23-header">
        <h2>Privacy-Preserving Architecture</h2>
        <p>Professional-grade privacy controls and compliance management</p>
      </div>

      <div className="mr23-container">
        {/* Navigation */}
        <div className="mr23-nav-tabs">
          <button
            className={`mr23-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Privacy Settings
          </button>
          <button
            className={`mr23-tab ${activeTab === 'encryption' ? 'active' : ''}`}
            onClick={() => setActiveTab('encryption')}
          >
            Encryption & Security
          </button>
          <button
            className={`mr23-tab ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            Compliance
          </button>
          <button
            className={`mr23-tab ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            Privacy Report
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="mr23-tab-content">
            <div className="mr23-section">
              <h3>Choose Your Privacy Mode</h3>
              <p className="section-description">
                Select how your data is processed and stored
              </p>

              <div className="mr23-privacy-modes">
                {(['cloud', 'hybrid', 'federated', 'local'] as const).map(mode => {
                  const metrics = comparisonMatrix[mode];
                  return (
                    <div
                      key={mode}
                      className={`mr23-mode-card ${settings.privacyMode === mode ? 'selected' : ''}`}
                      onClick={() => handlePrivacyModeChange(mode)}
                    >
                      <div className="mode-icon">
                        {mode === 'cloud' && '☁️'}
                        {mode === 'local' && '🖥️'}
                        {mode === 'federated' && '🔄'}
                        {mode === 'hybrid' && '⚡'}
                      </div>

                      <h4>{mode.charAt(0).toUpperCase() + mode.slice(1)}</h4>

                      <div className="mode-description">
                        {mode === 'cloud' && 'Fast processing in the cloud. Standard privacy.'}
                        {mode === 'local' && 'All processing on your device. Maximum privacy.'}
                        {mode === 'federated' && 'Distributed learning. Privacy + collaboration.'}
                        {mode === 'hybrid' && 'Best of both worlds. Recommended for most users.'}
                      </div>

                      <div className="mode-metrics">
                        <div className="metric">
                          <span className="label">Speed</span>
                          <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${metrics.speed}%` }} />
                          </div>
                          <span className="value">{metrics.speed}%</span>
                        </div>
                        <div className="metric">
                          <span className="label">Privacy</span>
                          <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${metrics.privacy}%` }} />
                          </div>
                          <span className="value">{metrics.privacy}%</span>
                        </div>
                      </div>

                      {settings.privacyMode === mode && (
                        <div className="mode-selected-badge">✓ Selected</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data Retention */}
            <div className="mr23-section">
              <h3>Data Retention Policy</h3>
              <div className="mr23-setting-group">
                <label>Data Retention Period</label>
                <div className="mr23-retention-controls">
                  <select
                    value={settings.dataRetention}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      dataRetention: parseInt(e.target.value),
                      lastUpdated: new Date()
                    }))}
                  >
                    <option value="0">Immediate Deletion (Local Mode)</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days (Recommended)</option>
                    <option value="180">180 Days</option>
                    <option value="365">1 Year</option>
                  </select>
                  <p className="setting-description">
                    {settings.dataRetention === 0
                      ? 'Data is deleted immediately after processing. Requires local mode.'
                      : `Data is automatically deleted after ${settings.dataRetention} days.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="mr23-section">
              <h3>Additional Privacy Options</h3>
              <div className="mr23-setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.debugLoggingEnabled}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      debugLoggingEnabled: e.target.checked,
                      lastUpdated: new Date()
                    }))}
                  />
                  Enable Debug Logging (Development Only)
                </label>
                <p className="setting-description">
                  Warning: Disables some privacy protections. Should only be enabled during development.
                </p>
              </div>

              <div className="mr23-setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.encryptionEnabled}
                    onChange={e => setSettings(prev => ({
                      ...prev,
                      encryptionEnabled: e.target.checked,
                      lastUpdated: new Date()
                    }))}
                  />
                  Enable End-to-End Encryption
                </label>
                <p className="setting-description">
                  Encrypt all data before transmission. Slight performance impact.
                </p>
              </div>
            </div>

            {/* Consent */}
            <div className="mr23-section consent-section">
              <h3>Privacy Consent</h3>
              <div className="consent-checkbox">
                <label>
                  <input type="checkbox" defaultChecked />I agree to the privacy policy and data processing terms
                </label>
              </div>
              <p className="section-description">
                Last updated: {settings.lastUpdated.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Encryption Tab */}
        {activeTab === 'encryption' && (
          <div className="mr23-tab-content">
            <div className="mr23-section encryption-options">
              <h3>Encryption Configuration</h3>
              <p className="section-description">
                Select encryption type for your data
              </p>

              <div className="mr23-encryption-modes">
                {(['none', 'tls', 'e2e', 'homomorphic'] as const).map(encType => {
                  const config = getEncryptionConfig(encType);
                  return (
                    <div
                      key={encType}
                      className={`mr23-encryption-card ${settings.encryptionType === encType ? 'selected' : ''}`}
                      onClick={() => handleEncryptionChange(encType)}
                    >
                      <div className="encryption-header">
                        <h4>{config.algorithm}</h4>
                        <span className="privacy-level">Privacy: {config.privacyLevel}/5</span>
                      </div>

                      <p className="description">{config.description}</p>

                      <div className="encryption-specs">
                        <div className="spec">
                          <span className="label">Key Length</span>
                          <span className="value">{config.keyLength} bits</span>
                        </div>
                        <div className="spec">
                          <span className="label">Performance Impact</span>
                          <span className="value">{config.performanceImpact}</span>
                        </div>
                      </div>

                      {settings.encryptionType === encType && (
                        <div className="encryption-selected">✓ Active</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Encryption Details */}
              <div className="mr23-section active-encryption">
                <h3>Current Encryption Configuration</h3>
                <div className="encryption-details">
                  <div className="detail-item">
                    <span className="label">Algorithm</span>
                    <span className="value">{encryptionConfig.algorithm}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Key Length</span>
                    <span className="value">{encryptionConfig.keyLength} bits</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Privacy Level</span>
                    <span className="value">{encryptionConfig.privacyLevel}/5</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Performance Impact</span>
                    <span className="value">{encryptionConfig.performanceImpact}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="mr23-tab-content">
            <div className="mr23-section">
              <h3>Compliance Management</h3>

              <div className="mr23-framework-selector">
                <label>Select Compliance Framework</label>
                <select
                  value={selectedComplianceFramework}
                  onChange={e => setSelectedComplianceFramework(e.target.value as ComplianceFramework)}
                >
                  <option value="gdpr">GDPR (EU)</option>
                  <option value="hipaa">HIPAA (Healthcare)</option>
                  <option value="soc2">SOC 2 (Cloud Services)</option>
                  <option value="ccpa">CCPA (California Privacy)</option>
                </select>
              </div>

              {/* Compliance Score */}
              <div className="mr23-compliance-score">
                <div className="score-circle">
                  <div className="score-value">{complianceValidation.score}%</div>
                  <div className="score-label">Compliance</div>
                </div>

                {complianceValidation.compliant ? (
                  <div className="compliance-status compliant">
                    <div className="status-icon">✓</div>
                    <div className="status-text">
                      Your current settings appear compliant with {selectedComplianceFramework.toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="compliance-status non-compliant">
                    <div className="status-icon">⚠️</div>
                    <div className="status-text">
                      There are {complianceValidation.issues.length} compliance issue(s) to address
                    </div>
                  </div>
                )}
              </div>

              {/* Issues */}
              {complianceValidation.issues.length > 0 && (
                <div className="mr23-issues">
                  <h4>Compliance Issues</h4>
                  <ul>
                    {complianceValidation.issues.map((issue, idx) => (
                      <li key={idx} className="issue-item">
                        <span className="issue-icon">⚠️</span>
                        <span className="issue-text">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements Checklist */}
              {complianceChecklist && (
                <div className="mr23-requirements">
                  <h4>Requirements Checklist</h4>
                  <div className="mr23-checklist">
                    {complianceChecklist.requirements.slice(0, 5).map((req, idx) => (
                      <div key={idx} className={`checklist-item ${req.status}`}>
                        <input
                          type="checkbox"
                          checked={req.status === 'met'}
                          onChange={() => {
                            // Update checklist
                            const updatedReq = { ...req, status: req.status === 'met' ? 'not-met' : 'met' as any };
                            const updated = [...complianceChecklist.requirements];
                            updated[idx] = updatedReq;
                            setComplianceChecklists(prev => ({
                              ...prev,
                              [selectedComplianceFramework]: { ...complianceChecklist, requirements: updated }
                            }));
                          }}
                        />
                        <span className="requirement-text">{req.requirement}</span>
                        <span className={`status-badge ${req.status}`}>{req.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="mr23-tab-content">
            <div className="mr23-section privacy-report">
              <h3>Privacy Report</h3>
              <p className="report-period">
                Period: {privacyReport.periodStart.toLocaleDateString()} - {privacyReport.periodEnd.toLocaleDateString()}
              </p>

              <div className="mr23-report-grid">
                <div className="report-item">
                  <span className="label">Total Data Points Processed</span>
                  <span className="value">{privacyReport.totalProcessed}</span>
                </div>
                <div className="report-item">
                  <span className="label">Data Encrypted</span>
                  <span className="value">{privacyReport.encryptedData} ({Math.round((privacyReport.encryptedData / privacyReport.totalProcessed) * 100 || 0)}%)</span>
                </div>
                <div className="report-item">
                  <span className="label">Data Deleted</span>
                  <span className="value">{privacyReport.deletedData}</span>
                </div>
                <div className="report-item">
                  <span className="label">Data Breaches</span>
                  <span className="value alert">{privacyReport.dataBreaches}</span>
                </div>
              </div>

              {/* Compliance Status */}
              <div className="mr23-compliance-summary">
                <h4>Compliance Status by Framework</h4>
                <div className="mr23-frameworks">
                  {Object.entries(privacyReport.complianceStatus).map(([framework, percentage]) => (
                    framework !== 'none' && (
                      <div key={framework} className="framework-status">
                        <span className="framework-name">{framework.toUpperCase()}</span>
                        <div className="compliance-bar">
                          <div
                            className="compliance-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: percentage > 80 ? '#4caf50' : percentage > 50 ? '#ff9800' : '#f44336'
                            }}
                          />
                        </div>
                        <span className="percentage">{percentage}%</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {privacyReport.recommendations.length > 0 && (
                <div className="mr23-recommendations">
                  <h4>Recommendations</h4>
                  <ul>
                    {privacyReport.recommendations.map((rec, idx) => (
                      <li key={idx}>
                        <span className="icon">💡</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MR23PrivacyPreservingArchitecture;

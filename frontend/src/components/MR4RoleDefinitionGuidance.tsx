/**
 * MR4: Role Definition Guidance - React Component
 *
 * Helps users explicitly define what role(s) AI should play in their task.
 * This clarifies expectations and prevents misalignment.
 *
 * Design Rationale (from 49 interviews, 39% of users):
 * - Users often don't know what role to expect AI to play
 * - Role mismatch causes trust miscalibration (trust for one role ≠ trust for another)
 * - Clear role definition helps craft better prompts
 * - Multiple roles can be combined for complex tasks
 *
 * Key insight: Role definition is orthogonal to human agency (MR3)
 * - MR3 controls "who makes decisions"
 * - MR4 clarifies "what specific work AI does"
 */

import React, { useState, useCallback } from 'react';
import {
  AIRole,
  getRoleTemplate,
  getRecommendedRoles,
  getRolesByTaskType,
  ALL_ROLES,
  RoleContext,
} from './MR4RoleDefinitionGuidance.utils';
import './MR4RoleDefinitionGuidance.css';

/**
 * Props for MR4 component
 */
interface MR4Props {
  taskType?: string;
  onRoleSelected?: (roles: AIRole[]) => void;
  onRoleConfirmed?: (context: RoleContext) => void;
  selectedRoles?: AIRole[];
  allowMultipleRoles?: boolean;
  showExamples?: boolean;
}

/**
 * MR4 Component: Role Definition Guidance
 *
 * Guides users through selecting and defining AI roles for their collaboration
 */
export const MR4RoleDefinitionGuidance: React.FC<MR4Props> = ({
  taskType = 'general',
  onRoleSelected,
  onRoleConfirmed,
  selectedRoles: initialRoles = [],
  allowMultipleRoles = true,
  showExamples = true,
}) => {
  // State management
  const [selectedRoles, setSelectedRoles] = useState<AIRole[]>(initialRoles);
  const [activeTab, setActiveTab] = useState<'select' | 'details' | 'confirm'>('select');
  const [expandedRole, setExpandedRole] = useState<AIRole | null>(null);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [roleConfirmationNotes, setRoleConfirmationNotes] = useState('');

  // Recommended roles for the task type
  const recommendedRoles = getRecommendedRoles(taskType);

  /**
   * Handle role selection
   */
  const handleRoleSelect = useCallback(
    (role: AIRole) => {
      let updated: AIRole[];

      if (allowMultipleRoles) {
        if (selectedRoles.includes(role)) {
          updated = selectedRoles.filter(r => r !== role);
        } else {
          updated = [...selectedRoles, role];
        }
      } else {
        updated = selectedRoles[0] === role ? [] : [role];
      }

      setSelectedRoles(updated);
      onRoleSelected?.(updated);
    },
    [selectedRoles, allowMultipleRoles, onRoleSelected]
  );

  /**
   * Handle role confirmation
   */
  const handleConfirmRoles = useCallback(() => {
    if (selectedRoles.length === 0) return;

    const context: RoleContext = {
      selectedRoles,
      taskType,
      notes: roleConfirmationNotes,
      timestamp: new Date(),
      multipleRoles: selectedRoles.length > 1,
    };

    onRoleConfirmed?.(context);
  }, [selectedRoles, taskType, roleConfirmationNotes, onRoleConfirmed]);

  /**
   * Render role selection view
   */
  const renderRoleSelection = () => {
    return (
      <div className="mr4-selection-view">
        <div className="mr4-view-header">
          <h2 className="mr4-view-title">Select AI Role(s)</h2>
          <p className="mr4-view-subtitle">
            Choose one or more roles that describe what you want AI to do in this task
          </p>
        </div>

        {recommendedRoles.length > 0 && (
          <div className="mr4-recommended-section">
            <h3 className="mr4-section-label">Recommended for {taskType}</h3>
            <div className="mr4-roles-grid">
              {recommendedRoles.map(role => (
                <RoleCard
                  key={role}
                  role={role}
                  isSelected={selectedRoles.includes(role)}
                  isRecommended={true}
                  onSelect={() => handleRoleSelect(role)}
                  onExpand={() => setExpandedRole(role)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mr4-all-roles-section">
          <h3 className="mr4-section-label">All Available Roles</h3>
          <div className="mr4-roles-grid">
            {ALL_ROLES.filter(role => !recommendedRoles.includes(role)).map(role => (
              <RoleCard
                key={role}
                role={role}
                isSelected={selectedRoles.includes(role)}
                isRecommended={false}
                onSelect={() => handleRoleSelect(role)}
                onExpand={() => setExpandedRole(role)}
              />
            ))}
          </div>
        </div>

        {selectedRoles.length > 0 && (
          <button
            className="mr4-next-btn"
            onClick={() => setActiveTab('details')}
          >
            View Selected Roles ({selectedRoles.length})
          </button>
        )}
      </div>
    );
  };

  /**
   * Render role details view
   */
  const renderRoleDetails = () => {
    if (selectedRoles.length === 0) {
      return (
        <div className="mr4-details-view">
          <p className="mr4-empty-message">No roles selected. Go back and select at least one role.</p>
        </div>
      );
    }

    return (
      <div className="mr4-details-view">
        <div className="mr4-view-header">
          <h2 className="mr4-view-title">Role Details</h2>
          <p className="mr4-view-subtitle">
            Understanding what each role can and cannot do
          </p>
        </div>

        <div className="mr4-role-details-grid">
          {selectedRoles.map(role => {
            const template = getRoleTemplate(role);
            return (
              <div key={role} className="mr4-role-detail-card">
                <h3 className="mr4-role-detail-title">{template.displayName}</h3>

                <div className="mr4-role-detail-section">
                  <h4 className="mr4-detail-section-label">✅ This role CAN do:</h4>
                  <ul className="mr4-capability-list">
                    {template.canDo.map((capability, idx) => (
                      <li key={idx} className="mr4-capability-item">
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mr4-role-detail-section">
                  <h4 className="mr4-detail-section-label">❌ This role CANNOT do:</h4>
                  <ul className="mr4-limitation-list">
                    {template.cannotDo.map((limitation, idx) => (
                      <li key={idx} className="mr4-limitation-item">
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`mr4-trust-level mr4-trust-${template.trustLevel}`}>
                  <span className="mr4-trust-label">Suggested Trust Level:</span>
                  <span className="mr4-trust-value">{template.trustLevelDescription}</span>
                </div>

                {template.example && showExamples && (
                  <div className="mr4-example-box">
                    <h4 className="mr4-example-title">📌 Example from research:</h4>
                    <p className="mr4-example-text">{template.example}</p>
                  </div>
                )}

                <div className="mr4-prompt-guidance">
                  <h4 className="mr4-prompt-title">💡 How to prompt this role:</h4>
                  <p className="mr4-prompt-text">{template.promptGuidance}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mr4-buttons-group">
          <button className="mr4-back-btn" onClick={() => setActiveTab('select')}>
            ← Back
          </button>
          <button className="mr4-confirm-btn" onClick={() => setActiveTab('confirm')}>
            Next: Confirm Roles →
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render role confirmation view
   */
  const renderRoleConfirmation = () => {
    return (
      <div className="mr4-confirmation-view">
        <div className="mr4-view-header">
          <h2 className="mr4-view-title">Confirm Your AI Roles</h2>
          <p className="mr4-view-subtitle">
            You've selected these roles. You can change them anytime during the task.
          </p>
        </div>

        <div className="mr4-selected-roles-summary">
          <h3 className="mr4-summary-title">Selected Roles</h3>
          <div className="mr4-roles-summary-list">
            {selectedRoles.map((role, idx) => {
              const template = getRoleTemplate(role);
              return (
                <div key={role} className="mr4-summary-item">
                  <span className="mr4-summary-number">{idx + 1}.</span>
                  <div className="mr4-summary-content">
                    <h4 className="mr4-summary-role-name">{template.displayName}</h4>
                    <p className="mr4-summary-description">{template.description}</p>
                  </div>
                  <button
                    className="mr4-remove-role-btn"
                    onClick={() => handleRoleSelect(role)}
                    title="Remove this role"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {selectedRoles.length > 1 && (
          <div className="mr4-multi-role-info">
            <h3 className="mr4-info-title">ℹ️ Using Multiple Roles</h3>
            <p className="mr4-info-text">
              You've assigned multiple roles to AI. This is helpful when different parts of your task need different contributions. Make sure to clarify in your instructions which role applies to which part.
            </p>
          </div>
        )}

        <div className="mr4-confirmation-notes">
          <label className="mr4-notes-label">
            📝 Optional: Notes about your role setup
          </label>
          <textarea
            className="mr4-notes-textarea"
            value={roleConfirmationNotes}
            onChange={e => setRoleConfirmationNotes(e.target.value)}
            placeholder="E.g., 'Use Research Assistant mode for data collection, Draft Generator for initial copy'"
          />
        </div>

        <div className="mr4-confirmation-guidelines">
          <h3 className="mr4-guidelines-title">📋 Tips for Success</h3>
          <ul className="mr4-guidelines-list">
            <li className="mr4-guideline-item">
              <strong>Be explicit:</strong> Tell AI which role to use for each part
            </li>
            <li className="mr4-guideline-item">
              <strong>Stay consistent:</strong> Use the same role names throughout the conversation
            </li>
            <li className="mr4-guideline-item">
              <strong>Adjust as needed:</strong> Change roles if you discover AI isn't performing as expected
            </li>
            <li className="mr4-guideline-item">
              <strong>Align expectations:</strong> Remember the limitations of each role
            </li>
          </ul>
        </div>

        <div className="mr4-buttons-group">
          <button className="mr4-back-btn" onClick={() => setActiveTab('details')}>
            ← Back
          </button>
          <button
            className="mr4-confirm-btn"
            onClick={handleConfirmRoles}
            disabled={selectedRoles.length === 0}
          >
            Confirm & Start Task ✓
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render expanded role modal
   */
  const renderRoleModal = () => {
    if (!expandedRole) return null;

    const template = getRoleTemplate(expandedRole);

    return (
      <div className="mr4-modal-overlay" onClick={() => setExpandedRole(null)}>
        <div className="mr4-modal-content" onClick={e => e.stopPropagation()}>
          <button className="mr4-modal-close" onClick={() => setExpandedRole(null)}>
            ✕
          </button>

          <h3 className="mr4-modal-title">{template.displayName}</h3>
          <p className="mr4-modal-description">{template.description}</p>

          <div className="mr4-modal-section">
            <h4 className="mr4-modal-section-title">Capabilities</h4>
            <ul className="mr4-modal-list">
              {template.canDo.map((item, idx) => (
                <li key={idx}>✅ {item}</li>
              ))}
            </ul>
          </div>

          <div className="mr4-modal-section">
            <h4 className="mr4-modal-section-title">Limitations</h4>
            <ul className="mr4-modal-list">
              {template.cannotDo.map((item, idx) => (
                <li key={idx}>⚠️ {item}</li>
              ))}
            </ul>
          </div>

          <div className="mr4-modal-section">
            <h4 className="mr4-modal-section-title">Prompt Examples</h4>
            <div className="mr4-prompt-examples">
              {template.promptExamples.map((example, idx) => (
                <code key={idx} className="mr4-prompt-example">
                  {example}
                </code>
              ))}
            </div>
          </div>

          <button
            className="mr4-modal-select-btn"
            onClick={() => {
              handleRoleSelect(expandedRole);
              setExpandedRole(null);
            }}
          >
            {selectedRoles.includes(expandedRole) ? '✓ Selected' : 'Select This Role'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mr4-container">
      <div className="mr4-header">
        <h1 className="mr4-title">AI Role Definition</h1>
        <p className="mr4-subtitle">
          Define what role(s) you want AI to play in this task. Clear role definition leads to better results.
        </p>
      </div>

      <div className="mr4-tabs">
        <button
          className={`mr4-tab ${activeTab === 'select' ? 'active' : ''}`}
          onClick={() => setActiveTab('select')}
        >
          1. Select Role
        </button>
        <button
          className={`mr4-tab ${activeTab === 'details' ? 'active' : ''} ${selectedRoles.length === 0 ? 'disabled' : ''}`}
          onClick={() => selectedRoles.length > 0 && setActiveTab('details')}
        >
          2. Review Details
        </button>
        <button
          className={`mr4-tab ${activeTab === 'confirm' ? 'active' : ''} ${selectedRoles.length === 0 ? 'disabled' : ''}`}
          onClick={() => selectedRoles.length > 0 && setActiveTab('confirm')}
        >
          3. Confirm
        </button>
      </div>

      <div className="mr4-content">
        {activeTab === 'select' && renderRoleSelection()}
        {activeTab === 'details' && renderRoleDetails()}
        {activeTab === 'confirm' && renderRoleConfirmation()}
      </div>

      {renderRoleModal()}

      <div className="mr4-info-footer">
        <p className="mr4-footer-text">
          💡 <strong>Tip:</strong> If you're unsure about roles, start with a recommended one and adjust as needed.
          You can change roles anytime during the task.
        </p>
      </div>
    </div>
  );
};

/**
 * Role Card Component
 */
interface RoleCardProps {
  role: AIRole;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isSelected,
  isRecommended,
  onSelect,
  onExpand,
}) => {
  const template = getRoleTemplate(role);

  return (
    <div
      className={`mr4-role-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
    >
      {isRecommended && <div className="mr4-recommended-badge">Recommended</div>}

      <h3 className="mr4-card-title">{template.displayName}</h3>
      <p className="mr4-card-description">{template.description}</p>

      <div className={`mr4-card-trust-level mr4-trust-${template.trustLevel}`}>
        Trust: {template.trustLevelDescription}
      </div>

      <div className="mr4-card-actions">
        <button className="mr4-card-expand-btn" onClick={onExpand}>
          Learn More
        </button>
        <button
          className={`mr4-card-select-btn ${isSelected ? 'selected' : ''}`}
          onClick={onSelect}
        >
          {isSelected ? '✓ Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
};

export default MR4RoleDefinitionGuidance;

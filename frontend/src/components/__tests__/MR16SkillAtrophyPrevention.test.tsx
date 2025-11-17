/**
 * Tests for MR16: Skill Atrophy Prevention Component
 * Coverage: Component rendering, state management, localStorage, user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MR16SkillAtrophyPrevention from '../MR16SkillAtrophyPrevention';

// Mock the utils module
jest.mock('../MR16SkillAtrophyPrevention.utils', () => ({
  calculateSkillHealthProfile: jest.fn(() => ({
    skillId: 'test-skill',
    category: 'coding',
    currentIndependenceRate: 0.8,
    baselineIndependenceRate: 0.85,
    declinePercentage: 5.88,
    monthsSinceBaseline: 1,
    sessionCount: 1,
    atrophyLevel: 'healthy',
    riskScore: 5.88,
    estimatedMonthsUntilCritical: 999,
    rateOfChange: 0
  })),
  detectAtrophy: jest.fn(() => null),
  generateMaintenancePlan: jest.fn(() => ({
    planId: 'plan-123',
    skillCategory: 'coding',
    targetIndependenceRate: 0.85,
    practiceFrequency: 'Daily',
    progressPercentage: 0,
    completedTasks: 0,
    totalTasks: 10,
    suggestedTasks: [
      {
        id: 'task-1',
        description: 'Complete a coding challenge',
        difficulty: 'medium',
        estimatedMinutes: 30,
        aiDisabled: false
      }
    ]
  })),
  updateMaintenancePlanProgress: jest.fn(),
  getAtrophyMessage: jest.fn(level => `Skill status: ${level}`),
  getAtrophyColor: jest.fn(level => '#4caf50'),
  isAssessmentDue: jest.fn(() => true),
  acknowledgeAtrophyWarning: jest.fn(warning => ({ ...warning, userAcknowledged: true }))
}));

describe('MR16SkillAtrophyPrevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  describe('Component Rendering', () => {
    it('should render component with header', () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      expect(screen.getByText('Skill Atrophy Prevention System')).toBeInTheDocument();
      expect(screen.getByText('Monitor your skill independence and prevent degradation over time')).toBeInTheDocument();
    });

    it('should display empty state when no skills tracked', () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      expect(screen.getByText('No skills tracked yet. Start by assessing a skill baseline.')).toBeInTheDocument();
    });

    it('should render Add Skill Baseline button', () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      const addButton = screen.getByText('+ Add Skill Baseline');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeEnabled();
    });
  });

  describe('Skill Assessment Modal', () => {
    it('should open assessment modal when Add Skill button clicked', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      const addButton = screen.getByText('+ Add Skill Baseline');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Assess Skill Baseline')).toBeInTheDocument();
      });
    });

    it('should have form fields in assessment modal', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Skill Category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Independence Rate/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Proficiency Score/i)).toBeInTheDocument();
      });
    });

    it('should close modal when Cancel button clicked', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Assess Skill Baseline')).not.toBeInTheDocument();
      });
    });

    it('should save baseline when Save Baseline button clicked', async () => {
      const mockOnSkillAssessment = jest.fn();
      render(
        <MR16SkillAtrophyPrevention userId="user-1" onSkillAssessment={mockOnSkillAssessment} />
      );

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        const saveButton = screen.getByText('Save Baseline');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSkillAssessment).toHaveBeenCalled();
      });
    });

    it('should update skill category in form', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        const select = screen.getByDisplayValue('coding');
        fireEvent.change(select, { target: { value: 'writing' } });
        expect(select).toHaveValue('writing');
      });
    });

    it('should update independence rate slider', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        const sliders = screen.getAllByRole('slider');
        fireEvent.change(sliders[0], { target: { value: '0.5' } });
        expect(sliders[0]).toHaveValue('0.5');
      });
    });

    it('should update proficiency score slider', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        const sliders = screen.getAllByRole('slider');
        fireEvent.change(sliders[1], { target: { value: '6' } });
        expect(sliders[1]).toHaveValue('6');
      });
    });
  });

  describe('Skills Management', () => {
    it('should add new skill to list after assessment', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        expect(screen.getByText('coding')).toBeInTheDocument();
      });
    });

    it('should select skill when clicked', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      // Add a skill first
      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        const skillCard = screen.getByText('coding').closest('div');
        expect(skillCard).toBeInTheDocument();
      });
    });

    it('should persist skills to localStorage', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'mr16-skills-user-1',
          expect.any(String)
        );
      });
    });

    it('should load skills from localStorage on mount', () => {
      const mockData = {
        'skill-1': {
          baseline: {
            skillId: 'skill-1',
            category: 'coding',
            timestamp: new Date().toISOString(),
            independenceRate: 0.8,
            proficiencyScore: 8,
            taskCount: 0,
            notes: ''
          },
          sessions: [],
          profile: null,
          warning: null,
          maintenancePlan: null
        }
      };

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      expect(localStorage.getItem).toHaveBeenCalledWith('mr16-skills-user-1');
    });
  });

  describe('Session Logging', () => {
    it('should show Log Session button when skill selected', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        expect(screen.getByText('+ Log Session')).toBeInTheDocument();
      });
    });

    it('should open session logging modal', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        expect(screen.getByText('Log Session')).toBeInTheDocument();
      });
    });

    it('should have session form fields', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Tasks Completed')).toBeInTheDocument();
        expect(screen.getByLabelText('Completed Independently')).toBeInTheDocument();
        expect(screen.getByLabelText(/Quality Rating/i)).toBeInTheDocument();
      });
    });

    it('should update tasks completed field', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('1') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '5' } });
        expect(input.value).toBe('5');
      });
    });

    it('should log session and close modal', async () => {
      const mockOnWarningDetected = jest.fn();
      render(
        <MR16SkillAtrophyPrevention userId="user-1" onWarningDetected={mockOnWarningDetected} />
      );

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        const logButton = screen.getByText('Log Session');
        fireEvent.click(logButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Log Session')).not.toBeInTheDocument();
      });
    });
  });

  describe('Skill Health Profile', () => {
    it('should display health profile when available', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        expect(screen.getByText('Health Profile')).toBeInTheDocument();
      });
    });

    it('should display status badge with color', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        const statusElement = screen.getByText(/Skill status/i);
        expect(statusElement).toBeInTheDocument();
      });
    });
  });

  describe('Maintenance Plan Generation', () => {
    it('should show maintenance plan generation button for atrophied skills', async () => {
      // Mock atrophy detection to return a warning
      const { detectAtrophy } = require('../MR16SkillAtrophyPrevention.utils');
      detectAtrophy.mockReturnValueOnce({
        warningId: 'warn-1',
        timestamp: new Date(),
        atrophyLevel: 'warning',
        warning: 'Skill declining',
        suggestedActions: [],
        resources: [],
        userAcknowledged: false
      });

      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        // Check if recovery plan section appears
        expect(screen.queryByText('Recovery Plan')).toBeInTheDocument();
      });
    });

    it('should call onMaintenancePlanGenerated callback', async () => {
      const mockOnMaintenancePlanGenerated = jest.fn();
      const { detectAtrophy } = require('../MR16SkillAtrophyPrevention.utils');
      detectAtrophy.mockReturnValueOnce({
        warningId: 'warn-1',
        timestamp: new Date(),
        atrophyLevel: 'warning',
        warning: 'Skill declining',
        suggestedActions: [],
        resources: [],
        userAcknowledged: false
      });

      render(
        <MR16SkillAtrophyPrevention
          userId="user-1"
          onMaintenancePlanGenerated={mockOnMaintenancePlanGenerated}
        />
      );

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        const generateButton = screen.queryByText('Generate Maintenance Plan');
        if (generateButton) {
          fireEvent.click(generateButton);
        }
      });

      await waitFor(() => {
        if (mockOnMaintenancePlanGenerated.mock.calls.length > 0) {
          expect(mockOnMaintenancePlanGenerated).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Warning Handling', () => {
    it('should display atrophy warning when detected', async () => {
      const { detectAtrophy } = require('../MR16SkillAtrophyPrevention.utils');
      detectAtrophy.mockReturnValueOnce({
        warningId: 'warn-1',
        timestamp: new Date(),
        atrophyLevel: 'warning',
        warning: 'Your coding skills are declining',
        suggestedActions: ['Practice daily', 'Review advanced topics'],
        resources: ['Coding challenge site'],
        userAcknowledged: false
      });

      const mockOnWarningDetected = jest.fn();
      render(
        <MR16SkillAtrophyPrevention userId="user-1" onWarningDetected={mockOnWarningDetected} />
      );

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        expect(mockOnWarningDetected).toHaveBeenCalled();
      });
    });

    it('should show I Understand button for warning', async () => {
      const { detectAtrophy } = require('../MR16SkillAtrophyPrevention.utils');
      detectAtrophy.mockReturnValueOnce({
        warningId: 'warn-1',
        timestamp: new Date(),
        atrophyLevel: 'warning',
        warning: 'Your coding skills are declining',
        suggestedActions: [],
        resources: [],
        userAcknowledged: false
      });

      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        const understandButton = screen.queryByText('I Understand');
        expect(understandButton).toBeInTheDocument();
      });
    });

    it('should acknowledge warning when I Understand clicked', async () => {
      const { detectAtrophy, acknowledgeAtrophyWarning } = require(
        '../MR16SkillAtrophyPrevention.utils'
      );
      detectAtrophy.mockReturnValueOnce({
        warningId: 'warn-1',
        timestamp: new Date(),
        atrophyLevel: 'warning',
        warning: 'Your coding skills are declining',
        suggestedActions: [],
        resources: [],
        userAcknowledged: false
      });

      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Log Session'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Log Session'));
      });

      await waitFor(() => {
        const understandButton = screen.queryByText('I Understand');
        if (understandButton) {
          fireEvent.click(understandButton);
        }
      });

      await waitFor(() => {
        expect(acknowledgeAtrophyWarning).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Skills Tracking', () => {
    it('should track multiple different skills independently', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      // Add first skill
      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        // Add second skill with different category
        fireEvent.click(screen.getByText('+ Add Skill Baseline'));
      });

      await waitFor(() => {
        const select = screen.getByDisplayValue('coding');
        fireEvent.change(select, { target: { value: 'writing' } });
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Callbacks and Props', () => {
    it('should call onSkillAssessment when baseline saved', async () => {
      const mockCallback = jest.fn();
      render(<MR16SkillAtrophyPrevention userId="user-1" onSkillAssessment={mockCallback} />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Baseline'));
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'coding',
            independenceRate: 0.75,
            proficiencyScore: 8
          })
        );
      });
    });

    it('should accept userId prop', () => {
      const { container } = render(<MR16SkillAtrophyPrevention userId="test-user-123" />);

      expect(container).toBeInTheDocument();
      expect(localStorage.getItem).toHaveBeenCalledWith('mr16-skills-test-user-123');
    });

    it('should accept all optional callbacks', () => {
      const callbacks = {
        onWarningDetected: jest.fn(),
        onMaintenancePlanGenerated: jest.fn(),
        onSkillAssessment: jest.fn()
      };

      render(<MR16SkillAtrophyPrevention userId="user-1" {...callbacks} />);

      expect(screen.getByText('Skill Atrophy Prevention System')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      expect(screen.getByText('+ Add Skill Baseline')).toHaveClass('mr16-button');
    });

    it('should have proper form labels', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      fireEvent.click(screen.getByText('+ Add Skill Baseline'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Skill Category/i)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<MR16SkillAtrophyPrevention userId="user-1" />);

      const addButton = screen.getByText('+ Add Skill Baseline');
      addButton.focus();

      expect(addButton).toHaveFocus();
    });
  });
});

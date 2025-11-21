import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';

interface OnboardingTourProps {
  /** Which page/context the tour is running in */
  context: 'dashboard' | 'chat';
  /** Callback when tour is completed or skipped */
  onComplete?: () => void;
}

/**
 * OnboardingTour Component
 * Interactive first-time user guide using react-joyride
 * Highlights key features and guides users through the system
 */
const OnboardingTour: React.FC<OnboardingTourProps> = ({ context, onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // LocalStorage keys
  const TOUR_COMPLETED_KEY = `onboarding_tour_completed_${context}`;
  const TOUR_SKIPPED_KEY = `onboarding_tour_skipped_${context}`;

  // Check if user has completed or skipped the tour
  useEffect(() => {
    const hasCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    const hasSkipped = localStorage.getItem(TOUR_SKIPPED_KEY) === 'true';

    // Auto-start tour if not completed and not skipped
    if (!hasCompleted && !hasSkipped) {
      // Delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [TOUR_COMPLETED_KEY, TOUR_SKIPPED_KEY]);

  // Define tour steps for Dashboard
  const dashboardSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#1f2937' }}>
            Welcome to AI Pattern Recognition System! 👋
          </h2>
          <p style={{ margin: '0', fontSize: '1rem', lineHeight: '1.6', color: '#4b5563' }}>
            Let's take a quick tour to help you get started. This will only take a minute!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="quick-start"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            Quick Start Guide
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            Start here! Follow these 4 steps to get the most out of the system.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="metrics"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            Your Metrics
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            Track your AI interaction patterns, verification rates, and modification behaviors here.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="sidebar-chat"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            AI Chat
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            Click here to start chatting with AI. The system monitors your interactions and provides intelligent interventions.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="sidebar-patterns"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            Pattern Analysis
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            View your AI usage patterns (A-F) and metacognitive assessment scores.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="sidebar-help"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            Help & Documentation
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            Need help? Click here for comprehensive guides, MR explanations, and FAQs.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#1f2937' }}>
            You're all set! 🎉
          </h2>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', lineHeight: '1.6', color: '#4b5563' }}>
            You're ready to start using the AI Pattern Recognition System. Start by clicking "AI Chat" to begin your first conversation!
          </p>
          <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
            💡 Tip: Complete the MR19 assessment early to get personalized recommendations.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  // Define tour steps for Chat page
  const chatSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#1f2937' }}>
            Welcome to AI Chat! 💬
          </h2>
          <p style={{ margin: '0', fontSize: '1rem', lineHeight: '1.6', color: '#4b5563' }}>
            Let's quickly explore the chat interface and its features.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="chat-input"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            Chat Input
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            Type your questions or tasks here. The AI will respond, and the system will monitor your interactions.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="mr-tools-btn"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            MR Tools
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            Access metacognitive collaboration tools and active interventions here.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="end-reflect-btn"]',
      content: (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#1f2937' }}>
            End & Reflect
          </h3>
          <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: '1.5', color: '#4b5563' }}>
            When you're done, click here to reflect on your session and see insights.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#1f2937' }}>
            Ready to chat! 🚀
          </h2>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', lineHeight: '1.6', color: '#4b5563' }}>
            Start your conversation! Remember to verify and modify AI responses to maintain your cognitive skills.
          </p>
          <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
            💡 Tip: The system will trigger MR interventions when it detects patterns that may lead to skill degradation.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const steps = context === 'dashboard' ? dashboardSteps : chatSteps;

  // Handle tour callbacks
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data;

    // Handle tour completion
    if (status === STATUS.FINISHED) {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      setRun(false);
      onComplete?.();
    }

    // Handle tour skip
    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      localStorage.setItem(TOUR_SKIPPED_KEY, 'true');
      setRun(false);
      onComplete?.();
    }

    // Update step index
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  // Public method to restart tour (can be called from parent)
  const restartTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_SKIPPED_KEY);
    setStepIndex(0);
    setRun(true);
  };

  // Expose restart method via ref if needed in future
  React.useImperativeHandle(React.useRef(), () => ({
    restart: restartTour,
  }));

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#667eea',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '0.75rem',
          padding: '1.5rem',
          fontSize: '1rem',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#667eea',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          padding: '0.75rem 1.5rem',
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: '0.9rem',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: '0.9rem',
        },
        buttonClose: {
          display: 'none', // Hide close button, use skip instead
        },
      }}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default OnboardingTour;

/**
 * Utility function to reset tour for a user (can be called from settings)
 */
export const resetOnboardingTour = (context?: 'dashboard' | 'chat') => {
  if (context) {
    localStorage.removeItem(`onboarding_tour_completed_${context}`);
    localStorage.removeItem(`onboarding_tour_skipped_${context}`);
  } else {
    // Reset all tours
    localStorage.removeItem('onboarding_tour_completed_dashboard');
    localStorage.removeItem('onboarding_tour_skipped_dashboard');
    localStorage.removeItem('onboarding_tour_completed_chat');
    localStorage.removeItem('onboarding_tour_skipped_chat');
  }
};

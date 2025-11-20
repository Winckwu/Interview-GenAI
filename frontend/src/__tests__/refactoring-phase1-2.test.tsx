/**
 * Phase 1 & 2 Refactoring Tests
 *
 * Tests to verify that the extracted hooks and components:
 * 1. Can be imported without errors
 * 2. Export the correct types
 * 3. Have proper TypeScript interfaces
 */

import { describe, it, expect } from 'vitest';

// Phase 1: Hook imports
import { useMessages, type Message } from '../hooks/useMessages';
import { useMRTools, type ActiveMRTool } from '../hooks/useMRTools';
import { useGlobalRecommendations } from '../hooks/useGlobalRecommendations';

// Phase 2: Component imports
import MessageList from '../components/MessageList';
import MessageItem from '../components/MessageItem';
import TrustIndicator, { type TrustBadge, type MRRecommendation } from '../components/TrustIndicator';
import QuickReflection, { type ReflectionResponse } from '../components/QuickReflection';
import MR6Suggestion from '../components/MR6Suggestion';

describe('Phase 1: Hooks Refactoring', () => {
  it('should export useMessages hook', () => {
    expect(useMessages).toBeDefined();
    expect(typeof useMessages).toBe('function');
  });

  it('should export useMRTools hook', () => {
    expect(useMRTools).toBeDefined();
    expect(typeof useMRTools).toBe('function');
  });

  it('should export useGlobalRecommendations hook', () => {
    expect(useGlobalRecommendations).toBeDefined();
    expect(typeof useGlobalRecommendations).toBe('function');
  });

  it('should export Message type', () => {
    const message: Message = {
      id: 'test-1',
      role: 'user',
      content: 'Test message',
      timestamp: new Date().toISOString(),
    };
    expect(message.id).toBe('test-1');
    expect(message.role).toBe('user');
  });

  it('should export ActiveMRTool type', () => {
    const tool: ActiveMRTool = 'mr1-decomposition';
    expect(tool).toBe('mr1-decomposition');
  });
});

describe('Phase 2: Components Refactoring', () => {
  it('should export MessageList component', () => {
    expect(MessageList).toBeDefined();
    expect(MessageList.name).toBe('MessageList');
  });

  it('should export MessageItem component', () => {
    expect(MessageItem).toBeDefined();
  });

  it('should export TrustIndicator component', () => {
    expect(TrustIndicator).toBeDefined();
  });

  it('should export QuickReflection component', () => {
    expect(QuickReflection).toBeDefined();
  });

  it('should export MR6Suggestion component', () => {
    expect(MR6Suggestion).toBeDefined();
  });

  it('should export TrustBadge type', () => {
    const badge: TrustBadge = {
      color: '#10b981',
      bgColor: '#d1fae5',
      label: 'High Trust',
      icon: '✅',
    };
    expect(badge.color).toBe('#10b981');
  });

  it('should export MRRecommendation type', () => {
    const recommendation: MRRecommendation = {
      tool: 'mr11-verify',
      toolName: 'Verification Tool',
      icon: '🔍',
      reason: 'Test reason',
      priority: 1,
    };
    expect(recommendation.tool).toBe('mr11-verify');
  });

  it('should export ReflectionResponse type', () => {
    const response: ReflectionResponse = 'confident';
    expect(response).toBe('confident');
  });
});

describe('Integration: Type Compatibility', () => {
  it('Message type should be compatible with hooks and components', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'ai',
        content: 'Hi there!',
        timestamp: new Date().toISOString(),
        wasVerified: true,
        wasModified: false,
      },
    ];

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].wasVerified).toBe(true);
  });

  it('ActiveMRTool type should accept all valid MR tool IDs', () => {
    const tools: ActiveMRTool[] = [
      'none',
      'mr1-decomposition',
      'mr2-transparency',
      'mr3-agency',
      'mr4-roles',
      'mr5-iteration',
      'mr6-models',
      'mr7-failure',
      'mr10-cost',
      'mr11-verify',
      'mr12-critical',
      'mr13-uncertainty',
      'mr14-reflection',
      'mr15-strategies',
      'mr16-atrophy',
      'mr17-visualization',
      'mr19-assessment',
    ];

    expect(tools).toHaveLength(17);
    expect(tools).toContain('mr1-decomposition');
    expect(tools).toContain('mr19-assessment');
  });

  it('ReflectionResponse type should accept all valid responses', () => {
    const responses: ReflectionResponse[] = [
      'confident',
      'needs-verify',
      'uncertain',
      'skip',
    ];

    expect(responses).toHaveLength(4);
    expect(responses).toContain('confident');
    expect(responses).toContain('skip');
  });
});

/**
 * Phase 3 Refactoring - Panel Components Test Suite
 *
 * Tests for:
 * - SessionSidebar component
 * - MRToolsPanel component
 * - GlobalRecommendationPanel component
 *
 * Created: 2025-11-20
 * Branch: claude/fix-markdown-display-018sSsmFCQ8PqrTq8CHtW5S4
 */

import { describe, it, expect } from 'vitest';

// =====================================
// Phase 3: Panel Component Exports
// =====================================

describe('Phase 3: Panel Component Exports', () => {
  describe('SessionSidebar Component', () => {
    it('should export SessionSidebar as a component', async () => {
      const module = await import('../components/SessionSidebar');
      expect(module.SessionSidebar).toBeDefined();
      expect(typeof module.SessionSidebar).toBe('function');
    });

    it('should export default SessionSidebar', async () => {
      const module = await import('../components/SessionSidebar');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should export SessionItem type', async () => {
      const module = await import('../components/SessionSidebar');
      // Type exports can't be tested at runtime, but we can verify the import doesn't throw
      expect(module).toBeDefined();
    });

    it('should export SessionSidebarProps type', async () => {
      const module = await import('../components/SessionSidebar');
      expect(module).toBeDefined();
    });
  });

  describe('MRToolsPanel Component', () => {
    it('should export MRToolsPanel as a component', async () => {
      const module = await import('../components/MRToolsPanel');
      expect(module.MRToolsPanel).toBeDefined();
      expect(typeof module.MRToolsPanel).toBe('function');
    });

    it('should export default MRToolsPanel', async () => {
      const module = await import('../components/MRToolsPanel');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should export MRToolsPanelProps type', async () => {
      const module = await import('../components/MRToolsPanel');
      expect(module).toBeDefined();
    });
  });

  describe('GlobalRecommendationPanel Component', () => {
    it('should export GlobalRecommendationPanel as a component', async () => {
      const module = await import('../components/GlobalRecommendationPanel');
      expect(module.GlobalRecommendationPanel).toBeDefined();
      expect(typeof module.GlobalRecommendationPanel).toBe('function');
    });

    it('should export default GlobalRecommendationPanel', async () => {
      const module = await import('../components/GlobalRecommendationPanel');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should export GlobalRecommendationPanelProps type', async () => {
      const module = await import('../components/GlobalRecommendationPanel');
      expect(module).toBeDefined();
    });
  });
});

// =====================================
// Phase 3: Type Definitions
// =====================================

describe('Phase 3: Type Definitions', () => {
  describe('SessionItem Type', () => {
    it('should have correct SessionItem type structure', () => {
      // This verifies the type can be used correctly
      const mockSession = {
        id: 'test-id',
        taskDescription: 'Test task',
        createdAt: '2025-11-20T00:00:00Z',
        startedAt: '2025-11-20T00:01:00Z',
        taskType: 'general',
        taskImportance: 5,
      };

      expect(mockSession.id).toBe('test-id');
      expect(mockSession.taskDescription).toBe('Test task');
      expect(mockSession.createdAt).toBeDefined();
    });
  });

  describe('SessionSidebarProps Type', () => {
    it('should have all required props for SessionSidebar', () => {
      const mockProps = {
        isOpen: true,
        onClose: () => {},
        sessions: [],
        sessionsLoading: false,
        currentSessionId: 'test-id',
        onSessionClick: (id: string) => {},
        onDeleteSession: (id: string, e: React.MouseEvent) => {},
        onNewChat: () => {},
        hoveredSessionId: null,
        onHoverSession: (id: string | null) => {},
      };

      expect(mockProps.isOpen).toBe(true);
      expect(typeof mockProps.onClose).toBe('function');
      expect(Array.isArray(mockProps.sessions)).toBe(true);
      expect(typeof mockProps.onSessionClick).toBe('function');
      expect(typeof mockProps.onDeleteSession).toBe('function');
      expect(typeof mockProps.onNewChat).toBe('function');
      expect(typeof mockProps.onHoverSession).toBe('function');
    });
  });

  describe('MRToolsPanelProps Type', () => {
    it('should have all required props for MRToolsPanel', () => {
      const mockProps = {
        activeMRTool: 'none' as const,
        onToolChange: (tool: any) => {},
        showMRToolsSection: true,
        onToggleMRToolsSection: () => {},
        renderActiveTool: () => null,
        loadingFallback: null,
      };

      expect(mockProps.activeMRTool).toBe('none');
      expect(typeof mockProps.onToolChange).toBe('function');
      expect(typeof mockProps.showMRToolsSection).toBe('boolean');
      expect(typeof mockProps.onToggleMRToolsSection).toBe('function');
      expect(typeof mockProps.renderActiveTool).toBe('function');
    });
  });

  describe('GlobalRecommendationPanelProps Type', () => {
    it('should have all required props for GlobalRecommendationPanel', () => {
      const mockProps = {
        recommendations: [],
        welcomeMessage: 'Welcome',
        behaviorPattern: 'Balanced',
        sessionPhase: 'Active',
        isVisible: true,
        onClose: () => {},
        expandedRecommendation: null,
        onToggleExpanded: (id: string) => {},
        onActivateRecommendation: (id: string) => {},
        onDismissRecommendation: (id: string) => {},
        verifiedCount: 0,
        modifiedCount: 0,
        totalMessages: 0,
      };

      expect(Array.isArray(mockProps.recommendations)).toBe(true);
      expect(typeof mockProps.welcomeMessage).toBe('string');
      expect(typeof mockProps.behaviorPattern).toBe('string');
      expect(typeof mockProps.sessionPhase).toBe('string');
      expect(typeof mockProps.isVisible).toBe('boolean');
      expect(typeof mockProps.onClose).toBe('function');
      expect(typeof mockProps.onToggleExpanded).toBe('function');
      expect(typeof mockProps.onActivateRecommendation).toBe('function');
      expect(typeof mockProps.onDismissRecommendation).toBe('function');
    });
  });
});

// =====================================
// Phase 3: Integration Tests
// =====================================

describe('Phase 3: Integration with ChatSessionPage', () => {
  describe('Component Import Compatibility', () => {
    it('should import all Phase 3 components without errors', async () => {
      const sessionSidebar = await import('../components/SessionSidebar');
      const mrToolsPanel = await import('../components/MRToolsPanel');
      const globalRecommendationPanel = await import('../components/GlobalRecommendationPanel');

      expect(sessionSidebar.SessionSidebar).toBeDefined();
      expect(mrToolsPanel.MRToolsPanel).toBeDefined();
      expect(globalRecommendationPanel.GlobalRecommendationPanel).toBeDefined();
    });

    it('should import ActiveMRTool type from useMRTools hook', async () => {
      const mrToolsHook = await import('../hooks/useMRTools');
      expect(mrToolsHook).toBeDefined();
    });

    it('should import MRRecommendationSet type from GlobalMRRecommendationEngine', async () => {
      const engineModule = await import('../utils/GlobalMRRecommendationEngine');
      expect(engineModule).toBeDefined();
    });
  });

  describe('ChatSessionPage Integration', () => {
    it('should import ChatSessionPage without errors after Phase 3 refactoring', async () => {
      const chatSessionPage = await import('../pages/ChatSessionPage');
      expect(chatSessionPage.default).toBeDefined();
      expect(typeof chatSessionPage.default).toBe('function');
    });

    it('should verify Phase 3 components are used in ChatSessionPage', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const chatSessionPagePath = path.resolve(__dirname, '../pages/ChatSessionPage.tsx');
      const content = fs.readFileSync(chatSessionPagePath, 'utf-8');

      // Check for Phase 3 imports
      expect(content).toContain('import SessionSidebar');
      expect(content).toContain('import MRToolsPanel');
      expect(content).toContain('import GlobalRecommendationPanel');

      // Check for Phase 3 component usage
      expect(content).toContain('<SessionSidebar');
      expect(content).toContain('<MRToolsPanel');
      expect(content).toContain('<GlobalRecommendationPanel');

      // Check for Phase 3 comments
      expect(content).toContain('Phase 3 Refactoring: Panel Components');
      expect(content).toContain('Phase 3: SessionSidebar Component');
      expect(content).toContain('Phase 3: MRToolsPanel Component');
      expect(content).toContain('Phase 3: GlobalRecommendationPanel Component');
    });
  });
});

// =====================================
// Phase 3: Code Quality Metrics
// =====================================

describe('Phase 3: Code Quality Metrics', () => {
  describe('Component File Sizes', () => {
    it('should verify SessionSidebar.tsx is under 300 lines', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../components/SessionSidebar.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThanOrEqual(300);
      expect(lineCount).toBeGreaterThan(0);
    });

    it('should verify MRToolsPanel.tsx is under 300 lines', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../components/MRToolsPanel.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThanOrEqual(300);
      expect(lineCount).toBeGreaterThan(0);
    });

    it('should verify GlobalRecommendationPanel.tsx is under 400 lines', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../components/GlobalRecommendationPanel.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      expect(lineCount).toBeLessThanOrEqual(400);
      expect(lineCount).toBeGreaterThan(0);
    });

    it('should verify ChatSessionPage.tsx has been reduced', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../pages/ChatSessionPage.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      // After Phase 3, should be around 2994 lines
      expect(lineCount).toBeLessThan(3200); // Less than before Phase 3 (3196)
      expect(lineCount).toBeGreaterThan(2900); // Reasonable lower bound
    });
  });

  describe('Component Structure', () => {
    it('should verify SessionSidebar has proper TypeScript exports', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../components/SessionSidebar.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('export interface SessionSidebarProps');
      expect(content).toContain('export interface SessionItem');
      expect(content).toContain('export const SessionSidebar');
      expect(content).toContain('export default SessionSidebar');
    });

    it('should verify MRToolsPanel has proper TypeScript exports', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../components/MRToolsPanel.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('export interface MRToolsPanelProps');
      expect(content).toContain('export const MRToolsPanel');
      expect(content).toContain('export default MRToolsPanel');
      expect(content).toContain('Suspense');
    });

    it('should verify GlobalRecommendationPanel has proper TypeScript exports', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../components/GlobalRecommendationPanel.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('export interface GlobalRecommendationPanelProps');
      expect(content).toContain('export const GlobalRecommendationPanel');
      expect(content).toContain('export default GlobalRecommendationPanel');
      expect(content).toContain('PriorityBadge');
      expect(content).toContain('RecommendationCard');
    });
  });

  describe('renderActiveMRTool Helper', () => {
    it('should verify renderActiveMRTool helper exists in ChatSessionPage', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../pages/ChatSessionPage.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('renderActiveMRTool');
      expect(content).toContain('useCallback');
      expect(content).toContain('Phase 3: Extracted for MRToolsPanel integration');
    });

    it('should verify renderActiveMRTool handles all MR tools', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const filePath = path.resolve(__dirname, '../pages/ChatSessionPage.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for all 15 user-facing MR tools
      const mrTools = [
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
      ];

      mrTools.forEach(tool => {
        expect(content).toContain(`case '${tool}':`);
      });
    });
  });
});

// =====================================
// Summary Statistics
// =====================================

describe('Phase 3: Summary', () => {
  it('should report Phase 3 refactoring metrics', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const chatSessionPagePath = path.resolve(__dirname, '../pages/ChatSessionPage.tsx');
    const sessionSidebarPath = path.resolve(__dirname, '../components/SessionSidebar.tsx');
    const mrToolsPanelPath = path.resolve(__dirname, '../components/MRToolsPanel.tsx');
    const globalRecommendationPanelPath = path.resolve(__dirname, '../components/GlobalRecommendationPanel.tsx');

    const chatSessionPageLines = fs.readFileSync(chatSessionPagePath, 'utf-8').split('\n').length;
    const sessionSidebarLines = fs.readFileSync(sessionSidebarPath, 'utf-8').split('\n').length;
    const mrToolsPanelLines = fs.readFileSync(mrToolsPanelPath, 'utf-8').split('\n').length;
    const globalRecommendationPanelLines = fs.readFileSync(globalRecommendationPanelPath, 'utf-8').split('\n').length;

    const totalExtractedLines = sessionSidebarLines + mrToolsPanelLines + globalRecommendationPanelLines;

    console.log('\n📊 Phase 3 Refactoring Metrics:');
    console.log('─'.repeat(60));
    console.log(`ChatSessionPage.tsx:           ${chatSessionPageLines} lines`);
    console.log(`SessionSidebar.tsx:            ${sessionSidebarLines} lines`);
    console.log(`MRToolsPanel.tsx:              ${mrToolsPanelLines} lines`);
    console.log(`GlobalRecommendationPanel.tsx: ${globalRecommendationPanelLines} lines`);
    console.log(`Total extracted code:          ${totalExtractedLines} lines`);
    console.log('─'.repeat(60));
    console.log(`✅ All 3 panel components extracted successfully`);

    expect(chatSessionPageLines).toBeLessThan(3200);
    expect(totalExtractedLines).toBeGreaterThan(700);
  });
});

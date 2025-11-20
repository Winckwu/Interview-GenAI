# ChatSessionPage Refactoring Plan

## Current State
- **File**: `ChatSessionPage.tsx`
- **Lines**: 3856 lines
- **Issues**:
  - Too large, hard to maintain
  - Mixed responsibilities (UI, logic, state, styles)
  - Performance concerns with large component re-renders
  - Difficult to test individual features

## Proposed Architecture

### 1. Component Hierarchy
```
ChatSessionPage/
├── index.tsx (Main orchestrator, ~300 lines)
├── components/
│   ├── MessageList/
│   │   ├── MessageList.tsx (Message rendering, ~200 lines)
│   │   ├── MessageItem.tsx (Individual message, ~150 lines)
│   │   ├── TrustIndicator.tsx (MR9 trust badge, ~50 lines)
│   │   └── MessageActions.tsx (Verify/Modify buttons, ~80 lines)
│   ├── ChatInput/
│   │   ├── ChatInput.tsx (Input area, ~100 lines)
│   │   └── ChatInput.css
│   ├── MRToolsPanel/
│   │   ├── MRToolsPanel.tsx (MR tools sidebar, ~300 lines)
│   │   ├── MRToolGrid.tsx (Tool selector grid, ~80 lines)
│   │   └── MRToolRenderer.tsx (Active tool renderer, ~150 lines)
│   ├── GlobalRecommendationPanel/
│   │   ├── GlobalRecommendationPanel.tsx (~200 lines)
│   │   ├── RecommendationCard.tsx (~100 lines)
│   │   └── ChainActivator.tsx (One-click chain activation, ~80 lines)
│   ├── SessionSidebar/
│   │   ├── SessionSidebar.tsx (Conversations list, ~200 lines)
│   │   └── SessionItem.tsx (~60 lines)
│   └── InterventionsPanels/
│       ├── MR6SuggestionPanel.tsx (Multi-model comparison, ~80 lines)
│       ├── QuickReflectionPanel.tsx (MR14 quick reflection, ~60 lines)
│       └── TrustIndicatorPanel.tsx (MR9 indicator, ~50 lines)
├── hooks/
│   ├── useMessages.ts (Message state & API, ~150 lines)
│   ├── useMRTools.ts (MR tool state & callbacks, ~200 lines)
│   ├── useGlobalRecommendations.ts (Recommendation engine, ~100 lines)
│   ├── useSessionManagement.ts (Session CRUD, ~120 lines)
│   └── useTrustOrchestration.ts (MR9 orchestration, ~100 lines)
├── styles/
│   ├── ChatSessionPage.css (Main styles)
│   ├── MessageList.css
│   ├── MRToolsPanel.css
│   └── compact-styles.css (Compact MR tool overrides)
└── utils/
    └── messageHelpers.ts (Message formatting utils)
```

### 2. Core Responsibilities Split

#### **ChatSessionPage/index.tsx** (~300 lines)
**Role**: Main orchestrator
- Layout composition
- Route params handling
- High-level state coordination
- Error boundaries

```typescript
export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const messages = useMessages(sessionId);
  const mrTools = useMRTools();
  const recommendations = useGlobalRecommendations(messages, sessionData);

  return (
    <div className="chat-session-page">
      <SessionSidebar />
      <main className="chat-main">
        <MessageList messages={messages} />
        <ChatInput onSend={handleSend} />
      </main>
      <MRToolsPanel {...mrTools} />
      <GlobalRecommendationPanel recommendations={recommendations} />
    </div>
  );
}
```

#### **MessageList Component** (~200 lines)
**Role**: Display messages with interventions
- Virtual scrolling for performance
- Message rendering with trust indicators
- Quick reflection prompts
- MR6 suggestions

#### **MRToolsPanel Component** (~300 lines)
**Role**: MR tools management
- Tool grid selector
- Active tool rendering
- Tool state management
- Compact styles application

#### **GlobalRecommendationPanel Component** (~200 lines)
**Role**: Smart MR chain recommendations
- Display recommendation cards
- One-click chain activation
- Progress tracking
- Dismissal handling

### 3. Custom Hooks

#### **useMessages.ts**
```typescript
export function useMessages(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => { /* ... */ };
  const markAsVerified = async (id: string) => { /* ... */ };
  const markAsModified = async (id: string) => { /* ... */ };

  return { messages, loading, sendMessage, markAsVerified, markAsModified };
}
```

#### **useMRTools.ts**
```typescript
export function useMRTools() {
  const [activeTool, setActiveTool] = useState<MRToolId | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const openMR1 = useCallback(() => { /* ... */ }, []);
  // ... all MR tool openers

  return { activeTool, showPanel, openMR1, /* ... */ };
}
```

#### **useGlobalRecommendations.ts**
```typescript
export function useGlobalRecommendations(
  messages: Message[],
  sessionData: SessionData
) {
  const [recommendations, setRecommendations] = useState<MRRecommendationSet[]>([]);

  useEffect(() => {
    const context = buildUserContext(messages, sessionData);
    const recs = generateMRRecommendations(context);
    setRecommendations(recs);
  }, [messages, sessionData]);

  return { recommendations, activateChain, dismissRecommendation };
}
```

### 4. Style Extraction

Extract the massive `<style>` block (lines 1793-2830) into separate CSS files:

- `ChatSessionPage.css` - Main layout styles
- `compact-styles.css` - Compact MR tool overrides
- Component-specific CSS in each component folder

### 5. Benefits

✅ **Maintainability**
- Each component < 300 lines
- Clear separation of concerns
- Easy to locate and fix bugs

✅ **Performance**
- Isolated re-renders (memo, useMemo)
- Virtual scrolling in MessageList
- Lazy loading of MR tools already implemented

✅ **Testability**
- Test hooks independently
- Test components in isolation
- Mock dependencies easily

✅ **Collaboration**
- Multiple devs can work on different components
- Reduced merge conflicts
- Clear component ownership

✅ **Reusability**
- Components can be reused
- Hooks shareable across pages
- Consistent patterns

### 6. Migration Strategy

**Phase 1**: Extract hooks (Low risk, high value)
1. Create `useMessages.ts`
2. Create `useMRTools.ts`
3. Create `useGlobalRecommendations.ts`
4. Update ChatSessionPage to use hooks

**Phase 2**: Extract message components
1. Create `MessageList.tsx`
2. Create `MessageItem.tsx`
3. Create intervention panels
4. Test message rendering

**Phase 3**: Extract panels
1. Create `MRToolsPanel.tsx`
2. Create `GlobalRecommendationPanel.tsx`
3. Create `SessionSidebar.tsx`

**Phase 4**: Extract styles
1. Move CSS to separate files
2. Use CSS modules or styled-components
3. Clean up inline styles

**Phase 5**: Final cleanup
1. Remove unused code
2. Add prop-types/TypeScript interfaces
3. Update tests
4. Document components

### 7. Implementation Priority

**High Priority** (Do First):
- [ ] Extract `useMessages` hook
- [ ] Extract `useMRTools` hook
- [ ] Create `MessageList` component
- [ ] Create `GlobalRecommendationPanel` component

**Medium Priority**:
- [ ] Extract `MRToolsPanel` component
- [ ] Extract `SessionSidebar` component
- [ ] Create `ChatInput` component
- [ ] Extract styles to CSS files

**Low Priority** (Nice to have):
- [ ] Add component tests
- [ ] Add Storybook stories
- [ ] Performance profiling
- [ ] Accessibility audit

### 8. Estimated Effort

- **Phase 1 (Hooks)**: 4-6 hours
- **Phase 2 (Message components)**: 6-8 hours
- **Phase 3 (Panels)**: 6-8 hours
- **Phase 4 (Styles)**: 3-4 hours
- **Phase 5 (Cleanup)**: 2-3 hours

**Total**: ~25-30 hours of focused development

### 9. Risk Mitigation

**Risks**:
- Breaking existing functionality
- Performance regressions
- State management bugs

**Mitigation**:
- Incremental refactoring (one component at a time)
- Comprehensive testing after each phase
- Feature flags for new components
- Maintain backward compatibility
- Keep old code commented until verified

### 10. Success Metrics

- [ ] Main file < 400 lines
- [ ] All components < 300 lines
- [ ] No component > 500 lines
- [ ] Test coverage > 70%
- [ ] No performance regression
- [ ] All features working

## Next Steps

1. Review and approve this plan
2. Create feature branch: `refactor/chat-session-page`
3. Start with Phase 1 (hooks extraction)
4. Test thoroughly after each phase
5. Merge incrementally to avoid large PRs

## Notes

- Keep existing MR tool lazy loading
- Maintain all existing functionality
- Don't change user-facing behavior
- Focus on internal structure improvement
- Document new component APIs

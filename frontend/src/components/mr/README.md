# MR Components (Metacognitive Regulation)

This directory contains all Metacognitive Regulation (MR) components that help users maintain appropriate trust, agency, and understanding when working with AI assistants.

## Directory Structure

Each MR component follows a consistent organizational pattern:

```
MR{Number}{ComponentName}/
├── index.tsx        # Main React component
├── utils.ts         # Utility functions and business logic
├── styles.css       # Component-specific styles
├── types.ts         # TypeScript type definitions (optional)
└── demo.tsx         # Demo/example implementation (optional)
```

## Component Organization

### Benefits of This Structure

1. **Clear Separation of Concerns**: Component logic, utilities, styles, and types are clearly separated
2. **Consistent Naming**: All components follow the same file naming conventions
3. **Easy Navigation**: Predictable structure makes it easy to find specific functionality
4. **Better Imports**: Using index.tsx allows clean import paths like `import MR1 from './mr/MR1TaskDecompositionScaffold'`

### Import Patterns

**Within a component:**
```typescript
// index.tsx
import './styles.css';
import { utilityFunction } from './utils';
import type { ComponentType } from './types';
```

**From external files:**
```typescript
// External API or service imports
import { apiService } from '../../../services/api';
```

**In ChatSessionPage.tsx:**
```typescript
const MR1TaskDecompositionScaffold = lazy(() =>
  import('../components/mr/MR1TaskDecompositionScaffold')
);
```

## Available Components

### MR1: Task Decomposition Scaffold
Helps users break complex tasks into manageable subtasks with multi-dimensional analysis and adaptive scaffolding.

### MR2: Process Transparency
Visualizes how AI outputs evolved through iterations with diff tracking, timeline views, and version comparison.

### MR3: Human Agency Control
Ensures users maintain decision-making autonomy with intervention intensity control and explicit consent mechanisms.

### MR4: Role Definition Guidance
Helps users explicitly define what role(s) AI should play to prevent expectation misalignment.

### MR5: Low-Cost Iteration
Enables rapid iteration on prompts and outputs with variant generation and batch comparison.

### MR6: Cross-Model Experimentation
Facilitates comparison across different AI models for the same task to understand model characteristics.

### MR7: Failure Tolerance Learning
Tracks AI errors and helps users learn from failures to calibrate trust appropriately.

### MR8: Task Characteristic Recognition
Analyzes task characteristics to recommend appropriate AI usage patterns.

### MR9: Dynamic Trust Calibration
Provides real-time trust calibration based on AI performance and user feedback.

### MR10: Cost-Benefit Analysis
Helps users evaluate whether AI assistance is worthwhile for a given task.

### MR11: Integrated Verification
Guides users through verification processes to ensure AI output quality.

### MR12: Critical Thinking Scaffolding
Promotes critical evaluation of AI outputs with guided questioning and reflection.

### MR13: Transparent Uncertainty
Clearly communicates AI uncertainty and confidence levels to prevent overreliance.

### MR14: Guided Reflection Mechanism
Encourages users to reflect on their AI usage patterns and outcomes.

### MR15: Metacognitive Strategy Guide
Provides strategies for effective AI collaboration based on task and context.

### MR16: Skill Atrophy Prevention
Warns users when over-reliance on AI might lead to skill degradation.

### MR17: Learning Process Visualization
Visualizes user's learning journey with AI to promote metacognitive awareness.

### MR18: Over-Reliance Warning
Detects and warns about patterns indicating unhealthy dependence on AI.

### MR19: Metacognitive Capability Assessment
Assesses user's metacognitive skills in AI collaboration context.

### MR23: Privacy-Preserving Architecture
Ensures user data privacy while enabling effective AI assistance.

## Usage

### Basic Component Usage

```typescript
import MR1TaskDecompositionScaffold from './components/mr/MR1TaskDecompositionScaffold';

function MyPage() {
  return (
    <MR1TaskDecompositionScaffold
      onTaskDecomposed={(subtasks) => {
        console.log('Decomposed into:', subtasks);
      }}
    />
  );
}
```

### With Lazy Loading (Recommended)

```typescript
import { lazy, Suspense } from 'react';

const MR1 = lazy(() => import('./components/mr/MR1TaskDecompositionScaffold'));

function MyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MR1 onTaskDecomposed={(subtasks) => console.log(subtasks)} />
    </Suspense>
  );
}
```

## Development Guidelines

### Adding a New MR Component

1. Create a new directory: `mr/MR{Number}{ComponentName}/`
2. Add required files: `index.tsx`, `utils.ts`, `styles.css`
3. Follow existing component patterns for consistency
4. Update this README with component description
5. Add lazy import in ChatSessionPage.tsx

### File Naming Conventions

- Main component: `index.tsx`
- Utility functions: `utils.ts`
- Styles: `styles.css`
- Type definitions: `types.ts` (optional, for complex types)
- Demo/examples: `demo.tsx` (optional)

### Import Path Rules

- Internal component imports: Use relative paths (`./utils`, `./styles.css`)
- External service imports: Use relative paths from component to service (`../../../services/api`)
- Type imports: Prefer `import type { ... }` for type-only imports

## Testing

Each component should be independently testable:

```typescript
import MR1 from './components/mr/MR1TaskDecompositionScaffold';
import { analyzeTaskDimensions } from './components/mr/MR1TaskDecompositionScaffold/utils';

describe('MR1TaskDecompositionScaffold', () => {
  it('should analyze task dimensions', async () => {
    const dimensions = await analyzeTaskDimensions('Build a todo app');
    expect(dimensions).toHaveLength(5);
  });
});
```

## Contributing

When modifying MR components:

1. Maintain the established directory structure
2. Update type definitions if adding new props or return types
3. Keep utilities in `utils.ts` separate from component logic
4. Document complex functionality with comments
5. Test both component UI and utility functions
6. Update this README if adding new components

## Related Documentation

- [MR Orchestrator](../../utils/MROrchestrator.ts) - Centralized MR component activation logic
- [Global MR Recommendation Engine](../../utils/GlobalMRRecommendationEngine.ts) - Cross-session MR suggestions
- [Intervention Manager](../interventions/InterventionManager.tsx) - MR component integration point

## License

Part of the Interview-GenAI project.

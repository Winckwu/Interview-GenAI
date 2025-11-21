# Onboarding Tour Feature

## Overview

The Onboarding Tour is an interactive first-time user guide built with `react-joyride` that helps new users understand and navigate the AI Pattern Recognition System.

## Features

- **Automatic Activation**: Tours start automatically on first visit
- **Context-Aware**: Different tours for Dashboard and Chat pages
- **Persistent State**: Uses localStorage to track completion
- **Skip Option**: Users can skip tours at any time
- **Responsive Design**: Works on desktop and mobile
- **Customizable Styling**: Matches system design language

## Architecture

### Components

**OnboardingTour.tsx**
- Main tour component using react-joyride
- Accepts `context` prop ('dashboard' | 'chat')
- Manages tour state and localStorage tracking
- Provides `resetOnboardingTour()` utility function

### Tour Contexts

#### Dashboard Tour (6 steps)
1. Welcome message
2. Quick Start Guide card
3. Your Metrics section
4. AI Chat sidebar link
5. Pattern Analysis sidebar link
6. Help Guide sidebar link
7. Completion message

#### Chat Tour (4 steps)
1. Welcome to AI Chat
2. Chat input field
3. MR Tools button
4. End & Reflect button
5. Ready to chat message

## Installation

The tour is already installed with `react-joyride`:

```bash
npm install react-joyride
```

## Usage

### Dashboard Integration

**Already integrated** in `DashboardPage.tsx`:

```typescript
import OnboardingTour from '../components/OnboardingTour';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <OnboardingTour context="dashboard" />
      {/* Rest of dashboard content */}
    </div>
  );
};
```

### Chat Integration

**Needs manual integration** - See `ONBOARDING_TOUR_CHAT_INTEGRATION.md` for detailed instructions.

Quick summary:
1. Import OnboardingTour component
2. Add `<OnboardingTour context="chat" />` to JSX
3. Add `data-tour` attributes to:
   - Chat input: `data-tour="chat-input"`
   - MR Tools button: `data-tour="mr-tools-btn"`
   - End & Reflect button: `data-tour="end-reflect-btn"`

## LocalStorage Keys

The tour uses the following localStorage keys:

- `onboarding_tour_completed_dashboard` - Dashboard tour completion status
- `onboarding_tour_skipped_dashboard` - Dashboard tour skip status
- `onboarding_tour_completed_chat` - Chat tour completion status
- `onboarding_tour_skipped_chat` - Chat tour skip status

## API

### resetOnboardingTour()

Reset tour completion status for testing or allowing users to replay.

```typescript
import { resetOnboardingTour } from '../components/OnboardingTour';

// Reset specific tour
resetOnboardingTour('dashboard');
resetOnboardingTour('chat');

// Reset all tours
resetOnboardingTour();
```

### Future Enhancement: Settings Integration

Add a "Replay Tour" button in settings:

```typescript
import { resetOnboardingTour } from '../components/OnboardingTour';

const SettingsPage = () => {
  const handleReplayTour = () => {
    resetOnboardingTour(); // Reset all tours
    window.location.href = '/'; // Redirect to dashboard
  };

  return (
    <button onClick={handleReplayTour}>
      Replay Onboarding Tour
    </button>
  );
};
```

## Customization

### Styling

Tour styles are configured in `OnboardingTour.tsx`:

```typescript
styles={{
  options: {
    primaryColor: '#667eea',    // Main brand color
    textColor: '#1f2937',        // Text color
    backgroundColor: '#ffffff',   // Tooltip background
    overlayColor: 'rgba(0, 0, 0, 0.5)', // Backdrop
    zIndex: 10000,              // Ensure above all elements
  },
  tooltip: {
    borderRadius: '0.75rem',
    padding: '1.5rem',
    fontSize: '1rem',
  },
  // ... more styling options
}}
```

### Adding New Steps

To add steps to a tour, modify the `dashboardSteps` or `chatSteps` arrays:

```typescript
const dashboardSteps: Step[] = [
  // ... existing steps
  {
    target: '[data-tour="new-element"]',  // CSS selector
    content: (
      <div>
        <h3>New Feature</h3>
        <p>Description of the new feature</p>
      </div>
    ),
    placement: 'bottom',  // Tooltip position
  },
];
```

### Creating New Tour Contexts

To add a tour for a new page:

1. Add new context type in OnboardingTour.tsx:
```typescript
context: 'dashboard' | 'chat' | 'patterns' | 'assessment'
```

2. Define steps array:
```typescript
const patternsSteps: Step[] = [
  // ... pattern page steps
];
```

3. Update steps selection:
```typescript
const steps =
  context === 'dashboard' ? dashboardSteps :
  context === 'chat' ? chatSteps :
  context === 'patterns' ? patternsSteps :
  chatSteps; // default
```

4. Update localStorage keys:
```typescript
const TOUR_COMPLETED_KEY = `onboarding_tour_completed_${context}`;
const TOUR_SKIPPED_KEY = `onboarding_tour_skipped_${context}`;
```

## Best Practices

### 1. Element Targeting

Use `data-tour` attributes instead of class names:

```html
<!-- Good -->
<button data-tour="submit-btn">Submit</button>

<!-- Avoid -->
<button className="submit-button">Submit</button>
```

### 2. Step Content

Keep tour step content concise:
- Title: 3-6 words
- Description: 1-2 sentences
- Use icons/emojis for visual interest

### 3. Step Placement

Choose placement that doesn't obscure important content:
- `top` - Tooltip above element
- `bottom` - Tooltip below element
- `left` - Tooltip to the left
- `right` - Tooltip to the right
- `center` - Centered modal (for welcome/completion)

### 4. Testing

Test tours in different scenarios:
- First-time user (no localStorage)
- Returning user (localStorage present)
- Skipped tour (verify it doesn't show again)
- Mobile viewport
- With/without sidebar open

## Troubleshooting

### Tour doesn't start

1. Check localStorage is empty:
```javascript
localStorage.removeItem('onboarding_tour_completed_dashboard');
localStorage.removeItem('onboarding_tour_skipped_dashboard');
```

2. Verify component is imported and added to JSX

3. Check console for errors

### Element not highlighting

1. Ensure `data-tour` attribute is on the element
2. Verify element is visible when tour starts (1s delay)
3. Try using `disableBeacon: true` for that step
4. Check z-index conflicts

### Tour appears cut off

1. Increase z-index in styles options
2. Adjust placement (top/bottom/left/right)
3. Ensure parent containers don't have `overflow: hidden`

## Dependencies

- `react-joyride@^2.8.2` - Tour library
- `react@^18.x` - React framework
- `react-dom@^18.x` - React DOM

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance

- **Bundle size**: ~50KB (lazy-loaded with page)
- **Runtime overhead**: Minimal (only when tour is active)
- **localStorage**: <1KB per tour context

## Future Enhancements

1. **Analytics Integration**: Track tour completion rates
2. **A/B Testing**: Test different tour flows
3. **Contextual Help**: Show tour steps on-demand
4. **Video Integration**: Add video walkthroughs
5. **Multilingual Support**: Support multiple languages
6. **Progress Persistence**: Resume from last incomplete step

## Support

For issues or questions:
- Check integration guides: `CHAT_HELP_PANEL_INTEGRATION.md`, `ONBOARDING_TOUR_CHAT_INTEGRATION.md`
- Review component code: `src/components/OnboardingTour.tsx`
- Test tour reset: Use `resetOnboardingTour()` utility

---

**Version**: 1.0.0
**Last Updated**: 2025-01-21
**Maintainer**: AI Pattern Recognition System Team

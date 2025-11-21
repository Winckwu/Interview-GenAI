# Onboarding Tour - ChatSessionPage Integration Guide

This guide explains how to integrate the OnboardingTour component into ChatSessionPage.

## Overview

The OnboardingTour for the chat page highlights key interface elements and explains their purpose to first-time users.

## Integration Steps

### 1. Import OnboardingTour Component

Add to imports section (around line 1-40):

```typescript
import OnboardingTour from '../components/OnboardingTour';
```

### 2. Add Component to JSX

Find the main return statement (around line 1572) and add the OnboardingTour component at the top:

```typescript
return (
  <>
    {/* Onboarding Tour for Chat Page */}
    <OnboardingTour context="chat" />

    {/* CSS overrides for MR components */}
    <style>{`
      ...
    `}</style>
    ...
  </>
);
```

### 3. Add data-tour Attributes

Add the following `data-tour` attributes to these elements:

#### Chat Input Field (around line 3295-3325)
```typescript
<textarea
  data-tour="chat-input"
  ref={textareaRef}
  value={userInput}
  ...
/>
```

#### MR Tools Button (around line 2673-2700)
```typescript
<button
  data-tour="mr-tools-btn"
  onClick={() => {
    setShowPatternPanel(!showPatternPanel);
    if (!showPatternPanel) setShowMRToolsSection(true);
  }}
  ...
>
  🧠 MR Tools
</button>
```

#### End & Reflect Button (around line 2703-2730)
```typescript
<button
  data-tour="end-reflect-btn"
  onClick={handleEndAndReflect}
  disabled={messages.length === 0}
  ...
>
  End & Reflect
</button>
```

## Complete Integration Example

Here's what the changes look like in context:

```typescript
// 1. Import at top
import OnboardingTour from '../components/OnboardingTour';

// 2. In the component's return statement
return (
  <>
    {/* Onboarding Tour */}
    <OnboardingTour context="chat" />

    {/* Rest of the JSX */}
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      <SessionSidebar ... />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Header with tour-enabled buttons */}
        <header ...>
          <button data-tour="mr-tools-btn" ...>
            🧠 MR Tools
          </button>
          <button data-tour="end-reflect-btn" ...>
            End & Reflect
          </button>
        </header>

        {/* Message area */}
        <main ...>
          {/* Messages display */}
        </main>

        {/* Footer with chat input */}
        <footer ...>
          <form ...>
            <textarea
              data-tour="chat-input"
              ...
            />
            <button type="submit">Send</button>
          </form>
        </footer>
      </div>
    </div>
  </>
);
```

## Tour Flow

When a user first visits the chat page, they will see:

1. **Welcome** - Introduction to AI Chat interface
2. **Chat Input** - Where to type questions/tasks
3. **MR Tools Button** - Access to metacognitive tools
4. **End & Reflect Button** - How to conclude and reflect
5. **Ready to Chat** - Final encouragement message

## Testing

After integration:

1. Clear localStorage for your user
2. Navigate to `/chat`
3. Tour should auto-start after 1 second
4. Verify all highlighted elements are visible
5. Click through all steps
6. Verify tour doesn't show again after completion

## Reset Tour

Users can reset the tour by calling:

```javascript
import { resetOnboardingTour } from '../components/OnboardingTour';

// Reset chat tour only
resetOnboardingTour('chat');

// Reset all tours
resetOnboardingTour();
```

## Notes

- The tour runs independently on Dashboard and Chat pages
- Each page's tour completion is tracked separately in localStorage
- Users can skip the tour at any time
- The tour won't show again unless localStorage is cleared or resetOnboardingTour() is called
- Tour has a 1-second delay to ensure DOM elements are rendered

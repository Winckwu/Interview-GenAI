# ChatHelpPanel Integration Guide

This guide explains how to integrate the `ChatHelpPanel` component into `ChatSessionPage.tsx`.

## Overview

The `ChatHelpPanel` is a collapsible help sidebar that provides:
- Current session status
- MR intervention explanations
- Usage tips and best practices

## Integration Steps

### 1. Import the Component

Add to the imports section of `ChatSessionPage.tsx` (around line 40):

```typescript
import ChatHelpPanel from '../components/ChatHelpPanel';
```

### 2. Add State Management

Add state to control panel visibility (around line 160, with other useState hooks):

```typescript
const [showHelpPanel, setShowHelpPanel] = useState<boolean>(false);
```

### 3. Add Help Button to Header

In the header section (around line 2670-2700), add a help button next to the "MR Tools" button:

```typescript
<button
  onClick={() => setShowHelpPanel(!showHelpPanel)}
  aria-label="Toggle help panel"
  title="Get help and guidance"
  style={{
    padding: '0.5rem 0.75rem',
    backgroundColor: showHelpPanel ? '#dcfce7' : '#f3f4f6',
    color: showHelpPanel ? '#166534' : '#6b7280',
    border: showHelpPanel ? '1px solid #22c55e' : '1px solid #d1d5db',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.75rem',
    transition: 'all 0.2s',
  }}
  onMouseOver={(e) => {
    (e.currentTarget as HTMLButtonElement).style.backgroundColor = showHelpPanel ? '#bbf7d0' : '#e5e7eb';
  }}
  onMouseOut={(e) => {
    (e.currentTarget as HTMLButtonElement).style.backgroundColor = showHelpPanel ? '#dcfce7' : '#f3f4f6';
  }}
>
  ❓ Help
</button>
```

### 4. Add Panel to Layout

Find the main content container structure (around line 2630-2750) and modify the layout to include the help panel on the right:

The current structure looks like:
```typescript
<div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
  <SessionSidebar ... />

  {/* Main Content Container */}
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
    ...
  </div>
</div>
```

Change it to:
```typescript
<div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
  <SessionSidebar ... />

  {/* Main Content Container */}
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
    ...
  </div>

  {/* Help Panel - Right Side */}
  {showHelpPanel && (
    <ChatHelpPanel
      isVisible={showHelpPanel}
      onClose={() => setShowHelpPanel(false)}
      messageCount={messages.length}
      hasActiveIntervention={activeMRs.length > 0 || !!activeMRTool}
    />
  )}
</div>
```

### 5. Adjust Content Width (Optional)

If you want the main content to shrink when the help panel is open, modify the main content container's flex style:

```typescript
<div style={{
  display: 'flex',
  flexDirection: 'column',
  flex: showHelpPanel ? '1 1 auto' : 1,
  overflow: 'hidden',
  transition: 'flex 0.3s ease'
}}>
```

## Alternative: Overlay Mode

If you prefer the help panel to overlay instead of pushing content, use this approach:

```typescript
{showHelpPanel && (
  <div style={{
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  }}>
    <ChatHelpPanel
      isVisible={showHelpPanel}
      onClose={() => setShowHelpPanel(false)}
      messageCount={messages.length}
      hasActiveIntervention={activeMRs.length > 0 || !!activeMRTool}
    />
  </div>
)}
```

## Testing

After integration:
1. Click the "Help" button in the header - panel should slide in from the right
2. Click the ✕ button - panel should close
3. Switch between tabs (Overview, MR System, Tips) - content should update
4. Verify message count displays correctly
5. Verify intervention status updates when MRs are active

## Troubleshooting

**Panel not showing:**
- Check that `showHelpPanel` state is imported and initialized
- Verify the button onClick handler is setting state correctly

**Panel overlaps other content:**
- Adjust z-index if needed
- Consider using the overlay mode approach

**Styling issues:**
- Ensure `ChatHelpPanel.css` is imported in the component
- Check for CSS conflicts with existing ChatSessionPage styles

## Complete Example

Here's a minimal integration snippet:

```typescript
// 1. Import
import ChatHelpPanel from '../components/ChatHelpPanel';

// 2. State (in ChatSessionPage component)
const [showHelpPanel, setShowHelpPanel] = useState<boolean>(false);

// 3. Button (in header section)
<button onClick={() => setShowHelpPanel(!showHelpPanel)}>
  ❓ Help
</button>

// 4. Panel (in main layout)
{showHelpPanel && (
  <ChatHelpPanel
    isVisible={showHelpPanel}
    onClose={() => setShowHelpPanel(false)}
    messageCount={messages.length}
    hasActiveIntervention={activeMRs.length > 0}
  />
)}
```

## Notes

- The panel is responsive and will adapt to mobile screens
- All content is self-contained and doesn't require additional data fetching
- The panel uses the same design system as the rest of the application
- Consider adding keyboard shortcuts (e.g., '?' key) to toggle help in the future

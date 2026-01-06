# React Setup Guide

This guide walks you through integrating the Userlens SDK into a React application.

## Installation

```bash
npm install userlens-analytics-sdk
```

or with yarn:

```bash
yarn add userlens-analytics-sdk
```

---

## Choose Your Setup

Before proceeding, decide which setup works best for your use case:

| | Proxy Setup | Frontend-Only Setup |
|---|-------------|---------------------|
| **Best for** | Production apps | Internal tools, prototypes |
| **Ad blocker resistant** | Yes | No |
| **API key location** | Server-side (secure) | Client-side (exposed) |
| **Backend changes** | Required | None |
| **Setup time** | ~15 minutes | ~5 minutes |

---

## Option A: Proxy Setup (Recommended)

With the proxy setup, events are sent to your backend first, then forwarded to Userlens. This keeps your API key secure and avoids ad blockers.

### Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code** (keep this secret—it goes on your server only)

### Step 2: Add the Provider

Wrap your app with `UserlensProvider` at the root level:

```tsx
// src/App.tsx (or your root component)
import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const userlensConfig = useMemo(() => ({
    userId: currentUser.id,           // Your user's unique identifier
    userTraits: {
      email: currentUser.email,       // User properties for analytics
      name: currentUser.name,
      plan: currentUser.plan,
    },
    // Optional: Associate user with a company (for B2B analytics)
    groupId: currentUser.companyId,
    groupTraits: {
      name: currentUser.companyName,
      industry: currentUser.companyIndustry,
    },
    eventCollector: {
      callback: (events) => {
        // Send events to YOUR backend
        fetch('/api/userlens/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(events),
        });
      },
    },
  }), [currentUser.id]); // Re-initialize only when user changes

  return (
    <UserlensProvider config={userlensConfig}>
      <YourAppContent />
    </UserlensProvider>
  );
}
```

### Step 3: Set Up Your Backend

The events need to be forwarded from your backend to Userlens. Choose your backend:

- **[Node.js/Express](./proxy-nodejs.md)**
- **[Python (Flask/Django)](./proxy-python.md)**
- **[Ruby on Rails](./proxy-rails.md)**

### Step 4: Verify It's Working

1. Open your app in the browser
2. Click around on different elements
3. Check your backend logs to see events arriving
4. In [Userlens](https://app.userlens.io), you should see activity within a few seconds

---

## Option B: Frontend-Only Setup

With the frontend-only setup, events go directly from the browser to Userlens. Simpler to set up, but your Write Code will be visible in browser DevTools.

### Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**

### Step 2: Add the Provider

```tsx
// src/App.tsx (or your root component)
import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const userlensConfig = useMemo(() => ({
    WRITE_CODE: 'your-write-code-here',  // From Userlens dashboard
    userId: currentUser.id,               // Your user's unique identifier
    userTraits: {
      email: currentUser.email,
      name: currentUser.name,
      plan: currentUser.plan,
    },
    // Optional: Associate user with a company
    groupId: currentUser.companyId,
    groupTraits: {
      name: currentUser.companyName,
      industry: currentUser.companyIndustry,
    },
  }), [currentUser.id]);

  return (
    <UserlensProvider config={userlensConfig}>
      <YourAppContent />
    </UserlensProvider>
  );
}
```

### Step 3: Verify It's Working

1. Open your app in the browser
2. Click around on different elements
3. In [Userlens](https://app.userlens.io), you should see activity within a few seconds

---

## Configuration Reference

### UserlensProvider Config

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `userId` | `string` | Yes | Unique identifier for the current user |
| `userTraits` | `object` | Yes | User properties (email, name, plan, etc.) |
| `WRITE_CODE` | `string` | Frontend-only | Your Userlens write code |
| `groupId` | `string` | No | Company/organization identifier (B2B) |
| `groupTraits` | `object` | No | Company properties |
| `eventCollector` | `object` | Proxy setup | EventCollector configuration |

### eventCollector Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `callback` | `function` | - | Function called with events to forward |
| `intervalTime` | `number` | `5000` | Batch interval in milliseconds |
| `skipRawEvents` | `boolean` | `false` | Disable automatic click tracking |
| `useLighterSnapshot` | `boolean` | `false` | Smaller DOM snapshots (less detail) |

---

## Handling User Changes (Login/Logout)

The SDK re-initializes when `userId` changes. This is handled automatically when you include `userId` in the `useMemo` dependency array:

```tsx
const userlensConfig = useMemo(() => ({
  userId: currentUser?.id,
  userTraits: { ... },
  // ...
}), [currentUser?.id]); // Re-creates config when user changes
```

**For logout:** When the user logs out, you can either:
1. Stop rendering the provider (recommended)
2. Pass `undefined` as userId

```tsx
// Option 1: Conditionally render
{currentUser && (
  <UserlensProvider config={userlensConfig}>
    <App />
  </UserlensProvider>
)}

// Option 2: Handle in config
const userlensConfig = useMemo(() => {
  if (!currentUser) return undefined;
  return { userId: currentUser.id, ... };
}, [currentUser?.id]);
```

---

## Using the Hook

Access the SDK from any component using the `useUserlens` hook:

```tsx
import { useUserlens } from 'userlens-analytics-sdk/react';

function MyComponent() {
  const { collector } = useUserlens();

  const handleUpgrade = () => {
    // Track a custom event
    collector?.pushEvent({
      event: 'Plan Upgraded',
      properties: {
        from: 'free',
        to: 'pro',
      },
    });
  };

  return <button onClick={handleUpgrade}>Upgrade to Pro</button>;
}
```

> **Note:** Always use optional chaining (`collector?.pushEvent`) because the collector may be `null` briefly during initial render.

---

## Next Steps

- **[Track Custom Events](./custom-events.md)** — Learn when and how to add manual tracking
- **[Troubleshooting](./troubleshooting.md)** — Common issues and solutions

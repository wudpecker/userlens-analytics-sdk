# Userlens Analytics SDK

**Track everything. Decide what matters later.**

The Userlens SDK automatically captures every user interaction in your web app. Define events later in the [Userlens platform](https://app.userlens.io)—no code changes required.

## Why Userlens?

| Traditional Analytics | Userlens |
|-----------------------|----------|
| Add `track()` calls for each event | Install once, capture everything |
| Deploy code to track new events | Create events in the UI instantly |
| Forgot to track something? Start over | Backfill historical data automatically |

## Installation

```bash
npm install userlens-analytics-sdk
```

## Quick Start (React)

```tsx
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const config = useMemo(() => ({
    userId: currentUser.id,
    userTraits: { email: currentUser.email, plan: currentUser.plan },
    WRITE_CODE: 'your-write-code',  // From app.userlens.io/settings
  }), [currentUser.id]);

  return (
    <UserlensProvider config={config}>
      <YourApp />
    </UserlensProvider>
  );
}
```

That's it. Every click and page view is now captured.

## Documentation

| Guide | Description |
|-------|-------------|
| [Introduction](./docs/introduction.md) | Overview and how it works |
| [React Setup](./docs/react.md) | Complete React integration guide |
| [Next.js Setup](./docs/nextjs.md) | Next.js with SSR considerations |
| [Custom Events](./docs/custom-events.md) | Track specific actions manually |
| [API Reference](./docs/api-reference.md) | HTTP API documentation |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues and solutions |

### Backend Proxy Guides

For production apps, we recommend the proxy setup (keeps your API key secure, avoids ad blockers):

| Backend | Guide |
|---------|-------|
| Node.js/Express | [Setup Guide](./docs/proxy-nodejs.md) |
| Python (Flask/Django) | [Setup Guide](./docs/proxy-python.md) |
| Ruby on Rails | [Setup Guide](./docs/proxy-rails.md) |

## Two Setup Options

### Option A: Proxy Setup (Recommended)

Events flow through your backend → Userlens API

```tsx
<UserlensProvider config={{
  userId: user.id,
  userTraits: { email: user.email },
  eventCollector: {
    callback: (events) => {
      fetch('/api/userlens/events', {
        method: 'POST',
        body: JSON.stringify(events),
      });
    },
  },
}}>
```

### Option B: Frontend-Only Setup

Events go directly to Userlens API

```tsx
<UserlensProvider config={{
  WRITE_CODE: 'your-write-code',
  userId: user.id,
  userTraits: { email: user.email },
}}>
```

## Track Custom Events

```tsx
import { useUserlens } from 'userlens-analytics-sdk/react';

function UpgradeButton() {
  const { collector } = useUserlens();

  const handleUpgrade = () => {
    collector?.pushEvent({
      event: 'Plan Upgraded',
      properties: { plan: 'pro' },
    });
  };

  return <button onClick={handleUpgrade}>Upgrade</button>;
}
```

## Requirements

- **React:** 16.8+ (hooks support)
- **Browser:** Chrome, Firefox, Safari, Edge (modern versions)

## License

ISC

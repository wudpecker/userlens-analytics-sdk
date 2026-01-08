# Troubleshooting

Common issues and their solutions when integrating the Userlens SDK.

---

## Events Not Appearing in Userlens

### Check 1: Verify Events Are Being Sent

Open browser DevTools → Network tab and look for requests to:
- **Proxy setup:** Your backend endpoint (e.g., `/api/userlens/events`)
- **Frontend-only:** `raw.userlens.io`

**If no requests:**
- Ensure the provider is mounted and `userId` is set
- Check that `config` is not `undefined`
- Enable debug mode to see console logs

### Check 2: Verify Backend Is Forwarding (Proxy Setup)

Check your server logs for:
- Incoming requests from the frontend
- Outgoing requests to Userlens
- Any error messages

### Check 3: Verify Write Code

```javascript
// Test your Write Code directly
fetch('https://raw.userlens.io/raw/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic YOUR_WRITE_CODE`,
  },
  body: JSON.stringify({
    events: [{ event: 'test', is_raw: false }]
  }),
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));
```

---

## "window is not defined" Error

This happens when the SDK runs on the server (SSR).

### Next.js App Router

Make sure your wrapper component has `'use client'`:

```tsx
// components/UserlensWrapper.tsx
'use client';  // ← Required

import UserlensProvider from 'userlens-analytics-sdk/react';
// ...
```

### Next.js Pages Router

The SDK only runs client-side, but if you see this error, use dynamic import:

```tsx
import dynamic from 'next/dynamic';

const UserlensProvider = dynamic(
  () => import('userlens-analytics-sdk/react').then(mod => mod.default),
  { ssr: false }
);
```

---

## "useUserlens must be used within a UserlensProvider"

Your component is outside the provider tree.

**Wrong:**

```tsx
function App() {
  return (
    <>
      <MyComponent />  {/* ← This is outside the provider */}
      <UserlensProvider config={config}>
        <Content />
      </UserlensProvider>
    </>
  );
}
```

**Correct:**

```tsx
function App() {
  return (
    <UserlensProvider config={config}>
      <MyComponent />  {/* ← Now inside the provider */}
      <Content />
    </UserlensProvider>
  );
}
```

---

## Collector is null / pushEvent Not Working

The collector is `null` until the provider mounts. This is normal during the first render.

**Always use optional chaining:**

```tsx
// Good
collector?.pushEvent({ event: 'Something' });

// Bad - will throw if collector is null
collector.pushEvent({ event: 'Something' });
```

**For critical events, add a check:**

```tsx
const handleCriticalAction = () => {
  if (!collector) {
    console.warn('Userlens not initialized yet');
    return;
  }
  collector.pushEvent({ event: 'Critical Action' });
};
```

---

## Events Blocked by Ad Blockers

Ad blockers may block requests to `userlens.io` domains.

**Solution:** Use the [proxy setup](./react.md#option-a-proxy-setup-recommended). Events go to your domain first, then your backend forwards to Userlens.

---

## Page Views Not Tracked on Localhost

This is intentional. The SDK skips page view tracking on:
- `localhost`
- `127.0.0.1`
- `::1`
- `*.localhost`

This prevents development traffic from polluting your analytics. **Click events and custom events are still tracked.**

To test page views, deploy to a staging environment or use a tool like ngrok.

---

## Provider Re-initializing Repeatedly

If you see "EventCollector already initialized" warnings, your config object is being recreated on every render.

**Wrong:**

```tsx
function App() {
  // This creates a new object every render
  const config = {
    userId: user.id,
    userTraits: { email: user.email },
  };

  return <UserlensProvider config={config}>...</UserlensProvider>;
}
```

**Correct:**

```tsx
function App() {
  // useMemo prevents recreation
  const config = useMemo(() => ({
    userId: user.id,
    userTraits: { email: user.email },
  }), [user.id]);  // Only recreate when userId changes

  return <UserlensProvider config={config}>...</UserlensProvider>;
}
```

---

## TypeScript Errors

### "Property 'pushEvent' does not exist on type 'null'"

The hook returns `{ collector: EventCollector | null }`. Use optional chaining:

```tsx
const { collector } = useUserlens();
collector?.pushEvent({ event: 'Something' });
```

### Config Type Mismatch

If TypeScript complains about your config, ensure you're using the correct mode:

```tsx
// Callback mode - don't include WRITE_CODE
const callbackConfig = {
  userId: user.id,
  userTraits: {},
  eventCollector: {
    callback: (events) => { /* ... */ },
  },
};

// Auto-upload mode - must include WRITE_CODE
const autoUploadConfig = {
  WRITE_CODE: 'xxx',
  userId: user.id,
  userTraits: {},
};
```

---

## Events Have Wrong User ID

The SDK uses the `userId` from config at initialization time. If your user logs in after the page loads, the provider needs to reinitialize.

**Solution:** Include `userId` in your `useMemo` dependency array:

```tsx
const config = useMemo(() => ({
  userId: currentUser?.id,  // undefined for logged-out users
  userTraits: currentUser ? { email: currentUser.email } : {},
  // ...
}), [currentUser?.id]);  // ← Reinitializes when user changes
```

---

## High Network Traffic / Too Many Requests

Events are batched every 5 seconds by default. If you're seeing too many requests:

**Increase batch interval:**

```tsx
eventCollector: {
  callback: (events) => { /* ... */ },
  intervalTime: 10000,  // 10 seconds instead of 5
}
```

**Disable click tracking if not needed:**

```tsx
eventCollector: {
  callback: (events) => { /* ... */ },
  skipRawEvents: true,  // Only track custom events and page views
}
```

---

## Large Payloads / Performance Issues

DOM snapshots can be large for complex pages.

**Use lighter snapshots:**

```tsx
eventCollector: {
  callback: (events) => { /* ... */ },
  useLighterSnapshot: true,  // Smaller DOM snapshots
}
```

This captures only the direct path to the clicked element instead of siblings.

---

## Debug Mode

Enable detailed console logging:

```tsx
// React
eventCollector: {
  callback: (events) => { /* ... */ },
  debug: true,
}

// Vanilla JS
const collector = new EventCollector({
  callback: (events) => { /* ... */ },
  debug: true,
});
```

Debug mode logs:
- Initialization steps
- Click handler setup
- Event sending
- Errors

---

## Getting Help

If you're still having issues:

1. Enable `debug: true` and check console logs
2. Check Network tab for request/response details
3. Verify your Write Code at [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
4. Contact support at support@userlens.io

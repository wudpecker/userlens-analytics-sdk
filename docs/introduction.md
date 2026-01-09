# Userlens Analytics SDK

A JavaScript SDK for capturing user interactions in web applications. The SDK automatically collects clicks and page views, which can then be turned into named events in the Userlens platform.

## How It Works

The SDK captures all user interactions (clicks, page navigation) along with DOM context and browser metadata. This raw interaction data is sent to Userlens, where you can later define which interactions should be treated as meaningful events.

```tsx
<UserlensProvider config={{ userId, WRITE_CODE, userTraits }}>
  <App />
</UserlensProvider>
```

Once installed, you can:
- Create named events from captured interactions in the Userlens UI
- Apply event definitions retroactively to historical data
- Track additional custom events via `pushEvent()`

---

## What Gets Captured

The SDK automatically collects:

- **Clicks** — XPath selector, DOM snapshot (element hierarchy, classes, IDs, text content)
- **Page views** — URL, pathname, referrer, query parameters
- **Browser context** — Browser name/version, OS, device type, viewport size, timezone

You can also manually track custom events:

```tsx
collector?.pushEvent({
  event: 'Form Submitted',
  properties: { formId: 'signup' }
});
```

All events are associated with the `userId` you provide.

### User Traits

Passing user traits is important for getting meaningful insights. Include as many properties as you have:

```tsx
userTraits: {
  email: user.email,
  name: user.name,
  plan: user.plan,       // e.g., 'free', 'pro', 'enterprise'
  role: user.role,       // e.g., 'admin', 'member'
  createdAt: user.createdAt,
}
```

The more traits you provide, the better Userlens can segment and analyze behavior.

---

## Setup Options

### Client-Side Setup (Quick to setup)

Events are sent directly from the browser to Userlens.

```
Browser → Userlens API
```

- Simple setup, no backend changes required
- Get started in minutes

### Proxy Setup

Events are sent to your backend, which forwards them to Userlens.

```
Browser → Your Backend → Userlens API
```

- Not affected by ad blockers
- Gives you control over the data pipeline

### HTTP API (Direct Integration)

Make HTTP requests directly to the Userlens API without using the SDK.

```
Your App → Userlens API
```

- Use from any environment (backend, other frontend frameworks, mobile)
- Works with any language (Go, PHP, Ruby, Python, Vue, Angular, etc.)
- Full control over when and how events are sent

---

## Get Started

Choose your integration method:

| Method | Best For |
|--------|----------|
| [React](./react.md) | React applications |
| [Next.js](./nextjs.md) | Next.js applications |
| [HTTP API](./http-api.md) | Other frameworks, backends, mobile apps |

---

## Additional Resources

| Resource | Description |
|----------|-------------|
| [Session Recording](./session-recording.md) | Record and replay user sessions |
| [Custom Events](./custom-events.md) | Manually tracking specific actions |
| [API Reference](./api-reference.md) | HTTP API documentation |
| [Troubleshooting](./troubleshooting.md) | Common issues and solutions |

---

## Requirements

- **Browser:** Chrome, Firefox, Safari, Edge (modern versions)
- **React:** 16.8+
- **Next.js:** 12+

Bundle size: ~15KB gzipped.

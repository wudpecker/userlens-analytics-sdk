# Userlens Analytics SDK

## Track Everything. Decide What Matters Later.

Traditional analytics tools force you to decide upfront what to track. Miss something? Too bad—you'll have to add code, deploy, and wait for new data. The Userlens SDK flips this model on its head.

### How It Works

**1. Install once, capture everything**

The Userlens SDK automatically captures every user interaction—clicks, page views, form submissions—along with rich context about where and how it happened.

```tsx
// This is all the code you need
<UserlensProvider config={{ userId, WRITE_CODE, userTraits }}>
  <App />
</UserlensProvider>
```

**2. Define events in Userlens—no code required**

Instead of writing `track("Button Clicked")` everywhere, you define events directly in the [Userlens platform](https://app.userlens.io). See a pattern of clicks you care about? Turn it into a named event with a few clicks. No engineering work required.

**3. Get historical data instantly**

Here's the magic: because we capture everything from day one, when you create a new event in Userlens, **we can backfill historical data**. Forgot to track a feature that launched 3 months ago? No problem—create the event now and see all the data from the past.

---

## Why Teams Love This Approach

| Traditional Analytics | Userlens |
|-----------------------|----------|
| Engineer adds `track()` call | Product manager creates event in UI |
| Deploy code to production | Instant—no deploy needed |
| Wait for new data to come in | Historical data backfilled automatically |
| Forgot to track something? Start from zero | Never lose data—it's already captured |
| Code changes for every tracking update | One-time SDK setup, events managed in Userlens |

---

## What Gets Captured

The SDK automatically collects:

- **Every click** with full DOM context (element, classes, IDs, text, position in page)
- **Page views** including URL, referrer, and query parameters
- **User context** like browser, OS, device type, viewport size, timezone
- **Custom events** you explicitly track via `pushEvent()`

All events are associated with the user identity you provide, enabling powerful user-level and company-level analytics in Userlens.

---

## Two Setup Options

### Option A: Proxy Setup (Recommended)

Events flow through your backend before reaching Userlens.

```
Browser → Your Backend → Userlens API
```

**Benefits:**
- Works around ad blockers
- Your API key stays on the server
- You control data before it leaves your infrastructure

### Option B: Frontend-Only Setup

Events go directly from the browser to Userlens.

```
Browser → Userlens API
```

**Benefits:**
- Faster to set up (no backend changes)
- Good for internal tools or prototypes

---

## Get Started

Choose your frontend framework:

- **[React Setup Guide](./react.md)** — For React applications
- **[Next.js Setup Guide](./nextjs.md)** — For Next.js applications (with SSR considerations)

If using the proxy setup, you'll also need:

- **[Node.js/Express Backend](./proxy-nodejs.md)**
- **[Python Backend](./proxy-python.md)**
- **[Ruby on Rails Backend](./proxy-rails.md)**

---

## Quick Reference

| Resource | Description |
|----------|-------------|
| [Custom Events](./custom-events.md) | Track specific actions manually |
| [API Reference](./api-reference.md) | Direct HTTP API documentation |
| [Troubleshooting](./troubleshooting.md) | Common issues and solutions |

---

## Requirements

- **Browser:** Any modern browser (Chrome, Firefox, Safari, Edge)
- **React:** Version 16.8+ (for hooks support)
- **Next.js:** Version 12+ recommended

The SDK is ~15KB gzipped and has minimal dependencies.

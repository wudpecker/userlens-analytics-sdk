# 📊 userlens.js

Powerful and lightweight event tracking + session replay SDK for web apps. Works standalone or with React. Built for modern frontend teams.

---

## 📚 Table of Contents

## 📘 Introduction

`userlens-analytics-sdk` is a lightweight, framework-agnostic JavaScript SDK for collecting user interaction events and recording session replays directly in the browser.

It supports two main features:

- 🔍 **Event tracking** — Capture clicks and page views, complete with DOM snapshots and context. You can also push your own custom events manually.
- 🎥 **Session replay** — Record full user sessions.

## Installation

```bash
npm install userlens-analytics-sdk
```

## Quickstart

You can use `userlens-analytics-sdk` in two main ways:

---

### 🧠 SDK Overview

There are **two layers** to this SDK:

1. **EventCollector** – Tracks user interactions like clicks and page views.
2. **SessionRecorder** – Captures full user session replays.

Both can be used:

- With the React provider (recommended for React apps)
- Manually via class instances (non-React or custom setups)

---

### ✍️ EventCollector — Two Modes

There are **two ways to configure** `EventCollector`:

#### 1. Manual Upload Mode (RECOMMENDED)

This is the most flexible and production-safe setup. You **receive events via a callback** and forward them through your own backend to the Userlens API.

```ts
const collector = new EventCollector({
  callback: (events) => {
    // send events to your backend
    fetch("/api/forward-events", {
      method: "POST",
      body: JSON.stringify(events),
    });
  },
  intervalTime: 5000, // optional
});
```

If you're using **manual upload mode**, you're responsible for sending the collected events to the Userlens API. Here's how to do that properly in a Node.js/Express setup.

```ts
// server.js or routes/track.js

import express from "express";
import fetch from "node-fetch"; // or global fetch in newer Node versions

const router = express.Router();

/**
 * Your WRITE_CODE — retrieve it from:
 * 👉 https://app.userlens.io/settings/userlens-sdk
 *
 * Before using it as an Authorization header:
 * 1. Append a colon (`:`) at the end of the string
 * 2. Base64 encode the result
 *
 * Example:
 *   const raw = "your_write_code:";
 *   const encoded = Buffer.from(raw).toString("base64");
 *   → use that as the value for Authorization: `Basic ${encoded}`
 */
const WRITE_CODE = process.env.USERLENS_WRITE_CODE!;

const MAIN_BASE_URL = "https://events.userlens.io";
const RAW_BASE_URL = "https://raw.userlens.io";

// Step 1: optional user traits sync
async function identify(userId, traits) {
  if (!userId || !traits) return;

  const body = {
    type: "identify",
    userId,
    source: "userlens-js-analytics-sdk",
    traits,
  };

  const res = await fetch(`${MAIN_BASE_URL}/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${WRITE_CODE}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to identify user");
}

// Step 2: send the events array
async function track(events) {
  const body = { events };

  const res = await fetch(`${RAW_BASE_URL}/raw/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${WRITE_CODE}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to track events");
}

// Your actual POST endpoint
router.post("/forward-events", async (req, res) => {
  const events = req.body;
  if (!Array.isArray(events)) return res.status(400).send("Invalid body");

  try {
    const first = events[0];

    // Optional: keep traits in sync
    if (first?.userId && first?.properties) {
      await identify(first.userId, first.properties);
    }

    await track(events);
    res.status(200).send("ok");
  } catch (err) {
    console.error("Userlens forwarding error:", err);
    res.status(500).send("Tracking failed");
  }
});

export default router;
```

<!-- MENTION HERE HOW TO RECEIVE THE EVENTS AND FORWARD THEM TO UL API -->

✅ Pros:

- Works around adblockers
- You can batch, modify, or encrypt events

#### 2. Auto-Upload Mode

This mode sends events directly to the Userlens API from the frontend.

```ts
const collector = new EventCollector({
  userId: "user-123", // ✅ required
  WRITE_CODE: "your-public-write-code", // ✅ required
  userTraits: { plan: "starter" }, // optional
  intervalTime: 5000, // optional
});
```

✅ Pros:

- Easy to set up

⚠️ Cons:

- May be blocked by adblockers
- You lose control over event delivery

ℹ️ Use this only if you’re okay with events being sent directly from the browser.

---

### 🎥 SessionRecorder

SessionRecorder captures full user sessions. It's enabled by default if WRITE_CODE and userId are passed in config when using the React provider. Alternatively, you can instantiate it manually.

It always requires:

- userId
- WRITE_CODE

```ts
const recorder = new SessionRecorder({
  userId: "user-123",
  WRITE_CODE: "your-public-write-code",
  recordingOptions: {
    maskingOptions: ["passwords"],
    BUFFER_SIZE: 10,
    TIMEOUT: 30 * 60 * 1000, // 30 mins
  },
});
```

❗ If either userId or WRITE_CODE is missing, the recorder will not start and will log a warning.

### React Wrapper

The `UserlensProvider` is a React context wrapper that **automatically initializes** both:

<!-- - [`EventCollector`](#eventcollector-methods) — for capturing user events
- [`SessionRecorder`](#sessionrecorder-methods) — for recording user sessions -->

- `EventCollector` - for capturing user events
- `SessionRecorder` - for recording user sessions

This is the **recommended way** to integrate `userlens-analytics-sdk` into React projects.

---

#### ✅ What It Does

Under the hood, the React wrapper:

- Instantiates `EventCollector` based on the mode (`callback` or `auto-upload`)
- Optionally starts a `SessionRecorder` if not disabled
- Manages lifecycle + cleanup for both
- Exposes both instances via the `useUserlens()` hook

---

#### 🛠 Usage Example

```tsx
import { UserlensProvider } from "userlens-analytics-sdk";

const config = useMemo(
  () => ({
    // Required only if you're enabling session recording
    // or using auto-upload mode for EventCollector
    WRITE_CODE: "your-public-write-code",
    // Required only if you're enabling session recording
    // or using auto-upload mode for EventCollector
    userId: "user-123",
    // Optional — used when letting the SDK handle event uploads automatically
    userTraits: { email: "jane@example.com" },
    eventCollector: {
      // Required when you want to manually handle event forwarding
      callback: (events) => {
        fetch("/api/track", {
          method: "POST",
          body: JSON.stringify(events),
        });
      },
    },
    // Set to false if you don't want to enable session replay
    enableSessionReplay: true,
    // Optional — fine-tunes session replay behavior
    sessionRecorder: {
      // Masks inputs like <input type="password" />
      maskingOptions: ["passwords"],
      // Controls how many events to buffer before flushing to backend
      // Recommended: 10
      BUFFER_SIZE: 10,
    },
  }),
  [userId] // 👈 Prevents unnecessary reinitialization
);

return (
  <UserlensProvider config={config}>
    <App />
  </UserlensProvider>
);
```

Then, you can access the SDK instances anywhere using the `useUserlens()` hook:

```ts
import { useUserlens } from "userlens-analytics-sdk";

const { collector, sessionRecorder } = useUserlens();

collector?.pushEvent({
  event: "Clicked CTA",
  properties: { location: "hero" },
});
```

🔁 Heads up: Always wrap your config in useMemo() to avoid re-instantiating the SDK on every render. Even though the provider has guards, you'll avoid subtle bugs and unnecessary warnings.

#### 🔁 Behavior Details

If enableSessionReplay: false is passed, the wrapper skips session recording.

If you call UserlensProvider with the same userId, it won’t reinitialize anything.

If either WRITE_CODE or userId is missing, session replay will not start and a warning will be logged.

### 📌 Tracking Custom Events

In addition to auto-tracked clicks and page views, you can manually push your own custom events using `collector.pushEvent()`.

This is useful for tracking things like:

- Form submissions
- In-app interactions (e.g. modal opened, tab switched)
- Feature usage

---

#### ✍️ Example

```ts
import { useUserlens } from "userlens-analytics-sdk";

const { collector } = useUserlens();

collector?.pushEvent({
  event: "Upgraded Plan",
  properties: {
    plan: "pro",
    source: "pricing_modal",
  },
});
```

---

#### 🧠 How it works

The event will be stored as a `PushedEvent` (not a raw click or page view).

The `properties` object is merged with the user's full environment/context automatically (OS, browser, timezone, etc).

#### ⚠️ TypeError: Cannot read properties of undefined

When using `UserlensProvider`, keep this in mind:

**Don’t call `pushEvent()` before the provider is mounted.**  
The `collector` instance is created inside the provider on mount. If you try to access it too early (e.g. before the first render completes), `useUserlens()` will return `null`, and your call will silently do nothing — or worse, throw an error if you don’t check.

✅ Always check that `collector` exists before using it:

```ts
if (collector) {
  collector.pushEvent({ event: "Something" });
}
```

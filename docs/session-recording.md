# Session Recording

Record and replay user sessions to see exactly how users interact with your application. Session recordings capture DOM mutations, mouse movements, scrolls, clicks, and console logs.

---

## Installation

The session recorder is a separate package from the analytics SDK:

```bash
npm install userlens-session-recorder
```

---

## Quick Start

{% tabs %}
{% tab title="React" %}

```tsx
import { useEffect, useRef } from "react";
import SessionRecorder from "userlens-session-recorder";

export function SessionRecorderProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const recorderRef = useRef<SessionRecorder | null>(null);

  useEffect(() => {
    if (!userId) return;

    recorderRef.current = new SessionRecorder({
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId,
    });

    return () => {
      recorderRef.current?.stop();
    };
  }, [userId]);

  return <>{children}</>;
}
```

{% endtab %}

{% tab title="Vanilla JavaScript" %}

```javascript
import SessionRecorder from "userlens-session-recorder";

const recorder = new SessionRecorder({
  WRITE_CODE: "your-write-code",
  userId: "user-123",
});
```

{% endtab %}

{% tab title="UMD (Script Tag)" %}

```html
<script src="https://unpkg.com/userlens-session-recorder@1.0.4/dist/userlens-session-recorder.umd.js"></script>
<script>
  var SessionRecorder = UserlensSessionRecorder.default;

  var recorder = new SessionRecorder({
    WRITE_CODE: "your-write-code",
    userId: "user-123",
  });
</script>
```

{% endtab %}
{% endtabs %}

---

## Configuration

```typescript
import SessionRecorder from 'userlens-session-recorder';

const recorder = new SessionRecorder({
  WRITE_CODE: string,              // Required: Your Userlens Write Code
  userId: string,                   // Required: Unique user identifier
  recordingOptions: {
    TIMEOUT?: number,               // Session timeout in ms (default: 30 minutes)
    BUFFER_SIZE?: number,           // Events before upload (default: 10)
    maskingOptions?: MaskingOption[], // Input masking (default: ["passwords"])
  },
});
```

### Configuration Options

| Option                            | Type              | Default            | Description                                    |
| --------------------------------- | ----------------- | ------------------ | ---------------------------------------------- |
| `WRITE_CODE`                      | `string`          | Required           | Your Userlens Write Code                       |
| `userId`                          | `string`          | Required           | Unique identifier for the user                 |
| `recordingOptions.TIMEOUT`        | `number`          | `1800000` (30 min) | Inactivity timeout before starting new session |
| `recordingOptions.BUFFER_SIZE`    | `number`          | `10`               | Number of events to buffer before uploading    |
| `recordingOptions.maskingOptions` | `MaskingOption[]` | `["passwords"]`    | Input masking configuration                    |

### Masking Options

Control what input data gets masked in recordings:

```typescript
type MaskingOption = "passwords" | "all";
```

| Option        | Description                               |
| ------------- | ----------------------------------------- |
| `"passwords"` | Only mask password input fields (default) |
| `"all"`       | Mask all input fields                     |

**Examples:**

```typescript
// Only mask password fields (default)
new SessionRecorder({
  WRITE_CODE: "xxx",
  userId: "user-123",
  recordingOptions: {
    maskingOptions: ["passwords"],
  },
});

// Mask all inputs (for sensitive applications)
new SessionRecorder({
  WRITE_CODE: "xxx",
  userId: "user-123",
  recordingOptions: {
    maskingOptions: ["all"],
  },
});
```

---

## Session Management

### Session Timeout

Sessions automatically end after 30 minutes of inactivity (configurable via `TIMEOUT`). When a user returns after the timeout, a new session is created.

```typescript
// Set timeout to 10 minutes
new SessionRecorder({
  WRITE_CODE: "xxx",
  userId: "user-123",
  recordingOptions: {
    TIMEOUT: 10 * 60 * 1000, // 10 minutes
  },
});
```

### Stopping Recording

Call `stop()` when you want to end the recording session:

```typescript
// Stop recording (e.g., on logout)
recorder.stop();
```

This will:

- Stop capturing DOM events
- Clear buffered events
- Remove session data from localStorage

---

## React Integration

### With User Context

```tsx
"use client";

import { useEffect, useRef } from "react";
import SessionRecorder from "userlens-session-recorder";
import { useAuth } from "./auth-context";

export function SessionRecorderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const recorderRef = useRef<SessionRecorder | null>(null);

  useEffect(() => {
    // Only record for authenticated users
    if (!user?.id) {
      recorderRef.current?.stop();
      recorderRef.current = null;
      return;
    }

    recorderRef.current = new SessionRecorder({
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.id,
      recordingOptions: {
        maskingOptions: ["passwords"],
      },
    });

    return () => {
      recorderRef.current?.stop();
    };
  }, [user?.id]);

  return <>{children}</>;
}
```

### With UserlensProvider

Use alongside the analytics SDK:

```tsx
"use client";

import { useEffect, useRef, useMemo } from "react";
import UserlensProvider from "userlens-analytics-sdk/react";
import SessionRecorder from "userlens-session-recorder";

export function UserlensWrapper({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const recorderRef = useRef<SessionRecorder | null>(null);

  // Analytics config
  const config = useMemo(
    () => ({
      userId,
      userTraits: {},
      eventCollector: {
        callback: (events) =>
          fetch("/api/userlens/events", {
            method: "POST",
            body: JSON.stringify(events),
          }),
      },
    }),
    [userId]
  );

  // Session recording
  useEffect(() => {
    if (!userId) return;

    recorderRef.current = new SessionRecorder({
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId,
    });

    return () => {
      recorderRef.current?.stop();
    };
  }, [userId]);

  return <UserlensProvider config={config}>{children}</UserlensProvider>;
}
```

---

## What Gets Recorded

Session recordings capture:

| Captured        | Description                                    |
| --------------- | ---------------------------------------------- |
| DOM mutations   | Element additions, removals, attribute changes |
| Mouse movements | Cursor position over time                      |
| Scrolling       | Page and element scroll positions              |
| Clicks          | Click events with element context              |
| Input changes   | Text input (respects masking options)          |
| Console logs    | Browser console output                         |
| Page visibility | Tab focus/blur events                          |

---

## Data & Privacy

### Local Storage

The SDK uses localStorage to persist session data:

| Key                         | Purpose                    |
| --------------------------- | -------------------------- |
| `userlensSessionUuid`       | Current session identifier |
| `userlensSessionLastActive` | Timestamp of last activity |
| `$ul_WRITE_CODE`            | Encoded Write Code         |

### Network Requests

Recordings are uploaded to `https://sessions.userlens.io` in chunks based on `BUFFER_SIZE`.

---

## Troubleshooting

### Recordings Not Appearing

1. **Check userId is set** - Recording requires a valid userId
2. **Verify WRITE_CODE** - Ensure your Write Code is correct
3. **Check console for errors** - Look for SDK error messages
4. **Verify network requests** - Check for requests to `sessions.userlens.io`

### "Userlens SDK error: unavailable outside of browser environment"

The SDK requires a browser environment. If using SSR (Next.js, etc.), ensure the recorder only initializes client-side:

```tsx
'use client'; // Required for Next.js App Router

useEffect(() => {
  // This runs only in the browser
  const recorder = new SessionRecorder({ ... });
}, []);
```

### High Memory Usage

If you notice high memory usage, reduce the buffer size:

```typescript
new SessionRecorder({
  WRITE_CODE: "xxx",
  userId: "user-123",
  recordingOptions: {
    BUFFER_SIZE: 5, // Upload more frequently with smaller batches
  },
});
```

---

## API Reference

### SessionRecorder

```typescript
class SessionRecorder {
  constructor(config: SessionRecorderConfig);
  stop(): void;
}
```

### SessionRecorderConfig

```typescript
interface SessionRecorderConfig {
  WRITE_CODE: string;
  userId: string;
  recordingOptions?: SessionRecordingOptions;
}

interface SessionRecordingOptions {
  TIMEOUT?: number;
  BUFFER_SIZE?: number;
  maskingOptions?: MaskingOption[];
}

type MaskingOption = "passwords" | "all";
```

---

## Next Steps

- **[Custom Events](./custom-events.md)** - Track custom user actions
- **[API Reference](./api-reference.md)** - Full HTTP API documentation
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

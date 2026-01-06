# Node.js/Express Proxy Setup

This guide shows how to forward Userlens events through your Node.js backend.

## Why Use a Proxy?

- **Ad blocker resistant** — Events go to your domain, not a third-party
- **Secure API key** — Your Write Code stays on the server
- **Data control** — Filter, enrich, or validate events before forwarding

---

## Quick Setup

### Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**
3. Add it to your environment variables

```bash
# .env
USERLENS_WRITE_CODE=your-write-code-here
```

### Step 2: Create the Endpoint

```javascript
// routes/userlens.js
const express = require('express');
const router = express.Router();

const WRITE_CODE = process.env.USERLENS_WRITE_CODE;
const EVENTS_URL = 'https://events.userlens.io/event';
const RAW_URL = 'https://raw.userlens.io/raw/event';

/**
 * Forward events from the Userlens SDK to Userlens API
 * POST /api/userlens/events
 */
router.post('/events', async (req, res) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!WRITE_CODE) {
      console.error('USERLENS_WRITE_CODE is not configured');
      return res.status(500).json({ error: 'Analytics not configured' });
    }

    // Forward events to Userlens
    const response = await fetch(RAW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${WRITE_CODE}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Userlens API error:', text);
      throw new Error('Failed to forward events');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Userlens forwarding error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
});

module.exports = router;
```

### Step 3: Register the Route

```javascript
// app.js or server.js
const express = require('express');
const userlensRoutes = require('./routes/userlens');

const app = express();

app.use(express.json());
app.use('/api/userlens', userlensRoutes);

app.listen(3000);
```

---

## TypeScript Version

```typescript
// routes/userlens.ts
import { Router, Request, Response } from 'express';

const router = Router();

const WRITE_CODE = process.env.USERLENS_WRITE_CODE;
const RAW_URL = 'https://raw.userlens.io/raw/event';

interface UserlensEvent {
  event: string;
  userId?: string;
  is_raw: boolean;
  properties?: Record<string, unknown>;
  snapshot?: unknown[];
}

router.post('/events', async (req: Request, res: Response) => {
  try {
    const events: UserlensEvent[] = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!WRITE_CODE) {
      console.error('USERLENS_WRITE_CODE is not configured');
      return res.status(500).json({ error: 'Analytics not configured' });
    }

    const response = await fetch(RAW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${WRITE_CODE}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error('Failed to forward events');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Userlens forwarding error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
});

export default router;
```

---

## With User Identification

If you want to keep user traits synchronized with Userlens:

```javascript
router.post('/events', async (req, res) => {
  try {
    const events = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Extract user info from first event (if present)
    const firstEvent = events[0];
    const userId = firstEvent?.userId;
    const userTraits = firstEvent?.properties;

    // Run identify and track in parallel
    const promises = [
      // Track events
      fetch(RAW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${WRITE_CODE}`,
        },
        body: JSON.stringify({ events }),
      }),
    ];

    // Optionally sync user traits
    if (userId && userTraits) {
      promises.push(
        fetch(EVENTS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${WRITE_CODE}`,
          },
          body: JSON.stringify({
            type: 'identify',
            userId,
            source: 'userlens-js-analytics-sdk',
            traits: userTraits,
          }),
        })
      );
    }

    await Promise.all(promises);
    res.json({ success: true });
  } catch (error) {
    console.error('Userlens forwarding error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
});
```

---

## Fastify Version

```javascript
// routes/userlens.js
const WRITE_CODE = process.env.USERLENS_WRITE_CODE;
const RAW_URL = 'https://raw.userlens.io/raw/event';

async function userlensRoutes(fastify) {
  fastify.post('/api/userlens/events', async (request, reply) => {
    const events = request.body;

    if (!Array.isArray(events)) {
      return reply.status(400).send({ error: 'Invalid request body' });
    }

    try {
      const response = await fetch(RAW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${WRITE_CODE}`,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error('Failed to forward events');
      }

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to track events' });
    }
  });
}

module.exports = userlensRoutes;
```

---

## Testing Your Setup

1. Start your server
2. Send a test request:

```bash
curl -X POST http://localhost:3000/api/userlens/events \
  -H "Content-Type: application/json" \
  -d '[{"event": "test-event", "is_raw": false, "properties": {}}]'
```

3. Check for `{ "success": true }` response
4. Verify events appear in [Userlens](https://app.userlens.io)

---

## Frontend Configuration

With your backend ready, configure the SDK to use it:

```tsx
// React
<UserlensProvider config={{
  userId: user.id,
  userTraits: { email: user.email },
  eventCollector: {
    callback: (events) => {
      fetch('/api/userlens/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
      });
    },
  },
}}>
```

---

## Next Steps

- **[React Setup](./react.md)** — Complete frontend configuration
- **[Next.js Setup](./nextjs.md)** — Next.js-specific patterns
- **[Custom Events](./custom-events.md)** — Track specific user actions

# API Reference

This document covers the Userlens HTTP API for direct integration or server-side event forwarding.

## Authentication

All API requests require your **Write Code** in the Authorization header:

```
Authorization: Basic YOUR_WRITE_CODE
```

Get your Write Code from [Userlens Settings](https://app.userlens.io/settings/userlens-sdk).

---

## Base URLs

| Purpose | URL |
|---------|-----|
| Identify & Group | `https://events.userlens.io` |
| Event Tracking | `https://raw.userlens.io` |

---

## Endpoints

### 1. Identify User

Sync user traits with Userlens. Call this when a user signs up, logs in, or updates their profile.

```
POST https://events.userlens.io/event
```

**Request Body:**

```json
{
  "type": "identify",
  "userId": "user-123",
  "source": "userlens-js-analytics-sdk",
  "traits": {
    "email": "jane@example.com",
    "name": "Jane Doe",
    "plan": "pro",
    "signupDate": "2024-01-15"
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"identify"` |
| `userId` | string | Yes | Unique user identifier |
| `source` | string | Yes | `"userlens-js-analytics-sdk"` or `"userlens-restapi"` |
| `traits` | object | Yes | User properties |

**Example (Node.js):**

```javascript
await fetch('https://events.userlens.io/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${WRITE_CODE}`,
  },
  body: JSON.stringify({
    type: 'identify',
    userId: 'user-123',
    source: 'userlens-restapi',
    traits: {
      email: 'jane@example.com',
      plan: 'pro',
    },
  }),
});
```

---

### 2. Group (Company/Organization)

Associate a user with a company or organization. Essential for B2B analytics.

```
POST https://events.userlens.io/event
```

**Request Body:**

```json
{
  "type": "group",
  "groupId": "company-456",
  "userId": "user-123",
  "source": "userlens-js-analytics-sdk",
  "traits": {
    "name": "Acme Inc",
    "industry": "Software",
    "employees": 150,
    "plan": "enterprise"
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"group"` |
| `groupId` | string | Yes | Unique company/org identifier |
| `userId` | string | Yes | User being associated |
| `source` | string | Yes | `"userlens-js-analytics-sdk"` or `"userlens-restapi"` |
| `traits` | object | No | Company properties |

---

### 3. Track Custom Event

Send a single custom event directly to Userlens.

```
POST https://events.userlens.io/event
```

**Request Body:**

```json
{
  "type": "track",
  "userId": "user-123",
  "source": "userlens-restapi",
  "event": "Subscription Upgraded",
  "properties": {
    "fromPlan": "free",
    "toPlan": "pro",
    "revenue": 99.00
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"track"` |
| `userId` | string | Yes | User who performed action |
| `source` | string | Yes | `"userlens-restapi"` |
| `event` | string | Yes | Event name |
| `properties` | object | No | Event metadata |

---

### 4. Forward SDK Events (Batch)

Forward events collected by the Userlens SDK. This is the endpoint your proxy server should use.

```
POST https://raw.userlens.io/raw/event
```

**Request Body:**

```json
{
  "events": [
    {
      "event": "/html/body/div[1]/button",
      "is_raw": true,
      "userId": "user-123",
      "snapshot": [...],
      "properties": {
        "$ul_browser": "Chrome",
        "$ul_os": "macOS",
        ...
      }
    },
    {
      "event": "Feature Used",
      "is_raw": false,
      "userId": "user-123",
      "properties": {
        "feature": "export",
        "$ul_browser": "Chrome",
        ...
      }
    },
    {
      "event": "$ul_pageview",
      "userId": "user-123",
      "properties": {
        "$ul_page": "https://app.example.com/dashboard",
        "$ul_pathname": "/dashboard",
        ...
      }
    }
  ]
}
```

**Event Types:**

| Type | `is_raw` | `event` Value | Description |
|------|----------|---------------|-------------|
| Click | `true` | XPath selector | Auto-captured click |
| Custom | `false` | Event name | Manually tracked via `pushEvent()` |
| Page View | N/A | `"$ul_pageview"` | Navigation event |

---

## Event Schemas

### Raw Event (Auto-Captured Click)

```typescript
interface RawEvent {
  event: string;              // XPath of clicked element
  is_raw: true;
  userId?: string;
  snapshot: SnapshotNode[];   // DOM tree structure
  properties: {
    $ul_browser: string;
    $ul_browser_version: string;
    $ul_os: string;
    $ul_os_version: string;
    $ul_browser_language: string;
    $ul_screen_width: number;
    $ul_screen_height: number;
    $ul_viewport_width: number;
    $ul_viewport_height: number;
    $ul_device_type: "Mobile" | "Desktop";
    $ul_timezone: string;
    $ul_page: string;
    $ul_pathname: string;
    $ul_host: string;
    $ul_referrer: string;
    $ul_referring_domain: string;
    $ul_query: string;
  };
}
```

### Pushed Event (Custom)

```typescript
interface PushedEvent {
  event: string;              // Your event name
  is_raw: false;
  userId?: string;
  properties?: {
    // Your custom properties
    [key: string]: any;
    // Plus auto-added context
    $ul_browser: string;
    $ul_page: string;
    // ...
  };
}
```

### Page View Event

```typescript
interface PageViewEvent {
  event: "$ul_pageview";
  userId?: string;
  properties: {
    $ul_page: string;
    $ul_pathname: string;
    $ul_host: string;
    $ul_referrer: string;
    $ul_referring_domain: string;
    $ul_query: string;
  };
}
```

### DOM Snapshot Node

```typescript
interface SnapshotNode {
  tag_name: string;           // HTML tag (e.g., "button")
  attr_class?: string[];      // CSS classes
  attr_id?: string;           // Element ID
  href?: string;              // Link href (if applicable)
  nth_child: number;          // Position among siblings
  nth_of_type: number;        // Position among same tag type
  attributes: Record<string, string>;  // All attributes (prefixed with "attr__")
  text?: string;              // Element text content
  is_target?: true;           // True for clicked element
  leads_to_target?: true;     // True for ancestor elements
  children?: SnapshotNode[];  // Child elements
}
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Invalid or missing Write Code |
| 500 | Server error |

---

## Rate Limits

The API is designed for high throughput. Contact support if you're sending more than 10,000 events per minute.

---

## SDK Methods Reference

### EventCollector

```typescript
// Constructor
new EventCollector(config: EventCollectorConfig)

// Methods
pushEvent(event: { event: string; properties?: object }): void
identify(userId: string, traits: object): Promise<void>
group(groupId: string, traits: object): Promise<void>
updateUserTraits(traits: object): void
updateGroupTraits(traits: object): void
stop(): void
```

### Configuration Options

```typescript
// Callback Mode (recommended)
interface CallbackModeConfig {
  callback: (events: Event[]) => void;  // Required
  intervalTime?: number;                 // Default: 5000ms
  skipRawEvents?: boolean;               // Default: false
  useLighterSnapshot?: boolean;          // Default: false
  debug?: boolean;                       // Default: false
}

// Auto-Upload Mode
interface AutoUploadConfig {
  userId: string;                        // Required
  WRITE_CODE: string;                    // Required
  userTraits?: object;
  groupId?: string;
  groupTraits?: object;
  intervalTime?: number;
  skipRawEvents?: boolean;
  useLighterSnapshot?: boolean;
  debug?: boolean;
}
```

### React Hook

```typescript
const { collector } = useUserlens();

// collector is EventCollector | null
collector?.pushEvent({ event: 'Something', properties: {} });
```

---

## Next Steps

- **[React Setup](./react.md)** — Get started with React
- **[Troubleshooting](./troubleshooting.md)** — Common issues and solutions

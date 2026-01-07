# HTTP API Setup

Integrate Userlens directly via HTTP requests. Use this for any environment where you want direct API access instead of using the React or Next.js SDK.

## Installation

No SDK required — just make HTTP requests to the Userlens API.

## When to Use HTTP API

- Other frontend frameworks (Vue, Angular, Svelte, etc.)
- Backend event tracking (e.g., subscription changes, background jobs)
- Mobile applications
- Any language (Go, Rust, PHP, Python, Ruby, etc.)
- Full control over the integration

---

## Authentication

All API requests require your **Write Code** using HTTP Basic Auth.

The token must be base64 encoded in the format `write_code:` (with trailing colon, empty password):

{% tabs %}
{% tab title="Node.js" %}
```javascript
const authToken = Buffer.from(`${WRITE_CODE}:`).toString('base64');
```
{% endtab %}

{% tab title="Python" %}
```python
import base64
auth_token = base64.b64encode(f'{WRITE_CODE}:'.encode()).decode()
```
{% endtab %}

{% tab title="Go" %}
```go
import "encoding/base64"
authToken := base64.StdEncoding.EncodeToString([]byte(writeCode + ":"))
```
{% endtab %}

{% tab title="PHP" %}
```php
$authToken = base64_encode($writeCode . ':');
```
{% endtab %}

{% tab title="Ruby" %}
```ruby
auth_token = Base64.strict_encode64("#{write_code}:")
```
{% endtab %}
{% endtabs %}

Get your Write Code from [Userlens Settings](https://app.userlens.io/settings/userlens-sdk).

---

## Base URLs

| Purpose | URL |
|---------|-----|
| Identify & Group & Track | `https://events.userlens.io` |
| Forward SDK Events | `https://raw.userlens.io` |

---

## Step 1: Identify Users

Sync user information with Userlens. Call this when a user signs up, logs in, or updates their profile.

```
POST https://events.userlens.io/event
```

{% tabs %}
{% tab title="Node.js" %}
```javascript
const WRITE_CODE = process.env.USERLENS_WRITE_CODE;
const authToken = Buffer.from(`${WRITE_CODE}:`).toString('base64');

async function identifyUser(user) {
  await fetch('https://events.userlens.io/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`,
    },
    body: JSON.stringify({
      type: 'identify',
      userId: user.id,
      source: 'userlens-restapi',
      traits: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    }),
  });
}
```
{% endtab %}

{% tab title="Python" %}
```python
import os
import base64
import requests

WRITE_CODE = os.environ.get('USERLENS_WRITE_CODE')
auth_token = base64.b64encode(f'{WRITE_CODE}:'.encode()).decode()

def identify_user(user):
    requests.post(
        'https://events.userlens.io/event',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {auth_token}',
        },
        json={
            'type': 'identify',
            'userId': user['id'],
            'source': 'userlens-restapi',
            'traits': {
                'email': user['email'],
                'name': user['name'],
                'plan': user['plan'],
                'createdAt': user['created_at'],
            },
        }
    )
```
{% endtab %}

{% tab title="Go" %}
```go
package main

import (
    "bytes"
    "encoding/base64"
    "encoding/json"
    "net/http"
    "os"
)

var writeCode = os.Getenv("USERLENS_WRITE_CODE")
var authToken = base64.StdEncoding.EncodeToString([]byte(writeCode + ":"))

func identifyUser(user User) error {
    body, _ := json.Marshal(map[string]interface{}{
        "type":   "identify",
        "userId": user.ID,
        "source": "userlens-restapi",
        "traits": map[string]interface{}{
            "email":     user.Email,
            "name":      user.Name,
            "plan":      user.Plan,
            "createdAt": user.CreatedAt,
        },
    })

    req, _ := http.NewRequest("POST", "https://events.userlens.io/event", bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Basic "+authToken)

    client := &http.Client{}
    _, err := client.Do(req)
    return err
}
```
{% endtab %}

{% tab title="PHP" %}
```php
<?php
$writeCode = getenv('USERLENS_WRITE_CODE');
$authToken = base64_encode($writeCode . ':');

function identifyUser($user) {
    global $authToken;

    $data = [
        'type' => 'identify',
        'userId' => $user['id'],
        'source' => 'userlens-restapi',
        'traits' => [
            'email' => $user['email'],
            'name' => $user['name'],
            'plan' => $user['plan'],
            'createdAt' => $user['created_at'],
        ],
    ];

    $ch = curl_init('https://events.userlens.io/event');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . $authToken,
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}
```
{% endtab %}

{% tab title="Ruby" %}
```ruby
require 'net/http'
require 'json'
require 'base64'

WRITE_CODE = ENV['USERLENS_WRITE_CODE']
AUTH_TOKEN = Base64.strict_encode64("#{WRITE_CODE}:")

def identify_user(user)
  uri = URI('https://events.userlens.io/event')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true

  request = Net::HTTP::Post.new(uri.path)
  request['Content-Type'] = 'application/json'
  request['Authorization'] = "Basic #{AUTH_TOKEN}"
  request.body = {
    type: 'identify',
    userId: user[:id],
    source: 'userlens-restapi',
    traits: {
      email: user[:email],
      name: user[:name],
      plan: user[:plan],
      createdAt: user[:created_at]
    }
  }.to_json

  http.request(request)
end
```
{% endtab %}
{% endtabs %}

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"identify"` |
| `userId` | string | Yes | Unique user identifier |
| `source` | string | Yes | Use `"userlens-restapi"` |
| `traits` | object | Yes | User properties (email, name, plan, etc.) |

---

## Step 2: Group Users (Optional)

Associate users with companies or organizations. Essential for B2B analytics.

```
POST https://events.userlens.io/event
```

{% tabs %}
{% tab title="Node.js" %}
```javascript
async function groupUser(userId, company) {
  await fetch('https://events.userlens.io/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`,
    },
    body: JSON.stringify({
      type: 'group',
      groupId: company.id,
      userId: userId,
      source: 'userlens-restapi',
      traits: {
        name: company.name,
        industry: company.industry,
        plan: company.plan,
        employees: company.employeeCount,
      },
    }),
  });
}
```
{% endtab %}

{% tab title="Python" %}
```python
def group_user(user_id, company):
    requests.post(
        'https://events.userlens.io/event',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {auth_token}',
        },
        json={
            'type': 'group',
            'groupId': company['id'],
            'userId': user_id,
            'source': 'userlens-restapi',
            'traits': {
                'name': company['name'],
                'industry': company['industry'],
                'plan': company['plan'],
                'employees': company['employee_count'],
            },
        }
    )
```
{% endtab %}
{% endtabs %}

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"group"` |
| `groupId` | string | Yes | Unique company/org identifier |
| `userId` | string | Yes | User being associated |
| `source` | string | Yes | Use `"userlens-restapi"` |
| `traits` | object | No | Company properties |

---

## Step 3: Track Events

Track custom events like purchases, feature usage, or any meaningful action.

```
POST https://events.userlens.io/event
```

{% tabs %}
{% tab title="Node.js" %}
```javascript
async function trackEvent(userId, eventName, properties = {}) {
  await fetch('https://events.userlens.io/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`,
    },
    body: JSON.stringify({
      type: 'track',
      userId: userId,
      source: 'userlens-restapi',
      event: eventName,
      properties: properties,
    }),
  });
}

// Example usage
trackEvent('user-123', 'Subscription Upgraded', {
  fromPlan: 'free',
  toPlan: 'pro',
  revenue: 99.00,
});
```
{% endtab %}

{% tab title="Python" %}
```python
def track_event(user_id, event_name, properties=None):
    requests.post(
        'https://events.userlens.io/event',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {auth_token}',
        },
        json={
            'type': 'track',
            'userId': user_id,
            'source': 'userlens-restapi',
            'event': event_name,
            'properties': properties or {},
        }
    )

# Example usage
track_event('user-123', 'Subscription Upgraded', {
    'fromPlan': 'free',
    'toPlan': 'pro',
    'revenue': 99.00,
})
```
{% endtab %}
{% endtabs %}

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"track"` |
| `userId` | string | Yes | User who performed the action |
| `source` | string | Yes | Use `"userlens-restapi"` |
| `event` | string | Yes | Event name (e.g., "Subscription Upgraded") |
| `properties` | object | No | Additional event data |

---

## Common Use Cases

### After User Signup

```javascript
// In your signup handler
async function handleSignup(newUser) {
  // Your existing signup logic...

  // Identify the user in Userlens
  await identifyUser(newUser);
}
```

### After Subscription Change

```javascript
// In your billing webhook handler
async function handleSubscriptionChange(event) {
  const { userId, previousPlan, newPlan, revenue } = event;

  // Track the upgrade/downgrade
  await trackEvent(userId, 'Subscription Changed', {
    fromPlan: previousPlan,
    toPlan: newPlan,
    revenue: revenue,
  });

  // Update user traits with new plan
  await identifyUser({
    id: userId,
    plan: newPlan,
  });
}
```

### Backend Job Completion

```javascript
// In your background job
async function processDataExport(userId, exportConfig) {
  // Your export logic...

  await trackEvent(userId, 'Data Export Completed', {
    format: exportConfig.format,
    recordCount: results.length,
  });
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

## Verify It's Working

1. Make an identify call with a test user
2. In [Userlens](https://app.userlens.io), check if the user appears
3. Make a track call and verify the event shows up

---

## Next Steps

- **[Custom Events](./custom-events.md)** — Best practices for event naming
- **[API Reference](./api-reference.md)** — Full API documentation and schemas
- **[Troubleshooting](./troubleshooting.md)** — Common issues and solutions

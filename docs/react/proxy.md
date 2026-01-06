# React: Proxy Setup

Events are sent to your backend first, then forwarded to Userlens. Use this if you need to avoid ad blockers.

## Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code** (this will be used on your server)

## Step 2: Add the Provider

{% tabs %}
{% tab title="React 19+ (Compiler)" %}
```tsx
// src/App.tsx
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const user = useCurrentUser();

  if (!user) return <AuthScreen />;

  return (
    <UserlensProvider config={{
      userId: user.id,
      userTraits: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
      groupId: user.companyId,
      groupTraits: {
        name: user.companyName,
      },
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
      <YourAppContent />
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="React 18 and below" %}
```tsx
// src/App.tsx
import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const user = useCurrentUser();

  const userlensConfig = useMemo(() => {
    if (!user) return undefined;
    return {
      userId: user.id,
      userTraits: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
      groupId: user.companyId,
      groupTraits: {
        name: user.companyName,
      },
      eventCollector: {
        callback: (events) => {
          fetch('/api/userlens/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(events),
          });
        },
      },
    };
  }, [user?.id]);

  if (!userlensConfig) return <AuthScreen />;

  return (
    <UserlensProvider config={userlensConfig}>
      <YourAppContent />
    </UserlensProvider>
  );
}
```
{% endtab %}
{% endtabs %}

---

## Step 3: Set Up Your Backend

Choose your backend language:

{% tabs %}
{% tab title="Node.js / Express" %}
```javascript
// routes/userlens.js
const express = require('express');
const router = express.Router();

const WRITE_CODE = process.env.USERLENS_WRITE_CODE;
const RAW_URL = 'https://raw.userlens.io/raw/event';

router.post('/events', async (req, res) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' });
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

module.exports = router;
```

Register the route:

```javascript
// app.js
const userlensRoutes = require('./routes/userlens');
app.use(express.json());
app.use('/api/userlens', userlensRoutes);
```
{% endtab %}

{% tab title="Python / Flask" %}
```python
# routes/userlens.py
import os
import requests
from flask import Blueprint, request, jsonify

userlens_bp = Blueprint('userlens', __name__, url_prefix='/api/userlens')

WRITE_CODE = os.environ.get('USERLENS_WRITE_CODE')
RAW_URL = 'https://raw.userlens.io/raw/event'

@userlens_bp.route('/events', methods=['POST'])
def forward_events():
    try:
        events = request.get_json()

        if not isinstance(events, list):
            return jsonify({'error': 'Invalid request body'}), 400

        response = requests.post(
            RAW_URL,
            json={'events': events},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {WRITE_CODE}',
            }
        )

        if not response.ok:
            raise Exception('Failed to forward events')

        return jsonify({'success': True})

    except Exception as e:
        print(f'Userlens error: {e}')
        return jsonify({'error': 'Failed to track events'}), 500
```
{% endtab %}

{% tab title="Python / Django" %}
```python
# views/userlens.py
import json
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

RAW_URL = 'https://raw.userlens.io/raw/event'

@csrf_exempt
@require_POST
def forward_events(request):
    try:
        events = json.loads(request.body)

        if not isinstance(events, list):
            return JsonResponse({'error': 'Invalid request body'}, status=400)

        response = requests.post(
            RAW_URL,
            json={'events': events},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {settings.USERLENS_WRITE_CODE}',
            }
        )

        if not response.ok:
            raise Exception('Failed to forward events')

        return JsonResponse({'success': True})

    except Exception as e:
        return JsonResponse({'error': 'Failed to track events'}, status=500)
```

Add to urls.py:

```python
path('api/userlens/events', forward_events),
```
{% endtab %}

{% tab title="Ruby on Rails" %}
```ruby
# app/controllers/api/userlens_controller.rb
module Api
  class UserlensController < ApplicationController
    skip_before_action :verify_authenticity_token

    RAW_URL = 'https://raw.userlens.io/raw/event'.freeze

    def events
      events_data = JSON.parse(request.raw_post)

      unless events_data.is_a?(Array)
        return render json: { error: 'Invalid request body' }, status: :bad_request
      end

      write_code = Rails.application.credentials.dig(:userlens, :write_code) ||
                   ENV['USERLENS_WRITE_CODE']

      response = HTTP.headers(
        'Content-Type' => 'application/json',
        'Authorization' => "Basic #{write_code}"
      ).post(RAW_URL, json: { events: events_data })

      if response.status.success?
        render json: { success: true }
      else
        render json: { error: 'Failed to forward events' }, status: :internal_server_error
      end
    rescue StandardError => e
      Rails.logger.error("Userlens error: #{e.message}")
      render json: { error: 'Failed to track events' }, status: :internal_server_error
    end
  end
end
```

Add to routes.rb:

```ruby
namespace :api do
  post 'userlens/events', to: 'userlens#events'
end
```
{% endtab %}
{% endtabs %}

---

## Step 4: Add Environment Variable

```bash
# .env
USERLENS_WRITE_CODE=your-write-code-here
```

---

## Step 5: Verify It's Working

1. Open your app in the browser
2. Click around on different elements
3. Check your backend logs to see events arriving
4. In [Userlens](https://app.userlens.io), you should see activity within a few seconds

---

## User Traits

Pass as many user properties as you have:

```tsx
userTraits: {
  email: user.email,
  name: user.name,
  plan: user.plan,
  role: user.role,
  createdAt: user.createdAt,
}
```

The more traits you provide, the better Userlens can segment and analyze behavior.

---

## Using the Hook

Access the SDK from any component:

```tsx
import { useUserlens } from 'userlens-analytics-sdk/react';

function UpgradeButton() {
  const { collector } = useUserlens();

  const handleUpgrade = () => {
    collector?.pushEvent({
      event: 'Plan Upgraded',
      properties: { from: 'free', to: 'pro' },
    });
  };

  return <button onClick={handleUpgrade}>Upgrade to Pro</button>;
}
```

---

## Next Steps

- **[Track Custom Events](../custom-events.md)** — Learn when and how to add manual tracking
- **[Troubleshooting](../troubleshooting.md)** — Common issues and solutions

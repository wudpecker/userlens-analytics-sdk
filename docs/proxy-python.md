# Python Proxy Setup

This guide shows how to forward Userlens events through your Python backend (Flask or Django).

## Why Use a Proxy?

- **Ad blocker resistant** — Events go to your domain, not a third-party
- **Secure API key** — Your Write Code stays on the server
- **Data control** — Filter, enrich, or validate events before forwarding

---

## Flask Setup

### Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**
3. Add it to your environment variables

```bash
# .env
USERLENS_WRITE_CODE=your-write-code-here
```

### Step 2: Create the Endpoint

```python
# app.py or routes/userlens.py
import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

WRITE_CODE = os.environ.get('USERLENS_WRITE_CODE')
RAW_URL = 'https://raw.userlens.io/raw/event'

@app.route('/api/userlens/events', methods=['POST'])
def forward_events():
    """Forward events from the Userlens SDK to Userlens API"""
    try:
        events = request.get_json()

        if not isinstance(events, list):
            return jsonify({'error': 'Invalid request body'}), 400

        if not WRITE_CODE:
            app.logger.error('USERLENS_WRITE_CODE is not configured')
            return jsonify({'error': 'Analytics not configured'}), 500

        response = requests.post(
            RAW_URL,
            json={'events': events},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {WRITE_CODE}',
            }
        )

        if not response.ok:
            app.logger.error(f'Userlens API error: {response.text}')
            raise Exception('Failed to forward events')

        return jsonify({'success': True})

    except Exception as e:
        app.logger.error(f'Userlens forwarding error: {e}')
        return jsonify({'error': 'Failed to track events'}), 500


if __name__ == '__main__':
    app.run(debug=True)
```

### Step 3: Install Dependencies

```bash
pip install flask requests python-dotenv
```

---

## Flask with Blueprints

For larger applications using Flask blueprints:

```python
# blueprints/userlens.py
import os
import requests
from flask import Blueprint, request, jsonify, current_app

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
        current_app.logger.error(f'Userlens error: {e}')
        return jsonify({'error': 'Failed to track events'}), 500
```

Register the blueprint:

```python
# app.py
from flask import Flask
from blueprints.userlens import userlens_bp

app = Flask(__name__)
app.register_blueprint(userlens_bp)
```

---

## Django Setup

### Step 1: Add Environment Variable

```python
# settings.py
import os

USERLENS_WRITE_CODE = os.environ.get('USERLENS_WRITE_CODE')
```

### Step 2: Create the View

```python
# views/userlens.py
import json
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import logging

logger = logging.getLogger(__name__)

RAW_URL = 'https://raw.userlens.io/raw/event'

@csrf_exempt
@require_POST
def forward_events(request):
    """Forward events from the Userlens SDK to Userlens API"""
    try:
        events = json.loads(request.body)

        if not isinstance(events, list):
            return JsonResponse({'error': 'Invalid request body'}, status=400)

        write_code = settings.USERLENS_WRITE_CODE
        if not write_code:
            logger.error('USERLENS_WRITE_CODE is not configured')
            return JsonResponse({'error': 'Analytics not configured'}, status=500)

        response = requests.post(
            RAW_URL,
            json={'events': events},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {write_code}',
            }
        )

        if not response.ok:
            logger.error(f'Userlens API error: {response.text}')
            raise Exception('Failed to forward events')

        return JsonResponse({'success': True})

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f'Userlens forwarding error: {e}')
        return JsonResponse({'error': 'Failed to track events'}, status=500)
```

### Step 3: Add URL Route

```python
# urls.py
from django.urls import path
from views.userlens import forward_events

urlpatterns = [
    # ... your other routes
    path('api/userlens/events', forward_events, name='userlens_events'),
]
```

---

## Django REST Framework

If you're using DRF:

```python
# views/userlens.py
import requests
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

RAW_URL = 'https://raw.userlens.io/raw/event'

@api_view(['POST'])
@permission_classes([AllowAny])  # Events come from frontend
def forward_events(request):
    """Forward events from the Userlens SDK to Userlens API"""
    try:
        events = request.data

        if not isinstance(events, list):
            return Response(
                {'error': 'Invalid request body'},
                status=status.HTTP_400_BAD_REQUEST
            )

        write_code = settings.USERLENS_WRITE_CODE
        if not write_code:
            logger.error('USERLENS_WRITE_CODE is not configured')
            return Response(
                {'error': 'Analytics not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        response = requests.post(
            RAW_URL,
            json={'events': events},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {write_code}',
            }
        )

        if not response.ok:
            raise Exception('Failed to forward events')

        return Response({'success': True})

    except Exception as e:
        logger.error(f'Userlens forwarding error: {e}')
        return Response(
            {'error': 'Failed to track events'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## FastAPI Setup

```python
# main.py
import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Any, Optional

app = FastAPI()

WRITE_CODE = os.environ.get('USERLENS_WRITE_CODE')
RAW_URL = 'https://raw.userlens.io/raw/event'

class UserlensEvent(BaseModel):
    event: str
    is_raw: bool
    userId: Optional[str] = None
    properties: Optional[dict[str, Any]] = None
    snapshot: Optional[List[Any]] = None

@app.post('/api/userlens/events')
async def forward_events(events: List[UserlensEvent]):
    """Forward events from the Userlens SDK to Userlens API"""
    if not WRITE_CODE:
        raise HTTPException(status_code=500, detail='Analytics not configured')

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RAW_URL,
                json={'events': [e.dict(exclude_none=True) for e in events]},
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Basic {WRITE_CODE}',
                }
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail='Failed to forward events'
                )

        return {'success': True}

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail='Failed to track events')
```

---

## Testing Your Setup

1. Start your server
2. Send a test request:

```bash
curl -X POST http://localhost:5000/api/userlens/events \
  -H "Content-Type: application/json" \
  -d '[{"event": "test-event", "is_raw": false, "properties": {}}]'
```

3. Check for `{"success": true}` response
4. Verify events appear in [Userlens](https://app.userlens.io)

---

## Frontend Configuration

With your backend ready, configure the SDK:

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

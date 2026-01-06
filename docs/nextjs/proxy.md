# Next.js: Proxy Setup

Events are sent to your Next.js API route first, then forwarded to Userlens. Use this if you need to avoid ad blockers.

## Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code** (this will be used on your server)

## Step 2: Create the Provider Component

{% tabs %}
{% tab title="App Router" %}

Choose your auth provider:

{% tabs %}
{% tab title="NextAuth" %}
```tsx
// src/components/UserlensWrapper.tsx
'use client';

import { useSession } from 'next-auth/react';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  if (!session?.user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      userId: session.user.id,
      userTraits: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
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
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="Clerk" %}
```tsx
// src/components/UserlensWrapper.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      userId: user.id,
      userTraits: {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
      },
      groupId: user.organizationMemberships?.[0]?.organization?.id,
      groupTraits: {
        name: user.organizationMemberships?.[0]?.organization?.name,
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
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="Supabase" %}
```tsx
// src/components/UserlensWrapper.tsx
'use client';

import { useUser } from '@supabase/auth-helpers-react';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const user = useUser();

  if (!user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      userId: user.id,
      userTraits: {
        email: user.email,
        createdAt: user.created_at,
        ...user.user_metadata,
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
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="Custom / Server Component" %}
```tsx
// src/components/UserlensWrapper.tsx
'use client';

import UserlensProvider from 'userlens-analytics-sdk/react';

type User = {
  id: string;
  email: string;
  name: string;
  plan?: string;
  role?: string;
  createdAt?: string;
  companyId?: string;
  companyName?: string;
};

export function UserlensWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  if (!user) return <>{children}</>;

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
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}
{% endtabs %}

{% endtab %}

{% tab title="Pages Router" %}
```tsx
// src/components/UserlensWrapper.tsx
import { useAuth } from '@/hooks/useAuth';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      userId: user.id,
      userTraits: {
        email: user.email,
        name: user.name,
        plan: user.plan,
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
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}
{% endtabs %}

---

## Step 3: Create the API Route

{% tabs %}
{% tab title="App Router" %}
```ts
// src/app/api/userlens/events/route.ts
import { NextRequest, NextResponse } from 'next/server';

const WRITE_CODE = process.env.USERLENS_WRITE_CODE!;
const RAW_BASE_URL = 'https://raw.userlens.io';

export async function POST(request: NextRequest) {
  try {
    const events = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const response = await fetch(`${RAW_BASE_URL}/raw/event`, {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Userlens forwarding error:', error);
    return NextResponse.json(
      { error: 'Failed to track events' },
      { status: 500 }
    );
  }
}
```
{% endtab %}

{% tab title="Pages Router" %}
```ts
// src/pages/api/userlens/events.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const WRITE_CODE = process.env.USERLENS_WRITE_CODE!;
const RAW_BASE_URL = 'https://raw.userlens.io';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await fetch(`${RAW_BASE_URL}/raw/event`, {
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Userlens forwarding error:', error);
    return res.status(500).json({ error: 'Failed to track events' });
  }
}
```
{% endtab %}
{% endtabs %}

---

## Step 4: Add to Your App

{% tabs %}
{% tab title="App Router" %}
```tsx
// src/app/layout.tsx
import { UserlensWrapper } from '@/components/UserlensWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserlensWrapper>
          {children}
        </UserlensWrapper>
      </body>
    </html>
  );
}
```
{% endtab %}

{% tab title="Pages Router" %}
```tsx
// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { UserlensWrapper } from '@/components/UserlensWrapper';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserlensWrapper>
      <Component {...pageProps} />
    </UserlensWrapper>
  );
}
```
{% endtab %}
{% endtabs %}

---

## Step 5: Add Environment Variable

```bash
# .env.local
USERLENS_WRITE_CODE=your-write-code-here
```

---

## Step 6: Verify It's Working

1. Open your app in the browser
2. Click around on different elements
3. Check your server logs for `/api/userlens/events` requests
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

Access the SDK from any Client Component:

```tsx
'use client';

import { useUserlens } from 'userlens-analytics-sdk/react';

export function UpgradeButton() {
  const { collector } = useUserlens();

  const handleClick = () => {
    collector?.pushEvent({
      event: 'Upgrade Button Clicked',
      properties: { location: 'pricing-page' },
    });
  };

  return <button onClick={handleClick}>Upgrade Now</button>;
}
```

---

## Common Issues

### "window is not defined"

Make sure your wrapper component has `'use client'` directive.

### Events not appearing

1. Check browser DevTools Network tab for `/api/userlens/events` requests
2. Check server logs for errors
3. Verify `USERLENS_WRITE_CODE` is set in `.env.local`

---

## Next Steps

- **[Track Custom Events](../custom-events.md)** — Learn when and how to add manual tracking
- **[Troubleshooting](../troubleshooting.md)** — Common issues and solutions

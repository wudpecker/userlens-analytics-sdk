# Next.js Setup Guide

This guide covers integrating the Userlens SDK into Next.js applications, including proper handling of server-side rendering (SSR).

## Installation

```bash
npm install userlens-analytics-sdk
```

or with yarn:

```bash
yarn add userlens-analytics-sdk
```

---

## Choose Your Setup

| | Client-Side Setup | Proxy Setup |
|---|-------------------|-------------|
| **Best for** | Most applications | Apps needing ad blocker resistance |
| **Backend changes** | None | Uses Next.js API routes |
| **Setup time** | ~5 minutes | ~15 minutes |

---

## App Router (Next.js 13+)

### Option A: Client-Side Setup (Quick to setup)

#### Step 1: Create the Provider Component

The Userlens SDK requires browser APIs, so it must run as a Client Component.

```tsx
// src/components/UserlensWrapper.tsx
'use client';

import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';

type User = {
  id: string;
  email: string;
  name: string;
  plan: string;
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
  const config = useMemo(() => {
    if (!user) return undefined;

    return {
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.id,
      userTraits: {
        // User traits are important - pass as many as possible
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
      groupId: user.companyId,
      groupTraits: user.companyId ? {
        name: user.companyName,
      } : undefined,
    };
  }, [user?.id]);

  if (!config) {
    return <>{children}</>;
  }

  return (
    <UserlensProvider config={config}>
      {children}
    </UserlensProvider>
  );
}
```

#### Step 2: Add to Root Layout

```tsx
// src/app/layout.tsx
import { UserlensWrapper } from '@/components/UserlensWrapper';
import { getCurrentUser } from '@/lib/auth'; // Your auth logic

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <UserlensWrapper user={user}>
          {children}
        </UserlensWrapper>
      </body>
    </html>
  );
}
```

#### Step 3: Add Environment Variable

```bash
# .env.local
NEXT_PUBLIC_USERLENS_WRITE_CODE=your-write-code-here
```

---

### Option B: Proxy Setup

Use this if you need to avoid ad blockers.

#### Step 1: Create the Provider Component

```tsx
// src/components/UserlensWrapper.tsx
'use client';

import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';

type User = {
  id: string;
  email: string;
  name: string;
  plan: string;
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
  const config = useMemo(() => {
    if (!user) return undefined;

    return {
      userId: user.id,
      userTraits: {
        // User traits are important - pass as many as possible
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
      groupId: user.companyId,
      groupTraits: user.companyId ? {
        name: user.companyName,
      } : undefined,
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

  if (!config) {
    return <>{children}</>;
  }

  return (
    <UserlensProvider config={config}>
      {children}
    </UserlensProvider>
  );
}
```

#### Step 2: Add to Root Layout

Same as client-side setup—add `UserlensWrapper` to your layout.

#### Step 3: Create the API Route

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

#### Step 4: Add Environment Variable

```bash
# .env.local
USERLENS_WRITE_CODE=your-write-code-here
```

---

## Pages Router (Next.js 12 and earlier)

### Option A: Client-Side Setup (Quick to setup)

#### Step 1: Create the Provider Component

```tsx
// src/components/UserlensWrapper.tsx
import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';
import { useUser } from '@/hooks/useUser'; // Your auth hook

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  const config = useMemo(() => {
    if (!user) return undefined;

    return {
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.id,
      userTraits: {
        // User traits are important - pass as many as possible
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }, [user?.id]);

  if (!config) {
    return <>{children}</>;
  }

  return (
    <UserlensProvider config={config}>
      {children}
    </UserlensProvider>
  );
}
```

#### Step 2: Add to _app.tsx

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

#### Step 3: Add Environment Variable

```bash
# .env.local
NEXT_PUBLIC_USERLENS_WRITE_CODE=your-write-code-here
```

---

### Option B: Proxy Setup

Use this if you need to avoid ad blockers.

#### Step 1: Create the Provider Component

```tsx
// src/components/UserlensWrapper.tsx
import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';
import { useUser } from '@/hooks/useUser'; // Your auth hook

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  const config = useMemo(() => {
    if (!user) return undefined;

    return {
      userId: user.id,
      userTraits: {
        // User traits are important - pass as many as possible
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
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

  if (!config) {
    return <>{children}</>;
  }

  return (
    <UserlensProvider config={config}>
      {children}
    </UserlensProvider>
  );
}
```

#### Step 2: Add to _app.tsx

Same as client-side setup.

#### Step 3: Create the API Route

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

#### Step 4: Add Environment Variable

```bash
# .env.local
USERLENS_WRITE_CODE=your-write-code-here
```

---

## Using the Hook in Components

Access the SDK from any Client Component:

```tsx
'use client'; // Required for App Router

import { useUserlens } from 'userlens-analytics-sdk/react';

export function UpgradeButton() {
  const { collector } = useUserlens();

  const handleClick = () => {
    collector?.pushEvent({
      event: 'Upgrade Button Clicked',
      properties: {
        location: 'pricing-page',
      },
    });
  };

  return <button onClick={handleClick}>Upgrade Now</button>;
}
```

---

## Advanced: Identify User After Login

If the user logs in after the page loads, update the provider:

```tsx
// The provider will reinitialize when userId changes
const config = useMemo(() => ({
  userId: session?.user?.id,  // undefined → user ID triggers reinitialization
  userTraits: session?.user ? {
    email: session.user.email,
    name: session.user.name,
  } : {},
  // ...
}), [session?.user?.id]);
```

---

## Common Issues

### "window is not defined"

The SDK requires browser APIs. Make sure:
- App Router: Your wrapper component has `'use client'` directive
- Pages Router: The provider is only rendered client-side

### Events not appearing in Userlens

1. Check browser DevTools Network tab for `/api/userlens/events` requests
2. Verify your `USERLENS_WRITE_CODE` environment variable is set
3. Check server logs for forwarding errors

---

## Next Steps

- **[Track Custom Events](./custom-events.md)** — Learn when and how to add manual tracking
- **[API Reference](./api-reference.md)** — Full HTTP API documentation
- **[Troubleshooting](./troubleshooting.md)** — More solutions to common problems

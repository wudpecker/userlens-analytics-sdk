# Next.js Setup Guide

This guide covers integrating the Userlens SDK into Next.js applications, including proper handling of server-side rendering (SSR).

## Installation

```bash
npm install userlens-analytics-sdk
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

#### Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**

#### Step 2: Create the Provider Component

The Userlens SDK requires browser APIs, so it must run as a Client Component.

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
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: session.user.id,
      userTraits: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
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
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.id,
      userTraits: {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
      },
      // If using Clerk organizations
      groupId: user.organizationMemberships?.[0]?.organization?.id,
      groupTraits: {
        name: user.organizationMemberships?.[0]?.organization?.name,
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
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.id,
      userTraits: {
        email: user.email,
        createdAt: user.created_at,
        ...user.user_metadata,
      },
    }}>
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="Firebase" %}
```tsx
// src/components/UserlensWrapper.tsx
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.uid,
      userTraits: {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: user.metadata.creationTime,
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
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
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
    }}>
      {children}
    </UserlensProvider>
  );
}
```

Then in your layout, fetch user server-side:

```tsx
// src/app/layout.tsx
import { UserlensWrapper } from '@/components/UserlensWrapper';
import { getCurrentUser } from '@/lib/auth';

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
{% endtab %}
{% endtabs %}

#### Step 3: Add to Root Layout

{% tabs %}
{% tab title="With Auth Provider Hook" %}
If you're using NextAuth, Clerk, Supabase, or Firebase hooks:

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
        {/* Your auth provider should wrap this */}
        <UserlensWrapper>
          {children}
        </UserlensWrapper>
      </body>
    </html>
  );
}
```
{% endtab %}

{% tab title="With Server-Side User" %}
If you're fetching user data server-side:

```tsx
// src/app/layout.tsx
import { UserlensWrapper } from '@/components/UserlensWrapper';
import { getCurrentUser } from '@/lib/auth';

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
{% endtab %}
{% endtabs %}

#### Step 4: Add Environment Variable

```bash
# .env.local
NEXT_PUBLIC_USERLENS_WRITE_CODE=your-write-code-here
```

---

### Option B: Proxy Setup

Use this if you need to avoid ad blockers. Events go through your Next.js API route.

#### Step 1: Create the Provider Component

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

#### Step 2: Create the API Route

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

#### Step 3: Add Environment Variable

```bash
# .env.local
USERLENS_WRITE_CODE=your-write-code-here
```

---

## Pages Router (Next.js 12 and earlier)

### Option A: Client-Side Setup (Quick to setup)

#### Step 1: Create the Provider Component

{% tabs %}
{% tab title="NextAuth" %}
```tsx
// src/components/UserlensWrapper.tsx
import { useSession } from 'next-auth/react';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  if (!session?.user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: session.user.id,
      userTraits: {
        email: session.user.email,
        name: session.user.name,
      },
    }}>
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="Custom Hook" %}
```tsx
// src/components/UserlensWrapper.tsx
import { useAuth } from '@/hooks/useAuth';
import UserlensProvider from 'userlens-analytics-sdk/react';

export function UserlensWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: process.env.NEXT_PUBLIC_USERLENS_WRITE_CODE!,
      userId: user.id,
      userTraits: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
    }}>
      {children}
    </UserlensProvider>
  );
}
```
{% endtab %}
{% endtabs %}

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

#### Step 1: Create the Provider Component

Same as client-side, but remove `WRITE_CODE` and add `eventCollector`:

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

#### Step 2: Create the API Route

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

#### Step 3: Add Environment Variable

```bash
# .env.local
USERLENS_WRITE_CODE=your-write-code-here
```

---

## Using the Hook

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

## User Traits

Pass as many user properties as you have available:

```tsx
userTraits: {
  email: user.email,
  name: user.name,
  plan: user.plan,           // 'free', 'pro', 'enterprise'
  role: user.role,           // 'admin', 'member'
  createdAt: user.createdAt,
  // Add any other relevant properties
}
```

The more traits you provide, the better Userlens can segment and analyze behavior.

---

## Common Issues

### "window is not defined"

The SDK requires browser APIs. Make sure:
- App Router: Your wrapper component has `'use client'` directive
- Pages Router: The provider is only rendered client-side

### Events not appearing in Userlens

1. Check browser DevTools Network tab for requests
2. Verify your environment variables are set correctly
3. For proxy setup, check server logs for errors

---

## Next Steps

- **[Track Custom Events](./custom-events.md)** — Learn when and how to add manual tracking
- **[API Reference](./api-reference.md)** — Full HTTP API documentation
- **[Troubleshooting](./troubleshooting.md)** — More solutions to common problems

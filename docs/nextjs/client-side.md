# Next.js: Client-Side Setup

Events go directly from the browser to Userlens. This is the quickest way to get started.

## Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**

## Step 2: Create the Provider Component

The Userlens SDK requires browser APIs, so it must run as a Client Component.

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
{% endtab %}
{% endtabs %}

{% endtab %}

{% tab title="Pages Router" %}

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

{% endtab %}
{% endtabs %}

---

## Step 3: Add to Your App

{% tabs %}
{% tab title="App Router" %}

{% tabs %}
{% tab title="With Auth Provider Hook" %}
If using NextAuth, Clerk, Supabase, or Firebase:

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
If fetching user data server-side:

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

## Step 4: Add Environment Variable

```bash
# .env.local
NEXT_PUBLIC_USERLENS_WRITE_CODE=your-write-code-here
```

---

## Step 5: Verify It's Working

1. Open your app in the browser
2. Click around on different elements
3. In [Userlens](https://app.userlens.io), you should see activity within a few seconds

---

## User Traits

Pass as many user properties as you have:

```tsx
userTraits: {
  email: user.email,
  name: user.name,
  plan: user.plan,           // 'free', 'pro', 'enterprise'
  role: user.role,           // 'admin', 'member'
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

Make sure your wrapper component has `'use client'` directive (App Router) or is only rendered client-side (Pages Router).

---

## Next Steps

- **[Track Custom Events](../custom-events.md)** — Learn when and how to add manual tracking
- **[Troubleshooting](../troubleshooting.md)** — Common issues and solutions

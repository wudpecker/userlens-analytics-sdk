# React: Client-Side Setup

Events go directly from the browser to Userlens. This is the quickest way to get started.

## Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**

## Step 2: Add the Provider

Choose your React version and auth setup:

{% tabs %}
{% tab title="React 19+ (Compiler)" %}
With React Compiler, you don't need `useMemo`:

```tsx
// src/App.tsx
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const user = useCurrentUser(); // Your auth hook

  if (!user) return <AuthScreen />;

  return (
    <UserlensProvider config={{
      WRITE_CODE: 'your-write-code-here',
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
      <YourAppContent />
    </UserlensProvider>
  );
}
```
{% endtab %}

{% tab title="React 18 and below" %}
Use `useMemo` to prevent unnecessary re-renders:

```tsx
// src/App.tsx
import { useMemo } from 'react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App() {
  const user = useCurrentUser(); // Your auth hook

  const userlensConfig = useMemo(() => {
    if (!user) return undefined;
    return {
      WRITE_CODE: 'your-write-code-here',
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

## Auth Provider Examples

{% tabs %}
{% tab title="NextAuth" %}
```tsx
import { useSession } from 'next-auth/react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App({ children }) {
  const { data: session } = useSession();

  if (!session?.user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: 'your-write-code-here',
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
import { useUser } from '@clerk/clerk-react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App({ children }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: 'your-write-code-here',
      userId: user.id,
      userTraits: {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
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
import { useUser } from '@supabase/auth-helpers-react';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App({ children }) {
  const user = useUser();

  if (!user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: 'your-write-code-here',
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
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: 'your-write-code-here',
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

{% tab title="Custom Hook" %}
```tsx
import { useAuth } from './hooks/useAuth';
import UserlensProvider from 'userlens-analytics-sdk/react';

function App({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return <>{children}</>;

  return (
    <UserlensProvider config={{
      WRITE_CODE: 'your-write-code-here',
      userId: user.id,
      userTraits: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
      },
      groupId: user.organizationId,
      groupTraits: {
        name: user.organizationName,
        plan: user.organizationPlan,
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

## Step 3: Verify It's Working

1. Open your app in the browser
2. Click around on different elements
3. In [Userlens](https://app.userlens.io), you should see activity within a few seconds

---

## User Traits

User traits are essential for getting meaningful insights. Pass as many properties as you have:

```tsx
userTraits: {
  // Basics
  email: user.email,
  name: user.name,

  // Subscription info
  plan: user.plan,           // 'free', 'pro', 'enterprise'
  role: user.role,           // 'admin', 'member', 'viewer'

  // Dates
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,

  // Any other relevant properties
  department: user.department,
  jobTitle: user.jobTitle,
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

> Always use optional chaining (`collector?.pushEvent`) as the collector may be `null` briefly during initial render.

---

## Next Steps

- **[Track Custom Events](../custom-events.md)** — Learn when and how to add manual tracking
- **[Troubleshooting](../troubleshooting.md)** — Common issues and solutions

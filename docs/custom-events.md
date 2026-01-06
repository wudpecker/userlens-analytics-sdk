# Tracking Custom Events

While the Userlens SDK automatically captures clicks and page views, you can also track custom events for specific user actions that matter to your business.

## When to Use Custom Events

The SDK captures every click automatically—and you can turn those into named events directly in the Userlens UI. But sometimes you want to track things that aren't clicks:

- **Form submissions** (after validation passes)
- **Feature usage** (user enabled dark mode)
- **Business milestones** (subscription upgraded, file exported)
- **State changes** (cart updated, filter applied)

For these, use `pushEvent()`.

---

## Basic Usage

### React

```tsx
import { useUserlens } from 'userlens-analytics-sdk/react';

function CheckoutButton() {
  const { collector } = useUserlens();

  const handleCheckout = async () => {
    // Your checkout logic...
    await processPayment();

    // Track the event
    collector?.pushEvent({
      event: 'Checkout Completed',
      properties: {
        total: 99.99,
        items: 3,
        couponUsed: true,
      },
    });
  };

  return <button onClick={handleCheckout}>Complete Purchase</button>;
}
```

### Vanilla JavaScript

```javascript
import { EventCollector } from 'userlens-analytics-sdk';

const collector = new EventCollector({
  callback: (events) => fetch('/api/userlens/events', {
    method: 'POST',
    body: JSON.stringify(events),
  }),
});

// Later in your code...
collector.pushEvent({
  event: 'Feature Enabled',
  properties: {
    feature: 'dark-mode',
  },
});
```

---

## Event Structure

```typescript
collector.pushEvent({
  event: string,           // Required: Event name
  properties?: {           // Optional: Custom data
    [key: string]: any
  }
});
```

The SDK automatically adds to your properties:

| Property | Example | Description |
|----------|---------|-------------|
| `$ul_browser` | `"Chrome"` | Browser name |
| `$ul_browser_version` | `"120.0.0"` | Browser version |
| `$ul_os` | `"macOS"` | Operating system |
| `$ul_device_type` | `"Desktop"` | Device type |
| `$ul_page` | `"https://..."` | Current URL |
| `$ul_referrer` | `"https://..."` | Referrer URL |
| `$ul_timezone` | `"America/New_York"` | User timezone |
| ...and more | | |

You don't need to add these—they're included automatically.

---

## Naming Conventions

### Good Event Names

```javascript
// Clear, action-oriented, past tense
collector?.pushEvent({ event: 'Plan Upgraded' });
collector?.pushEvent({ event: 'Report Exported' });
collector?.pushEvent({ event: 'Invite Sent' });
collector?.pushEvent({ event: 'Search Performed' });
```

### Avoid These Patterns

```javascript
// Too vague
collector?.pushEvent({ event: 'click' });
collector?.pushEvent({ event: 'action' });

// Redundant (clicks are already captured)
collector?.pushEvent({ event: 'Button Clicked' });

// Too technical
collector?.pushEvent({ event: 'api_response_200' });
```

---

## Common Patterns

### Track After Async Operations

```tsx
const handleSubmit = async () => {
  try {
    await api.createProject(formData);

    // Track success
    collector?.pushEvent({
      event: 'Project Created',
      properties: {
        projectType: formData.type,
        teamSize: formData.members.length,
      },
    });
  } catch (error) {
    // Track failure
    collector?.pushEvent({
      event: 'Project Creation Failed',
      properties: {
        errorType: error.code,
      },
    });
  }
};
```

### Track Feature Usage

```tsx
function FeatureToggle({ feature }) {
  const { collector } = useUserlens();
  const [enabled, setEnabled] = useState(false);

  const toggle = () => {
    setEnabled(!enabled);
    collector?.pushEvent({
      event: enabled ? 'Feature Disabled' : 'Feature Enabled',
      properties: { feature },
    });
  };

  return <Switch checked={enabled} onChange={toggle} />;
}
```

### Track Pagination/Navigation

```tsx
function Pagination({ currentPage, totalPages }) {
  const { collector } = useUserlens();

  const goToPage = (page) => {
    setCurrentPage(page);
    collector?.pushEvent({
      event: 'Page Navigated',
      properties: {
        fromPage: currentPage,
        toPage: page,
        totalPages,
      },
    });
  };

  // ...
}
```

### Track Search

```tsx
function SearchBar() {
  const { collector } = useUserlens();

  const handleSearch = (query) => {
    performSearch(query).then(results => {
      collector?.pushEvent({
        event: 'Search Performed',
        properties: {
          query,
          resultsCount: results.length,
          hasResults: results.length > 0,
        },
      });
    });
  };

  // ...
}
```

---

## Handling Null Collector

The collector may be `null` briefly during initial render. Always use optional chaining:

```tsx
// Good
collector?.pushEvent({ event: 'Something Happened' });

// Also good - explicit check
if (collector) {
  collector.pushEvent({ event: 'Something Happened' });
}

// Bad - will throw error if collector is null
collector.pushEvent({ event: 'Something Happened' });
```

---

## Custom Events vs Auto-Captured Clicks

| Use Auto-Captured Clicks | Use Custom Events |
|--------------------------|-------------------|
| Button clicks, links | Form submissions |
| Navigation actions | API responses |
| UI interactions | Business milestones |
| Anything visible in the DOM | Calculated values |

**Remember:** Auto-captured clicks can be turned into named events in the Userlens UI—no code changes needed. Use `pushEvent()` only for things that can't be captured from clicks.

---

## Debugging

Enable debug mode to see events in the console:

```tsx
// React
<UserlensProvider config={{
  // ...
  eventCollector: {
    callback: (events) => { /* ... */ },
    debug: true,  // Enable debug logging
  },
}}>

// Vanilla JS
const collector = new EventCollector({
  callback: (events) => { /* ... */ },
  debug: true,
});
```

---

## Next Steps

- **[API Reference](./api-reference.md)** — Full HTTP API documentation
- **[Troubleshooting](./troubleshooting.md)** — Common issues and solutions

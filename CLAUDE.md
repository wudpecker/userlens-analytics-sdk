# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Userlens Analytics SDK is a TypeScript library that automatically captures user interactions (clicks, page views, network calls) in web applications. Core philosophy: "Track everything. Decide what matters later."

- Browser-only analytics SDK (React integration included)
- Auto-captures all clicks with DOM snapshots, page navigation, and network requests (fetch API)
- Supports two modes: auto-upload (direct to Userlens API) and callback (for server-side proxy)

## Build Commands

```bash
npm run build    # Build all formats (CJS, ESM, UMD, type declarations)
```

No test suite is currently configured.

## Architecture

```
src/
├── index.ts                  # Main export (EventCollector class)
├── react.ts                  # React sub-export re-export
├── EventCollector/index.ts   # Core engine - click capture, event queue, SPA support
├── NetworkTracker/index.ts   # Network call interceptor - tracks fetch requests
├── react/index.tsx           # UserlensProvider context + useUserlens hook
├── api/index.ts              # HTTP client (identify, group, track)
├── types/index.ts            # All TypeScript interfaces
└── utils.ts                  # UUID generation, WRITE_CODE persistence
```

### Key Components

**EventCollector** (`src/EventCollector/index.ts`): Core class that:

- Listens for click events and generates XPath selectors via `chrome-dompath`
- Captures DOM snapshots with element hierarchy
- Hooks into `history.pushState`/`replaceState` for SPA page view tracking
- Queues events (max 100) and flushes periodically (default 5s)
- Enriches all events with browser context via `bowser` library
- Manages NetworkTracker instance for fetch interception (enabled by default)

**NetworkTracker** (`src/NetworkTracker/index.ts`): Network call interceptor that:

- Intercepts `window.fetch` to track all HTTP requests
- Captures: URL, method, query params, status code, duration, success/failure
- Optionally captures request/response bodies (off by default, with 10KB size limit)
- **Auto-excludes** Userlens API endpoints in auto-upload mode (prevents infinite loops)
- Production-safe: non-blocking event callbacks, size limits, proper body type handling
- Supports custom URL ignore patterns via `networkIgnoreUrls` config

**React Integration** (`src/react/index.tsx`):

- `UserlensProvider` wraps app, creates EventCollector instance
- `useUserlens()` hook returns `{ collector }` for manual `pushEvent()` calls
- Re-initializes on `userId` change
- Properly cleans up NetworkTracker on unmount

### Two Configuration Modes

```typescript
// Auto-upload mode (direct to Userlens API)
type AutoUploadConfig = {
  userId: string;
  WRITE_CODE: string;
  userTraits?: Record<string, any>;
  // ...
};

// Callback mode (server-side proxy)
type CallbackModeConfig = {
  callback: (events: Event[]) => void;
  // ...
};
```

### Event Types

- **RawEvent**: Auto-captured clicks with `is_raw: true`, XPath selector, DOM snapshot
- **PushedEvent**: Manual events via `pushEvent()` with `is_raw: false`
- **PageViewEvent**: Navigation events with `$ul_pageview` event name
- **NetworkEvent**: Auto-captured fetch calls with `$ul_network_request` event name

All events are enriched with `$ul_` prefixed properties (browser, OS, device, viewport, timezone, page metadata).

## Build Output

Rollup produces multiple formats:

- `dist/main.cjs.js` / `dist/main.esm.js` - Core EventCollector
- `dist/react.cjs.js` / `dist/react.esm.js` - React integration
- `dist/userlens.umd.js` - UMD bundle
- `dist/types/*.d.ts` - Type declarations

## Key Dependencies

- `bowser` - Browser/OS detection
- `chrome-dompath` - XPath selector generation
- React 16.8+ (peer dependency, optional)

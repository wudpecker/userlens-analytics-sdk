# Next.js Setup

Integrate the Userlens SDK into your Next.js application, with proper handling for server-side rendering.

## Installation

```bash
npm install userlens-analytics-sdk
```

## Choose Your Setup

| | Client-Side Setup | Proxy Setup |
|---|-------------------|-------------|
| **Best for** | Most applications | Apps needing ad blocker resistance |
| **Backend changes** | None | Uses Next.js API routes |
| **Setup time** | ~5 minutes | ~15 minutes |

### [Client-Side Setup](./nextjs/client-side.md)

Events go directly from the browser to Userlens. Quick to set up, no API routes needed.

### [Proxy Setup](./nextjs/proxy.md)

Events flow through your Next.js API route first. Use this if you need to avoid ad blockers.

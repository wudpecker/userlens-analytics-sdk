# React Setup

Integrate the Userlens SDK into your React application.

## Installation

```bash
npm install userlens-analytics-sdk
```

## Choose Your Setup

| | Client-Side Setup | Proxy Setup |
|---|-------------------|-------------|
| **Best for** | Most applications | Apps needing ad blocker resistance |
| **Backend changes** | None | Required |
| **Setup time** | ~5 minutes | ~15 minutes |

{% content-ref url="react/client-side.md" %}
[client-side.md](react/client-side.md)
{% endcontent-ref %}

Events go directly from the browser to Userlens. Quick to set up, no backend changes needed.

{% content-ref url="react/proxy.md" %}
[proxy.md](react/proxy.md)
{% endcontent-ref %}

Events flow through your backend first. Use this if you need to avoid ad blockers.

---
"userlens-analytics-sdk": patch
---

feat(NetworkTracker): add `networkIgnoreMethods` config option to skip tracking requests by HTTP method (case-insensitive). Matched methods are filtered before the URL allow/ignore checks.

chore(api): add `ul-ingest.userlens.io` to the auto-ignored Userlens API domains so self-referential `$ul_network_request` events are not produced for ingest traffic.

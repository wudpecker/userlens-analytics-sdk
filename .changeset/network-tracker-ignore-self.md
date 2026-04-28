---
"userlens-analytics-sdk": patch
---

fix(NetworkTracker): always ignore Userlens API domains, regardless of mode. Previously self-referential `$ul_network_request` events could be produced in callback mode when consumers forwarded events to Userlens.

fix(react): forward `userId` to the collector in callback mode so events are stamped when a userId is provided.

refactor(types): make `UserlensProviderConfig` a discriminated union — `WRITE_CODE` / `userId` / `userTraits` are required only in auto-upload mode; callback mode requires `eventCollector.callback`.

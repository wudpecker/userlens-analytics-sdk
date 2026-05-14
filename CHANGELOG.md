# userlens-analytics-sdk

## 1.2.5

### Patch Changes

- [`80fa674`](https://github.com/wudpecker/userlens-analytics-sdk/commit/80fa67468a5b3b59590fca3653c999462430d9c1) Thanks [@dreFullStack](https://github.com/dreFullStack)! - feat(NetworkTracker): add `networkIgnoreMethods` config option to skip tracking requests by HTTP method (case-insensitive). Matched methods are filtered before the URL allow/ignore checks.

  chore(api): add `ul-ingest.userlens.io` to the auto-ignored Userlens API domains so self-referential `$ul_network_request` events are not produced for ingest traffic.

- [`5a656b0`](https://github.com/wudpecker/userlens-analytics-sdk/commit/5a656b083879c813080bcdecc5d3674cc5e52067) Thanks [@dreFullStack](https://github.com/dreFullStack)! - fix(NetworkTracker): always ignore Userlens API domains, regardless of mode. Previously self-referential `$ul_network_request` events could be produced in callback mode when consumers forwarded events to Userlens.

  fix(react): forward `userId` to the collector in callback mode so events are stamped when a userId is provided.

  refactor(types): make `UserlensProviderConfig` a discriminated union — `WRITE_CODE` / `userId` / `userTraits` are required only in auto-upload mode; callback mode requires `eventCollector.callback`.

## 1.2.4

### Patch Changes

- [`3b633f7`](https://github.com/wudpecker/userlens-analytics-sdk/commit/3b633f74b1e86827ce2b05dbaadc1482b21e5eee) Thanks [@dreFullStack](https://github.com/dreFullStack)! - fix(EventCollector): small type improvement

## 1.2.3

### Patch Changes

- [`8e235b8`](https://github.com/wudpecker/userlens-analytics-sdk/commit/8e235b881aa49cff982ce8265e4c9f5a28a49ea9) Thanks [@dreFullStack](https://github.com/dreFullStack)! - test: verify automated release pipeline

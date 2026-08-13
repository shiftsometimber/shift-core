# G1-008 — deployed API adapter timeout source capture

Date: 2026-08-13
Status: **AMBER — diagnosis only; no PASS claimed.**

## Production source evidence

Gate 1 source-capture run `31730934118` completed GREEN and retained artifact `9193191382` from the deployed public asset `/api-adapter-v33d.js`.

The captured deployed source proves the remaining Fit generated-state failure is caused by the member client timeout policy:

- deployed source SHA-256: `9412ee522e7d38df7f0536a3a0a33fc7b160a6b30b9b466ec2cabd478f702ccf`;
- the shared request default is `DEFAULT_TIMEOUT=15000`;
- the request wrapper creates an `AbortController` and aborts at `options.timeout || DEFAULT_TIMEOUT`;
- `generateFit` calls `/fit/plan` without a per-operation timeout, so Fit inherits the 15-second default;
- the unchanged production diagnostic has already shown the browser request aborting at ~15 seconds while the same retained authenticated session and exact request body succeeds when replayed directly to the same production API after roughly 22–40 seconds.

This converts the earlier behavioural diagnosis into exact deployed-source proof. The failure must not be hidden by weakening Playwright acceptance.

## Bounded repair

Keep ordinary API requests on the existing 15-second budget. Give only the long-running Fit generation call a finite generation budget with adequate headroom over the observed production envelope. The proposed minimal source change is:

```diff
 const DEFAULT_TIMEOUT=15000;
+const GENERATION_TIMEOUT=60000;
 ...
-generateFit:data=>request('/fit/plan',{method:'POST',body:JSON.stringify(data||{})})
+generateFit:data=>request('/fit/plan',{method:'POST',body:JSON.stringify(data||{}),timeout:GENERATION_TIMEOUT})
```

This is a two-line policy change: it does not loosen normal API requests, does not remove failure handling and does not introduce an unbounded wait.

## Closure still required

G1-008 remains AMBER until the repaired source is under Git authority, deployed unchanged to production, and the unchanged rendered state-system acceptance proves on desktop and 390px:

1. explicit Fit loading state;
2. action locked against duplicate submission;
3. request remains alive for a legitimate production generation;
4. HTTP-successful response;
5. returned Fit sessions visibly render;
6. controlled settled completion state;
7. retained authenticated state; and
8. zero document-root horizontal overflow.

A GREEN source-capture run or merged source change alone is not PASS.

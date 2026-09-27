# Journey startup destination repair

Rendered production acceptance run [35132884414](https://github.com/shiftsometimber/shift-core/actions/runs/35132884414) failed G2-015 at the mobile 390px reload: the plan manager existed but was hidden for the entire 20-second visibility wait. The earlier mobile current-plan and replacement/history checks passed; desktop passed. G2-011, G2-013 and G2-014 reported empty failure arrays.

The current dashboard inserts `/member-my-journey-v2.js` asynchronously after session hydration. Its startup selected Journey for Journey aliases and unconditionally selected Today for every other hash, including `#plans`. This resets an already-selected Plans panel when Journey loads late. Deterministic tests reproduce the reset in the exact served source, both for a deep link and for selection before delayed startup.

The Git-owned V2 asset is pinned from `https://shiftsometimber.co.uk/member-my-journey-v2.js`, retrieved on 2026-09-16. Original bytes: 17,629. Original SHA-256: `d63cd880043ed09553af0deac48478f781d4be15fe0a7381dd14b14fe600993c`. This matches the retained earlier public source at `/tmp/shift-fit-public-audit/member-my-journey-v2.js`.

Only startup destination selection changes: in the restored-tools shell, an existing Plans or Progress panel keeps its requested destination. Journey aliases, Today fallback, legacy-shell behavior, forms, saved data and API calls retain their original code. The regression test reverses that one replacement and verifies the entire original source hash. The Worker asset map now serves the pinned V2 through the existing Git asset authority.

The observed production failure did not capture final active-panel state, so the exact runtime event ordering remains inferred from the reproduced source behavior. No live users or commissioning accounts were created for this diagnosis. Existing production acceptance assertions and timeouts remain intact; the next release must pass its full rendered acceptance workflow.

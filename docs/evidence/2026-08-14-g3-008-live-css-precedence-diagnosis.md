# G3-008 production accessibility — live CSS/cache precedence diagnosis

Date: 2026-08-14

Status: **AMBER — source repair prepared; production re-proof required after publication.**

## Commissioning standard

This note does not promote G3-008 on the strength of source code, a merge, or a green non-rendered gate. PASS still requires the authenticated production member journey at both commissioned viewports with retained evidence.

## Production evidence observed

Gate 1 rendered production run `31761405828`, job `94648366342`, executed the authenticated G3-008 harness against the current production estate.

The run proved, across My Shift, Today, Grub, Fit and Progress at 1440×900 and 390×844:

- member registration and authenticated access worked;
- `main` and `h1` landmarks were present on the exercised surfaces;
- reduced-motion preference was honoured;
- keyboard focus was visible;
- desktop root overflow was zero on the exercised surfaces;
- the live unversioned `member-p0-v1.css` already contained the bounded forest-palette repair (`#53624d` primary/eyebrow and `#6f7869` form boundaries).

It also proved G3-008 was **not PASS**. The browser was still computing legacy values on multiple rendered controls:

- primary action background `rgb(139,150,112)` with white text, approximately 3.14:1;
- form boundaries `rgb(200,193,183)`, approximately 1.76:1;
- the 390px Progress surface retained 88px root overflow in the failing production path.

The evidence identified conflicting P0 asset identities in the actual rendered journey. The member shell linked `member-p0-v1.css?v=3`, while the 390px Progress path could retain only `member-p0-v1.css?v=2`. The freshly fetched unversioned asset contained the repaired rules, but the versioned stylesheet path used by the rendered journey could still deliver/apply the older visual rules. This is a production asset-cache/source-precedence defect, not grounds to weaken the contrast threshold.

## Bounded repair prepared

The authoritative member shell now canonicalises the member P0 stylesheet to `member-p0-v1.css?v=4`, removes stale duplicate P0 links, moves the canonical sheet to deterministic late precedence, and uses a head `MutationObserver` to restore the canonical sheet if a member-surface transition replaces/removes it. The frontend source gate was updated to require this cache/preference guard rather than merely hard-code the previous `v=3` URL.

No palette redesign or new feature is introduced. The repair preserves the commissioned forest/cream design system and only makes the already-approved bounded P0 rules deterministic through the real member journey.

## Required closure proof

G3-008 remains AMBER until the source repair is published and a fresh authenticated production run demonstrates, at both 1440×900 and 390×844 across My Shift, Today, Grub, Fit and Progress:

1. primary/action text contrast >= 4.5:1 where the harness classifies normal text;
2. meaningful control/form boundaries >= 3:1;
3. zero root horizontal overflow;
4. visible keyboard focus;
5. required landmarks/headings;
6. reduced-motion behaviour;
7. screenshots + machine-readable report retained as the commissioning artifact.

If any one of those remains red, G3-008 stays AMBER and the exact rendered defect is repaired rather than reconciled away.

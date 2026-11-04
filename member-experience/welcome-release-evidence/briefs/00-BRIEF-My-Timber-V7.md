MY TIMBER V7: ONE RELEASE BRIEF (PASS/FAIL)

Attached: 21 numbered screens (01 to 21) and 3 overview sheets (90 to 92). Build to these exactly. If a screen and this brief disagree, the brief wins; ask me before guessing. Send me your plan before writing code. Nothing has been deployed yet.

A. ORDER OF WORK: ONE RELEASE, NO STAGES
1. V7 (Today, Journey, Grub, Fit, recap, league, share card, preferences) and the speed fixes go live together in one release. No feature flags, no phased rollout.
2. Speed fixes in the same release:
   - shrink the 432 KB header logo
   - move the ~256 KB inline CSS to a cached file
   - identity check runs once, early
   - Grub, Fit and Life Back become native screens, not iframes
   - no new network calls when a screen opens; stall detection, recaps and session adjustment run overnight
3. Keep a one-step rollback to the current live version ready on release day. If anything breaks for members, roll back first, fix after.

B. LOG PILE (the rule that matters most)
4. Only Done on Today's one thing earns a pile log. Once per day per account, across devices, whichever screen Done is tapped on (Today or the Grub card for the same action).
5. Nothing else ever adds or removes a log: quick logs, food, off-plan meals, eating out, walks, extra sessions.
6. Pile shows N of 30 and "X to go" that always add up to 30. Milestone at 30 awarded once. Monday reset clears only the weekly league, never the pile.
PASS: Done twice on two devices and on Today + Grub = 1 log. Tap every quick log, log food, log a walk: pile unchanged.

C. TODAY (screens 01 to 04)
7. Mood: Good / So-so / A bit flat buttons stay visible. No previously recorded mood shows on Today; only a "History ›" link opens past check-ins.
8. Quick log row (Pint, Takeaway, Gym done, Rough night, Weigh in) under "Quick log" with "Helps Timber learn. Doesn't add a pile log."
9. Swap: three alternatives, each within 5g protein of the original, from the same nutrition data, not hard-coded. Plus Not for me, Didn't get round to it, None of these?, Keep the original.
10. After Done: +1 log, optional "How did it go?" (Helped / Tried it, didn't help / Ask me later). Log is safe either way. Done never adds food.

D. JOURNEY, RECAP, SHARING (05 to 12)
11. Weight shown by default and leads Journey. Hiding weight is only the Show weight setting in More > Preferences.
12. Weight never appears on the share card, recap share or anything shareable. Share needs a preview.
13. "What you've told us" naming. Medicine over time collapsed. Timeline shows latest 2 wins + See all. Detailed chart loads only when opened.
14. Mates league ranks by logs this week only, never weight, private to the crew.

E. GRUB (13 to 18)
15. Today's meals: swipe row (Breakfast, Lunch, Dinner, Snacks), one line each: name · protein · kcal. Next card peeks.
16. "+ Snack" always visible. Protein and Calories bars use the member's own targets from his plan, never hard-coded.
17. Quick log: meal selector, usuals, snack chips, search, photo, barcode, and "Off-plan / Big one" styled like every other option.
18. Off-plan: neutral confirmation, calories shown plainly. No red, no warnings, no "over budget".
19. Meal detail: calories, protein, carbs (sugars), fat (saturates), fibre, salt. Traffic lights only on sugars, fat, saturates, salt (UK front-of-pack scheme). These muted traffic-light colours are the only allowed non-green accent.
20. Eating out: swipe row of places + Search, figures labelled as estimates.
21. Under-eating flag: build it switched off. Thresholds come from our clinical partner; do not invent them.
22. Nutrition data comes from a named food database. Tell me which before you build.

F. FIT (19 to 21)
23. Today's session by time (10/20/40) and kit (None/Dumbbells/Gym), Start and Swap it (shorter, no-kit, low-impact).
24. "Log a walk" records activity only, no pile log. If Today's one thing is a walk or session, its Done earns the log as normal.
25. Health tags (e.g. knee) need clear consent, are deletable, and never appear in anything shareable.
26. "How did it go?" and "How hard was it?" are optional; next session adjusts overnight.

G. LOOK AND FRAME
27. Frame unchanged on every screen: flat black, circled-S + MY TIMBER, Today/Journey/Shop with green underline on active tab, bottom bar Grub/Fit/Support/More. Highlight the active bottom item (including More on Preferences).
28. Brand green accent. No amber, no wood grain, no emojis. Symbols shown as text in mockups (tick, swap, star, play, chevron) are drawn as thin line icons.
29. UK English. "CONCEPT, EXAMPLE DATA" labels are mockup-only; remove them in the build and use real member data.

H. SPEED TARGETS (throttled mobile, p95, 20+ samples per screen)
30. Tap feedback under 100ms. Warm tab switch under 500ms. Fresh screen under 2s. Today and Fit before/after numbers reported.

I. PROOF BEFORE GO-LIVE
- Recordings on iPhone Safari and Android Chrome of three journeys: choose an action (incl. swap), return after a hard week, reach the first stack milestone.
- Recordings: a full Grub day (breakfast, lunch, snack, off-plan dinner, eating out) and a Fit session with rating.
- Pass/fail table for every numbered item above, plus speed numbers.
- A list of every current live feature confirming it still exists.

DO NOT: change the frame, add features not in this brief, invent nutrition or clinical figures, calculate anything when a screen opens, or show weight in anything shareable.

"Ready to deploy" is not done. Done is live, working for members, and faster.

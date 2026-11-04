# Work order: Welcome tab and Explore weight loss

Do all of this now. Each line is pass or fail. Mockups in this folder: 47 Welcome first visit, 48 Welcome after setup, 40b Today, 41 to 46 Explore weight loss. Artwork crops (from Matt's `welcome-artwork-v2.png`): `../artwork/welcome-v2-headline.webp`, `../artwork/welcome-v2-note.webp`, `../artwork/welcome-v2-note-nobutton.webp`.

## 1. Welcome as the first top tab
- [ ] Top tabs read, in order: Welcome, Today, Journey, Shop. Welcome is first.
- [ ] The plan: a first visit lands on Welcome. A returning member lands on Today. Welcome stays as a tab after setup.

## 2. Welcome visual (v2 artwork)
- [ ] PASS only if the Welcome visual is the supplied v2 artwork image, not rebuilt in CSS. Headline, paper, tape, pins and note text come from the image files.
- [ ] Use only the headline and note crops. Do not use the artwork's own header, three tabs, "Have a look around" or bottom bar; the app draws those.
- [ ] Headline 374px wide, note 378px wide on a 390px screen (about 2.2x, sharp on phones). Crop edges fade into #050505 with a CSS mask, no visible box.
- [ ] Ship the crops as supplied (WebP, each under 100KB). Alt text on each image carries the full wording.

Copy, exactly as in the artwork:
> YOU DON'T HAVE TO SORT EVERYTHING YOURSELF.
> Welcome to My Timber.
> Better grub. Movement at your pace. Support that sticks around.
> No lectures. No labels. No pressure to spill your guts.
> Start small. Take one useful step today.
> MAKE IT MINE

## 3. Buttons and states
First visit (47), note with its MAKE IT MINE button:
- [ ] MAKE IT MINE is part of the artwork, with a real tappable hotspot exactly over it (left 10.8%, top 77.5%, width 78.1%, height 11.3% of the note image), a 44px minimum tap height, a visible focus ring and the label "Make it mine" for screen readers. It goes to the three quick taps, then the first Done on Today.
- [ ] Directly under the note: EXPLORE WEIGHT LOSS, a real outlined button (2px #707762, cream text). It goes into the EXISTING clinical route ("Check eligibility and explore your options"). No new questionnaire.
- [ ] Below that: "Have a look around", a quiet cream text link. It goes to Today without setup.

After setup (48):
- [ ] The MAKE IT MINE button is removed: use `welcome-v2-note-nobutton.webp` (same note, torn bottom edge kept, no button).
- [ ] Welcome keeps the headline, the note and EXPLORE WEIGHT LOSS, now a filled #707762 button with black text, as it is the only action left.
- [ ] Below it: "Your one thing for today is waiting in Today" link, to Today.
- [ ] Personalise My Timber stays in the existing setup flow (More), not on Welcome.

## 4. Palette and tabs
- [ ] Only three colours: black #050505, cream #E7E3DA, brand green #707762 (all from the live CSS). No other greens or greys. Thin dividers may be cream at reduced opacity.
- [ ] Top tabs: labels and icons bold (800) cream #E7E3DA (the "white"). Active tab underline: #707762.
- [ ] Bottom bar (Grub, Fit, Support, More): #707762, bold (800), icons #707762.
- [ ] Filled buttons: #707762 background, black #050505 text, bold, at least 19px (contrast 4.37:1, passes AA for large bold text). Cream text on green is 3.64:1, so do not use it.
- [ ] Outline buttons: 2px #707762 border, cream text.

## 5. Explore weight loss (41 to 45 show the target, reuse live wording)
Order: 41 intro > 42 health questions > 43 choose and pay > 44 under review > back to My Timber Today (46). 45 not suitable shows only if declined.
- [ ] 41 Intro: no medicine names, images, prices or "buy". Says what the route is, what to have to hand, a privacy line. "Start my health questions" and "Not ready? Keep going with My Timber". No questionnaire duration unless the live route states one.
- [ ] 42 Questions: one question per screen, progress bar, Back and Continue, Save and finish later. Questions come from the existing provider route.
- [ ] 43 Choose and pay: shown only after the questionnaire is complete. Option and price come from the live till. This plain line sits directly above the pay button: "If the prescriber decides it isn't right for you, you get a full refund. Automatically." (Use "Automatically" only once confirmed in section 6.) Also shows "Paying doesn't guarantee a prescription. The prescriber decides."
- [ ] 44 Under review: "Paid. A prescriber is reviewing your answers." Next steps: approved, dispensed and sent; not approved, full refund. No promised times. Main button "Back to My Timber" goes to Today, with the line "We'll tell you the prescriber's decision here in the app."
- [ ] 45 Not suitable: kind wording, ask the prescriber why, talk to your GP, other support, My Timber stays free. Shows "Your refund is on its way" (charge then refund) or "Your card hasn't been charged" (card hold), matching the method used. Main button "Back to My Timber" goes to Today.
- [ ] 46 Today with status: a small row "Your treatment: with your prescriber" at the top of Today. Tapping it opens the review status. It updates when the outcome arrives.
- [ ] PASS: after payment, and after any outcome, the member lands back in My Timber Today, and the review status is visible there.

## 6. Payment and compliance (POM)
- [ ] PASS: payment is taken at checkout after the questionnaire and before prescriber review.
- [ ] PASS: the refund-if-not-approved line is shown plainly before paying, and the refund is processed automatically when the prescriber declines, with no action from the member.
- [ ] Developer to say NOW whether the till supports a card hold (authorise at checkout, capture on approval). If it does, use the card hold in preference to charge then refund, and switch the wording on 43 to 45 to match.
- [ ] No medicine name, image or price anywhere before the questionnaire is complete.
- [ ] Discount codes unchanged.

## 7. Unchanged
- [ ] Shop is unchanged.
- [ ] Discount codes, checkout and the clinical provider integration are unchanged.

## 8. Speed
- [ ] No heavy images. Welcome images total under 120KB (first visit about 114KB, after setup about 106KB).
- [ ] Fresh load of Welcome under 2s on mobile 4G (Lighthouse or WebPageTest result attached).

## 9. Proof, now
- [ ] Screen recording: first visit, lands on Welcome, Make it mine, three taps, first Done. Then Welcome again, showing the after-setup state.
- [ ] Screen recording: first visit, Have a look around, lands on Today without setup.
- [ ] Screen recording: Explore weight loss into the existing route, through to sent.
- [ ] Screen recording: returning member lands on Today.
- [ ] Screenshots of 40b to 48 equivalents on a real phone, at 2x.
- [ ] Contrast check output for buttons and bars.

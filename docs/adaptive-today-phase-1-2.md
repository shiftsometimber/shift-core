# My Timber Today — six-tap contract

## Definition of done

A tired member can use one thumb at 19:40 to record Mood, Guts and Energy, reveal tonight, save a named dinner, and save a movement choice in six taps and twenty seconds. There is no keyboard, scoring ceremony, generic completion event, success screen or manual Save button.

## Main path

1. Three 48px state taps: Mood, Guts, Energy.
2. `Show me what matters` writes the check-in.
3. Exactly three cards: Grub, Move, Treatment. Repeated rough guts may raise Treatment because safety context outranks presentation order.
4. Selecting a meal writes its actual title. Selecting movement writes its actual activity and minutes. Treatment is read-only unless the member chooses an action.
5. A same-evening return lands on the saved cards with `Change how I’m doing`.

Fridge, takeaway, treatment support, stopping, Ask Timber and progress logging are deliberate branches after tonight is decided.

## Adaptation

The current and previous check-in drive all three domains from one server context. Rough guts selects smaller meals. Empty energy selects ten minutes rather than twenty-five. Repeated rough guts strengthens and raises Treatment. The client never fabricates medicine, dose or week.

## Persistence and privacy

- `shift_today_checkins` stores one member/date state row.
- `shift_today_choices` stores the real meal, movement or optional treatment action.
- `shift_treatment_context` stores explicit member treatment context once.
- Every route requires the existing authenticated member session and constrains reads/writes by `user_id`.
- HQ uses the existing authorised operational endpoint and displays check-ins and saved real-world choices.

## Grub direction

Grub is dose-aware decision support, not calorie counting or a recipe catalogue. Tonight comes first: three suitable plates, fridge, takeaway or the member’s own dinner. Actual saved meals later power a short repeated week and shopping list. Language and habit precede any retail SKU.

"""Create fictional input histories using only the supplied author packet files."""

import copy
import datetime as dt
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).parent
CATALOGUE = json.loads((HERE / "catalogue.json").read_text())
TEMPLATE = json.loads((HERE / "state-template.json").read_text())
MONDAYS = [dt.date(2026, 8, 31) + dt.timedelta(days=7 * w) for w in range(4)]
DAY = {name: i for i, name in enumerate(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])}
HISTORIES = []


def occurrence_date(week, key):
    return (MONDAYS[week] + dt.timedelta(days=DAY[key.split("-")[0]])).isoformat()


def start(number, name, title, background, preferences, goal, followup):
    state = copy.deepcopy(TEMPLATE)
    state.update(revision=0, clock="2026-09-13", anchor="2026-08-30", cycle=2,
                 name=name, preferences=preferences, goal=goal, setup=True,
                 entitlement={"active": True})
    history = dict(id=f"case-{number:02d}", title=title, background=background,
                   state=state, memberFollowup=followup)
    HISTORIES.append(history)
    return state


def slot(state, week, key, kind, **fields):
    date = occurrence_date(week, key)
    item = dict(id=f"{date}:{key}", date=date, slotKey=key, kind=kind,
                **fields, completed=False)
    state["slots"].append(item)
    return item["id"]


def meal(state, week, key, recipe, quantity, now=None):
    return slot(state, week, key, "meal", recipeId=recipe, recipeVersion=1,
                servings=quantity, serveNow=quantity if now is None else now)


def leftovers(state, week, key, source, quantity):
    return slot(state, week, key, "leftovers", servings=quantity, sourceId=source)


def walk(state, week, key, label, minutes):
    return slot(state, week, key, "move", label=label, minutes=minutes)


def report(state, week, key, status, fit, shift, reason, note):
    found = next(s for s in state["slots"]
                 if s["slotKey"] == key and s["date"] == occurrence_date(week, key))
    state["reports"].append(dict(slotKey=key, kind=found["kind"],
        period=MONDAYS[week].isoformat(), date=found["date"], shift=shift,
        status=status, fit=fit, reason=reason, note=note))


def request(state, key, date, reason):
    state["requests"].append(dict(slotKey=key, date=date, reason=reason))


def freeze(state, key, cycle, date):
    state["freezes"][key] = dict(throughCycle=cycle, evidenceAt=date)


def acquired(state, week, values):
    period = f"{MONDAYS[week].isoformat()}..{(MONDAYS[week] + dt.timedelta(days=6)).isoformat()}"
    state["acquired"][period] = {
        key: dict(status=status, quantity=quantity) for key, status, quantity in values
    }


def manual(state, identifier, name, week=2):
    period = f"{MONDAYS[week].isoformat()}..{(MONDAYS[week] + dt.timedelta(days=6)).isoformat()}"
    state["manualItems"].append(dict(id=identifier, name=name, period=period))


s = start(1, "Mira", "A changing shop rota", 
    "Mira shares evening meals with her partner. These saved occasions sit alongside other meals they arrange themselves. "
    "She had an early retail rota in the first week and covered two late closes in the second. Her partner can help at weekends. "
    "On 10 September she explicitly chose to leave Wednesday wraps alone through cycle 3, because those evenings have been straightforward. "
    "On 12 September she asked to revisit Monday dinner after seeing another late close on the next rota. She has bought mince for the coming week and checked their rice tin.",
    dict(allergies="none", diet="any", equipment=["hob"], activityLimitations="none",
         time="About 20 minutes on late-close evenings; up to an hour together on Saturdays.",
         household="Two adults, usually both eating the saved dinners.",
         spending="Roughly £45 for our shared evening food each week; use the rice already here."),
    "Keep a few shared dinners and get outside between shop shifts.",
    dict(preferredMealId="tuna", reason="I fancy the tuna pasta on work nights because fifteen minutes sounds doable."))
for w in range(4):
    meal(s, w, "mon-dinner", "chilli", 2)
    meal(s, w, "wed-dinner", "wraps", 2)
    meal(s, w, "sat-dinner", ["ragu", "chickpea", "ragu", "chilli"][w], [4, 2, 4, 2][w], 2)
    if w in (0, 2):
        leftovers(s, w, "sun-lunch", f"{occurrence_date(w, 'sat-dinner')}:sat-dinner", 2)
    walk(s, w, "tue-walk", "Loop around the recreation ground", 20)
    walk(s, w, "sun-walk", "Walk to the riverside and back", 35)
report(s, 0, "mon-dinner", "done", "manageable", "Early shop shift", "I was home by five.", "We cooked together and both had dinner.")
report(s, 0, "wed-dinner", "done", "manageable", "Usual daytime shift", "There was very little to get ready.", "We liked having something simple halfway through the week.")
report(s, 0, "sat-dinner", "done", "did-not-fit", "Saturday off", "I started too late before our film.", "We ate it, but the chopping felt like a rush.")
report(s, 0, "sun-lunch", "done", "manageable", "Sunday off", "Lunch was already there.", "We used the two portions from Saturday.")
report(s, 0, "tue-walk", "done", "manageable", "Early shop shift", "I still had some daylight after work.", "The shorter loop was pleasant.")
report(s, 0, "sun-walk", "missed", "unknown", "Sunday off", "We stayed in when it poured.", "I did not go out for this walk.")
report(s, 1, "mon-dinner", "missed", "unknown", "Unexpected late close", "I got back after eight and we ate something else.", "Neither of us started the chilli.")
report(s, 1, "wed-dinner", "done", "manageable", "Late shop shift", "My partner had the ingredients ready.", "We still sat down together.")
report(s, 1, "sat-dinner", "done", "manageable", "Saturday off", "We began earlier this time.", "The chickpea rice fitted nicely before we went out.")
report(s, 1, "tue-walk", "missed", "unknown", "Covering a late close", "The shop needed me to stay.", "I came straight home afterwards.")
report(s, 1, "sun-walk", "done", "manageable", "Sunday off", "We wanted some fresh air.", "We walked together after breakfast.")
request(s, "mon-dinner", "2026-09-12", "I'm closing again next Monday; could we revisit that dinner?")
freeze(s, "wed-dinner", 3, "2026-09-10")
acquired(s, 2, [("mince|g", "bought", 500), ("rice|g", "have", 450)])
manual(s, "mira-washing-up", "Washing-up liquid")

s = start(2, "Leo", "A useful small batch", 
    "Leo lives alone and is vegetarian. He saves a Tuesday cook and a portion for Wednesday lunch, a Friday bowl, "
    "and a Sunday meal when a friend sometimes visits. The extra Tuesday portion is put aside for the next day's lunch. "
    "A visitor stayed for Sunday dinner in the first week; he ate alone in the second. On 12 September he chose to leave "
    "the Tuesday cook in place through cycle 4. He counted the tins and rice he wants to use next week.",
    dict(allergies="none", diet="vegetarian", equipment=["hob"], activityLimitations="none",
         time="I have half an hour on Tuesdays and like a quick Friday meal.",
         household="One adult; I sometimes invite a friend for Sunday dinner.",
         spending="I can spend about £25 on these saved meals and would like to use my cupboard tins."),
    "Cook without much waste and make room for relaxed walks.",
    dict(preferredMealId="chickpea", reason="I enjoy the chickpea rice and a second portion makes the following lunch easy."))
for w in range(4):
    source = meal(s, w, "tue-dinner", "chickpea", 2, 1)
    leftovers(s, w, "wed-lunch", source, 1)
    meal(s, w, "fri-dinner", "beanSalad", 1)
    meal(s, w, "sun-dinner", "chickpea", [2, 1, 2, 1][w])
    walk(s, w, "wed-walk", "Neighbourhood walk before lunch", 25)
    walk(s, w, "sat-walk", "Park paths with a friend", [30, 40, 35, 35][w])
report(s, 0, "tue-dinner", "done", "manageable", "Working from home", "I finished work on time.", "One portion for dinner and one put aside for Wednesday.")
report(s, 0, "wed-lunch", "done", "manageable", "Working from home", "I only needed to get lunch ready.", "I ate the portion I had saved.")
report(s, 0, "fri-dinner", "done", "manageable", "Office day", "I wanted something quick after the train.", "The bean bowl was enough before my evening class.")
report(s, 0, "sun-dinner", "done", "manageable", "Friend visiting", "We chatted while I cooked.", "We ate both portions.")
report(s, 0, "sat-walk", "done", "manageable", "Free Saturday morning", "My friend met me at the gate.", "We took the shorter park circuit.")
report(s, 1, "tue-dinner", "done", "manageable", "Working from home", "I knew what to do this time.", "Again, I kept one portion for the next day.")
report(s, 1, "wed-lunch", "done", "manageable", "Working from home", "I had a gap between calls.", "The lunch portion got used.")
report(s, 1, "fri-dinner", "done", "did-not-fit", "Office day", "I fancied a hot meal on a chilly evening.", "I made the bowl and ate it, but it was not what I wanted that night.")
report(s, 1, "sun-dinner", "done", "manageable", "Quiet Sunday at home", "It was easy to cook for just me.", "I finished dinner before calling my sister.")
report(s, 1, "wed-walk", "done", "manageable", "Working from home", "I protected my lunch break.", "It helped to leave the desk for a bit.")
report(s, 1, "sat-walk", "done", "manageable", "Free Saturday morning", "We had time for the longer loop.", "Forty minutes felt comfortable.")
freeze(s, "tue-dinner", 4, "2026-09-12")
acquired(s, 2, [("chickpeas|g", "have", 480), ("rice|g", "have", 300), ("tomatoes|g", "bought", 400)])

s = start(3, "Sana", "Not sure what made Thursday difficult", 
    "Sana and her spouse both commute, and Thursday is meant to provide dinner plus two portions for Friday lunch. "
    "Their trains and evening plans varied across the fortnight. Sana remembers some occasions clearly and is unsure about others. "
    "She has not attributed the Thursday difficulties to one cause and has made no decision to keep or change a particular meal. "
    "She checked one tin of beans but has not checked how much pasta is left.",
    dict(allergies="none", diet="any", equipment=["hob"], activityLimitations="none",
         time="Usually 30 to 45 minutes for an evening meal, but the train home is unpredictable.",
         household="Two adults; we like taking lunch from a previous dinner when it happens.",
         spending="We have around £40 for these meals, though I have not counted everything in the cupboard."),
    "Find an evening rhythm that works around our journeys.",
    dict(preferredMealId=None, reason="I'm not ready to pick a different meal; I'm still not sure what went wrong on Thursdays."))
for w in range(4):
    meal(s, w, "mon-dinner", ["tuna", "wraps", "tuna", "tuna"][w], 2)
    source = meal(s, w, "thu-dinner", "chilli", 4, 2)
    leftovers(s, w, "fri-lunch", source, 2)
    meal(s, w, "sat-dinner", ["wraps", "ragu", "wraps", "chickpea"][w], 2)
    walk(s, w, "wed-walk", "Station neighbourhood loop", 20)
    walk(s, w, "sun-walk", "Walk around the common", 25)
report(s, 0, "mon-dinner", "done", "manageable", "Usual office day", "We both got home at about six.", "The pasta was quick enough.")
report(s, 0, "thu-dinner", "done", "did-not-fit", "Office day with a late train", "I remember being annoyed, but not exactly why.", "We did cook and set aside two lunch portions. It might have been the delay or just the evening.")
report(s, 0, "fri-lunch", "done", "manageable", "Office day", "Lunch was packed already.", "We each took one of Thursday's portions.")
report(s, 0, "wed-walk", "unknown", "unknown", "Office day", "I cannot remember whether I did the loop or came straight home.", "I did not write it down at the time.")
report(s, 0, "sun-walk", "done", "manageable", "Sunday at home", "We went after breakfast.", "We were happy with the route.")
report(s, 1, "mon-dinner", "done", "manageable", "Usual office day", "The ingredients were ready to use.", "We made wraps when we got in.")
report(s, 1, "thu-dinner", "missed", "unknown", "Office day", "I know we did not cook it, but I cannot remember what changed first.", "We ate separately that evening; I do not want to guess the reason.")
report(s, 1, "sat-dinner", "done", "unknown", "Saturday with errands", "We definitely cooked the ragù.", "I cannot really say whether it fitted the day well.")
report(s, 1, "wed-walk", "done", "manageable", "Office day", "I had no appointment after work.", "I took the loop before heading home.")
acquired(s, 2, [("beans|g", "have", 240), ("pasta|g", "unknown", 0)])

s = start(4, "Ellis", "Only one check-in", 
    "Ellis rents a room and uses a shared hob. He saved a few meals and walks when he set up, but has entered only one "
    "report over the fortnight. The saved ragù includes one portion for the following day. He has not supplied allergy "
    "or activity-limitation information, checked cupboard stock, or asked to alter any particular slot. His lack of reports "
    "does not say whether the other saved occasions happened.",
    dict(allergies="unknown", diet="any", equipment=["hob"], activityLimitations="unknown",
         time="I can usually book the shared kitchen for half an hour; longer on Saturday.",
         household="One adult in a house share, cooking my own meals.",
         spending="I am trying to keep these dinners to about £20 a week."),
    "Have a few meals written down so shopping takes less thought.",
    dict(preferredMealId=None, reason="I haven't looked closely enough to choose another dish yet."))
for w in range(4):
    meal(s, w, "tue-dinner", ["tuna", "chickpea", "tuna", "wraps"][w], 1)
    meal(s, w, "thu-dinner", "beanSalad", 1)
    source = meal(s, w, "sat-dinner", "ragu", 2, 1)
    leftovers(s, w, "sun-lunch", source, 1)
    walk(s, w, "mon-walk", "Walk to the little park and back", 15)
    walk(s, w, "fri-walk", "Canal towpath loop", 20)
report(s, 1, "sat-dinner", "done", "manageable", "Saturday at home", "The kitchen was free when I wanted it.", "I had one portion and saved the second for Sunday lunch.")

s = start(5, "Priya", "Kitchen work has overrun", 
    "Priya cooks for herself, her partner and their child. They chose these saved meals before repairs to their kitchen. "
    "The hob was available for both past weeks' saved cooked dinners, but was disconnected on 11 September after Friday's "
    "meal and is now expected back on 25 September. Their current equipment list is empty because no cooking appliance is "
    "available; they still have a fridge and a preparation surface. On 12 September Priya asked to revisit the Wednesday "
    "and Friday dinners. She had already bought pasta and rice for the coming week and has six wraps in the cupboard.",
    dict(allergies="none", diet="any", equipment=[], activityLimitations="none",
         time="Ten to twenty minutes at our temporary preparation table until the kitchen is working again.",
         household="Two adults and one child; three portions at the saved family dinners.",
         spending="About £40 for these dinners; I would prefer to use purchases we have already made where possible."),
    "Keep some shared dinners going while the kitchen is being repaired.",
    dict(preferredMealId="wraps", reason="We can put wraps together at the table and the three of us already like them."))
for w in range(4):
    meal(s, w, "wed-dinner", ["chilli", "chickpea", "ragu", "chilli"][w], 3)
    meal(s, w, "fri-dinner", ["tuna", "tuna", "chickpea", "tuna"][w], 3)
    meal(s, w, "sun-dinner", "wraps", 3)
    walk(s, w, "tue-walk", "Neighbourhood walk after the school run", 15)
    walk(s, w, "sat-walk", "Family park loop", 30)
report(s, 0, "wed-dinner", "done", "manageable", "Usual work and school day", "We had the kitchen to ourselves.", "All three of us ate the chilli.")
report(s, 0, "fri-dinner", "done", "manageable", "Usual work and school day", "It was quick before our film.", "We had dinner together.")
report(s, 0, "sun-dinner", "done", "manageable", "Family Sunday", "Everyone could help assemble their own.", "The wraps went down well.")
report(s, 0, "sat-walk", "done", "manageable", "Free Saturday afternoon", "We wanted to get out of the house.", "The park loop worked for us.")
report(s, 1, "wed-dinner", "done", "did-not-fit", "Work day with repair preparations", "I kept moving boxes to find things.", "We ate it, but cooking around the packing was frustrating.")
report(s, 1, "fri-dinner", "done", "manageable", "Work day; hob disconnected afterwards", "I cooked before the fitter arrived.", "The pasta was finished while we still had the hob.")
report(s, 1, "sun-dinner", "done", "manageable", "Sunday without a working kitchen", "We could make these at the table.", "We had an early dinner after our outing.")
report(s, 1, "tue-walk", "missed", "unknown", "School day with a delivery", "I needed to be home for the delivery window.", "I did not do the extra loop.")
report(s, 1, "sat-walk", "done", "manageable", "Saturday during kitchen repairs", "We welcomed an excuse to get outside.", "We all went around the park.")
request(s, "wed-dinner", "2026-09-12", "The hob will still be disconnected next Wednesday; can we revisit that dinner?")
request(s, "fri-dinner", "2026-09-12", "Next Friday also needs something we can prepare without a hob.")
acquired(s, 2, [("pasta|g", "bought", 400), ("rice|g", "bought", 300), ("wraps|whole", "have", 6)])
manual(s, "priya-bin-bags", "Bin bags")

s = start(6, "Jonas", "Family visits, tired evenings and a sore knee", 
    "Jonas usually cooks for himself, with family at Sunday dinner. His daughter and two other relatives joined him in "
    "the second past week and plan to return on 20 September, so those Sundays have four portions. He states that he "
    "has a fish allergy and that his knee has been sore; he asks for short, flat walks. He has not supplied a diagnosis. "
    "On 12 September he asked to revisit the Saturday walk, and on 13 September he asked about a dinner with less time "
    "standing at the hob on Wednesdays. Also on 13 September he explicitly chose to leave the saved Sunday meal "
    "alone through cycle 4 because he values that family occasion. He checked some food but could not check the pasta.",
    dict(allergies=["fish"], diet="any", equipment=["hob"],
         activityLimitations="My knee is sore. I only want short walks on flat ground at the moment.",
         time="I feel tired after work; I would like less time standing at the hob on Wednesdays.",
         household="One adult most days; two at Sunday dinner normally, four on 13 and 20 September.",
         spending="About £35 for my saved meals, with a bit extra when family comes. Please make use of the mince and beans."),
    "Keep family dinners and fit cooking and walking around how my week feels.",
    dict(preferredMealId="beanSalad", reason="The bean bowl sounds useful on an evening when I do not want to stand at the cooker."))
for w in range(4):
    source = meal(s, w, "wed-dinner", "ragu", 2, 1)
    leftovers(s, w, "thu-lunch", source, 1)
    meal(s, w, "fri-dinner", "beanSalad", 1)
    meal(s, w, "sun-dinner", "chilli", [2, 4, 4, 2][w])
    walk(s, w, "tue-walk", "Neighbourhood loop past the shops", 25)
    walk(s, w, "sat-walk", "Country park circuit with the hill", 40)
report(s, 0, "wed-dinner", "done", "manageable", "Usual work day", "I got started before I sat down.", "I put one portion aside for Thursday.")
report(s, 0, "thu-lunch", "done", "manageable", "Usual work day", "I brought the saved portion with me.", "It made lunch straightforward.")
report(s, 0, "fri-dinner", "missed", "unknown", "Usual work day", "I thought I had beans but the cupboard was empty.", "I made something else.")
report(s, 0, "sun-dinner", "done", "manageable", "Family Sunday", "My brother helped chop the onion.", "It was nice eating together.")
report(s, 0, "tue-walk", "done", "did-not-fit", "After work", "My knee was sore by the time I got home.", "I finished the loop but it felt too long that evening.")
report(s, 0, "sat-walk", "missed", "unknown", "Saturday at home", "I stayed indoors because of the heavy rain.", "I did not start the walk.")
report(s, 1, "wed-dinner", "done", "did-not-fit", "Long work day", "I was tired of standing by the end.", "Dinner got made and I saved a lunch portion, but it took more out of me this week.")
report(s, 1, "fri-dinner", "done", "manageable", "Usual work day", "I had bought the beans this time.", "It came together quickly.")
report(s, 1, "sun-dinner", "unknown", "unknown", "Family Sunday", "The others took over in the kitchen and I have not checked exactly what they made.", "We ate together, but I cannot confirm it was the saved chilli.")
report(s, 1, "tue-walk", "missed", "unknown", "Evening family errand", "I drove my daughter to an appointment.", "I did not have the planned walk afterwards.")
report(s, 1, "sat-walk", "done", "did-not-fit", "Saturday morning free", "The hill bothered my knee.", "I went round, but I would prefer flat ground and less distance.")
request(s, "sat-walk", "2026-09-12", "Could Saturday be a shorter walk on flat ground? I do not want that hill again right now.")
request(s, "wed-dinner", "2026-09-13", "Could we look at something with less time standing at the hob after work?")
freeze(s, "sun-dinner", 4, "2026-09-13")
acquired(s, 2, [("beans|g", "bought", 480), ("mince|g", "have", 500), ("pasta|g", "unknown", 0)])
manual(s, "jonas-batteries", "Batteries for the remote")

s = start(7, "Amara", "Term has started and the visitors change", 
    "Amara is a vegetarian teacher who states a wheat allergy. She cooks separately from her flatmate and sometimes "
    "has friends round. Thursday dinner numbers across the four saved weeks are two, three, two and one; Saturday "
    "lunch numbers are two, one, three and two. On 6 September she chose to keep Thursday's chickpea meal in place "
    "through cycle 2. The second week brought evening marking and changed meeting times. On 13 September she "
    "asked about a warm Saturday lunch because the bean bowl had felt less appealing during a cool weekend. She "
    "has checked chickpeas and oil, and bought a cucumber for next week.",
    dict(allergies=["wheat"], diet="vegetarian", equipment=["hob"], activityLimitations="none",
         time="Up to 30 minutes on school nights; more time on Saturdays if friends are coming.",
         household="One adult cooking separately in a shared flat, with varying numbers of friends at Thursday dinner and Saturday lunch.",
         spending="Around £30 for these meals in an ordinary week; visitors contribute when several of us eat."),
    "Keep some easy vegetarian meals and get away from the marking desk.",
    dict(preferredMealId="chickpea", reason="I'd choose the chickpea rice for a warm Saturday lunch with friends."))
for w in range(4):
    meal(s, w, "mon-dinner", "beanSalad", 1)
    meal(s, w, "thu-dinner", "chickpea", [2, 3, 2, 1][w])
    meal(s, w, "sat-lunch", "beanSalad", [2, 1, 3, 2][w])
    walk(s, w, "tue-walk", "Loop through the nearby streets", 20)
    walk(s, w, "sun-walk", "Long park path with a friend", 45)
report(s, 0, "mon-dinner", "done", "manageable", "School preparation day", "I wanted an easy dinner after setting up the classroom.", "The bowl took very little time.")
report(s, 0, "thu-dinner", "done", "manageable", "School day, friend visiting", "We had time to chat while the rice cooked.", "Two portions were right for us.")
report(s, 0, "sat-lunch", "done", "manageable", "Friend visiting at lunchtime", "We wanted a quick lunch before heading out.", "We ate both portions.")
report(s, 0, "tue-walk", "missed", "unknown", "School meeting ran over", "The meeting finished late.", "I went home and started dinner.")
report(s, 0, "sun-walk", "done", "manageable", "Sunday with a friend", "We had a free morning.", "The park path was a good length.")
report(s, 1, "mon-dinner", "done", "manageable", "School day with marking at home", "It was useful to have something quick.", "I ate before opening my laptop again.")
report(s, 1, "thu-dinner", "done", "did-not-fit", "School day with three at dinner", "I was later home than I expected.", "We all ate, but I was trying to cook and answer school messages together.")
report(s, 1, "sat-lunch", "done", "did-not-fit", "Quiet Saturday alone", "I wanted a warm lunch because I felt chilly.", "I finished the bean bowl, but it was not what I fancied.")
report(s, 1, "tue-walk", "done", "manageable", "School meeting moved earlier", "I got away from school on time.", "I enjoyed the short loop.")
report(s, 1, "sun-walk", "missed", "unknown", "Sunday with marking to finish", "I left my marking too late and stayed at the desk.", "My friend went without me.")
request(s, "sat-lunch", "2026-09-13", "Could we consider a warm Saturday lunch for when my friends come?")
freeze(s, "thu-dinner", 2, "2026-09-06")
acquired(s, 2, [("chickpeas|g", "have", 480), ("oil|tbsp", "have", 4), ("cucumber|whole", "bought", 1)])
manual(s, "amara-card", "Birthday card", 3)

s = start(8, "Nolan", "Shared flat dinners around rehearsals", 
    "Nolan shares a flat with two other adults. They save Monday dinner for all three, Friday wraps for whoever has "
    "arranged to eat together, and a smaller Sunday meal when people are often out. In the second past week Monday "
    "ragù was doubled, with three portions set aside for Tuesday lunch. On 5 September Nolan explicitly chose to "
    "leave Monday dinner alone through cycle 3. Rehearsals moved between early and late evenings across the fortnight. "
    "Friday 25 September was saved for six people, but on 13 September three visitors cancelled and he asked to reduce "
    "that occurrence to the three flatmates. He bought chicken for 18 September and has not checked chicken for the "
    "following week. The saved quantities still record the plans made before the cancellation.",
    dict(allergies="none", diet="any", equipment=["hob"], activityLimitations="none",
         time="We can take 45 minutes together on Mondays; Fridays need to fit around rehearsals.",
         household="Three adult flatmates. The three visitors expected on 25 September have now cancelled. Sunday numbers vary.",
         spending="We share the cost of communal dinners; I would like to avoid buying for visitors who are no longer coming."),
    "Keep a couple of communal meals despite different rehearsal times.",
    dict(preferredMealId="ragu", reason="I'd still choose the ragù when we have time together; the extra lunch portions were useful last week."))
for w in range(4):
    source = meal(s, w, "mon-dinner", "ragu", [3, 6, 3, 3][w], 3)
    if w == 1:
        leftovers(s, w, "tue-lunch", source, 3)
    meal(s, w, "fri-dinner", "wraps", [3, 3, 3, 6][w])
    meal(s, w, "sun-dinner", ["tuna", "chickpea", "tuna", "beanSalad"][w], [1, 3, 2, 1][w])
    walk(s, w, "wed-walk", "Short loop before rehearsal", 15)
    walk(s, w, "sat-walk", "Walk along the seafront", 35)
report(s, 0, "mon-dinner", "done", "manageable", "No Monday rehearsal", "All three of us were in.", "We shared the preparation and sat down together.")
report(s, 0, "fri-dinner", "done", "did-not-fit", "Early Friday rehearsal", "I only had a few minutes before leaving.", "I ate the wraps, but dinner felt rushed even though they were quick.")
report(s, 0, "sun-dinner", "done", "manageable", "Sunday evening alone", "The others were out and I had time to cook.", "One portion was right for me.")
report(s, 0, "wed-walk", "done", "manageable", "Later Wednesday rehearsal", "There was a gap before I needed to leave.", "The short loop fitted into it.")
report(s, 0, "sat-walk", "missed", "unknown", "Saturday afternoon soundcheck", "The soundcheck was moved into the afternoon.", "I did not go to the seafront.")
report(s, 1, "mon-dinner", "done", "manageable", "No Monday rehearsal", "We agreed to make tomorrow's lunch at the same time.", "We ate three portions and set aside three for Tuesday.")
report(s, 1, "tue-lunch", "done", "manageable", "Separate daytime schedules", "We each took a portion before leaving.", "All three saved portions were eaten for lunch.")
report(s, 1, "fri-dinner", "done", "manageable", "Later Friday rehearsal", "We had longer before I left this week.", "We ate the wraps together without rushing.")
report(s, 1, "sun-dinner", "done", "manageable", "Sunday at home together", "Everyone happened to be in, so we cooked for three.", "The chickpea rice worked for an early dinner.")
report(s, 1, "wed-walk", "unknown", "unknown", "Wednesday rehearsal time changed", "I remember going out, but not whether I took the saved loop.", "I cannot give a definite check-in for this one.")
report(s, 1, "sat-walk", "done", "manageable", "Saturday morning free", "The soundcheck was later this week.", "I went out before lunch and enjoyed the seafront.")
request(s, "fri-dinner", "2026-09-13", "Our three visitors for 25 September have cancelled. Could that Friday dinner be for just the three flatmates?")
freeze(s, "mon-dinner", 3, "2026-09-05")
acquired(s, 2, [("chicken|g", "bought", 300), ("wraps|whole", "have", 6), ("pasta|g", "have", 300)])
acquired(s, 3, [("chicken|g", "unknown", 0)])
manual(s, "nolan-kitchen-roll", "Kitchen roll")


def validate(histories):
    """Check packet structure and references only; no application behaviour."""
    assert len(histories) == 8
    assert len({h["id"] for h in histories}) == 8
    allowed_allergens = {a for recipe in CATALOGUE.values() for a in recipe["allergens"]}
    allowed_ingredients = {f"{i['id']}|{i['unit']}" for recipe in CATALOGUE.values() for i in recipe["ingredients"]}
    expected_periods = {m.isoformat() for m in MONDAYS}
    summaries = []
    for history in histories:
        assert set(history) == {"id", "title", "background", "state", "memberFollowup"}
        state = history["state"]
        assert set(state) == set(TEMPLATE)
        assert state["schemaVersion"] == 1 and state["revision"] == 0
        assert state["setup"] is True and state["entitlement"] == {"active": True}
        assert state["clock"] == "2026-09-13" and state["anchor"] == "2026-08-30" and state["cycle"] == 2
        for key in ("measures", "reviews", "decisions", "operations"):
            assert state[key] == []
        assert state["review"] is None
        preferences = state["preferences"]
        assert set(preferences) == {"allergies", "diet", "equipment", "activityLimitations", "time", "household", "spending"}
        allergies = preferences["allergies"]
        assert allergies in ("none", "unknown") if isinstance(allergies, str) else set(allergies) <= allowed_allergens
        assert preferences["diet"] in ("any", "vegetarian", "unknown")
        assert isinstance(preferences["equipment"], list)
        assert all(isinstance(e, str) for e in preferences["equipment"])
        assert all(isinstance(preferences[k], str) and preferences[k] for k in ("activityLimitations", "time", "household", "spending"))
        assert set(history["memberFollowup"]) == {"preferredMealId", "reason"}
        assert history["memberFollowup"]["preferredMealId"] is None or history["memberFollowup"]["preferredMealId"] in CATALOGUE
        slots = state["slots"]
        by_id = {s["id"]: s for s in slots}
        assert len(by_id) == len(slots)
        by_period_key = {}
        week_counts = {p: 0 for p in expected_periods}
        reserved = {}
        for item in slots:
            date = dt.date.fromisoformat(item["date"])
            period = (date - dt.timedelta(days=date.weekday())).isoformat()
            assert period in expected_periods
            assert date.weekday() == DAY[item["slotKey"].split("-")[0]]
            assert item["id"] == f"{item['date']}:{item['slotKey']}"
            assert item["completed"] is False
            assert (period, item["slotKey"]) not in by_period_key
            by_period_key[(period, item["slotKey"])] = item
            week_counts[period] += 1
            base_keys = {"id", "date", "slotKey", "kind", "completed"}
            if item["kind"] == "meal":
                assert set(item) == base_keys | {"recipeId", "recipeVersion", "servings", "serveNow"}
                assert item["recipeId"] in CATALOGUE and item["recipeVersion"] == 1
                assert isinstance(item["servings"], int) and 1 <= item["servings"] <= 12
                assert isinstance(item["serveNow"], int) and 1 <= item["serveNow"] <= item["servings"]
            elif item["kind"] == "move":
                assert set(item) == base_keys | {"label", "minutes"}
                assert isinstance(item["minutes"], int) and item["minutes"] > 0 and item["label"]
            elif item["kind"] == "leftovers":
                assert set(item) == base_keys | {"servings", "sourceId"}
                source = by_id[item["sourceId"]]
                assert source["kind"] == "meal"
                assert source["date"] < item["date"]
                assert isinstance(item["servings"], int) and 1 <= item["servings"] <= 12
                reserved[source["id"]] = reserved.get(source["id"], 0) + item["servings"]
            else:
                raise AssertionError("Unrecognised kind")
        assert all(count > 0 for count in week_counts.values())
        for identifier, item in by_id.items():
            if item["kind"] == "meal":
                assert item["serveNow"] + reserved.get(identifier, 0) <= item["servings"]
        reported_keys = set()
        for r in state["reports"]:
            assert set(r) == {"slotKey", "kind", "period", "date", "shift", "status", "fit", "reason", "note"}
            key = (r["period"], r["slotKey"])
            assert key not in reported_keys
            reported_keys.add(key)
            source = by_period_key[key]
            assert r["date"] == source["date"] and r["kind"] == source["kind"]
            assert r["period"] in {m.isoformat() for m in MONDAYS[:2]}
            assert r["date"] <= state["clock"]
            assert r["status"] in {"done", "missed", "unknown"}
            assert r["fit"] in {"manageable", "did-not-fit", "unknown"}
            assert r["status"] == "done" or r["fit"] == "unknown"
            assert all(isinstance(r[k], str) and r[k] for k in ("shift", "reason", "note"))
        keys = {item["slotKey"] for item in slots}
        for req in state["requests"]:
            assert set(req) == {"slotKey", "date", "reason"}
            assert req["slotKey"] in keys
            assert dt.date.fromisoformat(req["date"]) <= dt.date.fromisoformat(state["clock"])
        for key, value in state["freezes"].items():
            assert key in keys and set(value) == {"throughCycle", "evidenceAt"}
            assert isinstance(value["throughCycle"], int) and value["throughCycle"] >= 0
            assert dt.date.fromisoformat(value["evidenceAt"]) <= dt.date.fromisoformat(state["clock"])
        shopping_periods = {f"{m.isoformat()}..{(m + dt.timedelta(days=6)).isoformat()}" for m in MONDAYS[2:]}
        for period, ingredients in state["acquired"].items():
            assert period in shopping_periods
            for key, value in ingredients.items():
                assert key in allowed_ingredients and set(value) == {"status", "quantity"}
                assert value["status"] in {"bought", "have", "unknown"}
                assert isinstance(value["quantity"], (int, float)) and value["quantity"] >= 0
                if value["status"] == "unknown":
                    assert value["quantity"] == 0
        assert len({item["id"] for item in state["manualItems"]}) == len(state["manualItems"])
        for item in state["manualItems"]:
            assert set(item) == {"id", "name", "period"}
            assert item["period"] in shopping_periods and item["id"] and item["name"]
        state["slots"].sort(key=lambda item: (item["date"], item["slotKey"]))
        state["reports"].sort(key=lambda item: (item["date"], item["slotKey"]))
        summaries.append(dict(id=history["id"], slots=len(slots), weeks=dict(sorted(week_counts.items())),
                              reports=len(state["reports"]), leftoverSlots=sum(s["kind"] == "leftovers" for s in slots),
                              requests=len(state["requests"]), freezes=len(state["freezes"])))
    return summaries


summary = validate(HISTORIES)
content = (json.dumps(HISTORIES, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
(HERE / "histories.json").write_bytes(content)
print(json.dumps({"output": str(HERE / "histories.json"), "sha256": hashlib.sha256(content).hexdigest(),
                  "validation": "Packet structure, dates, portion reservations, shopping units, and report-slot consistency only.",
                  "cases": summary}, indent=2))

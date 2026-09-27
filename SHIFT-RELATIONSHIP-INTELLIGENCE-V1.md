# Shift Relationship Intelligence V1

This build moves Shift beyond chat history into grounded relationship intelligence.

## What it now learns
- durable goals and preferences
- routines and motivators
- blockers and recurring patterns
- communication preferences
- repeated triggers/context
- strategies the member has said work
- approaches the member has said do not work
- meaningful wins

## Pattern threshold
Cross-conversation patterns require at least two separate pieces of user evidence and a confidence threshold before being stored. One bad day must not become a personality trait.

## Existing context already available to Shift
The member conversation engine already receives profile/member state, roadmap/decision state, recent progress entries, latest MOT/assessment, latest check-in, explicit member notes, intelligent memory and Shift Brain evidence. Relationship Intelligence uses that existing picture rather than creating a second member profile.

## Behavioural outcome
The intended chain is: remember -> notice pattern -> know what has worked -> choose the right conversational gear -> give one useful next move.

## Safety/privacy
Do not automatically store exact symptoms, diagnoses, medication details, clinical measurements, sexual details, finances, addresses, secrets or inferred sensitive attributes. Structured clinical/programme records remain separate from relationship memory.

## Cost design
The 70B model remains the conversation engine. Relationship/memory extraction uses the smaller model and pattern analysis only runs periodically rather than on every turn.

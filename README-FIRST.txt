SHIFT SOME TIMBER — SHIFT CORE V3.2B
====================================

WHAT THIS IS
------------
This ZIP is the complete first Cloudflare Worker API package for the D1 database you have already created.

It is designed around:
  Worker:   shift-core
  Domain:   https://api.shiftsometimber.co.uk
  D1:       shift-core-db
  Binding:  DB

It contains working foundations for:
- register / login / logout
- secure browser sessions
- member profiles
- My Why / Roadmap / treatment-finder state
- progress entries
- Health MOT / assessment storage
- check-ins
- consent records
- cases
- pharmacy orders
- pharmacy provider configuration
- pharmacy webhook receiver scaffold
- CRM people / notes / tasks / stats
- privacy export + deletion request
- audit log

IMPORTANT
---------
Do NOT try to paste this into Cloudflare on the iPhone today.
You have already done the database setup safely. The next deployment should be done from a laptop/desktop or a Git repository so we deploy the whole Worker cleanly in one go.

The Worker also runs a small idempotent schema check itself, so the few support tables it needs can be created automatically if missing.

SECRETS WE WILL ADD BEFORE ADMIN / PHARMACY TESTING
---------------------------------------------------
ADMIN_API_KEY
PHARMACY_WEBHOOK_SECRET

AUTO_VERIFY_EMAIL is deliberately TRUE for the controlled demo/testing phase because there is no email-delivery provider connected yet. It MUST be changed to false before a real public clinical launch.

FIRST TEST AFTER DEPLOYMENT
---------------------------
Open:
https://api.shiftsometimber.co.uk/health

Expected response resembles:
{"ok":true,"service":"Shift Core","version":"3.2B","database":"connected","users":0}

Then create one test account through the website/API and confirm the user appears in D1 / CRM.

PHARMACY NOTE
-------------
The pharmacy layer is intentionally provider-neutral. We can build and test Shift's side now. Once a pharmacy is chosen, we map their API, payloads, authentication and webhooks into this layer rather than rebuilding the platform around that pharmacy.

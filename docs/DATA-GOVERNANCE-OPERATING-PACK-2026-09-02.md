# Shift Some Timber — data-governance operating pack

Authority date: 2 September 2026  
Business owner: Matt O'Brien  
Status: owner-adopted pre-pharmacy baseline; not a claim of external legal certification.

## Data categories and retention

| Category | Working retention | Trigger | Disposal/control |
|---|---:|---|---|
| Account and security record | Account life + 6 years | Account closure | Delete direct profile data; retain narrow fraud/security evidence where lawful |
| Session and authentication telemetry | 90 days | Creation | Automatic expiry/deletion |
| Optional My Journey tracking | Until member deletion/withdrawal | Member request or account closure | Authenticated self-service erasure; remove photos and tracking rows atomically |
| Shift AI/Ask Timber operational memory | 90 days unless member removes sooner | Creation | Existing memory/privacy controls and member removal |
| Tap Room visible content | Until removed/account erasure | Member/moderator action | Anonymise or remove content subject to safety/audit need |
| Tap Room moderation audit | 24 months | Moderation action | Restricted access, then deletion unless an active legal/safeguarding hold applies |
| Analytics event data | 14 months | Event date | GA4 property retention; no health/free-text payloads |
| Support and complaints | 6 years after closure | Case closure | Restricted archive, then deletion |
| Orders, payments and tax records | 6 years | Transaction/financial year | Applies only after commercial activation |
| Clinical/prescribing/dispensing records | **Partner to define** | Appointment of regulated provider | Must follow provider/legal obligations; not governed by the optional tracking erasure rule |
| Evidence/claims approval ledger | 6 years after supersession | Decision superseded | Retain source digest, decision, reviewer and publication history |

## DPIA decision record

High-risk processing exists because optional health and wellbeing tracking, AI-assisted support and community content may reveal special-category data. Controls include explicit choice, data minimisation, member isolation, fail-closed clinical language, human escalation, deletion routes, short AI retention, analytics filtering, audit logging and kill switches.

The pre-pharmacy residual risk is acceptable only while medicine sales, prescribing, clinical decision-making and provider data exchange remain disabled. The DPIA must be reopened before: live treatment sales, a new clinical/pharmacy processor, new automated clinical inference, material international transfer, or materially expanded health-data use.

## ROPA summary

| Activity | Purpose | Lawful-basis position | Data subjects | Recipients/processors | Status |
|---|---|---|---|---|---|
| Account/security | Provide and secure membership | Contract; legitimate interests for security | Members | Cloud infrastructure/email providers | Active |
| Optional Journey tracking | Member-requested private progress support | Explicit consent for special-category data | Members | Cloud infrastructure | Active, optional |
| Ask Timber/Shift AI | Practical non-clinical support | Contract/consent depending on feature; explicit controls for volunteered health content | Members | Cloud/AI infrastructure | Controlled |
| Tap Room | Private community and safety | Contract; legitimate interests; explicit choice where sensitive data is volunteered | Members | Cloud/email infrastructure | Controlled |
| Analytics | Operate and improve service | Consent for non-essential analytics | Visitors/members | Google Analytics | Active, consent-gated |
| Treatment commerce | Assessment, payment, prescribing and dispensing | **Partner/legal determination required** | Prospective patients | Stripe and appointed regulated providers | Disabled |

## Processor register baseline

| Processor | Purpose | Data allowed | Required verification before expansion |
|---|---|---|---|
| Cloudflare | Hosting, Worker, D1, security and delivery | Account, member feature and operational data | Current DPA, region/transfer terms, access controls |
| Stripe | Test checkout and future payments | Payment/customer identifiers; never raw card details in Shift systems | Business verification, live keys, DPA and partner journey |
| Google Analytics | Consent-gated aggregate product analytics | Allow-listed non-health events only | Property retention, consent mode, account linkage |
| Transactional email provider | Verification, recovery, alerts and operational email | Minimum address/message metadata | DPA, region, suppression and deletion process |
| Cloud/AI model providers used by Shift AI/Shift Me | Controlled text/image inference | Minimum necessary prompt/image; no uncontrolled reuse | Contract terms, retention, region and deletion controls |
| Future pharmacy/prescriber/dispensing provider | Regulated assessment and fulfilment | Partner-defined clinical/order data | Contract, controller/processor roles, DPA, clinical retention and incident route |

## Rights and incidents

- Access, correction, portability, objection, restriction, withdrawal and erasure requests route through Contact/Privacy and are identity-verified.
- Optional tracking erasure must not imply deletion of legally required future clinical or financial records.
- Suspected personal-data incidents are logged immediately, contained, assessed for ICO/data-subject notification and reviewed after closure.
- Processor, purpose, international-transfer and retention changes require a register update before deployment.

## Approval boundary

This pack records Matt O'Brien's operating baseline. A competent UK privacy/legal review remains advisable before commercial clinical launch, and the regulated provider must approve the clinical-record boundary.

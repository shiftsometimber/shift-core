# Our Causes & Partners — private build

Owner direction, 23 October 2026: build the approved “Life is bigger than the scales” design across the proposed causes page, Timber Shed and My Timber. Keep public entry points greyed out like The Timber Shed.

Open `index.html` locally to review all three surfaces. It is standalone, responsive and has no tracking, storage, forms, payments or member records. Topic filters, organisation details, support journeys and the menu preview work offline. External website links require internet access.

This folder is deliberately outside `frontend/member`, the Worker asset directory. It is not routed or deployed as a public support page. The production-only change is `causes-partners-teaser.mjs`, composed after the existing Timber Shed and canonical footer wrappers. It adds disabled labels to the drawer/footer and recognised member menu markup, without a destination. A member surface that does not use that markup remains unchanged.

## Current status

All seven introductory approaches were sent/submitted by Matt on 23 October 2026. No partnership, endorsement, logo permission, service integration or financial commitment is agreed. Cards use names only. Mind and WithYou coverage is described explicitly; the shortlist is not represented as complete coverage for every UK nation.

## Activation

Activation requires separate owner instruction. Verify each organisation’s current support routes and service coverage; agree any partnership claims and permissions before publishing them. Do not expose the internal “prospective contact” status publicly. Keep specialist signposting distinct from any commercial partner, fundraising or sales activity. No automated referrals, sharing of member data, clinical advice or emergency response are implemented.

## Placement

- Public menu and Support footer column: disabled “Our Causes & Partners”.
- Main page: five areas, six specialist organisations, separate MAN v FAT commercial card, proposed awareness/community section and founder note.
- Timber Shed: proposed pinned Find support panel and awareness area, demonstrated in the private preview only.
- My Timber: proposed More → Find support panel and family/friends route, demonstrated in the private preview only.
- Relevant Health pages: future contextual support links, pending activation; no existing help links removed.

## Public activation — 23 October 2026

Matt approved publishing the reset design and then instructed “Get it live please”. The public route is `/our-causes-partners`, built from the approved causes surface with the canonical header/footer. Internal preview controls, outreach statuses and private integration mock-ups are excluded. The menu/footer label is now an active link. Timber Shed and My Timber integrations stay private. No partnership is claimed; no clinical referrals, member-data sharing, fundraising or transactions are enabled.

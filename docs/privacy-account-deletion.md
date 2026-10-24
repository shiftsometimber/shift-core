# Immediate member account deletion

Confirming **Delete my account now** closes the member account immediately. It is not an HQ approval request. The authenticated DELETE endpoint requires the explicit `DELETE_MY_ACCOUNT` confirmation and returns HTTP 200 with `status: deleted` only after its transaction succeeds.

The transaction disables the member credentials, invalidates all reset/verification tokens, revokes every current member session, marks the membership closed, removes the listed optional tracking, plans, food, AI memory/history, photos, device imports and reminder subscriptions, withdraws optional consents as new consent events, removes pending signup alerts and cancels queued member communications. It records completion directly and does not create a review task or send an email. A failed database statement rolls the operation back and cannot return success.

A non-loginable authentication tombstone prevents an orphaned account being restored into its old records by ordinary registration. Password reset, email verification and password changes cannot reopen that tombstone, including requests already in progress. Other members and HQ administrator accounts are unaffected.

Account access ends immediately even where existing clinical, order, support, safeguarding or audit records are retained under the established retention policy. Ordinary account identity is automatically anonymised where no listed retained record needs it. Clinical/order records and reported safeguarding evidence are not erased by this member-account operation. Completed deletion entries refer to closure and the specified automatic erasure, not a claim that every retained record or third-party processor copy has been erased.

The member sees **Account deleted**, the immediate sign-out result and a link back to My Timber. No success panel is placed inside a collapsible settings section. Unconfirmed responses show an uncertainty message without claiming deletion or encouraging an automatic destructive replay.

Privacy retention and processor obligations remain operational responsibilities. They do not delay account closure or require an ordinary member to wait for an HQ approval.

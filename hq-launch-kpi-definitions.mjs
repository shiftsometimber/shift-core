// Original 24-KPI framework; definitions retained from the existing launch workbook.
export const launchKpiDefinitions=[
  {
    "id": "K01",
    "name": "HQ owner MFA coverage",
    "definition": "Active owners with MFA enabled / all active owners",
    "window": "Current snapshot",
    "unit": "%",
    "source": "hq_users; count only, no secrets"
  },
  {
    "id": "K02",
    "name": "Unassigned open tasks",
    "definition": "Open tasks with no assigned owner",
    "window": "Current snapshot",
    "unit": "count",
    "source": "hq_tasks"
  },
  {
    "id": "K03",
    "name": "Overdue open tasks",
    "definition": "Open tasks past their due time; show oldest age",
    "window": "Current snapshot",
    "unit": "count",
    "source": "hq_tasks"
  },
  {
    "id": "K04",
    "name": "Classified reporting population",
    "definition": "Explicitly classified real/test/staff accounts / retained accounts",
    "window": "Current snapshot",
    "unit": "%",
    "source": "users + new explicit environment/classification register"
  },
  {
    "id": "K05",
    "name": "Verified new real members",
    "definition": "Distinct verified real members created in selected period",
    "window": "London calendar period",
    "unit": "count",
    "source": "users + user_auth + classification"
  },
  {
    "id": "K06",
    "name": "First-week useful step",
    "definition": "Eligible first-Today members reporting at least one helpful saved episode in days 1–7 / eligible first-Today members",
    "window": "Mature first-Today cohort",
    "unit": "%",
    "source": "continuity-measurement/scorecard.mjs"
  },
  {
    "id": "K07",
    "name": "Week-4 return",
    "definition": "Eligible first-Today members completing a meaningful retained action in days 22–28 / cohort with full day 28 ended",
    "window": "Mature first-Today cohort",
    "unit": "%",
    "source": "continuity first-Today scorecard"
  },
  {
    "id": "K08",
    "name": "Helpful episode rate",
    "definition": "Episodes whose latest valid answer is helped / episodes with an answered outcome",
    "window": "Episode-delivery cohort",
    "unit": "%",
    "source": "retained linked help episodes"
  },
  {
    "id": "K09",
    "name": "Feedback coverage",
    "definition": "Eligible saved help episodes with a valid answer / all eligible episodes",
    "window": "Episode-delivery cohort",
    "unit": "%",
    "source": "continuity scorecard feedbackCoverage"
  },
  {
    "id": "K10",
    "name": "Paid live orders by channel",
    "definition": "Distinct successful live orders, separate shop/medicine/service channels",
    "window": "Payment-success period",
    "unit": "count",
    "source": "orders + medicine_orders + payment ledger"
  },
  {
    "id": "K11",
    "name": "Net revenue",
    "definition": "Recognised revenue on agreed seller basis less recognised refunds; exclude VAT where applicable",
    "window": "Accounting period",
    "unit": "GBP",
    "source": "payment, refund and revenue ledger required"
  },
  {
    "id": "K12",
    "name": "Contribution per order",
    "definition": "Net revenue less provider/prescribing/dispensing or product cost, payment fees, fulfilment, shipping and variable support cost",
    "window": "Order cohort / accounting period",
    "unit": "GBP",
    "source": "order cost snapshots + supplier terms + fees"
  },
  {
    "id": "K13",
    "name": "Unreconciled payments/refunds",
    "definition": "Provider movements lacking exactly one matched order/refund reference; separate unsettled from missing",
    "window": "Current snapshot + settlement date",
    "unit": "count / GBP",
    "source": "Stripe/provider ledger + channel order fact"
  },
  {
    "id": "K14",
    "name": "Orders waiting by stage and age",
    "definition": "Orders in each agreed state with owner, entered-at time and oldest age",
    "window": "Current snapshot",
    "unit": "count / hours",
    "source": "versioned order/case events + provider receipts"
  },
  {
    "id": "K15",
    "name": "First-to-repeat conversion",
    "definition": "First purchasers with a second completed live order within agreed service-specific window / first purchasers whose window has ended",
    "window": "Mature first-paid-order cohort",
    "unit": "%",
    "source": "live channel order facts; exclude refunds/test orders"
  },
  {
    "id": "K16",
    "name": "First human response time",
    "definition": "Business-hours elapsed from genuine inbound request to first substantive human reply; report median and p90",
    "window": "Tickets opened in period",
    "unit": "hours",
    "source": "ticket received/reply events + staffed-hours calendar"
  },
  {
    "id": "K17",
    "name": "Member-confirmed resolution",
    "definition": "Eligible closed coaching requests whose latest reply is explicitly confirmed helpful/resolved by member / eligible closed requests",
    "window": "Closed-request cohort",
    "unit": "%",
    "source": "existing coaching thread confirmation + support_tickets"
  },
  {
    "id": "K18",
    "name": "Event-to-action coverage",
    "definition": "Expected scoped event IDs with the required HQ task/draft or reasoned suppression / all expected scoped events",
    "window": "Rolling 24 hours",
    "unit": "%",
    "source": "domain events + transactional outbox required"
  },
  {
    "id": "K19",
    "name": "Provider-accepted email rate",
    "definition": "Approved eligible recipient attempts with a real provider ID / all terminal attempted recipients; show failed and unknown separately",
    "window": "Rolling 24 hours / 7 days",
    "unit": "%",
    "source": "unified delivery register across direct and HQ sends"
  },
  {
    "id": "K20",
    "name": "Inbox receipt acceptance coverage",
    "definition": "Trigger/template test cases with matching controlled inbox evidence / all required launch notification test cases",
    "window": "Launch acceptance set",
    "unit": "%",
    "source": "approved draft + provider ID + redacted received message"
  },
  {
    "id": "K21",
    "name": "Unprocessed/failed integration events",
    "definition": "Callback events awaiting processing, failed or uncertain, by partner and oldest age",
    "window": "Current snapshot",
    "unit": "count / minutes",
    "source": "integration_webhooks + provider-specific receipts"
  },
  {
    "id": "K22",
    "name": "Scheduler freshness",
    "definition": "Elapsed time since last successful completion, by service/job; distinguish invocation and completion",
    "window": "Current snapshot",
    "unit": "minutes",
    "source": "persisted scheduler heartbeat required"
  },
  {
    "id": "K23",
    "name": "Unlinked channel orders",
    "definition": "Channel order rows missing their required account/payment/partner relationship",
    "window": "Current snapshot",
    "unit": "count",
    "source": "orders + users + medicine_orders + pharmacy_orders"
  },
  {
    "id": "K24",
    "name": "Recovery drill age",
    "definition": "Days since successful isolated restore and business-journey verification",
    "window": "Current snapshot",
    "unit": "days",
    "source": "backup/restore drill evidence"
  }
];

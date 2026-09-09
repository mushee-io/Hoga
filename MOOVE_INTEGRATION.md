# Moove integration

Hoga treats Moove as the settlement layer and keeps its own order, quote, and fulfillment records. Every payment record stores provider, mode, reference, amount, currency, status, timestamps, and a transaction reference when available.

## AVAILABLE

`MOOVE_MODE=demo` is fully usable. A demo payment request creates a persistent payment record. The authenticated customer explicitly confirms the simulation. Hoga then transitions the order to `PAID` and starts fulfillment. Every relevant screen states: **Demo payment — no real funds moved.**

`MOOVE_MODE=live` intentionally refuses payment creation. Hoga does not guess undocumented endpoints or mark a redirected customer as paid.

The available adapter architecture keeps provider behavior in `src/lib/payments.ts`; quotes, orders, payment records, settlement state, fulfillment, and receipts stay in Hoga. The settlement state model is `PENDING`, `CONFIRMED`, `FAILED`, and `REFUNDED`. Demo confirmation is a server-side authenticated action and cannot be triggered by changing browser state.

Live-mode guardrails are deliberate: no guessed endpoint, no client-side confirmation, no redirect-as-payment-proof, and no simulated transaction described as live.

## REQUIRED FROM MOOVE

Hoga needs all of the following before live mode can be enabled:

- Official authentication method and production API base URL
- Payment-creation endpoint and request/response schema
- Payment-status or settlement-verification mechanism
- Webhook/event specification and webhook-signature verification
- Idempotency requirements
- Transaction-reference/hash format
- Refund and cancellation capabilities, if supported
- Production API credentials

Once available, the adapter is the sole integration boundary. A controlled real transaction must be recorded with its Hoga order ID, Moove reference, payment status, amount, currency, timestamps, and transaction reference before live mode is called complete.

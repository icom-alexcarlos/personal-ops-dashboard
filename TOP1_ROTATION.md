# Top-1 Rotation — Plan

**Source:** r/Daytrading post by u/Jeblitzky, "Simple way to beat the market by 2X
(18.53% Annualy)" (~mid-June 2026; shared by Alex 2026-09-01 as screenshots and
transcribed here). Original share link: reddit.com/r/Daytrading/s/tmFS19MGqK
**Status:** PLANNED — $0 capital committed. Phase 0 (verification) not started.
**Execution machinery:** all order flow, guardrails, and journaling follow
ROBINHOOD_AGENTIC.md; this document only defines the strategy and its gates.

---

## The Rule (as posted)

> "I just buy the #1 largest company by market cap and rotate everything into
> the new #1 the month it gets dethroned. Every month on the 1st you check
> which is no.1 and switch when its no longer no.1"

And the OP's own edit, which is load-bearing:

> "EDIT: The data I have compiled is unreliable and may clash with the truth!
> I and others can not find reliable month to month data. DO YOUR OWN RESEARCH!"

Claimed result: $10k → $32.3M from Jan 1980 to June 2026 (18.53%/yr) vs
$694.9k (~9.3%/yr) for the S&P 500. Claimed position sequence: IBM → XOM → GE
→ MSFT → GE → MSFT → GE → XOM → AAPL → GOOGL → AMZN → AAPL → MSFT → AAPL →
NVDA → AAPL → MSFT → NVDA.

## What This Is (and Is Not)

- A **monthly, single-position, full-concentration momentum rotation**. One
  decision per month. Despite where it was posted, it is not day trading — no
  intraday activity, no PDT interaction, near-zero time cost.
- It is a **bet that mega-cap dominance persists** — that the #1 company keeps
  being a good hold *while* it is #1. That was terrible in some eras (GE's
  −38.61% leg is in the OP's own table) and spectacular in the 2015–2026
  mega-cap era. Adopting it = betting the second regime continues.
- It is **not a verified 18.53% CAGR**. See the next section.
- 100% in one stock means **index-crushing drawdowns are part of the design**
  (NVDA fell ~66% in 2022; GE lost most of its value 2000–2009 while spending
  years at or near #1).

## Why the Backtest Cannot Be Taken at Face Value

1. **The OP says so** — the edit above disavows the month-to-month data.
2. **Internal inconsistencies.** The table shows +46.35% for a GOOGL leg and
   +175.68% for an AMZN leg, but Alphabet's and Amazon's documented stints at
   #1 (Feb 2016; early 2019) were days-to-weeks long. At monthly checks,
   single-leg returns of that size don't cohere with those tenures. Verify in
   Phase 0.
3. **Dividends are excluded on both sides.** The S&P figure shown (~9.3%
   since 1980) is a price-only number; total return with dividends is roughly
   11.5–12%/yr, i.e. the benchmark shown understates reality by a factor of
   ~2–3x in final dollars. The strategy legs (IBM, XOM, GE — fat-dividend
   decades) are also understated. Both numbers move; the gap almost certainly
   shrinks.
4. **Published research leans the other way for most of history.** The
   best-known study of this exact question (Research Affiliates, "Too Big to
   Succeed," 2010) found the #1-by-market-cap company *underperformed* the
   average large-cap by a wide margin over the following decade, across
   1952–2009. The counterevidence is simply the last decade of mega-cap tech.
   Both belong in the Phase 0 write-up.
5. **Taxes.** The OP again: "Taxes would absolutely destroy these gains in
   real life." Every rotation is a full realization; frequent 2024–26-style
   #1 flips would be short-term gains at ordinary rates in a taxable account.

None of this means "never." It means the honest version of adopting this is
either (a) Phase 0 verification produces numbers you'd still want, or (b) you
knowingly take it as a forward-looking momentum bet without backtest support —
written down as such.

## Where It Fits the Existing Framework

Per the Trading & Portfolio Framework (Notion, v2.0 2026-08-11):

- **Not Sleeve A** — nothing intraday, no skill ladder involved.
- **Incompatible with Sleeve B doctrine** — Sleeve B caps any single stock at
  10% of core and forbids timing; this strategy is 100% one stock, timed
  monthly. It must not contaminate the DCA core.
- Therefore, if adopted, it becomes a **separate, capped experimental sleeve**
  with its own capital allocation, created by an explicit logged decision (the
  framework's rule: capital never migrates between sleeves silently).
- **Account location is a real decision.** Roth IRA removes the tax problem
  entirely but concentrates retirement money in one volatile stock — if used
  at all, cap the slice; the rest of the Roth stays boring. Taxable keeps
  retirement money safe but pays the churn tax — reserve estimated tax on
  every realized gain. Worksheet decision; no default is offered here on
  purpose.

## State as of 2026-08-31 (live data, close)

| Rank | Company | Market cap |
|---|---|---|
| 1 | NVDA | $5.43T |
| 2 | AAPL | $4.63T |
| 3 | GOOGL | $4.15T |
| 4 | MSFT | $3.77T |
| 5 | AMZN | $2.80T |
| watch | AVGO | $1.76T |
| watch | META | $1.46T |

Under the rule, today's position is **NVDA**, and #2 trails by ~15% — no flip
imminent at monthly cadence. (2024–26 saw repeated NVDA/MSFT/AAPL lead
changes; spread this wide is recent.)

## The Rule, Codified (defaults; worksheet overrides)

- **Universe:** US-listed common stock, whole-company market cap (all share
  classes; trade the liquid class, e.g. GOOGL). Excludes private companies
  (SpaceX until listed), foreign-listed (Aramco), OTC.
- **Check:** first trading day of each month, pre-market, using prior-close
  market caps from `get_equity_fundamentals` over the candidate set.
- **Candidate set:** top 5 above + watch names; quarterly review adds any
  company crossing 75% of #2's cap; new mega-IPOs join when listed.
- **Switch rule (pure, per the post):** if the held name is not #1 at the
  check, rotate fully. **Variant (worksheet):** hysteresis buffer — switch
  only if the challenger exceeds the holding by ≥3% — cuts whipsaw and tax
  churn at the cost of fidelity to the source. Shadow phase measures both.
- **Execution when live:** ROBINHOOD_AGENTIC.md Phase C flow exactly — ticket
  → approve → tax-lot check (`get_equity_tax_lots`) → `review_equity_order` →
  confirm → `place_equity_order` (limit, regular hours) → journal. Sell leg
  first, buy leg after fill.

## Phases

**Phase 0 — Verify the premise ($0, one or two sessions).** Rebuild the #1
timeline 1980→present from reliable sources; recompute both legs with
dividends; compare against S&P total return; check the two suspect legs
(GOOGL, AMZN). Write the result up in this file. **Gate:** proceed only on
outcome (a) or (b) from the skepticism section — otherwise archive.

**Phase 1 — Shadow ($0, ≥3 months).** A monthly routine (first trading day,
read-only, per ROBINHOOD_AGENTIC.md Section 9) runs the check, logs what it
would do, and counts hypothetical switches, spread cost, and simulated tax
drag under both pure and hysteresis rules. **Gate:** you still want it after
seeing the churn, and the location + slice decisions are written in the
worksheet.

**Phase 2 — Capped live (optional).** A fixed experiment slice — default
suggestion ≤5% of investable assets, never emergency funds, never Sleeve B/C
capital — executed monthly through the approval flow. Not eligible to grow by
new contribution until 12 clean months; rebalance-out rules per worksheet.

**Kill criteria:** Phase 0 fails → archive with the write-up kept. Shadow
shows >4 switches/yr under the pure rule → hysteresis variant or archive.
Live: any guardrail violation, or drawdown beyond the worksheet number →
back to shadow.

## Worksheet (fill in DECISIONS.md when decided)

| Decision | Answer |
|---|---|
| Adopt after Phase 0? (a) verified / (b) forward bet / archive | _____ |
| Hysteresis: pure rule vs ≥3% buffer | _____ |
| Account location (taxable + tax reserve vs capped Roth slice) | _____ |
| Slice size (default ≤5% investable) | _____ |
| Drawdown kill number for live phase | _____ |
| Phase 1 start / Phase 2 earliest date | _____ |

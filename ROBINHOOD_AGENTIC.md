# Robinhood Agentic — Planning and Execution Guide

Companion to SCOPE.md. That document scoped the dashboard; this one scopes the next
thing: connecting your existing trading research practice (SPY levels, EMA trend
rules, VWAP, H1/H2 pullback grammar, the long-entry checklist) to Claude sessions
that have the Robinhood MCP connector attached, so the research runs itself and you
only make the decisions that actually need a human.

Read it top to bottom once, then work the phases in order. Like SCOPE.md, this is
written so future-you can pick it up cold.

---

## What This Is

- A step-by-step plan to go from "the Robinhood connector works" to a disciplined
  agentic research-and-execution workflow you actually trust
- An extension of the trading system you already run on paper — the agent applies
  *your* written checklist; it does not invent a strategy
- Human-in-the-loop by design: the agent reads, screens, drafts, and journals; a
  human approves anything that touches money, every time, at every phase
- A thin dashboard integration at the end (trade journal + Today card), reusing the
  capture-token pattern you already built in Phase 2

## What This Is NOT

- **Not an autonomous trading bot.** There is no phase, ever, where an unattended
  loop places orders. That configuration is explicitly out of scope — see Section 2.
- **Not a strategy.** If the playbook file is empty, the agent has nothing to do.
- **Not a money machine.** The expected value here is discipline, coverage, and
  saved time — pre-market prep in minutes instead of an hour, a journal that never
  skips a day, a checklist applied without mood. It is not the model predicting
  prices. Claude is a research assistant, not an edge.
- **Not financial advice.** It's plumbing for your own decisions.

---

## Section 1: Ground Rules Before Any Planning

### 1.1 The Capital Gate

Your own finance notes already state the rule: reconcile cash needs against card
balances and loan obligations *before* committing trading capital. Honor that here.

- **Active-trading capital** is money that can go to zero without touching rent,
  minimum payments, or the emergency buffer. Compute the number honestly before
  Phase C, and write it in Appendix A.
- If that number is currently $0, run Phases A and B anyway. They cost nothing,
  they're most of the value (research + journaling + discipline data), and they
  leave you ready for Phase C when the number changes.

### 1.2 Account Scope

- Run `get_accounts` in a Claude session and list every account the connector can
  see. Designate **one** taxable brokerage account as the agent's scope and record
  it in Appendix A.
- **The Roth IRA is out of scope for trading.** The agent may read it for
  net-worth context in a weekly review, but it never proposes or places trades in
  it. Retirement money stays boring on purpose.

### 1.3 Security Hygiene

- 2FA on the Robinhood account itself.
- Know where the connector is attached (claude.ai, desktop, Claude Code) and
  review it like any other connected app during your periodic security pass.
- If a session ever behaves oddly around auth, stop and re-authenticate the
  connector; don't retry order calls blindly.
- Revoke the connector during any long period you're not using it.

---

## Section 2: The Operating Model

Three operating levels. You will run all three eventually; they are cumulative,
not alternatives.

| Level | Name | What the agent does | What it never does |
|---|---|---|---|
| L0 | Analyst | Reads portfolio, quotes, history, scans; produces briefs and reviews | Anything with a side effect |
| L1 | Copilot | Everything in L0, plus drafts trade tickets and — after your explicit in-session approval — places the approved order | Place, modify, or cancel anything without a fresh human "yes" in that same session |
| L2 | Standing routines | Scheduled read-only runs (morning brief, weekly review) that end in a notification | Anything with a side effect; scheduled runs are L0 by construction |

**There is no L3.** An unattended loop with order-placement tools is the one
configuration this guide exists to prevent. The reasons are boring and decisive:
model errors are low-probability but uncapped in cost, markets punish latency and
edge cases in ways a text model can't perceive, and nobody is watching. If you
ever feel tempted, re-read the journal from Phase B and count the tickets you
declined for good reasons the agent didn't have.

The rollout maps levels to phases: Phase A runs L0, Phases B–C run L1, Phase D
adds L2 alongside.

---

## Section 3: Non-Negotiable Guardrails

These are the rules of the system, not suggestions. They go at the top of the
playbook file, and every trading session starts by having the agent restate them.
Numbers marked *(worksheet)* are defaults until you set real ones in Appendix A.

1. **Propose, then approve.** Every order is drafted as a ticket, run through
   `review_equity_order`, and shown to you. Nothing is placed until you approve
   that specific ticket in that same session. Approval of one ticket approves
   nothing else.
2. **Limit orders only.** No market orders, ever, and nothing outside regular
   market hours.
3. **Risk cap per trade:** max 1% of the scoped account at the planned stop
   *(worksheet)*. Position size is derived from the stop distance, not vibes.
4. **Position cap:** max 5% of the scoped account in any single name *(worksheet)*.
5. **Daily circuit breaker:** after a down day of −2% of account or two stopped-out
   trades *(worksheet)*, no new tickets until the next session.
6. **Equities only.** The options tools stay unused in every phase of this guide.
   Options analysis (chains, IV context) is permitted read-only; option *orders*
   require a future re-scope with its own worksheet. Crypto is not in scope.
7. **No averaging down.** Adding to a loser requires a human decision made outside
   the session, written into the journal first.
8. **The IRA is untouchable** (Section 1.2).
9. **Numbers come from tools, not memory.** Any price, level, or position size the
   agent cites must come from a tool call made in that session, with its timestamp.
   If the agent can't fetch it, it says so instead of estimating.
10. **Everything is journaled.** Every ticket (taken or passed), every fill, every
    guardrail violation. An unjournaled trade is a violation by itself.

Enforcement beats intention: where the surface allows tool-level permissions (in
Claude Code, permission deny rules on the connector's order tools), keep
`place_equity_order`, `cancel_equity_order`, and both option-order tools denied by
default, and lift the deny only inside a live Phase C session you're actively
watching. On surfaces without per-tool control, Rule 1 still holds — but prefer
the surface where the rail is mechanical.

---

## Section 4: What the Agent Can Touch

The connector's tools, mapped to jobs. This is the agent's entire world; if a job
isn't served by a tool here, the agent reports the gap instead of improvising.

| Job | Tools |
|---|---|
| Account state | `get_accounts`, `get_portfolio`, `get_equity_positions`, `get_equity_orders`, `get_pnl_trade_history`, `get_realized_pnl`, `get_equity_tax_lots` |
| Market context | `get_index_quotes`, `get_index_historicals`, `get_equity_quotes`, `get_equity_historicals`, `get_equity_price_book`, `get_equity_technical_indicators` |
| Discovery & screening | `get_scanner_filter_specs`, `create_scan`, `run_scan`, `get_scans`, `search`, `get_equity_fundamentals`, `get_earnings_calendar`, `get_earnings_results` |
| Watchlists | `get_watchlists`, `get_watchlist_items`, `create_watchlist`, `add_to_watchlist`, `remove_from_watchlist`, `update_watchlist` |
| Execution (Phase C only, approval-gated) | `review_equity_order` → `place_equity_order`; `cancel_equity_order`; `get_equity_tradability` before drafting |
| Out of scope (Rule 6) | `place_option_order`, `exercise_option`, and the rest of the option-order surface |

---

## Section 5: Codify the Playbook

The single highest-leverage step in this guide. Your checklist currently lives in
notes and in your head; the agent needs it as a file it reads at the start of
every session.

Create `playbook/long-setups.md` in this repo (git-ignored if you prefer it
private — see note at the end of this section). Skeleton to fill in with your
actual criteria:

```markdown
# Playbook — Long Setups (v1)

## Guardrails
(Paste Section 3 rules 1–10 here, with worksheet numbers filled in.)

## Market filter
- Trade long setups only when SPY is above <your EMA rule> on <your timeframe>.
- No new entries in the first <N> minutes after the open.
- No entries within <N> days of the ticker's earnings date (check the calendar).

## Trend definition
- Uptrend: <your EMA stack / higher-high, higher-low rule>.
- Note position relative to VWAP: <your rule>.

## Entry grammar
- H1: <definition and when it's acceptable>.
- H2: <definition — typically the preferred pullback entry>.
- L1/L2: <definitions — context for shorts/avoids, if you trade them at all>.
- Confirmation required: <bar close / volume / level reclaim — your criteria>.

## Levels
- Respect pre-marked SPY levels: <where these live / how they're supplied>.
- Do not chase an entry into a marked resistance level closer than <X>.

## Risk plan (mandatory per ticket)
- Stop: <structure-based rule, e.g., below the pullback low>.
- Target: <rule>, minimum reward:risk <R>.
- Size: from Rule 3, never from conviction.

## Explicit non-setups
- <List the trades you historically regret: chases, mid-range entries,
  counter-trend H1s, entries into earnings, etc.>
```

Two rules about the playbook itself:

- **The agent flags matches; it does not freelance.** If a chart is interesting
  but matches no written setup, the correct agent output is "no setup," full stop.
  If that keeps happening on trades you wish you'd taken, that's a playbook edit
  (made by you, at a weekly review) — not an in-session improvisation.
- **Version it.** Date every edit. Phase B stats are only meaningful against a
  playbook that held still while they accumulated.

Privacy note: this repo is private, but if you'd rather keep entry criteria out of
git entirely, keep the file local, add `playbook/` to `.gitignore`, and paste its
contents into sessions manually. Decide in Appendix A.

---

## Section 6: Phase A — Read-Only Analyst (Week 1)

**Level:** L0. **Cost of failure:** zero. **Goal:** trust the agent's reading of
your account and your market before letting it draft anything.

Daily routine, run in a Claude session with the connector attached (Appendix B has
the paste-able prompts):

1. **Morning brief (pre-market, ~5 min).** Index context (SPY/QQQ vs your marked
   levels and trend filter), open positions with overnight moves, today's earnings
   landmines for anything held or watched, watchlist triage against the playbook's
   market filter. Ends with: "playbook says trade / playbook says stand aside."
2. **EOD review (~5 min).** What the positions did, what the watchlist did vs the
   morning read, realized P&L if anything closed, one paragraph of journal.

During the week, also have the agent rebuild your watchlist workflow natively:
recreate your standing screens with `create_scan` / `run_scan`, and consolidate
watchlists so the morning brief has a stable universe (~20 names max).

**Spot-check discipline:** at least twice this week, verify a handful of the
agent's cited numbers against the Robinhood app directly. You're auditing the
pipeline (tool data → agent prose), not the market.

**Exit criteria for Phase A** (all must hold):
- [ ] Five consecutive session days of briefs with zero fabricated or stale
      numbers on spot-check
- [ ] Scans and watchlists reproduce your manual pre-market universe
- [ ] The playbook file exists, is versioned, and the agent applies its market
      filter correctly (including "stand aside" days)

---

## Section 7: Phase B — Paper Tickets (Weeks 2–3)

**Level:** L1, minus execution. **Goal:** generate the dataset that decides
whether Phase C happens at all.

The unit of work is the **trade ticket**. When — and only when — playbook criteria
are met, the agent drafts:

```
TICKET <date>-<n>   <SYMBOL>  LONG
Setup:      <playbook setup name, e.g. "H2 pullback in uptrend">
Thesis:     <two sentences max, referencing the specific criteria met>
Entry:      <limit price>       (quote: <price> @ <timestamp>)
Stop:       <price> (<structure it sits under>)
Target:     <price>             R:R = <n>
Size:       <shares> (risk $<x> = <y>% of account per Rule 3)
Invalid if: <what kills the idea before entry — level lost, time, gap>
Earnings:   <date, and confirmation it clears the playbook window>
Expires:    <when the ticket dies if not triggered>
```

You respond **take** (on paper) or **pass** (with a one-line reason). Either way
it goes in the journal. Paper-taken tickets get resolved at EOD against actual
prices: stopped, target hit, expired, or still open.

Rules for this phase:

- Cap tickets at 3/day *(worksheet)*. Tickets are cheap to generate; over-trading
  on paper builds the exact habit you don't want live.
- "No setup today" is a successful session, and gets journaled as one.
- Your **pass reasons are the most valuable data in the system** — they're the
  gap between the written playbook and your actual judgment. Feed them into
  weekly-review playbook edits.

**Exit criteria for Phase B** (all must hold before Phase C):
- [ ] ≥ 15 tickets resolved on paper
- [ ] Expectancy of taken-on-paper tickets is positive, or you can articulate
      exactly why the sample says otherwise and what changed
- [ ] Zero guardrail violations across both weeks (including journaling lapses)
- [ ] The Section 1.1 capital-gate number is written down and > $0
- [ ] PDT status confirmed (Section 12) and compatible with the intended cadence

If Phase B's numbers don't clear the bar, stay in Phase B or stop. **Stopping at
Phase B permanently is a legitimate outcome** — you'd keep the briefs, the
screens, the journal, and the discipline data, which is most of the value at none
of the risk.

---

## Section 8: Phase C — Live Execution with Approval (Week 4+, Gated)

**Level:** L1, full. **Entry condition:** every Phase B exit criterion checked.

The flow, per ticket:

1. Agent drafts the ticket (identical format, live quotes).
2. You say **approve** — naming the ticket explicitly.
3. Agent runs `get_equity_tradability`, then `review_equity_order`, and shows you
   the review output verbatim (est. cost, buying-power effect, any warnings).
4. You confirm **place** — a second explicit yes, after seeing the review.
5. Agent calls `place_equity_order` (limit, per Rule 2), then confirms state via
   `get_equity_orders` and reports: working / filled / partial.
6. Fill → journal immediately: fill price, size, stop, target, setup name.
7. Unfilled at ticket expiry → `cancel_equity_order`, journal as expired.

Exits are tickets too: closing a position goes through the same draft → approve →
review → place flow. Before any sell in the taxable account, the agent checks
`get_equity_tax_lots` and flags lot-selection or near-long-term-holding-period
consequences in the ticket.

Phase C additions to the rules:

- **Start at half size** for the first two weeks (half of Rule 3's cap), then
  step up only if the journal stays clean.
- **Stops are your job.** The agent drafts the stop; *you* ensure it's real —
  either an actual working stop order (placed through the same approval flow) or
  an alert-plus-discipline arrangement you've proven you honor. Decide which in
  Appendix A and write it in the playbook.
- The circuit breaker (Rule 5) now refers to real dollars. When it trips, the
  agent's only remaining jobs that day are monitoring and journaling — and it
  should say so if asked for a ticket.

---

## Section 9: Phase D — Standing Routines (Optional, Anytime After A)

**Level:** L2. Two scheduled, **read-only** runs — via claude.ai scheduled tasks
or a Claude Code routine:

1. **Morning brief** (pre-market, weekdays): the Phase A brief, delivered as a
   notification/email. If it surfaces something actionable, you open a live
   session yourself — the scheduled run never escalates itself.
2. **Weekly review** (e.g., Sunday): pulls `get_pnl_trade_history` and
   `get_realized_pnl` for the week, reconciles every fill against the journal
   (any fill without a matching approved ticket = violation report), computes
   the running stats (tickets, take rate, hit rate, expectancy, R distribution),
   and drafts playbook-edit suggestions *as suggestions* for you to accept or
   reject at the review.

Scheduled runs operate under the same mechanical rail as Section 3: no order
tools available to them, ever. If a scheduled configuration can't guarantee
that on your surface, don't schedule it there.

---

## Section 10: Dashboard Integration (Thin, Optional, After Phase B)

The dashboard's job here is memory and glanceability, not brokerage access. Hard
rule: **the dashboard never holds Robinhood credentials, and no dashboard code
path can place an order.** Execution lives exclusively in interactive Claude
sessions. This keeps the entire Section 3 rail intact — the web app can't violate
rules it has no power to break.

Three small pieces, in build order:

1. **Migration `0005_trade_journal.sql`** — same conventions as
   `0004_journal_entries.sql` (RLS, single-user policy):

   ```sql
   create table trade_journal (
     id uuid primary key default gen_random_uuid(),
     entry_date date not null,
     symbol text not null,
     side text not null check (side in ('long', 'short')),
     setup text,                      -- playbook setup name
     status text not null check (status in
       ('ticket_passed', 'paper_taken', 'live_open', 'live_closed', 'expired')),
     thesis text,
     entry_price numeric, stop_price numeric, target_price numeric,
     quantity numeric, fill_price numeric, exit_price numeric,
     r_multiple numeric,              -- realized R, filled on close
     pass_reason text,                -- when status = 'ticket_passed'
     ticket jsonb,                    -- full ticket as drafted
     source text not null default 'agent' check (source in ('agent', 'manual')),
     created_at timestamptz not null default now()
   );

   alter table trade_journal enable row level security;
   create policy "authenticated full access" on trade_journal
     for all using (auth.role() = 'authenticated')
     with check (auth.role() = 'authenticated');
   ```

2. **Ingestion via the existing capture endpoint.** The agent ends each session
   by POSTing a summary to `/api/capture` with a capture token — same bearer
   pattern as the iOS shortcut. Add a `log_trade` action type to
   `src/lib/voice-parser.ts` and `executeAction` in
   `src/app/api/capture/route.ts` (mirroring `log_activity`), so a session
   close-out like "journal: took the AMD H2 ticket, filled 12.40, stopped flat"
   lands in `trade_journal` through the parser you already run. Structured
   inserts direct from a session can come later if the parser round-trip ever
   feels lossy.

3. **Today screen card.** Read-only from `trade_journal`: open live positions
   (symbol, entry, stop, current status *as of last journal write*), this week's
   ticket count and take rate, and a staleness warning if the last journal entry
   is older than the last trading day. No live quotes on the dashboard — that's
   what sessions are for.

---

## Section 11: Costs

| Item | Cost |
|---|---|
| Robinhood MCP connector | $0 (uses your existing account) |
| Phase A–C sessions | Covered by the Claude subscription you already pay for |
| Phase D scheduled runs | Same |
| Capture-endpoint parsing for journal entries | Anthropic API, ~$0.01/day at your existing Sonnet parsing setup |
| Dashboard changes | Your time: one migration, one parser action, one card — an evening or two |
| The real cost | Live trading losses, which no part of this guide reduces below your strategy's own risk. Size accordingly (Rules 3–5). |

---

## Section 12: Common Pitfalls

**Stale or misread quotes.** Free-tier quote data can lag, and after-hours prints
mislead. Rule 9 exists for this: every cited number carries its tool timestamp,
and anything actionable gets re-quoted immediately before `review_equity_order`.

**Hallucinated precision.** A model asked for a number will produce a number.
The defense is mechanical, not hopeful: numbers must be quoted from tool output
in-session (Rule 9), and you spot-check against the app throughout Phase A —
then keep randomly spot-checking forever, weekly.

**The PDT rule.** Under $25k of equity in a margin account, you get 3 day trades
per 5 rolling business days; a fourth flags the account. If your checklist
generates intraday round-trips, either the cadence respects the count (the agent
tracks it in the morning brief), the account is cash (then T+1 settlement
becomes the constraint the agent tracks instead), or the strategy holds
overnight. Decide in Appendix A before Phase C.

**Earnings gaps.** A clean technical setup into tomorrow's earnings is not a
clean setup. The morning brief checks `get_earnings_calendar` for every held and
watched name; the ticket format carries an earnings line for a reason.

**Ticket inflation.** Tickets are cheap; that's their danger. The daily cap and
the "no setup is a good day" framing are load-bearing — if you notice yourself
fishing for a third ticket, the system is training you backwards.

**Connector auth expiry mid-session.** Symptoms: tool errors after hours of
inactivity. Response: re-authenticate and re-quote everything; never let the
agent "proceed from the last known price."

**Scope creep.** The option tools sit right there, and one day a covered-call
idea will look obvious. Fine — but it's a re-scope with its own worksheet and
its own paper phase, not a session-time decision (Rule 6).

**Model deference.** After a good week, "the agent said" starts sounding like a
reason. It never is. The playbook is the reason; the agent is the clerk who
checked it. If you can't restate a ticket's thesis in your own words, pass.

**Taxes.** Every taxable-account sale is a tax event. The Phase C tax-lot check
and the weekly review's realized-P&L pull keep this visible; don't let April be
a surprise.

---

## Section 13: Review Cadence and Kill Criteria

**Weekly review** (fits your existing weekly-review habit; Phase D automates the
data pull): stats, discipline reconciliation (fills vs approved tickets),
playbook edits, and one explicit question — *"which phase should next week run
at?"* Moving down a phase is normal seasonal behavior (board-study crunches,
travel weeks), not failure.

**Kill criteria — mechanical, decided now, not in the moment.** Any one of these
drops you back a phase immediately; two in a quarter stops live trading until a
full re-plan *(all worksheet-adjustable)*:

- A guardrail violation involving a live order (unapproved, oversized, market
  order, no stop plan)
- Account drawdown from live tickets exceeds 6% peak-to-trough
- The journal goes silent for 5 trading days while positions are open
- You catch yourself negotiating with a rule mid-session

**Expansion criteria** (the mirror image): three consecutive months of Phase C
with zero violations and expectancy ≥ Phase B's paper numbers — then, if you
want, open a worksheet for the next scope (full-size Rule 3, or an options
paper-phase). One expansion at a time.

---

## Appendix A: Decision Worksheet

Fill this in and record the answers in DECISIONS.md, same as the Section 2
worksheet from SCOPE.md. Do not start Phase C with blanks.

| Decision | Your Answer |
|---|---|
| Scoped account (from `get_accounts`) | _____ |
| Accounts explicitly excluded (IRA, …) | _____ |
| Active-trading capital (Section 1.1) | $_____ |
| Risk per trade (Rule 3 default 1%) | _____% |
| Max position size (Rule 4 default 5%) | _____% |
| Daily circuit breaker (Rule 5 default −2% / 2 stops) | _____ |
| Daily ticket cap (default 3) | _____ |
| Margin or cash account / PDT plan (Section 12) | _____ |
| Stop-order policy: working stops vs alerts (Section 8) | _____ |
| Playbook location: in-repo vs local-only (Section 5) | _____ |
| Phase A start date | _____ |
| Phase B entry (A criteria met) | _____ |
| Phase C entry (B criteria met + capital gate) | _____ |
| Kill-criteria numbers if different from Section 13 | _____ |

## Appendix B: Session Prompt Library

Keep these as saved prompts (or a `playbook/prompts.md`). Each assumes the
Robinhood connector is attached and `playbook/long-setups.md` is available
(pasted or read from the repo).

**Morning Brief (Phases A–D)**

> Read playbook/long-setups.md and restate the guardrails in one line. Then,
> using only live tool data (timestamps on every number): (1) SPY and QQQ vs the
> playbook's market filter and my marked levels — does the filter say trade or
> stand aside today? (2) Every open position in the scoped account: last price,
> overnight change, distance to my stop and target, any earnings within the
> playbook window. (3) Run my standing scans, triage the watchlist against the
> playbook, and list any name within one clean pullback of a valid setup — as
> watch notes, not tickets. (4) Day-trade count for the PDT window. Keep it
> under 300 words. Do not draft tickets in this brief.

**Trade Ticket (Phases B–C)**

> I'm flagging <SYMBOL> for a possible <setup name>. Check it against every
> playbook criterion explicitly — pass/fail each line, quoting live data with
> timestamps. If any criterion fails, say "no setup" and stop. If all pass,
> draft one ticket in the standard format, sized from the worksheet risk
> numbers. Do not call any order tool.

**Execution (Phase C, after I approve a ticket)**

> For approved ticket <id> only: check tradability, run review_equity_order, and
> show me the full review output. Take no further action until I explicitly say
> "place". After placing, confirm the order's status via get_equity_orders and
> give me the journal line.

**EOD Journal (Phases A–C)**

> Resolve today's tickets (filled / stopped / target / expired / passed) against
> actual prices. Compute realized R for anything closed. Draft today's journal
> entry in the log_trade format and POST it to the capture endpoint. Flag any
> rule from the playbook header that today's activity bent — including a missing
> journal from a prior day.

**Weekly Review (Phase D or manual)**

> Pull the week's P&L history and realized P&L for the scoped account. Reconcile
> every fill against journaled approved tickets — list any orphans as
> violations. Report: tickets drafted, take rate, hit rate, average R, expectancy,
> current drawdown vs the kill criteria. Compare my pass-reasons against ticket
> outcomes and propose at most two playbook edits, marked PROPOSED, for me to
> accept or reject. End with a recommendation: which phase should next week run
> at, and why.

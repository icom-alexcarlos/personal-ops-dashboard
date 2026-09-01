# Playbook — Highest Volume Day (HVD) Long Setup

**Source:** r/Daytrading post by u/1215DayTrading, "I've been trading for over
12 years and THIS is one of my best strategies" (~Sep 2025; shared by Alex
2026-09-01 as screenshots and codified here).
**Status:** STUDY — Sleeve A ladder Steps 1–2 territory. $0 live capital.
RS/RW (r/RealDayTrading) remains Sleeve A's installed primary strategy per the
Notion framework (2026-08-11); HVD earns any change to that only through its
own paper stats, by explicit decision.
**Machinery:** sessions, tickets, approvals, and journaling run exactly per
ROBINHOOD_AGENTIC.md. Its Section 3 guardrails apply verbatim and are not
repeated here — restate them at the top of every session.

**Claimed stats (self-reported, unverified, one year of the author's records):**
avg gain from triggered entry 42.3%; 71% rate of capturing ≥5%; average R:R
"potential" 1:3. Treat as marketing until Phase B produces *your* numbers —
expect yours to be worse.

---

## What the Setup Is

Small-cap (<$3B) long breakout, entered when a stock that has *already*
traded near-record volume in premarket breaks its premarket high after the
open. The volume criterion is the whole edge claim: premarket volume at or
above the stock's highest-ever daily volume signals unusual participation.

## Universe (hard filters — any fail = not tradeable)

- US-listed common stock. No OTC, no warrants/units/rights, no sub-$1.
- Market cap < $3B (per source). Price floor $1.00 (worksheet).
- **Identifiable catalyst required** (news, filing, earnings). "It's just
  moving" is not a catalyst.
- **Dilution screen:** check recent SEC filings (`get_sec_filing_index`) for
  shelf registrations (S-3), recent offerings (424B), or ATM programs.
  Default rule: offering or new shelf within the last 90 days = non-setup.
  These names sell into exactly this kind of spike.
- Small-cap hazards are assumed live at all times: volatility halts (LUDP),
  short-sale restriction, spreads, gap risk. If the spread exceeds ~2% at
  decision time, it's a non-setup regardless of pattern.

## Step 1 — Scan (premarket)

Two stages, because the scanner compares volume to *averages*, not maxima:

1. **Scanner** (`run_scan`): asset STOCK; market cap < $3B; last ≥ $1;
   gap ≥ +5%; relative volume elevated (start ≥5x, tune in Phase A).
2. **Per-candidate check (agent):** pull full daily history
   (`get_equity_historicals`) → highest single-day volume ever; pull
   premarket volume (extended-hours data). Qualify only if premarket volume
   ≥ 1M shares **and** ≥ 0.8× the highest daily volume (worksheet).

> **UNVERIFIED:** whether premarket volume and premarket scanner data
> populate through the MCP before the open is untested. First Phase A task.
> Fallback: run the Robinhood app screener manually; the agent still does the
> highest-volume-day comparison and the rest of the checklist.

## Step 2 — Premarket pattern (chart read; Alex confirms, agent describes)

- Strong initial premarket move up, **followed by exactly one major
  consolidation** (tight sideways range). Two or more distinct consolidations
  = non-setup (source is explicit).
- Price still **inside** the range approaching the open. Already broke out
  premarket = non-setup.

## Step 3 — Levels

- **Resistance / trigger:** premarket high.
- **Support:** bottom of the major consolidation.
- Both recorded on the ticket with quote timestamps (Rule 9).

## Step 4 — Targets

- **T1 = measured move:** premarket high + (premarket high − consolidation
  bottom). Source example: high $2.50, bottom $2.00 → T1 $3.00.
- Planned R:R at entry must be ≥2 or the ticket isn't drafted (source claims
  1:3 average *potential*; most common realized outcome is ~5%).
- Default management: half off at T1, stop to breakeven, trail the rest
  (worksheet).

## Step 5 — Entry

- **Default (variant A, confirmation):** after the open, price breaks the
  premarket high, then *holds or retests it as support* (first pullback holds
  above; bull flag / ABCD equivalents count). Enter on the hold, limit order.
- **Variant B (immediate breakout):** allowed only as a logged variant so
  Phase B can compare — never both variants on one ticket.
- **No chasing:** entry more than 2% above trigger = missed, journal it.
- Long only. One HVD position at a time (worksheet).

## Risk plan (mandatory per ticket)

- **Stop:** below the consolidation bottom (default), or below the day's
  highest-volume price area once regular-hours structure exists. Structure
  stop, never a percent picked from air.
- **Size:** fixed dollar risk per Rule 3 of ROBINHOOD_AGENTIC.md, from stop
  distance. Thin-name adjustment: assume the stop slips; if spread > 1%,
  halve size.
- Stops are real working orders or a proven alert-discipline arrangement —
  same policy as the main guide, decided in its worksheet.
- **PDT budget:** this is a day-trading setup. Under $25k margin, 3 day
  trades per 5 rolling sessions — the morning brief tracks the count and the
  count gates ticket drafting, not willpower.

## Explicit non-setups

Multiple premarket consolidations · broke out before the open · large
historical volume day at a price *above* intended entry (trapped supply —
source's "clean chart" rule) · dilution filing inside 90 days · no catalyst ·
premarket volume < 1M shares · spread > 2% · OTC or sub-$1 · adding to a
loser · shorts · anything during a tripped circuit breaker.

## Rollout (maps to ROBINHOOD_AGENTIC.md phases)

- **Phase A (2 weeks):** run the scan every session in the morning brief;
  log every qualifier and what it did by EOD. No tickets. Deliverables:
  premarket-data verification (above), tuned scan thresholds, and a base rate
  — how often qualifiers actually run vs fade.
- **Phase B (≥20 paper tickets):** full ticket flow on paper, variants A/B
  tagged. Compare your realized stats against the claimed 71%/42.3% —
  decide on *your* numbers only. Zero journaling lapses to pass the gate.
- **Phase C (live, only if):** Phase B gate passed **and** the
  one-live-system decision vs RS/RW is made explicitly in DECISIONS.md
  **and** capital gate + PDT plan are written. Half size first two weeks.

## Worksheet

| Decision | Answer |
|---|---|
| Price floor (default $1.00) | _____ |
| RVOL scan threshold (default 5x) | _____ |
| Premarket-vs-max-volume multiple (default 0.8x) | _____ |
| Chase limit (default 2%) | _____ |
| Concurrent HVD positions (default 1) | _____ |
| Dilution lookback (default 90 days) | _____ |
| T1 management (default half off, trail rest) | _____ |
| Phase A start date | _____ |
| One-live-system decision (RS/RW vs HVD vs sequenced) | _____ |

# Project Decisions

Recorded from the kickoff walkthrough (Section 5/2 of SCOPE.md).

## Feature Selection (Section 2)

**Profile: Minimalist** — core only, add modules later once a real gap is felt.

Core (all KEEP, per SCOPE.md Section 2):
- Today screen, Tasks, Domains, Inbox, Projects, Voice capture, Google Calendar sync, Notifications

Library features: SKIP for now
Optional modules: SKIP for now

## Hosting

Not yet decided at kickoff. Recommendation: **Railway** (or Render) — managed Node.js hosting from git push, simplest option per SCOPE.md Section 1. Not needed until first deploy; local dev doesn't require it.

## Accounts Status

- [x] Anthropic API key
- [x] Supabase project (free tier — upgrade to Pro before relying on this daily, see SCOPE.md pitfall on auto-pause)
- [x] Google Cloud Console OAuth credentials (Calendar API)
- [x] GitHub repo (icom-alexcarlos/personal-ops-dashboard)

## Architecture

Single Next.js app (App Router, Route Handlers as the backend) instead of SCOPE.md's
separate Fastify/Hono backend — simpler to run and deploy for a single-user app.

## Initial Domains (Appendix B)

Inbox (auto-created, system) + Work added during build/testing. Add the rest
(Personal/Life, side projects, etc.) through the Domains tab whenever.

## Phase 1 Status: COMPLETE

All Phase 1 (spine) features are built and verified against the live Supabase
project in the browser preview:
- Auth (Supabase, single user)
- Today screen (calendar, top tasks capped at 8, domain status)
- Domains + Inbox CRUD
- Projects + Milestones CRUD
- Tasks CRUD (recurrence via rrule, subtasks, reminder offsets)
- Google Calendar OAuth connect + pull sync (push deferred to land alongside
  voice's create_calendar_event action — see git log)
- Voice capture (mic -> Claude parser -> executes create_task/complete_task/
  create_project/update_project_status/log_activity/update_milestone/
  create_calendar_event)
- Notifications feed with undo

Since verified (2026-07-02): Google Calendar OAuth consent tested end-to-end with
real Google login — tokens stored, 5 events synced, Today screen reflects state.
(Root cause of initial failure: app_settings migration hadn't been run in Supabase.)
All commits pushed to GitHub.

Not yet done (per SCOPE.md's own kickoff rules — use it for 3 days before Phase 2):
- Upgrade Supabase to Pro before daily reliance

## Deployment (2026-07-03)

Deployed to Vercel Hobby (free): https://personal-ops-dashboard-9g6p.vercel.app
(an earlier project, personal-ops-dashboard-xi, should be deleted in Vercel).
Deploys auto-trigger on push to main. Env vars live in Vercel project settings.

## Phase 2 Progress (2026-07-03)

- Capture tokens: done. capture_tokens table (0003), bearer auth on
  /api/capture, /settings page to generate/revoke, spoken_confirmation in
  responses, verified end-to-end (token capture created a task with no session).
- iOS Shortcuts: recipe handed to user, pointed at the Vercel URL.
- Skipped per feature selection: email forwarding, Gmail watcher.

## Robinhood Agentic — Planning (2026-08-05)

Planning guide authored: ROBINHOOD_AGENTIC.md (companion to SCOPE.md, same
phased/worksheet format). Robinhood MCP connector is attached to Claude and
its tools verified visible in-session.

Committed by the plan itself (not pending):
- Human-in-the-loop at every phase; no autonomous order placement at any
  level (no "L3"). Options and crypto orders out of scope; IRA excluded.
- Rollout: Phase A read-only analyst -> B paper tickets -> C live with
  per-order approval (gated on B stats + capital gate) -> D scheduled
  read-only routines.

Pending (Appendix A worksheet, fill before Phase C): scoped account, active
trading capital, risk/size caps, PDT plan, stop-order policy, playbook
location (in-repo vs local), phase start dates.

Dashboard work deferred until after Phase B: 0005_trade_journal.sql,
log_trade capture action, Today screen card (sketched in guide Section 10).

## Reddit Strategy Plans (2026-09-01)

Two r/Daytrading posts shared by Alex (as screenshots), planned as separate
documents because they live at different layers:

- TOP1_ROTATION.md — monthly Top-1 market-cap rotation (u/Jeblitzky).
  Portfolio-layer plan; NOT day trading. Status: Phase 0 (verify the
  backtest — the OP's own edit calls the data unreliable) before any
  capital. If ever adopted, it becomes a new capped experimental sleeve;
  it must not touch the Sleeve B DCA core (violates its concentration and
  no-timing doctrine). As of 2026-08-31 the rule's position would be NVDA
  ($5.43T, ~15% ahead of AAPL).
- playbook/highest-volume-day.md — small-cap premarket-volume breakout
  (u/1215DayTrading), codified in the ROBINHOOD_AGENTIC.md Section 5
  playbook format. Status: STUDY. Runs through the same Phase A -> B -> C
  gauntlet; claimed stats treated as unverified. RS/RW stays Sleeve A's
  primary strategy until paper stats + an explicit decision say otherwise.

Both inherit ROBINHOOD_AGENTIC.md guardrails wholesale (propose-then-
approve, limit orders, risk caps, journaling, no autonomous execution).
Pending decisions live in each document's worksheet. Installing either into
the Notion Trading & Portfolio Framework is Alex's explicit step, not done
here.

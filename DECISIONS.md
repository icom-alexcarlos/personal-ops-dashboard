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

## Accounts Status (as of kickoff)

None created yet. Required before Phase 1 implementation begins:
- [ ] Anthropic API (console.anthropic.com) — separate from Claude.ai/Claude Code subscription
- [ ] Supabase Pro project
- [ ] Google Cloud Console OAuth credentials (Calendar API)
- [ ] GitHub repo

## Initial Domains (Appendix B — fill in before Phase 1 data model work)

TBD — pick 5–9, e.g. Work, Personal/Life, [side project], Inbox (auto-created).

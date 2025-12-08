# Tournee - Development TODO

## Phase 1: Core Logic (packages/core) - COMPLETE

### Bracket Features

- [x] Basic 8-person single elimination bracket generation
- [x] Handicap calculation
- [x] Match winner determination
- [x] Basic payout calculation (winner/runner-up)
- [x] 12-person bracket handling (non-power-of-2 with BYEs)
- [x] 16/32/64-person bracket support
- [x] "Still Alive" list generation
- [x] Duplicate pairing prevention (same bowler can't face same opponent across brackets)
- [x] Refund calculation for unfilled brackets
- [x] Multi-tier payout structure (1st, 2nd, 3rd, 4th, etc.)
- [x] Bracket seeding options (random, by average, by handicap)
- [ ] Reverse brackets (losers bracket / double elimination) - Future

### Sidepot Features

- [x] Mystery/Blind doubles pairing
- [x] Eliminator cut score calculation
- [x] High Game (Nassau) winner calculation per game
- [x] High Series winner calculation
- [x] Sweeper standings calculation
- [x] Eliminator progression (track who's still in across games)
- [x] Love doubles (pick your partner)

### Money Management

- [x] Entry fee collection tracking (MoneyLedger)
- [x] Prize pool calculation from entries
- [x] Lineage tracking (house fees)
- [x] Refund calculation
- [x] Payout structure generation
- [ ] Cash vs credit tracking - Future

### Scoring

- [x] Scratch scoring
- [x] Handicap scoring with configurable base/percentage
- [x] Score validation (max 300)
- [x] Statistics calculations (average, high game, high series)
- [x] Average recalculation
- [ ] Per-frame scoring (for real-time updates) - Future

### Testing

- [x] Set up vitest
- [x] Unit tests for all calculation functions (76 tests passing)
- [x] Unit tests for bracket generation
- [x] Unit tests for payout calculations
- [x] Unit tests for sidepot calculations
- [x] TypeScript strict mode passing

---

## Phase 2: Backend (Convex) - IN PROGRESS

### Database Schema - COMPLETE

- [x] Users (organizers)
- [x] Bowlers (participants)
- [x] Events (leagues, tournaments)
- [x] Brackets
- [x] Bracket matches
- [x] Bracket entries
- [x] Sidepots
- [x] Sidepot entries
- [x] Scores
- [x] Payouts
- [x] Transactions (money in/out)

### Real-time Features

- [x] Live score updates (via Convex subscriptions)
- [x] Live bracket progression
- [x] Live standings
- [ ] Notifications (your match is up, you won, etc.) - Future

### Auth & Access

- [x] Organizer accounts (via Clerk)
- [ ] Bowler accounts (optional - can be anonymous) - Future
- [x] Event access codes (auto-generated 6-char codes)
- [x] Role-based permissions (organizer owns events)

### API - COMPLETE

- [x] CRUD for all entities
- [x] Bulk operations (import bowlers, enter multiple scores)
- [x] Event financials/summary
- [ ] Reports generation - Future
- [ ] Export functionality - Future

### Setup Required

To enable authentication, you need to:

1. Create a Clerk application at <https://dashboard.clerk.com>
2. Get your Clerk JWT Issuer Domain (e.g., `https://your-app.clerk.accounts.dev`)
3. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard environment variables
4. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `apps/web/.env.local`
5. Run `bunx convex dev` to deploy with auth enabled

---

## Phase 3: Web App (apps/web)

### 3.1 Event Management (Start Here)

- [ ] Event list page (all your events)
- [ ] Event create/edit form (name, date, location, fees)
- [ ] Event dashboard (single event overview)

### 3.2 Bowler Management

- [ ] Bowler list (your database of bowlers)
- [ ] Bowler add/edit form
- [ ] Bulk import from CSV
- [ ] Event check-in (add bowlers to specific event)

### 3.3 Bracket System

- [ ] Bracket setup (create bracket, set payouts, add entries)
- [ ] Bracket view (visual tree showing matchups)
- [ ] Match scoring modal (enter scores for a match)
- [ ] Bracket progression (auto-advance winners)

### 3.4 Score Entry (The Core Feature)

- [ ] Organizer score grid (spreadsheet-style bulk entry)
- [ ] **Distributed scoring** - Bowlers enter own scores via phone
- [ ] Score approval queue (organizer reviews bowler-submitted scores)
- [ ] Lane-by-lane verification (quick approve per lane)

### 3.5 Sidepots

- [ ] Sidepot setup (type, entry fee, rules)
- [ ] Eliminator view (who's still in, cut scores)
- [ ] Mystery doubles view (random pairings, combined scores)
- [ ] High game/series standings
- [ ] Sweeper leaderboard

### 3.6 Money & Payouts

- [ ] Entry fee collection tracking
- [ ] Payout summary (who won what)
- [ ] Cash out screen (mark as paid)
- [ ] Event financials (money in vs out)

### 3.7 Bowler-Facing Views

- [ ] Join event (enter code or scan QR)
- [ ] Live bracket view (spectator mode)
- [ ] Live standings
- [ ] Self score entry (submit for approval)
- [ ] My results (personal history)

### 3.8 Polish

- [ ] Print-friendly bracket sheets
- [ ] Event summary/results page
- [ ] Analytics dashboard

---

## Phase 4: Mobile App (apps/mobile)

### Organizer Features

- [ ] Quick score entry with large buttons
- [ ] Haptic feedback on actions
- [ ] Offline mode with sync
- [ ] Camera for bowler photos

### Bowler Features

- [ ] Push notifications
- [ ] Event check-in via QR
- [ ] Live updates
- [ ] Score self-entry

---

## Phase 5: E2E Testing (Playwright + Stagehand)

### Test Infrastructure

- [x] Playwright setup with Stagehand v3
- [x] Clerk testing utilities (create/delete test users via API)
- [x] Test database seeding utilities
- [ ] CI/CD integration

### Simulated Tournament Flows

- [ ] Organizer creates account and event
- [ ] Organizer adds 8 bowlers to event
- [ ] Organizer creates bracket, adds entries
- [ ] Organizer starts bracket, records all matches
- [ ] Verify bracket winner and payouts
- [ ] Full eliminator sidepot simulation
- [ ] Mystery doubles pairing and scoring

### Multi-User Real-time Testing

- [ ] Multiple browser contexts (organizer + bowlers)
- [ ] Verify real-time score updates across clients
- [ ] Verify bracket progression syncs instantly
- [ ] Stress test with 32+ concurrent users

### Edge Cases

- [ ] Partial bracket (6 bowlers in 8-person bracket)
- [ ] Tied scores handling
- [ ] Refund flow for cancelled events
- [ ] Offline/reconnection scenarios

---

## Differentiators vs TBrac/Keglerz

Things we offer that they don't:

1. **Web-based** - No Windows installation required
2. **True cross-platform** - Web + iOS + Android
3. **Modern UI** - Not "ancient" looking
4. **Free tier** - TBrac is $179+
5. **Real-time sync** - Bowlers see updates instantly (TBrac requires printing)
6. **QR code join** - Scan to enter event
7. **Event discovery** - Find events near you
8. **Bowler profiles** - Track history across events
9. **Analytics dashboard** - Visual stats and trends
10. **Offline support** - Works without internet, syncs when back online
11. **Open API** - Allow integrations
12. **Lane scoring integration** - Future: connect to Brunswick/QubicaAMF via Lanetalk

---

## Bowling Glossary (Quick Reference)

| Term | What It Means |
|------|---------------|
| **Scratch** | Your actual score, no adjustments. Bowl 180, score is 180. |
| **Handicap** | Bonus pins added to help level the playing field. A 150-avg bowler might get +30 pins per game to compete fairly against a 200-avg bowler. |
| **Average** | Your typical score (sum of games ÷ number of games). Used to calculate handicap. |
| **Bracket** | Single-elimination tournament. Lose once, you're out. Winner advances. |
| **Sidepot** | Side bets that run alongside the main bracket. Extra ways to win money. |
| **Eliminator** | Sidepot where lowest scores get cut each game. Survive all games = split the pot. |
| **Mystery Doubles** | Sidepot where you're randomly paired with a partner. Combined scores compete. |
| **High Game** | Sidepot for highest single game score. |
| **High Series** | Sidepot for highest total across all games (usually 3-4 games). |
| **Sweeper** | Everyone's scores ranked. Top X places win money. |
| **Lineage** | Fee paid to the bowling alley (lane rental). Not part of prize pool. |
| **Entry Fee** | What bowlers pay to enter. Part goes to prizes, part to lineage. |
| **BYE** | When bracket has odd numbers, some bowlers auto-advance round 1. |
| **300 Game** | Perfect game. 12 strikes in a row. Max possible score. |

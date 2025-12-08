# Changelog

All notable changes to Tournee will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Example app for testing components (`docs/examples/tbrac-ai-studio-app`)
  - Tournament manager demo with brackets, check-in, and scoring
  - Uses Vite + React 19 + Tailwind + Recharts
  - AI-powered tournament recap via Gemini API
- Mobile app scaffolding (`apps/mobile`) with Expo 54
- Playwright + Stagehand E2E testing setup
- Dashboard pages for event management
- Auth pages (sign-in, sign-up) with Clerk integration
- Middleware for protected routes
- Biome/Ultracite linting (replaced ESLint)
- Lefthook pre-commit hooks

### Changed

- Migrated from pnpm to bun workspaces
- Moved documentation to `docs/` directory
- Updated TypeScript configs for stricter checking
- Excluded example apps from root linting to allow different configs

### Removed

- ESLint configs (replaced by Biome/Ultracite)
- pnpm workspace files (using bun)
- Husky (replaced by Lefthook)

### Infrastructure

- Initial monorepo structure with Turborepo
- `apps/web` - Next.js 15 web application with shadcn/ui
- `apps/mobile` - Expo 54 React Native application
- `packages/core` - Shared business logic and types
- `packages/ui` - Shared UI components (web)
- `packages/typescript-config` - Shared TypeScript configuration

### Core Types (`@workspace/core`)

- `Bowler` - Bowler profile with name, average, handicap
- `Event` - Tournament/league event configuration
- `Bracket` - Single elimination bracket structure (4/8/12/16/32/64 sizes)
- `BracketMatch` - Individual match within a bracket
- `Sidepot` - High game, mystery doubles, eliminator, sweeper support
- `SidepotEntry` - Individual sidepot participation
- `GameScore` - Per-game scoring with handicap
- `Payout` - Prize money distribution

### Bracket Calculations (`@workspace/core`)

- `generateBracketMatches()` - Single elimination bracket generation (all sizes)
- `determineMatchWinner()` - Match result determination with BYE handling
- `getStillAlive()` - Get list of bowlers still in bracket
- `haveFacedEachOther()` - Check duplicate pairing history
- `generateBracketWithHistory()` - Generate bracket avoiding duplicate pairings
- `advanceWinner()` - Advance winner to next round
- `seedBowlers()` - Seed by random, average, or handicap
- `calculateRounds()` - Calculate number of rounds needed
- `calculateByes()` - Calculate BYEs for non-power-of-2 brackets

### Sidepot Calculations (`@workspace/core`)

- `calculateHighGameWinner()` - Nassau winner per game
- `calculateAllHighGameWinners()` - Nassau winners for all games
- `calculateHighSeriesWinner()` - Total pins winner
- `generateMysteryDoublesPairings()` - Random partner assignment
- `calculateDoublesStandings()` - Mystery doubles rankings
- `calculateLoveDoublesStandings()` - Pre-selected partner rankings
- `calculateEliminatorCutScore()` - Elimination threshold
- `processEliminatorGame()` - Process single eliminator game
- `runFullEliminator()` - Run eliminator across all games
- `calculateSweeperStandings()` - Simple total pins standings

### Payout Calculations (`@workspace/core`)

- `STANDARD_PAYOUT_RATIOS` - Standard payout ratios by size
- `calculatePayoutStructure()` - Multi-tier payout calculation
- `calculateBracketPayouts()` - Bracket-specific payouts
- `calculateBracketRefunds()` - Refunds for unfilled brackets
- `calculateEventFinancials()` - Full event financials with lineage
- `calculateSidepotPrizePool()` - Sidepot prize calculation
- `createMoneyLedger()` - Money tracking ledger
- `addTransaction()` - Add entry/payout/refund
- `getLedgerByBowler()` - Per-bowler money summary

### Scoring Calculations (`@workspace/core`)

- `calculateHandicap()` - Handicap formula with configurable base/percentage/max
- `calculateTotalScore()` - Pin count + handicap
- `applyHandicap()` / `applyHandicapToAll()` - Apply handicap to bowlers
- `isValidScore()` / `validateGameScore()` - Score validation
- `calculateBowlerStats()` - Individual bowler statistics
- `calculateAllBowlerStats()` - All bowlers statistics
- `recalculateAverage()` - Update average with new games
- `createGameScore()` - Create game score object

### Testing

- Vitest test framework configured
- 76 unit tests passing
- Full coverage for brackets, sidepots, payouts, scoring

### Infrastructure

- Bun workspaces for package management
- Biome/Ultracite for linting and formatting
- Husky + Lefthook for git hooks
- TypeScript strict mode

### Convex Backend

- Database schema for all bowling entities:
  - `users` - Organizer accounts with Clerk auth
  - `bowlers` - Participant profiles
  - `events` - Tournament/league events with access codes
  - `eventBowlers` - Event participation tracking
  - `brackets` - Bracket configuration (4-64 sizes)
  - `bracketEntries` - Bowler bracket entries
  - `bracketMatches` - Match results with auto-advancement
  - `sidepots` - All sidepot types
  - `sidepotEntries` - Sidepot participation
  - `scores` - Game scores with handicap
  - `payouts` - Prize distribution tracking
  - `transactions` - Money ledger (entries, payouts, refunds)

### Convex Functions

- `users.ts` - User management with Clerk integration
- `bowlers.ts` - CRUD for bowlers, bulk create
- `events.ts` - Event management, access codes, bowler check-in
- `brackets.ts` - Bracket creation, entries, match results, auto-advance
- `sidepots.ts` - All sidepot types, mystery doubles pairing
- `scores.ts` - Score recording, standings, statistics
- `payouts.ts` - Payout tracking, paid status
- `transactions.ts` - Event financials, bowler summaries

### Web App Integration

- Convex + Clerk provider setup
- Landing page with sign in/up
- Protected dashboard with events overview
- Sign-in and sign-up pages

## [0.0.1] - 2024-12-05

### Added

- Project initialization
- Basic repository structure

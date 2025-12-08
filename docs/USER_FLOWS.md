# Tournee - User Flows & Bowling Tournament Guide

This document explains how bowling tournaments work, our user flows, and serves as a benchmark for feature completeness.

---

## Part 1: Bowling Tournaments Explained (For Non-Bowlers)

### The Basic Setup

A bowling tournament typically involves:

- **Bowlers** - Participants who pay entry fees
- **Organizer** - Person running the event (collects money, enters scores, pays winners)
- **Lanes** - Where bowlers play (usually 2 bowlers per lane)
- **Games** - Typically 3 games per session (sometimes 4-5)

### How Scoring Works

**Scratch Scoring:**

- Your actual pins knocked down = your score
- Bowl 180, your score is 180
- Maximum possible: 300 (perfect game)

**Handicap Scoring:**

- Bonus pins added to level the playing field
- Formula: `(Base - Your Average) × Percentage`
- Example: Base 220, 90% handicap, your average is 150
  - Handicap = (220 - 150) × 0.90 = 63 pins
  - Bowl 180 → Score is 180 + 63 = 243

### What is a Bracket?

A bracket is a **single-elimination mini-tournament within the larger event**.

```text
ROUND 1          ROUND 2          FINALS
┌─────────┐
│ John 210│──┐
└─────────┘  │    ┌─────────┐
             ├───►│ John 195│──┐
┌─────────┐  │    └─────────┘  │
│ Mike 185│──┘                 │    ┌─────────┐
└─────────┘                    ├───►│ John    │ WINS $30
                               │    └─────────┘
┌─────────┐                    │
│Sarah 220│──┐                 │
└─────────┘  │    ┌─────────┐  │
             ├───►│Sarah 205│──┘    Runner-up: $5
┌─────────┐  │    └─────────┘
│ Tom  180│──┘
└─────────┘
```

**How it works:**

1. 8 bowlers pay $5 each = $40 pot
2. Game 1: 8 bowlers → 4 winners advance
3. Game 2: 4 bowlers → 2 winners advance
4. Game 3: 2 bowlers → 1 winner takes $30, runner-up gets $5

**Important:** Multiple brackets run simultaneously. One bowler might be in 5-10 brackets at once!

### What are Sidepots?

Sidepots are **additional betting pools** that run alongside brackets:

| Sidepot Type | How It Works |
|--------------|--------------|
| **High Game (Nassau)** | Highest score in each individual game wins |
| **High Series** | Highest total across all games wins |
| **Eliminator** | Bottom 50% cut after each game. Survivors split pot. |
| **Mystery Doubles** | Random partner assignment. Combined scores compete. |
| **Love Doubles** | Pick your own partner. Combined scores compete. |
| **Sweeper** | All scores ranked. Top X places win money. |

### Money Flow

```text
Entry Fees Collected
        │
        ├─► Lineage (goes to bowling alley for lane rental)
        │
        └─► Prize Pool
              │
              ├─► Bracket Payouts
              ├─► Sidepot Payouts
              └─► Admin Fee (optional)
```

---

## Part 2: Why Competitors Are Slow (Braxion, TBrac, etc.)

### The "Building" Problem You Noticed

When Braxion says "building brackets takes time," here's what's happening:

**Their Architecture (2010s tech):**

```text
Score Entry → Local Database → Complex SQL Queries → Generate PDF → Print
                                       ↑
                            This is where it's slow
```

**Problems:**

1. **PDF Generation** - Converting data to printable PDF is CPU-intensive
2. **Batch Processing** - They calculate EVERYTHING at once at the end
3. **Old SQL Queries** - Inefficient database operations
4. **No Real-Time** - Can't incrementally update, must recalculate from scratch
5. **Desktop App** - Single-threaded, can't parallelize

### Our Architecture (2024 tech)

```text
Score Entry → Convex (Real-Time) → Instant Calculations → Live UI Updates
                    ↑
            Sub-millisecond
```

**Why We're Faster:**

1. **Incremental Updates** - Calculate only what changed, not everything
2. **Real-Time Database** - Convex uses reactive queries
3. **Distributed Computing** - Calculations run on Convex's servers, not user's laptop
4. **No PDF by Default** - Live web views instead (PDF optional for printing)
5. **Modern Algorithms** - Our bracket generation is O(n log n), not O(n²)

### Scale Comparison

| Scenario | Braxion (estimated) | Tournee (our target) |
|----------|---------------------|----------------------|
| 100 bowlers, 5 brackets each | 30-60 seconds | < 100ms |
| 500 bowlers tournament | 2-5 minutes | < 500ms |
| Score entry to bracket update | Manual refresh needed | Instant (real-time) |

---

## Part 3: What We've Built (Core Logic)

### ✅ Completed (76 Tests Passing)

**Brackets:**

- [x] Generate brackets (8/12/16/32/64 person)
- [x] BYE handling for non-power-of-2
- [x] Match winner determination (scratch & handicap)
- [x] Seeding methods (random, by average, by handicap)
- [x] Duplicate pairing prevention
- [x] Still-alive tracking

**Sidepots:**

- [x] Mystery Doubles (random pairing)
- [x] Love Doubles (pick partner)
- [x] Eliminator (cut-the-field)
- [x] High Game (per game)
- [x] High Series (total)
- [x] Sweeper (rankings)

**Scoring:**

- [x] Scratch scoring
- [x] Handicap calculation
- [x] Score validation (0-300)
- [x] Average calculation
- [x] Stats (high game, high series)

**Money:**

- [x] Payout structure generation
- [x] Refund calculations
- [x] Money ledger tracking
- [x] Prize pool calculations

---

## Part 4: User Flows

### Flow 1: Organizer - Pre-Event Setup (Day Before)

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ORGANIZER: PRE-EVENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CREATE EVENT                                                │
│     └─► Name, Date, Location                                    │
│     └─► Scoring type (scratch/handicap)                         │
│     └─► Handicap settings (base, %, max)                        │
│                                                                 │
│  2. SET UP BRACKETS                                             │
│     └─► Entry fee ($5, $10, etc.)                               │
│     └─► Payout structure (1st: $30, 2nd: $5)                    │
│     └─► Number of games (usually 3)                             │
│                                                                 │
│  3. SET UP SIDEPOTS                                             │
│     └─► Which types (eliminator, high game, etc.)               │
│     └─► Entry fees for each                                     │
│     └─► Payout structures                                       │
│                                                                 │
│  4. ADD BOWLERS (optional, can do day-of)                       │
│     └─► Name, average                                           │
│     └─► Import from CSV if returning bowlers                    │
│                                                                 │
│  Output: Event ready, access code generated (e.g., "XK7M2P")    │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Organizer - Day of Event

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ORGANIZER: DAY OF EVENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CHECK-IN BOWLERS                                            │
│     └─► Mark arrived bowlers                                    │
│     └─► Collect entry fees                                      │
│     └─► Assign to brackets/sidepots                             │
│     └─► Assign lane numbers                                     │
│                                                                 │
│  2. START EVENT                                                 │
│     └─► Generate bracket matchups                               │
│     └─► Generate mystery doubles pairings                       │
│     └─► Display brackets on screen                              │
│                                                                 │
│  3. SCORE ENTRY (Per Game) ← CRITICAL PATH, MOST TIME HERE     │
│     │                                                           │
│     ├─► Option A: Organizer enters all scores                   │
│     │   └─► Walk lane to lane, collect scores                   │
│     │   └─► Enter into quick-entry grid                         │
│     │                                                           │
│     └─► Option B: Distributed scoring (OUR INNOVATION)          │
│         └─► Bowlers enter own scores via phone                  │
│         └─► Organizer reviews & approves                        │
│                                                                 │
│  4. BETWEEN GAMES                                               │
│     └─► Bracket winners auto-advance                            │
│     └─► Eliminator cuts auto-calculate                          │
│     └─► Standings update in real-time                           │
│                                                                 │
│  5. END OF EVENT                                                │
│     └─► Final standings calculated                              │
│     └─► Payouts displayed                                       │
│     └─► Cash out bowlers                                        │
│     └─► Generate reports (optional)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: Bowler - During Event

```text
┌─────────────────────────────────────────────────────────────────┐
│                    BOWLER: DURING EVENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. JOIN EVENT                                                  │
│     └─► Open app, enter access code "XK7M2P"                    │
│     └─► OR scan QR code                                         │
│     └─► See their lane assignment                               │
│                                                                 │
│  2. VIEW BRACKETS                                               │
│     └─► See which brackets they're in                           │
│     └─► See who they're bowling against this game               │
│     └─► Watch bracket progression live                          │
│                                                                 │
│  3. ENTER SCORES (if distributed scoring enabled)               │
│     └─► After each game, enter their score                      │
│     └─► Lane partner can also enter (verification)              │
│     └─► Wait for organizer approval                             │
│                                                                 │
│  4. VIEW STANDINGS                                              │
│     └─► See eliminator status (still in? cut?)                  │
│     └─► See high game leaderboard                               │
│     └─► See mystery doubles ranking                             │
│                                                                 │
│  5. END OF EVENT                                                │
│     └─► See what they won                                       │
│     └─► Collect winnings from organizer                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 4: Real-Time Updates

```text
┌─────────────────────────────────────────────────────────────────┐
│           REAL-TIME FLOW (What Makes Us Different)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Bowler A                    Server                   Bowler B │
│   (Lane 5)                    (Convex)                (Watching)│
│      │                           │                        │     │
│      │── Enters score: 210 ─────►│                        │     │
│      │                           │                        │     │
│      │                           │── Score saved ────────►│     │
│      │                           │                        │     │
│      │                           │── Bracket updated ────►│     │
│      │                           │   (John advances)      │     │
│      │                           │                        │     │
│      │                           │── Eliminator cut ─────►│     │
│      │                           │   recalculated         │     │
│      │                           │                        │     │
│      │◄── Confirmation ──────────│                        │     │
│      │                           │                        │     │
│   Total time: < 100ms            │                        │     │
│                                                                 │
│   Braxion: Would need to click "Refresh" to see updates         │
│   TBrac: Would need to print new bracket sheet                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Feature Checklist (Benchmark)

### Organizer Features

| Feature | Braxion | TBrac | Tournee | Status |
|---------|---------|-------|---------|--------|
| Create events | ✅ | ✅ | ✅ | Done |
| Add bowlers | ✅ | ✅ | ✅ | Done |
| Import bowlers (CSV) | ✅ | ✅ | ⬜ | TODO |
| Scratch brackets | ✅ | ✅ | ✅ | Done |
| Handicap brackets | ✅ | ✅ | ✅ | Done |
| 8/16/32 person brackets | ✅ | ✅ | ✅ | Done |
| Non-power-of-2 (BYEs) | ✅ | ✅ | ✅ | Done |
| Mystery doubles | ✅ | ✅ | ✅ | Done |
| Love doubles | ⬜ | ✅ | ✅ | Done |
| Eliminator | ✅ | ✅ | ✅ | Done |
| High game sidepot | ✅ | ✅ | ✅ | Done |
| High series sidepot | ✅ | ✅ | ✅ | Done |
| Sweeper | ✅ | ✅ | ✅ | Done |
| Quick score entry | ✅ | ✅ | ⬜ | TODO |
| Payout calculations | ✅ | ✅ | ✅ | Done |
| Refund calculations | ⬜ | ✅ | ✅ | Done |
| PDF export | ✅ | ✅ | ⬜ | TODO |
| Print brackets | ✅ | ✅ | ⬜ | TODO |
| **Real-time updates** | ❌ | ❌ | ✅ | Done |
| **Web-based** | ❌ | ❌ | ✅ | Done |
| **Mobile app** | ❌ | ❌ | ⬜ | TODO |
| **Distributed scoring** | ❌ | ❌ | ⬜ | TODO |
| **QR code join** | ❌ | ❌ | ⬜ | TODO |

### Bowler Features

| Feature | Braxion | TBrac | Tournee | Status |
|---------|---------|-------|---------|--------|
| View brackets | Print only | Print only | ✅ Live | Done |
| View standings | Print only | Print only | ⬜ | TODO |
| Self score entry | ❌ | ❌ | ⬜ | TODO |
| Push notifications | ❌ | ❌ | ⬜ | TODO |
| Personal history | ❌ | ❌ | ⬜ | TODO |

---

## Part 6: Payment Integration Ideas

### Option 1: Cash Only (Current Standard)

- Organizer collects cash
- Organizer pays out cash
- App just tracks who owes/is owed what

### Option 2: Plaid Integration (Future)

```text
Bowler pays entry fee → Plaid → Organizer's account
                              ↑
                    3% fee typical

End of event:
Organizer → Plaid → Bowler's account (payout)
                    ↑
              Instant or 1-2 days
```

### Option 3: Venmo/PayPal Display (Simple)

- Show QR code for organizer's Venmo
- Display payout amounts
- Manual confirmation in app

### Recommendation

Start with **cash tracking** (what we have). Add payment later. Most bowling leagues still prefer cash.

---

## Part 7: Glossary Quick Reference

| Term | Definition |
|------|------------|
| **Bracket** | Single elimination mini-tournament |
| **BYE** | Auto-advance when bracket isn't full |
| **Eliminator** | Bottom 50% cut each game |
| **Handicap** | Bonus pins for weaker bowlers |
| **Lineage** | Fee to bowling alley for lanes |
| **Mystery Doubles** | Random partner pairing |
| **Nassau** | High game each game (sidepot) |
| **Scratch** | Raw score, no handicap |
| **Sidepot** | Additional betting pool |
| **Sweeper** | All scores ranked, top X win |

---

## Sources

- [Braxion Official](https://www.braxion.com/)
- [USBC Open Championships Brackets](https://bowl.com/tournaments/open-championships/brackets)
- [BowlVersity - What Are Bowling Brackets](https://www.bowlingball.com/BowlVersity/what-are-bowling-brackets)
- [The Beast's Eliminator - Side Pots](https://www.tbebowling.com/sidepots)
- [Ball Reviews - Tournament Software Discussion](https://www.ballreviews.com/miscellaneous/what-is-the-best-bracket-and-tournament-software-a/)

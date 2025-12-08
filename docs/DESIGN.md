# Tournee - Design Reference & UI/UX Guidelines

This document outlines the design principles, UI patterns, and reference materials for building Tournee's interface.

---

## Design Philosophy

### Core Principles

1. **Speed Over Features** - Tournament organizers are busy. Every action should be 1-2 taps max.
2. **Mobile-First** - Most usage happens on phones at the bowling alley, not desktops.
3. **Glanceable** - Scores, standings, brackets should be readable from 3 feet away.
4. **Trust the Algorithm** - Once scores are in, calculations are automatic. No manual math.
5. **Real-Time Everything** - Convex gives us live updates. Use them everywhere.

### What Makes Us Different from TBrac/Keglerz

| Problem with Existing Apps | Our Solution |
|---------------------------|--------------|
| Windows-only, ancient UI | Web-based, modern design |
| Organizer enters ALL scores | **Distributed scoring** - bowlers enter their own |
| Print brackets on paper | Live digital brackets on any device |
| No real-time updates | Instant sync via Convex subscriptions |
| Complicated, cluttered screens | Clean, focused interfaces |

---

## Reference Apps & Inspiration

### Tournament Platforms (Study Their Flows)

| Platform | What to Learn | Link |
|----------|---------------|------|
| **Challonge** | Simple bracket creation, drag-and-drop management | [challonge.com](https://challonge.com) |
| **start.gg** | Player registration, seeding, live stats integration | [start.gg](https://start.gg) |
| **Toornament** | Multi-format support, professional-grade management | [toornament.com](https://www.toornament.com) |
| **Bracket HQ** | Beautiful bracket themes, easy customization | [brackethq.com](https://brackethq.com) |

### Design Inspiration (Dribbble/Figma)

| Resource | What It Shows |
|----------|---------------|
| [Dribbble - Tournament Brackets](https://dribbble.com/tags/tournament_bracket) | Visual bracket designs |
| [Dribbble - Event Dashboards](https://dribbble.com/tags/event-dashboard) | Dashboard layouts |
| [Figma - Ventixe Event Dashboard](https://www.figma.com/community/file/1482921791678828657) | Modern event management UI |
| [Figma - Eventure Dashboard Kit](https://www.figma.com/community/file/1522275304458318279) | Booking/event tracking |
| [Figma - Live Score UI Kit](https://www.figma.com/community/file/1258396396224490382) | Sports scoring interfaces |
| [Figma - E-sport Tournaments](https://www.figma.com/community/file/1291311311657449934) | Mobile tournament app concept |

### Dashboard Templates (Code)

| Template | Tech Stack | Best For |
|----------|------------|----------|
| [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) | Next.js 16 + Shadcn | Data tables, forms, charts |
| [Shadcn Admin](https://www.shadcn.io/template/satnaing-shadcn-admin) | Vite + React + Shadcn | 10+ pre-built pages |
| [Shadcnblocks Admin](https://www.shadcnblocks.com/admin-dashboard) | Next.js 15 + Shadcn | Complex tables, filtering |

---

## Open Source Components to Use

### Bracket Visualization

| Package | Description | npm |
|---------|-------------|-----|
| **@g-loot/react-tournament-brackets** | Best option - single/double elimination, theming, pan/zoom | [npm](https://www.npmjs.com/package/@g-loot/react-tournament-brackets) |
| **react-brackets** | Simpler alternative, customizable | [npm](https://www.npmjs.com/package/react-brackets) |

```bash
bun add @g-loot/react-tournament-brackets
```

### UI Components (Already Using)

- **Shadcn/UI** - Our component library
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon set
- **React Hook Form + Zod** - Forms and validation

---

## Screen-by-Screen UI Guidelines

### 1. Dashboard (Home)

**Purpose:** Quick overview of all events, recent activity

**Layout:**

```text
┌─────────────────────────────────────┐
│  [Logo]              [User Avatar]  │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Active  │ │ Total   │ │ Money  │ │
│  │ Events  │ │ Bowlers │ │ Owed   │ │
│  │   3     │ │   47    │ │ $1,240 │ │
│  └─────────┘ └─────────┘ └────────┘ │
├─────────────────────────────────────┤
│  Recent Events                      │
│  ┌─────────────────────────────────┐│
│  │ Friday Night Brackets  [Live]  ││
│  │ Dec 6, 2024 • 24 bowlers       ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ League Night Week 12           ││
│  │ Dec 4, 2024 • 32 bowlers       ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│        [+ Create Event]             │
└─────────────────────────────────────┘
```

**Key Patterns:**

- Stats cards at top (3-4 max)
- Recent events as tappable cards
- Floating action button for creation
- Use Shadcn `Card` component

---

### 2. Event Dashboard (Single Event)

**Purpose:** Command center during a tournament

**Layout:**

```text
┌─────────────────────────────────────┐
│  ← Friday Night Brackets    [...]   │
├─────────────────────────────────────┤
│  Status: LIVE    Entries: 24/32     │
│  Prize Pool: $480   Lineage: $120   │
├─────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌──────────┐ │
│  │Brackets│ │Sidepots│ │  Scores  │ │
│  │   2    │ │   4    │ │  Enter   │ │
│  └────────┘ └────────┘ └──────────┘ │
├─────────────────────────────────────┤
│  Quick Actions                      │
│  [Check In] [Enter Scores] [Payouts]│
├─────────────────────────────────────┤
│  Pending Approvals (3)         ▼    │
│  • Lane 5: John D. - 210, 185       │
│  • Lane 7: Mike S. - 195, 220       │
└─────────────────────────────────────┘
```

**Key Patterns:**

- Status bar with live indicators
- Tab-like navigation for sections
- Pending approvals (distributed scoring) prominent
- Quick actions as large buttons

---

### 3. Score Entry (The Money Screen)

**Purpose:** Fast score input - used 50+ times per event

**Mobile Keypad Design:**

```text
┌─────────────────────────────────────┐
│  Enter Score - John Doe             │
│  Lane 5 • Game 2                    │
├─────────────────────────────────────┤
│                                     │
│           ┌─────────┐               │
│           │   185   │               │
│           └─────────┘               │
│                                     │
├─────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │  1  │  │  2  │  │  3  │         │
│  └─────┘  └─────┘  └─────┘         │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │  4  │  │  5  │  │  6  │         │
│  └─────┘  └─────┘  └─────┘         │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │  7  │  │  8  │  │  9  │         │
│  └─────┘  └─────┘  └─────┘         │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │  ⌫  │  │  0  │  │  ✓  │         │
│  └─────┘  └─────┘  └─────┘         │
└─────────────────────────────────────┘
```

**Critical Requirements:**

- **Large touch targets** - minimum 48x48px, ideally 64x64px
- **Custom numeric keypad** - don't rely on system keyboard
- **Instant feedback** - haptic on tap, visual confirmation
- **No decimal needed** - bowling scores are whole numbers (0-300)
- **Auto-advance** - after entering, jump to next bowler
- Use `inputmode="numeric" pattern="[0-9]*"` for native keyboards as fallback

**Score Grid (Spreadsheet View):**

```text
┌─────────────────────────────────────┐
│  Scores - Game 2                    │
├──────┬───────┬───────┬───────┬──────┤
│ Lane │ Name  │ Gm 1  │ Gm 2  │ Gm 3 │
├──────┼───────┼───────┼───────┼──────┤
│  1   │ John  │  185  │ [___] │  -   │
│  1   │ Mike  │  210  │ [___] │  -   │
│  2   │ Sarah │  195  │ [___] │  -   │
│  2   │ Tom   │  178  │ [___] │  -   │
└──────┴───────┴───────┴───────┴──────┘
```

---

### 4. Bracket View

**Purpose:** Visual tournament progression

**Key Patterns:**

- Use `@g-loot/react-tournament-brackets` for rendering
- Click/tap match to enter scores
- Winner highlighted, loser grayed
- Pan and zoom for large brackets (16+)
- Show handicap scores in parentheses

**Visual Hierarchy:**

```text
Round 1          Semis           Finals
┌─────────┐
│ John 210│──┐
└─────────┘  │   ┌─────────┐
             ├──►│ John 195│──┐
┌─────────┐  │   └─────────┘  │
│ Mike 185│──┘                │   ┌─────────┐
└─────────┘                   ├──►│ John    │ WINNER
                              │   └─────────┘
┌─────────┐                   │
│ Sarah220│──┐                │
└─────────┘  │   ┌─────────┐  │
             ├──►│Sarah 205│──┘
┌─────────┐  │   └─────────┘
│ Tom  180│──┘
└─────────┘
```

---

### 5. Leaderboard / Standings

**Purpose:** Show rankings for sidepots, sweepers

**Best Practices (from research):**

1. **Show top 10 prominently** - with names and scores
2. **Highlight current user's position** - even if not in top 10
3. **Show nearby competitors** - people +/- 2 positions from user
4. **Segment by type** - tabs for Eliminator, High Game, Sweeper
5. **Real-time updates** - WebSocket via Convex
6. **Keep it simple** - avoid cluttered designs

**Layout:**

```text
┌─────────────────────────────────────┐
│  High Game - Game 2                 │
├─────────────────────────────────────┤
│  🥇  1. John Doe        258        │
│  🥈  2. Mike Smith      245        │
│  🥉  3. Sarah Jones     242        │
│      4. Tom Wilson      238        │
│      5. Amy Brown       235        │
├─────────────────────────────────────┤
│  ...                                │
│     12. YOU (Guest)     198        │
│     13. Bob Green       195        │
└─────────────────────────────────────┘
```

---

### 6. Distributed Score Entry (Bowler View)

**Purpose:** Let bowlers submit their own scores

**Flow:**

1. Bowler opens app/scans QR
2. Enters event code or auto-joins
3. Sees their lane assignment
4. Enters scores after each game
5. Hits "Submit for Approval"
6. Organizer reviews and approves

**Bowler Screen:**

```text
┌─────────────────────────────────────┐
│  Friday Night Brackets              │
│  You're on Lane 5                   │
├─────────────────────────────────────┤
│                                     │
│  Game 1:  [  185  ]  ✓ Approved     │
│  Game 2:  [  ___  ]  Enter score    │
│  Game 3:  [  ---  ]  Not started    │
│                                     │
├─────────────────────────────────────┤
│        [Submit Scores]              │
├─────────────────────────────────────┤
│  Your Standings:                    │
│  Bracket: Round 2 (vs Mike S.)      │
│  Eliminator: Still In (48 left)     │
│  High Game: 12th place              │
└─────────────────────────────────────┘
```

**Approval Queue (Organizer):**

```text
┌─────────────────────────────────────┐
│  Pending Approvals (5)              │
├─────────────────────────────────────┤
│  Lane 5                    [Approve]│
│  John: 185  Mike: 210              │
├─────────────────────────────────────┤
│  Lane 7                    [Approve]│
│  Sarah: 195  Tom: 178              │
├─────────────────────────────────────┤
│  Lane 9                    [Approve]│
│  Amy: 220  Bob: 165                │
└─────────────────────────────────────┘
        [Approve All Visible]
```

---

## Color & Typography

### Color Palette

Use Shadcn's default with bowling-appropriate accents:

```css
/* Primary - Action buttons, links */
--primary: 222.2 47.4% 11.2%; /* Dark blue-gray */

/* Accent - Highlights, winners */
--accent: 142.1 76.2% 36.3%; /* Green for success */

/* Warning - Money, attention */
--warning: 45.4 93.4% 47.5%; /* Gold/yellow */

/* Destructive - Errors, eliminations */
--destructive: 0 84.2% 60.2%; /* Red */
```

### Typography

- **Headings:** System font stack (fast loading)
- **Scores:** Monospace (for alignment) - `font-variant-numeric: tabular-nums`
- **Large displays:** Bold, high contrast

---

## Mobile-First Patterns

### Touch Targets

- Minimum 44x44px (Apple HIG)
- Preferred 48x48px for primary actions
- Score entry buttons: 64x64px minimum

### Navigation

- Bottom tab bar for main sections
- Swipe gestures for bracket navigation
- Pull-to-refresh for live data

### Input Optimization

```html
<!-- For score entry -->
<input
  type="text"
  inputmode="numeric"
  pattern="[0-9]*"
  maxlength="3"
/>
```

### Offline Considerations

- Cache critical data locally
- Queue score entries when offline
- Sync when connection restored
- Show clear offline indicator

---

## Accessibility

- WCAG 2.1 AA compliance minimum
- High contrast mode support
- Screen reader friendly brackets (use proper table markup)
- Focus indicators for keyboard navigation
- Don't rely on color alone (use icons too)

---

## Implementation Priority

### Phase 1: Core Screens

1. Dashboard
2. Event Create/Edit
3. Bowler List
4. Score Entry (keypad)

### Phase 2: Tournament Flow

1. Bracket View
2. Match Scoring Modal
3. Standings/Leaderboard

### Phase 3: Distributed Scoring

1. Bowler Join Flow
2. Self Score Entry
3. Approval Queue

### Phase 4: Polish

1. Animations/transitions
2. Offline support
3. Print views

---

## Resources

### Design Systems

- [Shadcn/UI Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

### Research Sources

- [UI Patterns - Leaderboards](https://ui-patterns.com/patterns/leaderboard)
- [NN/G - Input Steppers](https://www.nngroup.com/articles/input-steppers/)
- [CSS Tricks - Numeric Inputs](https://css-tricks.com/finger-friendly-numerical-inputs-with-inputmode/)
- [Smashing Magazine - Mobile Forms](https://www.smashingmagazine.com/2018/08/ux-html5-mobile-form-part-2/)
- [Interaction Design - Leaderboards](https://www.interaction-design.org/literature/topics/leaderboards)

### Figma Resources

- [Live Score UI Kit](https://www.figma.com/community/file/1258396396224490382)
- [Event Management Dashboard](https://www.figma.com/community/file/1482921791678828657)
- [E-sport Tournaments Mobile](https://www.figma.com/community/file/1291311311657449934)

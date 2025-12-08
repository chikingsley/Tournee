# Tournee

A modern, cross-platform bowling tournament management system built for organizers and bowlers.

## 🚀 Overview

Tournee allows tournament directors to easily manage events, brackets, sidepots, and payouts while providing bowlers with a real-time, engaging experience on their mobile devices.

## 🛠️ Tech Stack

This project is a monorepo managed with **Turborepo** and **Bun**.

- **Core Logic:** Pure TypeScript package (`packages/core`) with 100% test coverage for brackets, sidepots, and payouts.
- **Backend:** [Convex](https://convex.dev) (Real-time database & functions) + [Clerk](https://clerk.com) (Authentication).
- **Web App:** Next.js 15, React 19, TailwindCSS, shadcn/ui (`apps/web`).
- **Mobile App:** React Native with Expo 54 (`apps/mobile`).
- **Testing:** Vitest (Unit), Playwright (E2E).
- **Tooling:** Biome (Linting/Formatting), Lefthook (Git hooks).

## 📂 Project Structure

```
├── apps/
│   ├── web/             # Next.js Organizer Dashboard
│   ├── mobile/          # Expo React Native App (iOS/Android)
│   └── docs/            # Documentation & Examples
├── packages/
│   ├── core/            # Shared business logic (Brackets, Sidepots, Scoring)
│   ├── ui/              # Shared React UI components
│   ├── typescript-config/ # Shared TS configs
│   └── eslint-config/   # Shared ESLint configs (legacy, migrating to Biome)
├── convex/              # Backend functions & schema
└── docs/
    └── examples/        # Standalone example apps (e.g. tbrac-ai-studio-app)
```

## ⚡ Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- Node.js (v20+)

### Installation

```bash
# Install dependencies
bun install
```

### Running Locally

```bash
# Start the backend and web app concurrently
bun run dev

# Run unit tests
bun run test
```

### Environment Setup

1. Copy `.env.example` to `.env.local` in `apps/web`.
2. Set up a Convex project and add `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`.
3. Set up a Clerk project and add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

## 🧪 Testing

We use Vitest for unit testing the core logic and Playwright for E2E testing.

```bash
# Run core logic tests
bun filter @workspace/core test

# Run type checking
bun run lint
```

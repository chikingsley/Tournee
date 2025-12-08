import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-bold text-xl">Tournee</h1>
          <div className="flex gap-2">
            <SignedOut>
              <Link href="/sign-in">
                <Button size="sm" variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="mb-4 font-bold text-4xl tracking-tight md:text-6xl">
            Modern Bowling Tournament Management
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Run brackets, sidepots, and leagues with real-time updates. No more
            paper sign-up sheets or hand-drawn brackets.
          </p>
          <div className="flex justify-center gap-4">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg">Start Free</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold text-lg">Brackets</h3>
              <p className="text-muted-foreground text-sm">
                Single elimination brackets for 4-64 bowlers with automatic BYE
                handling and live updates.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold text-lg">Sidepots</h3>
              <p className="text-muted-foreground text-sm">
                High game, eliminators, mystery doubles, and sweepers with
                automatic payouts.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold text-lg">Real-time</h3>
              <p className="text-muted-foreground text-sm">
                Bowlers see live bracket updates and standings. No more waiting
                for printouts.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

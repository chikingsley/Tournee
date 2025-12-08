"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useQuery } from "convex/react";
import { CalendarDays, DollarSign, Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "success" | "warning" | "outline"
  > = {
    draft: "secondary",
    open: "warning",
    in_progress: "success",
    completed: "outline",
  };
  return <Badge variant={variants[status] || "default"}>{status}</Badge>;
}

export default function DashboardPage() {
  const events = useQuery(api.events.list);
  const user = useQuery(api.users.current);
  const isLoading = events === undefined;

  // Calculate stats
  const activeEvents =
    events?.filter((e) => e.status === "in_progress").length ?? 0;
  const totalBowlers = 0; // TODO: Get from bowlers query
  const totalPrizePool = 0; // TODO: Calculate from events

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your events.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Events</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{events?.length ?? 0}</div>
            )}
            <p className="text-muted-foreground text-xs">
              {activeEvents} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Events</CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{activeEvents}</div>
            )}
            <p className="text-muted-foreground text-xs">
              In progress right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Bowlers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalBowlers}</div>
            <p className="text-muted-foreground text-xs">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Prize Pool</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">${totalPrizePool}</div>
            <p className="text-muted-foreground text-xs">Total distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Your most recent tournament events
            </CardDescription>
          </div>
          <Link href="/dashboard/events/new">
            <Button size="sm">
              <Plus className="size-4" />
              New Event
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div className="flex items-center gap-4" key={i}>
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : events?.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto size-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold text-lg">No events yet</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Create your first event to get started.
              </p>
              <Link href="/dashboard/events/new">
                <Button>
                  <Plus className="size-4" />
                  Create Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events?.slice(0, 5).map((event) => (
                <Link
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  href={`/dashboard/events/${event._id}`}
                  key={event._id}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                      <Trophy className="size-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{event.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {event.date} • {event.location || "No location"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={event.status} />
                </Link>
              ))}
              {events && events.length > 5 ? (
                <Link
                  className="block text-center text-muted-foreground text-sm hover:text-foreground"
                  href="/dashboard/events"
                >
                  View all {events.length} events →
                </Link>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/events/new">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="size-5" />
                Create Event
              </CardTitle>
              <CardDescription>
                Start a new tournament or league
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/bowlers">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-5" />
                Manage Bowlers
              </CardTitle>
              <CardDescription>
                Add or import bowlers to your database
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/events">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-5" />
                View All Events
              </CardTitle>
              <CardDescription>
                See all your past and upcoming events
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

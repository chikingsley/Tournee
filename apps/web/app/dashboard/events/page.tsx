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
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  Filter,
  MapPin,
  Plus,
  Search,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";

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
  const labels: Record<string, string> = {
    draft: "Draft",
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <Badge variant={variants[status] || "default"}>
      {labels[status] || status}
    </Badge>
  );
}

export default function EventsPage() {
  const events = useQuery(api.events.list);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const isLoading = events === undefined;

  // Filter events
  const filteredEvents = events?.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group events by status for quick filters
  const statusCounts = events?.reduce(
    (acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage your tournaments and leagues
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="size-4" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                value={search}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setStatusFilter(null)}
                size="sm"
                variant={statusFilter === null ? "default" : "outline"}
              >
                All ({events?.length || 0})
              </Button>
              <Button
                onClick={() => setStatusFilter("in_progress")}
                size="sm"
                variant={statusFilter === "in_progress" ? "default" : "outline"}
              >
                Active ({statusCounts?.in_progress || 0})
              </Button>
              <Button
                onClick={() => setStatusFilter("draft")}
                size="sm"
                variant={statusFilter === "draft" ? "default" : "outline"}
              >
                Draft ({statusCounts?.draft || 0})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {events?.length === 0 ? (
              <>
                <CalendarDays className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">No events yet</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Create your first event to get started organizing tournaments.
                </p>
                <Link href="/dashboard/events/new">
                  <Button>
                    <Plus className="size-4" />
                    Create Your First Event
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Filter className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">
                  No matching events
                </h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search or filter criteria.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents?.map((event) => (
            <Link href={`/dashboard/events/${event._id}`} key={event._id}>
              <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Trophy className="size-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {event.type}
                        </CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CalendarDays className="size-4" />
                    <span>{event.date}</span>
                  </div>
                  {event.location ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="size-4" />
                      <span>{event.location}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground text-sm">
                      {event.scoringType === "handicap"
                        ? "Handicap"
                        : "Scratch"}{" "}
                      scoring
                    </span>
                    <span className="font-mono text-muted-foreground text-xs">
                      {event.accessCode}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCopy,
  Edit,
  MapPin,
  MoreHorizontal,
  Play,
  QrCode,
  Settings,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

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
    open: "Open for Registration",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <Badge variant={variants[status] || "default"}>
      {labels[status] || status}
    </Badge>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as Id<"events">;

  const event = useQuery(api.events.get, { id: eventId });
  const bowlers = useQuery(api.events.getBowlers, { eventId });
  const updateEvent = useMutation(api.events.update);
  const deleteEvent = useMutation(api.events.remove);

  const isLoading = event === undefined;

  const handleCopyAccessCode = () => {
    if (event?.accessCode) {
      navigator.clipboard.writeText(event.accessCode);
    }
  };

  const handleStatusChange = async (
    newStatus: "draft" | "open" | "in_progress" | "completed"
  ) => {
    await updateEvent({ id: eventId, status: newStatus });
  };

  const handleDelete = async () => {
    // TODO: Replace with proper confirmation dialog component
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );
    if (confirmed) {
      await deleteEvent({ id: eventId });
      router.push("/dashboard/events");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-semibold text-xl">Event not found</h2>
        <p className="mb-4 text-muted-foreground">
          This event may have been deleted.
        </p>
        <Link href="/dashboard/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/events">
            <Button className="mt-1" size="icon" variant="ghost">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-3xl tracking-tight">
                {event.name}
              </h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-muted-foreground capitalize">{event.type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Edit className="size-4" />
            Edit
          </Button>
          <Button onClick={handleDelete} size="sm" variant="outline">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Bowlers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{bowlers?.length ?? 0}</div>
            <p className="text-muted-foreground text-xs">registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Brackets</CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Sidepots</CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Prize Pool</CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$0</div>
            <p className="text-muted-foreground text-xs">total</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Details & Access Code */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Date</p>
                  <p className="text-muted-foreground text-sm">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Location</p>
                  <p className="text-muted-foreground text-sm">
                    {event.location || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Scoring</p>
                  <p className="text-muted-foreground text-sm capitalize">
                    {event.scoringType}
                    {event.scoringType === "handicap" &&
                      ` (${event.handicapPercentage}% of ${event.handicapBase})`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Code</CardTitle>
            <CardDescription>
              Share this code with bowlers to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
              <span className="font-bold font-mono text-2xl tracking-widest">
                {event.accessCode}
              </span>
              <Button
                onClick={handleCopyAccessCode}
                size="icon"
                variant="ghost"
              >
                <ClipboardCopy className="size-4" />
              </Button>
            </div>
            <Button className="w-full" variant="outline">
              <QrCode className="size-4" />
              Show QR Code
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Event Status</CardTitle>
          <CardDescription>
            Update the current status of your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {event.status === "draft" && (
              <Button onClick={() => handleStatusChange("open")}>
                <Play className="size-4" />
                Open Registration
              </Button>
            )}
            {event.status === "open" && (
              <Button onClick={() => handleStatusChange("in_progress")}>
                <Play className="size-4" />
                Start Event
              </Button>
            )}
            {event.status === "in_progress" && (
              <Button onClick={() => handleStatusChange("completed")}>
                Complete Event
              </Button>
            )}
            {event.status !== "draft" && (
              <Button
                onClick={() => handleStatusChange("draft")}
                variant="outline"
              >
                Back to Draft
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-5" />
              Manage Bowlers
            </CardTitle>
            <CardDescription>Add bowlers and check them in</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-5" />
              Create Bracket
            </CardTitle>
            <CardDescription>Set up elimination brackets</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MoreHorizontal className="size-5" />
              Add Sidepot
            </CardTitle>
            <CardDescription>
              Mystery doubles, eliminators, and more
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

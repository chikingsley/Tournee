"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useMutation } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { api } from "../../../../../../convex/_generated/api";

type EventFormData = {
  name: string;
  type: "tournament" | "league";
  date: string;
  location?: string;
  scoringType: "scratch" | "handicap";
  handicapBase?: number;
  handicapPercentage?: number;
  maxHandicap?: number;
};

export default function NewEventPage() {
  const router = useRouter();
  const createEvent = useMutation(api.events.create);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    defaultValues: {
      type: "tournament",
      scoringType: "handicap",
      handicapBase: 220,
      handicapPercentage: 90,
      maxHandicap: 60,
    },
  });

  const scoringType = watch("scoringType");

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventId = await createEvent({
        name: data.name,
        type: data.type,
        date: data.date,
        location: data.location || undefined,
        scoringType: data.scoringType,
        handicapBase:
          data.scoringType === "handicap"
            ? (data.handicapBase ?? 220)
            : undefined,
        handicapPercentage:
          data.scoringType === "handicap"
            ? (data.handicapPercentage ?? 90)
            : undefined,
        maxHandicap:
          data.scoringType === "handicap"
            ? (data.maxHandicap ?? 60)
            : undefined,
      });
      router.push(`/dashboard/events/${eventId}`);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Create Event</h1>
          <p className="text-muted-foreground">
            Set up a new tournament or league
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the essential details for your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                placeholder="Friday Night Brackets"
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type *</Label>
                <Select
                  defaultValue="tournament"
                  onValueChange={(value) =>
                    setValue("type", value as "tournament" | "league")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="league">League</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date ? (
                  <p className="text-destructive text-sm">
                    {errors.date.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Strike Zone Lanes"
                {...register("location")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scoring Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scoring Settings</CardTitle>
            <CardDescription>
              Configure how scores are calculated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Scoring Type *</Label>
              <Select
                defaultValue="handicap"
                onValueChange={(value) =>
                  setValue("scoringType", value as "scratch" | "handicap")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scoring type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handicap">Handicap</SelectItem>
                  <SelectItem value="scratch">Scratch</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {scoringType === "handicap"
                  ? "Handicap adds bonus pins to level the playing field"
                  : "Scratch uses actual scores with no adjustments"}
              </p>
            </div>

            {scoringType === "handicap" && (
              <div className="grid gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="handicapBase">Base Average</Label>
                  <Input
                    id="handicapBase"
                    placeholder="220"
                    type="number"
                    {...register("handicapBase", { valueAsNumber: true })}
                  />
                  <p className="text-muted-foreground text-xs">
                    Score to calculate from
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handicapPercentage">Percentage</Label>
                  <Input
                    id="handicapPercentage"
                    max="100"
                    min="0"
                    placeholder="90"
                    type="number"
                    {...register("handicapPercentage", { valueAsNumber: true })}
                  />
                  <p className="text-muted-foreground text-xs">
                    % of difference added
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxHandicap">Max Handicap</Label>
                  <Input
                    id="maxHandicap"
                    placeholder="60"
                    type="number"
                    {...register("maxHandicap", { valueAsNumber: true })}
                  />
                  <p className="text-muted-foreground text-xs">
                    Cap on bonus pins
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link className="flex-1" href="/dashboard/events">
            <Button className="w-full" type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button className="flex-1" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

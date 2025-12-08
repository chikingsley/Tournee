"use client";

import { UserButton } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import {
  CalendarDays,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Events", href: "/dashboard/events", icon: CalendarDays },
  { name: "Bowlers", href: "/dashboard/bowlers", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link className="font-bold text-xl" href="/dashboard">
              Tournee
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    href={item.href}
                    key={item.name}
                  >
                    <item.icon className="size-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/events/new">
              <Button size="sm">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Event</span>
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t bg-background md:hidden">
        <div className="flex justify-around py-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                href={item.href}
                key={item.name}
              >
                <item.icon className="size-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}

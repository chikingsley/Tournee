"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableColorScheme
          enableSystem
        >
          {children}
        </NextThemesProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

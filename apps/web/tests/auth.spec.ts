import { expect, test } from "@playwright/test";
import { createTestUser, signInWithClerk } from "./utils/clerk-testing";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
const TEST_PASSWORD = "TourneeB0wl1ng$2024Xq!";
// Use consistent email for reusable test user
const TEST_EMAIL = "test-auth@tournee-test.com";

test.describe("Authentication", () => {
  let testUser: { id: string; email: string } | null = null;

  test.beforeAll(async () => {
    // Create or get existing test user via Clerk API
    if (CLERK_SECRET_KEY) {
      testUser = await createTestUser(CLERK_SECRET_KEY, {
        email: TEST_EMAIL,
        firstName: "Test",
        lastName: "User",
      });
    }
  });

  // Don't delete test user - reuse across runs

  test("landing page shows sign in button when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Get Started" })
    ).toBeVisible();
  });

  test("sign in redirects to dashboard", async ({ page }) => {
    test.skip(!testUser, "No test user created - set CLERK_SECRET_KEY");

    await signInWithClerk(
      page,
      testUser!.email,
      TEST_PASSWORD,
      CLERK_SECRET_KEY,
      testUser!.id
    );
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("dashboard is protected - redirects to sign in", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test("authenticated user sees dashboard button on landing", async ({
    page,
  }) => {
    test.skip(!testUser, "No test user created - set CLERK_SECRET_KEY");

    await signInWithClerk(
      page,
      testUser!.email,
      TEST_PASSWORD,
      CLERK_SECRET_KEY,
      testUser!.id
    );
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Dashboard", exact: true })
    ).toBeVisible();
  });
});

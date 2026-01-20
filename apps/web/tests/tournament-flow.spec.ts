import { expect, test } from "@playwright/test";
import { createTestUser, signInWithClerk } from "./utils/clerk-testing";
import { simulateBracketResults } from "./utils/convex-testing";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
const TEST_PASSWORD = "TourneeB0wl1ng$2024Xq!";
const TEST_EMAIL = "test-organizer@tournee-test.com";

test.describe("Tournament Flow", () => {
  let testUser: { id: string; email: string } | null = null;

  test.beforeAll(async () => {
    if (CLERK_SECRET_KEY) {
      testUser = await createTestUser(CLERK_SECRET_KEY, {
        email: TEST_EMAIL,
        firstName: "Tournament",
        lastName: "Organizer",
      });
    }
  });

  test("full tournament simulation", async ({ page }) => {
    test.skip(!testUser, "No test user created - set CLERK_SECRET_KEY");
    test.slow(); // This test takes longer

    // 1. Sign in as organizer
    await signInWithClerk(
      page,
      testUser!.email,
      TEST_PASSWORD,
      CLERK_SECRET_KEY,
      testUser!.id
    );
    await expect(page).toHaveURL("/dashboard");

    // 2. Create event (when UI exists)
    // await page.getByRole('button', { name: 'Create Event' }).click();
    // await page.getByLabel('Event Name').fill('Test Tournament');
    // await page.getByLabel('Date').fill('2025-01-15');
    // await page.getByRole('button', { name: 'Create' }).click();

    // 3. Add bowlers (when UI exists)
    // for (let i = 1; i <= 8; i++) {
    //   await page.getByRole('button', { name: 'Add Bowler' }).click();
    //   await page.getByLabel('Name').fill(`Bowler ${i}`);
    //   await page.getByLabel('Average').fill(String(150 + i * 5));
    //   await page.getByRole('button', { name: 'Save' }).click();
    // }

    // 4. Create bracket (when UI exists)
    // await page.getByRole('button', { name: 'Create Bracket' }).click();
    // await page.getByLabel('Size').selectOption('8');
    // await page.getByLabel('Entry Fee').fill('5');

    // 5. Simulate matches
    const results = simulateBracketResults(8);
    expect(results.length).toBe(7); // 4 + 2 + 1 matches

    // TODO: Complete when dashboard UI is built
    // For now, just verify we can access dashboard
    await expect(
      page.getByRole("heading", { name: "Events", exact: true })
    ).toBeVisible();
  });

  test("bracket results are calculated correctly", async () => {
    const results = simulateBracketResults(8);

    // 8-person bracket should have 7 matches
    expect(results.length).toBe(7);

    // No ties allowed
    for (const match of results) {
      expect(match.bowler1Score).not.toBe(match.bowler2Score);
    }

    // Scores should be in valid range
    for (const match of results) {
      expect(match.bowler1Score).toBeGreaterThanOrEqual(150);
      expect(match.bowler1Score).toBeLessThan(300);
      expect(match.bowler2Score).toBeGreaterThanOrEqual(150);
      expect(match.bowler2Score).toBeLessThan(300);
    }
  });
});

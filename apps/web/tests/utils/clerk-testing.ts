import type { Page } from "@playwright/test";

/**
 * Clerk Testing Utilities
 *
 * For programmatic auth testing, this uses Clerk's sign-in token API
 * to create one-time-use tokens that bypass email verification.
 *
 * Setup required:
 * 1. Set CLERK_SECRET_KEY for API access
 */

type TestUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

// Create a test user via Clerk API (or get existing one)
export async function createTestUser(
  clerkSecretKey: string,
  userData: { email: string; firstName: string; lastName: string }
): Promise<TestUser> {
  // Try to create new user first
  const response = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [userData.email],
      first_name: userData.firstName,
      last_name: userData.lastName,
      password: "TourneeB0wl1ng$2024Xq!",
      skip_password_checks: true,
    }),
  });

  if (response.ok) {
    const user = await response.json();
    return {
      id: user.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };
  }

  // If user already exists, search for them
  const errorData = await response.json();
  const errorCode = errorData.errors?.[0]?.code;
  if (
    errorCode === "email_address_exists" ||
    errorCode === "form_identifier_exists"
  ) {
    // Search for existing user using query param
    const searchResponse = await fetch(
      `https://api.clerk.com/v1/users?query=${encodeURIComponent(userData.email)}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      // Find user with matching email
      const users = searchData.data || searchData;
      for (const user of users) {
        const emails = user.email_addresses || [];
        for (const emailObj of emails) {
          if (emailObj.email_address === userData.email) {
            return {
              id: user.id,
              email: userData.email,
              firstName: user.first_name || userData.firstName,
              lastName: user.last_name || userData.lastName,
            };
          }
        }
      }
    }
  }

  throw new Error(
    `Failed to create/find test user: ${JSON.stringify(errorData)}`
  );
}

// Delete a test user
export async function deleteTestUser(
  clerkSecretKey: string,
  userId: string
): Promise<void> {
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete test user: ${error}`);
  }
}

// Create a sign-in token for a user (bypasses email verification)
async function createSignInToken(
  clerkSecretKey: string,
  userId: string
): Promise<string> {
  const response = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 300, // 5 minutes
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create sign-in token: ${error}`);
  }

  const data = await response.json();
  // Append redirect_url to the sign-in URL
  const url = new URL(data.url);
  url.searchParams.set("redirect_url", "http://localhost:3000/dashboard");
  return url.toString();
}

// Sign in using Clerk sign-in token (bypasses UI flow and email verification)
export async function signInWithClerk(
  page: Page,
  _email: string,
  _password: string,
  clerkSecretKey?: string,
  userId?: string
): Promise<void> {
  if (!(clerkSecretKey && userId)) {
    throw new Error(
      "clerkSecretKey and userId are required for token-based sign-in"
    );
  }

  // Get the sign-in token URL from Clerk API
  const signInUrl = await createSignInToken(clerkSecretKey, userId);

  // Navigate to the Clerk-provided sign-in URL
  await page.goto(signInUrl);

  // Wait for redirect to dashboard after sign-in completes
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}

// Sign up via Clerk UI
export async function signUpWithClerk(
  page: Page,
  email: string,
  _password: string,
  _firstName: string,
  _lastName: string
): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  // Complete verification flow based on your Clerk setup
}

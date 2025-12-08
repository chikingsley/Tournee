// Configure Clerk as the authentication provider
// See: https://docs.convex.dev/auth/clerk

export default {
  providers: [
    {
      // Your Clerk JWT issuer domain (e.g., "https://your-app.clerk.accounts.dev")
      // Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard environment variables
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};

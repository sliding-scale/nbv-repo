import type { AuthConfig } from "convex/server";

export default {
  providers: [
    // Admin dashboard: Clerk sign-in tokens. Set the issuer on each deployment:
    //   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
    // (Clerk dashboard → Configure → Integrations → Convex shows the exact URL.)
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
    // Parent app: tokens issued by Convex Auth on this deployment (convex/auth.ts).
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

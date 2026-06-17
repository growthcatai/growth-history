import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./auth-schema";
import { env } from "cloudflare:workers";

export function getAuth(d1: D1Database, baseURL?: string, secret?: string) {
  const db = drizzle(d1);
  
  // Sensible defaults for development/local environments
  const resolvedBaseURL = baseURL || "http://localhost:4321";
  const resolvedSecret = secret || "growth-history-better-auth-secret-key-32-chars-long";

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    secret: resolvedSecret,
    baseURL: resolvedBaseURL,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: (env as any).GOOGLE_CLIENT_ID || "mock-google-client-id.apps.googleusercontent.com",
        clientSecret: (env as any).GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
      },
      facebook: {
        clientId: (env as any).FACEBOOK_CLIENT_ID || "mock-facebook-client-id",
        clientSecret: (env as any).FACEBOOK_CLIENT_SECRET || "mock-facebook-client-secret",
      }
    }
  });
}

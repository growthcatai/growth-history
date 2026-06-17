import { getAuth } from "../../../lib/auth";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
  const d1 = (env as any).DB;
  if (!d1) {
    return new Response("Cloudflare D1 Database binding is missing", { status: 500 });
  }

  const baseURL = (env as any).BETTER_AUTH_URL || ctx.url.origin;
  const secret = (env as any).BETTER_AUTH_SECRET;

  const auth = getAuth(d1, baseURL, secret);
  return auth.handler(ctx.request);
};

import { getAuth } from "./lib/auth";
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
  const d1 = (env as any).DB;
  
  if (d1) {
    const baseURL = (env as any).BETTER_AUTH_URL || context.url.origin;
    const secret = (env as any).BETTER_AUTH_SECRET;
    
    try {
      const auth = getAuth(d1, baseURL, secret);
      const isAuthed = await auth.api.getSession({
        headers: context.request.headers
      });

      if (isAuthed) {
        context.locals.user = isAuthed.user;
        context.locals.session = isAuthed.session;
      } else {
        context.locals.user = null;
        context.locals.session = null;
      }
    } catch (e) {
      console.error("Failed to fetch session in middleware:", e);
      context.locals.user = null;
      context.locals.session = null;
    }
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }
  
  return next();
});

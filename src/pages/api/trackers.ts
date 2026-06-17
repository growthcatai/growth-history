import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

// 1. GET /api/trackers - List user's active trackers from D1
export const GET: APIRoute = async (ctx) => {
  const user = ctx.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 418, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const d1 = (env as any).DB;
  if (!d1) {
    return new Response(JSON.stringify({ error: "Database not bound" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  try {
    const { results } = await d1
      .prepare("SELECT * FROM user_trackers WHERE userId = ? ORDER BY createdAt DESC")
      .bind(user.id)
      .all();

    return new Response(JSON.stringify({ trackers: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
};

// 2. POST /api/trackers - Save a new brand tracker to D1
export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const d1 = (env as any).DB;
  if (!d1) {
    return new Response(JSON.stringify({ error: "Database not bound" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  try {
    const body = await ctx.request.json();
    const { name, slug, x, instagram, tiktok, linkedin } = body;

    if (!name || !slug) {
      return new Response(JSON.stringify({ error: "Name and Slug are required" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Check if slug is already taken globally in custom tracker indices
    const existing = await d1
      .prepare("SELECT id FROM user_trackers WHERE slug = ?")
      .bind(slug)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ error: "Slug is already in use" }), { 
        status: 409, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await d1
      .prepare(
        "INSERT INTO user_trackers (id, userId, slug, name, logoUrl, instagramHandle, xHandle, tiktokHandle, linkedinId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(id, user.id, slug, name, null, instagram || null, x || null, tiktok || null, linkedin || null, createdAt)
      .run();

    return new Response(JSON.stringify({ success: true, trackerId: id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
};

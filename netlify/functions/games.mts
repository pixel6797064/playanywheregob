import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { games } from "../../db/schema.js";

const HOSTS = new Set(["pc", "steam", "parsec", "gfn", "xcloud", "web", "other", "file"]);
const URL_OK = /^(https?|steam|parsec|moonlight):/i;

type Input = { id?: unknown; title?: unknown; host?: unknown; url?: unknown; local?: unknown; added?: unknown };

function clean(g: Input) {
  const id = typeof g.id === "string" ? g.id.slice(0, 64) : "";
  const title = typeof g.title === "string" ? g.title.trim().slice(0, 60) : "";
  const host = typeof g.host === "string" && HOSTS.has(g.host) ? g.host : "other";
  const local = g.local === true || g.local === 1;
  const url = !local && typeof g.url === "string" && URL_OK.test(g.url) ? g.url.slice(0, 2048) : null;
  const added = typeof g.added === "number" && Number.isFinite(g.added) ? Math.floor(g.added) : Date.now();
  if (!id || !title || (!local && !url)) return null;
  return { id, title, host, url, local, added };
}

export default async (req: Request) => {
  const user = await getUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const userId = user.id;

  if (req.method === "GET") {
    const rows = await db
      .select({ id: games.id, title: games.title, host: games.host, url: games.url, local: games.local, added: games.added })
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.added));
    return Response.json(rows);
  }

  if (req.method === "POST") {
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const list = (Array.isArray(body) ? body : [body]).slice(0, 500).map((g) => clean(g as Input));
    if (!list.length || list.some((g) => !g)) return Response.json({ error: "Invalid game" }, { status: 400 });
    await db
      .insert(games)
      .values(list.map((g) => ({ ...g!, userId })))
      .onConflictDoNothing();
    return Response.json({ ok: true }, { status: 201 });
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    await db.delete(games).where(and(eq(games.userId, userId), eq(games.id, id)));
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/games" };

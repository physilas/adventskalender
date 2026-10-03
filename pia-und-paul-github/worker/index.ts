export interface Env {
  DB: D1Database;
}

type Partner = "pia" | "paul";
type Calendar = { id: number; access_code_hash: string; season_year: number };
type Session = { partner: Partner };

const JSON_HEADERS = { "content-type": "application/json; charset=UTF-8" };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });
    try {
      const url = new URL(request.url);
      const response = await route(request, env, url.pathname);
      return withCors(response, request);
    } catch (error) {
      console.error(error);
      return withCors(json({ error: "Der Kalender ist gerade nicht erreichbar." }, 500), request);
    }
  },
};

async function route(request: Request, env: Env, path: string): Promise<Response> {
  if (path === "/api/calendar" && request.method === "GET") return readCalendar(request, env);
  if (path === "/api/setup" && request.method === "POST") return setup(request, env);
  if (path === "/api/session" && request.method === "POST") return signIn(request, env);
  if (path === "/api/answers" && request.method === "PUT") return saveAnswer(request, env);
  return json({ error: "Nicht gefunden." }, 404);
}

async function readCalendar(request: Request, env: Env): Promise<Response> {
  const calendar = await getCalendar(env);
  if (!calendar) return json({ configured: false });
  const session = await getSession(request, env);
  if (!session) return json({ configured: true, session: null, seasonYear: calendar.season_year });

  const status = seasonStatus(calendar.season_year);
  const partner = otherPartner(session.partner);
  const [own, received] = await Promise.all([
    env.DB.prepare("SELECT day, content FROM answers WHERE author = ?").bind(session.partner).all<{ day: number; content: string }>(),
    env.DB.prepare("SELECT day, content FROM answers WHERE author = ? AND day <= ?").bind(partner, status.revealThrough).all<{ day: number; content: string }>(),
  ]);
  return json({
    configured: true,
    session,
    seasonYear: calendar.season_year,
    status,
    ownAnswers: Object.fromEntries(own.results.map((row) => [row.day, row.content])),
    partnerAnswers: Object.fromEntries(received.results.map((row) => [row.day, row.content])),
  });
}

async function setup(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { partner?: Partner; accessCode?: string };
  const code = body.accessCode?.trim() ?? "";
  if (!isPartner(body.partner) || code.length < 6 || code.length > 80) return json({ error: "Wähle dich aus und verwende einen Schlüssel mit mindestens 6 Zeichen." }, 400);
  if (await getCalendar(env)) return json({ error: "Der Kalender wurde bereits eingerichtet." }, 409);
  try {
    await env.DB.prepare("INSERT INTO calendar (id, access_code_hash, season_year) VALUES (1, ?, ?)").bind(await sha256(code), currentYear()).run();
  } catch {
    return json({ error: "Der Kalender wurde bereits eingerichtet." }, 409);
  }
  return json(await issueSession(body.partner, env), 201);
}

async function signIn(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { partner?: Partner; accessCode?: string };
  const calendar = await getCalendar(env);
  if (!calendar) return json({ error: "Der Kalender wird noch eingerichtet." }, 409);
  if (!isPartner(body.partner) || !body.accessCode) return json({ error: "Bitte wähle deinen Namen und gib den gemeinsamen Schlüssel ein." }, 400);
  if (await sha256(body.accessCode.trim()) !== calendar.access_code_hash) return json({ error: "Der gemeinsame Schlüssel stimmt nicht." }, 401);
  return json(await issueSession(body.partner, env));
}

async function saveAnswer(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  const calendar = await getCalendar(env);
  if (!session || !calendar) return json({ error: "Bitte melde dich zuerst an." }, 401);
  const body = await request.json() as { day?: number; content?: string };
  const content = body.content?.trim() ?? "";
  const status = seasonStatus(calendar.season_year);
  if (!Number.isInteger(body.day) || body.day !== status.writeDay) return json({ error: "Heute kann nur das heutige Türchen beantwortet werden." }, 400);
  if (!content || content.length > 2_000) return json({ error: "Schreibe eine Antwort mit höchstens 2.000 Zeichen." }, 400);
  await env.DB.prepare("INSERT INTO answers (day, author, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(day, author) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP").bind(body.day, session.partner, content).run();
  return json({ day: body.day, content });
}

async function getCalendar(env: Env) {
  return env.DB.prepare("SELECT id, access_code_hash, season_year FROM calendar WHERE id = 1").first<Calendar>();
}

async function getSession(request: Request, env: Env): Promise<Session | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const row = await env.DB.prepare("SELECT partner FROM sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP").bind(await sha256(token)).first<Session>();
  return row && isPartner(row.partner) ? row : null;
}

async function issueSession(partner: Partner, env: Env) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 45 * 86_400_000).toISOString().replace("T", " ").replace("Z", "");
  await env.DB.prepare("INSERT INTO sessions (token_hash, partner, expires_at) VALUES (?, ?, ?)").bind(await sha256(token), partner, expiresAt).run();
  return { partner, token, expiresAt };
}

function seasonStatus(seasonYear: number) {
  const parts = berlinDate();
  if (parts.year < seasonYear || (parts.year === seasonYear && parts.month < 12)) return { writeDay: null, revealThrough: 0, phase: "before" };
  if (parts.year > seasonYear || parts.month > 12 || parts.day > 24) return { writeDay: null, revealThrough: 24, phase: "complete" };
  return { writeDay: parts.day, revealThrough: parts.day - 1, phase: "active" };
}

function berlinDate() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric", day: "numeric" }).formatToParts();
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day };
}

function currentYear() { return berlinDate().year; }
function otherPartner(partner: Partner): Partner { return partner === "pia" ? "paul" : "pia"; }
function isPartner(value: unknown): value is Partner { return value === "pia" || value === "paul"; }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }); }
function corsHeaders(request: Request) { return { "access-control-allow-origin": request.headers.get("Origin") ?? "*", "access-control-allow-methods": "GET, POST, PUT, OPTIONS", "access-control-allow-headers": "Authorization, Content-Type", vary: "Origin" }; }
function withCors(response: Response, request: Request) { const headers = new Headers(response.headers); for (const [key, value] of Object.entries(corsHeaders(request))) headers.set(key, value); return new Response(response.body, { status: response.status, headers }); }
async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function randomToken() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }

export interface Env {
  DB: D1Database;
  TEST_MODE?: string;
}

type Partner = "pia" | "paul";
type AnswerKind = "text" | "choice" | "ranking" | "image" | "audio" | "drawing" | "map" | "link";
type Calendar = { id: number; access_code_hash: string; season_year: number; test_day?: number };
type Session = { partner: Partner };
type AnswerRow = { day: number; content: string; kind?: string; payload?: string | null; updated_at: string };

const JSON_HEADERS = { "content-type": "application/json; charset=UTF-8" };
const ANSWER_KINDS: AnswerKind[] = ["text", "choice", "ranking", "image", "audio", "drawing", "map", "link"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });
    try {
      const response = await route(request, env, new URL(request.url));
      return await withCors(response, request);
    } catch (error) {
      console.error(error);
      return await withCors(json({ error: "Der Kalender ist gerade nicht erreichbar." }, 500), request);
    }
  },
};

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname: path } = url;
  if (path === "/api/calendar" && request.method === "GET") return readCalendar(request, env);
  if (path === "/api/setup" && request.method === "POST") return setup(request, env);
  if (path === "/api/session" && request.method === "POST") return signIn(request, env);
  if (path === "/api/answers" && request.method === "PUT") return saveAnswer(request, env);
  if (path === "/api/doors/open" && request.method === "POST") return markDoorSeen(request, env);
  if (path === "/api/media" && request.method === "POST") return uploadMedia(request, env, url);
  if (path.startsWith("/api/media/") && request.method === "GET") return readMedia(request, env, path);
  if (path === "/api/test/day" && request.method === "POST" && isTestEnvironment(env)) return setTestDay(request, env);
  return json({ error: "Nicht gefunden." }, 404);
}

async function readCalendar(request: Request, env: Env): Promise<Response> {
  const calendar = await getCalendar(env);
  if (!calendar) return json({ configured: false });
  const session = await getSession(request, env);
  if (!session) return json({ configured: true, session: null, seasonYear: calendar.season_year });

  const status = seasonStatus(calendar, env);
  const partner = otherPartner(session.partner);
  const [own, received, views] = await Promise.all([
    env.DB.prepare("SELECT day, content, kind, payload, updated_at FROM answers WHERE author = ?").bind(session.partner).all<AnswerRow>(),
    env.DB.prepare("SELECT day, content, kind, payload, updated_at FROM answers WHERE author = ? AND day <= ?").bind(partner, status.revealThrough).all<AnswerRow>(),
    env.DB.prepare("SELECT day FROM door_views WHERE viewer = ?").bind(session.partner).all<{ day: number }>(),
  ]);
  return json({
    configured: true,
    session,
    seasonYear: calendar.season_year,
    status,
    ownAnswers: Object.fromEntries(own.results.map((row) => [row.day, answerFromRow(row)])),
    partnerAnswers: Object.fromEntries(received.results.map((row) => [row.day, answerFromRow(row)])),
    seenDays: views.results.map((row) => row.day),
  });
}

async function setup(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { partner?: Partner; accessCode?: string };
  const code = body.accessCode?.trim() ?? "";
  if (!isPartner(body.partner) || code.length < 6 || code.length > 80) return json({ error: "Wähle dich aus und verwende einen Schlüssel mit mindestens 6 Zeichen." }, 400);
  if (await getCalendar(env)) return json({ error: "Der Kalender wurde bereits eingerichtet." }, 409);
  try {
    const statement = isTestEnvironment(env)
      ? env.DB.prepare("INSERT INTO calendar (id, access_code_hash, season_year, test_day) VALUES (1, ?, ?, 1)").bind(await sha256(code), currentYear())
      : env.DB.prepare("INSERT INTO calendar (id, access_code_hash, season_year) VALUES (1, ?, ?)").bind(await sha256(code), currentYear());
    await statement.run();
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
  const body = await request.json() as { day?: number; kind?: AnswerKind; content?: string; payload?: unknown };
  const kind = isAnswerKind(body.kind) ? body.kind : "text";
  const content = body.content?.trim() ?? "";
  const payload = normalisePayload(body.payload);
  if (!Number.isInteger(body.day) || !body.day || body.day < 1 || body.day > 24) return json({ error: "Wähle ein Türchen zwischen 1 und 24." }, 400);
  if (!content || content.length > 2_000) return json({ error: "Die Antwort darf nicht leer sein und höchstens 2.000 Zeichen haben." }, 400);
  if (!isValidAnswer(kind, content, payload)) return json({ error: "Diese Antwort ist noch nicht vollständig oder enthält ein ungültiges Format." }, 400);
  const payloadJson = payload ? JSON.stringify(payload) : null;
  await env.DB.prepare("INSERT INTO answers (day, author, content, kind, payload, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(day, author) DO UPDATE SET content = excluded.content, kind = excluded.kind, payload = excluded.payload, updated_at = CURRENT_TIMESTAMP").bind(body.day, session.partner, content, kind, payloadJson).run();
  return json({ day: body.day, kind, content, payload, updatedAt: new Date().toISOString() });
}

async function markDoorSeen(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  const calendar = await getCalendar(env);
  if (!session || !calendar) return json({ error: "Bitte melde dich zuerst an." }, 401);
  const body = await request.json() as { day?: number };
  const status = seasonStatus(calendar, env);
  if (!Number.isInteger(body.day) || !body.day || body.day < 1 || body.day > status.revealThrough) return json({ error: "Dieses Türchen ist noch nicht freigeschaltet." }, 400);
  await env.DB.prepare("INSERT OR IGNORE INTO door_views (day, viewer) VALUES (?, ?)").bind(body.day, session.partner).run();
  return json({ day: body.day });
}

async function uploadMedia(request: Request, env: Env, url: URL): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) return json({ error: "Bitte melde dich zuerst an." }, 401);
  const mediaKind = url.searchParams.get("kind");
  const contentType = (request.headers.get("content-type") ?? "").split(";")[0].toLowerCase();
  const isImage = mediaKind === "image" || mediaKind === "drawing";
  const isAudio = mediaKind === "audio";
  const maxBytes = 1_800_000;
  if ((!isImage && !isAudio) || (isImage && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) || (isAudio && !["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-wav"].includes(contentType))) return json({ error: "Dieses Dateiformat wird nicht unterstützt." }, 400);
  const file = await request.arrayBuffer();
  if (!file.byteLength || file.byteLength > maxBytes) return json({ error: "Die Datei darf höchstens 1,8 MB groß sein. Bitte wähle ein kleineres Bild oder eine kürzere Aufnahme." }, 400);
  const extension = contentType.split("/")[1].replace("x-wav", "wav");
  const key = `media/${crypto.randomUUID()}.${extension}`;
  await env.DB.prepare("INSERT INTO media (key, owner, mime_type, body) VALUES (?, ?, ?, ?)").bind(key, session.partner, contentType, file).run();
  return json({ key, mimeType: contentType, size: file.byteLength }, 201);
}

async function readMedia(request: Request, env: Env, path: string): Promise<Response> {
  const session = await getSession(request, env);
  const calendar = await getCalendar(env);
  if (!session || !calendar) return json({ error: "Bitte melde dich zuerst an." }, 401);
  const key = decodeURIComponent(path.slice("/api/media/".length));
  if (!/^media\/[a-f0-9-]+\.[a-z0-9]+$/i.test(key)) return json({ error: "Nicht gefunden." }, 404);
  const answer = await env.DB.prepare("SELECT day, author FROM answers WHERE payload LIKE ? LIMIT 1").bind(`%${key}%`).first<{ day: number; author: Partner }>();
  const status = seasonStatus(calendar, env);
  if (!answer || (answer.author !== session.partner && (answer.author !== otherPartner(session.partner) || answer.day > status.revealThrough))) return json({ error: "Nicht gefunden." }, 404);
  const media = await env.DB.prepare("SELECT mime_type, body FROM media WHERE key = ?").bind(key).first<{ mime_type: string; body: ArrayBuffer }>();
  if (!media) return json({ error: "Nicht gefunden." }, 404);
  const body = new Uint8Array(media.body.slice(0));
  return new Response(body, { headers: { "content-type": media.mime_type, "cache-control": "private, max-age=3600" } });
}

async function setTestDay(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  const calendar = await getCalendar(env);
  const body = await request.json() as { day?: number };
  if (!session || !calendar) return json({ error: "Bitte melde dich zuerst an." }, 401);
  if (!Number.isInteger(body.day) || !body.day || body.day < 1 || body.day > 25) return json({ error: "Wähle einen Testtag zwischen 1 und 24 oder den Zeitraum danach." }, 400);
  await env.DB.prepare("UPDATE calendar SET test_day = ? WHERE id = 1").bind(body.day).run();
  return json({ status: seasonStatus({ ...calendar, test_day: body.day }, env) });
}

async function getCalendar(env: Env) {
  const columns = isTestEnvironment(env) ? "id, access_code_hash, season_year, test_day" : "id, access_code_hash, season_year";
  return env.DB.prepare(`SELECT ${columns} FROM calendar WHERE id = 1`).first<Calendar>();
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

function seasonStatus(calendar: Calendar, env: Env) {
  if (isTestEnvironment(env)) {
    const testDay = calendar.test_day ?? 1;
    return testDay === 25 ? { writeDay: null, revealThrough: 24, phase: "complete" } : { writeDay: testDay, revealThrough: testDay, phase: "active" };
  }
  const seasonYear = calendar.season_year;
  const parts = berlinDate();
  if (parts.year < seasonYear || (parts.year === seasonYear && parts.month < 12)) return { writeDay: null, revealThrough: 0, phase: "before" };
  if (parts.year > seasonYear || parts.month > 12 || parts.day > 24) return { writeDay: null, revealThrough: 24, phase: "complete" };
  return { writeDay: parts.day, revealThrough: parts.day, phase: "active" };
}

function answerFromRow(row: AnswerRow) { return { kind: isAnswerKind(row.kind) ? row.kind : "text", content: row.content, payload: parsePayload(row.payload), updatedAt: row.updated_at }; }
function normalisePayload(payload: unknown) { return payload && typeof payload === "object" && !Array.isArray(payload) && JSON.stringify(payload).length <= 4_000 ? payload as Record<string, unknown> : null; }
function parsePayload(value?: string | null) { try { return value ? JSON.parse(value) : null; } catch { return null; } }
function isValidAnswer(kind: AnswerKind, content: string, payload: Record<string, unknown> | null) {
  if (["text", "choice", "ranking", "link"].includes(kind)) {
    if (kind === "ranking") {
      try {
        const ranking = JSON.parse(content);
        return Array.isArray(ranking) && ranking.length === 4 && ranking.every((id) => typeof id === "string") && new Set(ranking).size === 4;
      } catch { return false; }
    }
    if (kind !== "link") return true;
    try { const url = new URL(content); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
  }
  if (kind === "map") return Boolean(payload && typeof payload.lat === "number" && Number.isFinite(payload.lat) && Math.abs(payload.lat) <= 90 && typeof payload.lng === "number" && Number.isFinite(payload.lng) && Math.abs(payload.lng) <= 180);
  return Boolean(payload && typeof payload.mediaKey === "string" && /^media\/[a-f0-9-]+\.[a-z0-9]+$/i.test(payload.mediaKey));
}
function berlinDate() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric", day: "numeric" }).formatToParts();
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day };
}
function currentYear() { return berlinDate().year; }
function isTestEnvironment(env: Env) { return env.TEST_MODE === "true"; }
function otherPartner(partner: Partner): Partner { return partner === "pia" ? "paul" : "pia"; }
function isPartner(value: unknown): value is Partner { return value === "pia" || value === "paul"; }
function isAnswerKind(value: unknown): value is AnswerKind { return typeof value === "string" && ANSWER_KINDS.includes(value as AnswerKind); }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }); }
function corsHeaders(request: Request) { return { "access-control-allow-origin": request.headers.get("Origin") ?? "*", "access-control-allow-methods": "GET, POST, PUT, OPTIONS", "access-control-allow-headers": "Authorization, Content-Type", vary: "Origin" }; }
async function withCors(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) headers.set(key, value);
  const type = headers.get("content-type") || "";
  // Buffer binary media before attaching CORS headers. Re-wrapping a streamed D1
  // BLOB can otherwise yield a response that downloads but cannot be decoded.
  const body = type.startsWith("image/") || type.startsWith("audio/") ? await response.arrayBuffer() : response.body;
  return new Response(body, { status: response.status, headers });
}
async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function randomToken() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }

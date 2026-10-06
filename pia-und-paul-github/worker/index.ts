export interface Env {
  DB: D1Database;
  TEST_MODE?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_JWK?: string;
}

type Partner = "pia" | "paul";
type AnswerKind = "text" | "choice" | "choice-custom" | "ranking" | "image" | "audio" | "drawing" | "drawing-riddle" | "map" | "link";
type Calendar = { id: number; access_code_hash: string; recovery_code_hash?: string | null; setup_complete?: number; season_year: number; test_day?: number };
type Session = { partner: Partner };
type AdminSession = { expires_at: string };
type AnswerRow = { day: number; content: string; kind?: string; payload?: string | null; updated_at: string };
type ReminderRow = { enabled: number; reminder_time: string; endpoint: string | null; last_sent_year: number | null };

const JSON_HEADERS = { "content-type": "application/json; charset=UTF-8" };
const ANSWER_KINDS: AnswerKind[] = ["text", "choice", "choice-custom", "ranking", "image", "audio", "drawing", "drawing-riddle", "map", "link"];

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });
    try {
      const response = await route(request, env, new URL(request.url), ctx);
      return await withCors(response, request);
    } catch (error) {
      console.error(error);
      return await withCors(json({ error: "Der Adventskalender ist gerade nicht erreichbar." }, 500), request);
    }
  },
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }) {
    ctx.waitUntil(sendDueReminders(env));
  },
};

async function route(request: Request, env: Env, url: URL, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
  const { pathname: path } = url;
  if (path === "/api/reminder/test" && request.method === "POST" && isTestEnvironment(env)) {
    const session = await getSession(request, env);
    if (session?.partner !== "pia") return json({ error: "Bitte melde dich als Pia an." }, 403);
    const reminder = await env.DB.prepare("SELECT enabled, endpoint FROM reminders WHERE partner = 'pia'").first<ReminderRow>();
    if (!reminder?.enabled || !reminder.endpoint) return json({ error: "Aktiviere zuerst die Erinnerung auf diesem Gerät." }, 400);
    ctx.waitUntil((async () => {
      await new Promise(resolve => setTimeout(resolve, 10_000));
      const current = await env.DB.prepare("SELECT enabled, endpoint FROM reminders WHERE partner = 'pia'").first<ReminderRow>();
      if (!current?.enabled || current.endpoint !== reminder.endpoint) return;
      const response = await sendPush(current.endpoint, env);
      if (!response.ok) console.error("Test push rejected", response.status);
    })());
    return json({ queued: true, delaySeconds: 10 }, 202);
  }
  if (path === "/api/calendar" && request.method === "GET") return readCalendar(request, env);
  if (path === "/api/setup" && request.method === "POST") return setup(request, env);
  if (path === "/api/session" && request.method === "POST") return signIn(request, env);
  if (path === "/api/recovery/setup" && request.method === "POST") return configureRecovery(request, env);
  if (path === "/api/recovery" && request.method === "POST") return recoverAccess(request, env);
  if (path === "/api/admin/session" && request.method === "POST") return signInAdmin(request, env);
  if (path === "/api/admin" && request.method === "GET") return readAdmin(request, env);
  if (path === "/api/admin/password" && request.method === "PUT") return changeAccessCode(request, env);
  if (path === "/api/admin/settings" && request.method === "PUT") return saveAdminSettings(request, env);
  if (path === "/api/admin/content" && request.method === "DELETE") return resetContent(request, env);
  if (path === "/api/admin/test/reset" && request.method === "DELETE" && isTestEnvironment(env)) return resetTestEnvironment(request, env);
  if (path === "/api/admin/gift" && request.method === "PUT") return replaceGiftAsset(request, env, url);
  if (path === "/api/admin/reminder" && request.method === "DELETE") return clearAdminReminder(request, env);
  if (path === "/api/answers" && request.method === "PUT") return saveAnswer(request, env);
  if (path.startsWith("/api/answers/") && request.method === "DELETE") return retractAnswer(request, env, path);
  if (path === "/api/riddles/guess" && request.method === "POST") return checkRiddleGuess(request, env);
  if (path === "/api/doors/open" && request.method === "POST") return markDoorSeen(request, env);
  if (path === "/api/reminder" && request.method === "GET") return readReminder(request, env);
  if (path === "/api/reminder" && request.method === "PUT") return saveReminder(request, env);
  if (path === "/api/reminder" && request.method === "DELETE") return disableReminder(request, env);
  if (path === "/api/media" && request.method === "POST") return uploadMedia(request, env, url);
  if (path.startsWith("/api/media/") && request.method === "GET") return readMedia(request, env, path);
  if (path === "/api/test/day" && request.method === "POST" && isTestEnvironment(env)) return setTestDay(request, env);
  return json({ error: "Nicht gefunden." }, 404);
}

async function signInAdmin(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { recoveryCode?: string };
  const calendar = await getCalendar(env);
  const recoveryCode = body.recoveryCode?.trim() ?? "";
  if (!calendar?.recovery_code_hash || await sha256(recoveryCode) !== calendar.recovery_code_hash) return json({ error: "Der Rettungscode stimmt nicht." }, 401);
  return json(await issueAdminSession(env));
}

async function readAdmin(request: Request, env: Env): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  const calendar = await getCalendar(env);
  if (!calendar) return json({ error: "Der Adventskalender wurde noch nicht eingerichtet." }, 409);
  const [answers, uploads, reminder] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM answers").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM media WHERE key LIKE 'media/%'").first<{ count: number }>(),
    env.DB.prepare("SELECT enabled, reminder_time FROM reminders WHERE partner = 'pia'").first<ReminderRow>(),
  ]);
  return json({
    testMode: isTestEnvironment(env), seasonYear: calendar.season_year, testDay: calendar.test_day ?? 1,
    answerCount: answers?.count ?? 0, uploadCount: uploads?.count ?? 0,
    reminderEnabled: Boolean(reminder?.enabled), reminderTime: reminder?.reminder_time || "09:00",
  });
}

async function changeAccessCode(request: Request, env: Env): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  const body = await request.json() as { accessCode?: string };
  const accessCode = body.accessCode?.trim() ?? "";
  if (accessCode.length < 6 || accessCode.length > 80) return json({ error: "Der gemeinsame Schlüssel muss zwischen 6 und 80 Zeichen lang sein." }, 400);
  await Promise.all([
    env.DB.prepare("UPDATE calendar SET access_code_hash = ? WHERE id = 1").bind(await sha256(accessCode)).run(),
    env.DB.prepare("DELETE FROM sessions").run(),
  ]);
  return json({ changed: true });
}

async function saveAdminSettings(request: Request, env: Env): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  const body = await request.json() as { seasonYear?: number; testDay?: number };
  if (!Number.isInteger(body.seasonYear) || !body.seasonYear || body.seasonYear < 2020 || body.seasonYear > 2100) return json({ error: "Bitte wähle ein gültiges Adventsjahr." }, 400);
  if (isTestEnvironment(env)) {
    if (!Number.isInteger(body.testDay) || !body.testDay || body.testDay < 1 || body.testDay > 25) return json({ error: "Bitte wähle einen Testtag zwischen 1 und 24 oder den Zeitraum danach." }, 400);
    await env.DB.prepare("UPDATE calendar SET season_year = ?, test_day = ? WHERE id = 1").bind(body.seasonYear, body.testDay).run();
  } else await env.DB.prepare("UPDATE calendar SET season_year = ? WHERE id = 1").bind(body.seasonYear).run();
  return json({ saved: true });
}

async function resetContent(request: Request, env: Env): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  const body = await request.json() as { confirmation?: string };
  if (body.confirmation !== "INHALTE LÖSCHEN") return json({ error: "Die zusätzliche Bestätigung stimmt nicht." }, 400);
  await Promise.all([
    env.DB.prepare("DELETE FROM answers").run(), env.DB.prepare("DELETE FROM door_views").run(),
    env.DB.prepare("DELETE FROM media WHERE key LIKE 'media/%'").run(), env.DB.prepare("DELETE FROM reminders").run(),
    env.DB.prepare("DELETE FROM sessions").run(),
    isTestEnvironment(env) ? env.DB.prepare("UPDATE calendar SET test_day = 1 WHERE id = 1").run() : Promise.resolve(),
  ]);
  return json({ reset: true });
}

async function resetTestEnvironment(request: Request, env: Env): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  const body = await request.json() as { confirmation?: string };
  if (body.confirmation !== "TESTVERSION ZURÜCKSETZEN") return json({ error: "Die zusätzliche Bestätigung stimmt nicht." }, 400);
  const placeholderAccessCode = await sha256(crypto.randomUUID());
  await Promise.all([
    env.DB.prepare("DELETE FROM answers").run(), env.DB.prepare("DELETE FROM door_views").run(),
    env.DB.prepare("DELETE FROM media").run(), env.DB.prepare("DELETE FROM reminders").run(),
    env.DB.prepare("DELETE FROM sessions").run(),
    env.DB.prepare("UPDATE calendar SET access_code_hash = ?, season_year = ?, test_day = 1, setup_complete = 0 WHERE id = 1").bind(placeholderAccessCode, currentYear()).run(),
  ]);
  return json({ reset: true });
}

async function replaceGiftAsset(request: Request, env: Env, url: URL): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  const recipient = url.searchParams.get("recipient");
  const asset = url.searchParams.get("asset");
  if (!isPartner(recipient) || (asset !== "pdf" && asset !== "preview")) return json({ error: "Ungültige Geschenk-Datei." }, 400);
  const contentType = (request.headers.get("content-type") || "").split(";")[0].toLowerCase();
  const valid = asset === "pdf" ? contentType === "application/pdf" : contentType === "image/png";
  if (!valid) return json({ error: asset === "pdf" ? "Bitte wähle eine PDF-Datei." : "Bitte wähle eine PNG-Vorschau." }, 400);
  const body = await request.arrayBuffer();
  if (!body.byteLength || body.byteLength > 5_000_000) return json({ error: "Die Datei muss kleiner als 5 MB sein." }, 400);
  const key = `gift/${recipient}/${asset === "pdf" ? "rezept.pdf" : "vorschau.png"}`;
  await env.DB.prepare("INSERT INTO media (key, owner, mime_type, body) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET owner = excluded.owner, mime_type = excluded.mime_type, body = excluded.body, created_at = CURRENT_TIMESTAMP").bind(key, recipient, contentType, body).run();
  return json({ key, size: body.byteLength });
}

async function clearAdminReminder(request: Request, env: Env): Promise<Response> {
  if (!await getAdminSession(request, env)) return json({ error: "Bitte melde dich mit deinem Rettungscode an." }, 401);
  await env.DB.prepare("UPDATE reminders SET enabled = 0, endpoint = NULL, updated_at = CURRENT_TIMESTAMP WHERE partner = 'pia'").run();
  return json({ cleared: true });
}

async function readReminder(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session || session.partner !== "pia") return json({ error: "Diese Erinnerung kann nur Pia einstellen." }, 403);
  const reminder = await env.DB.prepare("SELECT enabled, reminder_time, endpoint, last_sent_year FROM reminders WHERE partner = 'pia'").first<ReminderRow>();
  return json({ enabled: Boolean(reminder?.enabled), time: reminder?.reminder_time || "09:00", publicKey: env.VAPID_PUBLIC_KEY || null });
}

async function saveReminder(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session || session.partner !== "pia") return json({ error: "Diese Erinnerung kann nur Pia einstellen." }, 403);
  const body = await request.json() as { enabled?: boolean; time?: string; endpoint?: string };
  const time = body.time || "09:00";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return json({ error: "Bitte wähle eine gültige Uhrzeit." }, 400);
  if (!body.enabled) {
    await env.DB.prepare("INSERT INTO reminders (partner, enabled, reminder_time, endpoint, updated_at) VALUES ('pia', 0, ?, NULL, CURRENT_TIMESTAMP) ON CONFLICT(partner) DO UPDATE SET enabled = 0, reminder_time = excluded.reminder_time, endpoint = NULL, updated_at = CURRENT_TIMESTAMP").bind(time).run();
    return json({ enabled: false, time });
  }
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_JWK) return json({ error: "Die Erinnerungsfunktion wird gerade noch eingerichtet." }, 503);
  if (!isPushEndpoint(body.endpoint)) return json({ error: "Die Benachrichtigung konnte auf diesem Gerät nicht eingerichtet werden." }, 400);
  await env.DB.prepare("INSERT INTO reminders (partner, enabled, reminder_time, endpoint, last_sent_year, updated_at) VALUES ('pia', 1, ?, ?, NULL, CURRENT_TIMESTAMP) ON CONFLICT(partner) DO UPDATE SET enabled = 1, reminder_time = excluded.reminder_time, endpoint = excluded.endpoint, last_sent_year = NULL, updated_at = CURRENT_TIMESTAMP").bind(time, body.endpoint).run();
  return json({ enabled: true, time });
}

async function disableReminder(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session || session.partner !== "pia") return json({ error: "Diese Erinnerung kann nur Pia einstellen." }, 403);
  await env.DB.prepare("UPDATE reminders SET enabled = 0, endpoint = NULL, updated_at = CURRENT_TIMESTAMP WHERE partner = 'pia'").run();
  return json({ enabled: false });
}

async function readCalendar(request: Request, env: Env): Promise<Response> {
  const calendar = await getCalendar(env);
  if (!calendar) return json({ configured: false });
  if (!isCalendarConfigured(calendar)) return json({ configured: false, recoveryConfigured: Boolean(calendar.recovery_code_hash) });
  const session = await getSession(request, env);
  if (!session) return json({ configured: true, session: null, seasonYear: calendar.season_year, recoveryConfigured: Boolean(calendar.recovery_code_hash) });

  const status = seasonStatus(calendar, env);
  const partner = otherPartner(session.partner);
  const [own, received, views, partnerViews] = await Promise.all([
    env.DB.prepare("SELECT day, content, kind, payload, updated_at FROM answers WHERE author = ?").bind(session.partner).all<AnswerRow>(),
    env.DB.prepare("SELECT day, content, kind, payload, updated_at FROM answers WHERE author = ? AND day <= ?").bind(partner, status.revealThrough).all<AnswerRow>(),
    env.DB.prepare("SELECT day FROM door_views WHERE viewer = ?").bind(session.partner).all<{ day: number }>(),
    env.DB.prepare("SELECT day FROM door_views WHERE viewer = ?").bind(partner).all<{ day: number }>(),
  ]);
  const openedByPartner = new Set(partnerViews.results.map((row) => row.day));
  return json({
    configured: true,
    session,
    seasonYear: calendar.season_year,
    status,
    ownAnswers: Object.fromEntries(own.results.map((row) => [row.day, answerFromRow(row)])),
    partnerAnswers: Object.fromEntries(received.results.map((row) => [row.day, answerFromRow(row)])),
    seenDays: views.results.map((row) => row.day),
    withdrawableDays: own.results.map((row) => row.day).filter((day) => !openedByPartner.has(day)),
  });
}

async function checkRiddleGuess(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  const calendar = await getCalendar(env);
  if (!session || !calendar) return json({ error: "Bitte melde dich zuerst an." }, 401);
  const body = await request.json() as { day?: number; guess?: string };
  const status = seasonStatus(calendar, env);
  if (!Number.isInteger(body.day) || !body.day || body.day < 1 || body.day > status.revealThrough) return json({ error: "Dieses Rätsel ist noch nicht freigeschaltet." }, 400);
  const guess = body.guess?.trim() ?? "";
  if (!guess || guess.length > 240) return json({ error: "Schreib bitte einen kurzen Tipp hinein." }, 400);
  const row = await env.DB.prepare("SELECT day, content, kind, payload, updated_at FROM answers WHERE day = ? AND author = ?").bind(body.day, otherPartner(session.partner)).first<AnswerRow>();
  if (!row || row.kind !== "drawing-riddle") return json({ error: "Für dieses Türchen gibt es gerade kein Zeichenrätsel." }, 404);
  const payload = parsePayload(row.payload);
  const solution = typeof payload?.solution === "string" ? payload.solution : "";
  if (!solution) return json({ error: "Die Lösung zu diesem Rätsel fehlt noch." }, 400);
  const correct = normaliseGuess(guess) === normaliseGuess(solution);
  return json(correct ? { correct: true, solution } : { correct: false });
}

async function setup(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { partner?: Partner; accessCode?: string };
  const code = body.accessCode?.trim() ?? "";
  if (!isPartner(body.partner) || code.length < 6 || code.length > 80) return json({ error: "Wähle dich aus und verwende einen Schlüssel mit mindestens 6 Zeichen." }, 400);
  const calendar = await getCalendar(env);
  if (calendar && isCalendarConfigured(calendar)) return json({ error: "Der Adventskalender wurde bereits eingerichtet." }, 409);
  try {
    const accessCodeHash = await sha256(code);
    const statement = calendar
      ? isTestEnvironment(env)
        ? env.DB.prepare("UPDATE calendar SET access_code_hash = ?, season_year = ?, test_day = 1, setup_complete = 1 WHERE id = 1 AND setup_complete = 0").bind(accessCodeHash, currentYear())
        : env.DB.prepare("UPDATE calendar SET access_code_hash = ?, season_year = ?, setup_complete = 1 WHERE id = 1 AND setup_complete = 0").bind(accessCodeHash, currentYear())
      : isTestEnvironment(env)
        ? env.DB.prepare("INSERT INTO calendar (id, access_code_hash, season_year, test_day, setup_complete) VALUES (1, ?, ?, 1, 1)").bind(accessCodeHash, currentYear())
        : env.DB.prepare("INSERT INTO calendar (id, access_code_hash, season_year, setup_complete) VALUES (1, ?, ?, 1)").bind(accessCodeHash, currentYear());
    const result = await statement.run();
    if (!result.meta.changes) return json({ error: "Der Adventskalender wurde bereits eingerichtet." }, 409);
  } catch {
    return json({ error: "Der Adventskalender wurde bereits eingerichtet." }, 409);
  }
  return json(await issueSession(body.partner, env), 201);
}

async function configureRecovery(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { recoveryCode?: string };
  const calendar = await getCalendar(env);
  const recoveryCode = body.recoveryCode?.trim() ?? "";
  if (calendar?.recovery_code_hash) return json({ error: "Ein Rettungscode ist bereits eingerichtet." }, 409);
  if (recoveryCode.length < 10 || recoveryCode.length > 80) return json({ error: "Der Rettungscode muss zwischen 10 und 80 Zeichen lang sein." }, 400);
  const recoveryCodeHash = await sha256(recoveryCode);
  if (!calendar) {
    const placeholderAccessCode = await sha256(crypto.randomUUID());
    const statement = isTestEnvironment(env)
      ? env.DB.prepare("INSERT INTO calendar (id, access_code_hash, recovery_code_hash, season_year, test_day, setup_complete) VALUES (1, ?, ?, ?, 1, 0)").bind(placeholderAccessCode, recoveryCodeHash, currentYear())
      : env.DB.prepare("INSERT INTO calendar (id, access_code_hash, recovery_code_hash, season_year, setup_complete) VALUES (1, ?, ?, ?, 0)").bind(placeholderAccessCode, recoveryCodeHash, currentYear());
    await statement.run();
  } else {
    await env.DB.prepare("UPDATE calendar SET recovery_code_hash = ? WHERE id = 1 AND recovery_code_hash IS NULL").bind(recoveryCodeHash).run();
  }
  return json({ configured: true });
}

async function recoverAccess(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { recoveryCode?: string; accessCode?: string };
  const calendar = await getCalendar(env);
  const recoveryCode = body.recoveryCode?.trim() ?? "";
  const accessCode = body.accessCode?.trim() ?? "";
  if (!calendar || !isCalendarConfigured(calendar)) return json({ error: "Der Adventskalender wird noch eingerichtet." }, 409);
  if (accessCode.length < 6 || accessCode.length > 80) return json({ error: "Der neue gemeinsame Schlüssel muss zwischen 6 und 80 Zeichen lang sein." }, 400);
  if (!calendar.recovery_code_hash || await sha256(recoveryCode) !== calendar.recovery_code_hash) return json({ error: "Der Rettungscode stimmt nicht." }, 401);
  await Promise.all([
    env.DB.prepare("UPDATE calendar SET access_code_hash = ? WHERE id = 1").bind(await sha256(accessCode)).run(),
    env.DB.prepare("DELETE FROM sessions").run(),
  ]);
  return json({ recovered: true });
}

async function signIn(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { partner?: Partner; accessCode?: string };
  const calendar = await getCalendar(env);
  if (!calendar || !isCalendarConfigured(calendar)) return json({ error: "Der Adventskalender wird noch eingerichtet." }, 409);
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

async function retractAnswer(request: Request, env: Env, path: string): Promise<Response> {
  const session = await getSession(request, env);
  const calendar = await getCalendar(env);
  if (!session || !calendar) return json({ error: "Bitte melde dich zuerst an." }, 401);
  const day = Number(path.slice("/api/answers/".length));
  if (!Number.isInteger(day) || day < 1 || day > 24) return json({ error: "Wähle ein gültiges Türchen." }, 400);
  const alreadyOpened = await env.DB.prepare("SELECT 1 FROM door_views WHERE day = ? AND viewer = ? LIMIT 1").bind(day, otherPartner(session.partner)).first();
  if (alreadyOpened) return json({ error: "Diese Antwort wurde schon geöffnet und kann nicht mehr zurückgezogen werden." }, 409);
  const result = await env.DB.prepare("DELETE FROM answers WHERE day = ? AND author = ?").bind(day, session.partner).run();
  if (!result.meta.changes) return json({ error: "Diese Antwort gibt es nicht mehr." }, 404);
  return json({ day, retracted: true });
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
  const status = seasonStatus(calendar, env);
  const gift = /^gift\/(pia|paul)\/(vorschau\.png|rezept\.pdf)$/.exec(key);
  if (gift) {
    if (status.revealThrough < 24 || gift[1] !== session.partner) return json({ error: "Nicht gefunden." }, 404);
  } else {
    if (!/^media\/[a-f0-9-]+\.[a-z0-9]+$/i.test(key)) return json({ error: "Nicht gefunden." }, 404);
    const answer = await env.DB.prepare("SELECT day, author FROM answers WHERE payload LIKE ? LIMIT 1").bind(`%${key}%`).first<{ day: number; author: Partner }>();
    if (!answer || (answer.author !== session.partner && (answer.author !== otherPartner(session.partner) || answer.day > status.revealThrough))) return json({ error: "Nicht gefunden." }, 404);
  }
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

async function sendDueReminders(env: Env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_JWK) return;
  const now = berlinClock();
  // Der Cron läuft nur am 5. und 6. Dezember UTC. Entscheidend ist trotzdem
  // ausschließlich der Berliner Kalender – so stimmt die Erinnerung auch bei
  // der Winterzeit sicher mit dem 6. Dezember überein.
  if (now.month !== 12 || now.day !== 6) return;
  const reminders = await env.DB.prepare("SELECT enabled, reminder_time, endpoint, last_sent_year FROM reminders WHERE partner = 'pia' AND enabled = 1").all<ReminderRow>();
  await Promise.all(reminders.results.map(async (reminder) => {
    if (!reminder.endpoint || reminder.reminder_time !== now.time || reminder.last_sent_year === now.year) return;
    const response = await sendPush(reminder.endpoint, env);
    if (response.ok) {
      await env.DB.prepare("UPDATE reminders SET last_sent_year = ?, updated_at = CURRENT_TIMESTAMP WHERE partner = 'pia'").bind(now.year).run();
    } else if (response.status === 404 || response.status === 410) {
      await env.DB.prepare("UPDATE reminders SET enabled = 0, endpoint = NULL, updated_at = CURRENT_TIMESTAMP WHERE partner = 'pia'").run();
    } else {
      console.error("Reminder push failed", response.status);
    }
  }));
}

async function sendPush(endpoint: string, env: Env) {
  const audience = new URL(endpoint).origin;
  const header = base64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = base64Url(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: "https://physilas.github.io/adventskalender/" }));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("jwk", JSON.parse(env.VAPID_PRIVATE_JWK || "{}"), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput));
  const token = `${signingInput}.${base64Url(signature)}`;
  return fetch(endpoint, { method: "POST", headers: { Authorization: `vapid t=${token}, k=${env.VAPID_PUBLIC_KEY}`, TTL: "86400", Urgency: "high" } });
}

async function getCalendar(env: Env) {
  const columns = isTestEnvironment(env) ? "id, access_code_hash, recovery_code_hash, setup_complete, season_year, test_day" : "id, access_code_hash, recovery_code_hash, setup_complete, season_year";
  return env.DB.prepare(`SELECT ${columns} FROM calendar WHERE id = 1`).first<Calendar>();
}

function isCalendarConfigured(calendar: Calendar) {
  return calendar.setup_complete !== 0;
}

async function getSession(request: Request, env: Env): Promise<Session | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const row = await env.DB.prepare("SELECT partner FROM sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP").bind(await sha256(token)).first<Session>();
  return row && isPartner(row.partner) ? row : null;
}

async function getAdminSession(request: Request, env: Env): Promise<AdminSession | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return env.DB.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP").bind(await sha256(token)).first<AdminSession>();
}

async function issueAdminSession(env: Env) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 12 * 3_600_000).toISOString().replace("T", " ").replace("Z", "");
  await env.DB.prepare("INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)").bind(await sha256(token), expiresAt).run();
  return { token, expiresAt };
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

function answerFromRow(row: AnswerRow, hideRiddleSolution = false) {
  const kind = isAnswerKind(row.kind) ? row.kind : "text";
  const payload = parsePayload(row.payload);
  if (hideRiddleSolution && kind === "drawing-riddle" && payload) delete payload.solution;
  return { kind, content: row.content, payload, updatedAt: row.updated_at };
}
function normalisePayload(payload: unknown) { return payload && typeof payload === "object" && !Array.isArray(payload) && JSON.stringify(payload).length <= 4_000 ? payload as Record<string, unknown> : null; }
function parsePayload(value?: string | null) { try { return value ? JSON.parse(value) : null; } catch { return null; } }
function isValidAnswer(kind: AnswerKind, content: string, payload: Record<string, unknown> | null) {
  if (["text", "choice", "choice-custom", "ranking", "link"].includes(kind)) {
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
  if (kind === "drawing-riddle") return Boolean(payload && typeof payload.mediaKey === "string" && /^media\/[a-f0-9-]+\.[a-z0-9]+$/i.test(payload.mediaKey) && typeof payload.solution === "string" && payload.solution.trim().length > 0 && payload.solution.length <= 240);
  return Boolean(payload && typeof payload.mediaKey === "string" && /^media\/[a-f0-9-]+\.[a-z0-9]+$/i.test(payload.mediaKey));
}
function normaliseGuess(value: string) { return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function berlinDate() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric", day: "numeric" }).formatToParts();
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day };
}
function berlinClock() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts();
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day, time: `${String(values.hour).padStart(2, "0")}:${String(values.minute).padStart(2, "0")}` };
}
function currentYear() { return berlinDate().year; }
function isTestEnvironment(env: Env) { return env.TEST_MODE === "true"; }
function otherPartner(partner: Partner): Partner { return partner === "pia" ? "paul" : "pia"; }
function isPartner(value: unknown): value is Partner { return value === "pia" || value === "paul"; }
function isPushEndpoint(value: unknown): value is string { try { return typeof value === "string" && new URL(value).protocol === "https:"; } catch { return false; } }
function isAnswerKind(value: unknown): value is AnswerKind { return typeof value === "string" && ANSWER_KINDS.includes(value as AnswerKind); }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }); }
function corsHeaders(request: Request) { return { "access-control-allow-origin": request.headers.get("Origin") ?? "*", "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS", "access-control-allow-headers": "Authorization, Content-Type", vary: "Origin" }; }
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
function base64Url(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

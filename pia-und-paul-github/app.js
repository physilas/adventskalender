const API = (window.ADVENT_API_URL || "").replace(/\/$/, "");
const TEST_MODE = window.ADVENT_DEVELOPER_TEST === true;
const TOKEN_STORAGE_KEY = TEST_MODE ? "pia-paul-calendar-test-token" : "pia-paul-calendar-token";
const ADMIN_TOKEN_STORAGE_KEY = TEST_MODE ? "pia-paul-calendar-test-admin-token" : "pia-paul-calendar-admin-token";
const GUIDE_STORAGE_KEY = TEST_MODE ? "pia-paul-calendar-test-guide-seen" : "pia-paul-calendar-guide-seen";
const app = document.querySelector("#app");
// Dialogs implement content-only zoom; Leaflet handles its own map gestures.
const allowPinch = (target) => target instanceof Element && target.closest('.leaflet-container');
for (const type of ["gesturestart", "gesturechange", "touchmove"]) {
  document.addEventListener(type, (event) => {
    if (document.querySelector('.app-shell, [role="dialog"]') && !allowPinch(event.target) &&
        (type !== "touchmove" || event.touches.length > 1)) event.preventDefault();
  }, { passive: false });
}
const days = Array.from({ length: 24 }, (_, index) => index + 1);
const question = (kind, prompt, options = [], hint = "") => ({ kind, prompt, options, hint });
const piaHouseRanking = [
  { id: "almhuette", word: "Alpen", label: "Almhütte", image: "https://images.pexels.com/photos/34015823/pexels-photo-34015823.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "moderneshaus", word: "Modern", label: "Modernes Haus", image: "https://images.pexels.com/photos/9976121/pexels-photo-9976121.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "blauescottage", word: "Cottage", label: "Blaues Cottage", image: "https://images.pexels.com/photos/8189146/pexels-photo-8189146.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "reetdachhaus", word: "Reetdach", label: "Reetdachhaus", image: "https://images.pexels.com/photos/32403148/pexels-photo-32403148.jpeg?auto=compress&cs=tinysrgb&w=900" },
];
const paulFlowerRanking = [
  { id: "apricot", label: "Apricot", image: "https://images.pexels.com/photos/6479557/pexels-photo-6479557.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "wildblumen", label: "Wildblumen", image: "https://images.pexels.com/photos/36526032/pexels-photo-36526032.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "trockenblumen", label: "Trockenblumen", image: "https://images.pexels.com/photos/11794585/pexels-photo-11794585.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { id: "pfingstrosen", label: "Pfingstrosen", image: "https://images.pexels.com/photos/12615496/pexels-photo-12615496.jpeg?auto=compress&cs=tinysrgb&w=900" },
];
const prompts = {
  pia: [
    question("map", "Welchen Christkindlmarkt möchtest du mit Paul besuchen?"),
    question("text", "Welcher Bibelcharakter wäre Paul und warum?"),
    question("ranking", "Welche Blumensträuße würde Paul am liebsten mögen?", paulFlowerRanking, "Sortiere die Sträuße: Oben ist Platz 1."),
    question("drawing-riddle", "Zeichne einen Gegenstand, den du mit Paul verbindest. Paul darf raten, was es ist."),
    question("text", "Welches Weihnachtsgebäck solltet ihr unbedingt zusammen backen?"),
    question("offline", "Und pünktlich zum sex-ten Dezember: Was findest du an Paul besonders sexy?"),
    question("link", "Schick Paul ein Weihnachtslied.", [], "Ein Spotify-, YouTube- oder anderer Link."),
    question("text", "Nenne drei Dinge, die Paul ganz selbstverständlich gut kann."),
    question("audio", "Erzähl Paul von deinem Lieblingsmoment auf eurer Hochzeit."),
    question("text", "Welche Advents- oder Weihnachtstradition möchtet ihr weiterführen oder neu erfinden?"),
    question("map", "Wenn alles möglich wäre: Wohin würdest du mit Paul reisen?"),
    question("audio", "Lies dein Hochzeitsversprechen an Paul noch einmal vor."),
    question("link", "Teile einen Podcast oder spannenden Artikel für euren nächsten gemeinsamen Abend."),
    question("drawing", "Zeichne ein Pia-&-Paul-Logo."),
    question("audio", "Schick Paul ein Segensgebet für das kommende Jahr."),
    question("text", "Welche drei Wörter beschreiben euch als Ehepaar am besten?"),
    question("text", "Das wollte ich schon immer mal auf einem Weihnachtsmarktstand kaufen (#last minute Geschenktipp für Paul)."),
    question("text", "Lieber Paul, heute schenke ich dir einen Gutschein für …"),
    question("audio", "Welche kleine Macke von Paul hast du liebgewonnen?"),
    question("image", "Zeig Paul ein Detail eures neuen Zuhauses, das du besonders liebst."),
    question("link", "Teile etwas, das ihr bald zusammen ausprobieren könnt."),
    question("audio", "Imitiere Paul liebevoll, wenn er sich über etwas ganz Alltägliches aufregt."),
    question("text", "Woran merkst du, dass Paul dich wirklich kennt?"),
    question("gift", "Lasst euch überraschen :)"),
  ],
  paul: [
    question("audio", "Erzähl Pia einen Weihnachtswitz."),
    question("image", "Schick Pia dein Lieblingsfoto von eurer Hochzeit."),
    question("choice-custom", "Auf welches Weihnachtsdate hättest du Lust?", ["Konzert oder Theater (Tipp: U30-Tickets)", "Schlittschuhlaufen", "Café-Hopping", "Eigene Date-Idee"]),
    question("text", "Was hast du in der Ehe neu an Pia kennen und lieben gelernt?"),
    question("audio", "Welches Geräusch macht Pia häufiger mal?"),
    question("text", "Wenn Pia ein Weihnachts-Snack wäre, welcher wäre sie und warum?"),
    question("image", "Fotografiere eine Kleinigkeit, die euren Alltag für dich heimelig macht."),
    question("link", "Teile den Trailer zu dem Weihnachtsfilm, den du mit Pia sehen möchtest."),
    question("text", "Liebe Pia, heute schenke ich dir einen Gutschein für …"),
    question("image", "Schick Pia ein Rezept aus eurem Hochzeitsrezeptordner, das ihr bald kochen solltet."),
    question("text", "Wenn ich an Weihnachten (wie gewohnt) 1.000.000 € bekommen würde, dann würde ich …"),
    question("audio", "Lies dein Hochzeitsversprechen an Pia noch einmal vor."),
    question("text", "Was war dein persönliches Highlight eures ersten Ehequartals?"),
    question("drawing", "Zeichne ein Pia-&-Paul-Logo."),
    question("text", "Mache Pia ein ungewöhnliches Kompliment."),
    question("link", "Schick Pia ein Worshiplied."),
    question("text", "Nenne drei Dinge, für die du mit Pia im nächsten Jahr gerne beten möchtest."),
    question("ranking", "In welchem dieser Häuser würde Pia am liebsten wohnen?", piaHouseRanking, "Sortiere die Häuser: Oben ist Platz 1."),
    question("text", "Ich muss gestehen, dass ich seit wir verheiratet sind, …"),
    question("meme", "Schick Pia ein Meme, das sie zum Lachen bringen soll.", [], "Wähle aus, ob ein Link oder ein Foto besser passt."),
    question("map", "Markiere den Ort, an dem ihr euch besonders nah gefühlt habt."),
    question("audio", "Imitiere Pia liebevoll, wenn sie sich über etwas ganz Alltägliches aufregt."),
    question("text", "Gib eurer Ehe einen Slogan oder Filmtitel."),
    question("gift", "Lasst euch überraschen :)"),
  ],
};

let state = null;
let selectedCalendarDay = 1;
let selectedWorkshopDay = 1;
let activeView = "calendar";
let calendarDetailOpen = false;
let workshopDetailOpen = false;
let selectedPartner = "pia";
let adminMode = new URLSearchParams(window.location.search).get("admin") === "1";
let guideOpen = !adminMode && localStorage.getItem(GUIDE_STORAGE_KEY) !== "seen";
let mapPicker = null;
let mapLocation = null;
let recorder = null;
let recordedAudio = null;
let recordedAudioUrl = null;
let recordingTimer = null;
let mediaPreviewUrls = new Map();
let drawingCanvas = null;
let drawingDirty = false;

function other(partner) { return partner === "pia" ? "paul" : "pia"; }
function name(partner) { return partner === "pia" ? "Pia" : "Paul"; }
function escape(value = "") { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
function token() { return localStorage.getItem(TOKEN_STORAGE_KEY) || ""; }
function adminToken() { return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ""; }
function giftAcknowledgementKey(partner) { return `${TEST_MODE ? "pia-paul-test" : "pia-paul"}-gift-acknowledged-${partner}`; }
function hasAcknowledgedGift(partner) { return localStorage.getItem(giftAcknowledgementKey(partner)) === "yes"; }
function shuffledDoorDays(partner, year) {
  // Deterministic shuffle: festive disorder, but positions do not jump on re-render.
  let seed = [...`${partner}-${year}`].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2026);
  const order = [...days];
  for (let index = order.length - 1; index > 0; index -= 1) {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}
function lockedQuip(day, partner, year) {
  const quips = [
    "Erwischt! Was bist du denn für ein Schlingel!",
    "Da ist aber jemand ungeduldig …",
    "Psst – dieses Türchen übt noch seinen großen Auftritt.",
    "Fast! Die Überraschung versteckt sich noch hinter dem Bergkamm.",
    "So viel Vorfreude steht dir ausgezeichnet.",
    "Frecher Versuch. Der Adventskalender bleibt leider unbestechlich.",
    "Offenbar sind die Zahlen auf den Türchen für dich eher grobe Empfehlungen.",
    "Hier könnte Ihre Weihnachtswerbung stehen.",
  ];
  const order = shuffledDoorDays(partner, year);
  const position = order.indexOf(Number(day));
  // A sequential assignment prevents repeated text horizontally, vertically and
  // across a row break. The final quip stays discoverable on door 24.
  const finalDoorPosition = order.indexOf(24);
  const offset = ((quips.length - 1 - finalDoorPosition) % quips.length + quips.length) % quips.length;
  if (position < 0) return quips[0];
  return quips[(position + offset) % quips.length] || quips[0];
}
function configureMessage() { return `<main class="welcome-shell"><section class="welcome-card"><div class="heart-mark">♥</div><p class="eyebrow">Fast geschafft</p><h1>Die Verbindung fehlt noch.</h1><p class="intro">Trage zuerst die Adresse eures Cloudflare-Workers in <code>config.js</code> ein.</p></section></main>`; }
function kindLabel(kind) { return ({ text: "Text", choice: "Auswahl", "choice-custom": "Auswahl", ranking: "Ranking", image: "Foto", audio: "Sprachnachricht", drawing: "Zeichnung", "drawing-riddle": "Zeichenrätsel", map: "Ort", link: "Link", meme: "Meme", offline: "Ganz in echt", gift: "Überraschung" })[kind] || "Antwort"; }
function mediaKey(answer) { return answer?.payload?.mediaKey || ""; }
function seededValue(seed) { return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1; }
function triangularFourier(value, modes = 9) {
  // Odd sine modes approximate a triangular wave: broad faces, but crisp summits.
  let result = 0;
  for (let mode = 1; mode <= modes; mode += 2) {
    result += Math.sin(Math.PI * 2 * mode * value) * (mode % 4 === 1 ? 1 : -1) / (mode * mode);
  }
  return Math.max(0, Math.min(1, .5 + result * 4 / (Math.PI * Math.PI)));
}
function alpineRidge(day, baseline, height, layer, className) {
  const points = [];
  for (let index = 0; index <= 144; index += 1) {
    const x = index / 144;
    // Two deliberately dominant masses make this read as a mountain range. The
    // smaller Fourier modes only roughen the skyline; they no longer compete with it.
    const primaryFrequency = .49 + layer * .025;
    // Keep the main summit near the centre; only a small seeded offset varies it.
    const primaryPhase = .25 - primaryFrequency * .5 + (seededValue(day * 31 + layer * 17) - .5) * .05;
    const secondaryPhase = seededValue(day * 31 + layer * 17 + 11);
    const primary = .92 * Math.pow(triangularFourier(x * primaryFrequency + primaryPhase), 2.25);
    const secondary = .31 * Math.pow(triangularFourier(x * (1.02 + layer * .045) + secondaryPhase), 4.5);
    const foothills = .07 * Math.pow(triangularFourier(x * (1.95 + layer * .09) + seededValue(day + 47)), 5.5);
    const rockNoise = .014 * Math.sin(Math.PI * 2 * (x * (9 + layer) + seededValue(day + 91)))
      + .007 * Math.sin(Math.PI * 2 * (x * (19 + layer * 2) + seededValue(day + 103)))
      + .003 * Math.sin(Math.PI * 2 * (x * (37 + layer * 3) + seededValue(day + 119)));
    const y = baseline - height * (.18 + primary + secondary + foothills + rockNoise);
    points.push(`${(x * 120).toFixed(2)},${Math.max(4, Math.min(96, y)).toFixed(2)}`);
  }
  return `<path class="${className}" d="M0,100 L${points.join(" L")} L120,100 Z"/><path class="${className}-contour" d="M${points.join(" L")}"/>`;
}
function mountain(day) {
  return `<svg class="mountain-range" viewBox="0 0 120 100" preserveAspectRatio="none" aria-hidden="true">${alpineRidge(day, 78, 26, 1, "mountain-far")}${alpineRidge(day + 11, 88, 34, 2, "mountain-mid")}${alpineRidge(day + 23, 99, 43, 3, "mountain-front")}</svg>`;
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (token()) headers.set("Authorization", `Bearer ${token()}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Das hat leider nicht geklappt.");
  return payload;
}

async function adminApi(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (adminToken()) headers.set("Authorization", `Bearer ${adminToken()}`);
  if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Das hat leider nicht geklappt.");
  return payload;
}

async function load() {
  // The loading grid must not keep centering/shrinking the rendered app.
  app.classList.remove("loading");
  if (!API) { app.innerHTML = configureMessage(); return; }
  try {
    state = await api("/api/calendar");
    if (!state.session) localStorage.removeItem(TOKEN_STORAGE_KEY);
    if (adminMode && adminToken() && state.recoveryConfigured) {
      try { state.admin = await adminApi("/api/admin"); }
      catch { localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY); }
    }
    const revealed = state.status?.revealThrough || 1;
    selectedCalendarDay = Math.min(Math.max(1, selectedCalendarDay), revealed || 1);
    render();
  } catch (error) {
    app.innerHTML = `<main class="welcome-shell"><section class="welcome-card"><h1>Oh je.</h1><p class="intro">${escape(error.message)}</p><button class="primary-button" onclick="location.reload()">Noch einmal versuchen</button></section></main>`;
  }
}

function render() {
  if (adminMode && state.admin) { renderAdmin(); return; }
  if (!state.session) { renderAccess(); return; }
  renderApp();
}

function renderGuide() {
  if (!guideOpen || adminMode) return "";
  return `<section class="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title"><article class="guide-card"><button class="modal-close" type="button" id="close-guide" aria-label="Anleitung schließen">×</button><p class="eyebrow">Willkommen</p><h2 id="guide-title">So funktioniert euer Adventskalender</h2><p>Liebe Pia, lieber Paul,</p><p>bald ist schon die Adventszeit! Und wir haben einen Adventskalender der etwas anderen Art für euch vorbereitet.</p><p><strong>Ihr dürft euch diesen digitalen Adventskalender gegenseitig befüllen – schließlich wisst ihr selbst am besten, worüber sich der andere freut und was ihm gefällt.</strong></p><p>Und so funktioniert er:</p><ol class="guide-steps"><li>Beim ersten Öffnen legt ihr gemeinsam einen Schlüssel fest. Merkt ihn euch gut und teilt ihn nur miteinander.</li><li>In <strong>Deiner Werkstatt</strong> könnt ihr beide schon jetzt alle 24 Überraschungen für den anderen vorbereiten. Die Fragen sind absichtlich verschieden – so bleibt es spannend. Speichern nicht vergessen!</li><li>In <strong>Deinem Adventskalender</strong> warten im Dezember die Antworten des anderen hinter den Türchen. Die Türchen öffnen sich passend zum Datum. Ein früher Klick ist erlaubt, aber die Überraschung bleibt dann natürlich noch geheim.</li><li>Solange der andere eine Antwort noch nicht gesehen hat, könnt ihr sie in der Werkstatt wieder zurückziehen und neu machen. Der 24. ist schon vorbereitet – da dürft ihr euch einfach überraschen lassen.</li></ol><p>Und sollte irgendwas nicht klappen oder ihr Support brauchen, meldet euch einfach!</p><p>Wir hoffen, dass ihr genau so viel Spaß damit habt wie wir beim Erstellen! Und wenn es dann soweit ist: Eine wunderschöne erste Adventszeit als Verheiratete!</p><p class="guide-signoff">Eure Janika und Silas</p><button class="primary-button" type="button" id="guide-done">Los geht’s</button></article></section>`;
}

function renderAccess(message = "") {
  const setup = !state.configured;
  const adminSetup = adminMode && !state.recoveryConfigured;
  const personSwitch = `<fieldset><legend>Ich bin …</legend><div class="person-switch"><button type="button" data-person="pia" class="${selectedPartner === "pia" ? "selected" : ""}">Pia</button><button type="button" data-person="paul" class="${selectedPartner === "paul" ? "selected" : ""}">Paul</button></div></fieldset>`;
  const standardForm = `${personSwitch}<label for="access-code">Gemeinsamer Schlüssel</label><div class="code-field">⌘ <input id="access-code" type="password" minlength="6" maxlength="80" autocomplete="current-password" placeholder="Mindestens 6 Zeichen" required></div><button class="primary-button">${setup ? "Adventskalender anlegen" : "Adventskalender öffnen"}</button>${!setup ? '<button class="quiet-button" type="button" id="recover-access">Schlüssel vergessen? Hilfe anfragen</button>' : ""}`;
  const recoverySetupForm = `<label for="recovery-code">Dein privater Rettungscode</label><div class="code-field">✦ <input id="recovery-code" type="password" minlength="10" maxlength="80" autocomplete="new-password" placeholder="Mindestens 10 Zeichen" required></div><p class="field-hint">Bewahre ihn nur in deinem Passwortmanager auf. Er öffnet später die private Verwaltung, ohne dass Pia und Paul davon erfahren.</p><button class="primary-button">Rettungscode sichern</button>`;
  const adminLoginForm = `<label for="recovery-code">Dein privater Rettungscode</label><div class="code-field">✦ <input id="recovery-code" type="password" minlength="10" maxlength="80" autocomplete="current-password" placeholder="Dein privater Rettungscode" required></div><p class="field-hint">Nur damit öffnest du die nicht verlinkte Verwaltung für Schlüssel, Inhalte und das Geschenk am 24. Dezember.</p><button class="primary-button">Verwaltung öffnen</button>`;
  const title = adminMode ? adminSetup ? "Rettungscode sichern" : "Private Verwaltung" : setup ? "Euren Adventskalender einrichten" : "Willkommen zurück";
  const intro = adminMode ? adminSetup ? "Lege deinen privaten Rettungscode fest. Pia und Paul sehen diese Seite nicht." : "Melde dich mit deinem Rettungscode an. Dieser Bereich ist nur für dich gedacht." : setup ? "Legt euren gemeinsamen Schlüssel fest und teilt ihn anschließend nur miteinander." : "Wähle deinen Namen und öffne euren gemeinsamen Adventskalender.";
  const activeForm = adminMode ? adminSetup ? recoverySetupForm : adminLoginForm : standardForm;
  const guideButton = !adminMode ? '<button class="quiet-button guide-button" type="button" id="open-guide">Anleitung</button>' : "";
  app.innerHTML = `<main class="welcome-shell"><section class="welcome-card"><div class="heart-mark">♥</div><p class="eyebrow">Pia & Paul</p><h1>${title}</h1><p class="intro">${intro}</p>${activeForm ? `<form class="access-form" id="access-form">${activeForm}${message ? `<p class="form-message">${escape(message)}</p>` : ""}</form>` : message ? `<p class="form-message">${escape(message)}</p>` : ""}${guideButton}</section></main>${renderGuide()}`;
  const closeGuide = () => {
    guideOpen = false;
    localStorage.setItem(GUIDE_STORAGE_KEY, "seen");
    renderAccess();
  };
  document.querySelector("#open-guide")?.addEventListener("click", () => { guideOpen = true; renderAccess(); });
  document.querySelector("#close-guide")?.addEventListener("click", closeGuide);
  document.querySelector("#guide-done")?.addEventListener("click", closeGuide);
  document.querySelectorAll("[data-person]").forEach((button) => button.addEventListener("click", () => { selectedPartner = button.dataset.person; renderAccess(); }));
  document.querySelector("#recover-access")?.addEventListener("click", () => renderAccess("Wendet euch an die Person, von der ihr den Adventskalender bekommen habt. Sie kann euch mit einem neuen gemeinsamen Schlüssel helfen."));
  const form = document.querySelector("#access-form");
  setupPopupZoom();
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector("button.primary-button");
    submit.disabled = true;
    try {
      if (adminSetup) {
        await api("/api/recovery/setup", { method: "POST", body: JSON.stringify({ recoveryCode: document.querySelector("#recovery-code").value }) });
        await load();
        return;
      }
      if (adminMode) {
        const result = await api("/api/admin/session", { method: "POST", body: JSON.stringify({ recoveryCode: document.querySelector("#recovery-code").value }) });
        localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, result.token);
        await load();
        return;
      }
      const result = await api(state.configured ? "/api/session" : "/api/setup", { method: "POST", body: JSON.stringify({ partner: selectedPartner, accessCode: document.querySelector("#access-code").value }) });
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      await load();
    } catch (error) { renderAccess(error.message); }
  });
}

function adminNotice(message = "", isError = false) {
  const element = document.querySelector("#admin-message");
  if (element) { element.textContent = message; element.classList.toggle("error", isError); }
}

function renderAdmin() {
  const admin = state.admin;
  const environment = admin.testMode ? "Testversion" : "echte Version";
  const giftInputs = ["pia", "paul"].map((recipient) => `<form class="admin-gift-form" data-recipient="${recipient}"><h3>${name(recipient)}</h3><label>Rezept-PDF<input name="pdf" type="file" accept="application/pdf"></label><label>Vorschau (PNG)<input name="preview" type="file" accept="image/png"></label><button class="quiet-button" type="submit">Dateien ersetzen</button></form>`).join("");
  const testResetCard = admin.testMode ? `<section class="admin-card admin-danger admin-test-reset"><p class="eyebrow">Nur Testversion</p><h2>Testversion komplett zurücksetzen</h2><p>Entfernt alle Testinhalte, den gemeinsamen Test-Schlüssel, die Test-Rezepte und alle Sitzungen. Danach startet die Testversion wieder bei der ersten Einrichtung. Dein Rettungscode bleibt erhalten.</p><form id="admin-reset-test-form"><label><input id="admin-reset-test-check" type="checkbox" required> Ich möchte die gesamte Testversion zurücksetzen.</label><label for="admin-reset-test-phrase">Zur Bestätigung <code>TESTVERSION ZURÜCKSETZEN</code> eingeben</label><input id="admin-reset-test-phrase" class="answer-input" autocomplete="off" required><button class="danger-button">Testversion komplett zurücksetzen</button></form></section>` : "";
  app.innerHTML = `<main class="admin-shell"><header class="topbar"><div class="brand"><span class="mini-heart">♥</span><span>Pia <i>&</i> Paul</span></div><button class="quiet-button" id="admin-signout">Verwaltung schließen</button></header><section class="admin-heading"><p class="eyebrow">Privater Bereich</p><h1>Verwaltung · ${environment}</h1><p>Nur mit deinem Rettungscode erreichbar. Änderungen gelten jeweils nur für diese ${environment}.</p></section><p class="admin-message" id="admin-message" aria-live="polite"></p><section class="admin-summary"><article><b>${admin.answerCount}</b><span>Antworten</span></article><article><b>${admin.uploadCount}</b><span>persönliche Uploads</span></article><article><b>${admin.reminderEnabled ? "an" : "aus"}</b><span>Pia-Erinnerung</span></article></section><div class="admin-grid"><section class="admin-card"><p class="eyebrow">Zugang</p><h2>Gemeinsamen Schlüssel ändern</h2><p>Die bisherigen Anmeldungen von Pia und Paul werden dabei abgemeldet. Ihre Inhalte bleiben erhalten.</p><form id="admin-password-form"><label for="admin-access-code">Neuer gemeinsamer Schlüssel</label><input id="admin-access-code" class="answer-input" type="password" minlength="6" maxlength="80" autocomplete="new-password" required><button class="primary-button">Schlüssel ersetzen</button></form></section><section class="admin-card"><p class="eyebrow">Adventskalender</p><h2>Wichtige Einstellungen</h2><form id="admin-settings-form"><label for="admin-season-year">Adventsjahr</label><input id="admin-season-year" class="answer-input" type="number" min="2020" max="2100" value="${admin.seasonYear}" required>${admin.testMode ? `<label for="admin-test-day">Testtag</label><select id="admin-test-day" class="answer-input">${days.map((day) => `<option value="${day}" ${admin.testDay === day ? "selected" : ""}>${day}. Dezember</option>`).join("")}<option value="25" ${admin.testDay === 25 ? "selected" : ""}>Nach dem 24. Dezember</option></select>` : ""}<button class="quiet-button">Einstellungen speichern</button></form></section><section class="admin-card admin-gift-card"><p class="eyebrow">24. Dezember</p><h2>Rezept-Dateien ersetzen</h2><p>PDF und Vorschau werden getrennt hochgeladen. Leer gelassene Felder bleiben unverändert.</p><div class="admin-gifts">${giftInputs}</div></section><section class="admin-card"><p class="eyebrow">Erinnerung</p><h2>Handy-Erinnerung zurücksetzen</h2><p>${admin.reminderEnabled ? `Aktiviert für Pia um ${escape(admin.reminderTime)} Uhr.` : "Derzeit nicht aktiv."}</p><button class="quiet-button" id="admin-clear-reminder" ${admin.reminderEnabled ? "" : "disabled"}>Erinnerung entfernen</button></section><section class="admin-card admin-danger"><p class="eyebrow">Achtung</p><h2>Persönliche Inhalte zurücksetzen</h2><p>Dies löscht unwiderruflich Antworten, persönliche Fotos, Zeichnungen, Sprachaufnahmen, Öffnungsstände und die Erinnerung. Die Rezept-Dateien für den 24. bleiben erhalten.</p><form id="admin-reset-content-form"><label><input id="admin-reset-check" type="checkbox" required> Ich möchte die persönlichen Inhalte wirklich löschen.</label><label for="admin-reset-phrase">Zur Bestätigung <code>INHALTE LÖSCHEN</code> eingeben</label><input id="admin-reset-phrase" class="answer-input" autocomplete="off" required><button class="danger-button">Inhalte unwiderruflich zurücksetzen</button></form></section>${testResetCard}</div></main>`;
  document.querySelector("#admin-signout").addEventListener("click", () => { localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY); state.admin = null; renderAccess(); });
  document.querySelector("#admin-password-form").addEventListener("submit", async (event) => { event.preventDefault(); try { await adminApi("/api/admin/password", { method: "PUT", body: JSON.stringify({ accessCode: document.querySelector("#admin-access-code").value }) }); event.currentTarget.reset(); adminNotice("Der gemeinsame Schlüssel wurde ersetzt. Pia und Paul müssen sich erneut anmelden."); } catch (error) { adminNotice(error.message, true); } });
  document.querySelector("#admin-settings-form").addEventListener("submit", async (event) => { event.preventDefault(); try { await adminApi("/api/admin/settings", { method: "PUT", body: JSON.stringify({ seasonYear: Number(document.querySelector("#admin-season-year").value), testDay: TEST_MODE ? Number(document.querySelector("#admin-test-day").value) : undefined }) }); await load(); } catch (error) { adminNotice(error.message, true); } });
  document.querySelectorAll(".admin-gift-form").forEach((form) => form.addEventListener("submit", async (event) => { event.preventDefault(); const recipient = event.currentTarget.dataset.recipient; const pdf = event.currentTarget.querySelector('[name="pdf"]').files[0]; const preview = event.currentTarget.querySelector('[name="preview"]').files[0]; if (!pdf && !preview) { adminNotice("Wähle mindestens eine Datei aus.", true); return; } try { for (const [asset, file] of [["pdf", pdf], ["preview", preview]]) if (file) await adminApi(`/api/admin/gift?recipient=${recipient}&asset=${asset}`, { method: "PUT", body: file, headers: { "Content-Type": file.type } }); event.currentTarget.reset(); adminNotice(`Die Dateien für ${name(recipient)} wurden ersetzt.`); } catch (error) { adminNotice(error.message, true); } }));
  document.querySelector("#admin-clear-reminder")?.addEventListener("click", async () => { if (!confirm("Die Handy-Erinnerung für Pia wirklich entfernen?")) return; try { await adminApi("/api/admin/reminder", { method: "DELETE" }); await load(); } catch (error) { adminNotice(error.message, true); } });
  document.querySelector("#admin-reset-content-form").addEventListener("submit", async (event) => { event.preventDefault(); const phrase = document.querySelector("#admin-reset-phrase").value; if (!document.querySelector("#admin-reset-check").checked || phrase !== "INHALTE LÖSCHEN") { adminNotice("Bitte bestätige mit der Checkbox und dem exakten Satz.", true); return; } if (!confirm("Wirklich alle persönlichen Inhalte löschen? Dieser Schritt kann nicht rückgängig gemacht werden.")) return; try { await adminApi("/api/admin/content", { method: "DELETE", body: JSON.stringify({ confirmation: phrase }) }); await load(); } catch (error) { adminNotice(error.message, true); } });
  document.querySelector("#admin-reset-test-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const phrase = document.querySelector("#admin-reset-test-phrase").value; if (!document.querySelector("#admin-reset-test-check").checked || phrase !== "TESTVERSION ZURÜCKSETZEN") { adminNotice("Bitte bestätige mit der Checkbox und dem exakten Satz.", true); return; } if (!confirm("Die gesamte Testversion wirklich auf Anfang setzen? Das kann nicht rückgängig gemacht werden.")) return; try { await adminApi("/api/admin/test/reset", { method: "DELETE", body: JSON.stringify({ confirmation: phrase }) }); localStorage.removeItem(TOKEN_STORAGE_KEY); state.admin = null; adminNotice("Die Testversion wurde zurückgesetzt."); await load(); } catch (error) { adminNotice(error.message, true); } });
}

function renderApp(message = "") {
  const { session, status, seasonYear } = state;
  const heading = status.phase === "before" ? `Bereit für den 1. Dezember ${seasonYear}` : status.phase === "complete" ? "Alle Türchen sind offen" : `Dezember ${seasonYear}`;
  const developerControls = TEST_MODE ? renderDeveloperControls(status) : "";
  app.innerHTML = `<main class="app-shell ${activeView === "calendar" ? "calendar-shell" : "workshop-shell"}"><header class="topbar"><div class="brand"><span class="mini-heart">♥</span><span>Pia <i>&</i> Paul</span></div><button class="quiet-button" id="signout">Abmelden</button></header><section class="hero-row"><div><p class="eyebrow">Adventskalender</p><h1>${heading}</h1></div><p class="hero-note">${activeView === "calendar" ? `Für dich: die kleinen Überraschungen von ${name(other(session.partner))}.` : `Deine Werkstatt: Bereite alle 24 Überraschungen für ${name(other(session.partner))} vor.`}</p></section><nav class="view-switch" aria-label="Bereich wählen"><button data-view="calendar" class="${activeView === "calendar" ? "selected" : ""}">♥ Dein Adventskalender</button><button data-view="workshop" class="${activeView === "workshop" ? "selected" : ""}">✦ Deine Werkstatt</button></nav>${developerControls}${activeView === "calendar" ? renderCalendar() : renderWorkshop(message)}</main>`;
  document.querySelector("#signout").addEventListener("click", () => { localStorage.removeItem(TOKEN_STORAGE_KEY); state.session = null; render(); });
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.view; calendarDetailOpen = false; workshopDetailOpen = false; renderApp(); }));
  bindDeveloperControls();
  if (activeView === "calendar") bindCalendar(); else bindWorkshop();
  setupPopupZoom();
}

function setupPopupZoom() {
  document.querySelectorAll('[role="dialog"] > article').forEach((card) => {
    if (card.querySelector('.popup-zoom-scroll')) return;
    const initialHeight = card.getBoundingClientRect().height;
    const scroll = document.createElement('div');
    scroll.className = 'popup-zoom-scroll';
    const content = document.createElement('div');
    content.className = 'popup-zoom-content';
    [...card.childNodes].filter(node => !node.classList?.contains('modal-close')).forEach(node => content.append(node));
    scroll.append(content);
    card.append(scroll);
    card.classList.add('content-zoom-card');
    card.style.height = `${initialHeight}px`;
    let scale = 1;
    let pinch = null;
    const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    scroll.addEventListener('touchstart', event => {
      if (event.touches.length !== 2 || event.target.closest('.leaflet-container, canvas')) return;
      const rect = scroll.getBoundingClientRect();
      const x = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
      const y = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
      content.style.width = `${scroll.clientWidth}px`;
      pinch = { distance: distance(event.touches), scale, x: (scroll.scrollLeft + x) / scale, y: (scroll.scrollTop + y) / scale };
      event.preventDefault();
    }, { passive: false });
    scroll.addEventListener('touchmove', event => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      scale = Math.max(1, Math.min(2.5, pinch.scale * distance(event.touches) / Math.max(1, pinch.distance)));
      content.style.zoom = String(scale);
      const rect = scroll.getBoundingClientRect();
      scroll.scrollLeft = pinch.x * scale - ((event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left);
      scroll.scrollTop = pinch.y * scale - ((event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top);
      reset.hidden = scale === 1;
    }, { passive: false });
    for (const type of ['touchend', 'touchcancel']) scroll.addEventListener(type, () => { pinch = null; });
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'popup-zoom-reset';
    reset.textContent = '100 %';
    reset.setAttribute('aria-label', 'Vergrößerung zurücksetzen');
    reset.hidden = true;
    reset.addEventListener('click', () => {
      scale = 1;
      content.style.zoom = '1';
      content.style.width = '';
      scroll.scrollLeft = 0;
      reset.hidden = true;
    });
    card.append(reset);
  });
}

function renderDeveloperControls(status) {
  const testDay = status.phase === "complete" ? 25 : (status.writeDay || 1);
  return `<section class="developer-panel"><p class="eyebrow">Entwickler-Testmodus</p><form id="test-day-form"><label for="test-day">Simulierter Adventstag</label><div class="test-day-controls"><select id="test-day">${days.map((day) => `<option value="${day}" ${day === testDay ? "selected" : ""}>${day}. Dezember</option>`).join("")}<option value="25" ${testDay === 25 ? "selected" : ""}>Nach dem 24. Dezember</option></select><button class="quiet-button" type="submit">Tag übernehmen</button></div></form><p>Diese Steuerung gibt es nur in der separaten Testumgebung.</p></section>`;
}

function bindDeveloperControls() {
  const testForm = document.querySelector("#test-day-form");
  if (testForm) testForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try { await api("/api/test/day", { method: "POST", body: JSON.stringify({ day: Number(document.querySelector("#test-day").value) }) }); await load(); }
    catch (error) { renderApp(error.message); }
  });
}

function renderCalendar() {
  const { session, status, partnerAnswers = {}, seenDays = [] } = state;
  const revealed = status.revealThrough || 0;
  const doors = shuffledDoorDays(session.partner, state.seasonYear).map((day) => {
    const unlocked = day <= revealed;
    const answer = partnerAnswers[day];
    const isGift = ["gift", "offline"].includes(prompts[other(session.partner)][day - 1].kind);
    const seen = seenDays.includes(day);
    const stateClass = !unlocked ? "locked" : isGift || answer ? (seen ? "seen" : "new") : "missing";
    const symbol = !unlocked ? "🔒" : isGift || answer ? (seen ? "✓" : "♥") : "◷";
    return `<button class="door calendar-door ${stateClass} ${selectedCalendarDay === day ? "active" : ""}" data-calendar-day="${day}">${mountain(day)}<span>${day}</span><b aria-hidden="true">${symbol}</b></button>`;
  }).join("");
  const unlocked = selectedCalendarDay <= revealed;
  const partner = other(session.partner);
  const prompt = prompts[partner][selectedCalendarDay - 1];
  const answer = partnerAnswers[selectedCalendarDay];
  const detail = !unlocked ? `<div class="locked-copy"><h2>${lockedQuip(selectedCalendarDay, session.partner, state.seasonYear)}</h2><p>Dieses Türchen öffnet sich am ${selectedCalendarDay}. Dezember. Bis dahin bleibt die Überraschung ganz tapfer geheim.</p></div>` : prompt.kind === "gift" ? renderGiftCopy(session.partner) : prompt.kind === "offline" ? renderOfflineCalendarCopy(prompt) : `<p class="answer-kind">${kindLabel(prompt.kind)}</p><h2>${escape(prompt.prompt)}</h2>${answer ? renderAnswer(answer, prompt) : `<section class="waiting-copy"><span>◷</span><p>${name(partner)} hat dieses Türchen noch nicht gefüllt. Vielleicht kommt die Überraschung etwas später.</p></section>`}`;
  const modal = calendarDetailOpen ? `<section class="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="door-title"><article class="door-detail"><button class="modal-close" type="button" aria-label="Türchen schließen">×</button><div class="detail-top"><p class="eyebrow">${unlocked ? `Türchen ${selectedCalendarDay}` : "Bis bald"}</p><span class="status-pill">${unlocked ? "♥ für dich" : "🔒 verschlossen"}</span></div><div id="door-title">${detail}</div></article></section>` : "";
  return `<section class="calendar-layout calendar-layout--calendar"><nav class="door-grid" aria-label="Deine Adventstürchen">${doors}</nav></section>${modal}<p class="legend calendar-legend"><span class="legend-new">♥</span> neue Überraschung <span class="legend-seen">✓</span> schon angesehen <span class="legend-missing">◷</span> noch offen</p>`;
}

function renderAnswer(answer, prompt) {
  if (answer.kind === "ranking" && prompt?.options) return renderRankingAnswer(answer, prompt);
  if (answer.kind === "drawing-riddle") return `<section class="received-note media-answer"><p class="note-label">Ein Zeichenrätsel für dich</p><div class="media-slot image-slot" data-media-kind="image" data-media-key="${escape(mediaKey(answer))}">Wird geladen …</div><p class="riddle-solution"><strong>Die Lösung:</strong> ${escape(answer.payload?.solution || "wird noch verraten")}</p></section>`;
  if (answer.kind === "image" || answer.kind === "drawing") return `<section class="received-note media-answer"><p class="note-label">${answer.kind === "drawing" ? "Eine Zeichnung für dich" : "Ein Foto für dich"}</p><div class="media-slot image-slot" data-media-kind="image" data-media-key="${escape(mediaKey(answer))}">Wird geladen …</div></section>`;
  if (answer.kind === "audio") return `<section class="received-note media-answer"><p class="note-label">Eine Sprachnachricht für dich</p><div class="media-slot audio-slot" data-media-kind="audio" data-media-key="${escape(mediaKey(answer))}">Wird geladen …</div></section>`;
  if (answer.kind === "map") {
    const { lat, lng, label = "Dieser Ort" } = answer.payload || {};
    const url = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=15/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
    return `<section class="received-note"><p class="note-label">Ein Ort für euch</p><p>${escape(label)}</p><div class="received-map" data-received-map data-lat="${escape(lat)}" data-lng="${escape(lng)}" data-label="${escape(label)}">Karte wird geladen …</div><a class="map-link" href="${url}" target="_blank" rel="noopener">In OpenStreetMap öffnen ↗</a></section>`;
  }
  if (answer.kind === "link") return `<section class="received-note"><p class="note-label">Ein Link für dich</p><a class="shared-link" href="${escape(answer.content)}" target="_blank" rel="noopener">${escape(answer.content)} ↗</a></section>`;
  return `<section class="received-note"><p class="note-label">${answer.kind === "choice" ? "Die Wahl von " + name(other(state.session.partner)) : "Eine Nachricht für dich"}</p><p>${escape(answer.content)}</p></section>`;
}

function rankingOrder(content) {
  try {
    const order = JSON.parse(content);
    return Array.isArray(order) && order.every((id) => typeof id === "string") ? order : [];
  } catch { return []; }
}

function renderRankingAnswer(answer, prompt) {
  const options = prompt.options || [];
  const order = rankingOrder(answer.content);
  const ranked = order.map((id) => options.find((option) => option.id === id)).filter(Boolean);
  if (ranked.length !== options.length) return `<section class="received-note"><p class="note-label">Das Ranking von ${name(other(state.session.partner))}</p><p>Dieses Ranking wird gerade noch sortiert.</p></section>`;
  return `<section class="received-note ranking-answer"><p class="note-label">Das Ranking von ${name(other(state.session.partner))}</p><div class="ranking-result">${ranked.map((option, index) => `<article><span>${index + 1}</span><img src="${escape(option.image)}" alt="${escape(option.label)}"><p>${escape(option.label)}</p></article>`).join("")}</div></section>`;
}

function bindCalendar() {
  document.querySelectorAll("[data-calendar-day]").forEach((button) => button.addEventListener("click", async () => {
    selectedCalendarDay = Number(button.dataset.calendarDay);
    calendarDetailOpen = true;
    const unlocked = selectedCalendarDay <= (state.status.revealThrough || 0);
    const partner = other(state.session.partner);
    const hasVisibleSurprise = Boolean(state.partnerAnswers[selectedCalendarDay]) || ["gift", "offline"].includes(prompts[partner][selectedCalendarDay - 1].kind);
    if (unlocked && hasVisibleSurprise && !state.seenDays.includes(selectedCalendarDay)) {
      state.seenDays.push(selectedCalendarDay);
      api("/api/doors/open", { method: "POST", body: JSON.stringify({ day: selectedCalendarDay }) }).catch(() => state.seenDays = state.seenDays.filter((day) => day !== selectedCalendarDay));
    }
    renderApp();
  }));
  document.querySelector(".modal-close")?.addEventListener("click", () => { calendarDetailOpen = false; renderApp(); });
  hydrateMedia();
  setupGiftDownloads();
  setupReceivedMaps();
  setupRiddleGuess();
}

function renderWorkshop(message = "") {
  const { session, status, ownAnswers = {} } = state;
  const today = status.phase === "active" ? status.writeDay : status.phase === "complete" ? 25 : 0;
  const giftAcknowledged = hasAcknowledgedGift(session.partner);
  const doors = days.map((day) => {
    const answer = ownAnswers[day];
    const doorPrompt = prompts[session.partner][day - 1];
    const isGiftDoor = doorPrompt.kind === "gift";
    const isComplete = Boolean(answer) || (isGiftDoor && giftAcknowledged);
    // Auch das flüsternde Türchen und die Überraschung folgen farblich exakt
    // den normalen Werkstatt-Zuständen; sie bekommen keine Sonderfarbe.
    const stateClass = isComplete ? "complete" : day < today ? "overdue" : day === today ? "today" : "upcoming";
    const marker = isComplete ? "✓" : day < today ? "!" : day === today ? "•" : "";
    return `<button class="door workshop-door ${stateClass} ${selectedWorkshopDay === day ? "active" : ""}" data-workshop-day="${day}">${mountain(day)}<span>${day}</span><b aria-hidden="true">${marker}</b></button>`;
  }).join("");
  const prompt = prompts[session.partner][selectedWorkshopDay - 1];
  const answer = ownAnswers[selectedWorkshopDay];
  const isGift = prompt.kind === "gift";
  const isOffline = prompt.kind === "offline";
  const canRetract = state.withdrawableDays?.includes(selectedWorkshopDay);
  const retractControl = answer ? canRetract ? `<button type="button" class="retract-button" id="retract-answer">Antwort zurückziehen</button>` : `<p class="retract-note">Diese Antwort wurde schon geöffnet und bleibt deshalb als Überraschung erhalten.</p>` : "";
  const detail = `<article class="door-detail workshop-detail"><button class="modal-close" type="button" aria-label="Werkstatt-Türchen schließen">×</button><div class="detail-top"><p class="eyebrow workshop-detail-title"><span>Werkstatt</span><span>Türchen ${selectedWorkshopDay}</span></p><span class="status-pill">${isGift ? giftAcknowledged ? "✓ vorbereitet" : "✦ Überraschung" : isOffline ? "♥ ganz in echt" : answer ? "✓ vorbereitet" : prompt.kind === "ranking" ? "↕ sortieren" : selectedWorkshopDay < today ? "! nachholen" : "✦ frei gestaltbar"}</span></div>${isGift ? renderGiftCopy(undefined, giftAcknowledged) : isOffline ? renderOfflineWorkshopCopy(prompt, other(session.partner)) : `<p class="answer-kind">${kindLabel(prompt.kind)}</p><h2>${escape(prompt.prompt)}</h2>${prompt.hint ? `<p class="prompt-hint">${escape(prompt.hint)}</p>` : ""}${renderEditor(prompt, answer)}${retractControl}${message ? `<p class="save-message">${escape(message)}</p>` : ""}`}</article>`;
  const modal = workshopDetailOpen ? `<section class="workshop-modal" role="dialog" aria-modal="true" aria-label="Werkstatt-Türchen ${selectedWorkshopDay}">${detail}</section>` : "";
  return `<section class="calendar-layout workshop-layout"><nav class="door-grid" aria-label="Deine Werkstatt-Türchen">${doors}</nav></section>${modal}<p class="legend workshop-legend"><span class="legend-complete">✓</span> vorbereitet <span class="legend-missing">!</span> nachholen <span class="legend-today">•</span> heute</p>`;
}

function renderGiftCopy(recipient, acknowledged = false) {
  if (!recipient) return `<section class="gift-copy"><span aria-hidden="true">✦</span><h2>Lasst euch überraschen :)</h2><p>Dieses Türchen ist schon für euch vorbereitet.</p>${acknowledged ? '<p class="field-hint">✓ Die Überraschung wartet geduldig auf Weihnachten.</p>' : '<button class="primary-button" type="button" id="acknowledge-gift">Oh schön, ich freue mich!</button>'}</section>`;
  const recipe = recipient === "pia"
    ? { title: "Sommer-Bolognese", previewKey: "gift/pia/vorschau.png", pdfKey: "gift/pia/rezept.pdf", alt: "Vorschau des Rezepts Sommer-Bolognese" }
    : { title: "Sommer-Bolognese in Python", previewKey: "gift/paul/vorschau.png", pdfKey: "gift/paul/rezept.pdf", alt: "Vorschau des Python-Rezepts Sommer-Bolognese" };
  return `<section class="gift-copy gift-recipe"><span aria-hidden="true">✦</span><p class="answer-kind">Euer Hochzeitsgeschenk</p><h2>${recipe.title}</h2><p>Liebe Pia, lieber Paul, heute gibt es ein kleines nachgeholtes Hochzeitsgeschenk von uns! Hier findest du eines unserer liebsten Rezepte für euer Rezeptbuch :) Gottes Segen für euer erstes Weihnachten als Ehepaar und viel Freude beim Nachkochen! Eure Janika und Silas</p><div class="gift-preview"><div class="gift-preview-media media-slot" data-media-kind="image" data-media-key="${recipe.previewKey}" data-media-alt="${recipe.alt}">Rezeptvorschau wird geladen …</div><span>Vorschau eures Rezepts</span></div><button class="gift-download" type="button" data-gift-download data-media-key="${recipe.pdfKey}" data-download-name="${recipient}-rezept.pdf">PDF herunterladen</button></section>`;
}
function renderOfflineWorkshopCopy(prompt, partner) {
  const reminder = state.session.partner === "pia" && selectedWorkshopDay === 6 ? renderPiaReminder() : "";
  return `<section class="gift-copy offline-copy"><span aria-hidden="true">♥</span><p class="answer-kind">Ganz in echt</p><h2>${escape(prompt.prompt)}</h2><p>Dieses Mal nichts schreiben, sondern ${name(partner)} ganz in echt etwas ins Ohr flüstern.</p>${reminder}</section>`;
}
function renderPiaReminder() {
  return `<section class="reminder-settings" aria-live="polite"><p class="note-label">Kleine Erinnerung für Pia</p><p class="field-hint">Wenn du magst, erinnert dich dein Handy am 6. Dezember an dieses Türchen.</p><label class="choice-option"><input type="radio" name="reminder-choice" value="enabled"><span>Erinnere mich am 6. Dezember!</span></label><div id="reminder-time-wrap" hidden><label for="reminder-time">Uhrzeit</label><input class="answer-input" id="reminder-time" type="time" value="09:00" step="60"></div><label class="choice-option"><input type="radio" name="reminder-choice" value="disabled" checked><span>Ich denke selber dran.</span></label><p class="field-hint" id="reminder-status">Die Erinnerung ist ausgeschaltet.</p></section>`;
}
function renderOfflineCalendarCopy(prompt) { return `<section class="gift-copy offline-copy"><span aria-hidden="true">♥</span><p class="answer-kind">Ganz in echt</p><h2>${escape(prompt.prompt)}</h2><p>Die Antwort bleibt heute zwischen euch beiden.</p></section>`; }

function renderEditor(prompt, answer) {
  const old = answer || {};
  if (prompt.kind === "text") { const length = (old.content || "").length; return `<form class="answer-form" id="answer-form"><label for="answer">Deine Antwort für ${name(other(state.session.partner))}</label><textarea id="answer" maxlength="2000" placeholder="Schreib, was dir gerade im Herzen liegt …" required>${escape(old.content || "")}</textarea><div class="answer-footer"><span id="count" aria-live="polite" ${length < 1800 ? "hidden" : ""}>${length}/2000 Zeichen</span><button class="primary-button">Antwort speichern</button></div></form>`; }
  if (prompt.kind === "choice") return `<form class="answer-form" id="answer-form"><fieldset class="choice-list"><legend>Deine Wahl für ${name(other(state.session.partner))}</legend>${prompt.options.map((option) => `<label class="choice-option"><input type="radio" name="choice" value="${escape(option)}" ${old.content === option ? "checked" : ""} required><span>${escape(option)}</span></label>`).join("")}</fieldset><button class="primary-button">Antwort speichern</button></form>`;
  if (prompt.kind === "choice-custom") return `<form class="answer-form" id="answer-form"><fieldset class="choice-list"><legend>Deine Date-Idee für ${name(other(state.session.partner))}</legend>${prompt.options.map((option) => `<label class="choice-option"><input type="radio" name="choice" value="${escape(option)}" ${prompt.options.includes(old.content) ? old.content === option ? "checked" : "" : option === "Eigene Date-Idee" ? "checked" : ""}><span>${escape(option)}</span></label>`).join("")}</fieldset><label for="choice-custom">Oder deine eigene Idee</label><input class="answer-input" id="choice-custom" maxlength="240" placeholder="Zum Beispiel: Plätzchen backen und verschenken" value="${escape(prompt.options.includes(old.content) ? "" : old.content || "")}"><button class="primary-button">Antwort speichern</button></form>`;
  if (prompt.kind === "ranking") return renderRankingEditor(prompt, old);
  if (prompt.kind === "link") return `<form class="answer-form" id="answer-form"><label for="answer">Link für ${name(other(state.session.partner))}</label><input class="answer-input" id="answer" type="url" placeholder="https://…" value="${escape(old.content || "")}" required><p class="field-hint">Spotify, YouTube, Mediathek oder jeder andere Link – ohne Konto-Verknüpfung.</p><button class="primary-button">Link speichern</button></form>`;
  if (prompt.kind === "meme") return renderMemeEditor(old);
  if (prompt.kind === "image") return renderMediaEditor("image", old, "Foto auswählen", "Ein neues Foto ersetzt das bisherige.");
  if (prompt.kind === "audio") return renderMediaEditor("audio", old, "Audiodatei auswählen", "Oder nimm direkt hier eine kurze Nachricht auf.");
  if (prompt.kind === "drawing" || prompt.kind === "drawing-riddle") return renderDrawingEditor(prompt, old);
  if (prompt.kind === "map") {
    const location = old.payload || { lat: 48.137, lng: 11.575, label: "" };
    return `<form class="answer-form" id="answer-form"><label for="place-label">Wie möchtest du diesen Ort nennen?</label><input class="answer-input" id="place-label" maxlength="200" placeholder="Zum Beispiel: Unser Lieblingscafé" value="${escape(location.label || "")}" required><div class="map-search"><input class="answer-input" id="map-search" type="search" placeholder="Ort oder Adresse suchen"><button type="button" class="quiet-button" id="search-map">Suchen</button></div><div id="map-search-results" class="map-search-results" aria-live="polite"></div><div id="map-picker" class="map-picker"></div><p class="field-hint" id="map-coordinates">Tippe auf die Karte, um den Ort festzulegen.</p><button type="button" class="quiet-button locate-button" id="locate-me">Meinen aktuellen Standort verwenden</button><button class="primary-button">Ort speichern</button></form>`;
  }
  return "";
}

function renderDrawingEditor(prompt, old) {
  const isRiddle = prompt.kind === "drawing-riddle";
  const solution = old.payload?.solution || "";
  return `<form class="answer-form" id="answer-form"><label>Deine Zeichnung für ${name(other(state.session.partner))}</label>${old.payload?.mediaKey ? `<div class="existing-media" data-media-kind="image" data-media-key="${escape(old.payload.mediaKey)}">Bisherige Zeichnung wird geladen …</div>` : ""}<canvas id="drawing-canvas" width="900" height="560" aria-label="Zeichenfläche"></canvas><div class="draw-tools"><div class="draw-palette" aria-label="Stiftfarbe wählen"><button type="button" class="color-swatch selected" data-color="#941f42" style="--swatch:#941f42" aria-label="Rot"></button><button type="button" class="color-swatch" data-color="#e8b65e" style="--swatch:#e8b65e" aria-label="Gelb"></button><button type="button" class="color-swatch" data-color="#4d8560" style="--swatch:#4d8560" aria-label="Grün"></button><button type="button" class="color-swatch" data-color="#a7d8a5" style="--swatch:#a7d8a5" aria-label="Hellgrün"></button><button type="button" class="color-swatch" data-color="#3f6cae" style="--swatch:#3f6cae" aria-label="Blau"></button><button type="button" class="color-swatch" data-color="#91cde2" style="--swatch:#91cde2" aria-label="Hellblau"></button><button type="button" class="color-swatch" data-color="#8b9199" style="--swatch:#8b9199" aria-label="Grau"></button><button type="button" class="color-swatch" data-color="#261923" style="--swatch:#261923" aria-label="Schwarz"></button><button type="button" class="color-swatch white" data-color="#fffaf5" style="--swatch:#fffaf5" aria-label="Weiß"></button><button type="button" class="color-swatch" data-color="#e7b98d" style="--swatch:#e7b98d" aria-label="Hautfarbe"></button><button type="button" class="color-swatch" data-color="#b77b52" style="--swatch:#b77b52" aria-label="Hellbraun"></button><button type="button" class="eraser-button" id="eraser" aria-label="Radierer">⌫</button></div><label class="brush-size" for="brush-size">Größe <input id="brush-size" type="range" min="3" max="40" value="9"><output id="brush-size-value">9</output></label><button type="button" class="quiet-button" id="clear-drawing">Zeichnung löschen</button></div>${isRiddle ? `<label for="riddle-solution">Was ist es? (Paul sieht die Lösung erst nach einem richtigen Tipp.)</label><input class="answer-input" id="riddle-solution" maxlength="240" value="${escape(solution)}" placeholder="Zum Beispiel: unser Toaster" required>` : ""}<p class="field-hint">Mit dem Finger oder der Maus malen. Die Größe gilt auch für den Radierer.</p><button class="primary-button">Zeichnung speichern</button></form>`;
}

function renderMemeEditor(old) {
  const mode = old.kind === "image" ? "image" : "link";
  const previous = old.kind === "image" && old.payload?.mediaKey ? `<div class="existing-media" data-media-kind="image" data-media-key="${escape(old.payload.mediaKey)}">Bisheriges Meme wird geladen …</div>` : "";
  return `<form class="answer-form meme-form" id="answer-form"><fieldset class="choice-list"><legend>Wie möchtest du Pia dein Meme schicken?</legend><label class="choice-option"><input type="radio" name="meme-kind" value="link" ${mode === "link" ? "checked" : ""}><span>Einen Link schicken</span></label><label class="choice-option"><input type="radio" name="meme-kind" value="image" ${mode === "image" ? "checked" : ""}><span>Ein Foto hochladen</span></label></fieldset><div data-meme-editor="link" ${mode === "image" ? "hidden" : ""}><label for="meme-link">Meme-Link</label><input class="answer-input" id="meme-link" type="url" placeholder="https://…" value="${escape(old.kind === "link" ? old.content || "" : "")}"></div><div data-meme-editor="image" ${mode === "link" ? "hidden" : ""}><label for="media-file">Meme-Foto auswählen</label>${previous}<input class="file-input" id="media-file" type="file" accept="image/*"><div id="upload-preview" class="upload-preview" hidden></div><p class="field-hint">Dein Foto wird vor dem Upload automatisch verkleinert und komprimiert.</p></div><p class="field-hint">Wähle einfach das Format, das zu deinem Meme besser passt.</p><button class="primary-button">Meme speichern</button></form>`;
}

function renderRankingEditor(prompt, old) {
  const savedOrder = rankingOrder(old.content || "");
  const orderedOptions = savedOrder.length === prompt.options.length ? savedOrder.map((id) => prompt.options.find((option) => option.id === id)).filter(Boolean) : prompt.options;
  const noun = prompt.options[0]?.id === "apricot" ? "Blumensträuße" : "Häuser";
  return `<form class="answer-form ranking-form" id="answer-form"><fieldset><legend>Die ${noun}</legend><div class="ranking-grid">${prompt.options.map((option) => `<article class="ranking-card" data-option-id="${escape(option.id)}"><img src="${escape(option.image)}" alt="${escape(option.label)}"><span>${escape(option.label)}</span></article>`).join("")}</div></fieldset><fieldset><legend>Deine mögliche Reihenfolge</legend><div class="ranking-list" id="ranking-list" aria-label="Ranking per Ziehen sortieren">${orderedOptions.map((option, index) => `<div class="ranking-row" data-ranking-id="${escape(option.id)}" tabindex="0"><span class="ranking-grip" aria-hidden="true">⠿</span><span class="ranking-place">${index + 1}</span><span class="ranking-label">${escape(option.label)}</span></div>`).join("")}</div></fieldset><p class="field-hint">Ziehe die Ranglisten-Kacheln an den Griffpunkten nach oben oder unten. Die Fotos oben bleiben dabei unverändert.</p><button class="primary-button">Ranking speichern</button></form>`;
}

function renderMediaEditor(kind, old, label, hint) {
  const accept = kind === "audio" ? "audio/webm,audio/mp4,audio/mpeg,audio/ogg,audio/wav" : "image/*";
  const previous = old.payload?.mediaKey ? `<div class="existing-media" data-media-kind="${kind === "audio" ? "audio" : "image"}" data-media-key="${escape(old.payload.mediaKey)}">Bisheriger Beitrag wird geladen …</div>` : "";
  const recorderUi = kind === "audio" ? `<div class="voice-recorder"><button type="button" class="record-button" id="record-audio" aria-label="Aufnahme starten">●</button><div><strong id="record-status">Zum Aufnehmen antippen</strong><span id="record-timer">0:00</span></div><div class="voice-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div><div id="audio-preview" class="audio-preview" hidden></div>` : "";
  const preview = kind === "image" ? '<div id="upload-preview" class="upload-preview" hidden></div>' : "";
  const sizeHint = kind === "image" ? "Dein Foto wird vor dem Upload automatisch verkleinert und komprimiert." : hint;
  return `<form class="answer-form" id="answer-form"><label for="media-file">${label}</label>${previous}<input class="file-input" id="media-file" type="file" accept="${accept}">${preview}<p class="field-hint">${sizeHint}</p><div class="record-row">${recorderUi}</div><button class="primary-button">${kind === "audio" ? "Sprachnachricht speichern" : "Foto speichern"}</button></form>`;
}

function bindWorkshop() {
  document.querySelectorAll("[data-workshop-day]").forEach((button) => button.addEventListener("click", () => { selectedWorkshopDay = Number(button.dataset.workshopDay); workshopDetailOpen = true; renderApp(); }));
  if (!workshopDetailOpen) return;
  const prompt = prompts[state.session.partner][selectedWorkshopDay - 1];
  const answer = state.ownAnswers[selectedWorkshopDay];
  const textarea = document.querySelector("#answer");
  if (textarea?.tagName === "TEXTAREA") textarea.addEventListener("input", () => {
    const count = document.querySelector("#count");
    if (!count) return;
    count.textContent = `${textarea.value.length}/2000 Zeichen`;
    count.hidden = textarea.value.length < 1800;
  });
  const form = document.querySelector("#answer-form");
  if (form) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector(".primary-button");
    button.disabled = true;
    try {
      const result = await saveWorkshopAnswer(prompt, answer);
      state.ownAnswers[selectedWorkshopDay] = result;
      renderApp("Gespeichert – du kannst deinen Beitrag jederzeit noch ändern.");
    } catch (error) {
      button.disabled = false;
      const message = document.createElement("p");
      message.className = "save-message";
      message.textContent = error.message;
      form.append(message);
    }
  });
  if (prompt.kind === "audio") setupRecorder();
  if (prompt.kind === "audio") setupAudioFilePreview();
  if (prompt.kind === "drawing" || prompt.kind === "drawing-riddle") setupDrawing();
  if (prompt.kind === "map") setupMap(answer?.payload);
  if (prompt.kind === "image") setupPhotoPreview();
  if (prompt.kind === "meme") setupMemeEditor();
  if (prompt.kind === "ranking") setupRankingSort();
  if (prompt.kind === "offline" && state.session.partner === "pia" && selectedWorkshopDay === 6) setupPiaReminder();
  document.querySelector("#acknowledge-gift")?.addEventListener("click", () => {
    localStorage.setItem(giftAcknowledgementKey(state.session.partner), "yes");
    renderApp("Wunderbar – das Türchen ist für Weihnachten aktiviert.");
  });
  document.querySelector("#retract-answer")?.addEventListener("click", async () => {
    if (!window.confirm("Antwort wirklich zurückziehen? Sie wird wieder als unbearbeitet angezeigt.")) return;
    const button = document.querySelector("#retract-answer");
    button.disabled = true;
    try {
      await api(`/api/answers/${selectedWorkshopDay}`, { method: "DELETE" });
      delete state.ownAnswers[selectedWorkshopDay];
      state.withdrawableDays = state.withdrawableDays.filter((day) => day !== selectedWorkshopDay);
      renderApp("Antwort zurückgezogen – das Türchen ist wieder unbearbeitet.");
    } catch (error) {
      button.disabled = false;
      renderApp(error.message);
    }
  });
  document.querySelector(".workshop-modal .modal-close")?.addEventListener("click", () => { workshopDetailOpen = false; renderApp(); });
  hydrateMedia();
}

async function setupPiaReminder() {
  const status = document.querySelector("#reminder-status");
  const timeInput = document.querySelector("#reminder-time");
  const timeWrap = document.querySelector("#reminder-time-wrap");
  const radios = [...document.querySelectorAll('input[name="reminder-choice"]')];
  if (!status || !timeInput || !timeWrap || !radios.length) return;
  const setUi = (enabled, time = "09:00", message = "") => {
    radios.forEach((radio) => { radio.checked = radio.value === (enabled ? "enabled" : "disabled"); });
    timeInput.value = time;
    timeWrap.hidden = !enabled;
    status.textContent = message || (enabled ? `Erinnerung für den 6. Dezember um ${time} Uhr eingestellt.` : "Die Erinnerung ist ausgeschaltet.");
  };
  try {
    const setting = await api("/api/reminder");
    if (!setting.publicKey) {
      status.textContent = "Die Erinnerungsfunktion wird gerade noch eingerichtet.";
      return;
    }
    setUi(setting.enabled, setting.time);
    if (TEST_MODE) {
      const testButton = document.createElement("button");
      testButton.type = "button";
      testButton.className = "primary-button";
      testButton.textContent = "Testbenachrichtigung senden";
      status.after(testButton);
      testButton.addEventListener("click", async () => {
        testButton.disabled = true;
        try {
          await enablePiaReminder(setting.publicKey, timeInput.value, setUi);
          await api("/api/reminder/test", { method: "POST" });
          status.textContent = "Test angefordert. Verlasse jetzt die App oder sperre dein Handy. Die Nachricht wird in etwa 10 Sekunden versendet.";
        } catch (error) { status.textContent = error.message; }
        finally { testButton.disabled = false; }
      });
    }
    radios.forEach((radio) => radio.addEventListener("change", async () => {
      try {
        if (radio.value === "enabled") await enablePiaReminder(setting.publicKey, timeInput.value, setUi);
        else await disablePiaReminder(timeInput.value, setUi);
      } catch (error) {
        setUi(false, timeInput.value, error.message);
      }
    }));
    timeInput.addEventListener("change", async () => {
      if (!document.querySelector('input[name="reminder-choice"]:checked')?.value.includes("enabled")) return;
      try { await enablePiaReminder(setting.publicKey, timeInput.value, setUi); }
      catch (error) { status.textContent = error.message; }
    });
  } catch (error) { status.textContent = error.message; }
}

async function enablePiaReminder(publicKey, time, setUi) {
  if (!window.Notification || !navigator.serviceWorker || !window.PushManager) throw new Error("Dieses Gerät unterstützt leider keine Web-Benachrichtigungen.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bitte erlaube Benachrichtigungen, damit die Erinnerung funktionieren kann.");
  await navigator.serviceWorker.register("service-worker.js");
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(publicKey) });
  await api("/api/reminder", { method: "PUT", body: JSON.stringify({ enabled: true, time, endpoint: subscription.endpoint }) });
  setUi(true, time);
}

async function disablePiaReminder(time, setUi) {
  const registration = await navigator.serviceWorker.getRegistration("service-worker.js");
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();
  await api("/api/reminder", { method: "DELETE", body: JSON.stringify({ time }) });
  setUi(false, time);
}

function base64UrlToUint8Array(value) {
  const padded = `${value}${"=".repeat((4 - value.length % 4) % 4)}`.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function saveWorkshopAnswer(prompt, previous) {
  let content = "";
  let payload = null;
  let answerKind = prompt.kind;
  if (prompt.kind === "text" || prompt.kind === "link") content = document.querySelector("#answer").value;
  if (prompt.kind === "choice") content = document.querySelector('input[name="choice"]:checked')?.value || "";
  if (prompt.kind === "choice-custom") {
    const choice = document.querySelector('input[name="choice"]:checked')?.value || "";
    const custom = document.querySelector("#choice-custom").value.trim();
    content = choice === "Eigene Date-Idee" ? custom : choice;
    if (!content) throw new Error("Bitte wähle eine Date-Idee oder schreib deine eigene auf.");
  }
  if (prompt.kind === "ranking") {
    const ranked = [...document.querySelectorAll("#ranking-list [data-ranking-id]")].map((row) => row.dataset.rankingId);
    if (ranked.length !== 4 || new Set(ranked).size !== 4) throw new Error("Das Ranking braucht vier unterschiedliche Häuser.");
    content = JSON.stringify(ranked);
  }
  if (prompt.kind === "meme") {
    const format = document.querySelector('input[name="meme-kind"]:checked')?.value;
    if (format === "link") {
      content = document.querySelector("#meme-link").value.trim();
      try { const url = new URL(content); if (!["https:", "http:"].includes(url.protocol)) throw new Error(); }
      catch { throw new Error("Bitte füge einen gültigen Link zu deinem Meme ein."); }
      answerKind = "link";
    } else {
      let file = document.querySelector("#media-file")?.files?.[0] || null;
      if (file) file = await compressPhoto(file);
      if (file) payload = await uploadMedia(file, "image");
      else if (previous?.kind === "image" && previous?.payload?.mediaKey) payload = previous.payload;
      else throw new Error("Bitte wähle ein Meme-Foto aus oder schicke stattdessen einen Link.");
      content = "Ein Meme";
      answerKind = "image";
    }
  }
  if (prompt.kind === "map") {
    if (!mapLocation) throw new Error("Bitte wähle einen Punkt auf der Karte.");
    const label = document.querySelector("#place-label").value.trim();
    content = label || "Ein Ort für euch";
    payload = { ...mapLocation, label };
  }
  if (["image", "audio", "drawing", "drawing-riddle"].includes(prompt.kind)) {
    let file = document.querySelector("#media-file")?.files?.[0] || null;
    if (prompt.kind === "audio" && recordedAudio) file = recordedAudio;
    if (["drawing", "drawing-riddle"].includes(prompt.kind) && drawingDirty) file = await canvasFile();
    if (file && prompt.kind === "image") file = await compressPhoto(file);
    if (file) payload = await uploadMedia(file, prompt.kind === "drawing-riddle" ? "drawing" : prompt.kind);
    else if (previous?.payload?.mediaKey) payload = previous.payload;
    else throw new Error(prompt.kind === "audio" ? "Bitte nimm etwas auf oder wähle eine Audiodatei." : "Bitte wähle oder erstelle ein Bild.");
    if (prompt.kind === "drawing-riddle") {
      const solution = document.querySelector("#riddle-solution").value.trim();
      if (!solution) throw new Error("Schreib bitte die Lösung für dein Zeichenrätsel dazu.");
      payload = { ...payload, solution };
    }
    content = prompt.kind === "audio" ? "Eine Sprachnachricht" : ["drawing", "drawing-riddle"].includes(prompt.kind) ? "Eine Zeichnung" : "Ein Foto";
  }
  return api("/api/answers", { method: "PUT", body: JSON.stringify({ day: selectedWorkshopDay, kind: answerKind, content, payload }) });
}

function setupMemeEditor() {
  const editors = [...document.querySelectorAll("[data-meme-editor]")];
  const showEditor = (kind) => editors.forEach((editor) => { editor.hidden = editor.dataset.memeEditor !== kind; });
  document.querySelectorAll('input[name="meme-kind"]').forEach((input) => input.addEventListener("change", () => showEditor(input.value)));
  setupPhotoPreview();
}

function setupRiddleGuess() {
  const form = document.querySelector("#riddle-guess-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#riddle-guess");
    const feedback = document.querySelector("#riddle-feedback");
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const result = await api("/api/riddles/guess", { method: "POST", body: JSON.stringify({ day: selectedCalendarDay, guess: input.value }) });
      feedback.textContent = result.correct ? `Richtig! Es war: ${result.solution}` : "Knapp daneben – versuch’s noch einmal.";
      feedback.classList.toggle("riddle-correct", Boolean(result.correct));
    } catch (error) { feedback.textContent = error.message; }
    button.disabled = false;
  });
}

function setupRankingSort() {
  const list = document.querySelector("#ranking-list");
  if (!list) return;
  let dragged = null;
  const updatePlaces = () => list.querySelectorAll(".ranking-row").forEach((row, index) => row.querySelector(".ranking-place").textContent = String(index + 1));
  const moveRow = (move) => {
    const firstPositions = new Map([...list.children].map((row) => [row, row.getBoundingClientRect()]));
    move();
    updatePlaces();
    [...list.children].forEach((row) => {
      const first = firstPositions.get(row);
      const last = row.getBoundingClientRect();
      if (!first) return;
      const deltaY = first.top - last.top;
      if (!deltaY) return;
      row.animate([{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }], { duration: 360, easing: "cubic-bezier(.16,1,.3,1)", composite: "add" });
    });
  };
  const finish = () => {
    if (!dragged) return;
    dragged.classList.remove("dragging");
    dragged = null;
    updatePlaces();
  };
  list.addEventListener("pointerdown", (event) => {
    const row = event.target.closest(".ranking-row");
    if (!row) return;
    dragged = row;
    row.classList.add("dragging");
    list.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  list.addEventListener("pointermove", (event) => {
    if (!dragged) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".ranking-row");
    if (!target || target === dragged || !list.contains(target)) return;
    const bounds = target.getBoundingClientRect();
    moveRow(() => list.insertBefore(dragged, event.clientY < bounds.top + bounds.height / 2 ? target : target.nextSibling));
  });
  list.addEventListener("pointerup", finish);
  list.addEventListener("pointercancel", finish);
}

async function uploadMedia(file, kind) {
  const response = await fetch(`${API}/api/media?kind=${encodeURIComponent(kind)}`, { method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": file.type || (kind === "audio" ? "audio/webm" : "image/png") }, body: file });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Die Datei konnte nicht hochgeladen werden.");
  if (kind === "image" || kind === "drawing") mediaPreviewUrls.set(payload.key, URL.createObjectURL(file));
  return { mediaKey: payload.key, mimeType: payload.mimeType };
}

function setupPhotoPreview() {
  const input = document.querySelector("#media-file");
  const preview = document.querySelector("#upload-preview");
  if (!input || !preview) return;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) { preview.hidden = true; preview.innerHTML = ""; return; }
    const url = URL.createObjectURL(file);
    preview.hidden = false;
    preview.innerHTML = `<img src="${url}" alt="Vorschau deines ausgewählten Fotos"><span>${escape(file.name)}</span>`;
  });
}

function setupAudioFilePreview() {
  const input = document.querySelector("#media-file");
  if (!input) return;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    setAudioPreview(URL.createObjectURL(file), "Audiodatei bereit zum Speichern.");
  });
}

function setAudioPreview(url, message) {
  const preview = document.querySelector("#audio-preview");
  const status = document.querySelector("#record-status");
  if (!preview) return;
  preview.hidden = false;
  preview.innerHTML = `<audio id="audio-player" src="${url}">Dein Browser kann diese Aufnahme nicht abspielen.</audio><button type="button" class="audio-play" id="play-audio">▶ Probe hören</button><button type="button" class="quiet-button" id="discard-audio">Verwerfen</button>`;
  status.textContent = message;
  const player = document.querySelector("#audio-player");
  const playButton = document.querySelector("#play-audio");
  playButton.addEventListener("click", async () => {
    if (player.paused) { await player.play(); } else { player.pause(); }
  });
  player.addEventListener("play", () => playButton.textContent = "❚❚ Pause");
  player.addEventListener("pause", () => playButton.textContent = "▶ Probe hören");
  player.addEventListener("ended", () => playButton.textContent = "▶ Noch einmal hören");
  document.querySelector("#discard-audio").addEventListener("click", () => {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    recordedAudio = null;
    recordedAudioUrl = null;
    const input = document.querySelector("#media-file");
    if (input) input.value = "";
    preview.hidden = true;
    preview.innerHTML = "";
    status.textContent = "Zum Aufnehmen antippen";
  });
}

async function compressPhoto(file) {
  if (!file.type.startsWith("image/")) throw new Error("Bitte wähle ein Bild aus.");
  const image = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => { URL.revokeObjectURL(url); resolve(element); };
    element.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Dieses Foto konnte nicht gelesen werden. Bitte wähle es noch einmal aus.")); };
    element.src = url;
  });
  const targetBytes = 1_600_000;
  let scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [.86, .76, .66, .56]) {
      const blob = await canvasBlob(canvas, "image/jpeg", quality);
      if (blob.size <= targetBytes) return new File([blob], "foto.jpg", { type: "image/jpeg" });
    }
    scale *= .72;
  }
  throw new Error("Das Foto ist selbst nach dem Verkleinern noch zu groß. Bitte wähle ein anderes Bild.");
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Das Bild konnte nicht vorbereitet werden.")), type, quality));
}

function setupRecorder() {
  const button = document.querySelector("#record-audio");
  if (!button || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return;
  button.addEventListener("click", async () => {
    const status = document.querySelector("#record-status");
    const timer = document.querySelector("#record-timer");
    if (recorder?.state === "recording") { recorder.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      recorder = new MediaRecorder(stream, { audioBitsPerSecond: 96_000 });
      recorder.addEventListener("dataavailable", (event) => event.data.size && chunks.push(event.data));
      recorder.addEventListener("stop", () => {
        recordedAudio = new File([new Blob(chunks, { type: recorder.mimeType || "audio/webm" })], "sprachnachricht.webm", { type: recorder.mimeType || "audio/webm" });
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        recordedAudioUrl = URL.createObjectURL(recordedAudio);
        clearInterval(recordingTimer);
        stream.getTracks().forEach((track) => track.stop());
        button.textContent = "●";
        button.setAttribute("aria-label", "Neue Aufnahme starten");
        setAudioPreview(recordedAudioUrl, "Aufnahme bereit – erst probehören, dann speichern.");
      });
      recorder.start();
      const started = Date.now();
      clearInterval(recordingTimer);
      recordingTimer = setInterval(() => { const seconds = Math.floor((Date.now() - started) / 1000); timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; if (seconds >= 90) recorder.stop(); }, 250);
      button.textContent = "■";
      button.setAttribute("aria-label", "Aufnahme beenden");
      status.textContent = "Aufnahme läuft …";
    } catch { status.textContent = "Das Mikrofon ist nicht verfügbar. Du kannst stattdessen eine Audiodatei auswählen."; }
  });
}

function setupDrawing() {
  drawingCanvas = document.querySelector("#drawing-canvas");
  drawingDirty = false;
  if (!drawingCanvas) return;
  const context = drawingCanvas.getContext("2d");
  context.fillStyle = "#fffdf9";
  context.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  context.lineWidth = 9;
  context.lineCap = "round";
  context.lineJoin = "round";
  let activeColor = "#941f42";
  const setColor = (color) => {
    activeColor = color;
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = color;
    document.querySelectorAll("[data-color], #eraser").forEach((button) => button.classList.remove("selected"));
    document.querySelector(`[data-color="${color}"]`)?.classList.add("selected");
  };
  setColor(activeColor);
  let drawing = false;
  let lastPoint = null;
  const point = (event) => {
    const rect = drawingCanvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * drawingCanvas.width / rect.width, y: (event.clientY - rect.top) * drawingCanvas.height / rect.height };
  };
  const drawTo = (event) => {
    const current = point(event);
    if (!lastPoint) { lastPoint = current; return; }
    const mid = { x: (lastPoint.x + current.x) / 2, y: (lastPoint.y + current.y) / 2 };
    context.quadraticCurveTo(lastPoint.x, lastPoint.y, mid.x, mid.y);
    context.stroke();
    lastPoint = current;
    drawingDirty = true;
  };
  drawingCanvas.addEventListener("pointerdown", (event) => { drawing = true; drawingCanvas.setPointerCapture(event.pointerId); lastPoint = point(event); context.beginPath(); context.moveTo(lastPoint.x, lastPoint.y); });
  drawingCanvas.addEventListener("pointermove", (event) => { if (!drawing) return; const events = event.getCoalescedEvents?.() || [event]; events.forEach(drawTo); });
  drawingCanvas.addEventListener("pointerup", (event) => { if (drawing) drawTo(event); drawing = false; lastPoint = null; });
  drawingCanvas.addEventListener("pointercancel", () => { drawing = false; lastPoint = null; });
  document.querySelector("#brush-size").addEventListener("input", (event) => { context.lineWidth = Number(event.target.value); document.querySelector("#brush-size-value").textContent = event.target.value; });
  document.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => setColor(button.dataset.color)));
  document.querySelector("#eraser").addEventListener("click", () => {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = "#fffdf9";
    document.querySelectorAll("[data-color], #eraser").forEach((button) => button.classList.remove("selected"));
    document.querySelector("#eraser").classList.add("selected");
  });
  document.querySelector("#clear-drawing").addEventListener("click", () => { context.fillStyle = "#fffdf9"; context.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height); drawingDirty = true; });
}

function canvasFile() {
  return canvasBlob(drawingCanvas, "image/jpeg", .86).then((blob) => new File([blob], "zeichnung.jpg", { type: "image/jpeg" }));
}

function setupMap(savedLocation) {
  mapLocation = savedLocation && typeof savedLocation.lat === "number" ? { lat: savedLocation.lat, lng: savedLocation.lng } : null;
  const element = document.querySelector("#map-picker");
  const coordinateCopy = document.querySelector("#map-coordinates");
  if (!element || !window.L) {
    coordinateCopy.textContent = "Die Kartenansicht konnte nicht geladen werden. Bitte versuche es mit einer Internetverbindung erneut.";
    return;
  }
  const initial = mapLocation || { lat: 48.137, lng: 11.575 };
  mapPicker = window.L.map(element).setView([initial.lat, initial.lng], mapLocation ? 14 : 7);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap-Mitwirkende" }).addTo(mapPicker);
  let marker = null;
  const setMarker = (latlng) => {
    mapLocation = { lat: Number(latlng.lat.toFixed(6)), lng: Number(latlng.lng.toFixed(6)) };
    if (marker) marker.setLatLng(latlng); else marker = window.L.marker(latlng).addTo(mapPicker);
    coordinateCopy.textContent = `Ausgewählt: ${mapLocation.lat}, ${mapLocation.lng}`;
  };
  if (mapLocation) setMarker(initial);
  mapPicker.on("click", (event) => setMarker(event.latlng));
  const search = async () => {
    const query = document.querySelector("#map-search").value.trim();
    const results = document.querySelector("#map-search-results");
    if (!query) return;
    results.textContent = "Suche läuft …";
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`);
      const places = await response.json();
      if (!places.length) { results.textContent = "Kein Ort gefunden. Versuch es mit einer genaueren Suche."; return; }
      results.innerHTML = places.map((place, index) => `<button type="button" data-place-index="${index}">${escape(place.display_name)}</button>`).join("");
      results.querySelectorAll("[data-place-index]").forEach((button) => button.addEventListener("click", () => {
        const place = places[Number(button.dataset.placeIndex)];
        const latlng = { lat: Number(place.lat), lng: Number(place.lon) };
        mapPicker.setView(latlng, 15);
        setMarker(latlng);
        const label = document.querySelector("#place-label");
        if (!label.value) label.value = place.display_name;
        results.innerHTML = "";
      }));
    } catch { results.textContent = "Die Ortssuche ist gerade nicht erreichbar. Du kannst den Ort auch direkt auf der Karte markieren."; }
  };
  document.querySelector("#search-map").addEventListener("click", search);
  document.querySelector("#map-search").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); search(); } });
  document.querySelector("#locate-me").addEventListener("click", () => navigator.geolocation?.getCurrentPosition((position) => {
    const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
    mapPicker.setView(latlng, 15);
    setMarker(latlng);
  }, () => coordinateCopy.textContent = "Der Standort konnte nicht abgerufen werden. Wähle den Punkt einfach auf der Karte."));
}

function setupReceivedMaps() {
  document.querySelectorAll("[data-received-map]").forEach((element) => {
    const lat = Number(element.dataset.lat);
    const lng = Number(element.dataset.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { element.textContent = "Dieser Ort hat keine gültigen Koordinaten."; return; }
    if (!window.L) { element.textContent = "Die Kartenansicht konnte nicht geladen werden."; return; }
    const map = window.L.map(element, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false }).setView([lat, lng], 14);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap-Mitwirkende" }).addTo(map);
    window.L.marker([lat, lng], { keyboard: false }).addTo(map).bindTooltip(element.dataset.label || "Euer Ort", { permanent: false });
    requestAnimationFrame(() => map.invalidateSize());
  });
}

async function hydrateMedia() {
  // Der PDF-Download trägt ebenfalls einen Schlüssel, ist aber kein Medien-Slot.
  // Nur Elemente mit data-media-kind dürfen als Vorschau geladen werden.
  const slots = [...document.querySelectorAll("[data-media-kind][data-media-key]")];
  await Promise.all(slots.map(async (slot) => {
    const key = slot.dataset.mediaKey;
    if (!key) return;
    try {
      const localUrl = mediaPreviewUrls.get(key);
      if (localUrl) {
        slot.innerHTML = slot.dataset.mediaKind === "audio" ? `<audio controls src="${localUrl}">Dein Browser kann diese Aufnahme nicht abspielen.</audio>` : `<img src="${localUrl}" alt="${escape(slot.dataset.mediaAlt || "Eine persönliche Überraschung")}">`;
        return;
      }
      const response = await fetch(`${API}/api/media/${encodeURIComponent(key)}?v=2`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!response.ok) throw new Error();
      const bytes = await response.arrayBuffer();
      const mimeType = response.headers.get("content-type") || (slot.dataset.mediaKind === "audio" ? "audio/webm" : "image/jpeg");
      const blob = new Blob([bytes], { type: mimeType });
      if (slot.dataset.mediaKind === "audio") {
        const url = URL.createObjectURL(blob);
        slot.innerHTML = `<audio controls src="${url}">Dein Browser kann diese Aufnahme nicht abspielen.</audio>`;
      } else {
        renderImageDataUrl(blob, slot);
      }
    } catch { slot.textContent = "Dieser Beitrag konnte gerade nicht geladen werden."; }
  }));
}

function setupGiftDownloads() {
  document.querySelectorAll("[data-gift-download]").forEach((button) => button.addEventListener("click", async () => {
    const key = button.dataset.mediaKey;
    if (!key) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "PDF wird vorbereitet …";
    try {
      const response = await fetch(`${API}/api/media/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = button.dataset.downloadName || "rezept.pdf";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
      button.textContent = "PDF heruntergeladen";
    } catch {
      button.textContent = "Download gerade nicht möglich";
    } finally {
      button.disabled = false;
      setTimeout(() => { button.textContent = original; }, 2_500);
    }
  }));
}

function renderImageDataUrl(blob, slot) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.alt = slot.dataset.mediaAlt || "Eine persönliche Überraschung";
    image.addEventListener("load", () => slot.replaceChildren(image), { once: true });
    image.addEventListener("error", () => { slot.textContent = "Dieses Bild konnte nicht dargestellt werden."; }, { once: true });
    image.src = String(reader.result);
  });
  reader.addEventListener("error", () => { slot.textContent = "Dieses Bild konnte nicht dargestellt werden."; });
  reader.readAsDataURL(blob);
}

load();

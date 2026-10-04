const API = (window.ADVENT_API_URL || "").replace(/\/$/, "");
const TEST_MODE = window.ADVENT_DEVELOPER_TEST === true;
const TOKEN_STORAGE_KEY = TEST_MODE ? "pia-paul-calendar-test-token" : "pia-paul-calendar-token";
const app = document.querySelector("#app");
const days = Array.from({ length: 24 }, (_, index) => index + 1);
const question = (kind, prompt, options = [], hint = "") => ({ kind, prompt, options, hint });
const piaHouseRanking = [
  { id: "waldhuette", word: "Waldrand", label: "Die Berghütte am Waldrand", image: "https://images.unsplash.com/photo-1698213248549-b116da488294?auto=format&fit=crop&w=900&q=82" },
  { id: "reetdach", word: "Reetdach", label: "Das reetgedeckte Landhaus", image: "https://images.unsplash.com/photo-1682516086739-c3fbf844529b?auto=format&fit=crop&w=900&q=82" },
  { id: "steinhaus", word: "Steingarten", label: "Das Steinhäuschen mit wildem Garten", image: "https://images.unsplash.com/photo-1688396538097-af54bb314ab6?auto=format&fit=crop&w=900&q=82" },
  { id: "holzhaus", word: "Bergblick", label: "Das große Holzhaus in den Bergen", image: "https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=900&q=82" },
];
const paulFlowerRanking = [
  { id: "sonnenblumen", label: "Sonnenblumen", image: "https://images.unsplash.com/photo-1757904257403-be898c4fbc2f?auto=format&fit=crop&w=900&q=82" },
  { id: "wildblumen", label: "Wildblumen", image: "https://images.unsplash.com/photo-1654409586056-8de6ac831ec5?auto=format&fit=crop&w=900&q=82" },
  { id: "pfingstrosen", label: "Pfingstrosen", image: "https://images.unsplash.com/photo-1591963944277-fe153988e471?auto=format&fit=crop&w=900&q=82" },
  { id: "tulpen", label: "Tulpen", image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=900&q=82" },
];
const prompts = {
  pia: [
    question("map", "Welchen Christkindlmarkt möchtest du mit Paul besuchen?"),
    question("text", "Welcher Bibelcharakter wäre Paul und warum?"),
    question("ranking", "Welche Blumen würde Paul am liebsten mögen?", paulFlowerRanking, "Sortiere die Blumen: Oben ist Platz 1."),
    question("drawing-riddle", "Zeichne einen Gegenstand, den du mit Paul verbindest. Paul darf raten, was es ist."),
    question("text", "Welches Weihnachtsgebäck solltet ihr unbedingt zusammen backen?"),
    question("audio", "Und pünktlich zum sex-ten Dezember: Was findest du an Paul besonders sexy? Flüstere es ihm ins Ohr."),
    question("link", "Schick Paul ein Weihnachtslied.", [], "Ein Spotify-, YouTube- oder anderer Link."),
    question("audio", "Nenne drei Dinge, die Paul ganz selbstverständlich gut kann."),
    question("audio", "Erzähl Paul von deinem Lieblingsmoment auf eurer Hochzeit."),
    question("text", "Welche Advents- oder Weihnachtstradition möchtet ihr weiterführen oder neu erfinden?"),
    question("map", "Wenn alles möglich wäre: Wohin würdest du mit Paul reisen?"),
    question("audio", "Lies eure Hochzeitsversprechen noch einmal vor."),
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
    question("choice-custom", "Auf welches Weihnachtsdate hättest du Lust?", ["Über einen Weihnachtsmarkt schlendern", "Schlittschuhlaufen", "Gemütlicher Filmabend", "Eigene Date-Idee"]),
    question("text", "Was hast du in der Ehe neu an Pia kennen und lieben gelernt?"),
    question("audio", "Welches Geräusch macht Pia häufiger mal?"),
    question("text", "Wenn Pia ein Weihnachts-Snack wäre, welcher wäre sie und warum?"),
    question("image", "Fotografiere eine Kleinigkeit, die euren Alltag für dich heimelig macht."),
    question("link", "Teile den Trailer zu dem Weihnachtsfilm, den du mit Pia sehen möchtest."),
    question("text", "Liebe Pia, heute schenke ich dir einen Gutschein für …"),
    question("image", "Schick Pia ein Rezept aus eurem Hochzeitsrezeptordner, das ihr bald kochen solltet."),
    question("text", "Wenn ich an Weihnachten (wie gewohnt) 1.000.000 € bekommen würde, dann würde ich …"),
    question("audio", "Lies eure Hochzeitsversprechen noch einmal vor."),
    question("text", "Was war dein persönliches Highlight eures ersten Ehequartals?"),
    question("drawing", "Zeichne ein Pia-&-Paul-Logo."),
    question("text", "Mache Pia ein ungewöhnliches Kompliment."),
    question("link", "Schick Pia ein Worshiplied."),
    question("text", "Nenne drei Dinge, für die du mit Pia im nächsten Jahr gerne beten möchtest."),
    question("ranking", "In welchem dieser Häuser würde Pia am liebsten wohnen?", piaHouseRanking, "Sortiere die Häuser: Oben ist Platz 1."),
    question("text", "Ich muss gestehen, dass ich seit wir verheiratet sind, …"),
    question("link", "Schick Pia ein Meme, das sie zum Lachen bringen soll."),
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
let selectedPartner = "pia";
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
    "Frecher Versuch. Der Kalender bleibt leider unbestechlich.",
    "Offenbar sind die Zahlen auf den Türchen für dich eher grobe Empfehlungen.",
    "Hier könnte Ihre Weihnachtswerbung stehen.",
  ];
  const order = shuffledDoorDays(partner, year);
  const position = order.indexOf(day);
  // A sequential assignment prevents repeated text horizontally, vertically and
  // across a row break. The final quip stays discoverable on door 24.
  const finalDoorPosition = order.indexOf(24);
  const offset = (quips.length - 1 - finalDoorPosition + quips.length) % quips.length;
  return quips[(position + offset) % quips.length];
}
function configureMessage() { return `<main class="welcome-shell"><section class="welcome-card"><div class="heart-mark">♥</div><p class="eyebrow">Fast geschafft</p><h1>Die Verbindung fehlt noch.</h1><p class="intro">Trage zuerst die Adresse eures Cloudflare-Workers in <code>config.js</code> ein.</p></section></main>`; }
function kindLabel(kind) { return ({ text: "Text", choice: "Auswahl", "choice-custom": "Auswahl", ranking: "Ranking", image: "Foto", audio: "Sprachnachricht", drawing: "Zeichnung", "drawing-riddle": "Zeichenrätsel", map: "Ort", link: "Link", gift: "Überraschung" })[kind] || "Antwort"; }
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

async function load() {
  if (!API) { app.innerHTML = configureMessage(); return; }
  try {
    state = await api("/api/calendar");
    if (!state.session) localStorage.removeItem(TOKEN_STORAGE_KEY);
    const revealed = state.status?.revealThrough || 1;
    selectedCalendarDay = Math.min(Math.max(1, selectedCalendarDay), revealed || 1);
    render();
  } catch (error) {
    app.innerHTML = `<main class="welcome-shell"><section class="welcome-card"><h1>Oh je.</h1><p class="intro">${escape(error.message)}</p><button class="primary-button" onclick="location.reload()">Noch einmal versuchen</button></section></main>`;
  }
}

function render() {
  if (!state.session) { renderAccess(); return; }
  renderApp();
}

function renderAccess(message = "") {
  const setup = !state.configured;
  app.innerHTML = `<main class="welcome-shell"><section class="welcome-card"><div class="heart-mark">♥</div><p class="eyebrow">Pia & Paul</p><h1>${setup ? "Euren Kalender einrichten" : "Willkommen zurück"}</h1><p class="intro">${setup ? "Lege einen gemeinsamen Schlüssel fest und teile ihn anschließend nur miteinander." : "Wähle deinen Namen und öffne euren gemeinsamen Adventskalender."}</p><form class="access-form" id="access-form"><fieldset><legend>Ich bin …</legend><div class="person-switch"><button type="button" data-person="pia" class="${selectedPartner === "pia" ? "selected" : ""}">Pia</button><button type="button" data-person="paul" class="${selectedPartner === "paul" ? "selected" : ""}">Paul</button></div></fieldset><label for="access-code">Gemeinsamer Schlüssel</label><div class="code-field">⌘ <input id="access-code" type="password" minlength="6" maxlength="80" autocomplete="current-password" placeholder="Mindestens 6 Zeichen" required></div>${message ? `<p class="form-message">${escape(message)}</p>` : ""}<button class="primary-button">${setup ? "Kalender anlegen" : "Kalender öffnen"}</button></form>${setup ? '<p class="fineprint">⌘ Der Schlüssel wird nicht lesbar gespeichert.</p>' : ""}</section></main>`;
  document.querySelectorAll("[data-person]").forEach((button) => button.addEventListener("click", () => { selectedPartner = button.dataset.person; renderAccess(); }));
  document.querySelector("#access-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector("button.primary-button");
    submit.disabled = true;
    try {
      const result = await api(state.configured ? "/api/session" : "/api/setup", { method: "POST", body: JSON.stringify({ partner: selectedPartner, accessCode: document.querySelector("#access-code").value }) });
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      await load();
    } catch (error) { renderAccess(error.message); }
  });
}

function renderApp(message = "") {
  const { session, status, seasonYear } = state;
  const heading = status.phase === "before" ? `Bereit für den 1. Dezember ${seasonYear}` : status.phase === "complete" ? "Alle Türchen sind offen" : `Dezember ${seasonYear}`;
  const developerControls = TEST_MODE ? renderDeveloperControls(status) : "";
  app.innerHTML = `<main class="app-shell ${activeView === "calendar" ? "calendar-shell" : ""}"><header class="topbar"><div class="brand"><span class="mini-heart">♥</span><span>Pia <i>&</i> Paul</span></div><button class="quiet-button" id="signout">Abmelden</button></header><section class="hero-row"><div><p class="eyebrow">Adventskalender</p><h1>${heading}</h1></div><p class="hero-note">${activeView === "calendar" ? `Für dich: die kleinen Überraschungen von ${name(other(session.partner))}.` : `Deine Werkstatt: Bereite alle 24 Überraschungen für ${name(other(session.partner))} vor.`}</p></section><nav class="view-switch" aria-label="Bereich wählen"><button data-view="calendar" class="${activeView === "calendar" ? "selected" : ""}">♥ Dein Kalender</button><button data-view="workshop" class="${activeView === "workshop" ? "selected" : ""}">✦ Deine Werkstatt</button></nav>${developerControls}${activeView === "calendar" ? renderCalendar() : renderWorkshop(message)}</main>`;
  document.querySelector("#signout").addEventListener("click", () => { localStorage.removeItem(TOKEN_STORAGE_KEY); state.session = null; render(); });
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.view; calendarDetailOpen = false; renderApp(); }));
  bindDeveloperControls();
  if (activeView === "calendar") bindCalendar(); else bindWorkshop();
}

function renderDeveloperControls(status) {
  const testDay = status.phase === "complete" ? 25 : (status.writeDay || 1);
  return `<section class="developer-panel"><p class="eyebrow">Entwickler-Testmodus</p><form id="test-day-form"><label for="test-day">Simulierter Kalendertag</label><div class="test-day-controls"><select id="test-day">${days.map((day) => `<option value="${day}" ${day === testDay ? "selected" : ""}>${day}. Dezember</option>`).join("")}<option value="25" ${testDay === 25 ? "selected" : ""}>Nach dem 24. Dezember</option></select><button class="quiet-button" type="submit">Tag übernehmen</button></div></form><p>Diese Steuerung gibt es nur in der separaten Testumgebung.</p></section>`;
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
    const isGift = prompts[other(session.partner)][day - 1].kind === "gift";
    const seen = seenDays.includes(day);
    const stateClass = !unlocked ? "locked" : isGift || answer ? (seen ? "seen" : "new") : "missing";
    const symbol = !unlocked ? "🔒" : isGift || answer ? (seen ? "✓" : "♥") : "◷";
    return `<button class="door calendar-door ${stateClass} ${selectedCalendarDay === day ? "active" : ""}" data-calendar-day="${day}">${mountain(day)}<span>${day}</span><b aria-hidden="true">${symbol}</b></button>`;
  }).join("");
  const unlocked = selectedCalendarDay <= revealed;
  const partner = other(session.partner);
  const prompt = prompts[partner][selectedCalendarDay - 1];
  const answer = partnerAnswers[selectedCalendarDay];
  const detail = !unlocked ? `<div class="locked-copy"><h2>${lockedQuip(selectedCalendarDay, session.partner, state.seasonYear)}</h2><p>Dieses Türchen öffnet sich am ${selectedCalendarDay}. Dezember. Bis dahin bleibt die Überraschung ganz tapfer geheim.</p></div>` : prompt.kind === "gift" ? renderGiftCopy() : `<p class="answer-kind">${kindLabel(prompt.kind)}</p><h2>${escape(prompt.prompt)}</h2>${answer ? renderAnswer(answer, prompt) : `<section class="waiting-copy"><span>◷</span><p>${name(partner)} hat dieses Türchen noch nicht gefüllt. Vielleicht kommt die Überraschung etwas später.</p></section>`}`;
  const modal = calendarDetailOpen ? `<section class="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="door-title"><article class="door-detail"><button class="modal-close" type="button" aria-label="Türchen schließen">×</button><div class="detail-top"><p class="eyebrow">${unlocked ? `Türchen ${selectedCalendarDay}` : "Bis bald"}</p><span class="status-pill">${unlocked ? "♥ für dich" : "🔒 verschlossen"}</span></div><div id="door-title">${detail}</div></article></section>` : "";
  return `<section class="calendar-layout calendar-layout--calendar"><nav class="door-grid" aria-label="Deine Adventstürchen">${doors}</nav></section>${modal}<p class="legend calendar-legend"><span class="legend-new">♥</span> neue Überraschung <span class="legend-seen">✓</span> schon angesehen <span class="legend-missing">◷</span> noch offen</p>`;
}

function renderAnswer(answer, prompt) {
  if (answer.kind === "ranking" && prompt?.options) return renderRankingAnswer(answer, prompt);
  if (answer.kind === "drawing-riddle") return `<section class="received-note media-answer"><p class="note-label">Ein Zeichenrätsel für dich</p><div class="media-slot image-slot" data-media-kind="image" data-media-key="${escape(mediaKey(answer))}">Wird geladen …</div><form class="riddle-guess" id="riddle-guess-form"><label for="riddle-guess">Was hat ${name(other(state.session.partner))} gezeichnet?</label><div><input id="riddle-guess" class="answer-input" maxlength="240" placeholder="Dein Tipp" required><button class="quiet-button">Tipp prüfen</button></div><p id="riddle-feedback" class="field-hint" aria-live="polite"></p></form></section>`;
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
    if (unlocked && !state.seenDays.includes(selectedCalendarDay)) {
      state.seenDays.push(selectedCalendarDay);
      api("/api/doors/open", { method: "POST", body: JSON.stringify({ day: selectedCalendarDay }) }).catch(() => state.seenDays = state.seenDays.filter((day) => day !== selectedCalendarDay));
    }
    renderApp();
  }));
  document.querySelector(".modal-close")?.addEventListener("click", () => { calendarDetailOpen = false; renderApp(); });
  hydrateMedia();
  setupReceivedMaps();
  setupRiddleGuess();
}

function renderWorkshop(message = "") {
  const { session, status, ownAnswers = {} } = state;
  const today = status.phase === "active" ? status.writeDay : status.phase === "complete" ? 25 : 0;
  const doors = shuffledDoorDays(session.partner, state.seasonYear).map((day) => {
    const answer = ownAnswers[day];
    const isGift = prompts[session.partner][day - 1].kind === "gift";
    const stateClass = isGift || answer ? "complete" : day < today ? "overdue" : day === today ? "today" : "upcoming";
    const marker = isGift || answer ? "✓" : day < today ? "◷" : day === today ? "•" : "";
    return `<button class="door workshop-door ${stateClass} ${selectedWorkshopDay === day ? "active" : ""}" data-workshop-day="${day}">${mountain(day)}<span>${day}</span><b aria-hidden="true">${marker}</b></button>`;
  }).join("");
  const prompt = prompts[session.partner][selectedWorkshopDay - 1];
  const answer = ownAnswers[selectedWorkshopDay];
  const isGift = prompt.kind === "gift";
  return `<section class="calendar-layout workshop-layout"><nav class="door-grid" aria-label="Deine Werkstatt-Türchen">${doors}</nav><article class="door-detail workshop-detail"><div class="detail-top"><p class="eyebrow">Werkstatt · Türchen ${selectedWorkshopDay}</p><span class="status-pill">${isGift ? "✓ vorbereitet" : answer ? "✓ vorbereitet" : selectedWorkshopDay < today ? "◷ nachholen" : "✦ frei gestaltbar"}</span></div>${isGift ? renderGiftCopy() : `<p class="answer-kind">${kindLabel(prompt.kind)}</p><h2>${escape(prompt.prompt)}</h2>${prompt.hint ? `<p class="prompt-hint">${escape(prompt.hint)}</p>` : ""}${renderEditor(prompt, answer)}${message ? `<p class="save-message">${escape(message)}</p>` : ""}`}</article></section><p class="legend"><span class="legend-complete">✓</span> vorbereitet <span class="legend-missing">◷</span> nachholen <span class="legend-today">•</span> heute</p>`;
}

function renderGiftCopy() { return `<section class="gift-copy"><span aria-hidden="true">✦</span><h2>Lasst euch überraschen :)</h2><p>Dieses Türchen ist schon für euch vorbereitet.</p></section>`; }

function renderEditor(prompt, answer) {
  const old = answer || {};
  if (prompt.kind === "text") return `<form class="answer-form" id="answer-form"><label for="answer">Deine Antwort für ${name(other(state.session.partner))}</label><textarea id="answer" maxlength="2000" placeholder="Schreib, was dir gerade im Herzen liegt …" required>${escape(old.content || "")}</textarea><div class="answer-footer"><span id="count">${(old.content || "").length}/2000</span><button class="primary-button">Antwort speichern</button></div></form>`;
  if (prompt.kind === "choice") return `<form class="answer-form" id="answer-form"><fieldset class="choice-list"><legend>Deine Wahl für ${name(other(state.session.partner))}</legend>${prompt.options.map((option) => `<label class="choice-option"><input type="radio" name="choice" value="${escape(option)}" ${old.content === option ? "checked" : ""} required><span>${escape(option)}</span></label>`).join("")}</fieldset><button class="primary-button">Antwort speichern</button></form>`;
  if (prompt.kind === "choice-custom") return `<form class="answer-form" id="answer-form"><fieldset class="choice-list"><legend>Deine Date-Idee für ${name(other(state.session.partner))}</legend>${prompt.options.map((option) => `<label class="choice-option"><input type="radio" name="choice" value="${escape(option)}" ${prompt.options.includes(old.content) ? old.content === option ? "checked" : "" : option === "Eigene Date-Idee" ? "checked" : ""}><span>${escape(option)}</span></label>`).join("")}</fieldset><label for="choice-custom">Oder deine eigene Idee</label><input class="answer-input" id="choice-custom" maxlength="240" placeholder="Zum Beispiel: Plätzchen backen und verschenken" value="${escape(prompt.options.includes(old.content) ? "" : old.content || "")}"><button class="primary-button">Antwort speichern</button></form>`;
  if (prompt.kind === "ranking") return renderRankingEditor(prompt, old);
  if (prompt.kind === "link") return `<form class="answer-form" id="answer-form"><label for="answer">Link für ${name(other(state.session.partner))}</label><input class="answer-input" id="answer" type="url" placeholder="https://…" value="${escape(old.content || "")}" required><p class="field-hint">Spotify, YouTube, Mediathek oder jeder andere Link – ohne Konto-Verknüpfung.</p><button class="primary-button">Link speichern</button></form>`;
  if (prompt.kind === "image") return renderMediaEditor("image", old, "Foto auswählen", "Ein neues Foto ersetzt das bisherige.");
  if (prompt.kind === "audio") return renderMediaEditor("audio", old, "Audiodatei auswählen", "Oder nimm direkt hier eine kurze Nachricht auf.");
  if (prompt.kind === "drawing" || prompt.kind === "drawing-riddle") return renderDrawingEditor(prompt, old);
  if (prompt.kind === "map") {
    const location = old.payload || { lat: 52.52, lng: 13.405, label: "" };
    return `<form class="answer-form" id="answer-form"><label for="place-label">Wie möchtest du diesen Ort nennen?</label><input class="answer-input" id="place-label" maxlength="200" placeholder="Zum Beispiel: Unser Lieblingscafé" value="${escape(location.label || "")}" required><div class="map-search"><input class="answer-input" id="map-search" type="search" placeholder="Ort oder Adresse suchen"><button type="button" class="quiet-button" id="search-map">Suchen</button></div><div id="map-search-results" class="map-search-results" aria-live="polite"></div><div id="map-picker" class="map-picker"></div><p class="field-hint" id="map-coordinates">Tippe auf die Karte, um den Ort festzulegen.</p><button type="button" class="quiet-button locate-button" id="locate-me">Meinen aktuellen Standort verwenden</button><button class="primary-button">Ort speichern</button></form>`;
  }
  return "";
}

function renderDrawingEditor(prompt, old) {
  const isRiddle = prompt.kind === "drawing-riddle";
  const solution = old.payload?.solution || "";
  return `<form class="answer-form" id="answer-form"><label>Deine Zeichnung für ${name(other(state.session.partner))}</label>${old.payload?.mediaKey ? `<div class="existing-media" data-media-kind="image" data-media-key="${escape(old.payload.mediaKey)}">Bisherige Zeichnung wird geladen …</div>` : ""}<canvas id="drawing-canvas" width="900" height="560" aria-label="Zeichenfläche"></canvas><div class="draw-tools"><div class="draw-palette" aria-label="Stiftfarbe wählen"><button type="button" class="color-swatch selected" data-color="#941f42" style="--swatch:#941f42" aria-label="Rot"></button><button type="button" class="color-swatch" data-color="#e8b65e" style="--swatch:#e8b65e" aria-label="Gelb"></button><button type="button" class="color-swatch" data-color="#4d8560" style="--swatch:#4d8560" aria-label="Grün"></button><button type="button" class="color-swatch" data-color="#a7d8a5" style="--swatch:#a7d8a5" aria-label="Hellgrün"></button><button type="button" class="color-swatch" data-color="#3f6cae" style="--swatch:#3f6cae" aria-label="Blau"></button><button type="button" class="color-swatch" data-color="#91cde2" style="--swatch:#91cde2" aria-label="Hellblau"></button><button type="button" class="color-swatch" data-color="#8b9199" style="--swatch:#8b9199" aria-label="Grau"></button><button type="button" class="color-swatch" data-color="#261923" style="--swatch:#261923" aria-label="Schwarz"></button><button type="button" class="color-swatch white" data-color="#fffaf5" style="--swatch:#fffaf5" aria-label="Weiß"></button><button type="button" class="color-swatch" data-color="#e7b98d" style="--swatch:#e7b98d" aria-label="Hautfarbe"></button><button type="button" class="color-swatch" data-color="#b77b52" style="--swatch:#b77b52" aria-label="Hellbraun"></button><button type="button" class="eraser-button" id="eraser" aria-label="Radierer">⌫</button></div><label class="brush-size" for="brush-size">Größe <input id="brush-size" type="range" min="3" max="40" value="9"><output id="brush-size-value">9</output></label><button type="button" class="quiet-button" id="clear-drawing">Zeichnung löschen</button></div>${isRiddle ? `<label for="riddle-solution">Was ist es? (Paul sieht die Lösung erst nach einem richtigen Tipp.)</label><input class="answer-input" id="riddle-solution" maxlength="240" value="${escape(solution)}" placeholder="Zum Beispiel: unser Toaster" required>` : ""}<p class="field-hint">Mit dem Finger oder der Maus malen. Die Größe gilt auch für den Radierer.</p><button class="primary-button">Zeichnung speichern</button></form>`;
}

function renderRankingEditor(prompt, old) {
  const savedOrder = rankingOrder(old.content || "");
  const orderedOptions = savedOrder.length === prompt.options.length ? savedOrder.map((id) => prompt.options.find((option) => option.id === id)).filter(Boolean) : prompt.options;
  const noun = prompt.options[0]?.id === "sonnenblumen" ? "Blumen" : "Häuser";
  return `<form class="answer-form ranking-form" id="answer-form"><fieldset><legend>Die ${noun}</legend><div class="ranking-grid">${prompt.options.map((option) => `<article class="ranking-card"><img src="${escape(option.image)}" alt="${escape(option.label)}"><span>${escape(option.label)}</span></article>`).join("")}</div></fieldset><fieldset><legend>Deine mögliche Reihenfolge</legend><div class="ranking-list" id="ranking-list" aria-label="Ranking per Ziehen sortieren">${orderedOptions.map((option, index) => `<div class="ranking-row" data-ranking-id="${escape(option.id)}" tabindex="0"><span class="ranking-grip" aria-hidden="true">⠿</span><span class="ranking-place">${index + 1}</span><span class="ranking-label">${escape(option.label)}</span></div>`).join("")}</div></fieldset><p class="field-hint">Ziehe eine Zeile an den Griffpunkten nach oben oder unten. Oben ist Platz 1.</p><button class="primary-button">Ranking speichern</button></form>`;
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
  document.querySelectorAll("[data-workshop-day]").forEach((button) => button.addEventListener("click", () => { selectedWorkshopDay = Number(button.dataset.workshopDay); renderApp(); }));
  const prompt = prompts[state.session.partner][selectedWorkshopDay - 1];
  const answer = state.ownAnswers[selectedWorkshopDay];
  const textarea = document.querySelector("#answer");
  if (textarea?.tagName === "TEXTAREA") textarea.addEventListener("input", () => document.querySelector("#count").textContent = `${textarea.value.length}/2000`);
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
  if (prompt.kind === "ranking") setupRankingSort();
  hydrateMedia();
}

async function saveWorkshopAnswer(prompt, previous) {
  let content = "";
  let payload = null;
  if (prompt.kind === "text" || prompt.kind === "link") content = document.querySelector("#answer").value;
  if (prompt.kind === "choice") content = document.querySelector('input[name="choice"]:checked')?.value || "";
  if (prompt.kind === "choice-custom") {
    const choice = document.querySelector('input[name="choice"]:checked')?.value || "";
    const custom = document.querySelector("#choice-custom").value.trim();
    content = choice === "Eigene Date-Idee" ? custom : choice;
    if (!content) throw new Error("Bitte wähle eine Date-Idee oder schreib deine eigene auf.");
  }
  if (prompt.kind === "ranking") {
    const ranked = [...document.querySelectorAll("[data-ranking-id]")].map((row) => row.dataset.rankingId);
    if (ranked.length !== 4 || new Set(ranked).size !== 4) throw new Error("Das Ranking braucht vier unterschiedliche Häuser.");
    content = JSON.stringify(ranked);
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
  return api("/api/answers", { method: "PUT", body: JSON.stringify({ day: selectedWorkshopDay, kind: prompt.kind, content, payload }) });
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
    list.insertBefore(dragged, event.clientY < bounds.top + bounds.height / 2 ? target : target.nextSibling);
    updatePlaces();
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
  const initial = mapLocation || { lat: 52.52, lng: 13.405 };
  mapPicker = window.L.map(element).setView([initial.lat, initial.lng], mapLocation ? 14 : 5);
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
  const slots = [...document.querySelectorAll("[data-media-key]")];
  await Promise.all(slots.map(async (slot) => {
    const key = slot.dataset.mediaKey;
    if (!key) return;
    try {
      const localUrl = mediaPreviewUrls.get(key);
      if (localUrl) {
        slot.innerHTML = slot.dataset.mediaKind === "audio" ? `<audio controls src="${localUrl}">Dein Browser kann diese Aufnahme nicht abspielen.</audio>` : `<img src="${localUrl}" alt="Eine persönliche Überraschung">`;
        return;
      }
      const response = await fetch(`${API}/api/media/${encodeURIComponent(key)}?v=2`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!response.ok) throw new Error();
      const bytes = await response.arrayBuffer();
      const mimeType = response.headers.get("content-type") || (slot.dataset.mediaKind === "audio" ? "audio/webm" : "image/jpeg");
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      if (slot.dataset.mediaKind === "audio") {
        slot.innerHTML = `<audio controls src="${url}">Dein Browser kann diese Aufnahme nicht abspielen.</audio>`;
      } else {
        slot.innerHTML = `<img src="${url}" alt="Eine persönliche Überraschung">`;
        const image = slot.querySelector("img");
        image.addEventListener("error", () => renderImageDataUrl(image, blob, slot), { once: true });
      }
    } catch { slot.textContent = "Dieser Beitrag konnte gerade nicht geladen werden."; }
  }));
}

function renderImageDataUrl(image, blob, slot) {
  const reader = new FileReader();
  reader.addEventListener("load", () => { image.src = String(reader.result); });
  reader.addEventListener("error", () => { slot.textContent = "Dieses Foto konnte nicht dargestellt werden."; });
  image.addEventListener("error", () => { slot.textContent = "Dieses Foto konnte nicht dargestellt werden."; }, { once: true });
  reader.readAsDataURL(blob);
}

load();

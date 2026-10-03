const API = (window.ADVENT_API_URL || "").replace(/\/$/, "");
const app = document.querySelector("#app");
const days = Array.from({ length: 24 }, (_, index) => index + 1);
const prompts = {
  pia: ["Woran merkst du, dass Paul dich wirklich kennt?","Welche kleine Eigenheit von Paul bringt dich immer zum Lächeln?","Wann hat Paul dich zuletzt überrascht – ganz ohne große Geste?","Was möchtest du mit Paul in eurem ersten Ehejahr unbedingt erleben?","Welchen gemeinsamen Moment würdest du gern noch einmal erleben?","Wofür bist du Paul heute besonders dankbar?","Was macht euren Alltag für dich heimelig?","Welche Stärke von Paul bewunderst du am meisten?","Welche Tradition möchtet ihr zwei unbedingt weiterführen oder erfinden?","Wie hilft dir Paul, du selbst zu sein?","Welche Erinnerung an euer Kennenlernen magst du besonders?","Welche Seite an Paul möchtest du noch besser kennenlernen?","Was wäre ein perfekter freier Sonntag zu zweit?","Wann fühlst du dich Paul besonders nah?","Welche Kleinigkeit wünschst du dir öfter von eurem gemeinsamen Alltag?","Was ist etwas, das Paul ganz selbstverständlich gut kann?","Welche gemeinsame Sache macht euch zu einem guten Team?","Welche drei Wörter beschreiben Paul als Partner für dich?","Was war in diesem Jahr ein stiller, schöner Glücksmoment mit Paul?","Welche Reise oder welches Abenteuer möchtet ihr zusammen planen?","Was möchtest du Paul für die Zukunft versprechen?","Worüber möchtest du mit Paul noch viel öfter lachen?","Welche liebevolle Nachricht würdest du Paul gern an einem schweren Tag geben?","Was wünschst du euch beiden für das nächste Weihnachtsfest?"],
  paul: ["Woran merkst du, dass Pia dich wirklich kennt?","Welche kleine Eigenheit von Pia bringt dich immer zum Lächeln?","Wann hat Pia dich zuletzt überrascht – ganz ohne große Geste?","Was möchtest du mit Pia in eurem ersten Ehejahr unbedingt erleben?","Welchen gemeinsamen Moment würdest du gern noch einmal erleben?","Wofür bist du Pia heute besonders dankbar?","Was macht euren Alltag für dich heimelig?","Welche Stärke von Pia bewunderst du am meisten?","Welche Tradition möchtet ihr zwei unbedingt weiterführen oder erfinden?","Wie hilft dir Pia, du selbst zu sein?","Welche Erinnerung an euer Kennenlernen magst du besonders?","Welche Seite an Pia möchtest du noch besser kennenlernen?","Was wäre ein perfekter freier Sonntag zu zweit?","Wann fühlst du dich Pia besonders nah?","Welche Kleinigkeit wünschst du dir öfter von eurem gemeinsamen Alltag?","Was ist etwas, das Pia ganz selbstverständlich gut kann?","Welche gemeinsame Sache macht euch zu einem guten Team?","Welche drei Wörter beschreiben Pia als Partner für dich?","Was war in diesem Jahr ein stiller, schöner Glücksmoment mit Pia?","Welche Reise oder welches Abenteuer möchtet ihr zusammen planen?","Was möchtest du Pia für die Zukunft versprechen?","Worüber möchtest du mit Pia noch viel öfter lachen?","Welche liebevolle Nachricht würdest du Pia gern an einem schweren Tag geben?","Was wünschst du euch beiden für das nächste Weihnachtsfest?"],
};
let state = null;
let selectedDay = 1;
let selectedPartner = "pia";

function other(partner) { return partner === "pia" ? "paul" : "pia"; }
function name(partner) { return partner === "pia" ? "Pia" : "Paul"; }
function escape(value = "") { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
function token() { return localStorage.getItem("pia-paul-calendar-token") || ""; }
function configureMessage() { return `<main class="welcome-shell"><section class="welcome-card"><div class="heart-mark">♥</div><p class="eyebrow">Fast geschafft</p><h1>Die Verbindung fehlt noch.</h1><p class="intro">Trage zuerst die Adresse eures Cloudflare-Workers in <code>config.js</code> ein. Danach läuft der Kalender ohne Anmeldung.</p></section></main>`; }
async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (token()) headers.set("Authorization", `Bearer ${token()}`);
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Das hat leider nicht geklappt.");
  return payload;
}
async function load() {
  if (!API) { app.innerHTML = configureMessage(); return; }
  try {
    state = await api("/api/calendar");
    if (!state.session) localStorage.removeItem("pia-paul-calendar-token");
    if (state.status?.writeDay) selectedDay = state.status.writeDay;
    else if (state.status?.revealThrough) selectedDay = state.status.revealThrough;
    render();
  } catch (error) { app.innerHTML = `<main class="welcome-shell"><section class="welcome-card"><h1>Oh je.</h1><p class="intro">${escape(error.message)}</p><button class="primary-button" onclick="location.reload()">Noch einmal versuchen</button></section></main>`; }
}
function render() {
  if (!state.session) { renderAccess(); return; }
  renderCalendar();
}
function renderAccess(message = "") {
  const setup = !state.configured;
  app.innerHTML = `<main class="welcome-shell"><section class="welcome-card"><div class="heart-mark">♥</div><p class="eyebrow">Pia & Paul</p><h1>${setup ? "Euren Kalender einrichten" : "Willkommen zurück"}</h1><p class="intro">${setup ? "Lege einen gemeinsamen Schlüssel fest und teile ihn anschließend nur miteinander." : "Wähle deinen Namen und öffne euren gemeinsamen Adventskalender."}</p><form class="access-form" id="access-form"><fieldset><legend>Ich bin …</legend><div class="person-switch"><button type="button" data-person="pia" class="${selectedPartner === "pia" ? "selected" : ""}">Pia</button><button type="button" data-person="paul" class="${selectedPartner === "paul" ? "selected" : ""}">Paul</button></div></fieldset><label for="access-code">Gemeinsamer Schlüssel</label><div class="code-field">⌘ <input id="access-code" type="password" minlength="6" maxlength="80" autocomplete="current-password" placeholder="Mindestens 6 Zeichen" required></div>${message ? `<p class="form-message">${escape(message)}</p>` : ""}<button class="primary-button">${setup ? "Kalender anlegen" : "Kalender öffnen"}</button></form>${setup ? '<p class="fineprint">⌘ Der Schlüssel wird nicht lesbar gespeichert.</p>' : ""}</section></main>`;
  document.querySelectorAll("[data-person]").forEach((button) => button.addEventListener("click", () => { selectedPartner = button.dataset.person; renderAccess(); }));
  document.querySelector("#access-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const submit = event.currentTarget.querySelector("button.primary-button"); submit.disabled = true;
    try { const result = await api(state.configured ? "/api/session" : "/api/setup", { method: "POST", body: JSON.stringify({ partner: selectedPartner, accessCode: document.querySelector("#access-code").value }) }); localStorage.setItem("pia-paul-calendar-token", result.token); await load(); }
    catch (error) { renderAccess(error.message); }
  });
}
function renderCalendar(message = "") {
  const { session, status, seasonYear, ownAnswers = {}, partnerAnswers = {} } = state;
  const open = status.phase === "complete" || selectedDay <= (status.writeDay || status.revealThrough);
  const editing = selectedDay === status.writeDay;
  const own = ownAnswers[selectedDay] || "";
  const received = partnerAnswers[selectedDay];
  const heading = status.phase === "before" ? `Bereit für den 1. Dezember ${seasonYear}` : status.phase === "complete" ? "Alle Türchen sind offen" : `Heute ist Türchen ${status.writeDay}`;
  const doors = days.map((day) => { const unlocked = status.phase === "complete" || day <= (status.writeDay || 0); return `<button class="door ${unlocked ? "unlocked" : "locked"} ${selectedDay === day ? "active" : ""}" data-day="${day}" ${unlocked ? "" : "disabled"}><span>${day}</span>${partnerAnswers[day] ? "<b>♥</b>" : ownAnswers[day] ? "<em>•</em>" : ""}</button>`; }).join("");
  let body = `<div class="locked-copy"><h2>Noch ein wenig Geduld.</h2><p>Dieses Türchen wartet geduldig auf seinen Tag.</p></div>`;
  if (open) {
    const ownBlock = editing ? `<form class="answer-form" id="answer-form"><label for="answer">Deine Antwort für ${name(other(session.partner))}</label><textarea id="answer" maxlength="2000" placeholder="Schreib, was dir gerade im Herzen liegt …" required>${escape(own)}</textarea><div class="answer-footer"><span id="count">${own.length}/2000</span><button class="primary-button">Antwort speichern</button></div></form>` : `<section class="own-note"><p class="note-label">Deine Antwort</p><p>${escape(own || "Für diesen Tag hast du keine Antwort gespeichert.")}</p></section>`;
    const receivedBlock = received ? `<section class="received-note"><p class="note-label">Eine Nachricht von ${name(other(session.partner))}</p><p>${escape(received)}</p></section>` : (!editing ? `<p class="waiting-copy">${selectedDay <= status.revealThrough ? `${name(other(session.partner))} hat für dieses Türchen noch keine Antwort hinterlegt.` : "Die Antwort deines Partners wird morgen freigeschaltet."}</p>` : "");
    body = `<h2>Für dich, ${name(session.partner)}.</h2><p class="question">${prompts[session.partner][selectedDay - 1]}</p>${ownBlock}${receivedBlock}${message ? `<p class="save-message">${escape(message)}</p>` : ""}`;
  }
  app.innerHTML = `<main class="app-shell"><header class="topbar"><div class="brand"><span class="mini-heart">♥</span><span>Pia <i>&</i> Paul</span></div><button class="quiet-button" id="signout">Abmelden</button></header><section class="hero-row"><div><p class="eyebrow">Adventskalender ${seasonYear}</p><h1>${heading}</h1></div><p class="hero-note">${status.phase === "active" ? "Deine Antwort bleibt bis Mitternacht nur für dich sichtbar." : status.phase === "before" ? "24 kleine Fragen warten auf euch." : "Ein Dezember voller kleiner Liebesbriefe."}</p></section><section class="calendar-layout"><nav class="door-grid" aria-label="Adventstürchen">${doors}</nav><article class="door-detail"><div class="detail-top"><p class="eyebrow">${open ? `Türchen ${selectedDay}` : "Bis bald"}</p><span class="status-pill">${open ? "♥ geöffnet" : "⌘ verschlossen"}</span></div>${body}</article></section></main>`;
  document.querySelectorAll("[data-day]").forEach((button) => button.addEventListener("click", () => { selectedDay = Number(button.dataset.day); renderCalendar(); }));
  document.querySelector("#signout").addEventListener("click", () => { localStorage.removeItem("pia-paul-calendar-token"); state.session = null; render(); });
  const textarea = document.querySelector("#answer"); if (textarea) textarea.addEventListener("input", () => { document.querySelector("#count").textContent = `${textarea.value.length}/2000`; });
  const form = document.querySelector("#answer-form"); if (form) form.addEventListener("submit", async (event) => { event.preventDefault(); const button = form.querySelector("button"); button.disabled = true; try { const result = await api("/api/answers", { method: "PUT", body: JSON.stringify({ day: selectedDay, content: textarea.value }) }); state.ownAnswers[selectedDay] = result.content; renderCalendar("Gespeichert. Du kannst sie bis Mitternacht noch ändern."); } catch (error) { renderCalendar(error.message); } });
}
load();

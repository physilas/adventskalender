# Pia & Paul · Adventskalender

Eine kleine Adventskalender-Webapp für zwei Handys — ohne Nutzerkonto für Pia und Paul. Die Website liegt auf GitHub Pages; nur die Antworten und die tägliche Freischaltung laufen über einen kostenlosen Cloudflare Worker mit D1-Datenbank.

## Einmalig einrichten

1. Lege einen kostenlosen Cloudflare-Account an und installiere Node.js, falls noch nicht vorhanden.
2. Melde dich im Projektordner einmal bei Cloudflare an:

   ```sh
   npx wrangler login
   ```

3. Erstelle die Datenbank:

   ```sh
   npx wrangler d1 create pia-und-paul-adventskalender
   ```

   Kopiere die ausgegebene `database_id` nach `wrangler.toml` und ersetze dort den Platzhalter.

4. Erstelle Tabellen und veröffentliche die kleine API:

   ```sh
   npx wrangler d1 migrations apply pia-und-paul-adventskalender --remote
   npx wrangler deploy
   ```

5. Kopiere die am Ende ausgegebene `workers.dev`-Adresse nach `config.js` als Wert von `window.ADVENT_API_URL`.
6. Lege ein GitHub-Repository an, lade den gesamten Inhalt dieses Ordners hoch und aktiviere unter **Settings → Pages → Source: GitHub Actions** GitHub Pages.

Nach dem ersten Push veröffentlicht GitHub die Web-App. Die erste Person richtet dort den Kalender und einen gemeinsamen Schlüssel ein; die zweite Person öffnet denselben Link, wählt ihren Namen und verwendet denselben Schlüssel.

## Wie die Privatsphäre funktioniert

- Der Schlüssel wird nur als kryptografischer Prüfwert gespeichert.
- Jede Anmeldung erhält einen zufälligen, 45 Tage gültigen Zugangsschlüssel auf dem jeweiligen Handy.
- Die Antwort des Partners wird vom Worker vor dem Folgetag nicht an den Browser übertragen.
- Ein gemeinsamer Schlüssel ist bewusst unkompliziert, aber kein Ersatz für zwei vollständig getrennte Benutzerkonten. Für Pia und Paul als vertrauensvolles Paar ist er die reibungsärmste Lösung.

## Lokal ansehen

Die Oberfläche ist eine normale statische Seite. Nach dem Eintragen einer lokalen oder veröffentlichten Worker-Adresse kann sie mit einem beliebigen statischen Webserver geöffnet werden.

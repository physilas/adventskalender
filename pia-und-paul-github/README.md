# Pia & Paul · Adventskalender

Eine kleine Adventskalender-Webapp für zwei Handys — ohne Nutzerkonto für Pia und Paul. Die Website liegt auf GitHub Pages; Antworten, private Medien und die tägliche Freischaltung laufen über einen kostenlosen Cloudflare Worker mit D1-Datenbank.

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

Nach dem ersten Push veröffentlicht GitHub die Web-App. Die erste Person richtet dort den Adventskalender und einen gemeinsamen Schlüssel ein; die zweite Person öffnet denselben Link, wählt ihren Namen und verwendet denselben Schlüssel.

## Private Verwaltung

Hänge für die private Verwaltungsseite `?admin=1` an die jeweilige Adresse an. Dort meldest du dich mit deinem **Rettungscode** an – nicht mit dem gemeinsamen Schlüssel von Pia und Paul. Die Verwaltungsseite ist in der normalen App nicht verlinkt und bietet getrennt für Test- und echte Version:

- gemeinsamen Schlüssel zurücksetzen (alle normalen Sitzungen werden abgemeldet),
- Adventsjahr und in der Testversion den simulierten Tag ändern,
- Pia-Erinnerung zurücksetzen,
- die beiden PDFs und PNG-Vorschauen für den 24. Dezember ersetzen,
- persönliche Inhalte nach einer Checkbox-, Texteingabe- und Browser-Bestätigung zurücksetzen. Die 24.-Dezember-Dateien bleiben dabei erhalten.

Admin-Sitzungen laufen nach zwölf Stunden ab. Der Rettungscode ist ausschließlich als Hash in der Datenbank gespeichert.

## Zwei Bereiche und Antwortformate

- **Dein Adventskalender** zeigt die bis zum jeweiligen Datum freigeschalteten Überraschungen des Partners. Ein Herz markiert eine neue Überraschung, ein Haken ein bereits angesehenes Türchen und eine Sanduhr eine noch fehlende Antwort.
- **Deine Werkstatt** ist immer vollständig geöffnet. Dort lassen sich alle 24 persönlichen Aufgaben vorbereiten oder nachträglich ergänzen. Ein Haken markiert gespeicherte Beiträge, eine Sanduhr vergangene, noch leere Tage.
- Neben Text und Auswahlfragen gibt es Fotos, kurze Sprachaufnahmen, Zeichnungen, Ortsmarkierungen auf OpenStreetMap und beliebige Links (zum Beispiel Spotify oder YouTube).
- Bilder, Zeichnungen und Sprachaufnahmen werden privat in D1 gespeichert. Fotos werden vor dem Upload automatisch verkleinert und komprimiert; wegen der kostenlosen D1-Grenze bleiben Dateien auf **1,8 MB** begrenzt. Für Sprachaufnahmen eignet sich daher eine kurze Nachricht.

## Wie die Privatsphäre funktioniert

- Der Schlüssel wird nur als kryptografischer Prüfwert gespeichert.
- Jede Anmeldung erhält einen zufälligen, 45 Tage gültigen Zugangsschlüssel auf dem jeweiligen Handy.
- Die Antwort des Partners wird vom Worker vor ihrem jeweiligen Kalendertag nicht an den Browser übertragen.
- Ein gemeinsamer Schlüssel ist bewusst unkompliziert, aber kein Ersatz für zwei vollständig getrennte Benutzerkonten. Für Pia und Paul als vertrauensvolles Paar ist er die reibungsärmste Lösung.
- Wer Zugriff auf den Cloudflare-Account bzw. die D1-Datenbank hat, kann die gespeicherten Daten technisch einsehen. Die Website selbst veröffentlicht keine Antworten.

## Lokal ansehen

Die Oberfläche ist eine normale statische Seite. Nach dem Eintragen einer lokalen oder veröffentlichten Worker-Adresse kann sie mit einem beliebigen statischen Webserver geöffnet werden.

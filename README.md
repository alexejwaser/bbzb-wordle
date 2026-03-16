# BBZB WORDLE

Ein Wordle-ähnliches Ratespiel für das **Berufbildungszentrum Bau und Gewerbe Luzern (BBZB)**. Alle Wörter stammen aus den Berufsfeldern der Schule. Das Spiel läuft vollständig im Browser — kein Backend, keine Installation.

## Demo

Einfach `index.html` im Browser öffnen.

> Da die Dateien aufgeteilt sind (`index.html`, `style.css`, `game.js`), muss das Spiel über einen lokalen Webserver geöffnet werden. Am einfachsten:
> ```bash
> npx serve .
> # oder
> python3 -m http.server
> ```

## Projektstruktur

```
bbzb-wordle/
├── index.html   # Markup & Struktur
├── style.css    # Gesamtes Styling (WinXP-Look, Pixel-Design, Animationen)
├── game.js      # Spiellogik, Wortliste, localStorage-Stats
└── README.md
```

## Spielmechanik

- Errate das **5-Buchstaben-Wort** in maximal **6 Versuchen**
- Alle Wörter beziehen sich auf Berufe und Materialien aus dem BBZB
- Farbfeedback nach jedem Versuch:
  - **Grün** — Buchstabe korrekt und an richtiger Position
  - **Gelb** — Buchstabe im Wort, aber falsche Position
  - **Dunkel** — Buchstabe nicht im Wort
- Nach dem **3. Fehlversuch** erscheint ein Hinweis mit Kategorie und Beschreibung
- Physische Tastatur und Klick-Tastatur werden unterstützt

## Features

- Pixel-Art Design mit Windows-XP-Fenster-Look
- Statistiken persistent via `localStorage`
- Share-Button generiert kopierbaren Ergebnis-Text
- Klassencode-Feld (Platzhalter für spätere Hub-Integration)
- Mobiloptimiert (Touch-Events)

## Wortliste anpassen

Die Wörter befinden sich in `game.js` im Array `WORDS`. Jeder Eintrag hat folgende Struktur:

```js
{
  word:        "MAUER",
  description: "Tragwerk aus Backstein oder Beton — das Grundhandwerk im Hochbau",
  category:    "Bautechnik"
}
```

Alle Wörter müssen **exakt 5 Buchstaben** lang sein und nur **A–Z** enthalten (keine Umlaute).

## Geplante Hub-Integration

Im Code sind folgende `TODO`-Marker gesetzt:

| Marker | Funktion |
|--------|----------|
| `HUB-INTEGRATION — Tageswort von API laden` | Tageswort zentral über API steuern |
| `HUB-INTEGRATION — Wort gegen API validieren` | Eingaben gegen deutsches Wörterbuch prüfen |
| `HUB-INTEGRATION — Klassencode validieren` | Klassencode-Feld mit Backend verbinden |
| `HUB-INTEGRATION — Score an Klassen-Rangliste senden` | Ergebnisse an Rangliste übertragen |
| `HUB-INTEGRATION — Rangliste der Klassen anzeigen` | Klassen-Rangliste im UI anzeigen |

## Technologie

Reines HTML / CSS / JavaScript — keine Abhängigkeiten ausser Google Fonts CDN.

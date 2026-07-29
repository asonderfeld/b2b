# mk | hotels – Firmenraten-Verträge

Web-App zur Verwaltung von Firmenraten-Verträgen (B2B-Firmenkunden) für die
Hotelgruppe mk | hotels. Ersetzt den bisherigen manuellen Prozess über das
Altsystem **UMNION** durch eine moderne Anwendung mit echtem Backend,
Datenbank, Nutzerverwaltung (intern + Kundenportal) und Workflow.

## Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Tech-Stack](#tech-stack)
3. [Lokales Setup](#lokales-setup)
4. [Rollen & Login](#rollen--login)
5. [Wichtige Seiten & Workflows](#wichtige-seiten--workflows)
6. [E-Mail-Versand & Portal-Login](#e-mail-versand--portal-login)
7. [Deployment auf Vercel](#deployment-auf-vercel)
8. [Migration aus UMNION (CSV-Import)](#migration-aus-umnion-csv-import)
9. [Apaleo-Integration](#apaleo-integration)
10. [Bekannte Vereinfachungen / offene Punkte](#bekannte-vereinfachungen--offene-punkte)

## Projektübersicht

Firmenkunden fragen über ein öffentliches Formular (`/anfrage`) Firmenraten
für ein oder mehrere mk | hotels-Häuser an. Der Vertrieb prüft die Anfrage im
internen Bereich (`/admin`), erstellt daraus einen Vertragsentwurf, ordnet
Firmenraten und Vertragsbedingungen zu und versendet den Entwurf an den
Kunden. Der Kunde unterschreibt den Vertrag digital im Kundenportal
(`/portal`) per Maus-/Touch-Signatur. Nach Eingang aller nötigen
Unterschriften finalisiert der Vertrieb den Vertrag, der anschließend als
laufend geführt wird.

## Tech-Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Prisma ORM** mit PostgreSQL (für Vercel Postgres / Neon / Supabase o.ä.)
- **NextAuth** (Credentials Provider, JWT-Sessions) mit den Rollen `ADMIN`,
  `SALES` (beide intern) und `CUSTOMER` (Firmenkunden-Ansprechpartner)
- Zielhosting: **Vercel**

## Lokales Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
# .env ausfüllen: DATABASE_URL, NEXTAUTH_SECRET (z.B. `openssl rand -base64 32`), NEXTAUTH_URL

# 3. Datenbankschema anlegen
npx prisma db push
# (alternativ für versionierte Migrationen: npx prisma migrate dev --name init)

# 4. Demo-Daten einspielen (Hotels, Firma, Admin-/Vertriebs-/Kunden-Login)
npx prisma db seed
# entspricht: npx tsx prisma/seed.ts

# 5. Entwicklungsserver starten
npm run dev
```

Die App läuft danach unter `http://localhost:3000`.

> **Hinweis zu diesem Repository:** `node_modules` und `.next` sind bewusst
> nicht Teil der Auslieferung (siehe `.gitignore`). Nach `npm install` legt
> Prisma automatisch (`postinstall`-Hook) den Prisma Client an.

## Rollen & Login

| Rolle      | Zugriff              | Demo-Login                              |
|------------|-----------------------|------------------------------------------|
| `ADMIN`    | `/admin/*` (voll)      | `admin@mkhotels.de` / `changeme123`       |
| `SALES`    | `/admin/*` (voll)      | `vertrieb@mkhotels.de` / `changeme123`    |
| `CUSTOMER` | nur `/portal/*` (eigene Firma) | `erika.musterfrau@musterfirma.de` / `changeme123` |

Die Passwörter werden als bcrypt-Hash in der Datenbank gespeichert (siehe
`prisma/seed.ts`). `middleware.ts` schützt `/admin` (nur `ADMIN`/`SALES`) und
`/portal` (nur `CUSTOMER`) und leitet nicht angemeldete bzw. nicht
berechtigte Nutzer auf `/login` um. Zusätzlich prüft jede API-Route unter
`app/api/**` die Rolle server- und sessionseitig noch einmal selbst (siehe
`lib/authz.ts`), damit der Schutz nicht ausschließlich von der Middleware
abhängt.

## Wichtige Seiten & Workflows

- **`/anfrage`** – öffentliches Anfrageformular (kein Login nötig). Legt bei
  Absenden Firma, Ansprechpartner, Anfrage und Hotelzeilen an
  (`POST /api/requests`). Nur Hotels mit `activeForCorporateRates = true`
  sind wählbar; Mindestkontingent 50 Nächte/Jahr wird geprüft.
- **`/admin/requests`** – Anfragen verwalten, Detailseite mit Aktion
  „Vertragsentwurf erstellen“ (erzeugt `Contract` im Status `DRAFT`).
- **`/admin/contracts/[id]`** – Vertrag bearbeiten (Verantwortlicher,
  Sprache, Laufzeit, Zusatzvereinbarung, Firmenraten, Vertragsbedingungen,
  zweiter Ansprechpartner, Zahlung auf Rechnung) sowie Status-Aktionen:
  „Vertragsentwurf an Bestandskunden/Neukunden senden“ →
  „Vertrag (final) erstellen“ (erst möglich, wenn alle nötigen
  Unterschriften vorliegen) → „Vertrag (final) an Kunden senden“.
- **`/admin/companies`, `/contacts`, `/hotels`, `/rates`, `/terms`** –
  einfache CRUD-Verwaltung der Stammdaten.
- **`/portal`** – Kundendashboard mit eigenen Anfragen und Verträgen
  (gefiltert über `contactId`/`companyId` des eingeloggten Nutzers).
- **`/portal/contracts/[id]`** – Vertragsdetails, Firmenraten,
  Vertragsbedingungen (Download), und – sofern Status
  `AWAITING_SIGNATURE` und der eingeloggte Kontakt unterschreiben muss –
  ein selbstgebautes Canvas-Signaturfeld (Maus/Touch) inkl. Checkbox zur
  rechtsverbindlichen Annahme. Ist der Vertrag bereits abgesendet/gesperrt,
  erscheint der Hinweis „Dieser Link ist nicht mehr gültig…“.
- **`/portal/contracts/[id]/print`** – druckfreundliche Ansicht (reines
  Print-CSS), der Kunde nutzt den Browser-Druckdialog („Als PDF speichern“).

## E-Mail-Versand & Portal-Login

Der Versand läuft über [Resend](https://resend.com) (`lib/mail.ts`). Ohne
gesetzten `RESEND_API_KEY` wird jede Mail nur in die Server-Logs geschrieben
statt tatsächlich verschickt – lokale Entwicklung funktioniert also auch ohne
eigenen Resend-Account.

Es werden fünf Mails ausgelöst:

| Trigger | Empfänger | Inhalt |
|---|---|---|
| Neue Anfrage über `/anfrage` | Vertrieb (`SALES_NOTIFICATION_EMAIL` oder alle `ADMIN`/`SALES`-Nutzer) | Link zur Anfrage im Admin-Bereich |
| „Vertragsentwurf an Bestandskunden/Neukunden senden“ | Ansprechpartner (+ ggf. zweiter Ansprechpartner) | Login-Link zum Prüfen/Unterschreiben |
| Kunde hat unterschrieben und alle nötigen Unterschriften liegen vor | Verantwortlicher Vertriebsmitarbeiter des Vertrags | Link zum Finalisieren |
| „Vertrag (final) an Kunden senden“ | Ansprechpartner (+ ggf. zweiter Ansprechpartner) | Login-Link zum finalen Vertrag |

Templates liegen in `lib/emailTemplates.ts` (einfaches, inline-gestyltes HTML,
DE/EN je nach `Contract.language`).

**Portal-Login ohne Passwort:** Kundenkontakte bekommen keinen Zugang per
selbst vergebenem Passwort, sondern ausschließlich per Magic Link. Beim
Versenden einer Vertragsmail wird ein einmalig gültiger, zeitlich begrenzter
Token erzeugt (`lib/tokens.ts`, Model `LoginToken`, 7 Tage bei Entwürfen, 30
Tage beim finalen Vertrag). Der Link führt auf
`/login/magic/[token]?callbackUrl=...`; dort meldet ein eigener NextAuth-
Credentials-Provider (`id: "magic-link"`, siehe `lib/auth.ts`) den Kontakt
serverseitig an und legt bei Erstlogin automatisch ein `User`-Konto mit
Rolle `CUSTOMER` an. Der reguläre E-Mail-/Passwort-Login (`/login`) bleibt
für interne Nutzer (`ADMIN`/`SALES`) unverändert bestehen.

## Deployment auf Vercel

1. Repository zu Vercel importieren (Next.js wird automatisch erkannt).
2. Eine Postgres-Datenbank anlegen, z.B. **Vercel Postgres** oder **Neon**
   (im Vercel-Dashboard unter „Storage“ → „Create Database“). Die generierte
   `DATABASE_URL` in die Projekt-Umgebungsvariablen übernehmen.
3. Umgebungsvariablen in Vercel setzen (Project Settings → Environment
   Variables):
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (zufälliger String, z.B. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (die finale Produktions-URL, z.B.
     `https://firmenvertraege.mkhotels.de`)
   - `RESEND_API_KEY`, `MAIL_FROM` und optional `SALES_NOTIFICATION_EMAIL`
     für den E-Mail-Versand (siehe Abschnitt
     [E-Mail-Versand & Portal-Login](#e-mail-versand--portal-login))
4. Deploy anstoßen. Der Build-Befehl (`npm run build`) führt automatisch
   `prisma generate` aus; `prisma generate` benötigt einen Internetzugang zum
   Herunterladen der Query-Engine-Binaries – das ist auf Vercels
   Build-Infrastruktur standardmäßig gegeben.
5. Nach dem ersten Deploy einmalig das Schema in die Produktionsdatenbank
   pushen und Demo-/Startdaten einspielen (lokal mit auf die
   Produktions-`DATABASE_URL` gesetzter `.env` oder über `vercel env pull`):
   ```bash
   npx prisma db push
   npx prisma db seed   # optional – erzeugt Demo-Daten, für echten Betrieb ggf. weglassen und stattdessen den CSV-Import nutzen
   ```

## Migration aus UMNION (CSV-Import)

Ein direkter Datenbankzugriff auf das Altsystem UMNION ist aus der
Entwicklungsumgebung heraus **nicht möglich** – es steht lediglich ein
MCP-Connector mit stark eingeschränkten Objekttypen zur Verfügung, der
**keine** Export-Funktion für Unternehmen, Kontakte, Verträge oder
Firmenraten bietet.

Der Import ist daher als **manueller CSV-Import** vorbereitet:

1. In UMNION je Objekttyp einen CSV-Export durchführen (Unternehmen,
   Kontakte, Hotels, Firmenraten, Verträge, Vertragsbedingungen).
2. Die Dateien unter genau folgenden Namen in `prisma/import/` ablegen
   (die dort liegenden Dateien sind **Beispiel-/Musterdateien** mit den
   erwarteten Spaltenüberschriften und 2–3 Beispielzeilen):
   - `companies.csv`
   - `contacts.csv`
   - `hotels.csv`
   - `rates.csv`
   - `contract_terms.csv`
   - `contracts.csv`
3. Import ausführen:
   ```bash
   npx tsx prisma/import/run.ts
   ```
   Das Skript liest die CSVs (Paket `csv-parse`), mappt deutsche
   Altsystem-Statuswerte auf die Prisma-Enums und schreibt die Daten per
   `upsert`/`create` in die Datenbank. Reihenfolge: Unternehmen → Hotels →
   Kontakte → Firmenraten → Vertragsbedingungen → Verträge (spätere Schritte
   referenzieren frühere per Name/E-Mail).

## Apaleo-Integration

`lib/apaleo.ts` enthält die Funktion `pushCompanyToApaleo(company)` als
Platzhalter für die künftige Anbindung an die Apaleo-API (z.B. um Firmen als
Apaleo-„Company“ anzulegen bzw. Firmenraten als Corporate Code/Rate Plan zu
hinterlegen). Aktuell wird nur geloggt – ein echter API-Zugang stand in
dieser Umgebung nicht zur Verfügung. Der Aufruf ist an der Stelle vorbereitet
(mit `TODO`-Kommentar), an der ein Vertrag auf Status `RUNNING` gesetzt wird
(`app/api/admin/contracts/[id]/actions/route.ts`, Aktion `SEND_FINAL`).

## Bekannte Vereinfachungen / offene Punkte

- **E-Mail-Versand**: umgesetzt über Resend, siehe
  [E-Mail-Versand & Portal-Login](#e-mail-versand--portal-login). Offen für
  den Produktivbetrieb: eigene Absender-Subdomain bei Resend verifizieren
  (SPF/DKIM) und `SALES_NOTIFICATION_EMAIL` auf die tatsächliche
  Vertriebsadresse setzen.
- **PDF-Erzeugung**: Es gibt aktuell keine serverseitige PDF-Generierung,
  sondern eine druckfreundliche HTML-Ansicht (`/portal/contracts/[id]/print`)
  über die der Kunde per Browser-Druckdialog ein PDF erzeugen kann. Für einen
  professionelleren Workflow bietet sich z.B. `@react-pdf/renderer` oder ein
  Headless-Chrome-Dienst (Vercel-kompatibel z.B. via `@sparticuz/chromium`)
  an.
- **Apaleo-Live-Anbindung**: siehe oben – reiner Platzhalter/Hook.
- **Datei-Upload für Vertragsbedingungen**: `ContractTerm.fileUrl` ist ein
  reines Text-/URL-Feld; es gibt keinen Datei-Upload-Dialog im Admin-Bereich.
  Für den Produktivbetrieb empfiehlt sich die Anbindung eines
  Objektspeichers (z.B. Vercel Blob oder S3) inkl. Upload-UI.
- **Nummerngenerierung**: Kunden-, Anfrage- und Vertragsnummern werden über
  einfache, fortlaufende Zähler auf Basis der jeweiligen Tabellenzeilenzahl
  erzeugt (`lib/numbers.ts`). Für sehr viele parallele Schreibvorgänge wäre
  eine DB-Sequence oder ein dediziertes Zähler-Modell mit Transaktion
  robuster.
- **NextAuth-Datenmodelle**: Es wird eine reine JWT-Session-Strategie ohne
  DB-Sessions/Accounts-Tabellen verwendet (kein `Account`/`Session`/
  `VerificationToken`-Modell in `schema.prisma`), da nur ein
  Credentials-Login benötigt wird.
- **Firmen-Dubletten bei der Anfrage**: Der Upsert im öffentlichen
  Anfrageformular (`POST /api/requests`) erkennt bestehende Firmen/Kontakte
  aktuell anhand von Name + E-Mail – eine feingranularere
  Dublettenprüfung (z.B. über USt-IdNr) wäre für den Produktivbetrieb
  sinnvoll.

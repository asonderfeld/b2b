#!/bin/bash
# ---------------------------------------------------------------------------
# upload-to-github.sh
#
# Lädt dieses Projekt (firmenvertraege-app) in ein neues GitHub-Repository hoch.
#
# VORBEREITUNG (einmalig):
#   1. Auf github.com ein NEUES, LEERES Repository anlegen
#      (KEIN README, KEINE .gitignore, KEINE Lizenz beim Anlegen auswählen –
#      sonst gibt es gleich beim ersten Push einen Konflikt).
#   2. Die HTTPS- oder SSH-URL des Repos kopieren, z.B.:
#        https://github.com/DEIN-NUTZERNAME/firmenvertraege-app.git
#      oder
#        git@github.com:DEIN-NUTZERNAME/firmenvertraege-app.git
#   3. Diese URL unten bei REPO_URL eintragen.
#
# AUSFÜHRUNG:
#   cd in diesen Ordner (firmenvertraege-app), dann:
#     bash upload-to-github.sh
#
#   Falls "Permission denied": vorher einmal  chmod +x upload-to-github.sh
# ---------------------------------------------------------------------------

set -e

# >>> HIER DEINE GITHUB-REPO-URL EINTRAGEN <<<
REPO_URL="https://github.com/asonderfeld/b2b.git"

BRANCH="main"
COMMIT_MESSAGE="Initial commit: mk | hotels Firmenverträge-App"

echo "== Prüfe Voraussetzungen =="

if ! command -v git >/dev/null 2>&1; then
  echo "Fehler: git ist nicht installiert. Bitte zuerst Git installieren (z.B. via 'xcode-select --install' auf macOS)."
  exit 1
fi

if [ "$REPO_URL" = "https://github.com/DEIN-NUTZERNAME/firmenvertraege-app.git" ]; then
  echo "Fehler: Bitte zuerst REPO_URL in diesem Skript auf dein eigenes GitHub-Repo anpassen."
  exit 1
fi

# Git-Identität prüfen (nötig für Commits)
if [ -z "$(git config --global user.email || true)" ]; then
  echo "Hinweis: Es ist noch keine globale Git-E-Mail konfiguriert."
  read -p "Bitte E-Mail-Adresse für Git-Commits eingeben: " GIT_EMAIL
  git config --global user.email "$GIT_EMAIL"
fi
if [ -z "$(git config --global user.name || true)" ]; then
  read -p "Bitte Namen für Git-Commits eingeben: " GIT_NAME
  git config --global user.name "$GIT_NAME"
fi

echo "== Initialisiere Git-Repository (falls noch nicht vorhanden) =="
if [ ! -d ".git" ]; then
  git init
fi

echo "== Stelle sicher, dass node_modules/.next/.env nicht mit hochgeladen werden =="
if [ ! -f ".gitignore" ]; then
  echo "Warnung: keine .gitignore gefunden – das sollte eigentlich nicht passieren."
fi

echo "== Füge alle Dateien hinzu (node_modules etc. werden per .gitignore ausgeschlossen) =="
git add .

echo "== Erstelle Commit =="
git commit -m "$COMMIT_MESSAGE" || echo "Hinweis: Es gab nichts Neues zu committen (evtl. schon committet)."

echo "== Setze Branch auf '$BRANCH' =="
git branch -M "$BRANCH"

echo "== Verknüpfe mit GitHub-Repo =="
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "== Push nach GitHub =="
echo "(Falls jetzt ein Login-Fenster / Passwortabfrage kommt: GitHub-Zugangsdaten bzw. Personal Access Token verwenden.)"
git push -u origin "$BRANCH"

echo ""
echo "Fertig! Projekt liegt jetzt unter: ${REPO_URL%.git}"
echo "Nächster Schritt: Auf vercel.com -> 'Add New Project' -> dieses Repo importieren."

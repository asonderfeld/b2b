/** Baut eine absolute App-URL aus einem relativen Pfad (für E-Mail-Links). */
export function appUrl(path: string): string {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

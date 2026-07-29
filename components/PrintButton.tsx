"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary">
      Als PDF speichern / drucken
    </button>
  );
}

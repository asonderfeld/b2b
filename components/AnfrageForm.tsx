"use client";

import { useState } from "react";

type Hotel = { id: string; name: string; city: string };

type HotelLine = { hotelId: string; nightsPerYear: number };

const MIN_NIGHTS = 50;

export function AnfrageForm({ hotels }: { hotels: Hotel[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState({
    name: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    emailInvoice: "",
    vatId: "",
  });

  const [contact, setContact] = useState({
    salutation: "HERR",
    firstName: "",
    lastName: "",
    position: "",
    email: "",
    phone: "",
  });

  const [selectedHotels, setSelectedHotels] = useState<Record<string, HotelLine>>({});
  const [notes, setNotes] = useState("");

  function toggleHotel(hotelId: string, checked: boolean) {
    setSelectedHotels((prev) => {
      const next = { ...prev };
      if (checked) {
        next[hotelId] = { hotelId, nightsPerYear: MIN_NIGHTS };
      } else {
        delete next[hotelId];
      }
      return next;
    });
  }

  function updateNights(hotelId: string, value: number) {
    setSelectedHotels((prev) => ({
      ...prev,
      [hotelId]: { hotelId, nightsPerYear: value },
    }));
  }

  const hotelLines = Object.values(selectedHotels);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (hotelLines.length === 0) {
      setError("Bitte wählen Sie mindestens ein Hotel aus.");
      return;
    }
    if (hotelLines.some((l) => l.nightsPerYear < MIN_NIGHTS)) {
      setError(
        `Wir bieten Firmenraten erst ab einem Mindestkontingent von ${MIN_NIGHTS} Nächten pro Jahr an.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          contact,
          hotelLines,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Anfrage konnte nicht gesendet werden.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Es ist ein Fehler aufgetreten.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-semibold mb-2">Vielen Dank für Ihre Anfrage!</h2>
        <p className="text-neutral-600">
          Wir haben Ihre Anfrage erhalten und melden uns in Kürze mit einem
          individuellen Angebot für Ihre Firmenraten.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Unternehmen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Firma *</label>
            <input
              required
              className="input"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Straße/Nr. *</label>
            <input
              required
              className="input"
              value={company.street}
              onChange={(e) => setCompany({ ...company, street: e.target.value })}
            />
          </div>
          <div>
            <label className="label">PLZ *</label>
            <input
              required
              className="input"
              value={company.zip}
              onChange={(e) => setCompany({ ...company, zip: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Ort *</label>
            <input
              required
              className="input"
              value={company.city}
              onChange={(e) => setCompany({ ...company, city: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Land *</label>
            <input
              required
              className="input"
              value={company.country}
              onChange={(e) => setCompany({ ...company, country: e.target.value })}
            />
          </div>
          <div>
            <label className="label">E-Mail (Rechnung) *</label>
            <input
              required
              type="email"
              className="input"
              value={company.emailInvoice}
              onChange={(e) => setCompany({ ...company, emailInvoice: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Umsatzsteuer-ID *</label>
            <input
              required
              className="input"
              value={company.vatId}
              onChange={(e) => setCompany({ ...company, vatId: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Ansprechpartner</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Anrede *</label>
            <select
              required
              className="input"
              value={contact.salutation}
              onChange={(e) => setContact({ ...contact, salutation: e.target.value })}
            >
              <option value="HERR">Herr</option>
              <option value="FRAU">Frau</option>
              <option value="DIVERS">Divers</option>
            </select>
          </div>
          <div />
          <div>
            <label className="label">Vorname *</label>
            <input
              required
              className="input"
              value={contact.firstName}
              onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Familienname *</label>
            <input
              required
              className="input"
              value={contact.lastName}
              onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Position *</label>
            <input
              required
              className="input"
              value={contact.position}
              onChange={(e) => setContact({ ...contact, position: e.target.value })}
            />
          </div>
          <div />
          <div>
            <label className="label">E-Mail *</label>
            <input
              required
              type="email"
              className="input"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input
              required
              className="input"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Hotelauswahl</h2>
        <p className="text-sm text-neutral-500">
          Wir bieten Firmenraten erst ab einem Mindestkontingent von {MIN_NIGHTS}{" "}
          Nächten pro Jahr an. Bitte wählen Sie ein oder mehrere Hotels aus und
          geben Sie die voraussichtliche Anzahl an Übernachtungen pro Jahr an.
        </p>
        <div className="space-y-3">
          {hotels.map((hotel) => {
            const selected = selectedHotels[hotel.id];
            return (
              <div
                key={hotel.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 border border-neutral-200 rounded-md px-4 py-3"
              >
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={(e) => toggleHotel(hotel.id, e.target.checked)}
                  />
                  <span className="font-medium">{hotel.name}</span>
                  <span className="text-neutral-500 text-sm">– {hotel.city}</span>
                </label>
                {selected && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={MIN_NIGHTS}
                      required
                      className="input w-32"
                      value={selected.nightsPerYear}
                      onChange={(e) => updateNights(hotel.id, Number(e.target.value))}
                    />
                    <span className="text-sm text-neutral-500 whitespace-nowrap">
                      Nächte / Jahr
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {hotels.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aktuell sind keine Hotels für Firmenraten-Anfragen verfügbar.
            </p>
          )}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Anmerkungen</h2>
        <div>
          <label className="label">Anmerkungen/Wünsche (optional)</label>
          <textarea
            className="input"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Wird gesendet…" : "Anfrage absenden"}
      </button>
    </form>
  );
}

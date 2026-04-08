// The booking form: customer name, phone number, address (for home service only),
// and the "Book Now" button. Handles validation and submission.

"use client";

import { useState } from "react";

interface BookingFormProps {
  selectedSlotId: string;
  mode: "shop" | "home";
  onSuccess: () => void;
  onSlotTaken: () => void;
}

// Light validation: Nigerian phone numbers are 11 digits starting with 0
function isValidNigerianPhone(phone: string): boolean {
  const digits = phone.replace(/\s/g, "");
  return /^0\d{10}$/.test(digits);
}

export default function BookingForm({ selectedSlotId, mode, onSuccess, onSlotTaken }: BookingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate name
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    // Validate phone
    if (!isValidNigerianPhone(phone)) {
      setError("Please enter a valid phone number (11 digits starting with 0).");
      return;
    }

    // Validate address for home service
    if (mode === "home" && address.trim().length < 5) {
      setError("Please enter your address so the barber knows where to come.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: selectedSlotId,
          customer_name: name.trim(),
          customer_phone: phone.replace(/\s/g, ""),
          customer_address: mode === "home" ? address.trim() : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "SLOT_TAKEN") {
          onSlotTaken();
        } else {
          setError(result.message || "Something went wrong. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Could not connect. Please check your internet and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chidi Okafor"
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      {/* Phone number */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 08012345678"
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      {/* Address — only for home service */}
      {mode === "home" && (
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Your address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
      >
        {submitting ? "Booking..." : "Book Now"}
      </button>
    </form>
  );
}

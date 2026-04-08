// Shows the available time slots for the selected day as tappable buttons.
// Hides slots that are booked, unavailable, or already past (for today).

"use client";

interface Slot {
  id: string;
  start_time: string;  // e.g. "09:00:00"
  end_time: string;    // e.g. "10:00:00"
}

interface SlotListProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSelect: (slotId: string) => void;
  mode: "shop" | "home" | null;
  homeServiceFee: number;
}

export type { Slot };

// Converts "09:00:00" to "9:00 AM"
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const amPm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${amPm}`;
}

export default function SlotList({ slots, selectedSlotId, onSelect, mode, homeServiceFee }: SlotListProps) {
  if (!mode) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No slots available for this day.
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No slots available for this day.
      </p>
    );
  }

  return (
    <div>
      {/* Mode badge and fee info */}
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {mode === "home" ? "Home service" : "Shop"}
        </span>
        {mode === "home" && (
          <span className="text-xs text-gray-500">
            ₦{homeServiceFee.toLocaleString()} (transport may vary)
          </span>
        )}
      </div>

      {/* Time slot grid */}
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => {
          const isSelected = slot.id === selectedSlotId;
          return (
            <button
              key={slot.id}
              onClick={() => onSelect(slot.id)}
              className={`rounded-lg border px-3 py-3 text-center text-sm transition-colors ${
                isSelected
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

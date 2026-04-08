// The interactive section of the booking page.
// This is a "client component" — it runs in the customer's browser so it can
// respond to taps and clicks. It fetches available slots from Supabase,
// manages which day and slot the customer has selected, and coordinates
// the date picker and slot list components.

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DatePicker, { type DayInfo } from "./date-picker";
import SlotList, { type Slot } from "./slot-list";
import BookingForm from "./booking-form";

interface BookingSectionProps {
  barberId: string;
  homeServiceFee: number;
}

interface BookedInfo {
  dayLabel: string;
  startTime: string;
  endTime: string;
}

// Converts "09:00:00" to "9:00 AM"
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const amPm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${amPm}`;
}

// Returns "Today", "Tomorrow", or a short date like "Thu 10 Apr"
function getDayLabel(dateStr: string, today: string, tomorrow: string): string {
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Returns "YYYY-MM-DD" for today, today+1, today+2 in the customer's local time
function getThreeDays(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

// Returns the current time as "HH:MM" in local time (for filtering past slots)
function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function BookingSection({ barberId, homeServiceFee }: BookingSectionProps) {
  const [dates] = useState(getThreeDays);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [allSlots, setAllSlots] = useState<Record<string, { mode: "shop" | "home" | null; slots: Slot[] }>>({});
  const [loading, setLoading] = useState(true);
  const [bookedInfo, setBookedInfo] = useState<BookedInfo | null>(null);
  const [slotTakenMessage, setSlotTakenMessage] = useState(false);

  // Fetch all slots for the 3-day window once when the page loads
  useEffect(() => {
    async function fetchSlots() {
      const { data, error } = await supabase
        .from("slots")
        .select("id, date, start_time, end_time, mode, is_booked, is_unavailable")
        .eq("barber_id", barberId)
        .gte("date", dates[0])
        .lte("date", dates[2])
        .eq("is_booked", false)
        .eq("is_unavailable", false)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Failed to fetch slots:", error);
        setLoading(false);
        return;
      }

      // Group slots by date
      const grouped: Record<string, { mode: "shop" | "home" | null; slots: Slot[] }> = {};

      for (const date of dates) {
        grouped[date] = { mode: null, slots: [] };
      }

      const now = getCurrentTime();
      const today = dates[0];

      for (const slot of data || []) {
        const dateKey = slot.date;

        // Skip past slots for today
        if (dateKey === today && slot.start_time <= now) {
          continue;
        }

        if (grouped[dateKey]) {
          grouped[dateKey].mode = slot.mode;
          grouped[dateKey].slots.push({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      }

      setAllSlots(grouped);
      setLoading(false);
    }

    fetchSlots();
  }, [barberId, dates]);

  // Reset selected slot when changing date
  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlotId(null);
  }

  // When a slot was taken by someone else, remove it from the list and show a message
  function handleSlotTaken() {
    setAllSlots((prev) => {
      const updated = { ...prev };
      const day = updated[selectedDate];
      if (day) {
        updated[selectedDate] = {
          ...day,
          slots: day.slots.filter((s) => s.id !== selectedSlotId),
        };
      }
      return updated;
    });
    setSelectedSlotId(null);
    setSlotTakenMessage(true);
    setTimeout(() => setSlotTakenMessage(false), 5000);
  }

  // When customer selects a new slot, clear any "slot taken" message
  function handleSlotSelect(slotId: string) {
    setSelectedSlotId(slotId);
    setSlotTakenMessage(false);
  }

  // Called when booking succeeds — captures the slot details for the success screen
  function handleBookingSuccess() {
    const day = allSlots[selectedDate];
    const slot = day?.slots.find((s) => s.id === selectedSlotId);
    const dayLabel = getDayLabel(selectedDate, dates[0], dates[1]);
    setBookedInfo({
      dayLabel,
      startTime: slot ? formatTime(slot.start_time) : "",
      endTime: slot ? formatTime(slot.end_time) : "",
    });
  }

  // Build day info for the date picker
  const days: DayInfo[] = dates.map((date) => ({
    date,
    label: getDayLabel(date, dates[0], dates[1]),
    mode: allSlots[date]?.mode || null,
  }));

  const currentDay = allSlots[selectedDate];

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        Loading available times...
      </div>
    );
  }

  // Success screen after booking
  if (bookedInfo) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Booked!</h2>
        <p className="mt-2 text-sm text-gray-700">
          {bookedInfo.dayLabel}, {bookedInfo.startTime} – {bookedInfo.endTime}
        </p>
        <p className="mt-1 text-sm text-gray-500">The barber will confirm shortly.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 text-sm font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slot taken warning */}
      {slotTakenMessage && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sorry, that slot was just taken. Please pick another.
        </div>
      )}

      {/* Step 1: Pick a day */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-500">Pick a day</h2>
        <DatePicker
          days={days}
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
        />
      </div>

      {/* Step 2: Pick a time */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-500">Pick a time</h2>
        <SlotList
          slots={currentDay?.slots || []}
          selectedSlotId={selectedSlotId}
          onSelect={handleSlotSelect}
          mode={currentDay?.mode || null}
          homeServiceFee={homeServiceFee}
        />
      </div>

      {/* Step 3: Your details */}
      {selectedSlotId && currentDay?.mode && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-gray-500">Your details</h2>
          <BookingForm
            selectedSlotId={selectedSlotId}
            mode={currentDay.mode}
            onSuccess={handleBookingSuccess}
            onSlotTaken={handleSlotTaken}
          />
        </div>
      )}
    </div>
  );
}

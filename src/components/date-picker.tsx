// Shows 3 tappable day buttons (today, tomorrow, day after tomorrow).
// Each button shows the day name, date, and the mode for that day (shop/home)
// or "No slots" if the barber hasn't added any slots for that day.

"use client";

interface DayInfo {
  date: string;        // e.g. "2026-04-08"
  label: string;       // e.g. "Today", "Tomorrow", "Wed 10 Apr"
  mode: "shop" | "home" | null;  // null means no slots for that day
}

interface DatePickerProps {
  days: DayInfo[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export type { DayInfo };

export default function DatePicker({ days, selectedDate, onSelect }: DatePickerProps) {
  return (
    <div className="flex gap-3">
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        return (
          <button
            key={day.date}
            onClick={() => onSelect(day.date)}
            className={`flex-1 rounded-xl border px-3 py-3 text-center transition-colors ${
              isSelected
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="text-sm font-medium">{day.label}</div>
            {day.mode ? (
              <div className={`mt-1 text-xs ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                {day.mode === "home" ? "Home service" : "Shop"}
              </div>
            ) : (
              <div className={`mt-1 text-xs ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                No slots
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

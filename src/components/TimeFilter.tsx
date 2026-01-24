"use client";

import { useState } from "react";

export type TimeFilterOption = "now" | "today" | "weekend" | "date";

export interface TimeFilterValue {
  option: TimeFilterOption;
  specificDate?: Date;
}

interface TimeFilterProps {
  value: TimeFilterValue;
  onChange: (value: TimeFilterValue) => void;
}

const OPTIONS: { value: TimeFilterOption; label: string; sublabel?: string }[] = [
  { value: "now", label: "Now/Soon", sublabel: "Next 2 hours" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "date", label: "Pick date" },
];

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleOptionChange = (option: TimeFilterOption) => {
    if (option === "date") {
      setShowDatePicker(true);
      // Default to tomorrow if no date selected
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      onChange({ option, specificDate: value.specificDate || tomorrow });
    } else {
      setShowDatePicker(false);
      onChange({ option });
    }
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00"); // Noon to avoid timezone issues
    onChange({ option: "date", specificDate: date });
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format date for input value
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Get min date (today)
  const getMinDate = (): string => {
    return new Date().toISOString().split("T")[0];
  };

  // Get max date (3 months from now)
  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">When?</label>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value: optionValue, label, sublabel }) => {
          const isSelected = value.option === optionValue;
          const showDate =
            optionValue === "date" && isSelected && value.specificDate;

          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => handleOptionChange(optionValue)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showDate ? formatDate(value.specificDate!) : label}
              {sublabel && !isSelected && (
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                  ({sublabel})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Date picker (shown when "Pick date" is selected) */}
      {showDatePicker && value.option === "date" && (
        <div className="mt-2">
          <input
            type="date"
            value={
              value.specificDate ? formatDateForInput(value.specificDate) : ""
            }
            onChange={(e) => handleDateChange(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Helper to check if an event/venue is available for the selected time filter
 */
export function isAvailableForTimeFilter(
  timeFilter: TimeFilterValue,
  eventStartTime?: Date | string | null,
  eventEndTime?: Date | string | null,
  hoursJson?: string | null
): boolean {
  const now = new Date();

  // For "now/soon" - check if open/happening in next 2 hours
  if (timeFilter.option === "now") {
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (eventStartTime) {
      const start = new Date(eventStartTime);
      const end = eventEndTime ? new Date(eventEndTime) : null;

      // Event is happening now or starting in next 2 hours
      if (end && now >= start && now <= end) return true;
      if (start >= now && start <= twoHoursLater) return true;
      return false;
    }

    // For venues, check hours if available
    if (hoursJson) {
      try {
        const hours = JSON.parse(hoursJson);
        const dayOfWeek = now
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        const todayHours = hours[dayOfWeek];

        if (!todayHours) return false;

        // Simple check - venue has hours for today
        return true;
      } catch {
        return true; // Default to showing if can't parse hours
      }
    }

    return true; // Always-open venues (parks) are always available
  }

  // For "today" - check if happens today
  if (timeFilter.option === "today") {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    if (eventStartTime) {
      const start = new Date(eventStartTime);
      return start >= todayStart && start <= todayEnd;
    }

    // Venues are available today unless closed
    return true;
  }

  // For "weekend" - check if happens this weekend
  if (timeFilter.option === "weekend") {
    const dayOfWeek = now.getDay();
    let saturdayStart: Date;
    let sundayEnd: Date;

    if (dayOfWeek === 0) {
      // Sunday
      saturdayStart = new Date(now);
      saturdayStart.setDate(now.getDate() - 1);
      sundayEnd = new Date(now);
    } else if (dayOfWeek === 6) {
      // Saturday
      saturdayStart = new Date(now);
      sundayEnd = new Date(now);
      sundayEnd.setDate(now.getDate() + 1);
    } else {
      // Weekday - find next Saturday
      const daysUntilSaturday = 6 - dayOfWeek;
      saturdayStart = new Date(now);
      saturdayStart.setDate(now.getDate() + daysUntilSaturday);
      sundayEnd = new Date(saturdayStart);
      sundayEnd.setDate(saturdayStart.getDate() + 1);
    }

    saturdayStart.setHours(0, 0, 0, 0);
    sundayEnd.setHours(23, 59, 59, 999);

    if (eventStartTime) {
      const start = new Date(eventStartTime);
      return start >= saturdayStart && start <= sundayEnd;
    }

    // Venues - check if open on weekends
    if (hoursJson) {
      try {
        const hours = JSON.parse(hoursJson);
        return hours.saturday || hours.sunday;
      } catch {
        return true;
      }
    }

    return true;
  }

  // For specific date
  if (timeFilter.option === "date" && timeFilter.specificDate) {
    const dateStart = new Date(timeFilter.specificDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(timeFilter.specificDate);
    dateEnd.setHours(23, 59, 59, 999);

    if (eventStartTime) {
      const start = new Date(eventStartTime);
      return start >= dateStart && start <= dateEnd;
    }

    // Venues - check if open on that day
    if (hoursJson) {
      try {
        const hours = JSON.parse(hoursJson);
        const dayOfWeek = timeFilter.specificDate
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        return !!hours[dayOfWeek];
      } catch {
        return true;
      }
    }

    return true;
  }

  return true;
}

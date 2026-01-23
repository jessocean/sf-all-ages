// Parse and check venue hours
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface HoursData {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

// Parse hours string like "9:00-17:00" or "9:00-17:00, 18:00-22:00"
function parseTimeRange(hoursStr: string): Array<{ open: number; close: number }> {
  if (!hoursStr || hoursStr.toLowerCase() === "closed") {
    return [];
  }

  const ranges = hoursStr.split(",").map((s) => s.trim());
  return ranges.map((range) => {
    const [openStr, closeStr] = range.split("-").map((s) => s.trim());
    return {
      open: parseTimeToMinutes(openStr),
      close: parseTimeToMinutes(closeStr),
    };
  });
}

// Parse time string like "9:00" or "17:30" to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

// Get current time in minutes since midnight
function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Check if venue is currently open
export function isOpenNow(hoursJson: string | null): boolean {
  if (!hoursJson) return false;

  try {
    const hours: HoursData = JSON.parse(hoursJson);
    const now = new Date();
    const dayOfWeek = DAY_MAP[now.getDay()];
    const todayHours = hours[dayOfWeek];

    if (!todayHours) return false;

    const currentMinutes = getCurrentMinutes();
    const ranges = parseTimeRange(todayHours);

    return ranges.some(
      (range) => currentMinutes >= range.open && currentMinutes <= range.close
    );
  } catch {
    return false;
  }
}

// Check if venue will be open during a given time window
export function isOpenDuring(
  hoursJson: string | null,
  date: Date,
  startMinutes: number,
  endMinutes: number
): boolean {
  if (!hoursJson) return false;

  try {
    const hours: HoursData = JSON.parse(hoursJson);
    const dayOfWeek = DAY_MAP[date.getDay()];
    const dayHours = hours[dayOfWeek];

    if (!dayHours) return false;

    const ranges = parseTimeRange(dayHours);

    // Check if the venue hours overlap with the requested time window
    return ranges.some(
      (range) => range.open < endMinutes && range.close > startMinutes
    );
  } catch {
    return false;
  }
}

// Get today's hours as a display string
export function getTodayHours(hoursJson: string | null): string {
  if (!hoursJson) return "Hours not available";

  try {
    const hours: HoursData = JSON.parse(hoursJson);
    const now = new Date();
    const dayOfWeek = DAY_MAP[now.getDay()];
    const todayHours = hours[dayOfWeek];

    if (!todayHours || todayHours.toLowerCase() === "closed") {
      return "Closed today";
    }

    return todayHours;
  } catch {
    return "Hours not available";
  }
}

// Format closing time for display
export function getClosingTime(hoursJson: string | null): string | null {
  if (!hoursJson) return null;

  try {
    const hours: HoursData = JSON.parse(hoursJson);
    const now = new Date();
    const dayOfWeek = DAY_MAP[now.getDay()];
    const todayHours = hours[dayOfWeek];

    if (!todayHours) return null;

    const ranges = parseTimeRange(todayHours);
    const currentMinutes = getCurrentMinutes();

    // Find the current open range
    for (const range of ranges) {
      if (currentMinutes >= range.open && currentMinutes <= range.close) {
        const closeHour = Math.floor(range.close / 60);
        const closeMin = range.close % 60;
        const period = closeHour >= 12 ? "pm" : "am";
        const displayHour = closeHour > 12 ? closeHour - 12 : closeHour || 12;
        return closeMin
          ? `${displayHour}:${closeMin.toString().padStart(2, "0")}${period}`
          : `${displayHour}${period}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

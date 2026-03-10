const BUSINESS_TIME_ZONE =
  process.env.BUSINESS_TIME_ZONE || "Asia/Kolkata";

export function getBusinessDateKey(
  date: Date = new Date()
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to build business date key");
  }

  return `${year}-${month}-${day}`;
}


export type DateRange = { gte: Date; lt: Date };

export function utcDayRange(value: string): DateRange | null {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const gte = new Date(Date.UTC(year, month, day));
  if (gte.getUTCFullYear() !== year || gte.getUTCMonth() !== month || gte.getUTCDate() !== day) {
    return null;
  }
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

export function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function previousMonth(from = new Date()) {
  return new Date(from.getFullYear(), from.getMonth() - 1, 1);
}

export function endOfUtcDate(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

const monthNumbers: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function utcMonthRange(year: number, month: number): DateRange | null {
  if (month < 0 || month > 11) return null;
  return {
    gte: new Date(Date.UTC(year, month, 1)),
    lt: new Date(Date.UTC(year, month + 1, 1)),
  };
}

export function searchDateRange(value: string): DateRange | null {
  const search = value.trim().toLowerCase().replace(/,/g, '');
  const iso = search.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    return iso[3]
      ? utcDayRange(`${year}-${month + 1}-${Number(iso[3])}`)
      : utcMonthRange(year, month);
  }

  const dayFirst = search.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (dayFirst) {
    const month = monthNumbers[dayFirst[2]];
    return month === undefined
      ? null
      : utcDayRange(`${Number(dayFirst[3])}-${month + 1}-${Number(dayFirst[1])}`);
  }

  const monthFirst = search.match(/^([a-z]+)(?:\s+(\d{1,2}))?(?:\s+(\d{4}))?$/);
  if (!monthFirst) return null;
  const month = monthNumbers[monthFirst[1]];
  if (month === undefined) return null;
  const year = Number(monthFirst[3] ?? new Date().getUTCFullYear());
  return monthFirst[2]
    ? utcDayRange(`${year}-${month + 1}-${Number(monthFirst[2])}`)
    : utcMonthRange(year, month);
}

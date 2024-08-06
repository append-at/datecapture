import { format, Duration } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import {
  isSameDay,
  isSameMonth,
  isSameYear,
  startOfDay,
  startOfHour,
  startOfMinute,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { containsKorean } from './korean-utils';

const MILLISECOND = 1000;

export interface DateInterval {
  start: Date;
  end: Date;
}

export enum DateUnit {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  WEEKDAY = 'weekday',
  HOUR = 'hour',
  MINUTE = 'minute',
  SECOND = 'second',
}

const dateUnitOrdinalMap: Record<DateUnit, number> = Object.values(DateUnit).reduce(
  (prev, unit, order) => ({ ...prev, [unit]: order }),
  {} as any,
);

export const ordinalOfDateUnit = (unit: DateUnit): number => dateUnitOrdinalMap[unit]!;

export const minDateUnit = (a: DateUnit, b: DateUnit): DateUnit =>
  ordinalOfDateUnit(a) < ordinalOfDateUnit(b) ? a : b;

export const nextLargerDateUnit = (unit: DateUnit): DateUnit => {
  const units = Object.values(DateUnit);
  return units[Math.min(ordinalOfDateUnit(unit) + 1, units.length - 1)];
};

export function normalizeDateUnit(unit: DateUnit): DateUnit {
  return unit === DateUnit.WEEKDAY ? DateUnit.DAY : unit;
}

export const dateUnitForDuration = (unit: DateUnit): keyof Duration => `${normalizeDateUnit(unit)}s` as keyof Duration;

export type DateFnsUnit = 'year' | 'month' | 'date' | 'hours' | 'minutes' | 'seconds';

export function dateUnitForSet(unit: DateUnit): DateFnsUnit {
  if (normalizeDateUnit(unit) === DateUnit.DAY) {
    return 'date';
  }
  if (ordinalOfDateUnit(unit) >= ordinalOfDateUnit(DateUnit.HOUR)) {
    return `${unit}s` as DateFnsUnit;
  }
  return unit as DateFnsUnit;
}

export function getUnitOfDate(date: Date): DateUnit {
  if (startOfMonth(date) === date) {
    return DateUnit.MONTH;
  }
  if (startOfWeek(date) === date) {
    return DateUnit.WEEK;
  }
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return DateUnit.DAY;
  }
  if (date.getMinutes() === 0) {
    return DateUnit.HOUR;
  }
  return DateUnit.MINUTE;
}

export function truncateDate(date: Date, unit: DateUnit): Date {
  switch (unit) {
    case DateUnit.YEAR:
      return startOfYear(date);
    case DateUnit.MONTH:
      return startOfMonth(date);
    case DateUnit.WEEK:
      return startOfWeek(date);
    case DateUnit.WEEKDAY:
    case DateUnit.DAY:
      return startOfDay(date);
    case DateUnit.HOUR:
      return startOfHour(date);
    case DateUnit.MINUTE:
      return startOfMinute(date);
    default:
      return date;
  }
}

export function formatDate(date: Date, timezone = resolveTimezone()): string {
  switch (getUnitOfDate(date)) {
    case DateUnit.YEAR:
      return formatInTimeZone(date, timezone, 'yyyy');
    case DateUnit.MONTH:
      return formatInTimeZone(date, timezone, 'MMM yyyy');
    case DateUnit.WEEK:
      return formatInTimeZone(date, timezone, 'MMM d');
    case DateUnit.WEEKDAY:
    case DateUnit.DAY:
      return formatInTimeZone(date, timezone, 'MMM d');
    case DateUnit.HOUR:
      return formatInTimeZone(date, timezone, 'MMM d ha');
    default:
      return formatInTimeZone(date, timezone, 'MMM d h:mm a');
  }
}

export function formatDateWithPattern(date: Date, formatStr: string, timezone = resolveTimezone()): string {
  return formatInTimeZone(date, timezone, formatStr);
}

export function formatTime(date: Date, timezone = resolveTimezone()): string {
  if (date.getMinutes() === 0) {
    return formatInTimeZone(date, timezone, 'ha');
  }
  return formatInTimeZone(date, timezone, 'h:mm a');
}

export function formatTimeWithTitle(title: string, date: Date, timezone = resolveTimezone()): string {
  if (containsKorean(title)) {
    const dateText = formatInTimeZone(date, timezone, 'h시 mm분').replace('30분', '반');
    return `${dateText}에 ${title}`;
  }
  return `${title} at ${formatTime(date, timezone)}`;
}

export function formatDateInterval(startDate: Date, endDate: Date, timezone = resolveTimezone()): string {
  const [start, end] = [startDate, endDate].map((date) => toZonedTime(date, timezone));
  if (!isSameYear(start, end)) {
    return `${format(start, 'MMM d, yyyy h:mm a')} — ${format(end, 'MMM d, yyyy h:mm a')}`;
  }
  if (isSameMonth(start, end) && getUnitOfDate(start) === DateUnit.DAY) {
    return `${format(start, 'MMM d')} — ${format(end, 'd')}`;
  }
  if (isSameDay(start, end)) {
    return `${format(start, 'MMM d, yyyy')} ${formatTime(start)} — ${formatTime(end)}`;
  }
  return `${format(start, 'MMM d, h:mm a')} — ${format(end, 'MMM d, h:mm a')}`;
}

export function secondToDate(timestamp: number): Date {
  return new Date(timestamp * MILLISECOND);
}

export function resolveTimezone(fallback = 'UTC'): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? fallback;
}

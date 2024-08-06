import { parse } from 'chrono-node';
import { add } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { parseKoreanDate as koreanDateParser } from './korean';
import { Word } from './korean/types';
import { DateUnit, dateUnitForDuration, minDateUnit } from './lib/date';
import { containsKorean } from './lib/korean-utils';

export interface ParsedDates {
  startDate: Date;
  endDate: Date;
  unit: DateUnit;

  subject: string;
  dateText: string;
  offset: number;
}

export function parseDate(text: string, baseDate?: Date, timezone = 'Asia/Seoul'): ParsedDates | undefined {
  const zonedBaseDate = toZonedTime(baseDate ?? new Date(), timezone);

  const parsedDates = containsKorean(text)
    ? parseKoreanDate(text, zonedBaseDate, timezone)
    : parseIntlDate(text, zonedBaseDate);

  if (!parsedDates) {
    return;
  }
  return {
    ...parsedDates,
    startDate: fromZonedTime(parsedDates.startDate, timezone),
    endDate: fromZonedTime(parsedDates.endDate, timezone),
  };
}

function parseIntlDate(text: string, baseDate: Date): ParsedDates | undefined {
  const parseResult = parse(text, baseDate, { forwardDate: true });
  if (parseResult.length === 0) {
    return;
  }
  const startDate = parseResult[0].start.date();
  const endDate = parseResult[0].end
    ? parseResult[0].end.date()
    : add(startDate, { [dateUnitForDuration(minDateUnit(findUnit(startDate), DateUnit.HOUR))]: 1 }); // TODO: unit

  return {
    startDate,
    endDate,
    subject: text.replace(parseResult[0].text, '').trim(),
    unit: findUnit(startDate),
    dateText: parseResult[0].text,
    offset: parseResult[0].index,
  };
}

function parseKoreanDate(text: string, baseDate: Date, timezone?: string): ParsedDates | undefined {
  const parsed = koreanDateParser(text, baseDate, timezone);
  if (parsed.dates.length === 0) {
    return;
  }
  const startDate = parsed.dates[0];
  const endDate =
    parsed.dates[1] ?? add(startDate, { [dateUnitForDuration(minDateUnit(parsed.unit, DateUnit.HOUR))]: +1 });

  return {
    startDate,
    endDate,
    subject: parsed.subject,
    unit: parsed.unit,
    dateText: Word.join(text, parsed.dateText),
    offset: parsed.dateText[0]?.startIndex ?? 0,
  };
}

function findUnit(date: Date) {
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return DateUnit.DAY;
  }
  return DateUnit.HOUR;
}

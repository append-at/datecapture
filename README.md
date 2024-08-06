datecapture
-----------

Parses dates in natural language, especially  for korean. Basically, it's a wrapper of [chrono-node](https://npmjs.com/package/chrono-node)
except for Korean— which is hard to parse due to it's grammatical structure.

Optimized for calendar apps, as it extracts a date interval and a subject of the event from the text.

## Installation

```bash
npm i datecapture
```

## Usage

### [`parseDate`](./src/parseDate.ts)

This function takes a natural language date text in `string`, a base date in `Date` and a timezone in `string` as arguments and returns an object with the following properties:

```typescript
export interface ParsedDates {
  // The start time of the parsed date interval
  startDate: Date;

  // The end time of the parsed date interval
  endDate: Date;

  // The unit of the mentioned date
  unit: DateUnit;

  // Subject of the calendar event.
  // Use it if it's being used for calendar apps
  subject: string;

  // The date part text extracted from the original text
  dateText: string;

  // The offset of the date text in the original text
  dateOffset: number;
}
```

> Note that it returns `startDate`, `endDate`, and `unit` instead of single `Date` object. Since this module is originally designed for calendar apps, it's more convenient to have a start and end date for an event. If you want to use a single instance, just take `startDate`.

If date is not found, it returns `undefined`.

### [`parseKoreanDate`](./src/korean/index.ts)

Parses Korean date text only.

## Example

```typescript
import { parseDate } from 'datecapture';

const engDate = parseDate('meet jason at tmr 5pm');
// {
//   startDate: 2024-08-07T08:00:00.000Z,
//   endDate: 2024-08-07T09:00:00.000Z,
//   subject: 'meet jason at',
//   unit: 'hour',
//   dateText: 'tmr 5pm',
//   dateOffset: 14
// }

const base = new Date('2024-07-22T00:00:00+09:00');
const koreanDate = parseDate('다다음주 수요일 5시부터 8시까지 제이슨 미팅', base, 'Asia/Seoul');
// {
//   startDate: 2024-08-07T08:00:00.000Z,
//   endDate: 2024-08-07T11:00:00.000Z,
//   subject: '제이슨 미팅',
//   unit: 'hour',
//   dateText: '다다음주 수요일 5시부터 8시',
//   dateOffset: 0
// }

```

### [LICENSE: MIT](./LICENSE)

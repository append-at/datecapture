/* eslint-disable @typescript-eslint/no-require-imports */
import { parseKoreanDate } from '../../src';
import { log, LogLevel } from '../../src/lib/logger';
import { cases as testCases } from './testcases.json';

beforeEach(() => {
  // @ts-ignore
  global.console = require('console');
  log.options.minLevel = LogLevel.TRACE;
});

const jestConsole = console;

afterEach(() => {
  // @ts-ignore
  global.console = jestConsole;
});

describe('parseKoreanDate', () => {
  describe('E2E test cases', () => {
    for (const testCase of testCases) {
      const { text, baseDate, unit, subject, dates } = testCase;

      it(text, () => {
        const actual = parseKoreanDate(text, new Date(baseDate));

        actual.dates.forEach((date, i) => expect(date.toUTCString()).toEqual(new Date(dates[i]).toUTCString()));
        if (unit) {
          expect(actual.unit).toEqual(unit);
        }
        if (subject && actual.subject !== subject) {
          jestConsole.warn(`Warning: ${text}: Expected subject "${subject}" but got "${actual.subject}"`);
        }
      });
    }
  });
});

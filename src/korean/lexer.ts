import { DateUnit } from '../lib/date';
import {
  AM_PM_REFERENCES,
  DAY_DURATION_KEYWORDS,
  ISO_TIME_FORMAT,
  OPERATOR_WORDS,
  ORDINAL,
  ORDINAL_10x,
  RELATIVE_DAY_REFERENCES,
  RELATIVE_MONTH_REFERENCES,
  RELATIVE_WEEK_REFERENCES,
  WEEK_ORDINAL,
  WEEKDAY_REFERENCES,
} from './korean-dictionary';
import {
  DateToken,
  DurationToken,
  END_OF_SENTENCE,
  Operator,
  Operators,
  TextToken,
  Token,
  Word,
  WordType,
} from './types';

const LEXING_FUNCTIONS = [
  tryAcceptTime,
  tryAcceptIsoTime,
  tryAcceptDay,
  tryAcceptWeek,
  tryAcceptMonth,
  tryAcceptWeekday,
  tryAcceptYear,
  tryAcceptOperator,
  mustBePlaintext,
];

// TODO: lexer에서 operator를 빼야 한다. 왜냐면 예를들어 "내일부터 3일간 김효준 줘패기"에서 "3일"이 문제임. 맥락상 3일간이면 + duration이고 3일이면 date이다. 이걸 lexer에서 해석하면 안된다.

/**
 * Extract entities (e.g. date, time, location) from given words.
 * @param words A list of Word returned from tagger.
 */
export function lexer(words: Word[]): Token[] {
  const results: Token[] = [];
  let i = words.length - 1;

  while (i >= 0) {
    const nextWords = [...words.slice(0, i + 1)].reverse();

    for (const lex of LEXING_FUNCTIONS) {
      const tokens = lex(nextWords[0], nextWords.slice(1));
      if (tokens.length === 0) {
        continue;
      }

      results.push(...tokens);
      // i minus sum of words.length in tokens
      i -= tokens.reduce((sum, token) => sum + token.words.length, 0);
      break;
    }
  }
  return [...results.reverse(), new TextToken(END_OF_SENTENCE)];
}

function amPmToHour(hour: number, amPm?: string) {
  const amPmReference = AM_PM_REFERENCES[amPm ?? ''];

  // Heuristic: 1시부터 8시까지는 오전보다 오후일 확률이 높음.
  const amPmDelta = (amPmReference ?? hour < 9) ? 12 : 0;

  if (hour === 12 && amPmDelta === 12) {
    // 오후 12시 -> 12시.
    return { hour: 12, hasAmPm: true };
  }
  return { hour: hour + amPmDelta, hasAmPm: !!amPmReference };
}

function tryAcceptTime(word: Word, lookaheads: Word[]): Token[] {
  if (!['시간', '시', '분', '초', '반'].includes(word.text) || !lookaheads.length) {
    return [];
  }

  const prevWord = lookaheads[0];
  const maybePrevNum = parseNumberOrOrdinal(prevWord);

  if (!maybePrevNum) {
    if (prevWord.text === '시' && word.text === '반') {
      //  e.g. 8시 "반". 시는 그 다음번 _try_accept_time에서 처리될 꺼기 때문에 1만 Shift함.
      return [Operators.ADD, new DurationToken(30, DateUnit.MINUTE, [word])];
    }
    return [];
  }

  switch (word.text) {
    case '시간':
      if (lookaheads[1]?.isOneOf(ORDINAL_10x)) {
        // e.g. 열다섯시간
        const hours = ORDINAL_10x.indexOf(lookaheads[1].text) * 10 + maybePrevNum;
        return [new DurationToken(hours, DateUnit.HOUR, [lookaheads[1], prevWord, word])];
      }
      return [new DurationToken(maybePrevNum, DateUnit.HOUR, [prevWord, word])];

    case '시':
      if (maybePrevNum < 0 && maybePrevNum >= 24) {
        return [];
      }
      // try to parse AMPM
      const maybeAMPM = lookaheads[1];
      const { hour, hasAmPm } = amPmToHour(maybePrevNum, maybeAMPM?.text);
      return [new DateToken(hour, DateUnit.HOUR, hasAmPm ? [maybeAMPM, prevWord, word] : [prevWord, word])];

    case '분':
      return [Operators.ADD, new DurationToken(maybePrevNum, DateUnit.MINUTE, [prevWord, word])];

    case '초':
      return [Operators.ADD, new DurationToken(maybePrevNum, DateUnit.SECOND, [prevWord, word])];
  }
  return [];
}

function tryAcceptIsoTime(word: Word, lookaheads: Word[]): Token[] {
  const text = [...lookaheads.reverse(), word].map((w) => w.text).join('');

  const match = ISO_TIME_FORMAT.exec(text);
  if (!match) {
    return [];
  }
  const [amPmBefore, hour, minute, second, amPmAfter] = match.slice(1);
  const maybeHour = Number(hour);
  const maybeMinute = Number(minute);
  const maybeSecond = Number(second) || 0;
  if (isNaN(maybeHour) || isNaN(maybeMinute)) {
    return [];
  }
  const { hour: amPmHour, hasAmPm } = amPmToHour(maybeHour, amPmBefore || amPmAfter);
  const tokenCounts = [hour, minute, second].filter((x) => x).length * 2 - 1 + (hasAmPm ? 1 : 0);
  const tokens = Array.from({ length: tokenCounts }, () => word);

  return [
    second ? new DateToken(maybeSecond, DateUnit.SECOND, []) : null,
    minute ? new DateToken(maybeMinute, DateUnit.MINUTE, []) : null,
    new DateToken(amPmHour, DateUnit.HOUR, tokens),
  ].filter((x) => x) as Token[];
}

function tryAcceptDay(word: Word, lookaheads: Word[]): Token[] {
  if (word.isOneOf(RELATIVE_DAY_REFERENCES)) {
    const days = RELATIVE_DAY_REFERENCES[word.text]!;
    return [Operators.ADD, new DurationToken(days, DateUnit.DAY, [word])];
  }
  if (word.isOneOf(DAY_DURATION_KEYWORDS)) {
    const days = DAY_DURATION_KEYWORDS[word.text]!;
    return [new DurationToken(days, DateUnit.DAY, [word])];
  }
  const prevWord = lookaheads[0];
  const maybePrevNum = parseNumberOrOrdinal(prevWord);

  if (prevWord && maybePrevNum && word.text === '일') {
    return [new DateToken(maybePrevNum, DateUnit.DAY, [prevWord, word])];
  }
  return [];
}

function tryAcceptWeekday(word: Word): Token[] {
  if (!word.isOneOf(WEEKDAY_REFERENCES)) {
    return [];
  }
  const nthWeekday = WEEKDAY_REFERENCES[word.text]!;
  return [new DateToken(nthWeekday, DateUnit.WEEKDAY, [word])];
}

function tryAcceptWeek(word: Word, lookaheads: Word[]): Token[] {
  if (word.text === '일주일') {
    return [new DurationToken(1, DateUnit.WEEK, [word])];
  }
  if (word.isOneOf(RELATIVE_WEEK_REFERENCES)) {
    // e.g. 다음주
    const offset = RELATIVE_WEEK_REFERENCES[word.text]!;
    return [Operators.ADD, new DurationToken(offset, DateUnit.WEEK, [word])];
  }

  const prevWord = lookaheads[0];
  if (!prevWord || word.text !== '주') {
    return [];
  }
  if (prevWord.isOneOf(WEEK_ORDINAL)) {
    // e.g. 셋째|주
    const nthWeek = WEEK_ORDINAL[prevWord.text]!;
    return [new DateToken(nthWeek, DateUnit.WEEK, [prevWord, word])];
  }
  const maybePrevNum = parseNumberOrOrdinal(prevWord);
  if (maybePrevNum) {
    // e.g. 3주
    return [new DurationToken(maybePrevNum, DateUnit.WEEK, [prevWord, word])];
  }
  return [];
}

function tryAcceptMonth(word: Word, lookaheads: Word[]): Token[] {
  if (word.isOneOf(RELATIVE_MONTH_REFERENCES)) {
    // e.g. 저번달, 다음달
    const offset = RELATIVE_MONTH_REFERENCES[word.text]!;
    return [Operators.ADD, new DurationToken(offset, DateUnit.MONTH, [word])];
  }

  const prevWord = lookaheads[0];
  const prevNum = parseNumberOrOrdinal(prevWord);
  if (!prevNum) {
    return [];
  }

  if (word.text === '월') {
    return [new DateToken(prevNum, DateUnit.MONTH, [prevWord, word])];
  }
  if (word.text === '달') {
    return [new DurationToken(prevNum, DateUnit.MONTH, [prevWord, word])];
  }
  return [];
}

function tryAcceptOperator(word: Word, lookaheads: Word[]): Token[] {
  for (const [type, words] of Object.entries(OPERATOR_WORDS)) {
    if (words.includes(word.text)) {
      if (['add', 'subtract', 'while'].includes(type) && lookaheads.length > 0) {
        const [maybeDate] = tryAcceptDay(lookaheads[0], lookaheads.slice(1));
        if (maybeDate instanceof DateToken) {
          // e.g. 3일간 / 5일후 / 3년뒤. 여기서는 date가 아닌 duration으로 처리해야 함.
          return [new Operator(type, [word]), new DurationToken(maybeDate.value, maybeDate.unit, maybeDate.words)];
        }
      }
      return [new Operator(type, [word])];
    }
  }
  return [];
}

function tryAcceptYear(word: Word, lookaheads: Word[]): Token[] {
  const prevWord = lookaheads[0];
  if (word.text === '년' && prevWord) {
    const prevNum = Number(prevWord.text);
    if (isNaN(prevNum)) {
      return [];
    }
    return [new DateToken(prevNum, DateUnit.YEAR, [prevWord, word])];
  }
  return [];
}

function mustBePlaintext(word: Word): Token[] {
  return [new TextToken(word)];
}

function parseNumberOrOrdinal(word?: Word): number | undefined {
  if (!word) {
    return;
  }
  if (word.type === WordType.Num) {
    return Number(word.text);
  }
  const ordinalIndex = ORDINAL.indexOf(word.text);
  if (ordinalIndex >= 0) {
    return ordinalIndex;
  }
  return;
}

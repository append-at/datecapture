import { DateUnit, normalizeDateUnit, ordinalOfDateUnit } from '../lib/date';
import { log } from '../lib/logger';
import {
  AbsoluteDateReference,
  ParseKoreanDateOutput,
  DateLikeToken,
  DateToken,
  DurationToken,
  END_OF_SENTENCE,
  Operator,
  RelativeDateReference,
  TextToken,
  Token,
  Word,
} from './types';
import { DATE_ADJ, TASK_IMPLICATION_WORDS } from './korean-dictionary';
import { ParserAction, ParserState, tokenMatchesExpectation } from './types/parser-types';

const TAG = 'datekompiler';

/**
 * Extract korean entities (e.g. date, time, location) from given words.
 * @param text
 * @param tokens
 * @param baseDate
 */
export function parser(text: string, tokens: Token[], baseDate: Date = new Date()): ParseKoreanDateOutput {
  let state: ParserState = {
    baseDate,
    originalText: text,
    originalWords: tokens.flatMap((it) => it.words),
    context: [],
    dateContext: [],
    dateStack: [],
    expectation: 'text',
    stack: [],
    result: {
      unit: DateUnit.DAY,
      type: 'event',
      dateText: [],
      dates: [],
      subject: '',
    },
  };

  log.trace(TAG, 'Parser Actions History', { text, baseDate });
  tokens.forEach((token, i) => {
    log.trace(TAG, `${i}. ${String(token)}`);
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : undefined;
    const actions = accept(state, token, nextToken);
    state = actions.reduce(reducer, state);
  });

  return { ...state.result, subject: produceSubject(text, state.result.dateText) };
}

function accept(current: ParserState, token: Token, nextToken?: Token): ParserAction[] {
  const results: ParserAction[] = [];

  if (token instanceof DateToken) {
    results.push(...acceptAbsoluteDate(token));
    return results;
  }

  // check for clue
  if (token instanceof TextToken && token.word.isOneOf(TASK_IMPLICATION_WORDS)) {
    results.push({ type: 'produceClue', clue: 'task', word: token.word });
  }
  if (token instanceof Operator && token.type === 'due') {
    results.push({ type: 'produceClue', clue: 'due', word: token.words[0] });
  }

  if (token instanceof TextToken && token.word === END_OF_SENTENCE) {
    if (current.result.dates.length === 0) {
      results.push({ type: 'produceDate' });
    }
    results.push({ type: 'produceSubject' });
    return results;
  }
  if (tokenMatchesExpectation(token, current.expectation)) {
    results.push({ type: 'accept', token });
    return results;
  }

  // does not match with old expectation; let's expect a new
  if (token instanceof DurationToken) {
    // e.g. 15일 뒤 같은 케이스는 다음 Operator에서 처리해야 함
    if (token.unit == DateUnit.DAY && !(nextToken instanceof Operator && nextToken.isArithmetic)) {
      results.push(...acceptAbsoluteDate(token));
      return results;
    }
    results.push({ type: 'expect', expect: 'duration' });
    results.push({ type: 'accept', token });
    return results;
  }
  if (['date', 'duration', 'date-or-duration'].includes(current.expectation) && token instanceof Operator) {
    results.push({ type: 'expect', expect: 'date' });
    if (['starting', 'due'].includes(token.type)) {
      results.push({ type: 'produceDate' });
      return results;
    }
    results.push({ type: 'pushAdditionalDateWord', token });

    const operatorType = token.type === 'subtract' ? 'subtract' : 'add';
    const relativeDates = current.context.flatMap((it) =>
      it instanceof DateLikeToken ? [new RelativeDateReference(operatorType, it.value, it.unit)] : [],
    );
    results.push(
      ...relativeDates.map((it) => ({ type: 'push' as const, date: it, noTruncate: token.type === 'while' })),
    );
    if (token.type === 'while') {
      results.push({ type: 'produceDate' });
      return results;
    }
  }

  if (current.expectation === 'date') {
    if (token instanceof TextToken) {
      results.push({ type: 'expect', expect: 'text' });
      results.push({ type: 'accept', token });
    } else {
      // probably operator
      results.push({ type: 'expect', expect: nextToken instanceof DateToken ? 'date' : 'text' });
    }
  }
  return results;
}

function acceptAbsoluteDate(token: DateToken): ParserAction[] {
  return [
    { type: 'expect', expect: 'date' },
    { type: 'accept', token },
    { type: 'push', date: new AbsoluteDateReference(token.value, token.unit) },
  ];
}

function reducer(prev: ParserState, action: ParserAction): ParserState {
  log.trace(TAG, `  -`, { action });
  switch (action.type) {
    case 'expect':
      return {
        ...prev,
        expectation: action.expect,
        context: prev.expectation !== action.expect ? [] : prev.context,
      };
    case 'accept':
      return {
        ...prev,
        context: prev.context.concat([action.token]),
        dateContext: prev.dateContext.concat(action.token instanceof DateLikeToken ? [action.token] : []),
      };
    case 'push':
      const { truncatedStack, truncatedDateStack } = (() => {
        if (action.noTruncate) {
          return { truncatedStack: prev.stack, truncatedDateStack: prev.dateStack };
        }
        // here's the stack truncation:
        // when the existing date has smaller unit than the one's being pushed, pop it.
        const truncatedStack = prev.stack.filter(
          (it) => ordinalOfDateUnit(it.unit) < ordinalOfDateUnit(action.date.unit),
        );
        // also truncate date words. TODO: bind Word <-> DateObject directly!
        const truncatedCount = prev.stack.length - truncatedStack.length;
        const truncatedDateStack = truncatedCount > 0 ? prev.dateStack.slice(0, -truncatedCount) : prev.dateStack;

        log.trace(TAG, `    - Truncated`, { items: truncatedCount });

        return { truncatedStack, truncatedDateStack };
      })();
      return {
        ...prev,
        context: [],
        dateContext: [],
        stack: [...truncatedStack, action.date],
        dateStack: [...truncatedDateStack, ...prev.dateContext],
        result: {
          ...prev.result,
          unit: normalizeDateUnit(action.date.unit),
        },
      };
    case 'pop':
      return {
        ...prev,
        stack: prev.stack.slice(0, -1),
      };
    case 'pushAdditionalDateWord':
      if (action.token.words.length === 0) {
        return prev;
      }
      return {
        ...prev,
        dateContext: [...prev.dateContext, action.token],
      };
    case 'produceDate':
      const mergedDate = prev.stack.reduce((a, b) => b.apply(a), prev.baseDate);
      const dateWords = prev.dateStack.flatMap((it) => it.words);

      if (dateWords.length === 0) {
        return prev;
      }

      log.trace(TAG, `    - Using`, { stack: prev.stack });
      log.trace(TAG, `    - Produced`, { date: mergedDate });

      return {
        ...prev,
        result: {
          ...prev.result,
          dateText: [
            ...prev.result.dateText,
            ...dateWords.filter((it) => !prev.result.dateText.some((that) => that.equals(it))),
          ],
          dates: [...prev.result.dates, mergedDate],
        },
      };

    case 'produceSubject':
      return prev;

    case 'produceClue':
      const inferredType = action.clue === 'due' && prev.result.dates.length === 0 ? 'due' : prev.result.type;
      return {
        ...prev,
        result: { ...prev.result, type: inferredType },
      };
  }
}

// TODO: naive implementation- should refer original produceSubject implementation
function produceSubject(text: string, dateText: Word[]) {
  if (dateText.length === 0) {
    return text;
  }
  let subject = text.replace(Word.join(text, dateText), '');
  const excessAdjective = DATE_ADJ.find((it) => subject.startsWith(it));
  if (excessAdjective) {
    subject = subject.substring(excessAdjective.length);
  }
  subject = subject.trim();
  return subject;
}

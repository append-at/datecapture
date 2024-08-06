import { Word, ParseKoreanDateOutput, DateReference, DateToken, DurationToken, TextToken, Token } from '../types';

export interface ParserState {
  baseDate: Date;
  originalText: string;
  originalWords: Word[];

  expectation: Expect['expect'];
  stack: DateReference[];
  context: Token[];
  dateStack: Token[];
  dateContext: Token[];

  result: ParseKoreanDateOutput;
}

export type ParserAction =
  | Expect
  | Accept
  | Push
  | Pop
  | PushAdditionalDateWord
  | ProduceDate
  | ProduceSubject
  | ProduceClue;

export interface Expect {
  type: 'expect';
  expect: 'date' | 'duration' | 'date-or-duration' | 'text';
}

export function tokenMatchesExpectation(token: Token, expect: Expect['expect']) {
  switch (expect) {
    case 'date':
      return token instanceof DateToken;
    case 'duration':
      return token instanceof DurationToken;
    case 'date-or-duration':
      return token instanceof DateToken || token instanceof DurationToken;
    case 'text':
      return token instanceof TextToken;
  }
}

export interface Accept {
  type: 'accept';
  token: Token;
}

export interface Push {
  type: 'push';
  date: DateReference;
  noTruncate?: boolean;
}

export interface Pop {
  type: 'pop';
}

export interface PushAdditionalDateWord {
  type: 'pushAdditionalDateWord';
  token: Token;
}

export interface ProduceDate {
  type: 'produceDate';
}

export interface ProduceSubject {
  type: 'produceSubject';
}

export interface ProduceClue {
  type: 'produceClue';
  clue: 'due' | 'task';
  word: Word;
}

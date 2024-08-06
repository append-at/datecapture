import { DateUnit, dateUnitForDuration } from '../../lib/date';
import { Word } from './word';

export interface Token {
  words: Word[];
  pretty(): string;
}

export abstract class DateLikeToken implements Token {
  value!: number;
  unit!: DateUnit;
  words!: Word[];

  abstract pretty(): string;
}

export class DateToken extends DateLikeToken {
  constructor(
    public value: number,
    public unit: DateUnit,
    public words: Word[],
  ) {
    super();
  }

  toString(): string {
    return `DateToken(${this.value} ${dateUnitForDuration(this.unit)}, [${this.words.join(',')}])`;
  }

  pretty(): string {
    // TODO: colorize yellow
    return `[${this.unit} → ${this.value}]`;
  }
}

export class DurationToken extends DateLikeToken {
  constructor(
    public value: number,
    public unit: DateUnit,
    public words: Word[],
  ) {
    super();
  }

  toString(): string {
    return `DurationToken(${this.value} ${dateUnitForDuration(this.unit)}, [${this.words.join(',')}])`;
  }

  pretty(): string {
    // TODO: colorize yellow
    return `[${this.unit} → ${this.value}]`;
  }
}

export class Operator implements Token {
  constructor(
    public type: string,
    public words: Word[] = [],
  ) {}

  toString(): string {
    return `Operator(${this.type}, [${this.words.join(',')}])`;
  }

  pretty(): string {
    const prettySymbols: { [k: string]: string } = {
      add: '[+]',
      subtract: '[-]',
      starting: '[↦]',
      due: '[⌚]︎',
      while: '[~]',
    };
    const text = prettySymbols[this.type] || `[${this.type}]`;
    return text.replace(']', `${this.words.map((w) => ' ' + w.text).join('')}]`);
  }

  get isArithmetic(): boolean {
    return ['add', 'subtract', 'while'].includes(this.type);
  }
}

export class TextToken implements Token {
  words: Word[];

  constructor(word: Word) {
    this.words = [word];
  }

  get word(): Word {
    return this.words[0];
  }

  toString(): string {
    return `TextToken(${this.word})`;
  }

  pretty(): string {
    return this.word.text;
  }
}

export const Operators = {
  ADD: new Operator('add'),
  SUBTRACT: new Operator('subtract'),
  STARTING: new Operator('starting'),
  DUE: new Operator('due'),
  EVERY: new Operator('every'),
  WHILE: new Operator('while'),
};

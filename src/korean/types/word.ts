export enum WordType {
  Word = 'word',
  Num = 'num',
  Etc = 'etc',
}

export class Word {
  constructor(
    public text: string,
    public type: WordType = WordType.Word,
    public startIndex = 0,
    public endIndex = startIndex + text.length,
  ) {}

  static join(fullText: string, words: Word[]): string {
    if (words.length === 0) {
      return '';
    }
    return fullText.slice(words[0].startIndex, words.slice(-1)[0].endIndex);
  }

  equals(other: string | [string, string] | Word) {
    if (typeof other === 'string') {
      return this.text === other;
    }
    if (other instanceof Array && other.length === 2) {
      const [text, type] = other;
      return this.text === text && this.type.toString() === type;
    }
    return (
      this.text === other.text &&
      this.type === other.type &&
      this.startIndex === other.startIndex &&
      this.endIndex === other.endIndex
    );
  }

  isOneOf(texts: { [k: string]: any } | string[]) {
    return (texts instanceof Array ? texts : Object.keys(texts)).includes(this.text);
  }

  toString(): string {
    return `${this.type === WordType.Num ? '<N>' : ''}${this.text}`;
  }
}

export const END_OF_SENTENCE = new Word('<eos>');
export const BEGINNING_OF_SENTENCE = new Word('<bos>');

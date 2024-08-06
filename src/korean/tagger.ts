import { KOREAN_KNOWN_WORDS } from './korean-dictionary';
import { Word, WordType } from './types';

interface TaggerState {
  type: WordType;
  word: string;
  startIndex: number;
}

/** Tags splits text into words.  */
export function tag(text: string): Word[] {
  const words: Word[] = [];
  let current = cleanState();

  for (let i = 0; i < text.length; i++) {
    let nextType = WordType.Word;
    if (text[i] >= '0' && text[i] <= '9') {
      nextType = WordType.Num;
    }
    if (text[i] === ' ') {
      nextType = WordType.Etc;
    }
    if (!current.word) {
      current.type = nextType;
    } else if (current.type !== nextType) {
      pushState(current, words);
      current = {
        ...cleanState(i),
        type: nextType,
      };
    }
    current = { ...current, word: current.word + text[i] };
    for (const knownWord of KOREAN_KNOWN_WORDS) {
      if (text.startsWith(knownWord, i)) {
        // revert and push (mostly empty)
        pushState({ ...current, word: current.word.slice(0, -1) }, words);

        words.push(new Word(knownWord, WordType.Word, i));
        i += knownWord.length - 1;
        current = cleanState(i + 1);
        break;
      }
    }
  }
  if (current.word) {
    words.push(new Word(current.word, current.type, current.startIndex));
  }
  return words;
}

function cleanState(index = 0): TaggerState {
  return {
    type: WordType.Etc,
    word: '',
    startIndex: index,
  };
}

function pushState(state: TaggerState, words: Word[]) {
  if (state.type !== WordType.Etc && state.word) {
    words.push(new Word(state.word, state.type, state.startIndex));
  }
}

import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { lexer } from './lexer';
import { parser } from './parser';
import { tag } from './tagger';
import { ParseKoreanDateOutput } from './types';

export function parseKoreanDate(text: string, baseDate = new Date(), timezone = 'UTC'): ParseKoreanDateOutput {
  const words = tag(text);
  const tokens = lexer(words);

  // log.trace('datekompiler', 'parsed', {
  //   words: words.map((it) => `[${it.toString()}]`).join(','),
  //   tokens: tokens.map((it) => it.pretty()).join(','),
  // });

  // JS는 Date를 무조건 Local Time 기준으로 취급하기 때문에,
  // 강제로 Local Time으로 오프셋을 변환해줬다가 다시 되돌려야 타임존을 적용할 수 있다.
  const baseDateZoned = toZonedTime(baseDate, timezone);
  const parsed = parser(text, tokens, baseDateZoned);
  return {
    ...parsed,
    dates: parsed.dates.map((zonedTime) => fromZonedTime(zonedTime, timezone)),
  };
}

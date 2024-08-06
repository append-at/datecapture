type OffsetDict = Record<string, number>;

export const RELATIVE_DAY_REFERENCES: OffsetDict = {
  오늘: 0,
  금일: 0,
  내일: +1,
  익일: +1,
  낼: +1,
  다음날: +1,
  담날: +1,
  모레: +2,
  다다음날: +2,
  어제: -1,
  어저께: -1,
  작일: -1,
  그제: -2,
};

export const AM_PM_REFERENCES: OffsetDict = {
  낮: 12,
  // '밤': 12,
  새벽: 0,
  아침: 0,
  // '점심': 12,
  저녁: 12,
  오전: 0,
  오후: 12,
  이른: 0,
  늦은: 12,
  AM: 0,
  PM: 12,
};

const amPm = Object.keys(AM_PM_REFERENCES).join('|');

export const ISO_TIME_FORMAT = new RegExp(`(${amPm})?\\s*(\\d{1,2})(?::(\\d{2}))?(?::(\\d{2}))?\\s*(${amPm})?$`, 'gi');

const RELATIVE_KEYWORDS: OffsetDict = {
  다다다음: +3,
  다다음: +2,
  다담: +2,
  다음: +1,
  담: +1,
  이번: 0,
  저번: -1,
  지난: -1,
  저저번: -2,
  지지난: -2,
  저저저번: -3,
  지지지난: -3,
};

export const RELATIVE_WEEK_REFERENCES: OffsetDict = Object.fromEntries(
  Object.entries(RELATIVE_KEYWORDS)
    .map(([k, v]) => [`${k}주`, v])
    .concat([
      ['금주', 0],
      ['차주', +1],
    ]),
);
export const RELATIVE_MONTH_REFERENCES: OffsetDict = Object.fromEntries(
  Object.entries(RELATIVE_KEYWORDS).map(([k, v]) => [`${k}달`, v]),
);

export const WEEKDAY_REFERENCES: OffsetDict = {
  월요일: 1,
  월욜: 1,
  '(월)': 1,
  화요일: 2,
  화욜: 2,
  '(화)': 2,
  수요일: 3,
  수욜: 3,
  '(수)': 3,
  목요일: 4,
  목욜: 4,
  '(목)': 4,
  금요일: 5,
  금욜: 5,
  '(금)': 5,
  토요일: 6,
  토욜: 6,
  '(토)': 6,
  일요일: 7,
  일욜: 7,
  '(일)': 7,
};

export const ORDINAL = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
export const ORDINAL_10x = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔', '백'];
export const WEEK_ORDINAL: OffsetDict = { 첫째: 1, 둘째: 2, 셋째: 3, 넷째: 4, 다섯째: 5 };

export const DAY_DURATION_KEYWORDS: OffsetDict = {
  하루: 1,
  이틀: 2,
  사흘: 3,
  나흘: 4,
  닷새: 5,
  엿새: 6,
  이레: 7,
  여드레: 8,
  아흐레: 9,
  열흘: 10,
  보름: 15,
};

export const OPERATOR_WORDS = {
  add: ['후', '뒤', '뒤에'],
  subtract: ['전'],
  while: ['동안', '간'],
  starting: ['부터'],
  due: ['까지'],
};

// 이게 들어있으면 태스크일 확률이 높아짐.
export const TASK_IMPLICATION_WORDS = ['하기'];
export const DUE_IMPLICATION_WORDS = ['까지'];
export const EVENT_IMPLICATION_WORDS = ['부터'];
export const REPEAT_IMPLICATION_WORDS = ['매주', '매월', '매일', '마다'];

export const DATE_ADJ = ['에', '에서', '부터', '까지'];

export const KOREAN_KNOWN_WORDS: string[] = [
  ...Object.keys(RELATIVE_DAY_REFERENCES),
  ...Object.keys(AM_PM_REFERENCES),
  ...Object.keys(WEEKDAY_REFERENCES),
  ...Object.keys(DAY_DURATION_KEYWORDS),
  ...Object.values(OPERATOR_WORDS).flat(),
  ...Object.keys(RELATIVE_WEEK_REFERENCES),
  ...Object.keys(RELATIVE_MONTH_REFERENCES),
  ...TASK_IMPLICATION_WORDS,
  ...DUE_IMPLICATION_WORDS,
  ...EVENT_IMPLICATION_WORDS,
  ...REPEAT_IMPLICATION_WORDS,
  ...ORDINAL,
  ...ORDINAL_10x,
  ...Object.keys(WEEK_ORDINAL),
  '일주일',
  '오전',
  '오후',
  '밤',
  '낮',
  '새벽',
  '아침',
  '점심',
  '저녁',
  '시간',
  '시',
  '분',
  '초',
  '주',
  '달',
  '년',
  '월',
  '일',
  '반',
  '요일',
].filter((word) => word.length >= 1);

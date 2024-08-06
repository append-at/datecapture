const JOSA_FORMATTER = {
  '을/를': (text: string) => (hasTermEomi(text) ? '을' : '를'),
  '은/는': (text: string) => (hasTermEomi(text) ? '은' : '는'),
  '이/가': (text: string) => (hasTermEomi(text) ? '이' : '가'),
  '와/과': (text: string) => (hasTermEomi(text) ? '과' : '와'),
  '으로/로': (text: string) => (hasTermEomi(text) ? '으로' : '로'),
};

//마지막 글자가 받침을 가지는지 확인
export const hasTermEomi = (text: string) => (text.charCodeAt(text.length - 1) - 0xac00) % 28 > 0;

export const isKorean = (text: string) => /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text.slice(-1));

/**
 * 한글 텍스트에 적절한 조사를 붙여서 반환한다.
 * @example text=사인회, format=을/를 -> 사인회를, text=춘식, format=이/가 -> 춘식이
 *
 * @param text 한글 텍스트. 영어일 시 판별 불가하므로 동시표기 (e.g. english 을(를)) 한다.
 * @param format 을/를, 이/가 등
 */
export function withHangulJosa(text: string, format: keyof typeof JOSA_FORMATTER): string {
  if (!isKorean(text)) return `${text} ${format.replace('/', '(')})`; // english 을(를)
  return text + JOSA_FORMATTER[format](text);
}

export function containsKorean(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (
      (charCode >= 0xac00 && charCode <= 0xd7af) ||
      (charCode >= 0x1100 && charCode <= 0x11ff) ||
      (charCode >= 0x3130 && charCode <= 0x318f)
    ) {
      return true;
    }
  }
  return false;
}

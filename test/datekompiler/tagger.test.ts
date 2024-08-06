import { tag } from '../../src/korean/tagger';

describe('tagger', () => {
  describe('Edge Cases', () => {
    it('should tag 박진서는 천하제일 correctly', async () => {
      const words = tag('박진서는 천하제일');
      expect(words.map((it) => it.text).join(',')).toEqual('박진서는,천하제,일');
    });

    it('should tag 이번주 7시 correctly', async () => {
      const words = tag('이번주 7시');
      expect(words.map((it) => it.toString()).join(',')).toEqual('이번주,<N>7,시');
    });
  });
});

import { DateUnit } from '../../lib/date';
import { Word } from './word';

export interface ParseKoreanDateOutput {
  type: 'event' | 'due';
  unit: DateUnit;
  dates: Date[];
  dateText: Word[];
  subject: string;
}

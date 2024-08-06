import { add, startOfMonth, addWeeks, Duration, set, startOfISOWeek, sub } from 'date-fns';
import { DateUnit, dateUnitForDuration, dateUnitForSet, truncateDate } from '../../lib/date';
import { log } from '../../lib/logger';

export interface DateReference {
  value: number;
  unit: DateUnit;

  apply(baseDate: Date): Date;
}

export class AbsoluteDateReference implements DateReference {
  constructor(
    public value: number,
    public unit: DateUnit,
  ) {}

  apply(baseDate: Date): Date {
    if (this.unit === DateUnit.WEEKDAY) {
      //  using isoweekday (Mon:1 ~ Sun:7)
      let appliedDate = add(startOfISOWeek(baseDate), { days: this.value - 1 });
      if (+appliedDate < +baseDate) {
        // 레퍼런스 시점이 과거 시점이면 다음주로 넘긴다.
        // e.g. 오늘이 목요일인데 그냥 "월요일"이라고만 했을 경우, 다음주 월요일일 가능성이 높음
        appliedDate = add(appliedDate, { weeks: 1 });
      }
      return appliedDate;
    }
    if (this.unit === DateUnit.WEEK) {
      return startOfISOWeek(addWeeks(startOfMonth(baseDate), this.value - 1));
    }
    const applied = set(truncateDate(baseDate, this.unit), {
      [dateUnitForSet(this.unit)]: this.unit === DateUnit.MONTH ? this.value - 1 : this.value,
    });
    log.trace('datekompiler', `      - apply ${this.toString()} to`, {
      before: baseDate,
      applied,
      beforeDay: baseDate.getDate(),
      option: { [dateUnitForSet(this.unit)]: this.value },
    });
    return applied;
  }

  toString(): string {
    return `Absolute(${this.value}th ${this.unit})`;
  }
}

export class RelativeDateReference implements DateReference {
  constructor(
    public mode: 'add' | 'subtract',
    public value: number,
    public unit: DateUnit,
  ) {}

  apply(baseDate: Date): Date {
    const date = this.mode === 'add' ? add(baseDate, this.duration) : sub(baseDate, this.duration);
    const applied = truncateDate(date, this.unit);
    log.trace('datekompiler', `      - apply ${this.toString()} to`, { before: baseDate, applied });
    return applied;
  }

  get duration(): Duration {
    return { [dateUnitForDuration(this.unit)]: this.value };
  }

  toString(): string {
    return `Relative(${this.mode} ${this.value} ${dateUnitForDuration(this.unit)})`;
  }
}

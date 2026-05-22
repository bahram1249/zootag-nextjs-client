declare module 'persian-date' {
  interface PersianDateStatic {
    new (): PersianDateInstance;
    new (date: Date | number | string | number[]): PersianDateInstance;
    (): PersianDateInstance;
    (date: Date | number | string | number[]): PersianDateInstance;
  }

  interface PersianDateInstance {
    year(): number;
    month(): number;
    date(): number;
    day(): number;
    daysInMonth(): number;
    format(pattern: string): string;
    toDate(): Date;
    toCalendar(calendar: 'gregorian' | 'persian'): PersianDateInstance;
    startOf(unit: string): PersianDateInstance;
    endOf(unit: string): PersianDateInstance;
    add(duration: number, unit: string): PersianDateInstance;
    subtract(duration: number, unit: string): PersianDateInstance;
    isPersianDate: boolean;
  }

  declare const persianDate: PersianDateStatic;
  export default persianDate;
}

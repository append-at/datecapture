/**
 * Unlike [Object.assign] does override `null` and `undefined` values,
 * this method doesn't override nullish values.
 *x
 * @param target (e.g. a default option object)
 * @param sources (e.g. an user-given options)
 */
export const assignWithoutNull = <T extends object, U>(target: T, ...sources: U[]): T & U =>
  Object.assign(target, ...sources.filter((src) => typeof src === 'object').map((src) => clearNullish(src as any)));

type NullToUndefined<T> = T extends null ? undefined : T;

type NullishCleared<T> = {
  [P in keyof T]: NullToUndefined<T[P]>;
};

export const clearNullish = <T extends object>(o: T): NullishCleared<T> =>
  // @ts-ignore
  Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && !Number.isNaN(v))) as T;

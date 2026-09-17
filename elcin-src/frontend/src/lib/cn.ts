import clsx, { type ClassValue } from 'clsx';

/** Koşullu sınıf birleştirici. */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}

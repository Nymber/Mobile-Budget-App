import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names or class values into a single string using clsx,
 * and merges Tailwind CSS classes intelligently using tailwind-merge.
 * 
 * @param inputs One or more class values to combine
 * @returns A string of merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

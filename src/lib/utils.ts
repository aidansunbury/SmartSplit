import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// function that takes a feed createdAt timestamp and returns a formatted date
export function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// function that takes a feed createdAt timestamp and returns a formatted date
export function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

// January 3rd
export function getFormattedDate() {
  const today = new Date();

  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(today);

  const day = today.getDate();

  // Function to determine the ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return "th"; // Special case for 11th to 20th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const ordinalSuffix = getOrdinalSuffix(day);

  return `${month} ${day}${ordinalSuffix}`;
}

export function createShares(total: number, numPeople: number): number[] {
  const baseShare = Math.floor(total / numPeople); // Round to 2 decimals
  const shares = Array(numPeople).fill(baseShare);

  const currentTotal = shares.reduce((sum, share) => sum + share, 0);
  const difference = total - currentTotal; // Convert to cents to avoid floating point issues

  // Distribute the rounding difference fairly
  for (let i = 0; i < difference; i++) {
    shares[i % numPeople] += 1;
  }

  return shares;
}

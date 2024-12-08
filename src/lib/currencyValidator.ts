import { z } from "zod";

// Transform a string into a number of cents
export const currencyValidator = z.string().transform((val) => {
  // Remove any non-numeric characters except decimal point
  const cleaned = val.replace(/[^\d.]/g, "");

  // Convert to number, fix to 2 decimal places, and multiply by 100
  const cents = Math.round(Number.parseFloat(cleaned) * 100);

  // Handle NaN case
  if (Number.isNaN(cents)) {
    throw new Error("Invalid currency format");
  }

  return cents;
});

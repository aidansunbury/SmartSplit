import { z } from "zod";

// Transform a string into a number of cents
export const currencyValidator = z.string().transform((val) => {
  // TODO if a negative number is inputted, this just converts it to a positive value. It would make more sense to tell the user that negative values are not allowed, which makes it clear that the form accounts for inputting negative values. Currently, it is not clear to the user if the form is just failing silently or what the intended behavior is.

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

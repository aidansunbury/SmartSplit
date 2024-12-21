import { z } from "zod";

// Transform a date into seconds since epoch
export const dateValidator = z
  .date({ message: "Date is required" })
  .transform((date) => {
    return Math.floor(date.getTime() / 1000);
  });

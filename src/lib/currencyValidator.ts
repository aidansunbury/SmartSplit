import { z } from "zod";

// Transform a string into a number of cents and ensure it is positive
export const currencyValidator = z.string().transform((val, ctx) => {
  const cents = Math.round(Number.parseFloat(val) * 100);

  if (cents <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Value must be positive",
    });
    return z.NEVER;
  }

  return cents;
});

// Given a currency amount in cents, return a string formatted as dollars and cents.
export const formatCurrency = (amount: number, abs = true) => {
  let formattedAmount = amount;
  if (abs) {
    formattedAmount = Math.abs(amount);
  }
  const dollars = Math.floor(formattedAmount / 100);
  const cents = formattedAmount % 100;
  return `$${dollars}.${cents.toString().padStart(2, "0")}`;
};

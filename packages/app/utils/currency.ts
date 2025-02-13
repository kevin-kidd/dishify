const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "CA$",
  GBP: "£",
  EUR: "€",
  MXN: "MX$",
  PLN: "zł",
  AUD: "A$",
  BRL: "R$",
  SGD: "S$",
  AED: "د.إ",
  SAR: "﷼",
  INR: "₹",
  TRY: "₺",
  JPY: "¥",
  EGP: "E£",
  ZAR: "R",
};

export function formatPrice(price: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const amount = (price / 100).toFixed(2);

  // Handle special cases for certain currencies
  switch (currency) {
    case "JPY":
      return `${symbol}${Math.round(price / 100)}`; // JPY doesn't use decimal places
    case "AED":
    case "SAR":
      return `${amount} ${symbol}`; // Arabic currencies typically show the symbol after the amount
    default:
      return `${symbol}${amount}`;
  }
}

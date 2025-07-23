module.exports = (number) =>
  new Intl.NumberFormat(global.locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);

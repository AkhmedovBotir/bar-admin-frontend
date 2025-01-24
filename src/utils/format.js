export const formatNumber = (number) => {
  return new Intl.NumberFormat('uz-UZ').format(number);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

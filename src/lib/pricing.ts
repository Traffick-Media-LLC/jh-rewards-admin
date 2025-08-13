export const formatNumber = (n: number): string => n.toLocaleString();

export const formatPoints = (points: number): string => {
  return `${formatNumber(points)} Points`;
};

export const formatPriceWithSale = (price: number, salePrice?: number | null): { display: string; originalPrice?: string; salePrice?: string } => {
  if (salePrice && salePrice < price) {
    return {
      display: `${formatPoints(salePrice)}`,
      originalPrice: `${formatPoints(price)}`,
      salePrice: `${formatPoints(salePrice)}`
    };
  }
  return { display: formatPoints(price) };
};

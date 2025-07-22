export const formatToThb = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''; // Or return a placeholder like '฿0.00' or 'N/A'
  }
  return value.toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
  });
};

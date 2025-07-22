export const calculateTotalDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  // Set to UTC to avoid timezone issues in calculation
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffInMs = utcEnd - utcStart;
  if (diffInMs < 0) return 0; // End date is before start date

  const days = diffInMs / (1000 * 60 * 60 * 24);
  return Math.round(days) + 1; // Add 1 to make the count inclusive
};

export const formatDateToThai = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Invalid date provided to formatDateToThai:', error);
    return 'Invalid Date';
  }
};

export const getCurrentBangkokTimestampForDB = (): string => {
  const now = new Date();
  // Using sv-SE locale gives a nice YYYY-MM-DD HH:mm:ss format
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return formatter.format(now);
};

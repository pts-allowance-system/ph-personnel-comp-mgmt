

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

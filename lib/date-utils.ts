export const formatDateToBangkokTime = (
  dateInput: string | Date | number,
  options?: Intl.DateTimeFormatOptions
) => {
  const date = new Date(dateInput);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Bangkok', // GMT+7
    month: 'short',
    day: '2-digit',
  };

  // if specific options for hour, minute, second are passed, include them
  const timeOptions: Intl.DateTimeFormatOptions = {};
  if (options?.hour) timeOptions.hour = options.hour;
  if (options?.minute) timeOptions.minute = options.minute;
  if (options?.second) timeOptions.second = options.second;
  if (options?.hour12 !== undefined) timeOptions.hour12 = options.hour12;

  const mergedOptions = { ...defaultOptions, ...options, ...timeOptions };

  // Ensure year is included if specified, e.g., for 'MMM dd, yyyy'
  // If no year option is provided, it defaults to undefined (no year in output for short dates)
  if (!mergedOptions.year && options?.year) {
    mergedOptions.year = options.year;
  } else if (!options?.year && !options?.hour) {
    // If no year and no time, explicitly remove year for short date format like 'MMM dd'
    delete mergedOptions.year;
  }
  
  return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
};

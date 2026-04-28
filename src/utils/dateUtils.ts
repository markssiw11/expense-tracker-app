export const getMonthName = (
  monthIndex: number,
  t: (key: string) => string
): string => {
  const monthKeys = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  return t(`months.${monthKeys[monthIndex]}`);
};

export const formatMonthYear = (
  monthStr: string,
  t: (key: string) => string
) => {
  const [year, month] = monthStr.split("-");
  return {
    month: getMonthName(parseInt(month) - 1, t),
    year: year,
  };
};

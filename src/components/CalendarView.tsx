import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Colors } from "../../constants/theme";
import { MarkedDates } from "../types/event.types";
import { setCalendarLocale } from "../utils/calendarLocale";

interface CalendarViewProps {
  markedDates: MarkedDates;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onMonthChange?: (month: { month: number; year: number }) => void;
}

export function CalendarView({
  markedDates,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: CalendarViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { i18n } = useTranslation();

  // Keep the calendar's month/day names in sync with the app language.
  setCalendarLocale(i18n.language);

  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    onMonthChange?.({ month: month.month, year: month.year });
  };

  return (
    <Calendar
      key={i18n.language}
      current={selectedDate}
      markedDates={markedDates}
      onDayPress={handleDayPress}
      onMonthChange={handleMonthChange}
      enableSwipeMonths={true}
      theme={{
        backgroundColor: colors.background,
        calendarBackground: colors.background,
        textSectionTitleColor: colors.text,
        selectedDayBackgroundColor: colors.tint,
        selectedDayTextColor: "#ffffff",
        todayTextColor: colors.tint,
        dayTextColor: colors.text,
        textDisabledColor: colors.icon,
        dotColor: colors.tint,
        selectedDotColor: "#ffffff",
        arrowColor: colors.tint,
        monthTextColor: colors.text,
        indicatorColor: colors.tint,
        textDayFontWeight: "400",
        textMonthFontWeight: "bold",
        textDayHeaderFontWeight: "600",
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 14,
      }}
    />
  );
}

import React from "react";
import { useColorScheme } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { MarkedDates } from "../types/event.types";
import { Colors } from "../../constants/theme";

interface CalendarViewProps {
  markedDates: MarkedDates;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onMonthChange?: (month: { month: number; year: number }) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  markedDates,
  selectedDate,
  onDateSelect,
  onMonthChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    onMonthChange?.({ month: month.month, year: month.year });
  };

  return (
    <Calendar
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
};

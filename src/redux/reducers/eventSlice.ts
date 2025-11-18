import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { Event, EventCategory } from "../../types";
import { RootState } from "../store";
import eventStorage from "../../services/storage/eventStorage";

interface EventState {
  events: Event[];
  selectedDate: string | null;
  viewMode: "calendar" | "list";
  selectedCategory: EventCategory | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  selectedDate: null,
  viewMode: "calendar",
  selectedCategory: null,
  loading: false,
  error: null,
};

// Async thunks
export const loadEvents = createAsyncThunk(
  "events/loadEvents",
  async (_, { rejectWithValue }) => {
    try {
      const events = await eventStorage.loadEvents();
      return events;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load events"
      );
    }
  }
);

export const addEvent = createAsyncThunk(
  "events/addEvent",
  async (event: Event, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const updatedEvents = [...state.events.events, event];
      await eventStorage.saveEvents(updatedEvents);
      return event;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add event"
      );
    }
  }
);

export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async (
    { id, data }: { id: string; data: Partial<Event> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const existingEvent = state.events.events.find((e: Event) => e.id === id);

      if (!existingEvent) {
        return rejectWithValue("Event not found");
      }

      const updatedEvent: Event = {
        ...existingEvent,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const updatedEvents = state.events.events.map((e: Event) =>
        e.id === id ? updatedEvent : e
      );
      await eventStorage.saveEvents(updatedEvents);

      return { id, data: updatedEvent };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update event"
      );
    }
  }
);

export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const updatedEvents = state.events.events.filter(
        (e: Event) => e.id !== id
      );
      await eventStorage.saveEvents(updatedEvents);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete event"
      );
    }
  }
);

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    setViewMode: (state, action: PayloadAction<"calendar" | "list">) => {
      state.viewMode = action.payload;
    },
    setSelectedCategory: (
      state,
      action: PayloadAction<EventCategory | null>
    ) => {
      state.selectedCategory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load events
    builder.addCase(loadEvents.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadEvents.fulfilled, (state, action) => {
      state.loading = false;
      state.events = action.payload;
    });
    builder.addCase(loadEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add event
    builder.addCase(addEvent.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addEvent.fulfilled, (state, action) => {
      state.loading = false;
      state.events.push(action.payload);
    });
    builder.addCase(addEvent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update event
    builder.addCase(updateEvent.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateEvent.fulfilled, (state, action) => {
      state.loading = false;
      const { id, data } = action.payload;
      const index = state.events.findIndex((e) => e.id === id);
      if (index !== -1) {
        state.events[index] = data as Event;
      }
    });
    builder.addCase(updateEvent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete event
    builder.addCase(deleteEvent.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteEvent.fulfilled, (state, action) => {
      state.loading = false;
      state.events = state.events.filter((e) => e.id !== action.payload);
    });
    builder.addCase(deleteEvent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setSelectedDate, setViewMode, setSelectedCategory, clearError } =
  eventSlice.actions;
export default eventSlice.reducer;

// Selectors
export const selectAllEvents = (state: RootState) => state.events.events;
export const selectSelectedDate = (state: RootState) =>
  state.events.selectedDate;
export const selectViewMode = (state: RootState) => state.events.viewMode;
export const selectSelectedCategory = (state: RootState) =>
  state.events.selectedCategory;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectEventsError = (state: RootState) => state.events.error;

// Memoized selectors
export const selectFilteredEvents = createSelector(
  [selectAllEvents, selectSelectedCategory],
  (events, selectedCategory) => {
    if (!selectedCategory) {
      return events;
    }
    return events.filter((event: Event) => event.category === selectedCategory);
  }
);

export const selectEventsByDate = createSelector(
  [selectFilteredEvents, (_state: RootState, date: string) => date],
  (events, date) => {
    return events.filter((event: Event) => event.date === date);
  }
);

export const selectTodayEvents = createSelector(
  [selectFilteredEvents],
  (events) => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((event: Event) => event.date === today)
      .sort((a: Event, b: Event) => a.time.localeCompare(b.time));
  }
);

export const selectUpcomingEvents = createSelector(
  [selectFilteredEvents],
  (events) => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((event: Event) => event.date >= today)
      .sort((a: Event, b: Event) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }
);

export const selectEventsByCategory = createSelector(
  [selectAllEvents, (_state: RootState, category: EventCategory) => category],
  (events, category) => {
    return events.filter((event: Event) => event.category === category);
  }
);

export const selectMarkedDates = createSelector(
  [selectFilteredEvents, selectSelectedDate],
  (events, selectedDate) => {
    const markedDates: {
      [date: string]: {
        marked: boolean;
        dotColor: string;
        selected?: boolean;
        selectedColor?: string;
      };
    } = {};

    // Category colors
    const categoryColors: Record<EventCategory, string> = {
      Work: "#3B82F6",
      Personal: "#A855F7",
      Health: "#10B981",
      Family: "#F59E0B",
      Other: "#6B7280",
    };

    // Mark dates with events
    events.forEach((event: Event) => {
      if (!markedDates[event.date]) {
        markedDates[event.date] = {
          marked: true,
          dotColor: categoryColors[event.category],
        };
      }
    });

    // Mark selected date
    if (selectedDate) {
      if (markedDates[selectedDate]) {
        markedDates[selectedDate].selected = true;
        markedDates[selectedDate].selectedColor = "#007AFF";
      } else {
        markedDates[selectedDate] = {
          marked: false,
          dotColor: "",
          selected: true,
          selectedColor: "#007AFF",
        };
      }
    }

    return markedDates;
  }
);

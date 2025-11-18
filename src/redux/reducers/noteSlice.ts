import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Note, NoteCategory } from "../../types";
import noteStorage from "../../services/storage/noteStorage";
import { NoteSortBy } from "../../utils/noteUtils";

interface NoteState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    categories: NoteCategory[];
    tags: string[];
  };
  sortBy: NoteSortBy;
}

const initialState: NoteState = {
  notes: [],
  loading: false,
  error: null,
  searchQuery: "",
  filters: {
    categories: [],
    tags: [],
  },
  sortBy: "date",
};

// Async thunks
export const loadNotes = createAsyncThunk(
  "notes/loadNotes",
  async (_, { rejectWithValue }) => {
    try {
      const notes = await noteStorage.loadNotes();
      return notes;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load notes"
      );
    }
  }
);

export const addNote = createAsyncThunk(
  "notes/addNote",
  async (note: Note, { rejectWithValue }) => {
    try {
      await noteStorage.addNote(note);
      return note;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add note"
      );
    }
  }
);

export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async (
    { id, data }: { id: string; data: Partial<Note> },
    { rejectWithValue }
  ) => {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await noteStorage.updateNote(id, updatedData);
      return { id, data: updatedData };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update note"
      );
    }
  }
);

export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (id: string, { rejectWithValue }) => {
    try {
      await noteStorage.deleteNote(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    }
  }
);

const noteSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setNoteFilters: (
      state,
      action: PayloadAction<{ categories: NoteCategory[]; tags: string[] }>
    ) => {
      state.filters = action.payload;
    },
    setSortBy: (state, action: PayloadAction<NoteSortBy>) => {
      state.sortBy = action.payload;
    },
    togglePinNote: (state, action: PayloadAction<string>) => {
      const note = state.notes.find((n) => n.id === action.payload);
      if (note) {
        note.isPinned = !note.isPinned;
        note.updatedAt = new Date().toISOString();
        // Update in storage
        noteStorage.updateNote(note.id, {
          isPinned: note.isPinned,
          updatedAt: note.updatedAt,
        });
      }
    },
    clearNoteError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load notes
    builder.addCase(loadNotes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadNotes.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
    });
    builder.addCase(loadNotes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add note
    builder.addCase(addNote.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addNote.fulfilled, (state, action) => {
      state.loading = false;
      state.notes.push(action.payload);
    });
    builder.addCase(addNote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update note
    builder.addCase(updateNote.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateNote.fulfilled, (state, action) => {
      state.loading = false;
      const { id, data } = action.payload;
      const index = state.notes.findIndex((n) => n.id === id);
      if (index !== -1) {
        state.notes[index] = {
          ...state.notes[index],
          ...data,
        };
      }
    });
    builder.addCase(updateNote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete note
    builder.addCase(deleteNote.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteNote.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = state.notes.filter((n) => n.id !== action.payload);
    });
    builder.addCase(deleteNote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setSearchQuery,
  setNoteFilters,
  setSortBy,
  togglePinNote,
  clearNoteError,
} = noteSlice.actions;
export default noteSlice.reducer;

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "@family_members";

export interface FamilyMember {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FamilyState {
  members: FamilyMember[];
  loading: boolean;
}

// Default members
// Names are localized at render time via getFamilyMemberName (keyed by id);
// the stored name here is only a fallback.
const DEFAULT_MEMBERS: FamilyMember[] = [
  { id: "wife", name: "Wife", icon: "woman", color: "#FF6B9D" },
  { id: "husband", name: "Husband", icon: "man", color: "#4A90E2" },
  { id: "child", name: "Child", icon: "happy", color: "#FFA726" },
  { id: "shared", name: "Shared", icon: "people", color: "#9C27B0" },
];

const initialState: FamilyState = {
  members: DEFAULT_MEMBERS,
  loading: false,
};

// Async thunks
export const loadFamilyMembers = createAsyncThunk(
  "family/loadMembers",
  async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_MEMBERS;
  },
);

export const saveFamilyMembers = createAsyncThunk(
  "family/saveMembers",
  async (members: FamilyMember[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    return members;
  },
);

const familySlice = createSlice({
  name: "family",
  initialState,
  reducers: {
    addMember: (state, action: PayloadAction<FamilyMember>) => {
      state.members.push(action.payload);
    },
    updateMember: (
      state,
      action: PayloadAction<{ id: string; data: Partial<FamilyMember> }>,
    ) => {
      const index = state.members.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = {
          ...state.members[index],
          ...action.payload.data,
        };
      }
    },
    deleteMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter((m) => m.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFamilyMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadFamilyMembers.fulfilled, (state, action) => {
        state.members = action.payload;
        state.loading = false;
      })
      .addCase(loadFamilyMembers.rejected, (state) => {
        state.loading = false;
      })
      .addCase(saveFamilyMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      });
  },
});

export const { addMember, updateMember, deleteMember } = familySlice.actions;
export default familySlice.reducer;

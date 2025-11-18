// Authentication Redux Slice
// Manages authentication state in Redux store
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  isAuthenticated: boolean;
  isEnabled: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isEnabled: false,
  biometricEnabled: false,
  biometricAvailable: false,
  failedAttempts: 0,
  lockoutUntil: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setAuthEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setBiometricAvailable: (state, action: PayloadAction<boolean>) => {
      state.biometricAvailable = action.payload;
    },
    incrementFailedAttempts: (state) => {
      state.failedAttempts += 1;
    },
    resetFailedAttempts: (state) => {
      state.failedAttempts = 0;
    },
    setLockout: (state, action: PayloadAction<number>) => {
      state.lockoutUntil = action.payload;
    },
    clearLockout: (state) => {
      state.lockoutUntil = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setAuthenticated,
  setAuthEnabled,
  setBiometricEnabled,
  setBiometricAvailable,
  incrementFailedAttempts,
  resetFailedAttempts,
  setLockout,
  clearLockout,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;

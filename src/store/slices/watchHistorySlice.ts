import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WatchHistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationSec: number;
  currentTime: number;
  genres: string[];
  updatedAt: number;
}

export const MAX_WATCH_HISTORY = 15;

interface WatchHistoryState {
  items: WatchHistoryItem[];
  isInitialized: boolean;
}

const initialState: WatchHistoryState = {
  items: [],
  isInitialized: false,
};

import { parseDurationToSeconds, formatSecondsToTime } from "@/lib/utils";
export { parseDurationToSeconds, formatSecondsToTime };

export const watchHistorySlice = createSlice({
  name: "watchHistory",
  initialState,
  reducers: {
    initializeHistory: (state, action: PayloadAction<WatchHistoryItem[]>) => {
      // Garantizar que nunca supere el tope de 15 videos
      state.items = (action.payload || []).slice(0, MAX_WATCH_HISTORY);
      state.isInitialized = true;
    },
    recordProgress: {
      reducer: (state, action: PayloadAction<WatchHistoryItem>) => {
        const newItem = action.payload;
        const filtered = state.items.filter((item) => item.id !== newItem.id);
        state.items = [newItem, ...filtered].slice(0, MAX_WATCH_HISTORY);
      },
      prepare: (payload: {
        id: string;
        title: string;
        thumbnail: string;
        duration: string;
        durationSec?: number;
        currentTime: number;
        genres?: string[];
        updatedAt?: number;
      }) => {
        const durationSec =
          payload.durationSec && payload.durationSec > 0
            ? payload.durationSec
            : parseDurationToSeconds(payload.duration);

        return {
          payload: {
            id: payload.id,
            title: payload.title || "Sin título",
            thumbnail: payload.thumbnail || "",
            duration: payload.duration || "0:00",
            durationSec: durationSec || 0,
            currentTime: Math.max(0, Math.floor(payload.currentTime)),
            genres: payload.genres || [],
            updatedAt: payload.updatedAt ?? Date.now(),
          },
        };
      },
    },
    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearHistory: (state) => {
      state.items = [];
    },
  },
});

export const { initializeHistory, recordProgress, removeFromHistory, clearHistory } =
  watchHistorySlice.actions;

export default watchHistorySlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WatchlistState {
  items: string[]; // IDs de los videos guardados
  isInitialized: boolean;
}

const initialState: WatchlistState = {
  items: [],
  isInitialized: false,
};

export const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    initializeWatchlist: (state, action: PayloadAction<string[]>) => {
      state.items = action.payload;
      state.isInitialized = true;
    },
    toggleWatchlist: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.items.includes(id)) {
        state.items = state.items.filter((itemId) => itemId !== id);
      } else {
        state.items.push(id);
      }
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((itemId) => itemId !== action.payload);
    },
  },
});

export const { initializeWatchlist, toggleWatchlist, removeFromWatchlist } = watchlistSlice.actions;
export default watchlistSlice.reducer;

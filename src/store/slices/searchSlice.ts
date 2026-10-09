import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DurationFilter = "all" | "short" | "medium" | "long";
export type SortOption = "relevance" | "newest" | "shortest" | "longest" | "title_asc";

interface SearchState {
  query: string;
  durationFilter: DurationFilter;
  sortBy: SortOption;
}

const initialState: SearchState = {
  query: "",
  durationFilter: "all",
  sortBy: "relevance",
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    clearQuery: (state) => {
      state.query = "";
    },
    setDurationFilter: (state, action: PayloadAction<DurationFilter>) => {
      state.durationFilter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortOption>) => {
      state.sortBy = action.payload;
    },
    resetFilters: (state) => {
      state.durationFilter = "all";
      state.sortBy = "relevance";
    },
  },
});

export const {
  setQuery,
  clearQuery,
  setDurationFilter,
  setSortBy,
  resetFilters,
} = searchSlice.actions;

export default searchSlice.reducer;

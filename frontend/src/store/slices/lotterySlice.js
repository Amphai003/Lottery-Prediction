import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { lotteryApi } from '../../api/lotteryApi';

// Async Thunks
export const fetchHistory = createAsyncThunk(
  'lottery/fetchHistory',
  async ({ limit, offset }, { rejectWithValue }) => {
    try {
      return await lotteryApi.getHistory(limit, offset);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPredictions = createAsyncThunk(
  'lottery/fetchPredictions',
  async (_, { rejectWithValue }) => {
    try {
      return await lotteryApi.getPredictions();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const syncData = createAsyncThunk(
  'lottery/syncData',
  async (_, { rejectWithValue }) => {
    try {
      return await lotteryApi.syncData();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const runLocalPredict = createAsyncThunk(
  'lottery/runLocalPredict',
  async ({ digits, count }, { rejectWithValue }) => {
    try {
      return await lotteryApi.runLocalPredict(digits, count);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const lotterySlice = createSlice({
  name: 'lottery',
  initialState: {
    history: [],
    totalHistory: 0,
    allPredictions: [],
    localSets: [],
    localFrequencies: [],
    loading: {
      history: false,
      predictions: false,
      sync: false,
      predict: false,
    },
    error: null,
  },
  reducers: {
    setLocalSets: (state, action) => {
      state.localSets = action.payload;
    },
    setLocalFrequencies: (state, action) => {
      state.localFrequencies = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch History
      .addCase(fetchHistory.pending, (state) => {
        state.loading.history = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading.history = false;
        state.history = action.payload.data;
        state.totalHistory = action.payload.total;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading.history = false;
        state.error = action.payload;
      })
      // Fetch Predictions
      .addCase(fetchPredictions.pending, (state) => {
        state.loading.predictions = true;
      })
      .addCase(fetchPredictions.fulfilled, (state, action) => {
        state.loading.predictions = false;
        state.allPredictions = action.payload;
      })
      .addCase(fetchPredictions.rejected, (state, action) => {
        state.loading.predictions = false;
        state.error = action.payload;
      })
      // Run Local Predict
      .addCase(runLocalPredict.pending, (state) => {
        state.loading.predict = true;
      })
      .addCase(runLocalPredict.fulfilled, (state, action) => {
        state.loading.predict = false;
        // Parsing logic can be moved here if needed, or kept in component
        // For now just store raw
      })
      .addCase(runLocalPredict.rejected, (state, action) => {
        state.loading.predict = false;
        state.error = action.payload;
      });
  },
});

export const { setLocalSets, setLocalFrequencies } = lotterySlice.actions;
export default lotterySlice.reducer;

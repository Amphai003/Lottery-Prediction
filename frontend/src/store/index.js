import { configureStore } from '@reduxjs/toolkit';
import lotteryReducer from './slices/lotterySlice';

export const store = configureStore({
  reducer: {
    lottery: lotteryReducer,
  },
});

export default store;

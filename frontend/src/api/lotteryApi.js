import axiosInstance from './axiosInstance';

export const lotteryApi = {
  getHistory: (limit, offset) => 
    axiosInstance.get(`/history`, { params: { limit, offset } }),
    
  getPredictions: () => 
    axiosInstance.get(`/predictions`),
    
  savePrediction: (numbers, probability, source = 'manual', explanation = '') => 
    axiosInstance.post(`/save-prediction`, { numbers, probability, source, explanation }),
    
  saveBatch: (batch) => 
    axiosInstance.post(`/save-batch`, batch),
    
  deletePrediction: (id) => 
    axiosInstance.get(`/delete-prediction`, { params: { id } }),
    
  purge: (source) => 
    axiosInstance.get(`/purge`, { params: { source } }),
    
  runAIPredict: (digits, count) => 
    axiosInstance.post(`/ai-predict`, null, { params: { digits, count } }),
    
  runLocalPredict: (digits, count) => 
    axiosInstance.get(`/local-predict`, { params: { digits, count } }),
    
  syncData: () => 
    axiosInstance.get(`/sync`)
};

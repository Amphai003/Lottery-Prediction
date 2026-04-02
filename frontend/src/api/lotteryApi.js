const BASE_URL = 'http://localhost:8080/api';

export const lotteryApi = {
  getHistory: (limit, offset) => 
    fetch(`${BASE_URL}/history?limit=${limit}&offset=${offset}`).then(r => r.json()),
    
  getPredictions: () => 
    fetch(`${BASE_URL}/predictions`).then(r => r.json()),
    
  savePrediction: (numbers, probability, source = 'manual') => 
    fetch(`${BASE_URL}/save-prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers, probability, source })
    }).then(r => r.json()),
    
  saveBatch: (batch) => 
    fetch(`${BASE_URL}/save-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch)
    }).then(r => r.json()),
    
  deletePrediction: (id) => 
    fetch(`${BASE_URL}/delete-prediction?id=${id}`).then(r => r.json()),
    
  purge: (source) => 
    fetch(`${BASE_URL}/purge?source=${source}`).then(r => r.json()),
    
  runAIPredict: (digits, count) => 
    fetch(`${BASE_URL}/ai-predict?digits=${digits}&count=${count}`, { method: 'POST' }).then(r => r.json()),
    
  runLocalPredict: (digits, count) => 
    fetch(`${BASE_URL}/local-predict?digits=${digits}&count=${count}`).then(r => r.json()),
    
  syncData: () => 
    fetch(`${BASE_URL}/sync`).then(r => r.json())
};

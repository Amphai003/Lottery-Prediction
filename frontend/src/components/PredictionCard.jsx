import React from 'react';

const PredictionCard = ({ s, type, onCopy, onSave }) => (
  <div 
    className={`relative p-1 rounded-[2.5rem] bg-gradient-to-br transition-all duration-500 group prediction-glow ${type === 'gpt' ? 'from-indigo-600/20' : type === 'gemini' ? 'from-blue-600/20' : type === 'auto' ? 'from-amber-600/30' : 'from-zinc-800'} to-transparent`}
    style={{ '--glow-color': type === 'gpt' ? '#4f46e555' : type === 'gemini' ? '#2563eb55' : type === 'auto' ? '#f59e0b66' : '#ffffff11' }}
  >
    <div className="bg-zinc-950/90 backdrop-blur-2xl p-6 rounded-[2.4rem] border border-white/5 shadow-inner h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'gpt' ? 'bg-indigo-500' : type === 'gemini' ? 'bg-blue-500' : type === 'auto' ? 'bg-amber-500' : 'bg-zinc-600'}`}></div>
           <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500">{s.rate}% Conf.</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onCopy(s.numbers)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] transition-all" title="Copy Number">📋</button>
          {s.numbers && (
            <button onClick={() => onSave(s)} className="p-2 rounded-xl bg-white/5 hover:bg-indigo-600 text-[10px] transition-all" title="Archive Prediction">💾</button>
          )}
        </div>
      </div>
      
      <div className="text-3xl font-black tracking-[0.25em] text-center text-[var(--text-main)] my-6 font-mono drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 break-all w-full leading-none">
        {s.numbers}
      </div>
      
      <div className="text-[10px] text-zinc-600 italic text-center leading-relaxed h-14 overflow-y-auto custom-scrollbar px-4 bg-black/20 rounded-2xl py-3 border border-white/5 group-hover:text-zinc-400 mt-auto">
        {s.text}
      </div>
    </div>
  </div>
);

export default PredictionCard;

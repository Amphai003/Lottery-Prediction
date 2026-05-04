import React from 'react';

const PredictionCard = ({ s, type, onCopy, onSave }) => {
  const isHot = s.text?.includes('HOT PATTERN');
  const isMedium = s.text?.includes('MEDIUM PATTERN');
  const isCold = s.text?.includes('COLD PATTERN');

  const getTheme = () => {
    if (isHot) return { from: 'from-amber-500/40', glow: '#f59e0b', pulse: 'bg-amber-500', label: 'HOT RANK #1' };
    if (isMedium) return { from: 'from-indigo-500/40', glow: '#6366f1', pulse: 'bg-indigo-500', label: 'MED RANK #2' };
    if (isCold) return { from: 'from-cyan-500/40', glow: '#06b6d4', pulse: 'bg-cyan-500', label: 'COLD RANK #3' };
    
    if (type === 'gpt') return { from: 'from-indigo-600/20', glow: '#4f46e5', pulse: 'bg-indigo-500' };
    if (type === 'gemini') return { from: 'from-blue-600/20', glow: '#2563eb', pulse: 'bg-blue-500' };
    if (type === 'auto') return { from: 'from-amber-600/30', glow: '#f59e0b', pulse: 'bg-amber-500' };
    return { from: 'from-zinc-800', glow: '#ffffff', pulse: 'bg-zinc-600' };
  };

  const theme = getTheme();

  return (
    <div 
      className={`relative p-1 rounded-[2.5rem] bg-gradient-to-br transition-all duration-500 group prediction-glow ${theme.from} to-transparent`}
      style={{ '--glow-color': `${theme.glow}55` }}
    >
      <div className="bg-zinc-950/90 backdrop-blur-2xl p-6 rounded-[2.4rem] border border-white/5 shadow-inner h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full animate-pulse ${theme.pulse} shadow-[0_0_8px_var(--glow-color)]`}></div>
             <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500">{s.rate}% Conf.</span>
             {theme.label && (
               <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-400">{theme.label}</span>
             )}
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
};

export default PredictionCard;

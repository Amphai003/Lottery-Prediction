import React from 'react';

const Registry = ({ 
  history, total, page, setPage, pageSize, 
  isHistoryExpanded, setIsHistoryExpanded,
  digits
}) => (
  <section className="glass-card !p-6 sm:!p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
    <div className="flex flex-col lg:flex-row justify-between items-center mb-10 sm:mb-16 gap-8 sm:gap-10">
      <div className="flex flex-col text-center lg:text-left">
        <div className="text-[14px] sm:text-[18px] font-black text-[var(--text-main)] uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2">GLOBAL DRAW FEED</div>
        <div className="text-[9px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></span> Network Active: Synchronized Stream
        </div>
      </div>
      
      <div className="flex items-center gap-6 sm:gap-10 bg-zinc-950/80 px-6 sm:px-10 py-3 sm:py-5 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 shadow-inner backdrop-blur-3xl">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-zinc-900 border border-white/5 text-white active:scale-90 transition-all">←</button>
        <div className="text-[10px] sm:text-[12px] font-black text-center flex flex-col gap-0.5 sm:gap-1">
          <span className="text-zinc-600 text-[8px] sm:text-[9px] tracking-widest uppercase">Page Index</span>
          <div className="text-[var(--text-main)] text-sm sm:text-base"><span className="text-indigo-400 text-lg sm:text-2xl mx-1 tabular-nums">{page + 1}</span> / {Math.ceil(total / pageSize)}</div>
        </div>
        <button disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-zinc-900 border border-white/5 text-white active:scale-90 transition-all">→</button>
      </div>
      
      <button onClick={() => setIsHistoryExpanded(!isHistoryExpanded)} className="w-full sm:w-auto text-[9px] sm:text-[11px] font-black text-indigo-400 uppercase bg-indigo-600/10 px-6 sm:px-10 py-3 sm:py-5 rounded-[1.2rem] sm:rounded-[2rem] border border-indigo-500/20 hover:bg-indigo-600 hover:text-white tracking-[0.2em] sm:tracking-[0.3em] transition-all shadow-2xl active:scale-95">
        {isHistoryExpanded ? 'Close Monitor' : 'Inspect Feed History'}
      </button>
    </div>

    {/* Integrated Results Highlights */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
      {history.filter(h => h.winNumber).slice(0, 2).map((win, idx) => (
        <div key={idx} className={`p-6 sm:p-10 rounded-[2.5rem] bg-zinc-950/60 border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500 ${idx === 0 ? 'border-l-4 border-l-indigo-600' : 'border-l-4 border-l-blue-600'}`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex flex-col gap-1">
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] ${idx === 0 ? 'text-indigo-500' : 'text-blue-500'}`}>
                {idx === 0 ? '⚡ LATEST RESULTS' : '🔘 PREVIOUS RESULTS'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-widest">{win.winNumber}</span>
                <span className="text-[10px] sm:text-xs font-mono text-zinc-600">RD#{win.roundNumber}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] sm:text-xs font-black text-zinc-400 drop-shadow-lg">{new Date(win.roundDate).toLocaleDateString()}</span>
              <span className="text-[7px] sm:text-[8px] font-bold text-zinc-800 uppercase tracking-widest mt-1 opacity-50">Verified Stream</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-8 transition-all duration-1000 ease-in-out ${isHistoryExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-[300px] sm:max-h-[300px] overflow-hidden opacity-30 shadow-inner'}`}>
      {history.map((record, i) => (
          <div key={i} className={`p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-500 group shadow-2xl relative overflow-hidden flex flex-col justify-center items-center gap-2 sm:gap-4 ${record.winNumber ? 'bg-zinc-950/40 border-white/5' : 'bg-black/60 border-zinc-900 opacity-20'}`}>
            <div className="text-[8px] sm:text-[10px] font-black text-zinc-600 mb-0.5 sm:mb-1 opacity-80 flex items-center gap-1.5 sm:gap-2 relative z-10 font-mono">
              <span className="bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/5">RD #{record.roundNumber}</span>
              {!record.winNumber && <span className="text-amber-500 animate-pulse text-[7px] sm:text-[8px] uppercase font-black">Live</span>}
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-[0.1em] text-[var(--text-main)] text-center pb-1 sm:pb-2 font-mono group-hover:text-indigo-400 transition-colors drop-shadow-xl relative z-10 w-full">
              {record.winNumber || "------"}
            </div>
            <div className="text-[7px] sm:text-[8px] text-zinc-800 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 opacity-70 border-t border-white/5 pt-2 sm:pt-4 w-full text-center">{new Date(record.roundDate).toLocaleDateString()}</div>
          </div>
      ))}
    </div>
  </section>
);

export default Registry;

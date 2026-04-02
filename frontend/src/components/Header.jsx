import React from 'react';
import logo from '../assets/logo.png';

const Header = ({ 
  currentICT, digits, setDigits, count, setCount, 
  isAILoading, runDualForecast, runLocalForecast, showArchive,
  resetPredictions, theme, setTheme, latestResult
}) => (
  <header className="flex flex-col gap-6 sm:gap-10">
    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-4 sm:gap-6 group cursor-pointer" onClick={() => window.location.reload()}>
        <div className="relative">
           <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
           <img src={logo} alt="Logo" className="w-12 h-12 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/10 transition-all group-hover:rotate-[360deg] duration-1000 relative z-10" />
        </div>
        <div>
          <div className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2 sm:gap-3">
            LottoAnalytica <span className="p-1.5 sm:p-2 bg-indigo-600 rounded-xl sm:rounded-2xl text-[8px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] font-black italic shadow-lg shadow-indigo-600/30 text-white">PRO</span>
          </div>
          <div className="text-[8px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-bold tracking-[0.3em] sm:tracking-[0.6em] uppercase mt-1 sm:mt-2 opacity-60">Neural High-Precision Hub</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full md:w-auto">
        {/* AI DISCONTINUED: NO API KEY
        <button className="flex-1 md:flex-none btn-secondary whitespace-nowrap !px-4 sm:!px-8 !py-3 sm:!py-4 text-[9px] sm:text-[11px]" onClick={runDualForecast} disabled={isAILoading}>
          {isAILoading ? 'Thinking...' : '🔥 INITIATE AI'}
        </button>
        */}
        <button className="flex-1 md:flex-none bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/20 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap" onClick={runLocalForecast} disabled={isAILoading}>
          ⚡ LOCAL
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost !p-3 sm:!p-4" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Visual Interface">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-ghost !p-3 sm:!p-4" onClick={showArchive} title="Open Secure Vault">📜</button>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 sm:gap-6 bg-black/5 dark:bg-zinc-950/40 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl backdrop-blur-3xl ring-1 ring-white/5">
      {latestResult && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 mb-2 border-b border-white/5 px-2">
           <div className="flex flex-col gap-1 items-center sm:items-start">
              <span className="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">⚡ LATEST RECORDED RESULT</span>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] sm:text-xs font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">RD #{latestResult.roundNumber}</span>
                 <span className="text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest">{new Date(latestResult.roundDate).toLocaleDateString()}</span>
              </div>
           </div>
           <div className="flex flex-col items-center sm:items-end">
              <div className="text-4xl sm:text-6xl font-black text-[var(--text-main)] font-mono tracking-[0.2em] sm:tracking-[0.3em] drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:text-indigo-400 transition-all leading-none animate-fade-in">
                {latestResult.winNumber}
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex items-center justify-center gap-6 sm:gap-10 py-2 sm:border-r border-white/5">
            <div className="flex flex-col gap-1 items-center">
               <span className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest">LOCAL ICT</span>
               <div className="text-xl sm:text-3xl font-black text-[var(--text-main)] px-3 sm:px-4 py-1.5 sm:py-2 bg-black/5 dark:bg-black/40 rounded-xl sm:rounded-2xl border border-[var(--border-color)] tabular-nums animate-pulse">{currentICT}</div>
            </div>
            <div className="flex flex-col gap-1 items-center">
               <span className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest">NEXT DRAW</span>
               <div className="text-xl sm:text-3xl font-black text-[var(--text-main)] px-3 sm:px-4 py-1.5 sm:py-2 bg-black/5 dark:bg-black/40 rounded-xl sm:rounded-2xl border border-[var(--border-color)] tabular-nums">20:30</div>
            </div>
        </div>

      <div className="flex flex-col gap-3 sm:gap-4 items-center justify-center border-b sm:border-b-0 sm:border-r border-white/5 py-2 pb-4 sm:pb-2">
         <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Digit Calibration</span>
         <div className="flex gap-1.5 sm:gap-2">
            {[2, 3, 4, 6].map(d => (
              <button key={d} onClick={() => { setDigits(d); resetPredictions(); }} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black transition-all ${digits === d ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>
                {d}D
              </button>
            ))}
         </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 items-center justify-center py-2">
         <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Batch Magnitude</span>
         <div className="flex items-center gap-3">
            <input type="number" value={count} onChange={(e) => setCount(e.target.value)} className="w-16 sm:w-20 h-9 sm:h-11 bg-black/40 border border-white/10 rounded-lg sm:rounded-xl text-center text-[var(--text-main)] font-black text-[10px] sm:text-xs outline-none focus:border-indigo-500" />
            <div className="flex gap-1">
              {[5, 50].map(c => <button key={c} onClick={() => setCount(c)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-[9px] sm:text-[10px] font-black ${count == c ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-500'}`}>{c}</button>)}
            </div>
         </div>
      </div>
      </div>
    </div>
  </header>
);

export default Header;

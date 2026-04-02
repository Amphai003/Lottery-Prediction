import React from 'react';
import PredictionCard from './PredictionCard';

const PredictionNodes = ({ 
  gptSets, geminiSets, localSets, autoSets,
  onCopy, onSave, onSaveBatch 
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
    <section className="glass-card flex flex-col gap-6 sm:gap-8 !p-6 sm:!p-10 border-amber-500/20 lg:col-span-2 xl:col-span-2">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 sm:pb-6">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-500 border border-amber-500/20 text-[10px] sm:text-xs">A</div>
           <div className="text-[10px] sm:text-[11px] font-black text-amber-400 uppercase tracking-widest text-white-fixed">PULSE AUTO-RANDOM (2D/3D)</div>
        </div>
        <div className="flex gap-2">
           <span className="text-[8px] font-black text-amber-500/50 uppercase self-center bg-amber-500/5 px-2 py-1 rounded-md">Trigger: New Result</span>
           <button onClick={() => onSaveBatch(autoSets.map(s => ({ numbers: s.numbers, probability: s.rate, source: 'auto' })))} className="text-[8px] sm:text-[9px] font-black bg-amber-600/10 text-amber-400 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-amber-500/10 hover:bg-amber-600 hover:text-white transition-all shadow-lg active:scale-95 text-white-fixed">VAULT ALL</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto max-h-[500px] sm:max-h-[700px] custom-scrollbar pr-2 sm:pr-4">
        {autoSets.map((s, idx) => <PredictionCard key={idx} s={s} type="auto" onCopy={onCopy} onSave={onSave} />)}
        {autoSets.length === 0 && <div className="col-span-full text-[9px] sm:text-[10px] text-center italic text-amber-500/20 py-20 sm:py-40 uppercase font-black tracking-[0.4em] sm:tracking-[0.5em]">Waiting for Next Draw...</div>}
      </div>
    </section>

    <section className="glass-card flex flex-col gap-6 sm:gap-8 !p-6 sm:!p-10 border-zinc-700">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 sm:pb-6">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 border border-white/5 text-[10px] sm:text-xs">N</div>
           <div className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-widest text-white-fixed">NEURAL LOCAL</div>
        </div>
        <button onClick={() => onSaveBatch(localSets)} className="text-[8px] sm:text-[9px] font-black bg-white/5 text-zinc-500 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all shadow-lg active:scale-95 text-white-fixed">VAULT ALL</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 overflow-y-auto max-h-[500px] sm:max-h-[700px] custom-scrollbar pr-2 sm:pr-4">
        {localSets.map((s, idx) => <PredictionCard key={idx} s={s} type="local" onCopy={onCopy} onSave={onSave} />)}
        {localSets.length === 0 && <div className="text-[9px] sm:text-[10px] text-center italic text-zinc-800 py-20 sm:py-40 uppercase font-black tracking-[0.4em] sm:tracking-[0.5em]">Node Offline</div>}
      </div>
    </section>
  </div>
);

export default PredictionNodes;

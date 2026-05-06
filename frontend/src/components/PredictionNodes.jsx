import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PredictionCard from './PredictionCard';

const FrequencyAnalysis = ({ frequencies }) => {
  if (!frequencies || frequencies.length === 0) return null;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("LottoAnalytica - Position Frequency Analysis", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const tableRows = frequencies.map((posData, idx) => {
      const row = [`P${idx + 1}`];
      for (let i = 0; i <= 9; i++) {
        row.push(posData[String(i)] || 0);
      }
      return row;
    });

    autoTable(doc, {
      head: [['Pos', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      styles: { fontSize: 9, halign: 'center' },
      columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } }
    });

    doc.save(`LottoAnalytica_Pattern_Analysis_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const getColorClass = (count, maxCount) => {
    if (count === 0) return 'opacity-10 grayscale';
    if (count === maxCount) return 'text-amber-400 font-black scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] z-10';
    if (count > maxCount * 0.7) return 'text-indigo-400 font-black scale-110';
    if (count > maxCount * 0.4) return 'text-indigo-300 font-bold';
    return 'text-zinc-500 opacity-60';
  };

  return (
    <div className="mt-4 p-4 sm:p-5 bg-indigo-500/5 rounded-[1.5rem] border border-indigo-500/10 overflow-hidden relative group/analysis">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Position Frequency Analysis</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={exportPDF}
             className="text-[7px] font-black text-indigo-400 uppercase tracking-widest px-2.5 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-lg"
           >
             Export PDF
           </button>
           <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-full border border-white/5">Real-time Node Mesh</span>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar-h pb-2 relative z-10">
        <table className="w-full text-[10px] text-zinc-500 min-w-[300px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-2 font-black uppercase text-[8px] tracking-tighter opacity-30 w-8">Pos</th>
              {[...Array(10)].map((_, i) => (
                <th key={i} className="text-center py-2 font-black text-[9px] w-6 text-zinc-400">{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {frequencies.map((posData, idx) => {
              const counts = Object.values(posData);
              const maxCount = Math.max(...counts);
              return (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                  <td className="py-2.5 font-black text-zinc-600 uppercase text-[9px] group-hover/row:text-zinc-400 transition-colors">P{idx + 1}</td>
                  {[...Array(10)].map((_, i) => {
                    const count = posData[String(i)] || 0;
                    return (
                      <td key={i} className="text-center py-2.5 relative">
                        <span className={`inline-block transition-all duration-300 ${getColorClass(count, maxCount)}`}>
                          {count}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-sm bg-amber-500 shadow-[0_0_4px_#f59e0b]"></div>
             <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Hot</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-sm bg-indigo-500"></div>
             <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Active</span>
           </div>
        </div>
        <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest italic opacity-50 group-hover/analysis:opacity-100 transition-opacity">Neural Heatmap v4.5</span>
      </div>
    </div>
  );
};

const PredictionNodes = ({ 
  gptSets, geminiSets, localSets, autoSets, localFrequencies,
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
      
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 overflow-y-auto max-h-[400px] sm:max-h-[500px] custom-scrollbar pr-2 sm:pr-4">
          {localSets.map((s, idx) => <PredictionCard key={idx} s={s} type="local" onCopy={onCopy} onSave={onSave} />)}
          {localSets.length === 0 && <div className="text-[9px] sm:text-[10px] text-center italic text-zinc-800 py-20 sm:py-40 uppercase font-black tracking-[0.4em] sm:tracking-[0.5em]">Node Offline</div>}
        </div>

        <FrequencyAnalysis frequencies={localFrequencies} />
      </div>
    </section>
  </div>
);

export default PredictionNodes;

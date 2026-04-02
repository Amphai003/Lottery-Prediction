import Swal from 'sweetalert2';
import { lotteryApi } from '../api/lotteryApi';

export const useArchive = () => {
  const deletePrediction = async (id, callback) => {
    await lotteryApi.deletePrediction(id);
    if (callback) callback();
    showArchive(callback);
  };

  const copyToClipboard = (num) => {
    navigator.clipboard.writeText(num);
    Swal.fire({ title: 'Copied!', text: num, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#09090b', color: '#fff' });
  };

  const showArchive = async (onRefresh) => {
    try {
      const res = await lotteryApi.getPredictions();
      if (!res) return;

      const autoPredictions = res.filter(p => p.source === 'auto');
      const manualPredictions = res.filter(p => p.source !== 'auto');

      const groupData = (list) => list.reduce((acc, p) => {
        const date = new Date(p.predicted_at).toLocaleDateString('en-GB');
        if (!acc[date]) acc[date] = [];
        acc[date].push(p);
        return acc;
      }, {});

      const renderGroup = (groups, label, accentColor, id) => `
        <div id="${id}-content" class="${id === 'auto' ? '' : 'hidden'} animate-fade-in relative">
          <div class="flex justify-between items-center mt-6 mb-2 px-2">
             <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">${label} SEQUENCES</span>
             <button onclick="window._purgeVault('${id}')" class="text-[9px] font-black text-rose-500/60 hover:text-rose-500 uppercase tracking-widest bg-rose-500/5 px-3 py-1.5 rounded-xl border border-rose-500/10 transition-all hover:bg-rose-500/10 active:scale-95">Purge Node 🗑️</button>
          </div>
          <div class="space-y-8 mt-4">
            ${Object.entries(groups).length === 0 ? `<div class="text-zinc-800 italic py-20 text-center font-black tracking-widest text-[10px] uppercase opacity-30">Archive Clean - No ${label} Records</div>` : Object.entries(groups).map(([date, items]) => `
              <div class="relative pl-6 border-l-2 border-white/5 space-y-4 pb-4">
                <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-900 border-2 border-zinc-800"></div>
                <div class="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">${date}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  ${items.map(p => {
                    let statusClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                    if (p.status === 'Win Lottery') statusClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_-5px_#10b981]';
                    if (p.status === 'Pending Result') statusClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse';
                    return `
                    <div class="p-5 rounded-[2rem] bg-zinc-950/40 border border-white/5 hover:bg-zinc-900/60 transition-all group relative overflow-hidden flex flex-col gap-3">
                      <div class="flex justify-between items-start">
                        <span class="font-mono text-[9px] text-zinc-700 font-bold uppercase tracking-widest">${new Date(p.predicted_at).toLocaleTimeString('en-GB')}</span>
                        <div class="flex gap-1">
                           <button onclick="window._copyVault('${p.numbers}')" class="p-2 rounded-xl bg-white/5 hover:bg-indigo-600 text-zinc-500 hover:text-white transition-all text-[10px]">📋</button>
                           <button onclick="window._deleteVault(${p.id})" class="p-2 rounded-xl bg-white/5 hover:bg-rose-600 text-rose-800 hover:text-white transition-all text-[10px]">🗑️</button>
                        </div>
                      </div>
                      <span class="text-2xl font-black text-white tracking-[0.2em] font-mono group-hover:text-indigo-400 transition-colors">${p.numbers}</span>
                      <span class="px-3 py-1 ${statusClass} text-[8px] font-black uppercase rounded-full border tracking-widest self-start">${p.status}</span>
                    </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const html = `
        <div class="flex flex-col h-[700px] font-sans bg-[#020203] rounded-3xl overflow-hidden">
          <div class="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4 border border-white/5 mx-2">
            <button id="auto-tab" onclick="window._switchVault('auto')" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all bg-amber-600 text-white shadow-lg">⚡ PULSE AUTO (${autoPredictions.length})</button>
            <button id="manual-tab" onclick="window._switchVault('manual')" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-zinc-500 hover:text-white hover:bg-white/5">🕹️ MANUAL FLUX (${manualPredictions.length})</button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 custom-scrollbar">
            ${renderGroup(groupData(autoPredictions), 'Pulse Auto', '#f59e0b', 'auto')}
            ${renderGroup(groupData(manualPredictions), 'Manual Flux', '#6366f1', 'manual')}
          </div>
        </div>
      `;

      window._switchVault = (tab) => {
        const autoTab = document.getElementById('auto-tab');
        const manualTab = document.getElementById('manual-tab');
        const autoContent = document.getElementById('auto-content');
        const manualContent = document.getElementById('manual-content');
        
        if (tab === 'auto') {
          autoTab.className = "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all bg-amber-600 text-white shadow-lg";
          manualTab.className = "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-zinc-500 hover:text-white hover:bg-white/5";
          autoContent.classList.remove('hidden');
          manualContent.classList.add('hidden');
        } else {
          manualTab.className = "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all bg-indigo-600 text-white shadow-lg";
          autoTab.className = "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-zinc-500 hover:text-white hover:bg-white/5";
          manualContent.classList.remove('hidden');
          autoContent.classList.add('hidden');
        }
      };

      window._purgeVault = async (source) => {
        const { isConfirmed } = await Swal.fire({
          title: `PURGE ${source.toUpperCase()} NODE?`,
          text: `Deleting ${source === 'auto' ? autoPredictions.length : manualPredictions.length} records. This cannot be undone.`,
          icon: 'warning', showCancelButton: true, confirmButtonText: 'PURGE ALL', 
          background: '#09090b', color: '#fff', confirmButtonColor: '#f43f5e'
        });
        if (isConfirmed) {
          await lotteryApi.purge(source);
          if (onRefresh) onRefresh();
          showArchive(onRefresh);
        }
      };

      window._deleteVault = (id) => {
        Swal.fire({
          title: 'PURGE?', icon: 'warning', showCancelButton: true, confirmButtonText: 'PURGE', 
          background: '#09090b', color: '#fff', confirmButtonColor: '#f43f5e'
        }).then((result) => {
          if (result.isConfirmed) deletePrediction(id, onRefresh);
        });
      };
      window._copyVault = (num) => copyToClipboard(num);

      Swal.fire({
        title: '<div class="text-left font-black uppercase tracking-[0.3em] text-[10px] text-zinc-500 border-b border-white/5 pb-4">🏦 INTELLIGENCE VAULT</div>',
        html: html, width: window.innerWidth < 1024 ? '95%' : '850px', background: '#020203', color: '#fff', showConfirmButton: false, showCloseButton: true, customClass: { popup: 'rounded-[3rem] border border-white/5' }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return { showArchive };
};

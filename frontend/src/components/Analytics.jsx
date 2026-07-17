import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const fmtKip = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : n > 0 ? '+' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B KIP`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(3)}M KIP`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(0)}K KIP`;
  return `${sign}${abs} KIP`;
};

const Analytics = ({ stats }) => {
  const isZeroData = stats.wins === 0 && stats.losses === 0 && stats.pending === 0;
  const chartDisplayData = isZeroData 
    ? [{ name: 'Empty', value: 1, color: '#18181b' }] 
    : stats.chartData;

  // Simple aggregate: Missed Rounds × 1,000 KIP spent, Wins × 60,000 KIP won
  const spent     = stats.losses * 1_000;
  const won       = stats.wins   * 60_000;
  const net       = won - spent;
  const netPos    = net > 0;
  const netNeg    = net < 0;

  return (
    <section className="animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-8 glass-card !p-6 sm:!p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          <div className="w-full h-[200px] sm:h-[240px] md:w-1/2 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDisplayData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={isZeroData ? 0 : 8}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {chartDisplayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                {!isZeroData && (
                  <Tooltip 
                    contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                )}
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col justify-center gap-4 sm:gap-6">
             <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2">Total Node Accuracy</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-6xl font-black text-[var(--text-main)] tracking-tighter">{stats.winRate}%</span>
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest">Global Rate</span>
                </div>
             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div className="bg-white/5 p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] border border-white/5 flex flex-col items-center sm:items-start">
                    <span className="text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase tracking-widest">Correct Insights</span>
                    <div className="text-xl sm:text-2xl font-black text-[var(--text-main)]">{stats.wins}</div>
                 </div>
                 <div className="bg-white/5 p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] border border-white/5 flex flex-col items-center sm:items-start">
                    <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-widest">Missed Rounds</span>
                    <div className="text-xl sm:text-2xl font-black text-[var(--text-main)]">{stats.losses}</div>
                 </div>
              </div>

              {/* ── Prize Result Summary ── */}
              <div className="p-4 rounded-[1.2rem] sm:rounded-[1.5rem] border border-white/5 bg-zinc-950/50 flex flex-col gap-3">
                <span className="text-[8px] sm:text-[9px] font-black text-amber-400 uppercase tracking-widest">🏆 Prize Result</span>

                {/* Equation: Missed − Won = Net */}
                <div className="flex items-center gap-2 flex-wrap font-mono">
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Missed</span>
                    <span className="text-[12px] sm:text-[14px] font-black text-rose-400">{fmtKip(spent)}</span>
                  </div>
                  <span className="text-zinc-700 font-black text-lg mt-3">−</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Won ({stats.wins}×60K)</span>
                    <span className="text-[12px] sm:text-[14px] font-black text-emerald-400">{fmtKip(won)}</span>
                  </div>
                  <span className="text-zinc-700 font-black text-lg mt-3">=</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Net</span>
                    <span className={`text-[13px] sm:text-[15px] font-black ${netPos ? 'text-emerald-400' : netNeg ? 'text-rose-400' : 'text-zinc-400'}`}>
                      {fmtKip(net)}
                    </span>
                  </div>
                </div>

                {/* Thin progress bar showing won vs spent */}
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((won / (spent || 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-[7px] text-zinc-700 font-mono">
                  {stats.losses} missed round{stats.losses !== 1 ? 's' : ''} · {stats.wins} correct · 2-digit prize (60,000 KIP each)
                </div>
              </div>

              <div className="mt-2 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Node Efficiency Comparison</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Auto-Pulse</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-500">{stats.autoWinRate}%</span>
                      <span className="text-[8px] text-zinc-600">({stats.autoTotal})</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${stats.autoWinRate}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Manual Flux</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-500">{stats.manualWinRate}%</span>
                      <span className="text-[8px] text-zinc-600">({stats.manualTotal})</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${stats.manualWinRate}%` }}></div>
                  </div>
                </div>
              </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 sm:gap-6">
           <div className="flex-1 bg-gradient-to-br from-indigo-600/20 to-zinc-950/40 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] border border-indigo-500/20 p-6 sm:p-8 flex flex-col justify-center gap-2 sm:gap-4 relative overflow-hidden group min-h-[140px]">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-600 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] relative z-10">Total Registry</div>
              <div className="text-3xl sm:text-5xl font-black text-[var(--text-main)] relative z-10">{stats.total} <span className="text-sm sm:text-lg text-zinc-700">Sequences</span></div>
              <div className="h-1 w-full bg-indigo-900/40 rounded-full mt-2 sm:mt-4 relative z-10">
                 <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_2px_#6366f155]" style={{ width: `${stats.winRate}%` }}></div>
              </div>
           </div>
           <div className="flex-1 bg-zinc-950/40 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 p-6 sm:p-8 flex flex-col justify-center gap-1 sm:gap-2 min-h-[140px]">
              <div className="flex items-center gap-2 sm:gap-3">
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 animate-ping"></div>
                 <span className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest">Pending Evaluation</span>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-[var(--text-main)]">{stats.pending} <span className="text-[9px] sm:text-xs text-zinc-800 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Rounds</span></div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;

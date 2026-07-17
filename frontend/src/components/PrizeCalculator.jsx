import { useState, useMemo } from 'react';

// ─── Prize table (KIP) ───────────────────────────────────────────────────────
const PRIZE_TABLE = [
  { digits: 2, prize: 60_000,       label: '2 Digits',  color: 'text-sky-400',    border: 'border-sky-500/30',    glow: 'shadow-sky-500/10' },
  { digits: 3, prize: 500_000,      label: '3 Digits',  color: 'text-emerald-400',border: 'border-emerald-500/30',glow: 'shadow-emerald-500/10' },
  { digits: 4, prize: 5_000_000,    label: '4 Digits',  color: 'text-amber-400',  border: 'border-amber-500/30',  glow: 'shadow-amber-500/10' },
  { digits: 5, prize: 40_000_000,   label: '5 Digits',  color: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/10' },
  { digits: 6, prize: 400_000_000,  label: '6 Digits',  color: 'text-rose-400',   border: 'border-rose-500/30',   glow: 'shadow-rose-500/10' },
];

const fmt = (n) =>
  new Intl.NumberFormat('lo-LA').format(n) + ' KIP';

// Count how many trailing digits match (Lao lottery: must match from the RIGHT)
const countMatchDigits = (ticket, winner) => {
  if (!ticket || !winner) return 0;
  const t = ticket.trim();
  const w = winner.trim();
  let matched = 0;
  for (let i = 1; i <= Math.min(t.length, w.length, 6); i++) {
    if (t.slice(-i) === w.slice(-i)) matched = i;
    else break;
  }
  return matched;
};

export default function PrizeCalculator({ history }) {
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketCost, setTicketCost]     = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [calculated, setCalculated]     = useState(false);

  // Build round list from history (only rounds that have a win number)
  const rounds = useMemo(() =>
    history
      .filter(h => h.winNumber && h.winNumber !== '')
      .map(h => ({ value: h.roundNumber, label: `Round #${h.roundNumber}`, winNumber: h.winNumber, roundDate: h.roundDate })),
  [history]);

  const selectedData = useMemo(() =>
    rounds.find(r => r.value === selectedRound),
  [rounds, selectedRound]);

  const result = useMemo(() => {
    if (!calculated || !selectedData || !ticketNumber || !ticketCost) return null;
    const cost    = parseInt(ticketCost.replace(/[^0-9]/g, ''), 10) || 0;
    const matched = countMatchDigits(ticketNumber, selectedData.winNumber);
    const row     = PRIZE_TABLE.find(p => p.digits === matched) || null;
    const prize   = row ? row.prize : 0;
    const net     = prize - cost;
    return { matched, prize, cost, net, row, winNumber: selectedData.winNumber };
  }, [calculated, selectedData, ticketNumber, ticketCost]);

  const handleCalc = () => {
    if (!selectedRound || !ticketNumber || !ticketCost) return;
    setCalculated(true);
  };

  const handleReset = () => {
    setCalculated(false);
    setTicketNumber('');
    setTicketCost('');
    setSelectedRound('');
  };

  return (
    <section className="glass-card !p-6 sm:!p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4">
        <div>
          <div className="text-[14px] sm:text-[18px] font-black text-[var(--text-main)] uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1">
            🏆 PRIZE CALCULATOR
          </div>
          <div className="text-[9px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
            Check how much you win — or lose — per round
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20">
          <span className="text-amber-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
            ⚡ Lao Lottery · Trailing Digits
          </span>
        </div>
      </div>

      {/* ── Prize Table Reference ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
        {PRIZE_TABLE.map(row => (
          <div
            key={row.digits}
            className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-2xl bg-zinc-950/60 border ${row.border} shadow-lg ${row.glow}`}
          >
            <span className={`text-[11px] sm:text-[13px] font-black ${row.color}`}>{row.label}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 font-mono text-center leading-snug">
              {fmt(row.prize)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Input Form ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Round Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Select Round
          </label>
          <select
            value={selectedRound}
            onChange={e => { setSelectedRound(e.target.value); setCalculated(false); }}
            className="bg-zinc-900/80 border border-white/10 text-[var(--text-main)] rounded-xl px-4 py-3 text-[12px] sm:text-[13px] font-mono focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">-- Pick a round --</option>
            {rounds.map(r => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.winNumber}
              </option>
            ))}
          </select>
          {selectedData && (
            <div className="text-[9px] text-zinc-600 font-mono px-1">
              Win#: <span className="text-indigo-400 font-black">{selectedData.winNumber}</span>
            </div>
          )}
        </div>

        {/* Ticket Number */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Your Ticket Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 374"
            value={ticketNumber}
            onChange={e => { setTicketNumber(e.target.value.replace(/\D/g, '')); setCalculated(false); }}
            className="bg-zinc-900/80 border border-white/10 text-[var(--text-main)] rounded-xl px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-indigo-500 transition-all tracking-widest"
          />
        </div>

        {/* Ticket Cost */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Ticket Cost (KIP)
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 374000"
            value={ticketCost}
            onChange={e => { setTicketCost(e.target.value.replace(/\D/g, '')); setCalculated(false); }}
            className="bg-zinc-900/80 border border-white/10 text-[var(--text-main)] rounded-xl px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleCalc}
          disabled={!selectedRound || !ticketNumber || !ticketCost}
          className="btn-primary flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:grayscale bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 hover:brightness-110"
        >
          ⚡ Calculate Prize
        </button>
        {calculated && (
          <button
            onClick={handleReset}
            className="btn-ghost px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 bg-white/5 text-zinc-400 border border-white/5 hover:brightness-125"
          >
            ↺ Reset
          </button>
        )}
      </div>

      {/* ── Result Panel ── */}
      {result && (
        <div className="animate-fade-in">
          {/* Digit Match Visualizer */}
          <DigitMatchBar ticket={ticketNumber} winner={result.winNumber} matched={result.matched} />

          {/* Outcome Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {/* Matched */}
            <div className="flex flex-col gap-1 p-5 sm:p-8 rounded-[2rem] bg-zinc-950/60 border border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Digits Matched</span>
              {result.matched > 0 ? (
                <span className={`text-3xl sm:text-5xl font-black font-mono ${result.row?.color ?? 'text-white'}`}>
                  {result.matched}
                </span>
              ) : (
                <span className="text-3xl sm:text-5xl font-black font-mono text-zinc-700">0</span>
              )}
              <span className="text-[9px] text-zinc-700 uppercase tracking-widest">
                {result.matched > 0 ? result.row?.label : 'No match'}
              </span>
            </div>

            {/* Prize Won */}
            <div className={`flex flex-col gap-1 p-5 sm:p-8 rounded-[2rem] border ${result.prize > 0 ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-zinc-950/60 border-white/5'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Prize Won</span>
              <span className={`text-xl sm:text-2xl font-black font-mono leading-tight ${result.prize > 0 ? 'text-emerald-400' : 'text-zinc-700'}`}>
                {result.prize > 0 ? fmt(result.prize) : 'No Prize'}
              </span>
              <span className="text-[9px] text-zinc-700 uppercase tracking-widest">Gross amount</span>
            </div>

            {/* Net Profit / Loss */}
            <div className={`flex flex-col gap-1 p-5 sm:p-8 rounded-[2rem] border ${result.net > 0 ? 'bg-emerald-950/30 border-emerald-500/20' : result.net === 0 ? 'bg-zinc-950/60 border-white/5' : 'bg-rose-950/30 border-rose-500/20'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Net Result</span>
              <span className={`text-xl sm:text-2xl font-black font-mono leading-tight ${result.net > 0 ? 'text-emerald-400' : result.net === 0 ? 'text-zinc-400' : 'text-rose-400'}`}>
                {result.net > 0 ? '+' : ''}{fmt(result.net)}
              </span>
              <span className="text-[9px] text-zinc-700 uppercase tracking-widest">
                {result.net > 0 ? '🎉 Profit!' : result.net === 0 ? 'Break Even' : '😞 Loss'}
              </span>
            </div>
          </div>

          {/* Equation Summary */}
          <div className="mt-5 p-4 sm:p-6 rounded-2xl bg-zinc-950/50 border border-white/5 font-mono text-[11px] sm:text-[13px] flex flex-wrap items-center gap-2 sm:gap-3 text-zinc-400">
            <span className="text-emerald-400 font-black">{fmt(result.prize)}</span>
            <span className="text-zinc-700">prize</span>
            <span className="text-zinc-600">−</span>
            <span className="text-rose-400 font-black">{fmt(result.cost)}</span>
            <span className="text-zinc-700">ticket cost</span>
            <span className="text-zinc-600">=</span>
            <span className={`font-black ${result.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.net >= 0 ? '+' : ''}{fmt(result.net)}
            </span>
            <span className="text-zinc-700">net</span>
          </div>
        </div>
      )}

      {/* ── No-match state ── */}
      {result && result.matched === 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/15 text-[11px] sm:text-[12px] text-rose-400 font-bold flex items-center gap-3">
          <span className="text-xl">😞</span>
          No trailing digits matched. Better luck next round!
        </div>
      )}
    </section>
  );
}

// ── Digit Match Visualizer ───────────────────────────────────────────────────
function DigitMatchBar({ ticket, winner, matched }) {
  const winDigits = winner.split('');
  const ticketPadded = ticket.padStart(winner.length, ' ');

  return (
    <div className="p-5 sm:p-8 rounded-[2rem] bg-zinc-950/60 border border-white/5">
      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-4">Digit Match Breakdown (trailing from right)</div>

      {/* Winner row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 w-16 sm:w-20 shrink-0">Win#</span>
          <div className="flex gap-1 sm:gap-2">
            {winDigits.map((d, i) => {
              const posFromRight = winDigits.length - 1 - i;
              const isMatched = posFromRight < matched;
              return (
                <span
                  key={i}
                  className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl font-black font-mono text-sm sm:text-base transition-all
                    ${isMatched
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-900/60 border border-white/5 text-zinc-600'
                    }`}
                >
                  {d}
                </span>
              );
            })}
          </div>
        </div>

        {/* Ticket row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 w-16 sm:w-20 shrink-0">Ticket</span>
          <div className="flex gap-1 sm:gap-2">
            {ticketPadded.split('').map((d, i) => {
              const posFromRight = winDigits.length - 1 - i;
              const isMatched = posFromRight < matched && d.trim() !== '';
              return (
                <span
                  key={i}
                  className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl font-black font-mono text-sm sm:text-base transition-all
                    ${isMatched
                      ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10'
                      : d.trim() === ''
                        ? 'opacity-0'
                        : 'bg-zinc-900/60 border border-white/5 text-zinc-600'
                    }`}
                >
                  {d.trim() || ''}
                </span>
              );
            })}
          </div>
        </div>

        {/* Match indicator row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-16 sm:w-20 shrink-0" />
          <div className="flex gap-1 sm:gap-2">
            {winDigits.map((_, i) => {
              const posFromRight = winDigits.length - 1 - i;
              const isMatched = posFromRight < matched;
              return (
                <span
                  key={i}
                  className="w-9 h-4 sm:w-11 flex items-center justify-center text-[10px]"
                >
                  {isMatched ? '✓' : ''}
                </span>
              );
            })}
          </div>
          {matched > 0 && (
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">
              {matched} matched ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

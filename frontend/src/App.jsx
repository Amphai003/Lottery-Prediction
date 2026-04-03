import { useState, useEffect, useMemo } from 'react'
import Swal from 'sweetalert2'
import './App.css'

// Architecture Core
import { lotteryApi } from './api/lotteryApi'
import { useArchive } from './hooks/useArchive'

// Visual Interfaces
import Header from './components/Header'
import Analytics from './components/Analytics'
import PredictionNodes from './components/PredictionNodes'
import Registry from './components/Registry'

function App() {
  const [isAILoading, setIsAILoading] = useState(false)
  const [history, setHistory] = useState([])
  const [allPredictions, setAllPredictions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [digits, setDigits] = useState(6)
  const [count, setCount] = useState(5)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const [gptSets, setGptSets] = useState([])
  const [geminiSets, setGeminiSets] = useState([])
  const [localSets, setLocalSets] = useState([])
  const [autoSets, setAutoSets] = useState([])
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  const PAGE_SIZE = 10
  const { showArchive } = useArchive()

  // 🕒 Master Clock & Persistence Hook
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Load from cache
    const cachedGpt = localStorage.getItem('gptSets')
    const cachedGem = localStorage.getItem('geminiSets')
    const cachedLoc = localStorage.getItem('localSets')
    const cachedAuto = localStorage.getItem('autoSets')
    if (cachedGpt) setGptSets(JSON.parse(cachedGpt))
    if (cachedGem) setGeminiSets(JSON.parse(cachedGem))
    if (cachedLoc) setLocalSets(JSON.parse(cachedLoc))
    if (cachedAuto) setAutoSets(JSON.parse(cachedAuto))

    return () => clearInterval(timer)
  }, [])

  // Theme Synchronizer
  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Update Cache
  useEffect(() => { if (gptSets.length && gptSets[0].numbers) localStorage.setItem('gptSets', JSON.stringify(gptSets)) }, [gptSets])
  useEffect(() => { if (geminiSets.length && geminiSets[0].numbers) localStorage.setItem('geminiSets', JSON.stringify(geminiSets)) }, [geminiSets])
  useEffect(() => { if (localSets.length && localSets[0].numbers) localStorage.setItem('localSets', JSON.stringify(localSets)) }, [localSets])
  useEffect(() => { if (autoSets.length) localStorage.setItem('autoSets', JSON.stringify(autoSets)) }, [autoSets])

  // 📡 Data Synchronization Loop
  useEffect(() => {
    const syncAndFetch = async () => {
      await lotteryApi.syncData()
      fetchMainData()
      fetchStats()
    }
    syncAndFetch()
  }, [page])

  // 🤖 Auto Random Generation on New Result
  useEffect(() => {
    if (history.length > 0) {
      const latestId = history[0].apiId
      const lastKnownId = localStorage.getItem('lastProcessedId')
      
      if (latestId && String(latestId) !== lastKnownId) {
        // Generate total 10 sets (5 for 2D, 5 for 3D)
        const newAutoRandoms = []
        for (let i = 0; i < 5; i++) {
          newAutoRandoms.push({ numbers: Math.floor(Math.random() * 100).toString().padStart(2, '0'), rate: 50, source: 'auto' })
        }
        for (let i = 0; i < 5; i++) {
          newAutoRandoms.push({ numbers: Math.floor(Math.random() * 1000).toString().padStart(3, '0'), rate: 50, source: 'auto' })
        }
        
        setAutoSets(newAutoRandoms)
        localStorage.setItem('lastProcessedId', String(latestId))
        
        // Auto-Vault these sets with correct JSON keys
        const batch = newAutoRandoms.map(s => ({ numbers: s.numbers, probability: s.rate, source: 'auto' }))
        lotteryApi.saveBatch(batch).then(() => fetchStats())
      }
    }
  }, [history])

  const fetchMainData = async () => {
    const res = await lotteryApi.getHistory(PAGE_SIZE, page * PAGE_SIZE)
    if (res) { setHistory(res.data); setTotal(res.total); }
  }

  const fetchStats = async () => {
    const res = await lotteryApi.getPredictions()
    if (res) setAllPredictions(res)
  }

  const parseSets = (raw) => {
    if (!raw) return []
    return raw.split('|||').map(p => {
      const numMatch = p.match(/NUMBER:\s*(\d+)/)
      const rateMatch = p.match(/WINRATE:\s*(\d+(\.\d+)?)%/)
      const explainMatch = p.match(/EXPLANATION:\s*([\s\S]*)$/)
      let numbers = numMatch ? numMatch[1] : "".padStart(digits, "?")
      if (numbers.length > digits) numbers = numbers.slice(-digits)
      return { numbers, rate: rateMatch ? parseFloat(rateMatch[1]) : 75, text: explainMatch ? explainMatch[1].trim() : p }
    })
  }

  const runDualForecast = async () => {
    /* AI DISCONTINUED: NO API KEY
    setIsAILoading(true)
    setGptSets([{ text: "Alpha Node: Syncing Neural Mesh..." }])
    setGeminiSets([{ text: "Beta Node: Harvesting Stream Data..." }])
    try {
      const res = await lotteryApi.runAIPredict(digits, count)
      if (res) { setGptSets(parseSets(res.gpt4_prediction)); setGeminiSets(parseSets(res.gemini_prediction)); }
    } finally { setIsAILoading(false) }
    */
  }

  const runLocalForecast = async () => {
    setIsAILoading(true)
    setLocalSets([{ text: "Simulating Local Node Consensus..." }])
    try {
      const res = await lotteryApi.runLocalPredict(digits, count)
      if (res && res.prediction) setLocalSets(parseSets(res.prediction))
    } finally { setIsAILoading(false) }
  }

  const handleSave = async (s) => {
    const res = await lotteryApi.savePrediction(s.numbers, s.rate, s.source || 'manual')
    if (res) { fetchStats(); Swal.fire({ title: 'VAULTED', text: `${s.numbers} archived.`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#09090b', color: '#fff' }); }
  }

  const handleSaveBatch = async (sets) => {
    if (!sets.length) return
    const batch = sets.filter(s => s.numbers).map(s => ({ 
      numbers: s.numbers, 
      probability: s.rate || s.probability, 
      source: s.source || 'manual' 
    }))
    const res = await lotteryApi.saveBatch(batch)
    if (res) { fetchStats(); Swal.fire({ title: 'BATCH SYNCED', text: 'Sets archived in vault.', icon: 'success', background: '#09090b', color: '#fff' }); }
  }

  const copyToClipboard = (num) => {
    navigator.clipboard.writeText(num)
    Swal.fire({ title: 'COPIED', text: num, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#09090b' })
  }

  const stats = useMemo(() => {
    const wins = allPredictions.filter(p => p.status === 'Win Lottery').length
    const losses = allPredictions.filter(p => p.status === 'Lost Case').length
    const pending = allPredictions.filter(p => p.status === 'Pending Result').length
    const totalRecorded = wins + losses
    const winRate = totalRecorded > 0 ? ((wins / totalRecorded) * 100).toFixed(1) : 0

    // Source Comparison Stats
    const autoPredictions = allPredictions.filter(p => p.source === 'auto')
    const manualPredictions = allPredictions.filter(p => p.source !== 'auto')
    
    const calculateRate = (list) => {
      const w = list.filter(p => p.status === 'Win Lottery').length
      const l = list.filter(p => p.status === 'Lost Case').length
      return (w + l) > 0 ? ((w / (w + l)) * 100).toFixed(1) : 0
    }

    return {
      wins, losses, pending, total: allPredictions.length, winRate,
      autoWinRate: calculateRate(autoPredictions),
      manualWinRate: calculateRate(manualPredictions),
      autoTotal: autoPredictions.length,
      manualTotal: manualPredictions.length,
      chartData: [
        { name: 'Wins', value: wins, color: '#10b981' }, 
        { name: 'Losses', value: losses, color: '#f43f5e' }, 
        { name: 'Pending', value: pending, color: '#f59e0b' }
      ]
    }
  }, [allPredictions])

  const officialWinners = history.filter(h => h.winNumber && h.winNumber !== "").slice(0, 2)
  const currentICT = currentTime.toLocaleTimeString('en-GB')

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col gap-8 sm:gap-12 w-full animate-fade-in font-sans selection:bg-indigo-600 selection:text-white overflow-x-hidden">
      
      <Header 
        currentICT={currentICT} digits={digits} setDigits={setDigits} 
        count={count} setCount={setCount} isAILoading={isAILoading}
        runDualForecast={runDualForecast} runLocalForecast={runLocalForecast}
        showArchive={() => showArchive(fetchStats)}
        resetPredictions={() => { setGptSets([]); setGeminiSets([]); setLocalSets([]); }}
        theme={theme} setTheme={setTheme}
        latestResult={officialWinners[0]}
      />

      <Analytics stats={stats} />

      <PredictionNodes 
        gptSets={gptSets} geminiSets={geminiSets} localSets={localSets} autoSets={autoSets}
        onCopy={copyToClipboard} onSave={handleSave} onSaveBatch={handleSaveBatch}
      />

      <Registry 
        history={history} total={total} page={page} setPage={setPage} pageSize={PAGE_SIZE}
        isHistoryExpanded={isHistoryExpanded} setIsHistoryExpanded={setIsHistoryExpanded}
        digits={digits}
      />

      <footer className="footer text-center pt-24 border-t border-white/5 text-[11px] font-black text-zinc-800 uppercase tracking-[1.2em] pb-16 opacity-30">
        LottoAnalytica DeepMind Cluster — v4.5.1 Modular Stable
      </footer>
    </div>
  )
}

export default App

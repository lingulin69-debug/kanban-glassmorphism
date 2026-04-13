import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Search, X, GripVertical, Calendar, BarChart3, LayoutGrid,
  ChevronLeft, ChevronRight, Tag, Clock, AlertCircle, CheckCircle2,
  Circle, Timer, Sparkles, Filter, Loader2, Cloud, CloudOff, Sun, Moon, SlidersHorizontal, Type, Minus
} from "lucide-react"
import { supabase } from "./supabaseClient"

function loadAssets() {
  if (!document.querySelector('link[href*="fonts.googleapis"]')) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Serif+TC:wght@400;700;900&display=swap"
    document.head.appendChild(link)
  }
}

const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

// Audio helpers — preload with 300% volume via Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
const createLoudSound = (src, gain) => {
  const audio = new Audio(src)
  const source = audioCtx.createMediaElementSource(audio)
  const gainNode = audioCtx.createGain()
  gainNode.gain.value = gain
  source.connect(gainNode).connect(audioCtx.destination)
  return audio
}
const switchSound = createLoudSound('/audio/Random 1.wav', 3.0)
const clickSound = createLoudSound('/audio/Random2.wav', 3.0)
const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume() }
const playSwitch = () => { resumeAudio(); switchSound.currentTime = 0; switchSound.play().catch(() => {}) }
const playClick = () => { resumeAudio(); clickSound.currentTime = 0; clickSound.play().catch(() => {}) }

function GlassCard({ children, className = "", intensity = "medium", dark = false, ...props }) {
  const bg = dark
    ? (intensity === "heavy" ? "bg-[#3B3B56]/65 backdrop-blur-2xl backdrop-saturate-[180%]" : intensity === "light" ? "bg-[#3B3B56]/35 backdrop-blur-lg backdrop-saturate-150" : "bg-[#3B3B56]/50 backdrop-blur-xl backdrop-saturate-[180%]")
    : (intensity === "heavy" ? "bg-white/75 backdrop-blur-2xl backdrop-saturate-[180%]" : intensity === "light" ? "bg-white/50 backdrop-blur-lg backdrop-saturate-150" : "bg-white/65 backdrop-blur-xl backdrop-saturate-[180%]")
  const border = dark ? "border-transparent" : "border-neutral-200/40"
  return (
    <div className={`rounded-2xl border shadow-sm ${border} ${bg} ${className}`} style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)', willChange: 'transform', contain: 'layout style paint' }} {...props}>
      {children}
    </div>
  )
}

const INITIAL_TASKS = [
  { id: "1", title: "設計系統規劃", description: "建立完整的設計系統文件與元件庫", column: "doing", priority: "high", startDate: "2025-01-15", endDate: "2025-02-15", tags: [{text:"設計",color:"#C377E0"},{text:"系統",color:"#0079BF"}], color: "#171717" },
  { id: "2", title: "前端開發框架", description: "選擇並建立前端開發框架", column: "todo", priority: "medium", startDate: "2025-02-01", endDate: "2025-03-01", tags: [{text:"開發",color:"#61BD4F"}], color: "#525252" },
  { id: "3", title: "使用者研究", description: "進行目標用戶的訪談與問卷調查", column: "done", priority: "high", startDate: "2025-01-01", endDate: "2025-01-20", tags: [{text:"研究",color:"#FF9F1A"},{text:"UX",color:"#FF78CB"}], color: "#404040" },
  { id: "4", title: "API 架構設計", description: "設計 RESTful API 架構", column: "todo", priority: "low", startDate: "2025-02-15", endDate: "2025-03-10", tags: [{text:"後端",color:"#00C2E0"}], color: "#737373" },
  { id: "5", title: "效能優化", description: "Core Web Vitals 優化", column: "review", priority: "medium", startDate: "2025-01-25", endDate: "2025-02-20", tags: [{text:"效能",color:"#F2D600"}], color: "#a3a3a3" },
]

const COLUMNS = [
  { id: "todo", label: "待辦", icon: Circle, accent: "#a3a3a3" },
  { id: "doing", label: "進行中", icon: Timer, accent: "#525252" },
  { id: "review", label: "審核中", icon: AlertCircle, accent: "#737373" },
  { id: "done", label: "完成", icon: CheckCircle2, accent: "#6EA667" },
]

const MORANDI_COLORS = ["#171717", "#404040", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#404040", "#737373", "#525252", "#a3a3a3"]

const PRIORITIES = [
  { id: "high", label: "高", color: "#E1352A" },
  { id: "medium", label: "中", color: "#E0561B" },
  { id: "low", label: "低", color: "#E5A100" },
]

const TAG_COLORS = [
  { id: "green", color: "#61BD4F", light: "#61BD4F20" },
  { id: "yellow", color: "#F2D600", light: "#F2D60020" },
  { id: "orange", color: "#FF9F1A", light: "#FF9F1A20" },
  { id: "red", color: "#EB5A46", light: "#EB5A4620" },
  { id: "purple", color: "#C377E0", light: "#C377E020" },
  { id: "blue", color: "#0079BF", light: "#0079BF20" },
  { id: "sky", color: "#00C2E0", light: "#00C2E020" },
  { id: "lime", color: "#51E898", light: "#51E89820" },
  { id: "pink", color: "#FF78CB", light: "#FF78CB20" },
  { id: "grey", color: "#838C91", light: "#838C9120" },
]

// DB helper: convert between app camelCase and DB snake_case
const migrateTag = (t) => typeof t === 'string' ? { text: t, color: TAG_COLORS[0].color } : t
const toDb = (t) => ({ id: t.id, title: t.title, description: t.description, column: t.column, priority: t.priority, start_date: t.startDate || null, end_date: t.endDate || null, tags: (t.tags || []).map(migrateTag), color: t.color || '#8B9DAF' })
const fromDb = (r) => ({ id: r.id, title: r.title, description: r.description || '', column: r.column, priority: r.priority, startDate: r.start_date || '', endDate: r.end_date || '', tags: (r.tags || []).map(migrateTag), color: r.color || '#8B9DAF' })

function App() {
  const [tasks, setTasks] = useState([])
  const [view, setView] = useState("board")
  const [editTask, setEditTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [dragItem, setDragItem] = useState(null)
  const [synced, setSynced] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("theme-dark") === "true" } catch { return false }
  })
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef(null)
  useEffect(() => {
    if (!showSettings) return
    const handler = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSettings])
  const [textSettings, setTextSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("text-settings")) || { size: 1, spacing: 1 } } catch { return { size: 1, spacing: 1 } }
  })
  useEffect(() => { localStorage.setItem("text-settings", JSON.stringify(textSettings)) }, [textSettings])
  const fontScale = [0.85, 1, 1.15, 1.3]
  const spacingScale = [0.9, 1, 1.15, 1.3]
  const fs = fontScale[textSettings.size] ?? 1
  const ls = spacingScale[textSettings.spacing] ?? 1

  const theme = dark
    ? { bg: "#3A3A5C", card: "bg-[#3B3B56]/60", cardBorder: "border-[#6B6B8A]/40", text: "text-neutral-100", textSub: "text-[#B0B0C8]", textMuted: "text-[#8888A6]", navBg: "bg-[#3B3B56]/60", inputBg: "bg-[#363650]/50", inputBorder: "border-[#6B6B8A]/35", pillBg: "bg-[#363650]/45", pillActive: "bg-[#52526E]/80", accent: "#FF6B2B", btnBg: "bg-[#FF6B2B]", btnHover: "hover:bg-[#E85A1A]", btnText: "text-white", contentText: "#D6D6D6", titleText: "#FF6B2B" }
    : { bg: "#DED5CC", card: "bg-white/65", cardBorder: "border-neutral-200/40", text: "text-neutral-900", textSub: "text-neutral-400", textMuted: "text-neutral-500", navBg: "bg-white/70", inputBg: "bg-white/60", inputBorder: "border-neutral-200/50", pillBg: "bg-neutral-100/60", pillActive: "bg-white", accent: "#F05917", btnBg: "bg-[#F05917]", btnHover: "hover:bg-[#d94e14]", btnText: "text-white", contentText: "#262626", titleText: "#1C1C1C" }

  useEffect(() => { localStorage.setItem("theme-dark", String(dark)) }, [dark])

  // Load tasks from Supabase on mount
  useEffect(() => {
    loadAssets()
    const fetchTasks = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
      if (error) {
        console.error('Supabase fetch error:', error)
        // Fallback to localStorage
        try { const s = localStorage.getItem("sketch-board-tasks"); setTasks(s ? JSON.parse(s) : INITIAL_TASKS) } catch { setTasks(INITIAL_TASKS) }
        setSynced(false)
      } else {
        setTasks(data.length > 0 ? data.map(fromDb) : INITIAL_TASKS)
        setSynced(true)
        // If first load with no data, seed initial tasks
        if (data.length === 0) {
          const { error: seedErr } = await supabase.from('tasks').insert(INITIAL_TASKS.map(toDb))
          if (seedErr) console.error('Seed error:', seedErr)
        }
      }
      setLoading(false)
    }
    fetchTasks()

    // Realtime subscription
    const channel = supabase.channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => {
            if (prev.find(t => t.id === payload.new.id)) return prev
            return [...prev, fromDb(payload.new)]
          })
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? fromDb(payload.new) : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
        setSynced(true)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Also save to localStorage as backup
  useEffect(() => { if (tasks.length > 0) localStorage.setItem("sketch-board-tasks", JSON.stringify(tasks)) }, [tasks])

  const [filterLabel, setFilterLabel] = useState(null)
  const filtered = useMemo(() => {
    let result = tasks
    if (search) { const q = search.toLowerCase(); result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) }
    if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority)
    if (filterLabel) result = result.filter((t) => (t.tags || []).some(tag => migrateTag(tag).text === filterLabel))
    return result
  }, [tasks, search, filterPriority, filterLabel])

  const handleSave = async (form) => {
    if (editTask) {
      const updated = { ...editTask, ...form }
      setTasks(tasks.map((t) => (t.id === editTask.id ? updated : t)))
      const { error } = await supabase.from('tasks').upsert(toDb(updated))
      if (error) { console.error('Update error:', error); setSynced(false) } else setSynced(true)
    } else {
      const newTask = { ...form, id: Date.now().toString() }
      setTasks([...tasks, newTask])
      const { error } = await supabase.from('tasks').insert(toDb(newTask))
      if (error) { console.error('Insert error:', error); setSynced(false) } else setSynced(true)
    }
    setEditTask(null)
  }
  const handleDelete = async (id) => {
    setTasks(tasks.filter((t) => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { console.error('Delete error:', error); setSynced(false) } else setSynced(true)
  }
  const handleDrop = async (id, col) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, column: col } : t)))
    const { error } = await supabase.from('tasks').update({ column: col }).eq('id', id)
    if (error) { console.error('Drop error:', error); setSynced(false) } else setSynced(true)
  }
  const handleUpdateDates = async (id, startDate, endDate) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, startDate, endDate } : t)))
    const { error } = await supabase.from('tasks').update({ start_date: startDate, end_date: endDate }).eq('id', id)
    if (error) { console.error('Date update error:', error); setSynced(false) } else setSynced(true)
  }
  const openNew = () => { setEditTask(null); setShowModal(true) }
  const openEdit = (t) => { setEditTask(t); setShowModal(true) }
  const globalLabels = useMemo(() => {
    const map = new Map()
    tasks.forEach(t => (t.tags || []).forEach(tag => { const mt = migrateTag(tag); if (!map.has(mt.text)) map.set(mt.text, mt) }))
    return [...map.values()]
  }, [tasks])

  const views = [
    { id: "board", label: "看板", icon: LayoutGrid },
    { id: "calendar", label: "月曆", icon: Calendar },
    { id: "gantt", label: "甘特圖", icon: BarChart3 },
  ]

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: dark ? '#3A3A5C' : '#DED5CC' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: '#F05917' }} />
        <span className={`text-sm font-medium ${theme.textMuted}`}>載入中...</span>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-hidden transition-colors duration-300" style={{ fontFamily: "'Inter', 'Noto Serif TC', sans-serif", background: dark ? '#3A3A5C' : '#DED5CC' }}>
      {/* Subtle blobs for glassmorphism depth */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className={`absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-2xl ${dark ? 'bg-neutral-700/20' : 'bg-neutral-300/25'}`} />
        <div className={`absolute top-1/3 right-0 h-96 w-96 rounded-full blur-2xl ${dark ? 'bg-neutral-600/15' : 'bg-neutral-200/30'}`} />
        <div className={`absolute bottom-0 left-1/3 h-80 w-80 rounded-full blur-2xl ${dark ? 'bg-[#FF6B2B]/10' : 'bg-[#F05917]/5'}`} />
      </div>
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${dark ? 'border-[#6B6B8A]/30 bg-[#3B3B56]/60' : 'border-neutral-200/50 bg-white/80'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className={`text-3xl font-black tracking-tight`} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.04em' }}>
              <span style={{ color: '#FF6B2B' }}>V</span><span className={theme.text}>.</span>
            </h1>
            <span className={`text-[15px] font-bold ${theme.textSub}`}>工作時程</span>
            {loading ? <Loader2 size={12} className="animate-spin" style={{ color: theme.accent }} /> : synced ? <Cloud size={12} className={theme.textMuted} /> : <CloudOff size={12} className={theme.textMuted} />}
          </div>
          <div className={`flex items-center gap-1 rounded-xl p-1 ${theme.pillBg}`}>
            {views.map((v) => (
              <button key={v.id} onClick={() => { setView(v.id); playSwitch() }}
                className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${view === v.id ? theme.text : `${theme.textMuted} hover:${theme.textSub}`}`}>
                {view === v.id && <motion.div layoutId="nav-pill" className={`absolute inset-0 rounded-lg shadow-sm ${theme.pillActive}`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                <span className="relative z-10 flex items-center gap-1.5"><v.icon size={15} />{v.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setDark(!dark); playClick() }}
              className={`rounded-xl p-2.5 transition-all ${dark ? 'bg-[#52526E] text-[#FFD580] hover:bg-[#5D5D7A]' : 'bg-neutral-100/60 text-neutral-500 hover:bg-neutral-200/60'}`}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="relative" ref={settingsRef}>
              <button onClick={() => { setShowSettings(!showSettings); playClick() }}
                className={`rounded-xl p-2.5 transition-all ${showSettings ? (dark ? 'bg-[#FF6B2B] text-white' : 'bg-[#F05917] text-white') : (dark ? 'bg-[#52526E] text-[#C8C8DC] hover:bg-[#5D5D7A]' : 'bg-neutral-100/60 text-neutral-500 hover:bg-neutral-200/60')}`}>
                <Type size={16} />
              </button>
              {showSettings && (
                <div className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border p-4 shadow-xl z-50 ${dark ? 'border-[#5D5D7A]/40 bg-[#3B3B56]/98' : 'border-neutral-200/50 bg-white/98'}`}>
                  <div className={`mb-3 text-[11px] font-bold uppercase tracking-widest ${theme.textSub}`}>文字設定</div>
                  <div className="space-y-3">
                    <div>
                      <div className={`mb-1.5 flex items-center justify-between text-[12px] font-medium ${theme.textSub}`}>
                        <span>字體大小</span>
                        <span className={`text-[11px] ${theme.textMuted}`}>{['小', '中', '大', '特大'][textSettings.size]}</span>
                      </div>
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <button key={i} onClick={() => { setTextSettings({...textSettings, size: i}); playClick() }}
                            className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${textSettings.size === i ? `${theme.btnBg} ${theme.btnText}` : `${dark ? 'bg-[#52526E] text-[#B0B0C8]' : 'bg-neutral-100 text-neutral-500'} hover:opacity-80`}`}>
                            {['S','M','L','XL'][i]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => { openNew(); playClick() }}
              className={`flex items-center gap-1.5 rounded-xl ${theme.btnBg} px-5 py-2.5 text-[13px] font-bold ${theme.btnText} shadow-sm transition-all ${theme.btnHover} active:scale-[0.98]`}>
              <Plus size={16} />新增任務
            </button>
          </div>
        </div>
      </nav>

      {/* Label Filter Bar */}
      {globalLabels.length > 0 && (
        <div className="mx-auto max-w-7xl px-8 pt-5">
          <div className={`flex items-center gap-2 overflow-x-auto rounded-xl border p-2.5 ${dark ? 'border-[#5D5D7A]/30 bg-[#3B3B56]/50' : 'border-white/10 bg-white/50'}`} style={{ backdropFilter: 'blur(12px)' }}>
            <Tag size={13} className={theme.textMuted} />
            <button onClick={() => { setFilterLabel(null); playClick() }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${!filterLabel ? `${theme.btnBg} ${theme.btnText}` : `${dark ? 'text-[#B0B0C8] hover:bg-[#52526E]' : 'text-neutral-500 hover:bg-neutral-100/80'}`}`}>
              全部
            </button>
            {globalLabels.map((lb) => (
              <button key={lb.text} onClick={() => { setFilterLabel(filterLabel === lb.text ? null : lb.text); playClick() }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${filterLabel === lb.text ? 'text-white shadow-sm' : 'hover:brightness-90'}`}
                style={filterLabel === lb.text ? { backgroundColor: lb.color } : { backgroundColor: `${lb.color}20`, color: lb.color }}>
                {lb.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-8 px-8 py-8">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <GlassCard className="p-5" intensity="light" dark={dark}>
            <div className="relative mb-5">
              <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input className={`w-full rounded-xl border ${theme.inputBorder} ${theme.inputBg} py-2.5 pl-9 pr-3 text-sm ${theme.text} placeholder-neutral-400 transition-all focus:outline-none`}
                placeholder="搜尋任務..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="mb-5">
              <div className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${theme.textSub}`}>
                <Filter size={12} />篩選
              </div>
              <div className="space-y-1">
                <button onClick={() => { setFilterPriority("all"); playClick() }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all ${filterPriority === "all" ? `${theme.pillActive} ${theme.text} shadow-sm` : `${theme.textMuted} hover:${theme.pillBg}`}`}>
                  全部
                </button>
                {PRIORITIES.map((p) => (
                  <button key={p.id} onClick={() => { setFilterPriority(p.id); playClick() }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all ${filterPriority === p.id ? `${theme.pillActive} ${theme.text} shadow-sm` : `${theme.textMuted} hover:${theme.pillBg}`}`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}優先
                  </button>
                ))}
              </div>
            </div>
            <div className={`space-y-2 border-t pt-4 ${dark ? 'border-[#5D5D7A]/30' : 'border-neutral-100/60'}`}>
              <div className={`text-[11px] font-bold uppercase tracking-widest ${theme.textSub}`}>統計</div>
              {COLUMNS.map((c) => {
                const count = tasks.filter((t) => t.column === c.id).length
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                    <span className={`text-[12px] font-medium ${theme.textMuted}`}>{c.label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${dark ? 'bg-[#52526E] text-[#C8C8DC]' : 'bg-white/80 text-neutral-700'}`}>{count}</span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </aside>

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {view === "board" && <BoardView key="board" tasks={filtered} columns={COLUMNS} onEdit={openEdit} onDrop={handleDrop} dragItem={dragItem} setDragItem={setDragItem} dark={dark} theme={theme} fs={fs} ls={ls} />}
            {view === "calendar" && <CalendarView key="calendar" tasks={filtered} onEdit={openEdit} dark={dark} theme={theme} fs={fs} ls={ls} />}
            {view === "gantt" && <GanttView key="gantt" tasks={filtered} onEdit={openEdit} onUpdateDates={handleUpdateDates} dark={dark} theme={theme} fs={fs} ls={ls} />}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showModal && (
          <TaskModal task={editTask} onSave={handleSave} onDelete={handleDelete} onClose={() => { setShowModal(false); setEditTask(null) }} dark={dark} theme={theme} globalLabels={globalLabels} />
        )}
      </AnimatePresence>
    </div>
  )
}

function BoardView({ tasks, columns, onEdit, onDrop, dragItem, setDragItem, dark, theme, fs, ls }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.column === col.id)
        return (
          <div key={col.id}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-[#F05917]") }}
            onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-[#F05917]") }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("ring-2", "ring-[#F05917]"); if (dragItem) { onDrop(dragItem, col.id); setDragItem(null) } }}
            className="rounded-2xl transition-all">
            <div className="mb-3 flex items-center gap-2 px-1">
              <col.icon size={15} style={{ color: col.accent }} />
              <span className={`text-[13px] font-bold ${theme.text}`} style={{ fontSize: `${14 * fs}px` }}>{col.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm ${dark ? 'bg-[#52526E] text-[#B0B0C8]' : 'bg-white/80 text-neutral-400'}`} style={{ fontSize: `${11 * fs}px` }}>{colTasks.length}</span>
            </div>
            <div className="space-y-2.5">
              {colTasks.map((task) => (
                <motion.div key={task.id} layout="position" layoutId={task.id}
                  draggable onDragStart={() => setDragItem(task.id)} onDragEnd={() => setDragItem(null)}
                  whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <GlassCard className="cursor-pointer p-4 transition-all hover:shadow-md" dark={dark} onClick={() => { onEdit(task); playClick() }}>
                    <div className="mb-2 flex items-start justify-between" style={{ marginBottom: `${8 * ls}px` }}>
                      <h4 className="font-black leading-snug" style={{ fontSize: `${17 * fs}px`, lineHeight: `${1.4 * ls}`, color: theme.titleText }}>{task.title}</h4>
                      <GripVertical size={14} className={theme.textMuted} />
                    </div>
                    {task.description && <p className="leading-relaxed font-semibold" style={{ fontSize: `${15 * fs}px`, lineHeight: `${1.5 * ls}`, marginBottom: `${12 * ls}px`, color: theme.contentText }}>{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag.text} className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: `${11 * fs}px`, backgroundColor: `${tag.color}20`, color: tag.color }}>{tag.text}</span>
                        ))}
                      </div>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITIES.find((p) => p.id === task.priority)?.color }} />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              {colTasks.length === 0 && (
                <div className={`flex h-[80px] items-center justify-center rounded-2xl border border-dashed ${dark ? 'border-[#5D5D7A]/40' : 'border-neutral-200/50'}`}>
                  <span className={`text-[12px] ${theme.textMuted}`}>拖曳任務到這裡</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

function CalendarView({ tasks, onEdit, dark, theme, fs, ls }) {
  const [curr, setCurr] = useState(new Date())
  const days = useMemo(() => {
    const year = curr.getFullYear()
    const month = curr.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    const result = []
    for (let i = firstDay - 1; i >= 0; i--) result.push({ day: prevMonthDays - i, type: "prev", date: null })
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      result.push({ day: i, type: "current", date: localDateStr(date), isToday: date.toDateString() === new Date().toDateString() })
    }
    const remaining = 42 - result.length
    for (let i = 1; i <= remaining; i++) result.push({ day: i, type: "next", date: null })
    return result
  }, [curr])
  const weekDays = ["日","一","二","三","四","五","六"]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-5xl">
      <GlassCard className="overflow-hidden" intensity="heavy" dark={dark}>
        <div className="flex items-center justify-between p-5">
          <h2 className={`text-lg font-black ${theme.text}`} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em', fontSize: `${18 * fs}px` }}>
            {curr.toLocaleDateString("zh-TW", { year: "numeric", month: "long" })}
          </h2>
          <div className={`flex items-center gap-1 rounded-lg p-0.5 ${theme.pillBg}`}>
            <button className={`rounded-md p-1.5 transition-all ${dark ? 'hover:bg-[#52526E]' : 'hover:bg-white'}`}
              onClick={() => { const d = new Date(curr); d.setMonth(d.getMonth() - 1); setCurr(d); playClick() }}>
              <ChevronLeft size={16} className={theme.textSub} />
            </button>
            <button onClick={() => { setCurr(new Date()); playClick() }} className={`px-2.5 py-1 font-semibold ${theme.textSub} hover:${theme.text}`} style={{ fontSize: `${12 * fs}px` }}>今天</button>
            <button className={`rounded-md p-1.5 transition-all ${dark ? 'hover:bg-[#52526E]' : 'hover:bg-white'}`}
              onClick={() => { const d = new Date(curr); d.setMonth(d.getMonth() + 1); setCurr(d); playClick() }}>
              <ChevronRight size={16} className={theme.textSub} />
            </button>
          </div>
        </div>
        <div className={`grid grid-cols-7 border-t py-2.5 ${dark ? 'border-[#5D5D7A]/30' : 'border-neutral-100/60'}`}>
          {weekDays.map((d) => (
            <div key={d} className={`text-center font-bold ${theme.textSub}`} style={{ fontSize: `${11 * fs}px` }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dayTasks = d.date ? tasks.filter((t) => d.date >= t.startDate && d.date <= t.endDate) : []
            return (
              <div key={i} className={`min-h-[100px] border-t p-2 transition-colors ${dark ? 'border-[#5D5D7A]/20 hover:bg-[#363650]/40' : 'border-neutral-100/40 hover:bg-white/40'} ${d.type !== "current" ? "opacity-30" : ""}`}>
                <span className={`mb-1 inline-flex h-6 w-6 items-center justify-center font-semibold ${d.isToday ? "rounded-full bg-[#F05917] text-white" : theme.text}`} style={{ fontSize: `${12 * fs}px` }}>{d.day}</span>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} onClick={() => { onEdit(t); playClick() }}
                      className="cursor-pointer truncate rounded-md px-1.5 py-0.5 font-medium transition-all hover:brightness-95"
                      style={{ backgroundColor: `${t.color}15`, borderLeft: `2px solid ${t.color}`, color: theme.contentText, fontSize: `${13 * fs}px`, fontWeight: 600 }}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className={`text-center font-medium ${theme.textSub}`} style={{ fontSize: `${9 * fs}px` }}>+{dayTasks.length - 3}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}

function GanttView({ tasks, onEdit, onUpdateDates, dark, theme, fs, ls }) {
  const [rangeDays, setRangeDays] = useState(21)
  const containerRef = useRef(null)
  const [ghost, setGhost] = useState(null) // { id, left, width, startDate, endDate }
  const ghostRef = useRef(null)
  const rafRef = useRef(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = useMemo(() => {
    const d = new Date(today); d.setDate(d.getDate() - Math.floor(rangeDays * 0.3)); return d
  }, [rangeDays])
  const dateRange = useMemo(() => Array.from({ length: rangeDays }, (_, i) => {
    const d = new Date(startDate); d.setDate(d.getDate() + i); return d
  }), [rangeDays, startDate])
  const todayIndex = dateRange.findIndex((d) => d.toDateString() === today.toDateString())
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)), [tasks])
  const getBarStyle = (task) => {
    const s = new Date(task.startDate); s.setHours(0, 0, 0, 0)
    const e = new Date(task.endDate); e.setHours(0, 0, 0, 0)
    const startIdx = Math.max(0, Math.round((s - startDate) / 86400000))
    const endIdx = Math.min(rangeDays - 1, Math.round((e - startDate) / 86400000))
    if (endIdx < 0 || startIdx >= rangeDays) return null
    return { left: `${(startIdx / rangeDays) * 100}%`, width: `${(Math.max(1, endIdx - startIdx + 1) / rangeDays) * 100}%` }
  }
  const handleBarDrag = (e, task, edge) => {
    e.stopPropagation(); e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dayW = rect.width / rangeDays
    const startX = e.clientX
    const origStart = new Date(task.startDate); origStart.setHours(0,0,0,0)
    const origEnd = new Date(task.endDate); origEnd.setHours(0,0,0,0)
    let lastDaysDelta = 0
    const computeGhost = (daysDelta) => {
      let newStart = new Date(origStart), newEnd = new Date(origEnd)
      if (edge === 'move') { newStart.setDate(newStart.getDate() + daysDelta); newEnd.setDate(newEnd.getDate() + daysDelta) }
      else if (edge === 'start') { newStart.setDate(newStart.getDate() + daysDelta); if (newStart >= newEnd) return null }
      else if (edge === 'end') { newEnd.setDate(newEnd.getDate() + daysDelta); if (newEnd <= newStart) return null }
      newStart.setHours(0,0,0,0); newEnd.setHours(0,0,0,0)
      const sIdx = Math.max(0, Math.round((newStart - startDate) / 86400000))
      const eIdx = Math.min(rangeDays - 1, Math.round((newEnd - startDate) / 86400000))
      if (eIdx < 0 || sIdx >= rangeDays) return null
      return { id: task.id, left: `${(sIdx / rangeDays) * 100}%`, width: `${(Math.max(1, eIdx - sIdx + 1) / rangeDays) * 100}%`, startDate: localDateStr(newStart), endDate: localDateStr(newEnd) }
    }
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const daysDelta = Math.round(dx / dayW)
      if (daysDelta === lastDaysDelta) return
      lastDaysDelta = daysDelta
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const g = computeGhost(daysDelta)
        ghostRef.current = g
        setGhost(g)
      })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      const final = ghostRef.current
      setGhost(null); ghostRef.current = null
      if (final) { onUpdateDates(final.id, final.startDate, final.endDate); playClick() }
    }
    // Show initial ghost (same position)
    const initialGhost = computeGhost(0)
    ghostRef.current = initialGhost
    setGhost(initialGhost)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <GlassCard className="overflow-hidden" intensity="heavy" dark={dark}>
        <div className="flex items-center justify-between p-5">
          <h2 className={`text-lg font-black ${theme.text}`} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em', fontSize: `${18 * fs}px` }}>甘特圖</h2>
          <div className={`flex items-center gap-1 rounded-lg p-0.5 ${theme.pillBg}`}>
            {[7, 14, 21, 30].map((d) => (
              <button key={d} onClick={() => { setRangeDays(d); playClick() }}
                className={`rounded-md px-2.5 py-1 font-semibold transition-all ${rangeDays === d ? `${theme.pillActive} ${theme.text} shadow-sm` : `${theme.textMuted} hover:${theme.text}`}`}
                style={{ fontSize: `${12 * fs}px` }}>
                {d}天
              </button>
            ))}
          </div>
        </div>
        <div className={`relative border-t ${dark ? 'border-[#5D5D7A]/30' : 'border-neutral-100/60'}`}>
          <div className={`flex border-b ${dark ? 'border-[#5D5D7A]/20' : 'border-neutral-100/40'}`}>
            {dateRange.map((d, i) => (
              <div key={i} className="flex-1 py-2 text-center" style={{ minWidth: 0 }}>
                <div className={`font-bold ${d.toDateString() === today.toDateString() ? theme.text : theme.textSub}`} style={{ fontSize: `${10 * fs}px` }}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
          {todayIndex >= 0 && (
            <div className={`pointer-events-none absolute top-0 bottom-0 z-10 w-px ${dark ? 'bg-[#FF6B2B]/60' : 'bg-neutral-400/40'}`} style={{ left: `${((todayIndex + 0.5) / rangeDays) * 100}%` }} />
          )}
          <div className="relative" ref={containerRef}>
            {sortedTasks.map((task) => {
              const style = getBarStyle(task)
              if (!style) return null
              return (
                <div key={task.id} className={`group flex items-center gap-3 border-b px-4 py-2.5 ${dark ? 'border-[#5D5D7A]/20' : 'border-neutral-50/40'}`}>
                  <div className="w-[140px] shrink-0 truncate font-black" style={{ fontSize: `${15 * fs}px`, color: theme.titleText }}>{task.title}</div>
                  <div className="relative h-7 flex-1">
                    {/* Ghost preview box during drag */}
                    {ghost && ghost.id === task.id && (
                      <div className="absolute top-0 h-full rounded-md pointer-events-none z-20 transition-[left,width] duration-75"
                        style={{ left: ghost.left, width: ghost.width, backgroundColor: `${task.color}30`, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 8px rgba(255,255,255,0.08)' }} />
                    )}
                    <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className={`absolute top-0 h-full rounded-md transition-all group-hover:brightness-95 ${ghost && ghost.id === task.id ? 'opacity-40' : ''}`}
                      style={{ left: style.left, width: style.width, originX: 0, backgroundColor: `${task.color}15`, borderLeft: `3px solid ${task.color}`, cursor: 'grab' }}
                      onMouseDown={(e) => handleBarDrag(e, task, 'move')}>
                      {/* Left resize handle */}
                      <div className="absolute left-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleBarDrag(e, task, 'start')} />
                      <span className="absolute inset-0 flex items-center truncate px-2 font-bold pointer-events-none" style={{ fontSize: `${13 * fs}px`, color: theme.contentText }}>{task.title}</span>
                      {/* Right resize handle */}
                      <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleBarDrag(e, task, 'end')} />
                    </motion.div>
                  </div>
                </div>
              )
            })}
            {sortedTasks.length === 0 && (
              <div className="flex h-[200px] items-center justify-center">
                <div className={`text-center text-sm ${theme.textSub}`}>
                  <BarChart3 className="mx-auto mb-2 opacity-30" size={32} />
                  <span>尚無任務</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function TaskModal({ task, onSave, onDelete, onClose, dark, theme, globalLabels }) {
  const [form, setForm] = useState(task ? { ...task, tags: (task.tags || []).map(migrateTag) } : {
    title: "", description: "", column: "todo", priority: "medium",
    startDate: localDateStr(new Date()),
    endDate: localDateStr(new Date(Date.now() + 7 * 86400000)),
    tags: [], color: MORANDI_COLORS[0]
  })
  const [tab, setTab] = useState("basic")
  const [tagInput, setTagInput] = useState("")
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0].color)
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return (globalLabels || []).filter(lb => !form.tags.find(t => t.text === lb.text))
    const q = tagInput.toLowerCase()
    return (globalLabels || []).filter(lb => lb.text.toLowerCase().includes(q) && !form.tags.find(t => t.text === lb.text))
  }, [tagInput, globalLabels, form.tags])
  const addTag = () => { if (tagInput.trim() && !form.tags.find(t => t.text === tagInput.trim())) { setForm({ ...form, tags: [...form.tags, { text: tagInput.trim(), color: selectedTagColor }] }); setTagInput(""); setShowTagSuggestions(false) } }
  const addExistingTag = (lb) => { if (!form.tags.find(t => t.text === lb.text)) { setForm({ ...form, tags: [...form.tags, lb] }); setTagInput(""); setShowTagSuggestions(false) } }
  const removeTag = (text) => setForm({ ...form, tags: form.tags.filter((x) => x.text !== text) })
  const inputClass = `w-full rounded-xl border ${dark ? 'border-[#6B6B8A]/35 bg-[#363650]/50 text-neutral-100' : 'border-neutral-200/60 bg-white/60 text-neutral-800'} px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${dark ? 'focus:ring-[#FF6B2B]/30' : 'focus:ring-neutral-200/50'}`
  const labelClass = `mb-1.5 block text-[12px] font-bold uppercase tracking-widest ${theme.textSub}`
  const tabs = [
    { id: "basic", label: "基本" },
    { id: "dates", label: "日期" },
    { id: "details", label: "詳細" }
  ]
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ willChange: 'opacity' }}>
      <div className={`absolute inset-0 ${dark ? 'bg-black/30' : 'bg-black/15'}`} onClick={onClose} />
      <motion.div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl ${dark ? 'border-[#5D5D7A]/40 bg-[#3B3B56]/95' : 'border-neutral-200/50 bg-white/90'}`}
        style={{ willChange: 'transform, opacity' }}
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className={`flex items-center justify-between border-b p-5 ${dark ? 'border-[#5D5D7A]/30' : 'border-neutral-100/60'}`}>
          <h3 className={`text-lg font-black ${theme.text}`} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
            {task ? "編輯任務" : "新增任務"}
          </h3>
          <button onClick={() => { onClose(); playClick() }} className={`rounded-full p-1.5 transition-all ${dark ? 'hover:bg-[#52526E]' : 'hover:bg-neutral-100/80'}`}>
            <X size={18} className={theme.textSub} />
          </button>
        </div>
        <div className={`flex border-b px-5 ${dark ? 'border-[#5D5D7A]/30' : 'border-neutral-100/60'}`}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); playClick() }}
              className={`relative px-4 py-3 text-[13px] font-bold transition-colors ${tab === t.id ? theme.text : `${theme.textSub} hover:${theme.text}`}`}>
              {t.label}
              {tab === t.id && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F05917] rounded-full" />}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {tab === "basic" && (
              <motion.div key="basic" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <label className={labelClass}>任務名稱</label>
                  <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="輸入任務名稱..." />
                </div>
                <div>
                  <label className={labelClass}>描述</label>
                  <textarea className={`${inputClass} min-h-[80px] resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="任務描述..." />
                </div>
                <div>
                  <label className={labelClass}>狀態</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLUMNS.map((c) => (
                      <button key={c.id} onClick={() => { setForm({ ...form, column: c.id }); playClick() }}
                        className={`rounded-xl px-2 py-2 text-[12px] font-bold transition-all ${form.column === c.id ? `${theme.btnBg} text-white shadow-md` : `${dark ? 'bg-[#52526E]/80 text-[#B0B0C8] hover:bg-[#5D5D7A]' : 'bg-neutral-50/80 text-neutral-500 hover:bg-neutral-100'}`}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>優先級</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => (
                      <button key={p.id} onClick={() => { setForm({ ...form, priority: p.id }); playClick() }}
                        className={`rounded-xl px-2 py-2 text-[12px] font-bold transition-all ${form.priority === p.id ? "text-white shadow-md" : "bg-neutral-50/80 text-neutral-500 hover:bg-neutral-100"}`}
                        style={form.priority === p.id ? { backgroundColor: p.color } : {}}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {tab === "dates" && (
              <motion.div key="dates" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <label className={labelClass}>開始日期</label>
                  <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>結束日期</label>
                  <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </motion.div>
            )}
            {tab === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <label className={labelClass}>標籤</label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {TAG_COLORS.map((tc) => (
                      <button key={tc.id} onClick={() => { setSelectedTagColor(tc.color); playClick() }}
                        className={`h-6 w-6 rounded-full transition-all ${selectedTagColor === tc.color ? 'ring-2 ring-offset-1 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: tc.color, ringColor: tc.color }} />
                    ))}
                  </div>
                  <div className="relative flex gap-2">
                    <input className={`${inputClass} flex-1`} value={tagInput}
                      onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true) }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="輸入或選擇標籤..." />
                    <button onClick={() => { addTag(); playClick() }} className={`rounded-xl px-4 text-[12px] font-bold text-white transition-all hover:brightness-90`} style={{ backgroundColor: selectedTagColor }}>加入</button>
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className={`absolute left-0 top-full z-50 mt-1 max-h-[140px] w-full overflow-y-auto rounded-xl border shadow-lg ${dark ? 'border-[#5D5D7A]/30 bg-[#3B3B56]/95' : 'border-white/10 bg-white/95'}`} style={{ backdropFilter: 'blur(12px)' }}>
                        {tagSuggestions.map((lb) => (
                          <button key={lb.text} onClick={() => { addExistingTag(lb); playClick() }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium transition-all ${dark ? 'text-[#C8C8DC] hover:bg-[#52526E]' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lb.color }} />
                            {lb.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((t) => (
                        <span key={t.text} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                          {t.text}<button onClick={() => { removeTag(t.text); playClick() }} className="opacity-60 hover:opacity-100"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={`flex items-center justify-between border-t p-5 ${dark ? 'border-[#5D5D7A]/30' : 'border-neutral-100/60'}`}>
          <div>
            {task && (
              <button onClick={() => { onDelete(task.id); onClose(); playClick() }}
                className={`rounded-xl px-4 py-2.5 text-[13px] font-bold text-red-400 transition-all ${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} hover:text-red-500`}>
                刪除任務
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onClose(); playClick() }} className={`rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all ${theme.textMuted} ${dark ? 'hover:bg-[#52526E]' : 'hover:bg-neutral-100/80'}`}>取消</button>
            <button onClick={() => { if (!form.title.trim()) return; onSave(form); onClose(); playClick() }}
              className={`rounded-xl ${theme.btnBg} px-5 py-2.5 text-[13px] font-bold ${theme.btnText} shadow-sm transition-all ${theme.btnHover} active:scale-[0.98]`}>
              {task ? "儲存變更" : "建立任務"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default App

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Search, X, GripVertical, Calendar, BarChart3, LayoutGrid,
  ChevronLeft, ChevronRight, Tag, Clock, AlertCircle, CheckCircle2,
  Circle, Timer, Sparkles, Filter, Loader2, Cloud, CloudOff
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

function GlassCard({ children, className = "", intensity = "medium", ...props }) {
  const bg = intensity === "heavy"
    ? "bg-white/75 backdrop-blur-2xl backdrop-saturate-[180%]"
    : intensity === "light"
    ? "bg-white/50 backdrop-blur-lg backdrop-saturate-150"
    : "bg-white/65 backdrop-blur-xl backdrop-saturate-[180%]"
  return (
    <div className={`rounded-2xl border border-neutral-200/40 shadow-sm ${bg} ${className}`} style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }} {...props}>
      {children}
    </div>
  )
}

const INITIAL_TASKS = [
  { id: "1", title: "設計系統規劃", description: "建立完整的設計系統文件與元件庫", column: "doing", priority: "high", startDate: "2025-01-15", endDate: "2025-02-15", tags: ["設計", "系統"], color: "#171717" },
  { id: "2", title: "前端開發框架", description: "選擇並建立前端開發框架", column: "todo", priority: "medium", startDate: "2025-02-01", endDate: "2025-03-01", tags: ["開發"], color: "#525252" },
  { id: "3", title: "使用者研究", description: "進行目標用戶的訪談與問卷調查", column: "done", priority: "high", startDate: "2025-01-01", endDate: "2025-01-20", tags: ["研究", "UX"], color: "#404040" },
  { id: "4", title: "API 架構設計", description: "設計 RESTful API 架構", column: "todo", priority: "low", startDate: "2025-02-15", endDate: "2025-03-10", tags: ["後端"], color: "#737373" },
  { id: "5", title: "效能優化", description: "Core Web Vitals 優化", column: "review", priority: "medium", startDate: "2025-01-25", endDate: "2025-02-20", tags: ["效能"], color: "#a3a3a3" },
]

const COLUMNS = [
  { id: "todo", label: "待辦", icon: Circle, accent: "#a3a3a3" },
  { id: "doing", label: "進行中", icon: Timer, accent: "#525252" },
  { id: "review", label: "審核中", icon: AlertCircle, accent: "#737373" },
  { id: "done", label: "完成", icon: CheckCircle2, accent: "#171717" },
]

const MORANDI_COLORS = ["#171717", "#404040", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#404040", "#737373", "#525252", "#a3a3a3"]

const PRIORITIES = [
  { id: "high", label: "高", color: "#171717" },
  { id: "medium", label: "中", color: "#737373" },
  { id: "low", label: "低", color: "#d4d4d4" },
]

// DB helper: convert between app camelCase and DB snake_case
const toDb = (t) => ({ id: t.id, title: t.title, description: t.description, column: t.column, priority: t.priority, start_date: t.startDate || null, end_date: t.endDate || null, tags: t.tags || [], color: t.color || '#8B9DAF' })
const fromDb = (r) => ({ id: r.id, title: r.title, description: r.description || '', column: r.column, priority: r.priority, startDate: r.start_date || '', endDate: r.end_date || '', tags: r.tags || [], color: r.color || '#8B9DAF' })

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

  const filtered = useMemo(() => {
    let result = tasks
    if (search) { const q = search.toLowerCase(); result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) }
    if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority)
    return result
  }, [tasks, search, filterPriority])

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
  const openNew = () => { setEditTask(null); setShowModal(true) }
  const openEdit = (t) => { setEditTask(t); setShowModal(true) }

  const views = [
    { id: "board", label: "看板", icon: LayoutGrid },
    { id: "calendar", label: "月曆", icon: Calendar },
    { id: "gantt", label: "甘特圖", icon: BarChart3 },
  ]

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f5f5f5' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-neutral-300" />
        <span className="text-sm font-medium text-neutral-400">載入中...</span>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Serif TC', sans-serif", background: '#f5f5f5' }}>
      {/* Subtle monochrome blobs for glassmorphism depth */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-neutral-300/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-neutral-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-neutral-400/15 blur-3xl" />
      </div>
      <nav className="sticky top-0 z-40 border-b border-neutral-200/50 bg-white/70 backdrop-blur-2xl backdrop-saturate-[180%]" style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
              W.
            </h1>
            <span className="text-[13px] font-medium text-neutral-400">工作時程</span>
            {loading ? <Loader2 size={12} className="animate-spin text-neutral-300" /> : synced ? <Cloud size={12} className="text-neutral-400" /> : <CloudOff size={12} className="text-neutral-400" />}
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-neutral-100/60 p-1">
            {views.map((v) => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${view === v.id ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"}`}>
                {view === v.id && <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                <span className="relative z-10 flex items-center gap-1.5"><v.icon size={15} />{v.label}</span>
              </button>
            ))}
          </div>
          <button onClick={openNew}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98]">
            <Plus size={16} />新增任務
          </button>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-8 px-8 py-8">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <GlassCard className="p-5" intensity="light">
            <div className="relative mb-5">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
              <input className="w-full rounded-xl border border-neutral-200/50 bg-white/60 py-2.5 pl-9 pr-3 text-sm text-neutral-800 placeholder-neutral-300 backdrop-blur-sm transition-all focus:border-neutral-300 focus:outline-none"
                placeholder="搜尋任務..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                <Filter size={12} />篩選
              </div>
              <div className="space-y-1">
                <button onClick={() => setFilterPriority("all")}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all ${filterPriority === "all" ? "bg-white/80 text-neutral-900 shadow-sm" : "text-neutral-500 hover:bg-white/40"}`}>
                  全部
                </button>
                {PRIORITIES.map((p) => (
                  <button key={p.id} onClick={() => setFilterPriority(p.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all ${filterPriority === p.id ? "bg-white/80 text-neutral-900 shadow-sm" : "text-neutral-500 hover:bg-white/40"}`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}優先
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 border-t border-neutral-100/60 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">統計</div>
              {COLUMNS.map((c) => {
                const count = tasks.filter((t) => t.column === c.id).length
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                    <span className="text-[12px] font-medium text-neutral-500">{c.label}</span>
                    <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-neutral-700">{count}</span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </aside>

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {view === "board" && <BoardView key="board" tasks={filtered} columns={COLUMNS} onEdit={openEdit} onDrop={handleDrop} dragItem={dragItem} setDragItem={setDragItem} />}
            {view === "calendar" && <CalendarView key="calendar" tasks={filtered} onEdit={openEdit} />}
            {view === "gantt" && <GanttView key="gantt" tasks={filtered} onEdit={openEdit} />}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showModal && (
          <TaskModal task={editTask} onSave={handleSave} onDelete={handleDelete} onClose={() => { setShowModal(false); setEditTask(null) }} />
        )}
      </AnimatePresence>
    </div>
  )
}

function BoardView({ tasks, columns, onEdit, onDrop, dragItem, setDragItem }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.column === col.id)
        return (
          <div key={col.id}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-neutral-200/60") }}
            onDragLeave={(e) => e.currentTarget.classList.remove("ring-2", "ring-neutral-200/60")}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("ring-2", "ring-neutral-200/60"); if (dragItem) { onDrop(dragItem, col.id); setDragItem(null) } }}
            className="rounded-2xl transition-all">
            <div className="mb-3 flex items-center gap-2 px-1">
              <col.icon size={15} style={{ color: col.accent }} />
              <span className="text-[13px] font-bold text-neutral-800">{col.label}</span>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-neutral-400 shadow-sm">{colTasks.length}</span>
            </div>
            <div className="space-y-2.5">
              {colTasks.map((task) => (
                <motion.div key={task.id} layout layoutId={task.id}
                  draggable onDragStart={() => setDragItem(task.id)} onDragEnd={() => setDragItem(null)}
                  whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                  <GlassCard className="cursor-pointer p-4 transition-all hover:shadow-md" onClick={() => onEdit(task)}>
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="text-[13px] font-bold leading-snug text-neutral-900">{task.title}</h4>
                      <GripVertical size={14} className="shrink-0 text-neutral-300" />
                    </div>
                    {task.description && <p className="mb-3 text-[11px] leading-relaxed text-neutral-400">{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-neutral-100/70 px-2 py-0.5 text-[10px] font-medium text-neutral-500">{tag}</span>
                        ))}
                      </div>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITIES.find((p) => p.id === task.priority)?.color }} />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              {colTasks.length === 0 && (
                <div className="flex h-[80px] items-center justify-center rounded-2xl border border-dashed border-neutral-200/50">
                  <span className="text-[12px] text-neutral-300">拖曳任務到這裡</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

function CalendarView({ tasks, onEdit }) {
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
      result.push({ day: i, type: "current", date: date.toISOString().split("T")[0], isToday: date.toDateString() === new Date().toDateString() })
    }
    const remaining = 42 - result.length
    for (let i = 1; i <= remaining; i++) result.push({ day: i, type: "next", date: null })
    return result
  }, [curr])
  const weekDays = ["日","一","二","三","四","五","六"]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-5xl">
      <GlassCard className="overflow-hidden" intensity="heavy">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-black text-neutral-900" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
            {curr.toLocaleDateString("zh-TW", { year: "numeric", month: "long" })}
          </h2>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100/60 p-0.5">
            <button className="rounded-md p-1.5 transition-all hover:bg-white"
              onClick={() => { const d = new Date(curr); d.setMonth(d.getMonth() - 1); setCurr(d) }}>
              <ChevronLeft size={16} className="text-neutral-600" />
            </button>
            <button onClick={() => setCurr(new Date())} className="px-2.5 py-1 text-[12px] font-semibold text-neutral-600 hover:text-neutral-900">今天</button>
            <button className="rounded-md p-1.5 transition-all hover:bg-white"
              onClick={() => { const d = new Date(curr); d.setMonth(d.getMonth() + 1); setCurr(d) }}>
              <ChevronRight size={16} className="text-neutral-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-t border-neutral-100/60 py-2.5">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-neutral-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dayTasks = d.date ? tasks.filter((t) => d.date >= t.startDate && d.date <= t.endDate) : []
            return (
              <div key={i} className={`min-h-[100px] border-t border-neutral-100/40 p-2 transition-colors hover:bg-white/40 ${d.type !== "current" ? "opacity-30" : ""}`}>
                <span className={`mb-1 inline-flex h-6 w-6 items-center justify-center text-[12px] font-semibold ${d.isToday ? "rounded-full bg-neutral-900 text-white" : "text-neutral-700"}`}>{d.day}</span>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} onClick={() => onEdit(t)}
                      className="cursor-pointer truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all hover:brightness-95"
                      style={{ backgroundColor: `${t.color}15`, borderLeft: `2px solid ${t.color}`, color: "#404040" }}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-center text-[9px] font-medium text-neutral-400">+{dayTasks.length - 3}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}

function GanttView({ tasks, onEdit }) {
  const [rangeDays, setRangeDays] = useState(21)
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
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <GlassCard className="overflow-hidden" intensity="heavy">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-black text-neutral-900" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>甘特圖</h2>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100/60 p-0.5">
            {[7, 14, 21, 30].map((d) => (
              <button key={d} onClick={() => setRangeDays(d)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-all ${rangeDays === d ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                {d}天
              </button>
            ))}
          </div>
        </div>
        <div className="relative border-t border-neutral-100/60">
          <div className="flex border-b border-neutral-100/40">
            {dateRange.map((d, i) => (
              <div key={i} className="flex-1 py-2 text-center" style={{ minWidth: 0 }}>
                <div className={`text-[10px] font-bold ${d.toDateString() === today.toDateString() ? "text-neutral-900" : "text-neutral-400"}`}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
          {todayIndex >= 0 && (
            <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-neutral-400/40" style={{ left: `${((todayIndex + 0.5) / rangeDays) * 100}%` }} />
          )}
          <div className="relative">
            {sortedTasks.map((task) => {
              const style = getBarStyle(task)
              if (!style) return null
              return (
                <div key={task.id} className="group flex items-center gap-3 border-b border-neutral-50/40 px-4 py-2.5">
                  <div className="w-[140px] shrink-0 truncate text-[12px] font-medium text-neutral-600">{task.title}</div>
                  <div className="relative h-7 flex-1">
                    <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      onClick={() => onEdit(task)} className="absolute top-0 h-full cursor-pointer rounded-md transition-all group-hover:brightness-95"
                      style={{ left: style.left, width: style.width, originX: 0, backgroundColor: `${task.color}15`, borderLeft: `3px solid ${task.color}` }}>
                      <span className="absolute inset-0 flex items-center truncate px-2 text-[10px] font-medium text-neutral-600">{task.title}</span>
                    </motion.div>
                  </div>
                </div>
              )
            })}
            {sortedTasks.length === 0 && (
              <div className="flex h-[200px] items-center justify-center">
                <div className="text-center text-sm text-neutral-400">
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

function TaskModal({ task, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(task ? { ...task } : {
    title: "", description: "", column: "todo", priority: "medium",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    tags: [], color: MORANDI_COLORS[0]
  })
  const [tab, setTab] = useState("basic")
  const [tagInput, setTagInput] = useState("")
  const addTag = () => { if (tagInput.trim() && !form.tags.includes(tagInput.trim())) { setForm({ ...form, tags: [...form.tags, tagInput.trim()] }); setTagInput("") } }
  const removeTag = (t) => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })
  const inputClass = "w-full rounded-xl border border-neutral-200/60 bg-white/60 px-3 py-2.5 text-sm text-neutral-800 backdrop-blur-sm transition-all focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-200/50"
  const labelClass = "mb-1.5 block text-[12px] font-bold text-neutral-400 uppercase tracking-widest"
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
      <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(4px)' }} />
      <motion.div className="relative w-full max-w-lg rounded-3xl border border-neutral-200/50 bg-white/85 shadow-2xl backdrop-blur-2xl backdrop-saturate-[180%]"
        style={{ willChange: 'transform, opacity', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="flex items-center justify-between border-b border-neutral-100/60 p-5">
          <h3 className="text-lg font-black text-neutral-900" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
            {task ? "編輯任務" : "新增任務"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1.5 transition-all hover:bg-neutral-100/80">
            <X size={18} className="text-neutral-400" />
          </button>
        </div>
        <div className="flex border-b border-neutral-100/60 px-5">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-4 py-3 text-[13px] font-bold transition-colors ${tab === t.id ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"}`}>
              {t.label}
              {tab === t.id && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-full" />}
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
                      <button key={c.id} onClick={() => setForm({ ...form, column: c.id })}
                        className={`rounded-xl px-2 py-2 text-[12px] font-bold transition-all ${form.column === c.id ? "bg-neutral-900 text-white shadow-md" : "bg-neutral-50/80 text-neutral-500 hover:bg-neutral-100"}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>優先級</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => (
                      <button key={p.id} onClick={() => setForm({ ...form, priority: p.id })}
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
                  <label className={labelClass}>顏色</label>
                  <div className="flex flex-wrap gap-2">
                    {MORANDI_COLORS.map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })}
                        className={`h-8 w-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-neutral-400 ring-offset-2 scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>標籤</label>
                  <div className="flex gap-2">
                    <input className={`${inputClass} flex-1`} value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="輸入標籤..." />
                    <button onClick={addTag} className="rounded-xl bg-neutral-900 px-4 text-[12px] font-bold text-white transition-all hover:bg-neutral-800">加入</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-neutral-100/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                          {t}<button onClick={() => removeTag(t)} className="text-neutral-400 hover:text-neutral-600"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100/60 p-5">
          <div>
            {task && (
              <button onClick={() => { onDelete(task.id); onClose() }}
                className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-red-400 transition-all hover:bg-red-50 hover:text-red-500">
                刪除任務
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-neutral-500 transition-all hover:bg-neutral-100/80">取消</button>
            <button onClick={() => { if (!form.title.trim()) return; onSave(form); onClose() }}
              className="rounded-xl bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98]">
              {task ? "儲存變更" : "建立任務"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default App

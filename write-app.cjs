const fs = require('fs');
const path = require('path');

const content = `import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion"
import {
  Plus, Search, X, GripVertical, Calendar, BarChart3, LayoutGrid,
  ChevronLeft, ChevronRight, Tag, Clock, AlertCircle, CheckCircle2,
  Circle, Timer, Sparkles, Filter, Loader2, Cloud, CloudOff, Sun, Moon, SlidersHorizontal, Type, Minus,
  ChevronDown, ArrowUpDown, Lightbulb
} from "lucide-react"
import { supabase } from "./supabaseClient"

function loadAssets() {
  if (!document.querySelector('link[href*="fonts.googleapis"]')) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Noto+Sans+TC:wght@400;500;700&display=swap"
    document.head.appendChild(link)
  }
}

const localDateStr = (d) => \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`

// Audio helpers \u2014 preload with 300% volume via Web Audio API
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
    ? (intensity === "heavy" ? "bg-white/[0.08] backdrop-blur-2xl backdrop-saturate-[130%]" : intensity === "light" ? "bg-white/[0.04] backdrop-blur-lg backdrop-saturate-[130%]" : "bg-white/[0.06] backdrop-blur-xl backdrop-saturate-[130%]")
    : (intensity === "heavy" ? "bg-white/75 backdrop-blur-2xl backdrop-saturate-[130%]" : intensity === "light" ? "bg-white/50 backdrop-blur-lg backdrop-saturate-[130%]" : "bg-white/65 backdrop-blur-xl backdrop-saturate-[130%]")
  const border = dark ? "border-white/[0.06]" : "border-neutral-200/30"
  const shadow = dark
    ? "shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]"
    : "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]"
  return (
    <div className={\`rounded-2xl border \${border} \${bg} \${shadow} transition-shadow duration-200 \${className}\`} style={{ WebkitBackdropFilter: 'blur(16px) saturate(130%)', willChange: 'transform', contain: 'layout style paint' }} {...props}>
      {children}
    </div>
  )
}

const INITIAL_TASKS = [
  { id: "1", title: "\\u8A2D\\u8A08\\u7CFB\\u7D71\\u898F\\u5283", description: "\\u5EFA\\u7ACB\\u5B8C\\u6574\\u7684\\u8A2D\\u8A08\\u7CFB\\u7D71\\u6587\\u4EF6\\u8207\\u5143\\u4EF6\\u5EAB", column: "doing", priority: "high", startDate: "2025-01-15", endDate: "2025-02-15", tags: [{text:"\\u8A2D\\u8A08",color:"#C377E0"},{text:"\\u7CFB\\u7D71",color:"#0079BF"}], color: "#171717" },
  { id: "2", title: "\\u524D\\u7AEF\\u958B\\u767C\\u67B6\\u69CB", description: "\\u9078\\u64C7\\u4E26\\u5EFA\\u7ACB\\u524D\\u7AEF\\u958B\\u767C\\u67B6\\u69CB", column: "todo", priority: "medium", startDate: "2025-02-01", endDate: "2025-03-01", tags: [{text:"\\u958B\\u767C",color:"#61BD4F"}], color: "#525252" },
  { id: "3", title: "\\u4F7F\\u7528\\u8005\\u7814\\u7A76", description: "\\u9032\\u884C\\u76EE\\u6A19\\u7528\\u6236\\u7684\\u8A2A\\u8AC7\\u8207\\u554F\\u5377\\u8ABF\\u67E5", column: "done", priority: "high", startDate: "2025-01-01", endDate: "2025-01-20", tags: [{text:"\\u7814\\u7A76",color:"#FF9F1A"},{text:"UX",color:"#FF78CB"}], color: "#404040" },
  { id: "4", title: "API \\u67B6\\u69CB\\u8A2D\\u8A08", description: "\\u8A2D\\u8A08 RESTful API \\u67B6\\u69CB", column: "todo", priority: "low", startDate: "2025-02-15", endDate: "2025-03-10", tags: [{text:"\\u5F8C\\u7AEF",color:"#00C2E0"}], color: "#737373" },
  { id: "5", title: "\\u6548\\u80FD\\u512A\\u5316", description: "Core Web Vitals \\u512A\\u5316", column: "review", priority: "medium", startDate: "2025-01-25", endDate: "2025-02-20", tags: [{text:"\\u6548\\u80FD",color:"#F2D600"}], color: "#a3a3a3" },
]

const COLUMNS = [
  { id: "todo", label: "\\u5F85\\u8FA6", icon: Circle, accent: "#a3a3a3" },
  { id: "doing", label: "\\u9032\\u884C\\u4E2D", icon: Timer, accent: "#525252" },
  { id: "review", label: "\\u5BE9\\u6838\\u4E2D", icon: AlertCircle, accent: "#737373" },
  { id: "done", label: "\\u5B8C\\u6210", icon: CheckCircle2, accent: "#6EA667" },
]

const MORANDI_COLORS = ["#171717", "#404040", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#404040", "#737373", "#525252", "#a3a3a3"]

const PRIORITIES = [
  { id: "high", label: "\\u9AD8", color: "#E1352A" },
  { id: "medium", label: "\\u4E2D", color: "#E0561B" },
  { id: "low", label: "\\u4F4E", color: "#E5A100" },
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
const migrateTag = (t) => {
  if (typeof t === 'string') {
    try { const p = JSON.parse(t); if (p && p.text) return p } catch {}
    return { text: t, color: TAG_COLORS[0].color }
  }
  if (t && typeof t === 'object' && t.text) return t
  return { text: String(t), color: TAG_COLORS[0].color }
}
const toDb = (t) => ({ id: t.id, title: t.title, description: t.description, column: t.column, priority: t.priority, start_date: t.startDate || null, end_date: t.endDate || null, tags: (t.tags || []).map(migrateTag), color: t.color || '#8B9DAF' })
const fromDb = (r) => ({ id: r.id, title: r.title, description: r.description || '', column: r.column, priority: r.priority, startDate: r.start_date || '', endDate: r.end_date || '', tags: (r.tags || []).map(migrateTag), color: r.color || '#8B9DAF' })

/* ============================================
   Swipe Hook \u2014 detect horizontal swipe gestures
   ============================================ */
function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null)
  const touchEnd = useRef(null)
  const minSwipeDistance = 50
  const onTouchStart = (e) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX }
  const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX }
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return
    const distance = touchStart.current - touchEnd.current
    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) onSwipeLeft()
      else onSwipeRight()
    }
  }
  return { onTouchStart, onTouchMove, onTouchEnd }
}

/* ============================================
   Bottom Sheet Component
   ============================================ */
function BottomSheet({ isOpen, onClose, children, dark, theme }) {
  const sheetRef = useRef(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)

  const handleDragStart = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStartY.current = clientY
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }
  const handleDragMove = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const diff = clientY - dragStartY.current
    if (diff > 0) {
      currentTranslateY.current = diff
      if (sheetRef.current) sheetRef.current.style.transform = \`translateY(\${diff}px)\`
    }
  }
  const handleDragEnd = () => {
    if (sheetRef.current) sheetRef.current.style.transition = ''
    if (currentTranslateY.current > 100) { onClose() }
    else if (sheetRef.current) sheetRef.current.style.transform = ''
    currentTranslateY.current = 0
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div className={\`absolute inset-0 \${dark ? 'bg-black/40' : 'bg-black/20'}\`} onClick={onClose} />
          <motion.div ref={sheetRef}
            className={\`relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl border shadow-2xl max-h-[85vh] overflow-y-auto \${dark ? 'border-white/[0.08] bg-[#1E2030]/98' : 'border-neutral-200/40 bg-white/95'}\`}
            style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
              onMouseDown={handleDragStart} onMouseMove={handleDragMove} onMouseUp={handleDragEnd}>
              <div className={\`h-1 w-10 rounded-full \${dark ? 'bg-white/20' : 'bg-neutral-300'}\`} />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

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

  // Bottom sheet state for Gantt detail
  const [sheetTask, setSheetTask] = useState(null)

  const theme = dark
    ? { bg: "#14161F", card: "bg-white/[0.06]", cardBorder: "border-white/[0.08]", text: "text-neutral-100", textSub: "text-neutral-400", textMuted: "text-neutral-400", navBg: "bg-white/[0.05]", inputBg: "bg-white/[0.08]", inputBorder: "border-white/[0.1]", pillBg: "bg-white/[0.06]", pillActive: "bg-white/[0.12]", accent: "#EA6B26", btnBg: "bg-[#EA6B26]", btnHover: "hover:bg-[#D45E1F]", btnText: "text-white", contentText: "#E0E0E8", titleText: "#EA6B26" }
    : { bg: "#DBD4B8", card: "bg-white/70", cardBorder: "border-neutral-200/30", text: "text-neutral-900", textSub: "text-neutral-400", textMuted: "text-neutral-500", navBg: "bg-[#E6DCC8]/80", inputBg: "bg-white/70", inputBorder: "border-neutral-200/40", pillBg: "bg-[#E0DCCA]/50", pillActive: "bg-[#E0DCCA]/90", accent: "#E85D3A", btnBg: "bg-[#E85D3A]", btnHover: "hover:bg-[#D04E2E]", btnText: "text-white", contentText: "#3A3A3A", titleText: "#1A1A1A" }

  useEffect(() => { localStorage.setItem("theme-dark", String(dark)) }, [dark])

  // Swipe to switch views
  const viewIds = ["board", "calendar", "gantt"]
  const swipeHandlers = useSwipe(
    () => { const idx = viewIds.indexOf(view); if (idx < viewIds.length - 1) { setView(viewIds[idx + 1]); playSwitch() } },
    () => { const idx = viewIds.indexOf(view); if (idx > 0) { setView(viewIds[idx - 1]); playSwitch() } }
  )

  // Reorderable view tabs state
  const [viewOrder, setViewOrder] = useState(() => {
    try { const s = localStorage.getItem("view-order"); return s ? JSON.parse(s) : ["board", "calendar", "gantt"] } catch { return ["board", "calendar", "gantt"] }
  })
  useEffect(() => { localStorage.setItem("view-order", JSON.stringify(viewOrder)) }, [viewOrder])

  // Load tasks from Supabase on mount
  useEffect(() => {
    loadAssets()
    const fetchTasks = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
      if (error) {
        console.error('Supabase fetch error:', error)
        try { const s = localStorage.getItem("sketch-board-tasks"); setTasks(s ? JSON.parse(s) : INITIAL_TASKS) } catch { setTasks(INITIAL_TASKS) }
        setSynced(false)
      } else {
        setTasks(data.length > 0 ? data.map(fromDb) : INITIAL_TASKS)
        setSynced(true)
        if (data.length === 0) {
          const { error: seedErr } = await supabase.from('tasks').insert(INITIAL_TASKS.map(toDb))
          if (seedErr) console.error('Seed error:', seedErr)
        }
      }
      setLoading(false)
    }
    fetchTasks()

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

  useEffect(() => { if (tasks.length > 0) localStorage.setItem("sketch-board-tasks", JSON.stringify(tasks)) }, [tasks])

  const [filterLabel, setFilterLabel] = useState(null)
  const [showInspiration, setShowInspiration] = useState(() => {
    try { return localStorage.getItem("show-inspiration") !== "false" } catch { return true }
  })
  useEffect(() => { localStorage.setItem("show-inspiration", String(showInspiration)) }, [showInspiration])
  const [boardSort, setBoardSort] = useState("default")
  const filtered = useMemo(() => {
    let result = tasks.filter(t => t.column !== "inspiration")
    if (search) { const q = search.toLowerCase(); result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) }
    if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority)
    if (filterLabel) result = result.filter((t) => (t.tags || []).some(tag => migrateTag(tag).text === filterLabel))
    return result
  }, [tasks, search, filterPriority, filterLabel])
  const inspirationTasks = useMemo(() => tasks.filter(t => t.column === "inspiration"), [tasks])

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

  const viewMeta = {
    board: { label: "\\u770B\\u677F", icon: LayoutGrid },
    calendar: { label: "\\u6708\\u66C6", icon: Calendar },
    gantt: { label: "\\u7518\\u7279\\u5716", icon: BarChart3 },
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: dark ? '#14161F' : '#DBD4B8' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: '#E85D3A' }} />
        <span className={\`text-sm font-medium \${theme.textMuted}\`}>\\u8F09\\u5165\\u4E2D...</span>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-hidden transition-colors duration-150" style={{ fontFamily: "'DM Sans', 'Noto Sans TC', sans-serif", background: dark ? '#14161F' : '#DBD4B8' }}
      {...swipeHandlers}>
      {/* Subtle blobs for glassmorphism depth */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className={\`absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-3xl \${dark ? 'bg-white/[0.02]' : 'bg-neutral-200/20'}\`} />
        <div className={\`absolute top-1/3 right-0 h-96 w-96 rounded-full blur-3xl \${dark ? 'bg-white/[0.015]' : 'bg-neutral-100/25'}\`} />
        <div className={\`absolute bottom-0 left-1/3 h-80 w-80 rounded-full blur-3xl \${dark ? 'bg-[#EA6B26]/[0.04]' : 'bg-[#E85D3A]/[0.03]'}\`} />
      </div>

      {/* ========== Top Nav \u2014 Mobile Responsive ========== */}
      <nav className={\`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-150 \${dark ? 'border-white/[0.06] bg-white/[0.04]' : 'border-neutral-200/40 bg-white/80'}\`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.04em' }}>
              <span style={{ color: dark ? '#EA6B26' : '#E85D3A' }}>V</span><span className={theme.text}>.</span>
            </h1>
            <span className={\`hidden sm:inline text-[15px] font-semibold \${theme.textSub}\`}>\\u5DE5\\u4F5C\\u6642\\u7A0B</span>
            {loading ? <Loader2 size={12} className="animate-spin" style={{ color: theme.accent }} /> : synced ? <Cloud size={12} className={theme.textMuted} /> : <CloudOff size={12} className={theme.textMuted} />}
          </div>

          {/* View Tabs \u2014 Reorderable via drag, swipe-friendly with 44px touch targets */}
          <div className={\`flex items-center gap-0.5 sm:gap-1 rounded-xl p-1 \${theme.pillBg} overflow-x-auto no-scrollbar\`}>
            <Reorder.Group axis="x" values={viewOrder} onReorder={setViewOrder} className="flex items-center gap-0.5 sm:gap-1" as="div">
              {viewOrder.map((vId) => {
                const v = viewMeta[vId]
                if (!v) return null
                return (
                  <Reorder.Item key={vId} value={vId} as="div" className="shrink-0"
                    whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                    <button onClick={() => { setView(vId); playSwitch() }}
                      className={\`relative flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] font-semibold transition-all min-h-[44px] min-w-[44px] justify-center \${view === vId ? theme.text : \`\${theme.textMuted}\`}\`}>
                      {view === vId && <motion.div layoutId="nav-pill" className={\`absolute inset-0 rounded-lg shadow-sm \${theme.pillActive}\`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <span className="relative z-10 flex items-center gap-1.5"><v.icon size={16} /><span className="hidden xs:inline">{v.label}</span></span>
                    </button>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button onClick={() => { setDark(!dark); playClick() }}
              className={\`rounded-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all \${dark ? 'bg-white/[0.08] text-[#EA6B26] hover:bg-white/[0.12]' : 'bg-neutral-100/60 text-neutral-500 hover:bg-neutral-200/60'}\`}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="relative" ref={settingsRef}>
              <button onClick={() => { setShowSettings(!showSettings); playClick() }}
                className={\`rounded-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all \${showSettings ? (dark ? 'bg-[#EA6B26] text-white' : 'bg-[#E85D3A] text-white') : (dark ? 'bg-white/[0.08] text-neutral-400 hover:bg-white/[0.12]' : 'bg-neutral-100/60 text-neutral-500 hover:bg-neutral-200/60')}\`}>
                <Type size={16} />
              </button>
              {showSettings && (
                <div className={\`absolute right-0 top-full mt-2 w-56 rounded-2xl border p-4 shadow-xl z-50 \${dark ? 'border-white/[0.08] bg-[#1E2030]/95' : 'border-neutral-200/40 bg-white/98'}\`}>
                  <div className={\`mb-3 text-[11px] font-bold uppercase tracking-widest \${theme.textSub}\`}>\\u6587\\u5B57\\u8A2D\\u5B9A</div>
                  <div className="space-y-3">
                    <div>
                      <div className={\`mb-2 flex items-center justify-between text-[12px] font-medium \${theme.textSub}\`}>
                        <span>\\u5B57\\u9AD4\\u5927\\u5C0F</span>
                        <span className={\`text-[11px] \${theme.textMuted}\`}>{['\\u5C0F', '\\u4E2D', '\\u5927', '\\u7279\\u5927'][textSettings.size]}</span>
                      </div>
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <button key={i} onClick={() => { setTextSettings({...textSettings, size: i}); playClick() }}
                            className={\`flex-1 rounded-lg py-1 text-[11px] font-bold transition-all \${textSettings.size === i ? \`\${theme.btnBg} \${theme.btnText}\` : \`\${dark ? 'bg-white/[0.08] text-neutral-400' : 'bg-neutral-100 text-neutral-500'} hover:opacity-80\`}\`}>
                            {['S','M','L','XL'][i]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* NEW button \u2014 prominent with ring highlight on mobile */}
            <button onClick={() => { openNew(); playClick() }}
              className={\`flex items-center justify-center gap-1.5 rounded-xl \${theme.btnBg} px-3 sm:px-6 py-2 text-[13px] font-bold \${theme.btnText} shadow-lg ring-2 ring-offset-1 transition-all \${theme.btnHover} active:scale-[0.97] min-h-[44px]\`}
              style={{ ringColor: dark ? '#EA6B26' : '#E85D3A', boxShadow: \`0 2px 12px \${dark ? 'rgba(234,107,38,0.3)' : 'rgba(232,93,58,0.25)'}\` }}>
              <Plus size={18} strokeWidth={2.5} /><span className="hidden sm:inline">\\u65B0\\u589E\\u4EFB\\u52D9</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Swipe indicator dots for mobile */}
      <div className="flex sm:hidden justify-center gap-2 pt-2 pb-1">
        {viewOrder.map((vId) => (
          <div key={vId} className={\`h-1.5 rounded-full transition-all duration-200 \${view === vId ? 'w-5' : 'w-1.5'}\`}
            style={{ backgroundColor: view === vId ? theme.accent : (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)') }} />
        ))}
      </div>

      {/* Label Filter Bar */}
      {globalLabels.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-3 sm:pt-5">
          <div className={\`flex items-center gap-2 overflow-x-auto rounded-xl border p-2 \${dark ? 'border-white/[0.06] bg-white/[0.04]' : 'border-neutral-200/20 bg-white/50'} no-scrollbar\`} style={{ backdropFilter: 'blur(12px)' }}>
            <Tag size={12} className={theme.textMuted} />
            <button onClick={() => { setFilterLabel(null); playClick() }}
              className={\`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all min-h-[36px] \${!filterLabel ? \`\${theme.btnBg} \${theme.btnText}\` : \`\${dark ? 'text-neutral-400 hover:bg-white/[0.08]' : 'text-neutral-500 hover:bg-neutral-100/80'}\`}\`}>
              \\u5168\\u90E8
            </button>
            {globalLabels.map((lb) => (
              <button key={lb.text} onClick={() => { setFilterLabel(filterLabel === lb.text ? null : lb.text); playClick() }}
                className={\`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all min-h-[36px] \${filterLabel === lb.text ? 'text-white shadow-sm' : 'hover:brightness-90'}\`}
                style={filterLabel === lb.text ? { backgroundColor: lb.color } : { backgroundColor: \`\${lb.color}20\`, color: lb.color }}>
                {lb.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-4 sm:gap-8 px-4 sm:px-8 py-4 sm:py-8">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <GlassCard className="p-6" intensity="light" dark={dark}>
            <div className="relative mb-6">
              <Search size={16} className={\`absolute left-3 top-1/2 -translate-y-1/2 \${theme.textMuted}\`} />
              <input className={\`w-full rounded-xl border \${theme.inputBorder} \${theme.inputBg} py-2 pl-9 pr-3 text-sm \${theme.text} placeholder-neutral-400 transition-all focus:outline-none\`}
                placeholder="\\u641C\\u5C0B\\u4EFB\\u52D9..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="mb-6">
              <div className={\`mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest \${theme.textSub}\`}>
                <Filter size={12} />\\u7BE9\\u9078
              </div>
              <div className="space-y-1">
                <button onClick={() => { setFilterPriority("all"); playClick() }}
                  className={\`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all \${filterPriority === "all" ? \`\${theme.pillActive} \${theme.text} shadow-sm\` : \`\${theme.textMuted}\`}\`}>
                  \\u5168\\u90E8
                </button>
                {PRIORITIES.map((p) => (
                  <button key={p.id} onClick={() => { setFilterPriority(p.id); playClick() }}
                    className={\`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all \${filterPriority === p.id ? \`\${theme.pillActive} \${theme.text} shadow-sm\` : \`\${theme.textMuted}\`}\`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}\\u512A\\u5148
                  </button>
                ))}
              </div>
            </div>
            <div className={\`space-y-2 border-t pt-4 \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}>
              <div className={\`text-[11px] font-bold uppercase tracking-widest \${theme.textSub}\`}>\\u7D71\\u8A08</div>
              {COLUMNS.map((c) => {
                const count = tasks.filter((t) => t.column === c.id).length
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1">
                    <span className={\`text-[12px] font-medium \${theme.textMuted}\`}>{c.label}</span>
                    <span className={\`rounded-full px-3 py-0.5 text-[11px] font-bold \${dark ? 'bg-white/[0.08] text-neutral-300' : 'bg-white/80 text-neutral-700'}\`}>{count}</span>
                  </div>
                )
              })}
            </div>
            {/* \\u9748\\u611F\\u6536\\u675F\\u5340 */}
            <div className={\`mt-4 border-t pt-4 \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", \`ring-[\${theme.accent}]\`) }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", \`ring-[\${theme.accent}]\`) }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("ring-2", \`ring-[\${theme.accent}]\`); if (dragItem) { handleDrop(dragItem, "inspiration"); setDragItem(null) } }}>
              <button onClick={() => { setShowInspiration(!showInspiration); playClick() }}
                className={\`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition-all \${dark ? 'hover:bg-white/[0.06]' : 'hover:bg-white/60'}\`}>
                <div className="flex items-center gap-2">
                  <Lightbulb size={12} style={{ color: '#F2D600' }} />
                  <span className={\`text-[11px] font-bold uppercase tracking-widest \${theme.textSub}\`}>\\u9748\\u611F</span>
                  <span className={\`rounded-full px-2 py-0.5 text-[10px] font-bold \${dark ? 'bg-white/[0.08] text-neutral-300' : 'bg-white/80 text-neutral-700'}\`}>{inspirationTasks.length}</span>
                </div>
                <ChevronDown size={12} className={\`\${theme.textMuted} transition-transform \${showInspiration ? '' : '-rotate-90'}\`} />
              </button>
              {showInspiration && (
                <div className="mt-2 space-y-1">
                  {inspirationTasks.length === 0 && (
                    <div className={\`rounded-lg border border-dashed p-3 text-center text-[11px] \${dark ? 'border-white/[0.08]' : 'border-neutral-200/50'} \${theme.textMuted}\`}>
                      \\u62D6\\u66F3\\u4EFB\\u52D9\\u5230\\u9019\\u88E1\\u6536\\u85CF\\u9748\\u611F
                    </div>
                  )}
                  {inspirationTasks.map((t) => (
                    <div key={t.id} draggable
                      onDragStart={() => setDragItem(t.id)} onDragEnd={() => setDragItem(null)}
                      onClick={() => { openEdit(t); playClick() }}
                      className={\`cursor-pointer rounded-lg px-3 py-2 text-[12px] font-medium transition-all \${dark ? 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08]' : 'bg-white/50 text-neutral-600 hover:bg-white/70'}\`}>
                      <div className="flex items-center gap-2">
                        <Lightbulb size={12} style={{ color: '#F2D600' }} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </aside>

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="popLayout">
            {view === "board" && <BoardView key="board" tasks={filtered} columns={COLUMNS} onEdit={openEdit} onDrop={handleDrop} dragItem={dragItem} setDragItem={setDragItem} dark={dark} theme={theme} fs={fs} ls={ls} boardSort={boardSort} setBoardSort={setBoardSort} />}
            {view === "calendar" && <CalendarView key="calendar" tasks={filtered} onEdit={openEdit} dark={dark} theme={theme} fs={fs} ls={ls} />}
            {view === "gantt" && <GanttView key="gantt" tasks={filtered} onEdit={openEdit} onUpdateDates={handleUpdateDates} dark={dark} theme={theme} fs={fs} ls={ls} onShowDetail={setSheetTask} />}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showModal && (
          <TaskModal task={editTask} onSave={handleSave} onDelete={handleDelete} onClose={() => { setShowModal(false); setEditTask(null) }} dark={dark} theme={theme} globalLabels={globalLabels} />
        )}
      </AnimatePresence>

      {/* Bottom Sheet for Gantt task detail */}
      <BottomSheet isOpen={!!sheetTask} onClose={() => setSheetTask(null)} dark={dark} theme={theme}>
        {sheetTask && (
          <div className="px-6 pb-6 pt-2">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className={\`text-lg font-bold mb-1 \${theme.text}\`} style={{ fontFamily: "'DM Sans', sans-serif", color: theme.titleText }}>{sheetTask.title}</h3>
                {sheetTask.description && <p className={\`text-sm leading-relaxed \${theme.textMuted}\`}>{sheetTask.description}</p>}
              </div>
              <span className="ml-3 h-3 w-3 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: PRIORITIES.find(p => p.id === sheetTask.priority)?.color }} />
            </div>
            <div className={\`flex flex-wrap gap-2 mb-4 text-[12px] font-medium \${theme.textSub}\`}>
              <div className={\`flex items-center gap-1.5 rounded-lg px-3 py-1.5 \${dark ? 'bg-white/[0.06]' : 'bg-neutral-100/60'}\`}>
                <Calendar size={12} />
                <span>{sheetTask.startDate || '\\u7121'}</span>
                <span className={theme.textMuted}>\\u2192</span>
                <span>{sheetTask.endDate || '\\u7121'}</span>
              </div>
              <div className={\`flex items-center gap-1.5 rounded-lg px-3 py-1.5 \${dark ? 'bg-white/[0.06]' : 'bg-neutral-100/60'}\`}>
                {COLUMNS.find(c => c.id === sheetTask.column)?.icon && (() => { const Icon = COLUMNS.find(c => c.id === sheetTask.column)?.icon; return <Icon size={12} /> })()}
                <span>{COLUMNS.find(c => c.id === sheetTask.column)?.label || sheetTask.column}</span>
              </div>
            </div>
            {sheetTask.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {sheetTask.tags.map(tag => {
                  const mt = migrateTag(tag)
                  return <span key={mt.text} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: \`\${mt.color}20\`, color: mt.color }}>{mt.text}</span>
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { openEdit(sheetTask); setSheetTask(null); playClick() }}
                className={\`flex-1 rounded-xl \${theme.btnBg} py-3 text-[13px] font-bold \${theme.btnText} transition-all \${theme.btnHover} active:scale-[0.98] min-h-[44px]\`}>
                \\u7DE8\\u8F2F\\u4EFB\\u52D9
              </button>
              <button onClick={() => { setSheetTask(null); playClick() }}
                className={\`rounded-xl px-6 py-3 text-[13px] font-bold transition-all min-h-[44px] \${dark ? 'bg-white/[0.08] text-neutral-300 hover:bg-white/[0.12]' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}\`}>
                \\u95DC\\u9589
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function BoardView({ tasks, columns, onEdit, onDrop, dragItem, setDragItem, dark, theme, fs, ls, boardSort, setBoardSort }) {
  const sortTasks = (list) => {
    if (boardSort === "newest") return [...list].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
    if (boardSort === "oldest") return [...list].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
    return list
  }
  const sortLabel = boardSort === "newest" ? "\\u6700\\u65B0" : boardSort === "oldest" ? "\\u6700\\u820A" : "\\u9810\\u8A2D"
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => { setBoardSort(boardSort === "default" ? "newest" : boardSort === "newest" ? "oldest" : "default"); playClick() }}
          className={\`flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-bold transition-all min-h-[36px] \${dark ? 'bg-white/[0.06] text-neutral-400 hover:bg-white/[0.1]' : 'bg-white/60 text-neutral-500 hover:bg-white/80'}\`}>
          <ArrowUpDown size={12} />{sortLabel}
        </button>
      </div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = sortTasks(tasks.filter((t) => t.column === col.id))
        return (
          <div key={col.id}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-[#E85D3A]") }}
            onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-[#E85D3A]") }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("ring-2", "ring-[#E85D3A]"); if (dragItem) { onDrop(dragItem, col.id); setDragItem(null) } }}
            className="rounded-2xl transition-all">
            <div className="mb-3 flex items-center gap-2 px-1">
              <col.icon size={16} style={{ color: col.accent }} />
              <span className={\`text-[13px] font-semibold \${theme.text}\`} style={{ fontSize: \`\${14 * fs}px\` }}>{col.label}</span>
              <span className={\`rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm \${dark ? 'bg-white/[0.1] text-neutral-300' : 'bg-white/80 text-neutral-400'}\`} style={{ fontSize: \`\${11 * fs}px\` }}>{colTasks.length}</span>
            </div>
            <div className="space-y-3">
              {colTasks.map((task) => (
                <motion.div key={task.id} layout="position" layoutId={task.id}
                  draggable onDragStart={() => setDragItem(task.id)} onDragEnd={() => setDragItem(null)}
                  whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                  <GlassCard className={\`cursor-pointer p-4 \${dark ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_16px_40px_rgba(0,0,0,0.2)]' : 'hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.05)]'}\`} dark={dark} onClick={() => { onEdit(task); playClick() }}>
                    <div className="mb-2 flex items-start justify-between" style={{ marginBottom: \`\${8 * ls}px\` }}>
                      <h4 className="font-bold leading-snug" style={{ fontSize: \`\${17 * fs}px\`, lineHeight: \`\${1.4 * ls}\`, color: theme.titleText }}>{task.title}</h4>
                      <GripVertical size={16} className={theme.textMuted} />
                    </div>
                    {task.description && <p className="leading-relaxed font-medium" style={{ fontSize: \`\${15 * fs}px\`, lineHeight: \`\${1.5 * ls}\`, marginBottom: \`\${12 * ls}px\`, color: theme.contentText }}>{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag.text} className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: \`\${11 * fs}px\`, backgroundColor: \`\${tag.color}20\`, color: tag.color }}>{tag.text}</span>
                        ))}
                      </div>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITIES.find((p) => p.id === task.priority)?.color }} />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              {colTasks.length === 0 && (
                <div className={\`flex h-[80px] items-center justify-center rounded-2xl border border-dashed \${dark ? 'border-white/[0.08]' : 'border-neutral-200/50'}\`}>
                  <span className={\`text-[12px] \${theme.textMuted}\`}>\\u62D6\\u66F3\\u4EFB\\u52D9\\u5230\\u9019\\u88E1</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </motion.div>
    </div>
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
  const weekDays = ["\\u65E5","\\u4E00","\\u4E8C","\\u4E09","\\u56DB","\\u4E94","\\u516D"]
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }} className="mx-auto max-w-5xl">
      <GlassCard className="overflow-hidden" intensity="heavy" dark={dark}>
        <div className="flex items-center justify-between p-4 sm:p-6">
          <h2 className={\`text-lg font-bold \${theme.text}\`} style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em', fontSize: \`\${18 * fs}px\` }}>
            {curr.toLocaleDateString("zh-TW", { year: "numeric", month: "long" })}
          </h2>
          <div className={\`flex items-center gap-1 rounded-lg p-1 \${theme.pillBg}\`}>
            <button className={\`rounded-md p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all \${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-white'}\`}
              onClick={() => { const d = new Date(curr); d.setMonth(d.getMonth() - 1); setCurr(d); playClick() }}>
              <ChevronLeft size={16} className={theme.textSub} />
            </button>
            <button onClick={() => { setCurr(new Date()); playClick() }} className={\`px-3 py-1 font-semibold min-h-[44px] flex items-center \${theme.textSub}\`} style={{ fontSize: \`\${12 * fs}px\` }}>\\u4ECA\\u5929</button>
            <button className={\`rounded-md p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all \${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-white'}\`}
              onClick={() => { const d = new Date(curr); d.setMonth(d.getMonth() + 1); setCurr(d); playClick() }}>
              <ChevronRight size={16} className={theme.textSub} />
            </button>
          </div>
        </div>
        <div className={\`grid grid-cols-7 border-t py-2 \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}>
          {weekDays.map((d) => (
            <div key={d} className={\`text-center font-bold \${theme.textSub}\`} style={{ fontSize: \`\${11 * fs}px\` }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dayTasks = d.date ? tasks.filter((t) => d.date >= t.startDate && d.date <= t.endDate) : []
            return (
              <div key={i} className={\`min-h-[60px] sm:min-h-[100px] border-t p-1 sm:p-2 transition-colors \${dark ? 'border-white/[0.04] hover:bg-white/[0.03]' : 'border-neutral-100/40 hover:bg-white/40'} \${d.type !== "current" ? "opacity-30" : ""}\`}>
                <span className={\`mb-1 inline-flex h-6 w-6 items-center justify-center font-semibold \${d.isToday ? "rounded-full bg-[#E85D3A] text-white" : theme.text}\`} style={{ fontSize: \`\${12 * fs}px\` }}>{d.day}</span>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} onClick={() => { onEdit(t); playClick() }}
                      className="cursor-pointer truncate rounded-lg px-1.5 sm:px-2 py-0.5 font-medium transition-all hover:brightness-95"
                      style={{ backgroundColor: \`\${t.color}35\`, borderLeft: \`2px solid \${t.color}\`, color: theme.contentText, fontSize: \`\${11 * fs}px\`, fontWeight: 600 }}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className={\`text-center font-medium \${theme.textSub}\`} style={{ fontSize: \`\${9 * fs}px\` }}>+{dayTasks.length - 3}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}

function GanttView({ tasks, onEdit, onUpdateDates, dark, theme, fs, ls, onShowDetail }) {
  const [rangeDays, setRangeDays] = useState(21)
  const containerRef = useRef(null)
  const [ghost, setGhost] = useState(null)
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
    return { left: \`\${(startIdx / rangeDays) * 100}%\`, width: \`\${(Math.max(1, endIdx - startIdx + 1) / rangeDays) * 100}%\` }
  }
  // Detect touch device
  const isTouchDevice = useRef('ontouchstart' in window)

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
      return { id: task.id, left: \`\${(sIdx / rangeDays) * 100}%\`, width: \`\${(Math.max(1, eIdx - sIdx + 1) / rangeDays) * 100}%\`, startDate: localDateStr(newStart), endDate: localDateStr(newEnd) }
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
    const initialGhost = computeGhost(0)
    ghostRef.current = initialGhost
    setGhost(initialGhost)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Handle bar click/tap \u2014 show bottom sheet on mobile, edit on desktop
  const handleBarClick = (e, task) => {
    if (isTouchDevice.current || window.innerWidth < 640) {
      onShowDetail(task)
    } else {
      onEdit(task)
    }
    playClick()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>
      <GlassCard className="overflow-hidden" intensity="heavy" dark={dark}>
        <div className="flex items-center justify-between p-4 sm:p-6">
          <h2 className={\`text-lg font-bold \${theme.text}\`} style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em', fontSize: \`\${18 * fs}px\` }}>\\u7518\\u7279\\u5716</h2>
          <div className={\`flex items-center gap-0.5 sm:gap-1 rounded-lg p-1 \${theme.pillBg}\`}>
            {[7, 14, 21, 30].map((d) => (
              <button key={d} onClick={() => { setRangeDays(d); playClick() }}
                className={\`rounded-md px-2.5 sm:px-3 py-1 font-semibold transition-all min-h-[36px] \${rangeDays === d ? \`\${theme.pillActive} \${theme.text} shadow-sm\` : \`\${theme.textMuted}\`}\`}
                style={{ fontSize: \`\${12 * fs}px\` }}>
                {d}\\u5929
              </button>
            ))}
          </div>
        </div>
        <div className={\`relative border-t \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}>
          <div className={\`flex border-b \${dark ? 'border-white/[0.04]' : 'border-neutral-100/40'}\`}>
            {dateRange.map((d, i) => (
              <div key={i} className="flex-1 py-2 text-center" style={{ minWidth: 0 }}>
                <div className={\`font-bold \${d.toDateString() === today.toDateString() ? theme.text : theme.textSub}\`} style={{ fontSize: \`\${10 * fs}px\` }}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
          {todayIndex >= 0 && (
            <div className={\`pointer-events-none absolute top-0 bottom-0 z-10 w-px \${dark ? 'bg-[#EA6B26]/40' : 'bg-neutral-400/40'}\`} style={{ left: \`\${((todayIndex + 0.5) / rangeDays) * 100}%\` }} />
          )}
          <div className="relative" ref={containerRef}>
            {sortedTasks.map((task) => {
              const style = getBarStyle(task)
              if (!style) return null
              return (
                  <div key={task.id} className={\`group flex items-center gap-2 sm:gap-3 border-b px-2 sm:px-4 py-2 \${dark ? 'border-white/[0.04]' : 'border-neutral-50/40'}\`}>
                  <div className="w-[90px] sm:w-[140px] shrink-0 truncate font-bold" style={{ fontSize: \`\${13 * fs}px\`, color: theme.titleText }}>{task.title}</div>
                  <div className="relative h-8 sm:h-7 flex-1">
                    {ghost && ghost.id === task.id && (
                      <div className="absolute top-0 h-full rounded-md pointer-events-none z-20 transition-[left,width] duration-75"
                        style={{ left: ghost.left, width: ghost.width, backgroundColor: \`\${task.color}50\`, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 8px rgba(255,255,255,0.08)' }} />
                    )}
                    <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={\`absolute top-0 h-full rounded-md transition-all active:scale-[1.02] active:brightness-110 \${ghost && ghost.id === task.id ? 'opacity-40' : ''}\`}
                      style={{ left: style.left, width: style.width, originX: 0, backgroundColor: \`\${task.color}35\`, borderLeft: \`3px solid \${task.color}\`, cursor: 'pointer' }}
                      onClick={(e) => handleBarClick(e, task)}
                      onMouseDown={(e) => { if (!isTouchDevice.current) handleBarDrag(e, task, 'move') }}>
                      <div className="absolute left-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                        onMouseDown={(e) => handleBarDrag(e, task, 'start')} />
                      <span className="absolute inset-0 flex items-center truncate px-2 font-bold pointer-events-none" style={{ fontSize: \`\${12 * fs}px\`, color: theme.contentText }}>{task.title}</span>
                      <div className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                        onMouseDown={(e) => handleBarDrag(e, task, 'end')} />
                    </motion.div>
                  </div>
                </div>
              )
            })}
            {sortedTasks.length === 0 && (
              <div className="flex h-[200px] items-center justify-center">
                <div className={\`text-center text-sm \${theme.textSub}\`}>
                  <BarChart3 className="mx-auto mb-2 opacity-30" size={32} />
                  <span>\\u5C1A\\u7121\\u4EFB\\u52D9</span>
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
  const inputClass = \`w-full rounded-xl border \${dark ? 'border-white/[0.1] bg-white/[0.08] text-neutral-100' : 'border-neutral-200/60 bg-white/60 text-neutral-800'} px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 \${dark ? 'focus:ring-[#EA6B26]/20' : 'focus:ring-neutral-200/50'}\`
  const labelClass = \`mb-2 block text-[12px] font-bold uppercase tracking-widest \${theme.textSub}\`
  const tabs = [
    { id: "basic", label: "\\u57FA\\u672C" },
    { id: "dates", label: "\\u65E5\\u671F" },
    { id: "details", label: "\\u8A73\\u7D30" }
  ]
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      style={{ willChange: 'opacity' }}>
      <div className={\`absolute inset-0 \${dark ? 'bg-black/30' : 'bg-black/15'}\`} onClick={onClose} />
      <motion.div className={\`relative w-full max-w-lg rounded-3xl border shadow-2xl \${dark ? 'border-white/[0.08] bg-[#1E2030]/95' : 'border-neutral-200/40 bg-white/90'}\`}
        style={{ willChange: 'transform, opacity' }}
        initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}>
        <div className={\`flex items-center justify-between border-b p-6 \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}>
          <h3 className={\`text-lg font-bold \${theme.text}\`} style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
            {task ? "\\u7DE8\\u8F2F\\u4EFB\\u52D9" : "\\u65B0\\u589E\\u4EFB\\u52D9"}
          </h3>
          <button onClick={() => { onClose(); playClick() }} className={\`rounded-full p-1.5 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center \${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-neutral-100/80'}\`}>
            <X size={18} className={theme.textSub} />
          </button>
        </div>
        <div className={\`flex border-b px-6 \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); playClick() }}
              className={\`relative px-4 py-3 text-[13px] font-bold transition-colors min-h-[44px] \${tab === t.id ? theme.text : \`\${theme.textSub}\`}\`}>
              {t.label}
              {tab === t.id && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D3A] rounded-full" />}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {tab === "basic" && (
              <motion.div key="basic" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <label className={labelClass}>\\u4EFB\\u52D9\\u540D\\u7A31</label>
                  <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="\\u8F38\\u5165\\u4EFB\\u52D9\\u540D\\u7A31..." />
                </div>
                <div>
                  <label className={labelClass}>\\u63CF\\u8FF0</label>
                  <textarea className={\`\${inputClass} min-h-[80px] resize-none\`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="\\u4EFB\\u52D9\\u63CF\\u8FF0..." />
                </div>
                <div>
                  <label className={labelClass}>\\u72C0\\u614B</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[...COLUMNS, { id: "inspiration", label: "\\u9748\\u611F" }].map((c) => (
                      <button key={c.id} onClick={() => { setForm({ ...form, column: c.id }); playClick() }}
                        className={\`rounded-xl px-2 py-2 text-[12px] font-bold transition-all min-h-[44px] \${form.column === c.id ? \`\${c.id === 'inspiration' ? 'bg-[#F2D600] text-neutral-900' : \`\${theme.btnBg} text-white\`} shadow-md\` : \`\${dark ? 'bg-white/[0.08] text-neutral-400 hover:bg-white/[0.12]' : 'bg-neutral-50/80 text-neutral-500 hover:bg-neutral-100'}\`}\`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>\\u512A\\u5148\\u7D1A</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => (
                      <button key={p.id} onClick={() => { setForm({ ...form, priority: p.id }); playClick() }}
                        className={\`rounded-xl px-2 py-2 text-[12px] font-bold transition-all min-h-[44px] \${form.priority === p.id ? "text-white shadow-md" : "bg-neutral-50/80 text-neutral-500 hover:bg-neutral-100"}\`}
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
                  <label className={labelClass}>\\u958B\\u59CB\\u65E5\\u671F</label>
                  <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>\\u7D50\\u675F\\u65E5\\u671F</label>
                  <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </motion.div>
            )}
            {tab === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <label className={labelClass}>\\u6A19\\u7C64</label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {TAG_COLORS.map((tc) => (
                      <button key={tc.id} onClick={() => { setSelectedTagColor(tc.color); playClick() }}
                        className={\`h-6 w-6 rounded-full transition-all min-h-[32px] min-w-[32px] \${selectedTagColor === tc.color ? 'ring-2 ring-offset-1 scale-110' : 'hover:scale-105'}\`}
                        style={{ backgroundColor: tc.color, ringColor: tc.color }} />
                    ))}
                  </div>
                  <div className="relative flex gap-2">
                    <input className={\`\${inputClass} flex-1\`} value={tagInput}
                      onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true) }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="\\u8F38\\u5165\\u6216\\u9078\\u64C7\\u6A19\\u7C64..." />
                    <button onClick={() => { addTag(); playClick() }} className={\`rounded-xl px-4 text-[12px] font-bold text-white transition-all hover:brightness-90 min-h-[44px]\`} style={{ backgroundColor: selectedTagColor }}>\\u52A0\\u5165</button>
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className={\`absolute left-0 top-full z-50 mt-1 max-h-[140px] w-full overflow-y-auto rounded-xl border shadow-lg \${dark ? 'border-white/[0.08] bg-[#1E2030]/95' : 'border-neutral-200/20 bg-white/95'}\`} style={{ backdropFilter: 'blur(12px)' }}>
                        {tagSuggestions.map((lb) => (
                          <button key={lb.text} onClick={() => { addExistingTag(lb); playClick() }}
                            className={\`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium transition-all min-h-[44px] \${dark ? 'text-neutral-300 hover:bg-white/[0.06]' : 'text-neutral-600 hover:bg-neutral-50'}\`}>
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lb.color }} />
                            {lb.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.tags.map((t) => (
                        <span key={t.text} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium"
                          style={{ backgroundColor: \`\${t.color}20\`, color: t.color }}>
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
        <div className={\`flex items-center justify-between border-t p-4 sm:p-6 \${dark ? 'border-white/[0.06]' : 'border-neutral-100/60'}\`}>
          <div>
            {task && (
              <button onClick={() => { onDelete(task.id); onClose(); playClick() }}
                className={\`rounded-xl px-4 py-2 text-[13px] font-bold text-red-400 transition-all min-h-[44px] \${dark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} hover:text-red-500\`}>
                \\u522A\\u9664\\u4EFB\\u52D9
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onClose(); playClick() }} className={\`rounded-xl px-4 sm:px-6 py-2 text-[13px] font-bold transition-all min-h-[44px] \${theme.textMuted} \${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-neutral-100/80'}\`}>\\u53D6\\u6D88</button>
            <button onClick={() => { if (!form.title.trim()) return; onSave(form); onClose(); playClick() }}
              className={\`rounded-xl \${theme.btnBg} px-4 sm:px-6 py-2 text-[13px] font-bold \${theme.btnText} shadow-sm transition-all min-h-[44px] \${theme.btnHover} active:scale-[0.98]\`}>
              {task ? "\\u5132\\u5B58\\u8B8A\\u66F4" : "\\u5EFA\\u7ACB\\u4EFB\\u52D9"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default App
`;

fs.writeFileSync(path.join(__dirname, 'src', 'App.jsx'), content, 'utf8');
console.log('App.jsx written successfully');

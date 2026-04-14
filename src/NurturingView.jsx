import { useState, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, DollarSign, FileText, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { playPickup, playClick } from "./utils/audio"
import { localDateStr } from "./utils/date"

/* \u57f9\u80b2\u4e2d\u5fc3 \u2014 Nurturing Dashboard
   \u8ffd\u8e64\u9577\u671f\u5275\u4f5c\u9805\u76ee\u7684\u300c\u751f\u9577\u6642\u9593\u300d
   \u8996\u89ba\u8a2d\u8a08\uff1a\u6578\u5b57\u5e8f\u5217\u611f DAY 0XX + \u5b57\u9593\u8ddd\u7f8e\u5b78
   \u4e0d\u7528 backdrop-filter\uff0c\u6539\u7528 rgba + \u7d30\u908a\u6846 */

function calcDays(startDate) {
  if (!startDate) return 0
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((now - start) / 86400000))
}

function formatDay(n) {
  return String(n).padStart(3, '0')
}

function NurturingCard({ task, dark, theme, fs, ls, onToggleExpand, expanded, onAddRecord, onUpdateNotes }) {
  const days = calcDays(task.startDate)
  const totalIncome = (task.incomeRecords || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [recordAmount, setRecordAmount] = useState("")
  const [recordNote, setRecordNote] = useState("")

  const handleSubmitRecord = () => {
    const amount = parseFloat(recordAmount)
    if (isNaN(amount) && !recordNote.trim()) return
    onAddRecord(task.id, {
      id: Date.now().toString(),
      date: localDateStr(new Date()),
      amount: isNaN(amount) ? 0 : amount,
      note: recordNote.trim()
    })
    setRecordAmount("")
    setRecordNote("")
    setShowRecordForm(false)
  }

  /* \u507d\u73bb\u7483\u64ec\u614b\uff1a\u7981\u7528 backdrop-filter\uff0c\u6539\u7528 rgba + 1px \u7d30\u908a\u6846 */
  const cardBg = dark ? "rgba(30,30,30,0.8)" : "rgba(255,255,255,0.75)"
  const cardBorder = dark ? "rgba(255,255,255,0.06)" : "rgba(200,200,200,0.3)"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: dark
          ? '0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)'
          : '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        contain: 'layout style paint'
      }}
    >
      {/* \u4e3b\u8996\u89ba\u5340 \u2014 DAY 0XX */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            {/* \u57f9\u80b2\u5929\u6578\uff1a\u5927\u5b57\u91cd\u6578\u5b57\u5e8f\u5217\u611f */}
            <div className="flex items-baseline gap-1" style={{ fontFamily: "'DM Sans', monospace" }}>
              <span
                className="font-black uppercase"
                style={{
                  fontSize: `${11 * fs}px`,
                  letterSpacing: '0.25em',
                  color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
                  lineHeight: 1
                }}
              >
                DAY
              </span>
              <span
                className="font-black tabular-nums"
                style={{
                  fontSize: `${42 * fs}px`,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  color: theme.titleText
                }}
              >
                {formatDay(days)}
              </span>
            </div>
            {/* \u4efb\u52d9\u540d\u7a31 */}
            <h3
              className="mt-2 font-bold leading-tight"
              style={{
                fontSize: `${16 * fs}px`,
                letterSpacing: '0.01em',
                color: theme.titleText
              }}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className="mt-1 leading-relaxed"
                style={{
                  fontSize: `${13 * fs}px`,
                  color: theme.contentText,
                  opacity: 0.7
                }}
              >
                {task.description}
              </p>
            )}
          </div>
          {/* \u53f3\u5074\u6458\u8981 */}
          <div className="text-right shrink-0 ml-4">
            {totalIncome > 0 && (
              <div
                className="font-bold tabular-nums"
                style={{
                  fontSize: `${14 * fs}px`,
                  color: '#6EA667',
                  letterSpacing: '-0.01em'
                }}
              >
                ${totalIncome.toLocaleString()}
              </div>
            )}
            <div
              className="mt-1"
              style={{
                fontSize: `${11 * fs}px`,
                color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                letterSpacing: '0.05em'
              }}
            >
              {task.startDate || '\u2014'}
            </div>
          </div>
        </div>

        {/* \u6a19\u7c64 */}
        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {task.tags.map(tag => (
              <span
                key={tag.text}
                className="rounded-full px-2.5 py-0.5 font-medium"
                style={{
                  fontSize: `${10 * fs}px`,
                  backgroundColor: `${tag.color}18`,
                  color: tag.color,
                  letterSpacing: '0.02em'
                }}
              >
                {tag.text}
              </span>
            ))}
          </div>
        )}

        {/* \u5c55\u958b/\u6536\u5408 */}
        <button
          onClick={() => onToggleExpand(task.id)}
          className="flex items-center gap-1.5 transition-all"
          style={{
            fontSize: `${11 * fs}px`,
            color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            letterSpacing: '0.08em'
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <span className="font-bold uppercase">{expanded ? '\u6536\u5408' : '\u5c55\u958b\u7d00\u9304'}</span>
          {(task.incomeRecords || []).length > 0 && (
            <span className="ml-1 opacity-60">({(task.incomeRecords || []).length})</span>
          )}
        </button>
      </div>

      {/* \u5c55\u958b\u5340\uff1a\u6642\u9593\u8ef8 + \u65b0\u589e\u8868\u55ae */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 sm:px-6 pb-5 sm:pb-6"
              style={{ borderTop: `1px solid ${cardBorder}` }}
            >
              {/* \u5099\u8a3b\u5340 */}
              <div className="mt-4 mb-4">
                <label
                  className="block mb-1.5 font-bold uppercase"
                  style={{
                    fontSize: `${10 * fs}px`,
                    letterSpacing: '0.15em',
                    color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
                  }}
                >
                  {'\u5099\u8A3B'}
                </label>
                <textarea
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none transition-all focus:outline-none"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    color: theme.contentText,
                    fontSize: `${13 * fs}px`,
                    minHeight: '60px'
                  }}
                  value={task.notes || ''}
                  onChange={(e) => onUpdateNotes(task.id, e.target.value)}
                  placeholder={'\u8a18\u9304\u60f3\u6cd5\u8207\u9032\u5c55...'}
                />
              </div>

              {/* \u6642\u9593\u8ef8 */}
              {(task.incomeRecords || []).length > 0 && (
                <div className="mb-4">
                  <div
                    className="font-bold uppercase mb-2"
                    style={{
                      fontSize: `${10 * fs}px`,
                      letterSpacing: '0.15em',
                      color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
                    }}
                  >
                    {'\u4E8B\u4EF6\u7D00\u9304'}
                  </div>
                  <div className="space-y-0">
                    {[...(task.incomeRecords || [])].reverse().map((record, idx) => (
                      <div key={record.id} className="flex items-start gap-3 py-2" style={{ borderBottom: idx < (task.incomeRecords || []).length - 1 ? `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>
                        {/* \u6642\u9593\u8ef8\u7dda\u689d */}
                        <div className="flex flex-col items-center shrink-0 mt-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: record.amount > 0 ? '#6EA667' : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span
                              className="font-medium tabular-nums"
                              style={{
                                fontSize: `${11 * fs}px`,
                                color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                                letterSpacing: '0.02em'
                              }}
                            >
                              {record.date}
                            </span>
                            {record.amount > 0 && (
                              <span
                                className="font-bold tabular-nums shrink-0"
                                style={{
                                  fontSize: `${12 * fs}px`,
                                  color: '#6EA667'
                                }}
                              >
                                +${record.amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {record.note && (
                            <p
                              className="mt-0.5 leading-relaxed"
                              style={{
                                fontSize: `${12 * fs}px`,
                                color: theme.contentText,
                                opacity: 0.7
                              }}
                            >
                              {record.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* \u65b0\u589e\u7d00\u9304 */}
              {!showRecordForm ? (
                <button
                  onClick={() => setShowRecordForm(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all"
                  style={{
                    fontSize: `${12 * fs}px`,
                    fontWeight: 600,
                    color: theme.accent,
                    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: `1px dashed ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  <Plus size={14} />
                  {'\u7D00\u9304\u4E8B\u4EF6'}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 rounded-lg p-3"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
                      <input
                        type="number"
                        className="w-full rounded-lg pl-8 pr-3 py-2 text-sm transition-all focus:outline-none"
                        style={{
                          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
                          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                          color: theme.contentText,
                          fontSize: `${13 * fs}px`
                        }}
                        value={recordAmount}
                        onChange={(e) => setRecordAmount(e.target.value)}
                        placeholder={'\u91D1\u984D'}
                      />
                    </div>
                  </div>
                  <input
                    className="w-full rounded-lg px-3 py-2 text-sm transition-all focus:outline-none"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
                      border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      color: theme.contentText,
                      fontSize: `${13 * fs}px`
                    }}
                    value={recordNote}
                    onChange={(e) => setRecordNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitRecord()}
                    placeholder={'\u5099\u8A3B\u5167\u5BB9'}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowRecordForm(false)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
                      style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                    >
                      {'\u53D6\u6D88'}
                    </button>
                    <button
                      onClick={handleSubmitRecord}
                      className="rounded-lg px-4 py-1.5 text-sm font-bold text-white transition-all"
                      style={{ backgroundColor: theme.accent }}
                    >
                      {'\u5132\u5B58'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NurturingView({ tasks, setTasks, dark, theme, fs, ls, supabase, toDb, setSynced }) {
  const [expandedIds, setExpandedIds] = useState(new Set())

  const nurturingTasks = useMemo(
    () => tasks.filter(t => t.isNurturing),
    [tasks]
  )

  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /* \u65b0\u589e\u4e8b\u4ef6\u7d00\u9304 */
  const handleAddRecord = useCallback(async (taskId, record) => {
    playPickup()
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return { ...t, incomeRecords: [...(t.incomeRecords || []), record] }
    }))
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const updated = { ...task, incomeRecords: [...(task.incomeRecords || []), record] }
      const { error } = await supabase.from('tasks').upsert(toDb(updated))
      if (error) { console.error('Record save error:', error); setSynced(false) } else setSynced(true)
    }
  }, [tasks, setTasks, supabase, toDb, setSynced])

  /* \u66f4\u65b0\u5099\u8a3b */
  const handleUpdateNotes = useCallback(async (taskId, notes) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes } : t))
    const { error } = await supabase.from('tasks').update({ notes }).eq('id', taskId)
    if (error) { console.error('Notes update error:', error); setSynced(false) } else setSynced(true)
  }, [setTasks, supabase, setSynced])

  /* \u5207\u63db isNurturing */
  const handleToggleNurturing = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const updated = { ...task, isNurturing: !task.isNurturing }
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
    const { error } = await supabase.from('tasks').upsert(toDb(updated))
    if (error) { console.error('Toggle nurturing error:', error); setSynced(false) } else setSynced(true)
  }, [tasks, setTasks, supabase, toDb, setSynced])

  /* \u53ef\u52a0\u5165\u57f9\u80b2\u7684\u4efb\u52d9 */
  const availableTasks = useMemo(
    () => tasks.filter(t => !t.isNurturing && t.column !== 'inspiration'),
    [tasks]
  )
  const [showAddMenu, setShowAddMenu] = useState(false)

  return (
    <div className="view-bounce-in">
      {/* \u9801\u9762\u6a19\u984c */}
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <h2
            className="font-black"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: `${28 * fs}px`,
              letterSpacing: '-0.03em',
              color: theme.titleText,
              lineHeight: 1
            }}
          >
            {'\u57F9\u80B2\u4E2D\u5FC3'}
          </h2>
          <p
            className="mt-1"
            style={{
              fontSize: `${12 * fs}px`,
              letterSpacing: '0.08em',
              color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              fontWeight: 500
            }}
          >
            NURTURING DASHBOARD
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 2px 12px ${dark ? 'rgba(234,107,38,0.3)' : 'rgba(232,93,58,0.25)'}`,
              minHeight: '44px'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">{'\u52A0\u5165\u57F9\u80B2'}</span>
          </button>
          {/* \u4efb\u52d9\u9078\u64c7\u4e0b\u62c9 */}
          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden z-50"
                style={{
                  background: dark ? 'rgba(30,32,48,0.98)' : 'rgba(255,255,255,0.98)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                }}
              >
                <div
                  className="px-3 py-2 font-bold uppercase"
                  style={{
                    fontSize: `${10 * fs}px`,
                    letterSpacing: '0.15em',
                    color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                  }}
                >
                  {'\u9078\u64C7\u4EFB\u52D9'}
                </div>
                <div className="max-h-[240px] overflow-y-auto py-1">
                  {availableTasks.length === 0 && (
                    <div
                      className="px-3 py-4 text-center"
                      style={{
                        fontSize: `${12 * fs}px`,
                        color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                      }}
                    >
                      {'\u6C92\u6709\u53EF\u52A0\u5165\u7684\u4EFB\u52D9'}
                    </div>
                  )}
                  {availableTasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { handleToggleNurturing(t.id); setShowAddMenu(false) }}
                      className="w-full text-left px-3 py-2.5 transition-all flex items-center gap-2"
                      style={{
                        fontSize: `${13 * fs}px`,
                        color: theme.contentText,
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* \u9ede\u64ca\u5916\u90e8\u95dc\u9589 */}
          {showAddMenu && (
            <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
          )}
        </div>
      </div>

      {/* Grid \u4f48\u5c40 */}
      {nurturingTasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-20"
          style={{
            background: dark ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.4)',
            border: `1px dashed ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <div
            className="font-black tabular-nums mb-2"
            style={{
              fontSize: `${48 * fs}px`,
              letterSpacing: '-0.02em',
              color: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              fontFamily: "'DM Sans', monospace"
            }}
          >
            000
          </div>
          <p
            className="font-bold uppercase"
            style={{
              fontSize: `${11 * fs}px`,
              letterSpacing: '0.15em',
              color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
            }}
          >
            {'\u5C1A\u7121\u57F9\u80B2\u4E2D\u7684\u9805\u76EE'}
          </p>
          <p
            className="mt-1"
            style={{
              fontSize: `${12 * fs}px`,
              color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
            }}
          >
            {'\u9EDE\u64CA\u53F3\u4E0A\u65B9\u300C\u52A0\u5165\u57F9\u80B2\u300D\u958B\u59CB\u8FFD\u8E64'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {nurturingTasks.map(task => (
            <NurturingCard
              key={task.id}
              task={task}
              dark={dark}
              theme={theme}
              fs={fs}
              ls={ls}
              expanded={expandedIds.has(task.id)}
              onToggleExpand={toggleExpand}
              onAddRecord={handleAddRecord}
              onUpdateNotes={handleUpdateNotes}
            />
          ))}
        </div>
      )}

      {/* \u57f9\u80b2\u4e2d\u7684\u4efb\u52d9\u53ef\u79fb\u9664 */}
      {nurturingTasks.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {nurturingTasks.map(t => (
            <button
              key={t.id}
              onClick={() => handleToggleNurturing(t.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all"
              style={{
                fontSize: `${11 * fs}px`,
                fontWeight: 600,
                color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
                background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              }}
            >
              <X size={12} />
              {'\u79FB\u9664'} {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NurturingView

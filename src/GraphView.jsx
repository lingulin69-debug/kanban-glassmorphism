import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  Panel,
  ConnectionLineType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Link2, Unlink, Maximize2 } from "lucide-react"
import { playClick } from "./utils/audio"

/* ========================================
   Handle 樣式常數
   ======================================== */
const HANDLE_SIZE = 12
const handleBaseStyle = (dark) => ({
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  background: dark ? "#EA6B26" : "#E85D3A",
  border: `2px solid ${dark ? "#1E2030" : "#fff"}`,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
})

/* ========================================
   Custom Node — GlassCard 風格 (React.memo)
   ======================================== */
const TaskNode = memo(function TaskNode({ data, selected, dragging }) {
  const { task, dark, theme, fs, onEdit, priorityColor } = data
  const accentColor = dark ? "#EA6B26" : "#E85D3A"
  const borderClr = dark ? "rgba(255,255,255,0.06)" : "rgba(200,200,200,0.3)"

  // 拖拽時和靜止時使用相同的不透明背景（避免 backdrop-filter 造成延遲）
  const containerStyle = {
    background: dark ? "rgba(38,38,35,0.95)" : "rgba(255,255,255,0.92)",
    border: `1.5px solid ${selected ? accentColor : borderClr}`,
    boxShadow: selected
      ? `0 0 0 2px ${accentColor}, 0 4px 12px rgba(0,0,0,0.15)`
      : dark
      ? "0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)"
      : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
    minWidth: 180,
    maxWidth: 260,
    willChange: "transform",
    contain: "layout style paint",
  }

  return (
    <div
      className="rounded-2xl cursor-pointer graph-node"
      style={containerStyle}
      onDoubleClick={() => { onEdit(task); playClick() }}
    >
      {/* Input handle — 左側 12px 實心圓 */}
      <Handle
        type="target"
        position={Position.Left}
        className="graph-handle"
        style={handleBaseStyle(dark)}
      />

      {/* 色條 */}
      <div
        className="rounded-t-2xl h-1.5"
        style={{ backgroundColor: task.color || "#8B9DAF" }}
      />

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className="font-bold leading-snug truncate"
            style={{ fontSize: `${14 * fs}px`, color: theme.titleText }}
          >
            {task.title}
          </h4>
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
            style={{ backgroundColor: priorityColor }}
          />
        </div>

        {task.description && (
          <p
            className="leading-relaxed font-medium truncate"
            style={{ fontSize: `${12 * fs}px`, color: theme.contentText, opacity: 0.7 }}
          >
            {task.description}
          </p>
        )}

        {task.tags?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.text}
                className="rounded-full px-2 py-0.5 font-medium"
                style={{ fontSize: `${10 * fs}px`, backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Output handle — 右側 12px 實心圓 */}
      <Handle
        type="source"
        position={Position.Right}
        className="graph-handle"
        style={handleBaseStyle(dark)}
      />
    </div>
  )
})

const nodeTypes = { task: TaskNode }

/* ========================================
   GraphView 主元件
   ======================================== */
export default function GraphView({
  tasks,
  onEdit,
  onSaveDeps,
  dark,
  theme,
  fs,
}) {
  const PRIORITIES_MAP = {
    high: "#EB5A46",
    medium: "#F2D600",
    low: "#61BD4F",
  }

  // 持久化座標映射 — useRef 確保整個生命週期共用一份位置表
  const positionsRef = useRef(() => {
    try {
      const s = localStorage.getItem("graph-node-positions")
      return s ? JSON.parse(s) : {}
    } catch {
      return {}
    }
  })
  // 初始化（只執行一次）
  if (typeof positionsRef.current === "function") {
    positionsRef.current = positionsRef.current()
  }

  // 儲存位置到 ref + localStorage
  const savePositions = useCallback((nodes) => {
    const pos = { ...positionsRef.current }
    nodes.forEach((n) => {
      pos[n.id] = { x: n.position.x, y: n.position.y }
    })
    positionsRef.current = pos
    localStorage.setItem("graph-node-positions", JSON.stringify(pos))
  }, [])

  // 轉換 tasks → React Flow nodes（嚴格從 positionsRef 讀取座標）
  const buildNodes = useCallback(
    (taskList) => {
      const saved = positionsRef.current
      // 計算每個 column 的 index（只為沒有座標的新任務用）
      const colCounts = {}
      return taskList.map((t) => {
        const col = { todo: 0, doing: 1, review: 2, done: 3, inspiration: 4 }[t.column] ?? 2
        const row = colCounts[col] || 0
        colCounts[col] = row + 1
        return {
          id: t.id,
          type: "task",
          position: saved[t.id] || { x: 80 + col * 320, y: 80 + row * 160 },
          data: {
            task: t,
            dark,
            theme,
            fs,
            onEdit,
            priorityColor: PRIORITIES_MAP[t.priority] || "#838C91",
          },
        }
      })
    },
    [dark, theme, fs, onEdit]
  )

  // 轉換 dependencies → React Flow edges
  const buildEdges = useCallback(
    (taskList) => {
      const edges = []
      const taskIds = new Set(taskList.map((t) => t.id))
      taskList.forEach((t) => {
        ;(t.dependencies || []).forEach((depId) => {
          if (taskIds.has(depId)) {
            edges.push({
              id: `e-${depId}-${t.id}`,
              source: depId,
              target: t.id,
              animated: false,
              style: { stroke: dark ? "#EA6B26" : "#E85D3A", strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: dark ? "#EA6B26" : "#E85D3A",
                width: 16,
                height: 16,
              },
            })
          }
        })
      })
      return edges
    },
    [dark]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(tasks))
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(tasks))

  // 連線模式
  const [linkMode, setLinkMode] = useState(false)

  // tasks 變動時同步節點資料（嚴格從 positionsRef 恢復座標，禁止自動排列）
  useEffect(() => {
    setNodes((prev) => {
      // 先把當前 React Flow 內的最新位置更新到 ref
      prev.forEach((n) => {
        positionsRef.current[n.id] = { x: n.position.x, y: n.position.y }
      })
      const saved = positionsRef.current
      const colCounts = {}
      return tasks.map((t) => {
        const col = { todo: 0, doing: 1, review: 2, done: 3, inspiration: 4 }[t.column] ?? 2
        const row = colCounts[col] || 0
        colCounts[col] = row + 1
        return {
          id: t.id,
          type: "task",
          position: saved[t.id] || { x: 80 + col * 320, y: 80 + row * 160 },
          data: {
            task: t,
            dark,
            theme,
            fs,
            onEdit,
            priorityColor: PRIORITIES_MAP[t.priority] || "#838C91",
          },
        }
      })
    })
    setEdges(buildEdges(tasks))
  }, [tasks, dark, theme, fs, onEdit])

  // 檢測循環依賴
  const wouldCreateCycle = useCallback((source, target) => {
    const visited = new Set()
    const dfs = (nodeId) => {
      if (nodeId === target) return false
      if (nodeId === source) return true
      if (visited.has(nodeId)) return false
      visited.add(nodeId)
      const task = tasks.find(t => t.id === nodeId)
      return (task?.dependencies || []).some(dep => dfs(dep))
    }
    return dfs(source)
  }, [tasks])

  // 新增連線 → 更新 dependencies
  const onConnect = useCallback(
    (params) => {
      if (params.source === params.target) return
      if (wouldCreateCycle(params.source, params.target)) {
        console.warn('Cyclic dependency detected, connection rejected')
        return
      }
      setEdges((eds) => addEdge({
        ...params,
        animated: false,
        style: { stroke: dark ? "#EA6B26" : "#E85D3A", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: dark ? "#EA6B26" : "#E85D3A",
          width: 16,
          height: 16,
        },
      }, eds))
      playClick()
      // 更新目標任務的 dependencies
      const targetTask = tasks.find((t) => t.id === params.target)
      if (targetTask) {
        const deps = [...new Set([...(targetTask.dependencies || []), params.source])]
        onSaveDeps(params.target, deps)
      }
    },
    [dark, tasks, onSaveDeps, wouldCreateCycle]
  )

  // 刪除邊 → 更新 dependencies
  const onEdgesDelete = useCallback(
    (deletedEdges) => {
      deletedEdges.forEach((edge) => {
        const targetTask = tasks.find((t) => t.id === edge.target)
        if (targetTask) {
          const deps = (targetTask.dependencies || []).filter(
            (d) => d !== edge.source
          )
          onSaveDeps(edge.target, deps)
        }
      })
    },
    [tasks, onSaveDeps]
  )

  // 節點拖拽結束 → 存位置到 ref + localStorage
  const onNodeDragStop = useCallback(
    (_, node, allNodes) => {
      savePositions(allNodes)
    },
    [savePositions]
  )

  // 手動自動重排（僅點擊按鈕時執行）
  const handleAutoLayout = useCallback(() => {
    setNodes((prev) => {
      const colCounts = {}
      const updated = prev.map((n) => {
        const task = tasks.find((t) => t.id === n.id)
        const col = task ? ({ todo: 0, doing: 1, review: 2, done: 3, inspiration: 4 }[task.column] ?? 2) : 2
        const row = colCounts[col] || 0
        colCounts[col] = row + 1
        return {
          ...n,
          position: { x: 80 + col * 320, y: 80 + row * 160 },
        }
      })
      savePositions(updated)
      return updated
    })
  }, [tasks, savePositions])

  // React Flow 主題色
  const rfStyle = useMemo(
    () => ({
      background: "transparent",
    }),
    []
  )

  return (
    <div className="view-bounce-in" style={{ height: "calc(100vh - 200px)", minHeight: 400 }}>
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          height: "100%",
          background: dark
            ? "rgba(26,26,25,0.95)"
            : "rgba(245,242,235,0.95)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(200,200,200,0.3)"}`,
          boxShadow: dark
            ? "0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)"
            : "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          style={rfStyle}
          connectionLineType={ConnectionLineType.Bezier}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          connectOnClick={linkMode}
          deleteKeyCode="Delete"
          proOptions={{ hideAttribution: true }}
          colorMode={dark ? "dark" : "light"}
        >
          <Background
            color={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}
            gap={24}
            size={1}
          />
          <Controls
            showInteractive={false}
            style={{
              background: dark ? "rgba(38,38,35,0.9)" : "rgba(255,255,255,0.9)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(200,200,200,0.3)"}`,
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <MiniMap
            nodeColor={(n) => n.data?.task?.color || "#8B9DAF"}
            maskColor={dark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"}
            style={{
              background: dark ? "rgba(38,38,35,0.8)" : "rgba(255,255,255,0.8)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(200,200,200,0.3)"}`,
              borderRadius: 12,
            }}
          />
          {/* 工具面板 */}
          <Panel position="top-right">
            <div
              className="flex items-center gap-1 rounded-xl p-1"
              style={{
                background: dark ? "rgba(38,38,35,0.9)" : "rgba(255,255,255,0.9)",
                border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(200,200,200,0.3)"}`,
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => { setLinkMode(!linkMode); playClick() }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all min-h-[36px] ${
                  linkMode
                    ? "text-white shadow-sm"
                    : dark
                    ? "text-neutral-400 hover:bg-white/[0.08]"
                    : "text-neutral-500 hover:bg-neutral-100/80"
                }`}
                style={
                  linkMode
                    ? { backgroundColor: dark ? "#EA6B26" : "#E85D3A" }
                    : {}
                }
                title="切換連線模式：點擊兩個節點即可建立依賴關係"
              >
                {linkMode ? <Unlink size={14} /> : <Link2 size={14} />}
                <span>{linkMode ? "取消連線" : "建立連線"}</span>
              </button>
              <button
                onClick={() => { handleAutoLayout(); playClick() }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all min-h-[36px] ${
                  dark
                    ? "text-neutral-400 hover:bg-white/[0.08]"
                    : "text-neutral-500 hover:bg-neutral-100/80"
                }`}
                title="自動排列所有節點"
              >
                <Maximize2 size={14} />
                <span>自動排列</span>
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

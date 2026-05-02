import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import type { AppState, Theme } from '../types'
import { DEFAULT_PRODUCT_TYPES } from '../types'
import { loadState, saveState } from '../utils/storage'
import { appReducer } from './reducers/appReducer'

// ── 撤销历史配置 ────────────────────────────────────────────
const MAX_UNDO = 20
const UNDOABLE_ACTIONS = new Set([
  'ADD_ORDER', 'UPDATE_ORDER', 'DELETE_ORDER', 'BATCH_DELETE',
  'SET_STATUS', 'BATCH_SET_STATUS', 'ADD_PAYMENT', 'ADD_REFUND',
  'ADD_PROGRESS', 'IMPORT_DATA', 'CLEAR_ALL',
])

// ── Context Types ──────────────────────────────────────────────
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<any>
  productTypes: string[]
  genId: () => string
  theme: Theme
  setTheme: (t: Theme) => void
  // 撤销/重做
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  historyLength: number  // 可撤销步数
}

const AppContext = createContext<AppContextType | null>(null)

// ── Theme CSS variable maps ────────────────────────────────────
const THEME_VARS: Record<Theme, Record<string, string>> = {
  'warm-pink': {
    '--primary': '#a78bfa',
    '--primary-soft': 'rgba(167,139,250,.1)',
    '--primary-mid': '#8b5cf6',
    '--pink': '#f5a0b0',
    '--pink-soft': 'rgba(245,160,176,.1)',
    '--accent': '#cca273',
    '--accent-soft': 'rgba(204,162,115,.1)',
    '--blue': '#7dd3fc',
    '--blue-soft': 'rgba(125,211,252,.12)',
    '--danger': '#f43f5e',
    '--success': '#34d399',
    '--text': '#2d3748',
    '--text-muted': '#64748b',
    '--text-hint': '#94a3b8',
    '--bg': '#fff9fb',
    '--bg-solid': '#fff9fb',
    '--card': '#ffffff',
    '--border': '#f0e0e6',
  },
  'clean-purple': {
    '--primary': '#7c3aed',
    '--primary-soft': 'rgba(124,58,237,.08)',
    '--primary-mid': '#6d28d9',
    '--pink': '#7c3aed',
    '--pink-soft': 'rgba(124,58,237,.08)',
    '--accent': '#f59e0b',
    '--accent-soft': 'rgba(245,158,11,.1)',
    '--blue': '#3b82f6',
    '--blue-soft': 'rgba(59,130,246,.1)',
    '--danger': '#ef4444',
    '--success': '#22c55e',
    '--text': '#1e293b',
    '--text-muted': '#64748b',
    '--text-hint': '#94a3b8',
    '--bg': '#f8fafc',
    '--bg-solid': '#f8fafc',
    '--card': '#ffffff',
    '--border': '#e2e8f0',
  },
  'journal': {
    '--primary': '#7c6a58',
    '--primary-soft': 'rgba(124,106,88,.08)',
    '--primary-mid': '#5c4d3d',
    '--pink': '#9b7bb8',
    '--pink-soft': 'rgba(155,123,184,.12)',
    '--accent': '#7a9e7e',
    '--accent-soft': 'rgba(122,158,126,.12)',
    '--blue': '#7a9e7e',
    '--blue-soft': 'rgba(122,158,126,.12)',
    '--danger': '#c45c4a',
    '--success': '#5a8a6a',
    '--text': '#3d3428',
    '--text-muted': '#6b5d4d',
    '--text-hint': '#8c7b68',
    '--bg': '#fdf8ef',
    '--bg-solid': '#fdf8ef',
    '--card': '#fffdf7',
    '--border': '#e8dcc8',
  },
}

function applyTheme(theme: Theme) {
  const vars = THEME_VARS[theme]
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  
  // Theme-specific body-level changes
  if (theme === 'clean-purple') {
    document.body.setAttribute('data-theme', 'clean-purple')
    document.body.removeAttribute('data-journal')
  } else if (theme === 'journal') {
    document.body.setAttribute('data-journal', '')
    document.body.removeAttribute('data-theme')
  } else {
    document.body.removeAttribute('data-theme')
    document.body.removeAttribute('data-journal')
  }
}

// ── Provider ───────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchBase] = useReducer(appReducer, null, loadState)
  
  // 撤销/重做历史栈（用 state 追踪以触发重渲染）
  const pastRef = useRef<AppState[]>([])
  const futureRef = useRef<AppState[]>([])
  const [historyLength, setHistoryLength] = React.useState(0)
  const [canRedoState, setCanRedoState] = React.useState(false)
  
  // 包装 dispatch 以支持撤销（用 ref 捕获 state 避免依赖变化）
  const stateRef = useRef(state)
  stateRef.current = state

  const dispatch = useCallback((action: any) => {
    const actionType = action?.type as string

    // 如果是可撤销操作，先保存当前状态
    if (UNDOABLE_ACTIONS.has(actionType)) {
      pastRef.current = [...pastRef.current, stateRef.current].slice(-MAX_UNDO)
      futureRef.current = []  // 新操作清空重做栈
      setHistoryLength(pastRef.current.length + 1)
      setCanRedoState(false)
    }

    dispatchBase(action)
  }, [])
  
  // 撤销
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    const previous = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [state, ...futureRef.current]
    setHistoryLength(pastRef.current.length)
    setCanRedoState(futureRef.current.length > 0)
    dispatchBase({ type: 'IMPORT_DATA', state: previous })
  }, [state])
  
  // 重做
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current[0]
    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [...pastRef.current, state]
    setHistoryLength(pastRef.current.length + 1)
    setCanRedoState(futureRef.current.length > 0)
    dispatchBase({ type: 'IMPORT_DATA', state: next })
  }, [state])

  // 持久化
  useEffect(() => {
    saveState(state)
  }, [state])

  // 应用主题
  useEffect(() => {
    applyTheme(state.theme)
  }, [state.theme])

  // 制品类型：默认 + 自定义
  const productTypes = [...DEFAULT_PRODUCT_TYPES, ...state.customProductTypes]

  // ID 生成器
  const genId = useCallback(() => {
    return 'o_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    dispatch({ type: 'SET_THEME', theme: t })
  }, [])

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      productTypes, 
      genId, 
      theme: state.theme, 
      setTheme,
      canUndo: historyLength > 0,
      canRedo: canRedoState,
      undo,
      redo,
      historyLength,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

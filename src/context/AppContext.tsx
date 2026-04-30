import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { AppState } from '../types'
import { DEFAULT_PRODUCT_TYPES } from '../types'
import { loadState, saveState } from '../utils/storage'
import { appReducer } from './reducers/appReducer'

// ── Context Types ──────────────────────────────────────────────
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<any>
  productTypes: string[]
  genId: () => string
}

const AppContext = createContext<AppContextType | null>(null)

// ── Provider ───────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, loadState)

  // 持久化
  useEffect(() => {
    saveState(state)
  }, [state])

  // 制品类型：默认 + 自定义
  const productTypes = [...DEFAULT_PRODUCT_TYPES, ...state.customProductTypes]

  // ID 生成器
  const genId = useCallback(() => {
    return 'o_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch, productTypes, genId }}>
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

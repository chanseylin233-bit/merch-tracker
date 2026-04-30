import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import type { Order } from '../types'
import { 
  filterOrders, 
  getTodoGroups, 
  isTerminated, 
  isDeadlineSoon, 
  isStale,
  type FilterState 
} from '../utils/orders'

/** 筛选订单 */
export function useFilteredOrders(filters: FilterState) {
  const { state } = useApp()
  return useMemo(
    () => filterOrders(state.orders, filters),
    [state.orders, filters]
  )
}

/** 搜索订单 */
export function useSearchOrders(keyword: string) {
  const { state } = useApp()
  return useMemo(() => {
    if (!keyword) return state.orders
    const kw = keyword.toLowerCase()
    return state.orders.filter(o =>
      o.title.toLowerCase().includes(kw) ||
      o.leader?.toLowerCase().includes(kw) ||
      o.groupName?.toLowerCase().includes(kw) ||
      o.characterTags.some(t => t.toLowerCase().includes(kw))
    )
  }, [state.orders, keyword])
}

/** 获取待办分组 */
export function useTodoGroups() {
  const { state } = useApp()
  return useMemo(
    () => getTodoGroups(state.orders),
    [state.orders]
  )
}

/** 获取活跃订单（未完成） */
export function useActiveOrders() {
  const { state } = useApp()
  return useMemo(
    () => state.orders.filter(o => !isTerminated(o.status)),
    [state.orders]
  )
}

/** 获取即将截止的订单 */
export function useDeadlineSoonOrders(days: number = 3) {
  const { state } = useApp()
  return useMemo(
    () => state.orders.filter(o => isDeadlineSoon(o, days)),
    [state.orders, days]
  )
}

/** 获取长期未更新的订单 */
export function useStaleOrders(days: number = 14) {
  const { state } = useApp()
  return useMemo(
    () => state.orders.filter(o => isStale(o, days)),
    [state.orders, days]
  )
}

/** 获取所有角色标签（按使用频率排序） */
export function useCharacterTags() {
  const { state } = useApp()
  return useMemo(() => {
    const set = new Set<string>()
    state.orders.forEach(o => o.characterTags.forEach(t => set.add(t)))
    return [...set].sort()
  }, [state.orders])
}

/** 获取近期使用过的角色标签（按最近使用时间排序，最多20个） */
export function useRecentCharacterTags(limit: number = 20) {
  const { state } = useApp()
  return useMemo(() => {
    // 收集每个标签的最近使用时间
    const tagMap = new Map<string, string>() // tag -> latest updatedAt
    state.orders.forEach(o => {
      o.characterTags.forEach(t => {
        const existing = tagMap.get(t)
        if (!existing || o.updatedAt > existing) {
          tagMap.set(t, o.updatedAt)
        }
      })
    })
    // 按最近使用时间降序排列
    return [...tagMap.entries()]
      .sort((a, b) => b[1].localeCompare(a[1]))
      .slice(0, limit)
      .map(([tag]) => tag)
  }, [state.orders, limit])
}

/** 获取所有拼团群 */
export function useGroupNames() {
  const { state } = useApp()
  return useMemo(() => {
    const set = new Set<string>()
    state.orders.forEach(o => {
      if (o.groupName) set.add(o.groupName)
    })
    return [...set].sort()
  }, [state.orders])
}

/** 按订单 ID 查找 */
export function useOrderById(id: string | undefined): Order | undefined {
  const { state } = useApp()
  return useMemo(
    () => state.orders.find(o => o.id === id),
    [state.orders, id]
  )
}

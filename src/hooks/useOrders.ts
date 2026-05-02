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

/** 搜索订单（内部辅助函数） */
function searchOrders(orders: Order[], keyword: string): Order[] {
  if (!keyword) return orders
  const kw = keyword.toLowerCase()
  return orders.filter(o =>
    o.title.toLowerCase().includes(kw) ||
    o.leader?.toLowerCase().includes(kw) ||
    o.groupName?.toLowerCase().includes(kw) ||
    o.characterTags.some(t => t.toLowerCase().includes(kw))
  )
}

/** 搜索订单（独立使用） */
export function useSearchOrders(keyword: string) {
  const { state } = useApp()
  return useMemo(
    () => searchOrders(state.orders, keyword),
    [state.orders, keyword]
  )
}

/** 筛选 + 搜索组合（支持叠加） */
export function useFilteredAndSearchOrders(filters: FilterState, keyword: string) {
  const { state } = useApp()
  return useMemo(() => {
    // 先应用筛选条件
    let result = filterOrders(state.orders, filters)
    // 再应用搜索关键词
    result = searchOrders(result, keyword)
    return result
  }, [state.orders, filters, keyword])
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

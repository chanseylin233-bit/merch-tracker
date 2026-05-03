import type { Order, OrderStatus, TerminatedStatus } from '../types'
import { TERMINATED_STATUSES, STATUS_STEPS } from '../types'

/** 判断订单是否已终止 */
export function isTerminated(status: OrderStatus): boolean {
  return TERMINATED_STATUSES.includes(status as TerminatedStatus)
}

/** 判断订单是否已完成 */
export function isCompleted(status: OrderStatus): boolean {
  return status === '已收货已完成' || status === '已退款' || status === '已放弃/已转单' || status === '未拼成'
}

/** 获取订单实际成本 */
export function getFinalCost(order: Order): number {
  return order.paidAmount - order.refundedAmount
}

/** 获取订单当前步骤索引（-1 表示终止状态） */
export function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])
}

/** 获取订单进度百分比 */
export function getProgressPercent(status: OrderStatus): number {
  if (isTerminated(status)) return 100
  const idx = getStepIndex(status)
  if (idx < 0) return 0
  return Math.round((idx / (STATUS_STEPS.length - 1)) * 100)
}

/** 待办分组配置 */
export interface TodoGroup {
  key: string
  label: string
  icon: string
  filter: (s: OrderStatus) => boolean
}

/** 待办分组定义 */
export const TODO_GROUPS: TodoGroup[] = [
  { key: 'pay', label: '待付款', icon: '💰', filter: s => s === '拼团成功待付款' },
  { key: 'balance', label: '待补尾款', icon: '💳', filter: s => s === '待补尾款' || s === '已付定金待尾款' },
  { key: 'distribute', label: '待排发', icon: '📦', filter: s => s === '已到团长处待排发' || s === '已申请排发待发货' },
  { key: 'ship', label: '待收货', icon: '🚚', filter: s => s === '已付款待发货' || s === '已发货待收货' },
  { key: 'refund', label: '待退款', icon: '🔄', filter: s => s === '流团待退款' || s === '部分退款' },
  { key: 'abnormal', label: '异常待确认', icon: '⚠️', filter: s => s === '异常待确认' },
]

/** 筛选状态接口 */
export interface FilterState {
  status: string
  productType: string
  year: string
  keyword: string
  characterTag: string
  showIncomplete: boolean
}

/**
 * 通用订单筛选
 * 注意：keyword 搜索已移至 useFilteredAndSearchOrders，此处不再处理
 */
export function filterOrders(orders: Order[], filters: FilterState): Order[] {
  let list = orders

  if (filters.status !== '全部') {
    list = list.filter(o => o.status === filters.status)
  }
  if (filters.productType !== '全部') {
    list = list.filter(o => o.productType === filters.productType)
  }
  if (filters.year !== '全部') {
    list = list.filter(o => o.createdAt.startsWith(filters.year))
  }
  if (filters.characterTag) {
    list = list.filter(o => o.characterTags.includes(filters.characterTag))
  }

  return list
}

/** 搜索订单（纯搜索，不含筛选条件） */
export function searchOrders(orders: Order[], keyword: string): Order[] {
  if (!keyword) return orders
  const kw = keyword.toLowerCase()
  return orders.filter(o =>
    o.title.toLowerCase().includes(kw) ||
    o.leader?.toLowerCase().includes(kw) ||
    o.groupName?.toLowerCase().includes(kw) ||
    o.note?.toLowerCase().includes(kw) ||
    o.characterTags.some(t => t.toLowerCase().includes(kw))
  )
}

/** 检查订单是否即将截止（3天内） */
export function isDeadlineSoon(order: Order, days: number = 3): boolean {
  if (isCompleted(order.status)) return false

  const now = Date.now()
  const deadlines = [
    order.payDeadline,
    order.balanceDeadline,
    order.distributeDeadline,
  ].filter(Boolean)

  if (deadlines.length === 0) return false

  return deadlines.some(dl => {
    const diff = new Date(dl!).getTime() - now
    return diff > 0 && diff < days * 86400000
  })
}

/** 检查订单是否长期未更新（14天+） */
export function isStale(order: Order, days: number = 14): boolean {
  if (isCompleted(order.status)) return false

  const last = new Date(order.lastUpdateTime).getTime()
  return Date.now() - last > days * 86400000
}

/** 获取待办分组订单 */
export function getTodoGroups(orders: Order[]): Array<{ label: string; icon: string; orders: Order[] }> {
  const groups: Array<{ label: string; icon: string; orders: Order[] }> = []

  for (const g of TODO_GROUPS) {
    const filtered = orders.filter(o => g.filter(o.status))
    if (filtered.length > 0) {
      groups.push({ label: g.label, icon: g.icon, orders: filtered })
    }
  }

  // 即将截止
  const deadlineOrders = orders.filter(o => isDeadlineSoon(o))
  if (deadlineOrders.length > 0) {
    groups.push({ label: '即将截止', icon: '⏰', orders: deadlineOrders })
  }

  // 长期未更新
  const staleOrders = orders.filter(o => isStale(o))
  if (staleOrders.length > 0) {
    groups.push({ label: '长期未更新', icon: '💤', orders: staleOrders })
  }

  return groups
}

/** 清理旧数据 */
export function cleanupOldData(orders: Order[], keepMonths: number = 12): Order[] {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - keepMonths)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return orders.filter(o => {
    // 保留：未完成订单 + 近 N 个月订单
    if (!isCompleted(o.status)) return true
    if (o.lastUpdateTime >= cutoffStr) return true
    return false
  })
}
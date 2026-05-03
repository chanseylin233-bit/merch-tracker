import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { isTerminated } from '../utils/orders'

const MACARON = ['#6366f1', '#ec4899', '#06b6d4', '#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#eab308']

export interface YearStats {
  orders: number
  paid: number
  pending: number
  refunded: number
  netCost: number
  pendingRefund: number
}

export interface MonthlyEntry {
  month: string
  paid: number
  net: number
}

export interface Stats {
  year: YearStats
  month: YearStats
  active: number
  total: number
  byType: Array<[string, { count: number; paid: number; netCost: number }]>
  byChar: Array<[string, { count: number; paid: number }]>
  byStatus: Array<[string, number]>
  byGroup: Array<[string, { count: number; paid: number }]>
  monthlyTrend: MonthlyEntry[]
}

/** 提取付款日期（兼容 datetime-local 和纯日期格式） */
function paymentMonth(dateStr: string): string {
  const d = new Date(dateStr.replace(' ', 'T'))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 年度统计 */
export function useYearStats(year: number): Stats {
  const { state } = useApp()

  return useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const yearOrders = state.orders.filter(o => {
      const d = new Date(o.createdAt)
      return d.getFullYear() === year
    })

    const monthOrders = state.orders.filter(o => {
      const d = new Date(o.createdAt)
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
    })

    const activeOrders = state.orders.filter(o => !isTerminated(o.status))

    // 年度统计
    const yearPaid = yearOrders.reduce((s, o) => s + o.paidAmount, 0)
    const yearPending = yearOrders.reduce((s, o) => s + o.pendingAmount, 0)
    const yearRefunded = yearOrders.reduce((s, o) => s + o.refundedAmount, 0)
    const yearNetCost = yearPaid - yearRefunded
    const yearPendingRefund = yearOrders.reduce((s, o) => s + o.pendingRefundAmount, 0)

    // 月度统计
    const monthPaid = monthOrders.reduce((s, o) => s + o.paidAmount, 0)
    const monthPending = monthOrders.reduce((s, o) => s + o.pendingAmount, 0)
    const monthNetCost = monthPaid - monthOrders.reduce((s, o) => s + o.refundedAmount, 0)

    // 按制品类型
    const byType: Record<string, { count: number; paid: number; netCost: number }> = {}
    yearOrders.forEach(o => {
      if (!byType[o.productType]) byType[o.productType] = { count: 0, paid: 0, netCost: 0 }
      byType[o.productType].count += 1
      byType[o.productType].paid += o.paidAmount
      byType[o.productType].netCost += o.paidAmount - o.refundedAmount
    })

    // 按角色标签（paidAmount 均分）
    const byChar: Record<string, { count: number; paid: number }> = {}
    yearOrders.forEach(o => {
      o.characterTags.forEach(t => {
        if (!byChar[t]) byChar[t] = { count: 0, paid: 0 }
        byChar[t].count += 1
        byChar[t].paid += o.paidAmount / Math.max(o.characterTags.length, 1)
      })
    })

    // 按状态
    const byStatus: Record<string, number> = {}
    state.orders.forEach(o => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1
    })

    // 按拼团群
    const byGroup: Record<string, { count: number; paid: number }> = {}
    yearOrders.forEach(o => {
      const g = o.groupName || '未分组'
      if (!byGroup[g]) byGroup[g] = { count: 0, paid: 0 }
      byGroup[g].count += 1
      byGroup[g].paid += o.paidAmount
    })

    // 月度趋势（按付款日期统计，而非创建日期）
    // 遍历所有付款记录，按月份聚合已付和已退金额
    const monthlyMap: Record<string, { paid: number; refunded: number }> = {}
    for (let m = 1; m <= 12; m++) {
      monthlyMap[`${year}-${String(m).padStart(2, '0')}`] = { paid: 0, refunded: 0 }
    }

    state.orders.forEach(o => {
      // 付款记录
      o.payments.forEach(p => {
        const pMonth = paymentMonth(p.date)
        if (pMonth.startsWith(String(year))) {
          if (monthlyMap[pMonth]) monthlyMap[pMonth].paid += p.amount
        }
      })
      // 退款记录
      o.refunds.forEach(r => {
        const rMonth = paymentMonth(r.date)
        if (rMonth.startsWith(String(year))) {
          if (monthlyMap[rMonth]) monthlyMap[rMonth].refunded += r.amount
        }
      })
    })

    const monthlyTrend: MonthlyEntry[] = []
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`
      const data = monthlyMap[key]
      monthlyTrend.push({
        month: `${m}月`,
        paid: data?.paid ?? 0,
        net: (data?.paid ?? 0) - (data?.refunded ?? 0),
      })
    }

    return {
      year: {
        orders: yearOrders.length,
        paid: yearPaid,
        pending: yearPending,
        refunded: yearRefunded,
        netCost: yearNetCost,
        pendingRefund: yearPendingRefund,
      },
      month: {
        orders: monthOrders.length,
        paid: monthPaid,
        pending: monthPending,
        refunded: monthOrders.reduce((s, o) => s + o.refundedAmount, 0),
        netCost: monthNetCost,
        pendingRefund: monthOrders.reduce((s, o) => s + o.pendingRefundAmount, 0),
      },
      active: activeOrders.length,
      total: state.orders.length,
      byType: Object.entries(byType).sort((a, b) => b[1].paid - a[1].paid),
      byChar: Object.entries(byChar).sort((a, b) => b[1].paid - a[1].paid),
      byStatus: Object.entries(byStatus).sort((a, b) => b[1] - a[1]),
      byGroup: Object.entries(byGroup).sort((a, b) => b[1].paid - a[1].paid),
      monthlyTrend,
    }
  }, [state.orders, year])
}

/** 获取最大月度花费（供图表 Y 轴上限） */
export function useMaxMonthlyPaid(year: number): number {
  const stats = useYearStats(year)
  return Math.max(...stats.monthlyTrend.map(m => m.paid), 1)
}

/** 获取最大类型花费 */
export function useMaxTypePaid(year: number): number {
  const stats = useYearStats(year)
  return stats.byType.length > 0 ? stats.byType[0][1].paid : 1
}

/** 导出颜色配置 */
export { MACARON }
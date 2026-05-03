import type { AppState } from '../types'

const STORAGE_KEY = 'susie-merch-tracker'
const STORAGE_QUOTA = 4 * 1024 * 1024 // 4MB

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyState()

  try {
    const parsed = JSON.parse(raw)
    // 基础结构验证：orders 必须是数组
    if (!Array.isArray(parsed.orders)) {
      console.warn('[storage] 备份数据格式异常（orders 不是数组），尝试降级处理')
      return maybeFallback(raw)
    }
    // 字段类型验证
    if (!isValidOrdersArray(parsed.orders)) {
      console.warn('[storage] 备份数据中订单字段类型异常，尝试降级处理')
      return maybeFallback(raw)
    }
    return {
      orders: parsed.orders ?? [],
      customProductTypes: Array.isArray(parsed.customProductTypes) ? parsed.customProductTypes : [],
      lastExportTime: parsed.lastExportTime ?? undefined,
      lastBackupTime: parsed.lastBackupTime ?? undefined,
      backupReminderDismissed: parsed.backupReminderDismissed ?? undefined,
      theme: normalizeTheme(parsed.theme),
    }
  } catch (e) {
    console.warn('[storage] JSON 解析失败，尝试降级处理：', e)
    return maybeFallback(raw)
  }
}

/** 降级策略：尝试从旧格式备份键恢复数据 */
function maybeFallback(raw: string): AppState {
  // 保留原始数据备份，防止静默丢失
  try {
    const fallbackKey = 'susie-merch-tracker-fallback'
    // 只保留最近一次失败的数据
    const prev = localStorage.getItem(fallbackKey)
    if (!prev || prev.length < raw.length) {
      // 新数据更大，保存为降级备份（供手动恢复）
      localStorage.setItem(fallbackKey, raw)
    }
  } catch { /* storage 可能也满了，忽略 */ }
  console.warn('[storage] 加载失败，已将原始数据保存到降级备份键')
  return emptyState()
}

/** 验证 orders 数组中每条记录的关键字段类型 */
function isValidOrdersArray(orders: unknown): orders is unknown[] {
  if (!Array.isArray(orders)) return false
  // 抽检前 3 条（避免大数组性能问题），有任意一条严重格式错误则整体失败
  const sample = orders.slice(0, 3)
  for (const o of sample) {
    if (typeof o !== 'object' || o === null) return false
    if (typeof (o as any).id !== 'string') return false
    if (typeof (o as any).status !== 'string') return false
    if (typeof (o as any).paidAmount !== 'number') return false
  }
  return true
}

function normalizeTheme(raw: unknown): AppState['theme'] {
  if (raw === 'clean-purple') return 'clean-purple'
  if (raw === 'journal') return 'journal'
  return 'warm-pink'
}

function emptyState(): AppState {
  return { orders: [], customProductTypes: [], theme: 'warm-pink' }
}

export function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return 0
  return data.length * 2 // UTF-16
}

export function getStorageUsage(): { used: number; quota: number; percent: number } {
  const used = getStorageSize()
  return { used, quota: STORAGE_QUOTA, percent: used / STORAGE_QUOTA }
}

export function saveState(state: AppState): { success: boolean; error?: string } {
  const data = JSON.stringify(state)
  const size = data.length * 2

  if (size > STORAGE_QUOTA) {
    return {
      success: false,
      error: `存储空间不足！当前 ${size} > 限制 ${STORAGE_QUOTA}。请导出数据后清理。`
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, data)
    return { success: true }
  } catch (e) {
    return { success: false, error: `保存失败：${e}` }
  }
}

export function exportJSON(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importJSON(json: string): AppState {
  const data = JSON.parse(json) as AppState
  if (!Array.isArray(data.orders)) throw new Error('Invalid data: orders must be an array')
  return data
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function now(): string {
  const d = new Date()
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

export function exportCSV(orders: any[]): string {
  const headers = [
    'ID', '制品标题', '角色标签', '制品类型', '主题/系列', '出品方',
    '数量', '拼团群', '团长', '平台', '批次',
    '商品单价', '商品小计', '已付金额', '待付金额', '待退款金额', '已退款金额',
    '最终成本', '当前状态', '下一步动作',
    '报名时间', '付款截止', '补款截止', '排发截止', '发货时间', '收货时间',
    '物流公司', '物流单号', '备注', '创建时间', '最近更新',
  ]
  const rows = orders.map(o => [
    o.id, o.title, o.characterTags.join('&'), o.productType, o.theme ?? '', o.publisher ?? '',
    o.quantity, o.groupName ?? '', o.leader ?? '', o.platform ?? '', o.batch ?? '',
    o.unitPrice ?? '', o.subtotal ?? '',
    o.paidAmount, o.pendingAmount, o.pendingRefundAmount, o.refundedAmount,
    (o.paidAmount - o.refundedAmount).toFixed(2),
    o.status, o.customNextAction ?? '',
    o.registerTime ?? '', o.payDeadline ?? '', o.balanceDeadline ?? '', o.distributeDeadline ?? '',
    o.shipTime ?? '', o.receiveTime ?? '',
    o.logisticsCompany ?? '', o.trackingNumber ?? '', o.note ?? '',
    o.createdAt, o.lastUpdateTime,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  return [headers.join(','), ...rows].join('\n')
}
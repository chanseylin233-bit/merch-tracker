import type { AppState } from '../types'

const STORAGE_KEY = 'susie-merch-tracker'
const STORAGE_QUOTA = 4 * 1024 * 1024 // 4MB

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { orders: [], customProductTypes: [] }
    const parsed = JSON.parse(raw) as AppState
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      customProductTypes: Array.isArray(parsed.customProductTypes) ? parsed.customProductTypes : [],
      lastExportTime: parsed.lastExportTime,
      theme: (parsed.theme === 'clean-purple' ? 'clean-purple' : 'warm-pink'),
    }
  } catch {
    return { orders: [], customProductTypes: [] }
  }
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

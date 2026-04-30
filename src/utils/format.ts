/** 金额格式化：智能显示（10k+ → 1.2w，1k+ → 1.2k） */
export function formatMoney(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toFixed(0)
}

/** 金额格式化：显示两位小数 */
export function formatMoneyExact(n: number): string {
  return n.toFixed(2)
}

/** 时间格式化：智能显示（相对时间 + 绝对时间） */
export function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  
  const d = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateStr

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  const datePart = `${d.getMonth() + 1}/${d.getDate()}`
  const timePart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  // 相对时间
  let relative = ''
  if (diffMin < 1) relative = '刚刚'
  else if (diffMin < 60) relative = `${diffMin}分钟前`
  else if (diffHr < 24) relative = `${diffHr}小时前`
  else if (diffDay < 7) relative = `${diffDay}天前`
  else if (d.getFullYear() === now.getFullYear()) return `${datePart} ${timePart}`
  else return `${d.getFullYear()}/${datePart} ${timePart}`

  return `${datePart} ${timePart} · ${relative}`
}

/** 时间格式化：仅日期（YYYY-MM-DD） */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateStr.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

/** 时间格式化：完整日期时间 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateStr
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

/** 金额输入：解析（去除千分位、非数字字符） */
export function parseAmount(val: string): number | undefined {
  if (!val) return undefined
  // 移除千分位符号和非数字字符（保留小数点）
  const cleaned = val.replace(/,/g, '').replace(/[^\d.]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? undefined : n
}

/** 金额输入：格式化显示（添加千分位） */
export function formatAmountInput(val: string): string {
  if (!val) return ''
  const parts = val.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/** 生成唯一 ID */
export function genId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

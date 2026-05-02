import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

const BACKUP_INTERVAL_DAYS = 7
const DISMISS_COOLDOWN_DAYS = 1

/** 检查是否需要备份提醒 */
export function useBackupReminder() {
  const { state } = useApp()
  
  return useMemo(() => {
    const now = Date.now()
    const lastBackup = state.lastBackupTime ? new Date(state.lastBackupTime).getTime() : 0
    const dismissedAt = state.backupReminderDismissed ? new Date(state.backupReminderDismissed).getTime() : 0
    
    // 从未备份的判定：至少 3 条订单（排除刚导入的假数据）
    // 且首条订单距今超过 3 天（排除新用户）
    const earliestOrderTime = state.orders.length > 0
      ? Math.min(...state.orders.map(o => new Date(o.createdAt).getTime()))
      : now
    const daysSinceFirstOrder = (now - earliestOrderTime) / (1000 * 60 * 60 * 24)
    const hasRealData = state.orders.length >= 3 && daysSinceFirstOrder >= 3
    const neverBackedUp = hasRealData && !state.lastBackupTime
    
    // 超过 7 天未备份
    const daysSinceBackup = (now - lastBackup) / (1000 * 60 * 60 * 24)
    const overdue = daysSinceBackup >= BACKUP_INTERVAL_DAYS
    
    // 最近关闭过提醒（1 天内不再提醒）
    const daysSinceDismiss = (now - dismissedAt) / (1000 * 60 * 60 * 24)
    const recentlyDismissed = dismissedAt > 0 && daysSinceDismiss < DISMISS_COOLDOWN_DAYS
    
    const shouldShow = (neverBackedUp || overdue) && !recentlyDismissed
    
    return {
      shouldShow,
      neverBackedUp,
      overdue,
      daysSinceBackup: Math.floor(daysSinceBackup),
      lastBackupTime: state.lastBackupTime,
    }
  }, [state.orders.length, state.lastBackupTime, state.backupReminderDismissed])
}
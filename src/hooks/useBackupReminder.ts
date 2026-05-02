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
    
    // 如果有订单但从未备份
    const neverBackedUp = state.orders.length > 0 && !state.lastBackupTime
    
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
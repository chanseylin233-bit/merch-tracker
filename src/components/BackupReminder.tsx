import { useApp } from '../context/AppContext'
import { useBackupReminder } from '../hooks/useBackupReminder'
import { Download, X, ShieldCheck } from 'lucide-react'
import './BackupReminder.css'

export function BackupReminder() {
  const { state, dispatch } = useApp()
  const backupInfo = useBackupReminder()
  
  if (!backupInfo.shouldShow) return null
  
  const handleExport = () => {
    // 触发导出并标记已备份
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merch-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    // 标记已备份
    dispatch({ type: 'MARK_BACKUP' })
  }
  
  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_BACKUP_REMINDER' })
  }
  
  const message = backupInfo.neverBackedUp
    ? '您还没有备份过数据'
    : `距离上次备份已 ${backupInfo.daysSinceBackup} 天`
  
  return (
    <div className="backup-reminder">
      <div className="backup-reminder__icon">
        <ShieldCheck size={20} />
      </div>
      <div className="backup-reminder__content">
        <div className="backup-reminder__title">{message}</div>
        <div className="backup-reminder__desc">建议定期备份数据，防止数据丢失</div>
      </div>
      <button className="backup-reminder__btn" onClick={handleExport}>
        <Download size={16} />
        备份
      </button>
      <button className="backup-reminder__close" onClick={handleDismiss}>
        <X size={16} />
      </button>
    </div>
  )
}

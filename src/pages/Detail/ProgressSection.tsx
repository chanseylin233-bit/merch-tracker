import { useState } from 'react'
import type { ProgressEntry, OrderStatus } from '../../types'
import { ALL_STATUSES, STATUS_COLORS } from '../../types'
import { formatTime } from '../../utils/format'
import { genId } from '../../utils/format'
import './ProgressSection.css'

interface Props {
  progressLog: ProgressEntry[]
  currentStatus: OrderStatus
  onAdd: (entry: ProgressEntry) => void
}

export function ProgressSection({ progressLog, currentStatus, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ status: currentStatus, note: '' })

  const handleSubmit = () => {
    onAdd({
      id: genId('prg'),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: form.status as OrderStatus,
      note: form.note || undefined,
    })
    
    setShowForm(false)
    setForm({ status: currentStatus, note: '' })
  }

  return (
    <div className="progress-section">
      <div className="progress-section__header">
        <div className="progress-section__title">进度记录</div>
        <button className="progress-section__add" onClick={() => setShowForm(!showForm)}>
          ＋ 进度
        </button>
      </div>

      {showForm && (
        <div className="progress-section__form">
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as OrderStatus })}
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            placeholder="备注（可选）"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />
          <div className="progress-section__actions">
            <button className="progress-section__btn progress-section__btn--cancel" onClick={() => setShowForm(false)}>
              取消
            </button>
            <button className="progress-section__btn progress-section__btn--save" onClick={handleSubmit}>
              确认
            </button>
          </div>
        </div>
      )}

      {progressLog.length === 0 && !showForm && (
        <div className="progress-section__empty">暂无进度记录</div>
      )}

      {progressLog.length > 0 && (
        <div className="progress-section__timeline">
          {progressLog.slice().reverse().map(e => (
            <div key={e.id} className="progress-section__timeline-item">
              <div
                className="progress-section__timeline-dot"
                style={{ background: STATUS_COLORS[e.status] || '#94a3b8' }}
              />
              <div className="progress-section__timeline-content">
                <div
                  className="progress-section__timeline-status"
                  style={{ color: STATUS_COLORS[e.status] }}
                >
                  {e.status}
                </div>
                <div className="progress-section__timeline-date">{formatTime(e.date)}</div>
                {e.note && <div className="progress-section__timeline-note">{e.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

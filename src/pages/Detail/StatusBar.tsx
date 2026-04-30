import type { OrderStatus } from '../../types'
import { STATUS_STEPS, STATUS_COLORS, NEXT_ACTION_MAP, TERMINATED_STATUSES, ALL_STATUSES } from '../../types'
import './StatusBar.css'

interface Props {
  status: OrderStatus
  onSetStatus: (status: OrderStatus) => void
}

export function StatusBar({ status, onSetStatus }: Props) {
  const currentStep = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])
  const isTerminated = TERMINATED_STATUSES.includes(status as any)
  const progressPercent = isTerminated
    ? 100
    : currentStep >= 0
      ? Math.round((currentStep / (STATUS_STEPS.length - 1)) * 100)
      : 0

  return (
    <div className="status-bar">
      {/* 进度条 */}
      <div className="status-bar__track">
        {STATUS_STEPS.map((s, i) => {
          const isPast = currentStep >= 0 && i < currentStep
          const isCurrent = s === status
          const color = STATUS_COLORS[s] || '#94a3b8'
          return (
            <div
              key={s}
              className={`status-bar__node ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
              style={{ '--node-color': isPast || isCurrent ? color : '#cbd5e1' } as React.CSSProperties}
              onClick={() => onSetStatus(s as OrderStatus)}
              title={s}
            >
              <div className="status-bar__dot" />
              {isCurrent && <div className="status-bar__label">{s}</div>}
            </div>
          )
        })}
      </div>

      {/* 终止状态 */}
      {isTerminated && (
        <div className="status-bar__terminated" style={{ color: STATUS_COLORS[status] || '#94a3b8' }}>
          {status}（已终止）
        </div>
      )}

      {/* 百分比 */}
      <div className="status-bar__percent">{progressPercent}%</div>

      {/* 状态切换面板 */}
      <div className="status-bar__chips">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            className={`status-bar__chip ${s === status ? 'active' : ''}`}
            style={{ '--chip-color': STATUS_COLORS[s] || '#6366f1' } as React.CSSProperties}
            onClick={() => onSetStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function getQuickActions(status: OrderStatus): { prev: OrderStatus | null; next: OrderStatus | null } {
  const idx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])
  return {
    prev: idx > 0 ? STATUS_STEPS[idx - 1] as OrderStatus : null,
    next: idx >= 0 && idx < STATUS_STEPS.length - 1 ? STATUS_STEPS[idx + 1] as OrderStatus : null,
  }
}

export function getNextAction(order: { status: OrderStatus; customNextAction?: string }): string {
  return order.customNextAction || NEXT_ACTION_MAP[order.status] || ''
}

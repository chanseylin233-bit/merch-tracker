import type { Order } from '../types'
import { STATUS_COLORS, NEXT_ACTION_MAP } from '../types'
import './OrderCard.css'

interface Props {
  order: Order
  onClick?: (id: string) => void
}

export function OrderCard({ order, onClick }: Props) {
  const nextAction = order.customNextAction ?? NEXT_ACTION_MAP[order.status]
  const isDone = order.status === '已收货已完成' || order.status === '已退款' || order.status === '已放弃/已转单' || order.status === '未拼成'
  const finalCost = order.paidAmount - order.refundedAmount

  return (
    <div className="order-card" onClick={() => onClick?.(order.id)}>
      <div className="order-card__header">
        <span className="order-card__title">{order.title}</span>
        <span
          className="status-tag"
          style={{ background: STATUS_COLORS[order.status] ?? '#718096' }}
        >
          {order.status}
        </span>
      </div>

      <div className="order-card__tags">
        {order.characterTags.map(t => (
          <span className="order-card__tag" key={t}>{t}</span>
        ))}
        <span className="order-card__tag order-card__tag--type">{order.productType}</span>
        {order.quantity > 1 && <span className="order-card__tag">×{order.quantity}</span>}
      </div>

      <div className="order-card__meta">
        {order.leader && <span>{order.leader}</span>}
        {order.groupName && <span> · {order.groupName}</span>}
        {order.batch && <span> · {order.batch}</span>}
      </div>

      <div className="order-card__footer">
        <div>
          <span className="order-card__amount-label">{isDone ? '成本' : '已付'}</span>
          <span className="order-card__amount">
            ¥{isDone ? finalCost.toFixed(2) : order.paidAmount.toFixed(2)}
          </span>
          {!isDone && order.pendingAmount > 0 && (
            <span style={{ fontSize: 11, color: '#cca273', marginLeft: 6 }}>
              待付 ¥{order.pendingAmount.toFixed(2)}
            </span>
          )}
        </div>
        <div className="order-card__next">
          {!isDone && `→ ${nextAction}`}
        </div>
      </div>

      <div className="order-card__time">
        更新于 {order.lastUpdateTime}
      </div>
    </div>
  )
}

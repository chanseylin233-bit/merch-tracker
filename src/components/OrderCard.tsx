import type { Order } from '../types'
import { STATUS_COLORS, NEXT_ACTION_MAP } from '../types'
import { isCompleted } from '../utils/orders'
import { formatTime } from '../utils/format'
import './OrderCard.css'

// 莫兰迪色系数组（低饱和度、带灰调）
const MORANDI_COLORS = [
  { bg: '#f0d8d8', text: '#8b5d5d', border: '#e0c0c0' }, // 灰粉
  { bg: '#d0d8e8', text: '#5d6b8b', border: '#c0c8d8' }, // 灰蓝
  { bg: '#d0e0d0', text: '#5d7b5d', border: '#c0d0c0' }, // 灰绿
  { bg: '#e0d8e0', text: '#7b5d7b', border: '#d0c8d0' }, // 灰紫
  { bg: '#e8e0d0', text: '#8b7d5d', border: '#d8d0c0' }, // 灰黄
  { bg: '#d8e0e8', text: '#5d7b8b', border: '#c8d0d8' }, // 灰青
  { bg: '#e8d8d0', text: '#8b6d5d', border: '#d8c8c0' }, // 灰橙
]

// 根据标签文本生成稳定的颜色索引
function getColorIndex(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash |= 0 // 转为32位整数
  }
  return Math.abs(hash) % MORANDI_COLORS.length
}

interface Props {
  order: Order
  onClick?: (id: string) => void
}

export function OrderCard({ order, onClick }: Props) {
  const nextAction = order.customNextAction ?? NEXT_ACTION_MAP[order.status]
  const isDone = isCompleted(order.status)
  const finalCost = order.paidAmount - order.refundedAmount

  return (
    <div className="order-card card-press" onClick={() => onClick?.(order.id)}>
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
        {order.characterTags.map(t => {
          const colorIdx = getColorIndex(t)
          const color = MORANDI_COLORS[colorIdx]
          return (
            <span
              className="order-card__tag"
              key={t}
              style={{ background: color.bg, color: color.text, borderColor: color.border }}
            >
              {t}
            </span>
          )
        })}
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
        更新于 {formatTime(order.lastUpdateTime)}
      </div>
    </div>
  )
}

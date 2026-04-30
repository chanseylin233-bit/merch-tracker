import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useOrderById } from '../../hooks/useOrders'
import { StatusBar, getQuickActions, getNextAction } from './StatusBar'
import { PaymentSection } from './PaymentSection'
import { RefundSection } from './RefundSection'
import { ProgressSection } from './ProgressSection'
import { formatTime } from '../../utils/format'
import { getFinalCost, isTerminated } from '../../utils/orders'
import { STATUS_COLORS } from '../../types'
import type { OrderStatus } from '../../types'
import './Detail.css'

export function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const { dispatch } = useApp()
  const navigate = useNavigate()
  const order = useOrderById(id)

  if (!order) {
    return (
      <div className="detail">
        <div className="detail__back" onClick={() => navigate(-1)}>← 返回</div>
        <p style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>记录不存在</p>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[order.status] || '#6366f1'
  const nextAction = getNextAction(order)
  const finalCost = getFinalCost(order)
  const quickActions = getQuickActions(order.status)

  const handleSetStatus = (status: OrderStatus) => {
    dispatch({ type: 'SET_STATUS', id: order.id, status })
  }

  const handleDelete = () => {
    if (confirm('确定删除这条记录吗？')) {
      dispatch({ type: 'DELETE_ORDER', id: order.id })
      navigate('/')
    }
  }

  return (
    <div className="detail">
      <div className="detail__back" onClick={() => navigate(-1)}>← 返回</div>

      <div className="detail__header">
        <h1 className="detail__title">{order.title}</h1>
        <span className="detail__status-badge" style={{ background: statusColor }}>
          {order.status}
        </span>
      </div>

      {/* 状态进度条 */}
      <StatusBar status={order.status} onSetStatus={handleSetStatus} />

      {/* 快捷操作 */}
      {!isTerminated(order.status) && (quickActions.prev || quickActions.next) && (
        <div className="detail__quick-actions">
          {quickActions.prev && (
            <button
              className="detail__quick-btn detail__quick-btn--prev"
              onClick={() => handleSetStatus(quickActions.prev!)}
            >
              ← {quickActions.prev}
            </button>
          )}
          {quickActions.next && (
            <button
              className="detail__quick-btn detail__quick-btn--next"
              onClick={() => handleSetStatus(quickActions.next!)}
            >
              {quickActions.next} →
            </button>
          )}
        </div>
      )}

      {/* 下一步动作 */}
      {nextAction && !isTerminated(order.status) && (
        <div className="detail__next-action">
          下一步：<span>{nextAction}</span>
        </div>
      )}

      {/* 基本信息 */}
      <Section title="基本信息">
        <Row label="制品类型">{order.productType}</Row>
        <Row label="数量">{order.quantity}</Row>
        {order.characterTags.length > 0 && (
          <Row label="角色/主题">
            <div className="detail__tags">
              {order.characterTags.map(t => (
                <span key={t} className="detail__tag">{t}</span>
              ))}
            </div>
          </Row>
        )}
        {order.theme && <Row label="主题/系列">{order.theme}</Row>}
        {order.publisher && <Row label="出品方">{order.publisher}</Row>}
      </Section>

      {/* 拼团信息 */}
      {(order.groupName || order.leader || order.batch || order.platform) && (
        <Section title="拼团信息">
          {order.groupName && <Row label="拼团群">{order.groupName}</Row>}
          {order.leader && <Row label="团长">{order.leader}</Row>}
          {order.batch && <Row label="批次">{order.batch}</Row>}
          {order.platform && <Row label="平台">{order.platform}</Row>}
        </Section>
      )}

      {/* 金额 */}
      <Section title="金额">
        <Row label="已付金额" highlight>
          <span className="detail__money">¥{order.paidAmount.toFixed(2)}</span>
        </Row>
        {order.pendingAmount > 0 && (
          <Row label="待付金额">
            <span className="detail__money detail__money--pending">¥{order.pendingAmount.toFixed(2)}</span>
          </Row>
        )}
        {order.pendingRefundAmount > 0 && (
          <Row label="待退款">
            <span className="detail__money detail__money--pending">¥{order.pendingRefundAmount.toFixed(2)}</span>
          </Row>
        )}
        {order.refundedAmount > 0 && (
          <Row label="已退款">
            <span className="detail__money detail__money--refund">¥{order.refundedAmount.toFixed(2)}</span>
          </Row>
        )}
        {order.unitPrice && <Row label="单价">¥{order.unitPrice.toFixed(2)}</Row>}
        <Row label="实际成本" highlight>
          <span className="detail__money detail__money--final">¥{finalCost.toFixed(2)}</span>
        </Row>
      </Section>

      {/* 物流 */}
      {(order.logisticsCompany || order.trackingNumber) && (
        <Section title="物流">
          {order.logisticsCompany && <Row label="快递公司">{order.logisticsCompany}</Row>}
          {order.trackingNumber && <Row label="快递单号">{order.trackingNumber}</Row>}
        </Section>
      )}

      {/* 时间节点 */}
      <Section title="时间节点">
        {order.registerTime && <Row label="报名时间">{formatTime(order.registerTime)}</Row>}
        {order.payDeadline && <Row label="付款截止">{formatTime(order.payDeadline)}</Row>}
        {order.balanceDeadline && <Row label="补款截止">{formatTime(order.balanceDeadline)}</Row>}
        {order.distributeDeadline && <Row label="排发截止">{formatTime(order.distributeDeadline)}</Row>}
        {order.shipTime && <Row label="发货时间">{formatTime(order.shipTime)}</Row>}
        {order.receiveTime && <Row label="收货时间">{formatTime(order.receiveTime)}</Row>}
        <Row label="最近更新">{formatTime(order.lastUpdateTime)}</Row>
      </Section>

      {/* 备注 */}
      {order.note && (
        <Section title="备注">
          <p className="detail__note">{order.note}</p>
        </Section>
      )}

      {/* 付款记录 */}
      <PaymentSection
        payments={order.payments}
        onAdd={payment => dispatch({ type: 'ADD_PAYMENT', id: order.id, payment })}
      />

      {/* 退款记录 */}
      <RefundSection
        refunds={order.refunds}
        onAdd={refund => dispatch({ type: 'ADD_REFUND', id: order.id, refund })}
      />

      {/* 进度记录 */}
      <ProgressSection
        progressLog={order.progressLog}
        currentStatus={order.status}
        onAdd={entry => dispatch({ type: 'ADD_PROGRESS', id: order.id, entry })}
      />

      {/* 操作按钮 */}
      <div className="detail__actions">
        <button
          className="detail__action-btn detail__action-btn--secondary"
          onClick={() => navigate(`/edit/${order.id}`)}
        >
          编辑
        </button>
        <button
          className="detail__action-btn detail__action-btn--danger"
          onClick={handleDelete}
        >
          删除
        </button>
      </div>
    </div>
  )
}

// ── 辅助组件 ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="detail__section">
      <div className="detail__section-title">{title}</div>
      {children}
    </div>
  )
}

function Row({ 
  label, 
  children, 
  highlight = false 
}: { 
  label: string
  children: React.ReactNode
  highlight?: boolean 
}) {
  return (
    <div className={`detail__row ${highlight ? 'detail__row--highlight' : ''}`}>
      <span className="detail__key">{label}</span>
      <span className="detail__val">{children}</span>
    </div>
  )
}

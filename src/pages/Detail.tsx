import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ALL_STATUSES, STATUS_STEPS, STATUS_COLORS, NEXT_ACTION_MAP, TERMINATED_STATUSES } from '../types'
import type { OrderStatus, PaymentRecord, RefundRecord, ProgressEntry } from '../types'
import { now } from '../utils/storage'
import './Detail.css'

export function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const order = state.orders.find(o => o.id === id)

  if (!order) {
    return <div className="detail"><p>记录不存在</p></div>
  }

  // ── 状态切换 ────────────────────────────────────
  const [statusExpanded, setStatusExpanded] = useState(false)

  const currentStep = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number])
  const isTerminated = TERMINATED_STATUSES.includes(order.status as any)
  const prevStatus = currentStep > 0 ? STATUS_STEPS[currentStep - 1] : null
  const nextStatus = currentStep >= 0 && currentStep < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentStep + 1] : null

  const handleSetStatus = (status: OrderStatus) => {
    dispatch({ type: 'SET_STATUS', id: order.id, status })
    setStatusExpanded(false)
  }

  const handlePrevStatus = () => {
    if (prevStatus) handleSetStatus(prevStatus as OrderStatus)
  }

  const handleNextStatus = () => {
    if (nextStatus) handleSetStatus(nextStatus as OrderStatus)
  }

  // ── 付款记录 ────────────────────────────────────
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [formPayment, setFormPayment] = useState({ type: '定金' as string, amount: '', note: '' })

  const handleAddPayment = () => {
    const amt = parseFloat(formPayment.amount)
    if (!amt || amt <= 0) { alert('请输入有效金额'); return }
    const payment: PaymentRecord = {
      id: 'pay_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: formPayment.type as PaymentRecord['type'],
      amount: amt,
      date: now().slice(0, 10),
      note: formPayment.note || undefined,
    }
    dispatch({ type: 'ADD_PAYMENT', id: order.id, payment })
    setShowPaymentForm(false)
    setFormPayment({ type: '定金', amount: '', note: '' })
  }

  // ── 退款记录 ────────────────────────────────────
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [formRefund, setFormRefund] = useState({ reason: '', amount: '', note: '' })

  const handleAddRefund = () => {
    const amt = parseFloat(formRefund.amount)
    if (!amt || amt <= 0) { alert('请输入有效金额'); return }
    if (!formRefund.reason.trim()) { alert('请填写退款原因'); return }
    const refund: RefundRecord = {
      id: 'ref_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      reason: formRefund.reason.trim(),
      amount: amt,
      date: now().slice(0, 10),
      received: false,
      note: formRefund.note || undefined,
    }
    dispatch({ type: 'ADD_REFUND', id: order.id, refund })
    setShowRefundForm(false)
    setFormRefund({ reason: '', amount: '', note: '' })
  }

  // ── 进度记录 ────────────────────────────────────
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [formProgress, setFormProgress] = useState({ status: order.status as OrderStatus, note: '' })

  const handleAddProgress = () => {
    const entry: ProgressEntry = {
      id: 'prg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: now(),
      status: formProgress.status as OrderStatus,
      note: formProgress.note || undefined,
    }
    dispatch({ type: 'ADD_PROGRESS', id: order.id, entry })
    setShowProgressForm(false)
    setFormProgress({ status: order.status as OrderStatus, note: '' })
  }

  // ── 删除 ────────────────────────────────────────
  const handleDelete = () => {
    if (confirm('确定删除这条记录吗？')) {
      dispatch({ type: 'DELETE_ORDER', id: order.id })
      navigate('/')
    }
  }

  // ── 计算 ────────────────────────────────────────
  const statusColor = STATUS_COLORS[order.status] || '#6366f1'
  const nextAction = order.customNextAction || NEXT_ACTION_MAP[order.status]
  const progressPercent = isTerminated
    ? 100
    : currentStep >= 0
      ? Math.round((currentStep / (STATUS_STEPS.length - 1)) * 100)
      : 0

  return (
    <div className="detail">
      <div className="detail__back" onClick={() => navigate(-1)}>
        ← 返回
      </div>

      <div className="detail__title">{order.title}</div>

      {/* ── 状态进度条 ──────────────────────────── */}
      <div className="detail__progress-bar-wrap">
        <div className="detail__progress-track">
          {STATUS_STEPS.map((s, i) => {
            const isPast = currentStep >= 0 && i < currentStep
            const isCurrent = s === order.status
            const color = STATUS_COLORS[s] || '#94a3b8'
            return (
              <div
                key={s}
                className={`detail__progress-node ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
                style={{ '--node-color': isPast || isCurrent ? color : '#cbd5e1' } as React.CSSProperties}
                title={s}
              >
                <div className="detail__progress-dot" />
                {isCurrent && <div className="detail__progress-label">{s}</div>}
              </div>
            )
          })}
        </div>
        {isTerminated && (
          <div className="detail__progress-terminated" style={{ color: statusColor }}>
            {order.status}（已终止）
          </div>
        )}
        <div className="detail__progress-percent">{progressPercent}%</div>
      </div>

      {/* ── 状态栏 + 快捷切换 ──────────────────── */}
      <div className="detail__status-bar">
        <div className="detail__status-left">
          <span className="status-badge" style={{ background: statusColor }}>
            {order.status}
          </span>
          <button
            className="detail__status-toggle"
            onClick={() => setStatusExpanded(!statusExpanded)}
          >
            {statusExpanded ? '收起 ▲' : '改状态 ▼'}
          </button>
        </div>
        {nextAction && !isTerminated && (
          <span className="detail__next-action">下一步：{nextAction}</span>
        )}
      </div>

      {/* 快捷前进/后退按钮 */}
      {!isTerminated && (prevStatus || nextStatus) && !statusExpanded && (
        <div className="detail__quick-status">
          {prevStatus && (
            <button className="detail__quick-btn detail__quick-btn--prev" onClick={handlePrevStatus}>
              ← {prevStatus}
            </button>
          )}
          {nextStatus && (
            <button className="detail__quick-btn detail__quick-btn--next" onClick={handleNextStatus}>
              {nextStatus} →
            </button>
          )}
        </div>
      )}

      {/* 状态选择面板（展开） */}
      {statusExpanded && (
        <div className="detail__status-panel">
          <div className="detail__status-chips">
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                className={`detail__status-chip ${s === order.status ? 'active' : ''}`}
                style={{
                  '--chip-color': STATUS_COLORS[s] || '#6366f1',
                } as React.CSSProperties}
                onClick={() => handleSetStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 基本信息 ────────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-title">基本信息</div>
        <div className="detail__row">
          <span className="detail__key">制品类型</span>
          <span className="detail__val">{order.productType}</span>
        </div>
        <div className="detail__row">
          <span className="detail__key">数量</span>
          <span className="detail__val">{order.quantity}</span>
        </div>
        {order.characterTags.length > 0 && (
          <div className="detail__row">
            <span className="detail__key">角色/主题</span>
            <div className="detail__tag-row">
              {order.characterTags.map(t => (
                <span className="detail__tag detail__tag--primary" key={t}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {order.theme && (
          <div className="detail__row">
            <span className="detail__key">主题/系列</span>
            <span className="detail__val">{order.theme}</span>
          </div>
        )}
        {order.publisher && (
          <div className="detail__row">
            <span className="detail__key">出品方</span>
            <span className="detail__val">{order.publisher}</span>
          </div>
        )}
      </div>

      {/* ── 拼团信息 ────────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-title">拼团信息</div>
        {order.groupName && (
          <div className="detail__row">
            <span className="detail__key">拼团群</span>
            <span className="detail__val">{order.groupName}</span>
          </div>
        )}
        {order.leader && (
          <div className="detail__row">
            <span className="detail__key">团长</span>
            <span className="detail__val">{order.leader}</span>
          </div>
        )}
        {order.batch && (
          <div className="detail__row">
            <span className="detail__key">批次</span>
            <span className="detail__val">{order.batch}</span>
          </div>
        )}
        {order.platform && (
          <div className="detail__row">
            <span className="detail__key">平台</span>
            <span className="detail__val">{order.platform}</span>
          </div>
        )}
      </div>

      {/* ── 金额信息 ────────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-title">金额</div>
        <div className="detail__row">
          <span className="detail__key">已付金额</span>
          <span className="detail__val detail__val--money">¥{order.paidAmount.toFixed(2)}</span>
        </div>
        {order.pendingAmount > 0 && (
          <div className="detail__row">
            <span className="detail__key">待付金额</span>
            <span className="detail__val detail__val--pending">¥{order.pendingAmount.toFixed(2)}</span>
          </div>
        )}
        {order.pendingRefundAmount > 0 && (
          <div className="detail__row">
            <span className="detail__key">待退款</span>
            <span className="detail__val detail__val--pending">¥{order.pendingRefundAmount.toFixed(2)}</span>
          </div>
        )}
        {order.refundedAmount > 0 && (
          <div className="detail__row">
            <span className="detail__key">已退款</span>
            <span className="detail__val">¥{order.refundedAmount.toFixed(2)}</span>
          </div>
        )}
        {order.unitPrice && (
          <div className="detail__row">
            <span className="detail__key">单价</span>
            <span className="detail__val">¥{order.unitPrice.toFixed(2)}</span>
          </div>
        )}
        <div className="detail__row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginTop: 4 }}>
          <span className="detail__key" style={{ fontWeight: 600 }}>实际成本</span>
          <span className="detail__val detail__val--money">¥{(order.paidAmount - order.refundedAmount).toFixed(2)}</span>
        </div>
      </div>

      {/* ── 物流信息 ────────────────────────────── */}
      {(order.logisticsCompany || order.trackingNumber) && (
        <div className="detail__section">
          <div className="detail__section-title">物流</div>
          {order.logisticsCompany && (
            <div className="detail__row">
              <span className="detail__key">快递公司</span>
              <span className="detail__val">{order.logisticsCompany}</span>
            </div>
          )}
          {order.trackingNumber && (
            <div className="detail__row">
              <span className="detail__key">快递单号</span>
              <span className="detail__val">{order.trackingNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* ── 时间节点 ────────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-title">时间节点</div>
        {order.registerTime && (
          <div className="detail__row">
            <span className="detail__key">报名时间</span>
            <span className="detail__val">{formatTime(order.registerTime)}</span>
          </div>
        )}
        {order.payDeadline && (
          <div className="detail__row">
            <span className="detail__key">付款截止</span>
            <span className="detail__val">{formatTime(order.payDeadline)}</span>
          </div>
        )}
        {order.balanceDeadline && (
          <div className="detail__row">
            <span className="detail__key">补款截止</span>
            <span className="detail__val">{formatTime(order.balanceDeadline)}</span>
          </div>
        )}
        {order.distributeDeadline && (
          <div className="detail__row">
            <span className="detail__key">排发截止</span>
            <span className="detail__val">{formatTime(order.distributeDeadline)}</span>
          </div>
        )}
        {order.shipTime && (
          <div className="detail__row">
            <span className="detail__key">发货时间</span>
            <span className="detail__val">{formatTime(order.shipTime)}</span>
          </div>
        )}
        {order.receiveTime && (
          <div className="detail__row">
            <span className="detail__key">收货时间</span>
            <span className="detail__val">{formatTime(order.receiveTime)}</span>
          </div>
        )}
        <div className="detail__row">
          <span className="detail__key">最近更新</span>
          <span className="detail__val">{formatTime(order.lastUpdateTime)}</span>
        </div>
      </div>

      {/* ── 备注 ────────────────────────────────── */}
      {order.note && (
        <div className="detail__section">
          <div className="detail__section-title">备注</div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{order.note}</p>
        </div>
      )}

      {/* ── 付款记录 ────────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-header">
          <div className="detail__section-title">付款记录</div>
          <button className="detail__add-btn" onClick={() => setShowPaymentForm(!showPaymentForm)}>
            ＋ 付款
          </button>
        </div>

        {showPaymentForm && (
          <div className="detail__inline-form">
            <div className="detail__inline-row">
              <select className="form-select" value={formPayment.type} onChange={e => setFormPayment({ ...formPayment, type: e.target.value })}>
                {(['定金', '尾款', '代理费', '运费', '排发费', '补款', '全款', '其他'] as const).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                placeholder="¥ 金额"
                value={formPayment.amount}
                onChange={e => setFormPayment({ ...formPayment, amount: e.target.value.replace(/[^\d.]/g, '') })}
              />
            </div>
            <input
              className="form-input"
              placeholder="备注（可选）"
              value={formPayment.note}
              onChange={e => setFormPayment({ ...formPayment, note: e.target.value })}
            />
            <div className="detail__inline-actions">
              <button className="detail__inline-btn detail__inline-btn--cancel" onClick={() => setShowPaymentForm(false)}>取消</button>
              <button className="detail__inline-btn detail__inline-btn--save" onClick={handleAddPayment}>确认</button>
            </div>
          </div>
        )}

        {order.payments.length === 0 && !showPaymentForm && (
          <div className="detail__empty-hint">暂无付款记录</div>
        )}

        {order.payments.map(p => (
          <div className="detail__payment-item" key={p.id}>
            <div>
              <div className="detail__payment-type">{p.type}</div>
              {p.note && <div className="detail__payment-note">{p.note}</div>}
              <div className="detail__payment-date">{p.date}</div>
            </div>
            <div className="detail__payment-amount">-¥{p.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* ── 退款记录 ────────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-header">
          <div className="detail__section-title">退款记录</div>
          <button className="detail__add-btn" onClick={() => setShowRefundForm(!showRefundForm)}>
            ＋ 退款
          </button>
        </div>

        {showRefundForm && (
          <div className="detail__inline-form">
            <div className="detail__inline-row">
              <input
                className="form-input"
                placeholder="退款原因"
                value={formRefund.reason}
                onChange={e => setFormRefund({ ...formRefund, reason: e.target.value })}
              />
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                placeholder="¥ 金额"
                value={formRefund.amount}
                onChange={e => setFormRefund({ ...formRefund, amount: e.target.value.replace(/[^\d.]/g, '') })}
              />
            </div>
            <input
              className="form-input"
              placeholder="备注（可选）"
              value={formRefund.note}
              onChange={e => setFormRefund({ ...formRefund, note: e.target.value })}
            />
            <div className="detail__inline-actions">
              <button className="detail__inline-btn detail__inline-btn--cancel" onClick={() => setShowRefundForm(false)}>取消</button>
              <button className="detail__inline-btn detail__inline-btn--save" onClick={handleAddRefund}>确认</button>
            </div>
          </div>
        )}

        {order.refunds.length === 0 && !showRefundForm && (
          <div className="detail__empty-hint">暂无退款记录</div>
        )}

        {order.refunds.map(r => (
          <div className="detail__payment-item" key={r.id}>
            <div>
              <div className="detail__payment-type">{r.reason}</div>
              {r.note && <div className="detail__payment-note">{r.note}</div>}
              <div className="detail__payment-date">{r.date} {r.received ? '✓ 已到账' : '⏳ 未到账'}</div>
            </div>
            <div className="detail__payment-amount detail__payment-amount--refund">+¥{r.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* ── 进度时间线 ──────────────────────────── */}
      <div className="detail__section">
        <div className="detail__section-header">
          <div className="detail__section-title">进度记录</div>
          <button className="detail__add-btn" onClick={() => setShowProgressForm(!showProgressForm)}>
            ＋ 进度
          </button>
        </div>

        {showProgressForm && (
          <div className="detail__inline-form">
            <select className="form-select" value={formProgress.status} onChange={e => setFormProgress({ ...formProgress, status: e.target.value as OrderStatus })}>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="form-input"
              placeholder="备注（可选）"
              value={formProgress.note}
              onChange={e => setFormProgress({ ...formProgress, note: e.target.value })}
            />
            <div className="detail__inline-actions">
              <button className="detail__inline-btn detail__inline-btn--cancel" onClick={() => setShowProgressForm(false)}>取消</button>
              <button className="detail__inline-btn detail__inline-btn--save" onClick={handleAddProgress}>确认</button>
            </div>
          </div>
        )}

        {order.progressLog.length === 0 && !showProgressForm && (
          <div className="detail__empty-hint">暂无进度记录</div>
        )}

        {order.progressLog.length > 0 && (
          <div className="detail__timeline">
            {order.progressLog.slice().reverse().map(e => (
              <div className="detail__timeline-item" key={e.id}>
                <div className="detail__timeline-dot" style={{ background: STATUS_COLORS[e.status] || '#94a3b8' }} />
                <div className="detail__timeline-content">
                  <div className="detail__timeline-status" style={{ color: STATUS_COLORS[e.status] }}>{e.status}</div>
                  <div className="detail__timeline-date">{formatTime(e.date)}</div>
                  {e.note && <div className="detail__timeline-note">{e.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 操作按钮 ────────────────────────────── */}
      <div className="detail__actions">
        <button className="detail__action-btn detail__action-btn--secondary" onClick={() => navigate(`/edit/${order.id}`)}>
          编辑
        </button>
        <button className="detail__action-btn detail__action-btn--danger" onClick={handleDelete}>
          删除
        </button>
      </div>
    </div>
  )
}

/** 时间显示优化：智能格式化 */
function formatTime(dateStr: string): string {
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

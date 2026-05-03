import { useState } from 'react'
import type { RefundRecord } from '../../types'
import { genId, formatDate } from '../../utils/format'
import './RefundSection.css'

interface Props {
  refunds: RefundRecord[]
  onAdd: (refund: RefundRecord) => void
}

export function RefundSection({ refunds, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reason: '', amount: '', note: '' })

  const handleSubmit = () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) {
      alert('请输入有效金额')
      return
    }
    if (!form.reason.trim()) {
      alert('请填写退款原因')
      return
    }
    
    onAdd({
      id: genId('ref'),
      reason: form.reason.trim(),
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      received: false,
      note: form.note || undefined,
    })
    
    setShowForm(false)
    setForm({ reason: '', amount: '', note: '' })
  }

  return (
    <div className="refund-section">
      <div className="refund-section__header">
        <div className="refund-section__title">退款记录</div>
        <button className="refund-section__add" onClick={() => setShowForm(!showForm)}>
          ＋ 退款
        </button>
      </div>

      {showForm && (
        <div className="refund-section__form">
          <div className="refund-section__row">
            <input
              placeholder="退款原因"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="¥ 金额"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, '') })}
            />
          </div>
          <input
            placeholder="备注（可选）"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />
          <div className="refund-section__actions">
            <button className="refund-section__btn refund-section__btn--cancel" onClick={() => setShowForm(false)}>
              取消
            </button>
            <button className="refund-section__btn refund-section__btn--save" onClick={handleSubmit}>
              确认
            </button>
          </div>
        </div>
      )}

      {refunds.length === 0 && !showForm && (
        <div className="refund-section__empty">暂无退款记录</div>
      )}

      <div className="refund-section__list">
        {refunds.map(r => (
          <div key={r.id} className="refund-section__item">
            <div>
              <div className="refund-section__type">{r.reason}</div>
              {r.note && <div className="refund-section__note">{r.note}</div>}
              <div className="refund-section__date">
                {formatDate(r.date)} {r.received ? '✓ 已到账' : '⏳ 未到账'}
              </div>
            </div>
            <div className="refund-section__amount">+¥{r.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

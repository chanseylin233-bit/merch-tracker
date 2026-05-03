import { useState } from 'react'
import type { PaymentRecord } from '../../types'
import { genId, formatDate } from '../../utils/format'
import './PaymentSection.css'

interface Props {
  payments: PaymentRecord[]
  onAdd: (payment: PaymentRecord) => void
}

export function PaymentSection({ payments, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: '定金' as const, amount: '', note: '' })

  const handleSubmit = () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) {
      alert('请输入有效金额')
      return
    }
    
    onAdd({
      id: genId('pay'),
      type: form.type,
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      note: form.note || undefined,
    })
    
    setShowForm(false)
    setForm({ type: '定金', amount: '', note: '' })
  }

  return (
    <div className="payment-section">
      <div className="payment-section__header">
        <div className="payment-section__title">付款记录</div>
        <button className="payment-section__add" onClick={() => setShowForm(!showForm)}>
          ＋ 付款
        </button>
      </div>

      {showForm && (
        <div className="payment-section__form">
          <div className="payment-section__row">
            <select 
              value={form.type} 
              onChange={e => setForm({ ...form, type: e.target.value as any })}
            >
              {(['定金', '尾款', '代理费', '运费', '排发费', '补款', '全款', '其他'] as const).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
          <div className="payment-section__actions">
            <button className="payment-section__btn payment-section__btn--cancel" onClick={() => setShowForm(false)}>
              取消
            </button>
            <button className="payment-section__btn payment-section__btn--save" onClick={handleSubmit}>
              确认
            </button>
          </div>
        </div>
      )}

      {payments.length === 0 && !showForm && (
        <div className="payment-section__empty">暂无付款记录</div>
      )}

      <div className="payment-section__list">
        {payments.map(p => (
          <div key={p.id} className="payment-section__item">
            <div>
              <div className="payment-section__type">{p.type}</div>
              {p.note && <div className="payment-section__note">{p.note}</div>}
              <div className="payment-section__date">{formatDate(p.date)}</div>
            </div>
            <div className="payment-section__amount">-¥{p.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

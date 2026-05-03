import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Order, OrderStatus } from '../types'
import { ALL_STATUSES, NEXT_ACTION_MAP } from '../types'
import { now } from '../utils/storage'
import { useGroupNames, useRecentCharacterTags } from '../hooks/useOrders'
import './AddEdit.css'

const DEFAULT_FORM: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'payments' | 'refunds' | 'progressLog' | 'attachments' | 'customNextAction'> & { attachments: string[]; customNextAction?: string } = {
  title: '',
  characterTags: [],
  productType: '',
  theme: '',
  publisher: '',
  quantity: 1,
  groupName: '',
  leader: '',
  platform: '',
  batch: '',
  unitPrice: undefined,
  subtotal: undefined,
  paidAmount: 0,
  pendingAmount: 0,
  pendingRefundAmount: 0,
  refundedAmount: 0,
  status: '观望中',
  registerTime: '',
  payDeadline: '',
  balanceDeadline: '',
  distributeDeadline: '',
  shipTime: '',
  receiveTime: '',
  lastUpdateTime: '',
  logisticsCompany: '',
  trackingNumber: '',
  receivedConfirmed: false,
  note: '',
  attachments: [],
}

/** 从显示值解析金额 */
function parseAmount(val: string): number | undefined {
  if (!val) return undefined
  const n = parseFloat(val)
  return isNaN(n) ? undefined : n
}

/** 金额输入组件 */
function AmountInput({ value, onChange, placeholder }: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
}) {
  const [display, setDisplay] = useState(() => value !== undefined && value !== 0 ? String(value) : '')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDisplay(value !== undefined && value !== 0 ? String(value) : '')
    }
  }, [value, focused])

  return (
    <div className="amount-input">
      <span className="amount-input__prefix">¥</span>
      <input
        className="amount-input__field"
        type="text"
        inputMode="decimal"
        placeholder={placeholder || '0.00'}
        value={display}
        onChange={e => {
          const raw = e.target.value.replace(/[^\d.]/g, '')
          // 只允许一个小数点
          const parts = raw.split('.')
          const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw
          setDisplay(cleaned)
          onChange(parseAmount(cleaned))
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          if (display) {
            const n = parseFloat(display)
            if (!isNaN(n)) setDisplay(n.toFixed(2))
          }
        }}
      />
    </div>
  )
}

export function AddEditPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch, productTypes, genId } = useApp()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const existing = isEdit ? state.orders.find(o => o.id === id) : null

  // 重置表单为默认值
  const resetForm = useCallback(() => setForm(DEFAULT_FORM), [])

  const [form, setForm] = useState<typeof DEFAULT_FORM>(() =>
    existing
      ? { ...DEFAULT_FORM, ...existing, customNextAction: existing.customNextAction }
      : { ...DEFAULT_FORM, lastUpdateTime: now(), paidAmount: 0 }
  )
  const [tagInput, setTagInput] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [showDeadline, setShowDeadline] = useState(false)
  const [showLogistics, setShowLogistics] = useState(false)
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)

  // 从已有记录提取拼团群和角色标签
  const existingGroups = useGroupNames()
  const recentTags = useRecentCharacterTags()

  // 拼团群输入过滤
  const filteredGroups = existingGroups.filter(g =>
    g.toLowerCase().includes((form.groupName || '').toLowerCase()) && g !== form.groupName
  )

  // 角色标签建议（排除已选）
  const tagSuggestions = recentTags.filter(t => !form.characterTags.includes(t))

  // ── 需求4：表单暂存（切换 tab 保留数据） ──────────────────────
  const DRAFT_KEY = 'merch_tracker_draft'

  // 非编辑模式下，离开页面前暂存表单
  useEffect(() => {
    if (isEdit) return
    return () => {
      // 只在新增模式且表单有内容时暂存
      if (form.title || form.groupName || form.paidAmount > 0 || form.characterTags.length > 0) {
        try {
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        } catch { /* ignore */ }
      }
    }
  }, [form, isEdit])

  // 进入新增模式时恢复暂存
  useEffect(() => {
    if (isEdit || existing) return
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.title || draft.groupName || draft.paidAmount > 0 || draft.characterTags?.length > 0) {
          setForm(draft)
        }
      }
    } catch { /* ignore */ }
  }, [isEdit, existing])

  // 成功提交后清除暂存
  const clearDraft = useCallback(() => {
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
  }, [])

  // ── 未保存提醒（初始化后立即记录基准值） ──
  const savedRef = useRef('__init__')

  // 组件挂载后（form 已初始化）记录基准值
  useEffect(() => {
    const baseline = form.title + '|' + form.productType + '|' + form.quantity + '|' +
      form.groupName + '|' + form.leader + '|' + form.batch + '|' +
      form.paidAmount + '|' + form.pendingAmount + '|' + form.status + '|' + form.note +
      '|' + form.characterTags.join(',')
    savedRef.current = baseline
    setHasChanged(false)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  // 依赖空数组：只在 mount 时执行一次，之后由下方的 useEffect 接管变化检测

  // ── 未保存提醒（字段级比较，避免 JSON.stringify 每次渲染开销） ──
  // 追踪关键字段：只要任意一个变化就认为有改动
  const [hasChanged, setHasChanged] = useState(false)

  useEffect(() => {
    const current = form.title + '|' + form.productType + '|' + form.quantity + '|' +
      form.groupName + '|' + form.leader + '|' + form.batch + '|' +
      form.paidAmount + '|' + form.pendingAmount + '|' + form.status + '|' + form.note +
      '|' + form.characterTags.join(',')
    // 仅在非初始化时检测变化（避免 mount 时误报）
    if (savedRef.current !== '__init__') {
      setHasChanged(current !== savedRef.current)
    }
  }, [form.title, form.productType, form.quantity, form.groupName, form.leader, form.batch,
       form.paidAmount, form.pendingAmount, form.status, form.note, form.characterTags])

  const handleNavigateBack = useCallback(() => {
    if (hasChanged) {
      const ok = confirm('有未保存的修改，确定离开吗？')
      if (!ok) return
    }
    navigate(-1)
  }, [hasChanged, navigate])

  // 浏览器关闭/刷新提醒
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanged) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanged])

  // 自动展开已有数据的折叠区域
  useEffect(() => {
    if (existing) {
      if (existing.theme || existing.publisher || existing.platform) setShowMore(true)
      if (existing.balanceDeadline || existing.distributeDeadline || existing.registerTime) setShowDeadline(true)
      if (existing.logisticsCompany || existing.trackingNumber) setShowLogistics(true)
    }
  }, [existing])

  const set = (key: keyof typeof DEFAULT_FORM, value: unknown) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (t && !form.characterTags.includes(t)) {
      setForm(f => ({ ...f, characterTags: [...f.characterTags, t] }))
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, characterTags: f.characterTags.filter(t => t !== tag) }))
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { alert('请填写制品标题'); return }
    if (!form.productType) { alert('请选择制品类型'); return }

    const ts = now()
    const order: Order = {
      id: existing?.id ?? genId(),
      ...form,
      lastUpdateTime: ts,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
      payments: existing?.payments ?? [],
      refunds: existing?.refunds ?? [],
      progressLog: existing?.progressLog ?? [],
      customNextAction: form.customNextAction || NEXT_ACTION_MAP[form.status as OrderStatus],
    }

    if (isEdit) {
      dispatch({ type: 'UPDATE_ORDER', order })
      // 编辑模式：提交后不再追踪表单变化，因为已导航离开
      savedRef.current = '__submitted__'
      setHasChanged(false)
    } else {
      dispatch({ type: 'ADD_ORDER', order })
      savedRef.current = '__submitted__'
      setHasChanged(false)
      clearDraft()
      resetForm()  // 新增后重置表单
    }
    navigate(`/detail/${order.id}`)
  }

  return (
    <div className="add">
      <div className="add__header">
        <div className="add__back" onClick={handleNavigateBack}>← 返回</div>
        <div className="add__title">{isEdit ? '编辑记录' : '新增记录'}</div>
        {hasChanged && <div className="add__unsaved-dot" title="有未保存的修改" />}
      </div>

      <div className="add__form">
        {/* ═══ 基本信息 ═══ */}
        <div className="add__group-label">基本信息</div>

        <div className="form-group">
          <label className="form-label form-label--required">制品标题</label>
          <input className="form-input" placeholder="如：苏茜温泉旋转立牌" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label form-label--required">制品类型</label>
            <select className="form-select" value={form.productType} onChange={e => set('productType', e.target.value)}>
              <option value="">请选择</option>
              {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">数量</label>
            <input className="form-input" type="number" min="1" value={form.quantity} onChange={e => set('quantity', parseInt(e.target.value) || 1)} />
          </div>
        </div>

        {/* 角色标签 */}
        <div className="form-group">
          <label className="form-label">角色/主题标签</label>
          {tagSuggestions.length > 0 && (
            <div className="add__tag-suggestions">
              <span className="add__tag-suggestions-label">近期：</span>
              {tagSuggestions.map(t => (
                <button
                  type="button"
                  key={t}
                  className="add__tag-suggestion-btn"
                  onClick={() => addTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <div className="add__tags-input">
            {form.characterTags.map(t => (
              <span className="add__tag-chip" key={t}>
                {t} <span className="add__tag-remove" onClick={() => removeTag(t)}>×</span>
              </span>
            ))}
            <input
              style={{ border: 'none', outline: 'none', fontSize: 12, width: 70, background: 'transparent' }}
              placeholder="添加标签"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
              onBlur={() => tagInput && addTag(tagInput)}
            />
          </div>
        </div>

        {/* 展开：主题/出品方/平台 */}
        <button className="add__collapse-toggle" onClick={() => setShowMore(!showMore)}>
          {showMore ? '▼ 更多信息' : '▶ 更多信息（主题/出品方/平台）'}
        </button>
        {showMore && (
          <div className="add__collapse-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">主题/系列</label>
                <input className="form-input" placeholder="如：温泉篇" value={form.theme} onChange={e => set('theme', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">出品方/画手</label>
                <input className="form-input" placeholder="企划名或画手" value={form.publisher} onChange={e => set('publisher', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">平台</label>
              <input className="form-input" placeholder="QQ/微店/闲鱼/其他" value={form.platform} onChange={e => set('platform', e.target.value)} />
            </div>
          </div>
        )}

        {/* ═══ 金额 ═══ */}
        <div className="add__group-label">金额</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">已付金额</label>
            <AmountInput value={form.paidAmount || undefined} onChange={v => set('paidAmount', v ?? 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">待付金额</label>
            <AmountInput value={form.pendingAmount || undefined} onChange={v => set('pendingAmount', v ?? 0)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">单价</label>
            <AmountInput value={form.unitPrice} onChange={v => set('unitPrice', v)} />
          </div>
          <div className="form-group">
            <label className="form-label">小计</label>
            <AmountInput value={form.subtotal} onChange={v => set('subtotal', v)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">待退款</label>
            <AmountInput value={form.pendingRefundAmount || undefined} onChange={v => set('pendingRefundAmount', v ?? 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">已退款</label>
            <AmountInput value={form.refundedAmount || undefined} onChange={v => set('refundedAmount', v ?? 0)} />
          </div>
        </div>

        {/* ═══ 拼团信息 ═══ */}
        <div className="add__group-label">拼团信息</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">团长</label>
            <input className="form-input" placeholder="团长昵称" value={form.leader} onChange={e => set('leader', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">批次</label>
            <input className="form-input" placeholder="一团/二团/再贩…" value={form.batch} onChange={e => set('batch', e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">拼团群</label>
          <input
            className="form-input"
            placeholder="群名称"
            value={form.groupName || ''}
            onChange={e => {
              set('groupName', e.target.value)
              setShowGroupDropdown(true)
            }}
            onFocus={() => setShowGroupDropdown(true)}
            onBlur={() => setTimeout(() => setShowGroupDropdown(false), 150)}
          />
          {showGroupDropdown && filteredGroups.length > 0 && (
            <div className="add__dropdown">
              {filteredGroups.map(g => (
                <div
                  key={g}
                  className="add__dropdown-item"
                  onMouseDown={e => {
                    e.preventDefault()
                    set('groupName', g)
                    setShowGroupDropdown(false)
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ 状态 ═══ */}
        <div className="add__group-label">状态</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label form-label--required">当前状态</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">自定义下一步</label>
            <input className="form-input" placeholder="覆盖默认下一步动作" value={form.customNextAction ?? ''} onChange={e => set('customNextAction', e.target.value || undefined)} />
          </div>
        </div>

        {/* ═══ 时间节点 ═══ */}
        <div className="add__group-label">时间节点</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">报名时间</label>
            <input className="form-input" type="datetime-local" value={form.registerTime} onChange={e => set('registerTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">付款截止</label>
            <input className="form-input" type="datetime-local" value={form.payDeadline} onChange={e => set('payDeadline', e.target.value)} />
          </div>
        </div>

        <button className="add__collapse-toggle" onClick={() => setShowDeadline(!showDeadline)}>
          {showDeadline ? '▼ 更多截止时间' : '▶ 更多截止时间（补款/排发/发货/收货）'}
        </button>
        {showDeadline && (
          <div className="add__collapse-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">补款截止</label>
                <input className="form-input" type="datetime-local" value={form.balanceDeadline} onChange={e => set('balanceDeadline', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">排发截止</label>
                <input className="form-input" type="datetime-local" value={form.distributeDeadline} onChange={e => set('distributeDeadline', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">发货时间</label>
                <input className="form-input" type="datetime-local" value={form.shipTime} onChange={e => set('shipTime', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">收货时间</label>
                <input className="form-input" type="datetime-local" value={form.receiveTime} onChange={e => set('receiveTime', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ 物流 ═══ */}
        <button className="add__collapse-toggle" onClick={() => setShowLogistics(!showLogistics)}>
          {showLogistics ? '▼ 物流信息' : '▶ 物流信息（快递公司/单号）'}
        </button>
        {showLogistics && (
          <div className="add__collapse-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">快递公司</label>
                <input className="form-input" placeholder="顺丰/中通/圆通…" value={form.logisticsCompany} onChange={e => set('logisticsCompany', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">快递单号</label>
                <input className="form-input" placeholder="物流追踪号" value={form.trackingNumber} onChange={e => set('trackingNumber', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ 备注 ═══ */}
        <div className="form-group">
          <label className="form-label">备注</label>
          <textarea className="form-textarea" placeholder="可选" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>

        <div className="add__actions">
          <button className="add__btn add__btn--cancel" onClick={handleNavigateBack}>取消</button>
          <button className="add__btn add__btn--save" onClick={handleSubmit}>{isEdit ? '保存' : '创建'}</button>
        </div>
      </div>
    </div>
  )
}

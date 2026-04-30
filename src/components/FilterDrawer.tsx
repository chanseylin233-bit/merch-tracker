import { useState } from 'react'
import { ALL_STATUSES, DEFAULT_PRODUCT_TYPES } from '../types'
import './FilterDrawer.css'

export interface FilterState {
  status: string
  productType: string
  year: string
  keyword: string
  characterTag: string
  showIncomplete: boolean
}

interface Props {
  open: boolean
  filters: FilterState
  onChange: (f: FilterState) => void
  onClose: () => void
  characterTags: string[]
}

const YEARS = ['全部', '2026', '2025', '2024']

export function FilterDrawer({ open, filters, onChange, onClose, characterTags }: Props) {
  const [draft, setDraft] = useState<FilterState>(filters)

  if (!open) return null

  const chip = (key: keyof FilterState, value: string, current: string) => (
    <button
      key={value}
      className={`filter-drawer__chip ${current === value ? 'active' : ''}`}
      onClick={() => setDraft({ ...draft, [key]: value })}
    >
      {value}
    </button>
  )

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-drawer" onClick={e => e.stopPropagation()}>
        <div className="filter-drawer__title">筛选</div>

        <div className="filter-drawer__section">
          <div className="filter-drawer__label">状态</div>
          <div className="filter-drawer__chips">
            {chip('status', '全部', draft.status)}
            {ALL_STATUSES.map(s => chip('status', s, draft.status))}
          </div>
        </div>

        <div className="filter-drawer__section">
          <div className="filter-drawer__label">制品类型</div>
          <div className="filter-drawer__chips">
            {chip('productType', '全部', draft.productType)}
            {DEFAULT_PRODUCT_TYPES.map(t => chip('productType', t, draft.productType))}
          </div>
        </div>

        {characterTags.length > 0 && (
          <div className="filter-drawer__section">
            <div className="filter-drawer__label">角色</div>
            <div className="filter-drawer__chips">
              <button
                className={`filter-drawer__chip ${draft.characterTag === '' ? 'active' : ''}`}
                onClick={() => setDraft({ ...draft, characterTag: '' })}
              >
                全部
              </button>
              {characterTags.map(t => (
                <button
                  key={t}
                  className={`filter-drawer__chip ${draft.characterTag === t ? 'active' : ''}`}
                  onClick={() => setDraft({ ...draft, characterTag: t === draft.characterTag ? '' : t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="filter-drawer__section">
          <div className="filter-drawer__label">年份</div>
          <div className="filter-drawer__chips">
            {YEARS.map(y => chip('year', y, draft.year))}
          </div>
        </div>

        <div className="filter-drawer__section">
          <div className="filter-drawer__label">关键词</div>
          <input
            type="text"
            value={draft.keyword}
            onChange={e => setDraft({ ...draft, keyword: e.target.value })}
            placeholder="搜索制品、团长、群名…"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
          />
        </div>

        <div className="filter-drawer__actions">
          <button
            className="filter-drawer__btn filter-drawer__btn--reset"
            onClick={() => { const fresh: FilterState = { status: '全部', productType: '全部', year: '全部', keyword: '', characterTag: '', showIncomplete: false }; setDraft(fresh); onChange(fresh); onClose(); }}
          >
            重置
          </button>
          <button
            className="filter-drawer__btn filter-drawer__btn--apply"
            onClick={() => { onChange(draft); onClose(); }}
          >
            应用
          </button>
        </div>
      </div>
    </div>
  )
}

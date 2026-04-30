import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { OrderCard } from '../components/OrderCard'
import { FilterDrawer } from '../components/FilterDrawer'
import { useFilteredOrders, useSearchOrders, useCharacterTags } from '../hooks/useOrders'

import { cleanupOldData, type FilterState } from '../utils/orders'
import { getStorageUsage } from '../utils/storage'
import { STATUS_COLORS, TERMINATED_STATUSES, type OrderStatus } from '../types'
import './Records.css'

export function RecordsPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ 
    status: '全部', 
    productType: '全部', 
    year: '全部', 
    keyword: '', 
    characterTag: '',
    showIncomplete: false
  })
  const [search, setSearch] = useState('')
  
  // 批量操作状态
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchStatusOpen, setBatchStatusOpen] = useState(false)
  const [statusToSet, setStatusToSet] = useState<OrderStatus | ''>('')
  
  // 使用 hooks
  const filteredByFilter = useFilteredOrders(filters)
  const filtered = useSearchOrders(search)
  const displayList = search ? filtered : filteredByFilter
  const allCharTags = useCharacterTags()
  
  // 容量监控
  const storage = getStorageUsage()
  const showCapacityWarning = storage.percent > 0.8


  const activeFilterCount = [filters.status, filters.productType, filters.year]
    .filter(v => v !== '全部').length + (filters.keyword ? 1 : 0) + (filters.characterTag ? 1 : 0)

  // 批量操作
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => setSelectedIds(new Set(displayList.map(o => o.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const batchDelete = () => {
    if (selectedIds.size === 0) return
    if (!confirm(`确定删除选中的 ${selectedIds.size} 条记录吗？`)) return
    dispatch({ type: 'BATCH_DELETE', ids: [...selectedIds] })
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const doBatchSetStatus = () => {
    if (selectedIds.size === 0 || !statusToSet) return
    dispatch({ type: 'BATCH_SET_STATUS', ids: [...selectedIds], status: statusToSet })
    setSelectedIds(new Set())
    setSelectMode(false)
    setBatchStatusOpen(false)
    setStatusToSet('')
  }

  const doCleanup = () => {
    const kept = cleanupOldData(state.orders, 12)
    const removed = state.orders.length - kept.length
    if (removed === 0) {
      alert('无需清理，所有记录都在保留期内')
      return
    }
    if (!confirm(`将删除 ${removed} 条超过12个月的已完成记录，确定吗？`)) return
    dispatch({ type: 'IMPORT_DATA', state: { ...state, orders: kept } })
  }

  return (
    <div className="records">
      {/* 容量警告 */}
      {showCapacityWarning && (
        <div className="records__capacity-warning">
          <span>⚠️ 存储空间已用 {Math.round(storage.percent * 100)}%</span>
          <button onClick={doCleanup}>清理旧数据</button>
        </div>
      )}

      <div className="records__header">
        <div className="records__title-row">
          <div className="records__title">拼团记录</div>
          <button 
            className={`records__select-btn ${selectMode ? 'active' : ''}`}
            onClick={() => {
              setSelectMode(!selectMode)
              setSelectedIds(new Set())
            }}
          >
            {selectMode ? '取消' : '多选'}
          </button>
        </div>
        
        <div className="records__toolbar">
          <input 
            className="records__search" 
            placeholder="搜索…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <button className="records__filter-btn" onClick={() => setFilterOpen(true)}>
            筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
        
        {activeFilterCount > 0 && (
          <div className="records__active-filters">
            {filters.status !== '全部' && <span className="records__active-chip">{filters.status}</span>}
            {filters.productType !== '全部' && <span className="records__active-chip">{filters.productType}</span>}
            {filters.year !== '全部' && <span className="records__active-chip">{filters.year}</span>}
            {filters.characterTag && <span className="records__active-chip">{filters.characterTag}</span>}
            {filters.keyword && <span className="records__active-chip">"{filters.keyword}"</span>}
          </div>
        )}
      </div>

      <div className="records__list">
        {displayList.length === 0 ? (
          <div className="records__empty">暂无记录</div>
        ) : (
          displayList.map(o => (
            <div key={o.id} className="records__item">
              {selectMode && (
                <input
                  type="checkbox"
                  className="records__checkbox"
                  checked={selectedIds.has(o.id)}
                  onChange={() => toggleSelect(o.id)}
                />
              )}
              <div 
                className="records__card-wrap" 
                onClick={() => !selectMode && navigate(`/detail/${o.id}`)}
              >
                <OrderCard order={o} onClick={() => {}} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 批量操作栏 */}
      {selectMode && (
        <div className="records__batch-bar">
          <div className="records__batch-left">
            <button className="records__batch-link" onClick={selectAll}>全选</button>
            <button className="records__batch-link" onClick={clearSelection}>取消</button>
            <span className="records__batch-count">已选 {selectedIds.size} 项</span>
          </div>
          <div className="records__batch-actions">
            <button 
              className="records__batch-btn" 
              disabled={selectedIds.size === 0}
              onClick={() => setBatchStatusOpen(true)}
            >
              改状态
            </button>
            <button 
              className="records__batch-btn records__batch-btn--danger" 
              disabled={selectedIds.size === 0}
              onClick={batchDelete}
            >
              删除
            </button>
          </div>
        </div>
      )}

      {/* 批量改状态弹窗 */}
      {batchStatusOpen && (
        <div className="records__modal-overlay" onClick={() => setBatchStatusOpen(false)}>
          <div className="records__modal" onClick={e => e.stopPropagation()}>
            <div className="records__modal-title">选择新状态</div>
            <div className="records__modal-statuses">
              {([
                '观望中', '已报名/已占位', '拼团中', '拼团成功待付款', 
                '已付定金待尾款', '待补尾款', '已付款待发货', 
                '已到团长处待排发', '已申请排发待发货', 
                '已发货待收货', '已收货已完成'
              ] as OrderStatus[]).map(s => (
                <button
                  key={s}
                  className={`records__modal-status ${statusToSet === s ? 'active' : ''}`}
                  style={{ borderColor: STATUS_COLORS[s] || '#718096' }}
                  onClick={() => setStatusToSet(s)}
                >
                  {s}
                </button>
              ))}
              {TERMINATED_STATUSES.map(s => (
                <button
                  key={s}
                  className={`records__modal-status ${statusToSet === s ? 'active' : ''}`}
                  style={{ borderColor: STATUS_COLORS[s] || '#718096' }}
                  onClick={() => setStatusToSet(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="records__modal-actions">
              <button className="records__modal-cancel" onClick={() => setBatchStatusOpen(false)}>
                取消
              </button>
              <button 
                className="records__modal-confirm" 
                disabled={!statusToSet}
                onClick={doBatchSetStatus}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterDrawer
        open={filterOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
        characterTags={allCharTags}
      />
    </div>
  )
}

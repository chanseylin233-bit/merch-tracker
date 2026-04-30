import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { DEFAULT_PRODUCT_TYPES, type Theme } from '../types'
import './Settings.css'

export function SettingsPage() {
  const { state, dispatch, theme, setTheme } = useApp()
  const [newType, setNewType] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState<{ orders: number; types: number; valid: boolean } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddType = () => {
    const t = newType.trim()
    if (!t) return
    if (DEFAULT_PRODUCT_TYPES.includes(t) || state.customProductTypes.includes(t)) {
      alert('该类型已存在')
      return
    }
    dispatch({ type: 'ADD_PRODUCT_TYPE', name: t })
    setNewType('')
  }

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merch-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseImport = (text: string) => {
    setImportText(text)
    try {
      const data = JSON.parse(text)
      if (!data.orders || !Array.isArray(data.orders)) {
        setImportPreview({ orders: 0, types: 0, valid: false })
        return
      }
      setImportPreview({
        orders: data.orders.length,
        types: (data.customProductTypes || []).length,
        valid: true,
      })
    } catch {
      setImportPreview({ orders: 0, types: 0, valid: false })
    }
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importText)
      if (!data.orders || !Array.isArray(data.orders)) {
        throw new Error('无效的数据格式')
      }
      dispatch({ type: 'IMPORT_DATA', state: data })
      setShowImport(false)
      setImportText('')
      setImportPreview(null)
      alert(`导入成功！共 ${data.orders.length} 条记录`)
    } catch (e: any) {
      alert('导入失败：' + e.message)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('请选择 .json 格式的备份文件')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseImport(text)
      setShowImport(true)
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleClearAll = () => {
    if (confirm('确定清空所有数据吗？此操作不可恢复！')) {
      if (confirm('再次确认：真的要清空所有记录吗？')) {
        dispatch({ type: 'CLEAR_ALL' })
      }
    }
  }

  return (
    <div className="settings">
      <div className="settings__title">设置 ✨</div>

      {/* 主题切换 */}
      <div className="settings__card">
        <div className="settings__card-header">
          <span className="settings__card-icon settings__card-icon--purple">🎨</span>
          <span className="settings__card-title">主题风格</span>
        </div>
        <div className="settings__theme-switcher">
          <button
            className={`settings__theme-opt ${theme === 'warm-pink' ? 'active' : ''}`}
            onClick={() => setTheme('warm-pink')}
          >
            <span className="settings__theme-preview settings__theme-preview--pink" />
            <span className="settings__theme-name">粉紫暖色</span>
            {theme === 'warm-pink' && <span className="settings__theme-check">✓</span>}
          </button>
          <button
            className={`settings__theme-opt ${theme === 'clean-purple' ? 'active' : ''}`}
            onClick={() => setTheme('clean-purple')}
          >
            <span className="settings__theme-preview settings__theme-preview--purple" />
            <span className="settings__theme-name">极简紫</span>
            {theme === 'clean-purple' && <span className="settings__theme-check">✓</span>}
          </button>
          <button
            className={`settings__theme-opt ${theme === 'journal' ? 'active' : ''}`}
            onClick={() => setTheme('journal')}
          >
            <span className="settings__theme-preview settings__theme-preview--journal" />
            <span className="settings__theme-name">手账本</span>
            {theme === 'journal' && <span className="settings__theme-check">✓</span>}
          </button>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="settings__card">
        <div className="settings__card-header">
          <span className="settings__card-icon settings__card-icon--pink">📊</span>
          <span className="settings__card-title">数据统计</span>
        </div>
        <div className="settings__stat">
          <span>总记录数</span>
          <span className="settings__stat-value">{state.orders.length}</span>
        </div>
        <div className="settings__stat">
          <span>自定义制品类型</span>
          <span className="settings__stat-value">{state.customProductTypes.length}</span>
        </div>
      </div>

      {/* 制品类型管理 */}
      <div className="settings__card">
        <div className="settings__card-header">
          <span className="settings__card-icon settings__card-icon--red">🎨</span>
          <span className="settings__card-title">制品类型</span>
        </div>
        <div className="settings__types">
          {DEFAULT_PRODUCT_TYPES.map(t => (
            <span className="settings__type-chip" key={t}>{t}</span>
          ))}
          {state.customProductTypes.map(t => (
            <span className="settings__type-chip settings__type-chip--custom" key={t}>
              {t}
              <span className="settings__type-remove" onClick={() => dispatch({ type: 'REMOVE_PRODUCT_TYPE', name: t })}>×</span>
            </span>
          ))}
        </div>
        <div className="settings__add-type">
          <input
            className="settings__input"
            placeholder="添加新类型"
            value={newType}
            onChange={e => setNewType(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddType()}
          />
          <button className="settings__btn settings__btn--gradient" onClick={handleAddType}>添加</button>
        </div>
      </div>

      {/* 数据备份 */}
      <div className="settings__card">
        <div className="settings__card-header">
          <span className="settings__card-icon settings__card-icon--blue">☁️</span>
          <span className="settings__card-title">数据备份</span>
        </div>
        <div className="settings__actions">
          <button className="settings__btn settings__btn--outline-pink" onClick={handleExport}>
            ⬇ 导出备份
          </button>
          <button className="settings__btn settings__btn--outline-blue" onClick={() => { setShowImport(!showImport); setImportPreview(null) }}>
            ⬆ 导入数据
          </button>
        </div>

        {showImport && (
          <div className="settings__import">
            <div
              className={`settings__dropzone ${dragOver ? 'settings__dropzone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="settings__dropzone-icon">📂</div>
              <div className="settings__dropzone-text">
                {dragOver ? '松开导入文件' : '点击选择或拖拽 .json 文件到此处'}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
              />
            </div>

            <div className="settings__or-divider">或手动粘贴</div>

            <textarea
              className="settings__textarea"
              placeholder="粘贴备份的 JSON 数据..."
              value={importText}
              onChange={e => parseImport(e.target.value)}
            />

            {importPreview && (
              <div className={`settings__import-preview ${importPreview.valid ? 'valid' : 'invalid'}`}>
                {importPreview.valid ? (
                  <>
                    <span>✅ 识别到 <strong>{importPreview.orders}</strong> 条记录</span>
                    {importPreview.types > 0 && <>，<strong>{importPreview.types}</strong> 个自定义类型</>}
                  </>
                ) : (
                  <>❌ 无效的数据格式，请检查 JSON 内容</>
                )}
              </div>
            )}

            <button
              className="settings__btn settings__btn--gradient"
              onClick={handleImport}
              disabled={!importPreview?.valid}
              style={{ width: '100%', marginTop: 8, opacity: importPreview?.valid ? 1 : 0.5 }}
            >
              确认导入
            </button>
          </div>
        )}
      </div>

      {/* 危险操作 */}
      <div className="settings__card settings__card--danger">
        <div className="settings__card-header">
          <span className="settings__card-icon settings__card-icon--warn">⚠️</span>
          <span className="settings__card-title">危险操作</span>
        </div>
        <button className="settings__btn settings__btn--danger" onClick={handleClearAll}>
          🗑 清空所有数据
        </button>
      </div>

      {/* 关于 */}
      <div className="settings__card">
        <div className="settings__card-header">
          <span className="settings__card-icon settings__card-icon--purple">ℹ️</span>
          <span className="settings__card-title">关于</span>
        </div>
        <p className="settings__about">
          苏茜周边拼团记录工具<br />
          数据存储在浏览器本地，请定期备份。<br />
          版本：1.1.0
        </p>
      </div>
    </div>
  )
}

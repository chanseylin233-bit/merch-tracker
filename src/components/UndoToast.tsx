import { useApp } from '../context/AppContext'
import { Undo2, Redo2 } from 'lucide-react'
import './UndoToast.css'

export function UndoToast() {
  const { canUndo, canRedo, undo, redo, historyLength } = useApp()
  
  if (!canUndo && !canRedo) return null
  
  return (
    <div className="undo-toast">
      <button 
        className={`undo-toast__btn ${!canUndo ? 'disabled' : ''}`}
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </button>
      <div className="undo-toast__count">{historyLength}</div>
      <button 
        className={`undo-toast__btn ${!canRedo ? 'disabled' : ''}`}
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </button>
    </div>
  )
}
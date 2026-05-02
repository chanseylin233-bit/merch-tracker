import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { HomePage } from './pages/Home'
import { RecordsPage } from './pages/Records'
import { AddEditPage } from './pages/AddEdit'
import { DetailPage } from './pages/Detail'
import { StatsPage } from './pages/Stats'
import { SettingsPage } from './pages/Settings'
import { TabBar } from './components/TabBar'
import { UndoToast } from './components/UndoToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

// 内层：可访问 AppContext，监听键盘
function AppInner() {
  const { canUndo, canRedo, undo, redo } = useApp()
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) undo()
      }
      // Ctrl+Y / Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo) redo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, undo, redo])
  
  return (
    <BrowserRouter>
      <div className="app">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/add" element={<AddEditPage />} />
            <Route path="/edit/:id" element={<AddEditPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </ErrorBoundary>
        <TabBar />
        <UndoToast />
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}

export default App
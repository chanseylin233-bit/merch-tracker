import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { HomePage } from './pages/Home'
import { RecordsPage } from './pages/Records'
import { AddEditPage } from './pages/AddEdit'
import { DetailPage } from './pages/Detail'
import { StatsPage } from './pages/Stats'
import { SettingsPage } from './pages/Settings'
import { TabBar } from './components/TabBar'
import './App.css'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/add" element={<AddEditPage />} />
            <Route path="/edit/:id" element={<AddEditPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
          <TabBar />
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useTodoGroups, useActiveOrders } from '../hooks/useOrders'
import { OrderCard } from '../components/OrderCard'
import { formatMoney } from '../utils/format'
import { isTerminated } from '../utils/orders'
import './Home.css'

export function HomePage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const year = new Date().getFullYear()
  
  const todoGroups = useTodoGroups()
  const activeOrders = useActiveOrders()
  
  // 未完成订单（排除已终止状态）
  const incompleteOrders = activeOrders
    .filter(o => !isTerminated(o.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  
  // 统计
  const yearOrders = state.orders.filter(o => o.createdAt.startsWith(String(year)))
  const yearPaid = yearOrders.reduce((s, o) => s + o.paidAmount, 0)
  
  const refundCount = activeOrders.filter(o => 
    o.status === '流团待退款' || o.status === '部分退款'
  ).length

  return (
    <div className="home">
      <div className="home__greeting">苏茜周边拼团账本</div>
      <div className="home__sub">{year}年 · 共 {state.orders.length} 笔记录</div>

      {/* 统计卡片 */}
      <div className="home__overview">
        <div className="home__stat">
          <div className="home__stat-value home__stat-value--warn">{activeOrders.length}</div>
          <div className="home__stat-label">未完成</div>
        </div>
        <div className="home__stat">
          <div className="home__stat-value home__stat-value--danger">{refundCount}</div>
          <div className="home__stat-label">待退款</div>
        </div>
        <div className="home__stat">
          <div className="home__stat-value">¥{formatMoney(yearPaid)}</div>
          <div className="home__stat-label">今年已付</div>
        </div>
      </div>

      {/* 待办列表 */}
      {todoGroups.length === 0 && incompleteOrders.length === 0 && (
        <div className="home__empty">🎉 暂无待办，一切顺利！</div>
      )}

      {todoGroups.map(g => (
        <div className="home__section" key={g.label}>
          <div className="home__section-title">
            {g.icon} {g.label} ({g.orders.length})
          </div>
          {g.orders.map(o => (
            <OrderCard 
              key={o.id} 
              order={o} 
              onClick={id => navigate(`/detail/${id}`)} 
            />
          ))}
        </div>
      ))}

      {/* 未完成记录列表 */}
      {incompleteOrders.length > 0 && (
        <div className="home__section">
          <div className="home__section-title">
            📝 未完成记录 ({incompleteOrders.length})
          </div>
          {incompleteOrders.map(o => (
            <OrderCard 
              key={o.id} 
              order={o} 
              onClick={id => navigate(`/detail/${id}`)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
